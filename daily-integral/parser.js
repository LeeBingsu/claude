/*
 * parser.js - 사용자가 입력한 수식을 파싱/평가/LaTeX 변환하는 작은 엔진.
 * 외부 의존성 없음. 브라우저(file:// 포함)와 node 양쪽에서 동작한다.
 */
(function (root, factory) {
  var api = factory();
  root.MathExpr = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // ---------------------------------------------------------------- 토큰화

  // 여러 글자 이름은 긴 것부터 맞춰야 arcsin 이 a*r*c*... 로 쪼개지지 않는다.
  var NAMES = [
    'arcsinh', 'arccosh', 'arctanh', 'arcsin', 'arccos', 'arctan',
    'asinh', 'acosh', 'atanh', 'asin', 'acos', 'atan',
    'sinh', 'cosh', 'tanh', 'sech', 'csch', 'coth',
    'sqrt', 'cbrt', 'abs', 'sgn', 'exp',
    'sin', 'cos', 'tan', 'sec', 'csc', 'cot',
    'log10', 'log2', 'log', 'ln', 'lg',
    'pi', 'tau', 'e', 'x'
  ];

  var FUNCS = {
    sin: Math.sin, cos: Math.cos, tan: Math.tan,
    sec: function (v) { return 1 / Math.cos(v); },
    csc: function (v) { return 1 / Math.sin(v); },
    cot: function (v) { return 1 / Math.tan(v); },
    asin: Math.asin, acos: Math.acos, atan: Math.atan,
    arcsin: Math.asin, arccos: Math.acos, arctan: Math.atan,
    sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
    sech: function (v) { return 1 / Math.cosh(v); },
    csch: function (v) { return 1 / Math.sinh(v); },
    coth: function (v) { return 1 / Math.tanh(v); },
    asinh: Math.asinh, acosh: Math.acosh, atanh: Math.atanh,
    arcsinh: Math.asinh, arccosh: Math.acosh, arctanh: Math.atanh,
    ln: Math.log, log: Math.log, lg: Math.log10, log10: Math.log10,
    log2: Math.log2, exp: Math.exp, sqrt: Math.sqrt, cbrt: Math.cbrt,
    abs: Math.abs, sgn: Math.sign
  };

  var CONSTS = { pi: Math.PI, tau: 2 * Math.PI, e: Math.E };

  var OPEN = { '(': ')', '[': ']', '{': '}' };

  function isDigit(ch) { return ch >= '0' && ch <= '9'; }
  function isAlpha(ch) { return /[A-Za-z]/.test(ch); }

  // 예쁘게 보이는 기호들을 파서가 읽는 ASCII 로 되돌린다.
  var SUP_TO_ASCII = {
    '\u2070': '0', '\u00b9': '1', '\u00b2': '2', '\u00b3': '3', '\u2074': '4',
    '\u2075': '5', '\u2076': '6', '\u2077': '7', '\u2078': '8', '\u2079': '9',
    '\u207b': '-', '\u207a': '+', '\u207d': '(', '\u207e': ')',
    '\u207f': 'n', '\u02e3': 'x'
  };
  var SUP_RE = /[\u2070\u00b9\u00b2\u00b3\u2074-\u2079\u207a\u207b\u207d\u207e\u207f\u02e3]+/g;

  var VULGAR = {
    '\u00bd': '(1/2)', '\u2153': '(1/3)', '\u2154': '(2/3)', '\u00bc': '(1/4)',
    '\u00be': '(3/4)', '\u2155': '(1/5)', '\u2159': '(1/6)', '\u215b': '(1/8)'
  };

  function normalize(src) {
    return String(src)
      // x² -> x^(2), x⁻³ -> x^(-3)
      .replace(SUP_RE, function (run) {
        var out = '';
        for (var i = 0; i < run.length; i++) out += SUP_TO_ASCII[run[i]];
        return '^(' + out + ')';
      })
      .replace(/[\u00bd\u2153\u2154\u00bc\u00be\u2155\u2159\u215b]/g, function (ch) { return VULGAR[ch]; })
      .replace(/−/g, '-')            // 유니코드 마이너스
      .replace(/[×⋅•·]/g, '*')       // 곱셈 점
      .replace(/[÷⁄∕]/g, '/')
      .replace(/π/g, 'pi')
      .replace(/∛/g, 'cbrt')
      .replace(/√/g, 'sqrt')
      .replace(/\*\*/g, '^')
      .replace(/\\left|\\right/g, '')
      .replace(/\\cdot|\\times/g, '*')
      .replace(/\\/g, '');                // \sin -> sin
  }

  function tokenize(src) {
    var s = normalize(src);
    var out = [];
    var i = 0;
    while (i < s.length) {
      var ch = s[i];
      if (ch === ' ' || ch === '\t' || ch === '\n') { i++; continue; }
      if (isDigit(ch) || (ch === '.' && isDigit(s[i + 1]))) {
        var j = i;
        while (j < s.length && (isDigit(s[j]) || s[j] === '.')) j++;
        out.push({ t: 'num', v: parseFloat(s.slice(i, j)), pos: i });
        i = j;
        continue;
      }
      if (isAlpha(ch)) {
        var matched = null;
        for (var k = 0; k < NAMES.length; k++) {
          var name = NAMES[k];
          if (s.substr(i, name.length) === name) {
            // 뒤에 알파벳이 더 붙으면 다른 이름의 앞부분일 수 있으니 계속 본다.
            var next = s[i + name.length];
            if (!(next && isAlpha(next) && NAMES.some(function (n) {
              return n.length > name.length && s.substr(i, n.length) === n;
            }))) { matched = name; break; }
          }
        }
        if (!matched) matched = ch;           // C 같은 미지의 한 글자 -> 상수 취급
        out.push({ t: 'name', v: matched, pos: i });
        i += matched.length;
        continue;
      }
      if ('+-*/^'.indexOf(ch) >= 0) { out.push({ t: 'op', v: ch, pos: i }); i++; continue; }
      if (ch in OPEN) { out.push({ t: 'open', v: ch, pos: i }); i++; continue; }
      if (ch === ')' || ch === ']' || ch === '}') { out.push({ t: 'close', v: ch, pos: i }); i++; continue; }
      if (ch === '|') { out.push({ t: 'bar', v: '|', pos: i }); i++; continue; }
      if (ch === ',') { out.push({ t: 'comma', v: ',', pos: i }); i++; continue; }
      throw new Error("알 수 없는 문자 '" + ch + "'");
    }
    return out;
  }

  // ------------------------------------------------------------------ 파싱
  // expr  := term (('+'|'-') term)*
  // term  := unary ( ('*'|'/') unary | unary )*        <- 암시적 곱 포함
  // unary := ('-'|'+') unary | power
  // power := atom ('^' unary)?                          <- 우결합
  // atom  := num | const | var | func[^p] arg | (expr) | |expr|

  function Parser(tokens, src) {
    this.tk = tokens;
    this.i = 0;
    this.src = src;
    this.barDepth = 0;
  }

  Parser.prototype.peek = function () { return this.tk[this.i]; };
  Parser.prototype.next = function () { return this.tk[this.i++]; };

  Parser.prototype.expectClose = function (open) {
    var tok = this.peek();
    if (!tok || tok.t !== 'close' || tok.v !== OPEN[open]) {
      throw new Error("괄호 '" + OPEN[open] + "' 가 닫히지 않았습니다");
    }
    this.i++;
  };

  Parser.prototype.parseExpr = function () {
    var node = this.parseTerm();
    for (;;) {
      var tok = this.peek();
      if (tok && tok.t === 'op' && (tok.v === '+' || tok.v === '-')) {
        this.i++;
        node = { k: 'bin', op: tok.v, a: node, b: this.parseTerm() };
      } else break;
    }
    return node;
  };

  Parser.prototype.startsAtom = function (tok) {
    if (!tok) return false;
    if (tok.t === 'num' || tok.t === 'name' || tok.t === 'open') return true;
    if (tok.t === 'bar') return this.barDepth === 0;   // 열려 있는 |...| 는 닫아야 한다
    return false;
  };

  Parser.prototype.parseTerm = function () {
    var node = this.parseUnary();
    for (;;) {
      var tok = this.peek();
      if (tok && tok.t === 'op' && (tok.v === '*' || tok.v === '/')) {
        this.i++;
        node = { k: 'bin', op: tok.v, a: node, b: this.parseUnary() };
      } else if (this.startsAtom(tok)) {
        node = { k: 'bin', op: '*', a: node, b: this.parseUnary(), implicit: true };
      } else break;
    }
    return node;
  };

  Parser.prototype.parseUnary = function () {
    var tok = this.peek();
    if (tok && tok.t === 'op' && (tok.v === '-' || tok.v === '+')) {
      this.i++;
      var operand = this.parseUnary();
      return tok.v === '-' ? { k: 'neg', a: operand } : operand;
    }
    return this.parsePower();
  };

  Parser.prototype.parsePower = function () {
    var base = this.parseAtom();
    var tok = this.peek();
    if (tok && tok.t === 'op' && tok.v === '^') {
      this.i++;
      return { k: 'bin', op: '^', a: base, b: this.parseUnary() };
    }
    return base;
  };

  Parser.prototype.parseAtom = function () {
    var tok = this.next();
    if (!tok) throw new Error('수식이 도중에 끊겼습니다');

    if (tok.t === 'num') return { k: 'num', v: tok.v };

    if (tok.t === 'open') {
      var inner = this.parseExpr();
      this.expectClose(tok.v);
      return { k: 'paren', a: inner };
    }

    if (tok.t === 'bar') {
      this.barDepth++;
      var e = this.parseExpr();
      this.barDepth--;
      var close = this.next();
      if (!close || close.t !== 'bar') throw new Error("절댓값 기호 '|' 가 닫히지 않았습니다");
      return { k: 'call', fn: 'abs', a: e };
    }

    if (tok.t === 'name') {
      var name = tok.v;
      if (FUNCS[name]) {
        // sin^2(x) 처럼 함수 뒤에 지수가 오는 표기 지원
        var expo = null;
        var nx = this.peek();
        if (nx && nx.t === 'op' && nx.v === '^') {
          this.i++;
          expo = this.parseAtomForExponent();
        }
        var arg;
        var after = this.peek();
        if (after && after.t === 'open') {
          this.i++;
          arg = this.parseExpr();
          this.expectClose(after.v);
          arg = { k: 'paren', a: arg };
        } else {
          arg = this.parsePower();          // sin x, ln x 처럼 괄호 없는 표기
        }
        var call = { k: 'call', fn: name, a: arg };
        return expo ? { k: 'bin', op: '^', a: call, b: expo, fnPow: true } : call;
      }
      if (CONSTS[name] !== undefined) return { k: 'const', name: name, v: CONSTS[name] };
      if (name === 'x') return { k: 'var' };
      return { k: 'free', name: name };     // +C 등 임의 상수
    }

    throw new Error("예상하지 못한 기호 '" + tok.v + "'");
  };

  Parser.prototype.parseAtomForExponent = function () {
    var tok = this.peek();
    if (tok && tok.t === 'op' && tok.v === '-') { this.i++; return { k: 'neg', a: this.parseAtomForExponent() }; }
    return this.parseAtom();
  };

  function parse(src) {
    if (src === null || src === undefined || String(src).trim() === '') {
      throw new Error('수식이 비어 있습니다');
    }
    var p = new Parser(tokenize(src), src);
    var node = p.parseExpr();
    if (p.i < p.tk.length) {
      throw new Error("'" + p.tk[p.i].v + "' 부근을 해석할 수 없습니다");
    }
    return node;
  }

  // ------------------------------------------------------------------ 평가

  function evalNode(n, x, freeVal) {
    switch (n.k) {
      case 'num': return n.v;
      case 'const': return n.v;
      case 'var': return x;
      case 'free': return freeVal;                 // 적분상수는 0 으로 두고 비교한다
      case 'paren': return evalNode(n.a, x, freeVal);
      case 'neg': return -evalNode(n.a, x, freeVal);
      case 'call': {
        var v = evalNode(n.a, x, freeVal);
        return FUNCS[n.fn](v);
      }
      case 'bin': {
        var a = evalNode(n.a, x, freeVal);
        var b = evalNode(n.b, x, freeVal);
        switch (n.op) {
          case '+': return a + b;
          case '-': return a - b;
          case '*': return a * b;
          case '/': return a / b;
          case '^':
            // (-8)^(1/3) 같은 실수 세제곱근을 허용
            if (a < 0 && !Number.isInteger(b)) {
              var inv = 1 / b;
              if (Math.abs(inv - Math.round(inv)) < 1e-9 && Math.round(inv) % 2 !== 0) {
                return -Math.pow(-a, b);
              }
            }
            return Math.pow(a, b);
        }
        break;
      }
    }
    throw new Error('평가할 수 없는 노드');
  }

  function compile(src) {
    var ast = typeof src === 'string' ? parse(src) : src;
    var fn = function (x, freeVal) { return evalNode(ast, x, freeVal === undefined ? 0 : freeVal); };
    fn.ast = ast;
    return fn;
  }

  function usesVar(n) {
    if (!n || typeof n !== 'object') return false;
    if (n.k === 'var') return true;
    return usesVar(n.a) || usesVar(n.b);
  }

  function usesFree(n) {
    if (!n || typeof n !== 'object') return false;
    if (n.k === 'free') return true;
    return usesFree(n.a) || usesFree(n.b);
  }

  // --------------------------------------------------------------- LaTeX 변환

  var LATEX_FN = {
    ln: '\\ln', log: '\\ln', lg: '\\log', log10: '\\log_{10}', log2: '\\log_{2}',
    exp: '\\exp', sin: '\\sin', cos: '\\cos', tan: '\\tan', sec: '\\sec',
    csc: '\\csc', cot: '\\cot', sinh: '\\sinh', cosh: '\\cosh', tanh: '\\tanh',
    asin: '\\arcsin', acos: '\\arccos', atan: '\\arctan',
    arcsin: '\\arcsin', arccos: '\\arccos', arctan: '\\arctan',
    sech: '\\operatorname{sech}', csch: '\\operatorname{csch}', coth: '\\coth',
    asinh: '\\operatorname{arsinh}', acosh: '\\operatorname{arcosh}', atanh: '\\operatorname{artanh}',
    arcsinh: '\\operatorname{arsinh}', arccosh: '\\operatorname{arcosh}', arctanh: '\\operatorname{artanh}',
    sgn: '\\operatorname{sgn}'
  };

  function prec(n) {
    if (n.k === 'paren') return prec(n.a);
    if (n.k === 'bin') {
      if (n.op === '+' || n.op === '-') return 1;
      if (n.op === '*') return 2;
      if (n.op === '/') return 2;
      if (n.op === '^') return 4;
    }
    if (n.k === 'neg') return 1.5;
    return 5;
  }

  // 자체적으로 구분 기호를 갖는 함수 (지수를 그냥 붙여도 안전하다)
  var SELF_DELIMITED = { sqrt: 1, cbrt: 1, abs: 1, exp: 1 };
  // \sin^{2}x 처럼 연산자 위에 지수를 얹는 것이 관례인 함수
  var OPERATOR_POW = {
    sin: 1, cos: 1, tan: 1, sec: 1, csc: 1, cot: 1,
    sinh: 1, cosh: 1, tanh: 1, sech: 1, csch: 1, coth: 1
  };

  var LATEX_OPTS = {};

  function wrap(child, minPrec) {
    var s = toLatex(child);
    return prec(child) < minPrec ? '\\left(' + s + '\\right)' : s;
  }

  // sin x, ln x 처럼 인자가 단순하면 괄호를 생략해 읽기 좋게 만든다
  function isSimpleArg(n) {
    while (n && n.k === 'paren') n = n.a;
    return !!n && (n.k === 'var' || n.k === 'const' || n.k === 'num');
  }

  function fmtNum(v) {
    var s = String(Math.round(v * 1e10) / 1e10);
    return s;
  }

  function toLatex(n) {
    switch (n.k) {
      case 'num': return fmtNum(n.v);
      case 'var': return 'x';
      case 'const': return n.name === 'pi' ? '\\pi' : n.name === 'tau' ? '\\tau' : 'e';
      case 'free': return n.name;
      case 'paren': return toLatex(n.a);
      case 'neg': return '-' + wrap(n.a, 1.5);
      case 'call': {
        if (n.fn === 'sqrt') return '\\sqrt{' + toLatex(n.a) + '}';
        if (n.fn === 'cbrt') return '\\sqrt[3]{' + toLatex(n.a) + '}';
        if (n.fn === 'abs') return '\\left|' + toLatex(n.a) + '\\right|';
        if (n.fn === 'exp') return 'e^{' + toLatex(n.a) + '}';
        var head = LATEX_FN[n.fn] || '\\operatorname{' + n.fn + '}';
        if ((n.fn === 'ln' || n.fn === 'log') && LATEX_OPTS.lnAbs) {
          return head + '\\left|' + toLatex(n.a) + '\\right|';
        }
        if (isSimpleArg(n.a)) return head + ' ' + toLatex(n.a);
        return head + '\\left(' + toLatex(n.a) + '\\right)';
      }
      case 'bin': {
        if (n.op === '/') {
          return '\\frac{' + toLatex(n.a) + '}{' + toLatex(n.b) + '}';
        }
        if (n.op === '^') {
          // sec(x)^2 는 \sec x^{2} (= sec(x^2)) 로 읽히면 안 된다.
          var base = n.a;
          while (base.k === 'paren') base = base.a;
          if (base.k === 'call' && !SELF_DELIMITED[base.fn]) {
            var head = LATEX_FN[base.fn] || '\\operatorname{' + base.fn + '}';
            var arg = isSimpleArg(base.a)
              ? ' ' + toLatex(base.a)
              : '\\left(' + toLatex(base.a) + '\\right)';
            // 삼각·쌍곡선은 \sin^{2}x, 나머지는 (\ln x)^{2} 가 관례다
            return OPERATOR_POW[base.fn]
              ? head + '^{' + toLatex(n.b) + '}' + arg
              : '\\left(' + head + arg + '\\right)^{' + toLatex(n.b) + '}';
          }
          return wrap(n.a, 5) + '^{' + toLatex(n.b) + '}';
        }
        if (n.op === '*') {
          // -3e^{2x} 를 (-3)e^{2x} 로 쓰지 않도록 앞의 음수는 그대로 붙인다
          var left = n.a.k === 'neg' ? '-' + wrap(n.a.a, 2) : wrap(n.a, 2);
          var right = wrap(n.b, 2);
          // 3*x 는 3x 로, 3*2 처럼 숫자끼리일 때만 곱셈 점을 찍는다
          var glue = /^[0-9.]/.test(right) ? ' \\cdot ' : ' ';
          return left + glue + right;
        }
        return wrap(n.a, 1) + ' ' + n.op + ' ' + wrap(n.b, 1);
      }
    }
    return '';
  }

  // --------------------------------------------------------------- 수치 비교

  // 두 부정적분이 "상수 차이"만 나는지 확인한다.
  function sampleDiff(f, g, domain, count) {
    var lo = domain[0], hi = domain[1];
    var n = count || 9;
    var diffs = [], scale = 1, used = 0;
    for (var i = 0; i < n; i++) {
      // 균등 분할 + 약간의 오프셋(특이점 정면 충돌 회피)
      var t = (i + 0.5 + 0.17 * Math.sin(i * 2.3)) / n;
      var x = lo + (hi - lo) * Math.min(0.995, Math.max(0.005, t));
      var a, b;
      try { a = f(x); b = g(x); } catch (err) { continue; }
      if (!isFinite(a) || !isFinite(b)) continue;
      diffs.push(a - b);
      scale = Math.max(scale, Math.abs(b));
      used++;
    }
    return { diffs: diffs, scale: scale, used: used };
  }

  // 수치 미분(5점 중심차분)
  function derivative(f, x, h) {
    h = h || 1e-4;
    return (f(x - 2 * h) - 8 * f(x - h) + 8 * f(x + h) - f(x + 2 * h)) / (12 * h);
  }

  /**
   * 사용자의 답이 기준 부정적분과 상수 차이로 일치하는지 검사.
   * @returns {{ok:boolean, reason?:string, detail?:string}}
   */
  function compareAntiderivative(userSrc, refSrc, domain, integrandSrc) {
    var userFn, refFn, ast;
    try {
      ast = parse(userSrc);
      userFn = compile(ast);
    } catch (err) {
      return { ok: false, reason: 'parse', detail: err.message };
    }
    if (!usesVar(ast)) {
      return { ok: false, reason: 'novar', detail: '답에 x 가 들어 있지 않습니다.' };
    }
    refFn = compile(refSrc);

    var res = sampleDiff(userFn, refFn, domain, 11);
    if (res.used < 4) {
      return { ok: false, reason: 'domain', detail: '주어진 구간에서 값을 계산할 수 없습니다. 정의역을 확인해 보세요.' };
    }
    var mean = res.diffs.reduce(function (s, d) { return s + d; }, 0) / res.diffs.length;
    var worst = 0;
    res.diffs.forEach(function (d) { worst = Math.max(worst, Math.abs(d - mean)); });
    // 두 식이 대수적으로 같으면 오차는 부동소수점 수준(~1e-15)에 머문다.
    // 아래 허용치는 그보다 넉넉하면서, 계수가 조금 다른 오답은 걸러낼 만큼 좁다.
    var tol = 1e-7 * Math.max(1, res.scale) + 1e-9;
    if (worst <= tol) return { ok: true };

    // 적분상수만 틀린 게 아니라 정말 다른 함수인 경우: 도함수도 확인해 힌트를 준다
    var hint = null;
    if (integrandSrc) {
      try {
        var integ = compile(integrandSrc);
        var mid = (domain[0] + domain[1]) / 2;
        var dU = derivative(userFn, mid);
        var target = integ(mid);
        if (isFinite(dU) && isFinite(target)) {
          var ratio = dU / target;
          if (isFinite(ratio) && Math.abs(ratio - Math.round(ratio * 12) / 12) < 1e-3 &&
              Math.abs(ratio - 1) > 1e-3 && Math.abs(ratio) > 1e-3) {
            hint = '미분해 보면 피적분함수의 ' + (Math.round(ratio * 100) / 100) + '배가 됩니다. 계수를 다시 확인해 보세요.';
          }
        }
      } catch (e) { /* 힌트는 실패해도 무시 */ }
    }
    return { ok: false, reason: 'wrong', detail: hint };
  }

  return {
    parse: parse,
    compile: compile,
    toLatex: toLatex,
    tokenize: tokenize,
    usesVar: usesVar,
    usesFree: usesFree,
    derivative: derivative,
    compareAntiderivative: compareAntiderivative,
    latexOf: function (src, opts) {
      LATEX_OPTS = opts || {};
      try { return toLatex(parse(src)); } finally { LATEX_OPTS = {}; }
    }
  };
});
