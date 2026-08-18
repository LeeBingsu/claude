/*
 * generate.js - 문제 은행 생성기.
 *
 *   node generate.js        problems.js 를 다시 만든다
 *
 * 문제는 손으로 500개를 쓰는 대신 "families"(매개변수화된 유형)에서 뽑아낸다.
 * 생성된 모든 문항은 마지막에 기준 부정적분을 수치 미분해 피적분함수와
 * 일치하는지 검사하므로, 템플릿이 틀리면 파일이 만들어지지 않는다.
 */
'use strict';

var fs = require('fs');
var M = require('./parser.js');

// ------------------------------------------------------------------ 헬퍼

function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a || 1; }
function red(n, d) { if (d < 0) { n = -n; d = -d; } var g = gcd(n, d); return [n / g, d / g]; }

// (n/d)·body 를 파서가 읽을 수 있는 ASCII 로
function C(n, d, body) {
  var r = red(n, d); n = r[0]; d = r[1];
  if (n === 0) return '0';
  if (body === undefined || body === '1') return d === 1 ? String(n) : '(' + n + '/' + d + ')';
  if (body.indexOf('1/') === 0) {                 // 5*1/x 대신 5/x 로
    var rest = body.slice(2);
    if (d === 1) return n === 1 ? body : n + '/' + rest;
    return '(' + n + ')/(' + d + '*' + rest + ')';
  }
  if (d === 1) return n === 1 ? body : n === -1 ? '-' + body : n + '*' + body;
  return '(' + n + '/' + d + ')*' + body;
}

// 계수를 앞에 붙인 변수 표기: K(2) -> '2x', K(1) -> 'x', K(-1) -> '-x'
function K(k, v) { v = v || 'x'; return k === 1 ? v : k === -1 ? '-' + v : k + v; }

// 항들을 더한다. '+ -' 는 '-' 로 정리한다.
function S() {
  var terms = [].slice.call(arguments).filter(function (t) { return t && t !== '0'; });
  return terms.join(' + ').replace(/\+ -/g, '- ');
}

// 자주 쓰는 표본 구간
var D = {
  poly:  [0.3, 2.4],
  pos:   [0.35, 2.6],       // x>0 (로그, 분수 거듭제곱)
  all:   [-1.5, 1.7],
  trig:  [0.25, 1.15],      // tan/sec 의 극점 회피
  trigW: [0.25, 2.85],      // sin/cos 전용
  unit:  [-0.72, 0.72],     // arcsin, sqrt(1-x^2)
  gt1:   [1.35, 3.4],       // arcosh, sqrt(x^2-1)
  lnln:  [1.4, 4.2],
  hyp:   [0.25, 1.6],
  hypP:  [0.35, 2.0]
};

// tan/sec 는 x=pi/(2k), cot/csc 는 x=0 과 pi/k 에 극점이 있다.
// 계수 k 에 맞춰 구간을 좁혀 한 가지(branch) 안에 머물게 한다.
// LaTeX 조립: 계수 1 은 생략, 분모 1 은 분수로 쓰지 않는다
function KL(k, tex) { return k === 1 ? tex : k === -1 ? '-' + tex : k + tex; }
function KC(k) { return k === 1 ? '' : k === -1 ? '-' : String(k); }   // 계수만 (뒤에 LaTeX 명령이 붙는 자리)
function FR(num, den) {
  if (den === 1) return num === '1' ? '' : num;      // 계수 1 은 아예 쓰지 않는다
  if (den === -1) return '-' + num;
  return '\\dfrac{' + num + '}{' + den + '}';
}

// sqrt(n/d) 를 가능한 한 간단히 (sqrt(16) -> 4, sqrt(2/8) -> 1/2)
function isSq(n) { var r = Math.round(Math.sqrt(n)); return r * r === n ? r : 0; }
function SQ(n, d) {
  var r = red(n, d === undefined ? 1 : d); n = r[0]; d = r[1];
  var sn = isSq(n), sd = isSq(d);
  if (sn && sd) return C(sn, sd);
  return d === 1 ? 'sqrt(' + n + ')' : 'sqrt(' + n + '/' + d + ')';
}

// a=1 이면 'x/1' 대신 그냥 'x' 를 쓴다
function X(a) { return a === 1 ? 'x' : 'x/' + a; }
function XL(a) { return a === 1 ? 'x' : '\\dfrac{x}{' + a + '}'; }

function dTrig(k) { return [0.25 / k, 1.15 / k]; }
function dCot(k)  { return [0.5 / k, 2.3 / k]; }

// ---- 표기 정리 --------------------------------------------------------
// 계수·분모가 1 인 자리를 지운다. 템플릿마다 처리하는 대신 한곳에서 정리한다.
function tidyAscii(t) {
  return t
    .replace(/\/1(?![0-9.])/g, '')            // (x+1)/1 -> (x+1)
    .replace(/(?<![0-9.])1(?=[a-zA-Z(])/g, '');  // 1x^2 -> x^2, 1sin(x) -> sin(x)
}

// \dfrac{...}{1} 을 중괄호 짝을 세어 정확히 벗겨낸다
function stripDenomOne(tex) {
  ['\\dfrac{', '\\frac{'].forEach(function (head) {
    for (;;) {
      var i = tex.indexOf(head);
      var found = false;
      while (i >= 0) {
        var j = i + head.length, depth = 1;
        while (j < tex.length && depth > 0) {
          if (tex[j] === '{') depth++;
          else if (tex[j] === '}') depth--;
          j++;
        }
        if (tex.slice(j, j + 3) === '{1}') {
          tex = tex.slice(0, i) + tex.slice(i + head.length, j - 1) + tex.slice(j + 3);
          found = true;
          break;
        }
        i = tex.indexOf(head, i + 1);
      }
      if (!found) break;
    }
  });
  return tex;
}

function tidyTex(t) {
  return stripDenomOne(t)
    .replace(/--/g, '+')                          // -(-2) 를 + 로
    .replace(/\+\s*\+/g, '+');
}

var out = [];
var seen = Object.create(null);

function add(level, topic, integrand, answer, o) {
  o = o || {};
  integrand = tidyAscii(integrand.replace(/\^1(?![0-9])/g, ''));
  answer = tidyAscii(answer.replace(/\^1(?![0-9])/g, ''));
  var key = integrand.replace(/\s+/g, '');
  if (seen[key]) return;
  seen[key] = true;
  out.push({
    level: level,
    topic: topic,
    integrand: integrand,
    latex: tidyTex(o.latex || M.latexOf(integrand)),
    answer: answer,
    answerLatex: tidyTex((o.answerLatex || M.latexOf(answer, { lnAbs: o.lnAbs })) + '+C'),
    domain: o.domain || D.poly,
    hints: (o.hints || []).map(tidyTex),
    steps: (o.steps || []).map(tidyTex)
  });
}

// ================================================================== 쉬움

// 거듭제곱 법칙 (단항)
[2, 3, -4, 7].forEach(function (a) {
  [2, 3, 4, 5].forEach(function (n) {
    add('easy', '거듭제곱 법칙', K(a, 'x^' + n), C(a, n + 1, 'x^' + (n + 1)), {
      hints: ['$\\int x^{n}dx=\\dfrac{x^{n+1}}{n+1}$ 을 그대로 쓴다.',
              '지수를 $' + (n + 1) + '$ 로 올리고 그 값으로 나눈다.'],
      steps: ['$\\int ' + K(a, 'x^{' + n + '}') + 'dx = ' + KC(a) + '\\cdot\\dfrac{x^{' + (n + 1) + '}}{' + (n + 1) + '}$',
              '$= ' + M.latexOf(C(a, n + 1, 'x^' + (n + 1))) + '$']
    });
  });
});

// 다항식
[[3, 2, -4, 1, 5], [2, 3, 5, 1, -3], [6, 2, -2, 1, 7], [4, 3, 3, 2, -1],
 [5, 4, -6, 2, 2], [1, 5, 4, 3, -8], [3, 3, -5, 2, 6], [8, 2, -3, 1, 1],
 [7, 3, -4, 4, 3], [3, 4, -2, 2, 5]
].forEach(function (p) {
  var a = p[0], n = p[1], b = p[2], m = p[3], c = p[4];
  var integ = S(K(a, 'x^' + n), K(b, 'x^' + m), String(c));
  var ans = S(C(a, n + 1, 'x^' + (n + 1)), C(b, m + 1, 'x^' + (m + 1)), C(c, 1, 'x'));
  add('easy', '다항함수', integ, ans, {
    hints: ['각 항을 따로 적분한 뒤 더한다.', '상수항 $' + c + '$ 의 적분은 $' + c + 'x$ 다.'],
    steps: ['$\\int ' + M.latexOf(K(a, 'x^' + n)) + 'dx = ' + M.latexOf(C(a, n + 1, 'x^' + (n + 1))) + '$',
            '$\\int ' + M.latexOf(K(b, 'x^' + m)) + 'dx = ' + M.latexOf(C(b, m + 1, 'x^' + (m + 1))) + '$',
            '$\\int ' + c + '\\,dx = ' + c + 'x$']
  });
});

// 음의 지수
[1, 3, 6, -2].forEach(function (a) {
  [2, 3, 4].forEach(function (n) {
    add('easy', '거듭제곱 법칙', C(a, 1, '1/x^' + n), C(a, 1 - n, '1/x^' + (n - 1)), {
      domain: D.pos,
      hints: ['$x^{-' + n + '}$ 으로 고쳐 쓴다.', '지수 $-' + n + '$ 에 $1$ 을 더하면 $' + (1 - n) + '$ 이다.'],
      steps: ['$\\dfrac{' + a + '}{x^{' + n + '}} = ' + a + 'x^{-' + n + '}$',
              '$\\int ' + a + 'x^{-' + n + '}dx = ' + M.latexOf(C(a, 1 - n, '1/x^' + (n - 1))) + '$']
  });
  });
});

// 1/x 형태
[1, 2, 3, 5, 7, -4].forEach(function (a) {
  add('easy', '로그', C(a, 1, '1/x'), C(a, 1, 'ln(x)'), {
    domain: D.pos, lnAbs: true,
    hints: ['$\\int\\dfrac{1}{x}dx$ 는 거듭제곱 법칙의 예외다.', '상수 $' + a + '$ 는 적분 밖으로 뺀다.'],
    steps: ['$' + KC(a) + '\\int\\dfrac{1}{x}dx = ' + KC(a) + '\\ln|x|$']
  });
});

// 지수함수
[1, 2, -5].forEach(function (a) {
  [1, 2, 3, -2].forEach(function (k) {
    add('easy', '지수함수', C(a, 1, 'e^(' + K(k) + ')'), C(a, k, 'e^(' + K(k) + ')'), {
      domain: D.all,
      hints: ['$u=' + K(k) + '$ 로 두면 $du=' + KC(k) + '\\,dx$ 다.', '안쪽 $x$ 의 계수 $' + k + '$ 로 나눈다.'],
      steps: ['$u=' + K(k) + ',\\; du=' + KC(k) + '\\,dx$',
              '$\\dfrac{' + a + '}{' + k + '}\\int e^{u}du = ' + M.latexOf(C(a, k, 'e^(' + K(k) + ')')) + '$']
    });
  });
});

// 일반 밑의 지수함수
[2, 3, 5].forEach(function (b) {
  [1, 2].forEach(function (a) {
    add('easy', '지수함수', C(a, 1, b + '^x'), C(a, 1, b + '^x/ln(' + b + ')'), {
      domain: D.all,
      hints: ['$' + b + '^{x}=e^{x\\ln ' + b + '}$ 로 바꾼다.', '밑의 자연로그 $\\ln ' + b + '$ 로 나눈다.'],
      steps: ['$' + b + '^{x}=e^{x\\ln ' + b + '}$',
              '$\\int ' + b + '^{x}dx=\\dfrac{' + b + '^{x}}{\\ln ' + b + '}$']
    });
  });
});

// 사인 / 코사인
[1, 2, -4].forEach(function (a) {
  [1, 2, 3, 4].forEach(function (k) {
    add('easy', '삼각함수', C(a, 1, 'sin(' + K(k) + ')'), C(-a, k, 'cos(' + K(k) + ')'), {
      domain: D.trigW,
      hints: ['$\\int\\sin u\\,du=-\\cos u$ 다.', '안쪽 계수 $' + k + '$ 로 나눈다.'],
      steps: ['$u=' + K(k) + ',\\;du=' + KC(k) + '\\,dx$',
              '$= ' + M.latexOf(C(-a, k, 'cos(' + K(k) + ')')) + '$']
    });
    add('easy', '삼각함수', C(a, 1, 'cos(' + K(k) + ')'), C(a, k, 'sin(' + K(k) + ')'), {
      domain: D.trigW,
      hints: ['$\\int\\cos u\\,du=\\sin u$ 다.', '안쪽 계수 $' + k + '$ 로 나눈다.'],
      steps: ['$u=' + K(k) + ',\\;du=' + KC(k) + '\\,dx$',
              '$= ' + M.latexOf(C(a, k, 'sin(' + K(k) + ')')) + '$']
    });
  });
});

// 기본 삼각 적분표
[1, 2].forEach(function (k) {
  add('easy', '삼각함수', 'sec(' + K(k) + ')^2', C(1, k, 'tan(' + K(k) + ')'), {
    domain: dTrig(k),
    hints: ['$\\tan u$ 의 도함수가 $\\sec^{2}u$ 다.', '안쪽 계수 $' + k + '$ 로 나눈다.'],
    steps: ['$\\dfrac{d}{dx}\\tan ' + K(k) + ' = ' + KC(k) + '\\sec^{2}' + K(k) + '$']
  });
  add('easy', '삼각함수', 'csc(' + K(k) + ')^2', C(-1, k, 'cot(' + K(k) + ')'), {
    domain: dCot(k),
    hints: ['$\\cot u$ 의 도함수는 $-\\csc^{2}u$ 다.', '부호를 뒤집는다.'],
    steps: ['$\\dfrac{d}{dx}(-\\cot ' + K(k) + ') = ' + KC(k) + '\\csc^{2}' + K(k) + '$']
  });
  add('easy', '삼각함수', 'sec(' + K(k) + ')tan(' + K(k) + ')', C(1, k, 'sec(' + K(k) + ')'), {
    domain: dTrig(k),
    hints: ['$\\sec u$ 의 도함수를 그대로 떠올린다.', '치환이 필요 없다.'],
    steps: ['$\\dfrac{d}{dx}\\sec ' + K(k) + ' = ' + KC(k) + '\\sec ' + K(k) + '\\tan ' + K(k) + '$']
  });
  add('easy', '삼각함수', 'csc(' + K(k) + ')cot(' + K(k) + ')', C(-1, k, 'csc(' + K(k) + ')'), {
    domain: dCot(k),
    hints: ['$\\csc u$ 의 도함수는 $-\\csc u\\cot u$ 다.', '부호에 주의한다.'],
    steps: ['$\\dfrac{d}{dx}(-\\csc ' + K(k) + ') = ' + KC(k) + '\\csc ' + K(k) + '\\cot ' + K(k) + '$']
  });
});

// 1차식 치환
[2, 3].forEach(function (a) {
  [1, -1, 3].forEach(function (b) {
    [3, 4].forEach(function (n) {
      var u = '(' + K(a) + (b < 0 ? ' - ' + (-b) : ' + ' + b) + ')';
      add('easy', '치환(1차식)', u + '^' + n, C(1, a * (n + 1), u + '^' + (n + 1)), {
        domain: [0.2, 1.4],
        hints: ['전개하지 말고 $u=' + K(a) + (b < 0 ? b : '+' + b) + '$ 로 둔다.',
                '$du=' + KC(a) + '\\,dx$ 이므로 마지막에 $' + a + '$ 로 나눈다.'],
        steps: ['$u=' + K(a) + (b < 0 ? b : '+' + b) + ',\\;du=' + KC(a) + '\\,dx$',
                '$\\dfrac{1}{' + a + '}\\cdot\\dfrac{u^{' + (n + 1) + '}}{' + (n + 1) + '} = ' +
                M.latexOf(C(1, a * (n + 1), u + '^' + (n + 1))) + '$']
      });
    });
  });
});

// 1/(ax+b)
[2, 3].forEach(function (a) {
  [1, 3, -1].forEach(function (b) {
    var u = '(' + K(a) + (b < 0 ? ' - ' + (-b) : ' + ' + b) + ')';
    add('easy', '치환(1차식)', '1/' + u, C(1, a, 'ln' + u), {
      domain: [0.6, 2.6], lnAbs: true,
      hints: ['분모가 $1$ 차식이면 결과는 로그다.', '$du=' + KC(a) + '\\,dx$ 이므로 $' + a + '$ 로 나눈다.'],
      steps: ['$u=' + K(a) + (b < 0 ? b : '+' + b) + ',\\;du=' + KC(a) + '\\,dx$',
              '$\\dfrac{1}{' + a + '}\\int\\dfrac{du}{u} = ' + M.latexOf(C(1, a, 'ln' + u), { lnAbs: true }) + '$']
    });
  });
});

// 역삼각함수 기본형
[1, 3, 5].forEach(function (a) {
  add('easy', '역삼각함수', C(a, 1, '1/(1+x^2)'), C(a, 1, 'atan(x)'), {
    domain: D.all,
    hints: ['$\\arctan x$ 의 도함수 형태다.', '상수 $' + a + '$ 만 앞으로 뺀다.'],
    steps: ['$\\dfrac{d}{dx}\\arctan x=\\dfrac{1}{1+x^{2}}$']
  });
});
[1, 2, 4].forEach(function (a) {
  add('easy', '역삼각함수', C(a, 1, '1/sqrt(1-x^2)'), C(a, 1, 'asin(x)'), {
    domain: D.unit,
    hints: ['$\\arcsin x$ 의 도함수 형태다.', '적분표에 그대로 있는 꼴이다.'],
    steps: ['$\\dfrac{d}{dx}\\arcsin x=\\dfrac{1}{\\sqrt{1-x^{2}}}$']
  });
});

// 전개 후 적분
[[1, 3], [2, -1], [-2, 5], [3, 4], [1, -4], [4, -3]].forEach(function (p) {
  var a = p[0], b = p[1];
  var integ = '(x' + (a < 0 ? ' - ' + (-a) : ' + ' + a) + ')(x' + (b < 0 ? ' - ' + (-b) : ' + ' + b) + ')';
  var ans = S('x^3/3', C(a + b, 2, 'x^2'), C(a * b, 1, 'x'));
  add('easy', '전개 후 적분', integ, ans, {
    hints: ['먼저 곱을 전개한다.', '$x^{2}' + (a + b >= 0 ? '+' : '') + (a + b) + 'x' + (a * b >= 0 ? '+' : '') + (a * b) + '$ 를 적분한다.'],
    steps: ['$' + M.latexOf(integ) + ' = x^{2}' + (a + b >= 0 ? '+' : '') + (a + b) + 'x' + (a * b >= 0 ? '+' : '') + (a * b) + '$',
            '$\\int = ' + M.latexOf(ans) + '$']
  });
});

// 분수 지수
[1, 2, 3].forEach(function (a) {
  add('easy', '거듭제곱 법칙', C(a, 1, 'sqrt(x)'), C(2 * a, 3, 'x^(3/2)'), {
    domain: D.pos,
    hints: ['$\\sqrt{x}=x^{1/2}$ 로 바꾼다.', '지수에 $1$ 을 더하면 $3/2$ 다.'],
    steps: ['$\\sqrt{x}=x^{1/2}$', '$\\int x^{1/2}dx=\\dfrac{2}{3}x^{3/2}$']
  });
});
[[1, 3], [2, 3], [3, 2], [4, 3], [5, 2], [5, 3]].forEach(function (p) {
  var pn = p[0], q = p[1];
  add('easy', '거듭제곱 법칙', 'x^(' + pn + '/' + q + ')', C(q, pn + q, 'x^((' + (pn + q) + ')/' + q + ')'), {
    domain: D.pos,
    hints: ['지수 $\\dfrac{' + pn + '}{' + q + '}$ 에 $1$ 을 더하면 $\\dfrac{' + (pn + q) + '}{' + q + '}$ 다.',
            '분수 지수는 그 역수를 곱한다고 생각한다.'],
    steps: ['$\\int x^{' + pn + '/' + q + '}dx=\\dfrac{x^{' + (pn + q) + '/' + q + '}}{' + (pn + q) + '/' + q + '}$',
            '$= ' + M.latexOf(C(q, pn + q, 'x^((' + (pn + q) + ')/' + q + ')')) + '$']
  });
});

// 쌍곡선함수 기본
[1, 2].forEach(function (a) {
  [1, 2, 3].forEach(function (k) {
    add('easy', '쌍곡선함수', C(a, 1, 'sinh(' + K(k) + ')'), C(a, k, 'cosh(' + K(k) + ')'), {
      domain: D.hyp,
      hints: ['$\\sinh$ 를 적분하면 $\\cosh$ 다. 삼각함수와 달리 부호가 바뀌지 않는다.',
              '안쪽 계수 $' + k + '$ 로 나눈다.'],
      steps: ['$\\dfrac{d}{dx}\\cosh ' + K(k) + ' = ' + KC(k) + '\\sinh ' + K(k) + '$',
              '$= ' + M.latexOf(C(a, k, 'cosh(' + K(k) + ')')) + '$']
    });
    add('easy', '쌍곡선함수', C(a, 1, 'cosh(' + K(k) + ')'), C(a, k, 'sinh(' + K(k) + ')'), {
      domain: D.hyp,
      hints: ['$\\cosh$ 를 적분하면 $\\sinh$ 다.', '안쪽 계수 $' + k + '$ 로 나눈다.'],
      steps: ['$\\dfrac{d}{dx}\\sinh ' + K(k) + ' = ' + KC(k) + '\\cosh ' + K(k) + '$',
              '$= ' + M.latexOf(C(a, k, 'sinh(' + K(k) + ')')) + '$']
    });
  });
});
[1, 2, 3].forEach(function (k) {
  add('easy', '쌍곡선함수', 'sech(' + K(k) + ')^2', C(1, k, 'tanh(' + K(k) + ')'), {
    domain: D.hyp,
    hints: ['$\\tanh u$ 의 도함수가 $\\operatorname{sech}^{2}u$ 다.', '삼각함수의 $\\sec^{2}$ 와 같은 자리다.'],
    steps: ['$\\dfrac{d}{dx}\\tanh ' + K(k) + ' = ' + KC(k) + '\\operatorname{sech}^{2}' + K(k) + '$']
  });
  add('easy', '쌍곡선함수', 'csch(' + K(k) + ')^2', C(-1, k, 'coth(' + K(k) + ')'), {
    domain: D.hypP,
    hints: ['$\\coth u$ 의 도함수는 $-\\operatorname{csch}^{2}u$ 다.', '부호를 뒤집는다.'],
    steps: ['$\\dfrac{d}{dx}(-\\coth ' + K(k) + ') = ' + KC(k) + '\\operatorname{csch}^{2}' + K(k) + '$']
  });
});

// 삼각 항등식으로 차수 낮추기
[1, 2].forEach(function (k) {
  add('easy', '삼각항등식', 'tan(' + K(k) + ')^2', S(C(1, k, 'tan(' + K(k) + ')'), '-x'), {
    domain: dTrig(k),
    hints: ['$\\tan^{2}u=\\sec^{2}u-1$ 항등식을 쓴다.', '두 항 모두 기본 적분이다.'],
    steps: ['$\\tan^{2}' + K(k) + ' = \\sec^{2}' + K(k) + ' - 1$',
            '$\\int = ' + M.latexOf(S(C(1, k, 'tan(' + K(k) + ')'), '-x')) + '$']
  });
  add('easy', '삼각항등식', 'cot(' + K(k) + ')^2', S(C(-1, k, 'cot(' + K(k) + ')'), '-x'), {
    domain: dCot(k),
    hints: ['$\\cot^{2}u=\\csc^{2}u-1$ 을 쓴다.', '부호에 주의한다.'],
    steps: ['$\\cot^{2}' + K(k) + ' = \\csc^{2}' + K(k) + ' - 1$',
            '$\\int = ' + M.latexOf(S(C(-1, k, 'cot(' + K(k) + ')'), '-x')) + '$']
  });
});

// 항별로 쪼개기
[[1, 1], [2, 3], [3, -2], [-1, 4]].forEach(function (p) {
  var a = p[0], b = p[1];
  add('easy', '기본 적분', S(C(a, 1, 'e^x'), C(b, 1, '1/x')), S(C(a, 1, 'e^x'), C(b, 1, 'ln(x)')), {
    domain: D.pos, lnAbs: true,
    hints: ['두 항을 따로 적분한다.', '$e^{x}$ 는 적분해도 그대로다.'],
    steps: ['$\\int ' + M.latexOf(C(a, 1, 'e^x')) + 'dx = ' + M.latexOf(C(a, 1, 'e^x')) + '$',
            '$\\int ' + M.latexOf(C(b, 1, '1/x')) + 'dx = ' + M.latexOf(C(b, 1, 'ln(x)'), { lnAbs: true }) + '$']
  });
  add('easy', '기본 적분', '(' + K(a, 'x^2') + (b < 0 ? ' - ' + (-b) : ' + ' + b) + ')/x',
      S(C(a, 2, 'x^2'), C(b, 1, 'ln(x)')), {
    domain: D.pos, lnAbs: true,
    hints: ['분자를 분모로 각각 나눠 항을 분리한다.',
            '$' + M.latexOf(K(a, 'x')) + ' + \\dfrac{' + b + '}{x}$ 가 된다.'],
    steps: ['$\\dfrac{' + M.latexOf(K(a, 'x^2') + (b < 0 ? b : '+' + b)) + '}{x} = ' +
            M.latexOf(S(K(a, 'x'), C(b, 1, '1/x'))) + '$',
            '$\\int = ' + M.latexOf(S(C(a, 2, 'x^2'), C(b, 1, 'ln(x)')), { lnAbs: true }) + '$']
  });
});

// ================================================================== 보통

// u = x^n 치환
[1, 2, 3, -1].forEach(function (k) {
  add('medium', '치환적분', 'x*e^(' + K(k, 'x^2') + ')', C(1, 2 * k, 'e^(' + K(k, 'x^2') + ')'), {
    domain: [0.15, 1.3],
    hints: ['$u=' + K(k, 'x^{2}') + '$ 로 두면 $du=' + (2 * k) + 'x\\,dx$ 다.', '앞의 $x$ 가 $du$ 를 만들어 준다.'],
    steps: ['$u=' + K(k, 'x^{2}') + ',\\;du=' + (2 * k) + 'x\\,dx$',
            '$\\dfrac{1}{' + (2 * k) + '}\\int e^{u}du = ' + M.latexOf(C(1, 2 * k, 'e^(' + K(k, 'x^2') + ')')) + '$']
  });
});
[2, 3, 4].forEach(function (n) {
  add('medium', '치환적분', 'x^' + (n - 1) + '*e^(x^' + n + ')', C(1, n, 'e^(x^' + n + ')'), {
    domain: [0.15, 1.15],
    hints: ['$u=x^{' + n + '}$ 로 두면 $du=' + n + 'x^{' + (n - 1) + '}dx$ 다.', '분자가 $du$ 와 상수배로 맞는다.'],
    steps: ['$u=x^{' + n + '},\\;du=' + n + 'x^{' + (n - 1) + '}dx$',
            '$\\dfrac{1}{' + n + '}\\int e^{u}du = ' + M.latexOf(C(1, n, 'e^(x^' + n + ')')) + '$']
  });
});
[1, 2, 6].forEach(function (a) {
  [1, 3, 4, 9].forEach(function (b) {
    add('medium', '치환적분', C(a, 1, 'x/(x^2+' + b + ')'), C(a, 2, 'ln(x^2+' + b + ')'), {
      domain: [0.1, 2.6],
      hints: ['분모의 도함수가 $2x$ 다.', '$\\int\\dfrac{f\'}{f}dx=\\ln|f|$ 를 쓴다.'],
      steps: ['$u=x^{2}+' + b + ',\\;du=2x\\,dx$',
              '$= ' + M.latexOf(C(a, 2, 'ln(x^2+' + b + ')')) + '$']
    });
  });
});
[3, 4].forEach(function (n) {
  [1, 2].forEach(function (a) {
    add('medium', '치환적분', 'x^' + (n - 1) + '/(x^' + n + '+' + a + ')', C(1, n, 'ln(x^' + n + '+' + a + ')'), {
      domain: [0.1, 2.2],
      hints: ['$u=x^{' + n + '}+' + a + '$ 로 둔다.', '$du=' + n + 'x^{' + (n - 1) + '}dx$ 이므로 $' + n + '$ 로 나눈다.'],
      steps: ['$u=x^{' + n + '}+' + a + '$', '$\\dfrac{1}{' + n + '}\\int\\dfrac{du}{u} = ' +
              M.latexOf(C(1, n, 'ln(x^' + n + '+' + a + ')')) + '$']
    });
  });
});

// 부분적분 (다항식 × 초월함수)
[1, 2, 3, -1].forEach(function (k) {
  var byParts = C(1, k * k, '(' + K(k) + ' - 1)*e^(' + K(k) + ')');
  add('medium', '부분적분', 'x*e^(' + K(k) + ')', byParts, {
    domain: D.all,
    hints: ['$u=x,\\;dv=e^{' + K(k) + '}dx$ 로 둔다.', '$\\int u\\,dv=uv-\\int v\\,du$'],
    steps: ['$u=x,\\;v=' + FR('e^{' + K(k) + '}', k) + '$',
            '$' + FR('xe^{' + K(k) + '}', k) + '-' + FR('1', k) + '\\int e^{' + K(k) + '}dx$',
            '$= ' + M.latexOf(byParts) + '$']
  });
});
[1, 2, 3].forEach(function (k) {
  add('medium', '부분적분', 'x*sin(' + K(k) + ')', S(C(-1, k, 'x*cos(' + K(k) + ')'), C(1, k * k, 'sin(' + K(k) + ')')), {
    domain: D.trigW,
    hints: ['$u=x$ 로 두어 차수를 낮춘다.', '$v=' + M.latexOf(C(-1, k, 'cos(' + K(k) + ')')) + '$'],
    steps: ['$u=x,\\;dv=\\sin ' + K(k) + '\\,dx$',
            '$= ' + M.latexOf(S(C(-1, k, 'x*cos(' + K(k) + ')'), C(1, k * k, 'sin(' + K(k) + ')'))) + '$']
  });
  add('medium', '부분적분', 'x*cos(' + K(k) + ')', S(C(1, k, 'x*sin(' + K(k) + ')'), C(1, k * k, 'cos(' + K(k) + ')')), {
    domain: D.trigW,
    hints: ['$u=x,\\;dv=\\cos ' + K(k) + '\\,dx$', '남는 적분은 $\\int\\sin$ 이다.'],
    steps: ['$u=x,\\;v=' + M.latexOf(C(1, k, 'sin(' + K(k) + ')')) + '$',
            '$= ' + M.latexOf(S(C(1, k, 'x*sin(' + K(k) + ')'), C(1, k * k, 'cos(' + K(k) + ')'))) + '$']
  });
});
[1, 2, 3, 4].forEach(function (n) {
  add('medium', '부분적분', 'x^' + n + '*ln(x)',
      S(C(1, n + 1, 'x^' + (n + 1) + '*ln(x)'), C(-1, (n + 1) * (n + 1), 'x^' + (n + 1))), {
    domain: D.pos,
    hints: ['$u=\\ln x,\\;dv=x^{' + n + '}dx$ 로 둔다.', '남는 적분은 $\\int\\dfrac{x^{' + n + '}}{' + (n + 1) + '}dx$ 다.'],
    steps: ['$u=\\ln x,\\;v=\\dfrac{x^{' + (n + 1) + '}}{' + (n + 1) + '}$',
            '$= ' + M.latexOf(S(C(1, n + 1, 'x^' + (n + 1) + '*ln(x)'), C(-1, (n + 1) * (n + 1), 'x^' + (n + 1)))) + '$']
  });
});
[1, 2, 3].forEach(function (a) {
  add('medium', '부분적분', 'ln(' + K(a) + ')', 'x*ln(' + K(a) + ')-x', {
    domain: D.pos,
    hints: ['$dv=dx$ 로 두는 고전적인 수법이다.', '$u=\\ln ' + K(a) + ',\\;du=\\dfrac{dx}{x}$'],
    steps: ['$u=\\ln ' + K(a) + ',\\;dv=dx$', '$x\\ln ' + K(a) + '-\\int x\\cdot\\dfrac{1}{x}dx = x\\ln ' + K(a) + '-x$']
  });
});
[1, 2].forEach(function (a) {
  add('medium', '부분적분', 'atan(' + K(a) + ')', S('x*atan(' + K(a) + ')', C(-1, 2 * a, 'ln(1+' + (a * a) + 'x^2)')), {
    domain: [0.1, 2.2],
    hints: ['$dv=dx$ 로 두고 부분적분한다.', '$du=\\dfrac{' + a + '}{1+' + (a * a) + 'x^{2}}dx$'],
    steps: ['$u=\\arctan ' + K(a) + ',\\;dv=dx$',
            '$= ' + M.latexOf(S('x*atan(' + K(a) + ')', C(-1, 2 * a, 'ln(1+' + (a * a) + 'x^2)'))) + '$']
  });
  add('medium', '부분적분', 'asin(' + K(a) + ')', S('x*asin(' + K(a) + ')', C(1, a, 'sqrt(1-' + (a * a) + 'x^2)')), {
    domain: [-0.6 / a, 0.6 / a],
    hints: ['$dv=dx$ 로 두고 부분적분한다.', '남는 적분은 $u$ 치환으로 근호가 나온다.'],
    steps: ['$u=\\arcsin ' + K(a) + ',\\;dv=dx$',
            '$= ' + M.latexOf(S('x*asin(' + K(a) + ')', C(1, a, 'sqrt(1-' + (a * a) + 'x^2)'))) + '$']
  });
});

// 반각공식
[1, 2, 3].forEach(function (k) {
  add('medium', '반각공식', 'sin(' + K(k) + ')^2', S('x/2', C(-1, 4 * k, 'sin(' + K(2 * k) + ')')), {
    domain: D.trigW,
    hints: ['$\\sin^{2}\\theta=\\dfrac{1-\\cos 2\\theta}{2}$ 로 차수를 낮춘다.', '안쪽 각이 $' + K(2 * k) + '$ 가 된다.'],
    steps: ['$\\sin^{2}' + K(k) + ' = \\dfrac{1-\\cos ' + K(2 * k) + '}{2}$',
            '$\\int = ' + M.latexOf(S('x/2', C(-1, 4 * k, 'sin(' + K(2 * k) + ')'))) + '$']
  });
  add('medium', '반각공식', 'cos(' + K(k) + ')^2', S('x/2', C(1, 4 * k, 'sin(' + K(2 * k) + ')')), {
    domain: D.trigW,
    hints: ['$\\cos^{2}\\theta=\\dfrac{1+\\cos 2\\theta}{2}$ 를 쓴다.', '부호가 $\\sin^{2}$ 일 때와 반대다.'],
    steps: ['$\\cos^{2}' + K(k) + ' = \\dfrac{1+\\cos ' + K(2 * k) + '}{2}$',
            '$\\int = ' + M.latexOf(S('x/2', C(1, 4 * k, 'sin(' + K(2 * k) + ')'))) + '$']
  });
});

// tan / cot / sec / csc
[1, 2, 3].forEach(function (k) {
  add('medium', '삼각함수', 'tan(' + K(k) + ')', C(-1, k, 'ln(cos(' + K(k) + '))'), {
    domain: dTrig(k), lnAbs: true,
    hints: ['$\\tan u=\\dfrac{\\sin u}{\\cos u}$ 로 쓴다.', '$u=\\cos ' + K(k) + '$ 로 치환한다.'],
    steps: ['$u=\\cos ' + K(k) + ',\\;du=-' + KC(k) + '\\sin ' + K(k) + '\\,dx$',
            '$= ' + M.latexOf(C(-1, k, 'ln(cos(' + K(k) + '))'), { lnAbs: true }) + '$']
  });
  add('medium', '삼각함수', 'cot(' + K(k) + ')', C(1, k, 'ln(sin(' + K(k) + '))'), {
    domain: dCot(k), lnAbs: true,
    hints: ['$\\cot u=\\dfrac{\\cos u}{\\sin u}$ 다.', '$u=\\sin ' + K(k) + '$ 로 치환한다.'],
    steps: ['$u=\\sin ' + K(k) + '$', '$= ' + M.latexOf(C(1, k, 'ln(sin(' + K(k) + '))'), { lnAbs: true }) + '$']
  });
  add('medium', '고전 기법', 'sec(' + K(k) + ')', C(1, k, 'ln(sec(' + K(k) + ')+tan(' + K(k) + '))'), {
    domain: dTrig(k), lnAbs: true,
    hints: ['$\\dfrac{\\sec u+\\tan u}{\\sec u+\\tan u}$ 를 곱한다.', '분자가 분모의 도함수가 된다.'],
    steps: ['$\\sec u\\cdot\\dfrac{\\sec u+\\tan u}{\\sec u+\\tan u}$',
            '$= ' + M.latexOf(C(1, k, 'ln(sec(' + K(k) + ')+tan(' + K(k) + '))'), { lnAbs: true }) + '$']
  });
  add('medium', '고전 기법', 'csc(' + K(k) + ')', C(1, k, 'ln(csc(' + K(k) + ')-cot(' + K(k) + '))'), {
    domain: dCot(k), lnAbs: true,
    hints: ['$\\dfrac{\\csc u-\\cot u}{\\csc u-\\cot u}$ 를 곱한다.', '$\\sec$ 와 같은 요령이다.'],
    steps: ['$u=\\csc ' + K(k) + '-\\cot ' + K(k) + '$',
            '$= ' + M.latexOf(C(1, k, 'ln(csc(' + K(k) + ')-cot(' + K(k) + '))'), { lnAbs: true }) + '$']
  });
});

// 역삼각 적분표 (a 포함)
[1, 2, 3, 4, 5].forEach(function (a) {
  add('medium', '역삼각함수', '1/(x^2+' + (a * a) + ')', C(1, a, 'atan(' + X(a) + ')'), {
    domain: [-2.0, 3.0],
    hints: ['$\\int\\dfrac{dx}{x^{2}+a^{2}}=\\dfrac{1}{a}\\arctan\\dfrac{x}{a}$', '여기서 $a=' + a + '$ 다.'],
    steps: ['$a=' + a + '$', '$= ' + M.latexOf(C(1, a, 'atan(' + X(a) + ')')) + '$']
  });
});
[2, 3, 4, 5].forEach(function (a) {
  add('medium', '역삼각함수', '1/sqrt(' + (a * a) + '-x^2)', 'asin(' + X(a) + ')', {
    domain: [-0.7 * a, 0.7 * a],
    hints: ['$\\int\\dfrac{dx}{\\sqrt{a^{2}-x^{2}}}=\\arcsin\\dfrac{x}{a}$', '여기서 $a=' + a + '$ 다.'],
    steps: ['$a=' + a + '$', '$= \\arcsin' + XL(a) + '$']
  });
});

// 삼각함수 홀수 차수
[1, 2].forEach(function (k) {
  add('medium', '삼각함수 홀수차', 'sin(' + K(k) + ')^3',
      S(C(-1, k, 'cos(' + K(k) + ')'), C(1, 3 * k, 'cos(' + K(k) + ')^3')), {
    domain: D.trigW,
    hints: ['$\\sin^{3}u=\\sin u(1-\\cos^{2}u)$ 로 쪼갠다.', '$u=\\cos ' + K(k) + '$ 로 치환한다.'],
    steps: ['$\\sin^{3}' + K(k) + ' = (1-\\cos^{2}' + K(k) + ')\\sin ' + K(k) + '$',
            '$= ' + M.latexOf(S(C(-1, k, 'cos(' + K(k) + ')'), C(1, 3 * k, 'cos(' + K(k) + ')^3'))) + '$']
  });
  add('medium', '삼각함수 홀수차', 'cos(' + K(k) + ')^3',
      S(C(1, k, 'sin(' + K(k) + ')'), C(-1, 3 * k, 'sin(' + K(k) + ')^3')), {
    domain: D.trigW,
    hints: ['$\\cos^{3}u=\\cos u(1-\\sin^{2}u)$ 로 쪼갠다.', '$u=\\sin ' + K(k) + '$ 로 치환한다.'],
    steps: ['$\\cos^{3}' + K(k) + ' = (1-\\sin^{2}' + K(k) + ')\\cos ' + K(k) + '$',
            '$= ' + M.latexOf(S(C(1, k, 'sin(' + K(k) + ')'), C(-1, 3 * k, 'sin(' + K(k) + ')^3'))) + '$']
  });
});

// 근호 치환
[1, 2].forEach(function (a) {
  [1, 3].forEach(function (b) {
    var u = '(' + K(a) + '+' + b + ')';
    add('medium', '치환적분', 'x*sqrt' + u,
        S(C(2, 5 * a * a, u + '^(5/2)'), C(-2 * b, 3 * a * a, u + '^(3/2)')), {
      domain: [0.1, 2.6],
      hints: ['$u=' + K(a) + '+' + b + '$ 로 두면 $x=\\dfrac{u-' + b + '}{' + a + '}$ 다.',
              '$(u-' + b + ')\\sqrt{u}$ 를 전개해 항별로 적분한다.'],
      steps: ['$u=' + K(a) + '+' + b + '$',
              '$\\int (u^{3/2}-' + b + 'u^{1/2})\\dfrac{du}{' + (a * a) + '}$',
              '$= ' + M.latexOf(S(C(2, 5 * a * a, u + '^(5/2)'), C(-2 * b, 3 * a * a, u + '^(3/2)'))) + '$']
    });
  });
  [1, 3, 4].forEach(function (b) {
    add('medium', '치환적분', 'x/sqrt(x^2+' + b + ')', 'sqrt(x^2+' + b + ')', {
      domain: [0.1, 2.8],
      hints: ['$u=x^{2}+' + b + '$ 로 둔다.', '$\\int u^{-1/2}du=2\\sqrt{u}$ 를 기억한다.'],
      steps: ['$u=x^{2}+' + b + ',\\;du=2x\\,dx$', '$\\dfrac{1}{2}\\int u^{-1/2}du=\\sqrt{x^{2}+' + b + '}$']
    });
  });
  [1, 2, 3].forEach(function (b) {
    add('medium', '치환적분', 'sqrt(' + K(a) + '+' + b + ')', C(2, 3 * a, '(' + K(a) + '+' + b + ')^(3/2)'), {
      domain: [0.1, 2.6],
      hints: ['$u=' + K(a) + '+' + b + '$ 로 두면 $du=' + KC(a) + '\\,dx$ 다.', '$\\int u^{1/2}du=\\dfrac{2}{3}u^{3/2}$'],
      steps: ['$u=' + K(a) + '+' + b + '$',
              '$= ' + M.latexOf(C(2, 3 * a, '(' + K(a) + '+' + b + ')^(3/2)')) + '$']
    });
  });
});

// 로그 치환
[1, 2, 3].forEach(function (n) {
  add('medium', '치환적분', 'ln(x)^' + n + '/x', C(1, n + 1, 'ln(x)^' + (n + 1)), {
    domain: [0.4, 4.0],
    hints: ['$u=\\ln x$ 로 두면 $du=\\dfrac{dx}{x}$ 다.', '남는 것은 $\\int u^{' + n + '}du$ 다.'],
    steps: ['$u=\\ln x$', '$\\int u^{' + n + '}du = ' + M.latexOf(C(1, n + 1, 'ln(x)^' + (n + 1))) + '$']
  });
});
add('medium', '이중 치환', '1/(x*ln(x))', 'ln(ln(x))', {
  domain: D.lnln, lnAbs: true,
  hints: ['$u=\\ln x$ 로 두면 적분이 $\\int\\dfrac{du}{u}$ 가 된다.', '로그가 두 번 겹친다.'],
  steps: ['$u=\\ln x,\\;du=\\dfrac{dx}{x}$', '$\\int\\dfrac{du}{u}=\\ln|\\ln x|$']
});

// 부분분수 (서로 다른 1차 인수)
[[1, 2, 3, 5], [1, 3, 2, 4], [2, 3, 1, 1], [1, 4, 5, 2], [2, 5, 3, -1],
 [1, 2, 4, 7], [3, 4, 2, 5], [1, 5, 2, 3]].forEach(function (q) {
  var a = q[0], b = q[1], pp = q[2], qq = q[3];      // (pp x + qq)/((x+a)(x+b))
  var An = qq - pp * a, Ad = b - a;
  var Bn = qq - pp * b, Bd = a - b;
  var integ = '(' + K(pp) + (qq < 0 ? ' - ' + (-qq) : ' + ' + qq) + ')/((x+' + a + ')(x+' + b + '))';
  var ans = S(C(An, Ad, 'ln(x+' + a + ')'), C(Bn, Bd, 'ln(x+' + b + ')'));
  add('medium', '부분분수', integ, ans, {
    domain: [0.2, 3.0], lnAbs: true,
    hints: ['$\\dfrac{A}{x+' + a + '}+\\dfrac{B}{x+' + b + '}$ 로 분해한다.',
            '$x=-' + a + ',\\;x=-' + b + '$ 를 대입하면 $A,B$ 가 바로 나온다.'],
    steps: ['$' + M.latexOf(K(pp) + (qq < 0 ? qq : '+' + qq)) + ' = A(x+' + b + ')+B(x+' + a + ')$',
            '$A=' + M.latexOf(C(An, Ad)) + ',\\;B=' + M.latexOf(C(Bn, Bd)) + '$',
            '$= ' + M.latexOf(ans, { lnAbs: true }) + '$']
  });
});

// f'/f 꼴
[[1, 3, 5], [2, 1, 4], [3, 2, 6], [1, -1, 3], [4, 5, 9]].forEach(function (q) {
  var b = q[1], c = q[2];
  var integ = '(2x' + (b < 0 ? ' - ' + (-b) : ' + ' + b) + ')/(x^2' + (b < 0 ? ' - ' + (-b) : ' + ' + b) + 'x + ' + c + ')';
  add('medium', '치환적분', integ, 'ln(x^2' + (b < 0 ? '-' + (-b) : '+' + b) + 'x+' + c + ')', {
    domain: [0.2, 2.6], lnAbs: true,
    hints: ['분자가 분모의 도함수와 정확히 같다.', '$\\int\\dfrac{f\'}{f}dx=\\ln|f|$'],
    steps: ['$u=x^{2}' + (b < 0 ? b : '+' + b) + 'x+' + c + '$', '$\\int\\dfrac{du}{u}=\\ln|u|$']
  });
});

// 합성 치환
add('medium', '치환적분', 'cos(x)/(1+sin(x)^2)', 'atan(sin(x))', {
  domain: [0.1, 1.4],
  hints: ['$u=\\sin x$ 로 두면 $du=\\cos x\\,dx$ 다.', '남은 적분이 $\\arctan$ 꼴이다.'],
  steps: ['$u=\\sin x$', '$\\int\\dfrac{du}{1+u^{2}}=\\arctan(\\sin x)$']
});
add('medium', '치환적분', 'sin(x)/(1+cos(x)^2)', '-atan(cos(x))', {
  domain: [0.2, 2.8],
  hints: ['$u=\\cos x$ 로 두면 $du=-\\sin x\\,dx$ 다.', '부호에 주의한다.'],
  steps: ['$u=\\cos x$', '$-\\int\\dfrac{du}{1+u^{2}}=-\\arctan(\\cos x)$']
});
add('medium', '치환적분', 'e^x/(1+e^(2x))', 'atan(e^x)', {
  domain: [-1.2, 1.5],
  hints: ['$e^{2x}=(e^{x})^{2}$ 임을 이용한다.', '$u=e^{x}$ 로 치환한다.'],
  steps: ['$u=e^{x},\\;du=e^{x}dx$', '$\\int\\dfrac{du}{1+u^{2}}=\\arctan(e^{x})$']
});
[1, 2, 3].forEach(function (a) {
  add('medium', '치환적분', 'e^x/(e^x+' + a + ')', 'ln(e^x+' + a + ')', {
    domain: [-1.0, 1.8],
    hints: ['분자가 분모의 도함수다.', '$u=e^{x}+' + a + '$ 로 둔다.'],
    steps: ['$u=e^{x}+' + a + '$', '$\\int\\dfrac{du}{u}=\\ln(e^{x}+' + a + ')$']
  });
});

// 순환 부분적분 (기본형)
add('medium', '순환 부분적분', 'e^x*sin(x)', 'e^x*(sin(x)-cos(x))/2', {
  domain: [0.1, 2.5],
  hints: ['부분적분을 두 번 하면 원래 적분 $I$ 가 다시 나온다.', '$I$ 에 대한 방정식을 세워 푼다.'],
  steps: ['$I=\\int e^{x}\\sin x\\,dx$', '$I = e^{x}\\sin x-e^{x}\\cos x-I$', '$2I=e^{x}(\\sin x-\\cos x)$']
});
add('medium', '순환 부분적분', 'e^x*cos(x)', 'e^x*(sin(x)+cos(x))/2', {
  domain: [0.1, 2.5],
  hints: ['$\\sin$ 일 때와 같은 방법이다.', '두 번 부분적분 후 $I$ 를 정리한다.'],
  steps: ['$I=\\int e^{x}\\cos x\\,dx$', '$2I=e^{x}(\\sin x+\\cos x)$']
});
add('medium', '반복 부분적분', 'x^2*e^x', '(x^2-2x+2)*e^x', {
  domain: D.all,
  hints: ['부분적분을 두 번 적용해 차수를 내린다.', '중간에 $\\int xe^{x}dx$ 가 나온다.'],
  steps: ['$x^{2}e^{x}-2\\int xe^{x}dx$', '$\\int xe^{x}dx=(x-1)e^{x}$', '$=(x^{2}-2x+2)e^{x}$']
});

// 쌍곡선함수 (보통)
[1, 2, 3].forEach(function (k) {
  add('medium', '쌍곡선함수', 'tanh(' + K(k) + ')', C(1, k, 'ln(cosh(' + K(k) + '))'), {
    domain: D.hyp,
    hints: ['$\\tanh u=\\dfrac{\\sinh u}{\\cosh u}$ 다.', '$\\cosh$ 는 항상 양수라 절댓값이 필요 없다.'],
    steps: ['$u=\\cosh ' + K(k) + ',\\;du=' + KC(k) + '\\sinh ' + K(k) + '\\,dx$',
            '$= ' + M.latexOf(C(1, k, 'ln(cosh(' + K(k) + '))')) + '$']
  });
  add('medium', '쌍곡선함수', 'coth(' + K(k) + ')', C(1, k, 'ln(sinh(' + K(k) + '))'), {
    domain: D.hypP, lnAbs: true,
    hints: ['$\\coth u=\\dfrac{\\cosh u}{\\sinh u}$ 다.', '$u=\\sinh ' + K(k) + '$ 로 치환한다.'],
    steps: ['$u=\\sinh ' + K(k) + '$', '$= ' + M.latexOf(C(1, k, 'ln(sinh(' + K(k) + '))'), { lnAbs: true }) + '$']
  });
  add('medium', '쌍곡선 항등식', 'sinh(' + K(k) + ')^2', S(C(1, 4 * k, 'sinh(' + K(2 * k) + ')'), '-x/2'), {
    domain: D.hyp,
    hints: ['$\\sinh^{2}u=\\dfrac{\\cosh 2u-1}{2}$ 를 쓴다.', '삼각함수의 반각공식과 부호가 다르다.'],
    steps: ['$\\sinh^{2}' + K(k) + ' = \\dfrac{\\cosh ' + K(2 * k) + '-1}{2}$',
            '$\\int = ' + M.latexOf(S(C(1, 4 * k, 'sinh(' + K(2 * k) + ')'), '-x/2')) + '$']
  });
  add('medium', '쌍곡선 항등식', 'cosh(' + K(k) + ')^2', S(C(1, 4 * k, 'sinh(' + K(2 * k) + ')'), 'x/2'), {
    domain: D.hyp,
    hints: ['$\\cosh^{2}u=\\dfrac{\\cosh 2u+1}{2}$ 를 쓴다.', '$\\sinh^{2}$ 일 때와 부호만 다르다.'],
    steps: ['$\\cosh^{2}' + K(k) + ' = \\dfrac{\\cosh ' + K(2 * k) + '+1}{2}$',
            '$\\int = ' + M.latexOf(S(C(1, 4 * k, 'sinh(' + K(2 * k) + ')'), 'x/2')) + '$']
  });
  add('medium', '쌍곡선 항등식', 'tanh(' + K(k) + ')^2', S('x', C(-1, k, 'tanh(' + K(k) + ')')), {
    domain: D.hyp,
    hints: ['$\\tanh^{2}u=1-\\operatorname{sech}^{2}u$ 다.', '삼각함수의 $\\tan^{2}$ 와 부호가 반대다.'],
    steps: ['$\\tanh^{2}' + K(k) + ' = 1-\\operatorname{sech}^{2}' + K(k) + '$',
            '$\\int = ' + M.latexOf(S('x', C(-1, k, 'tanh(' + K(k) + ')'))) + '$']
  });
  add('medium', '쌍곡선함수', 'sinh(' + K(k) + ')cosh(' + K(k) + ')', C(1, 4 * k, 'cosh(' + K(2 * k) + ')'), {
    domain: D.hyp,
    hints: ['$\\sinh 2u=2\\sinh u\\cosh u$ 를 쓰거나 $u=\\sinh$ 로 치환한다.', '둘 중 어느 쪽이든 상수 차이만 난다.'],
    steps: ['$\\sinh ' + K(k) + '\\cosh ' + K(k) + ' = \\dfrac{\\sinh ' + K(2 * k) + '}{2}$',
            '$= ' + M.latexOf(C(1, 4 * k, 'cosh(' + K(2 * k) + ')')) + '$']
  });
  add('medium', '쌍곡선함수', 'sech(' + K(k) + ')^2*tanh(' + K(k) + ')', C(1, 2 * k, 'tanh(' + K(k) + ')^2'), {
    domain: D.hyp,
    hints: ['$u=\\tanh ' + K(k) + '$ 로 두면 $du=' + KC(k) + '\\operatorname{sech}^{2}' + K(k) + 'dx$ 다.', '남는 것은 $\\int u\\,du$ 다.'],
    steps: ['$u=\\tanh ' + K(k) + '$', '$= ' + M.latexOf(C(1, 2 * k, 'tanh(' + K(k) + ')^2')) + '$']
  });
});
[1, 2, 3].forEach(function (a) {
  add('medium', '역쌍곡선함수', '1/sqrt(x^2+' + (a * a) + ')', 'asinh(' + X(a) + ')', {
    domain: [-1.5, 2.5],
    hints: ['$\\int\\dfrac{dx}{\\sqrt{x^{2}+a^{2}}}=\\operatorname{arsinh}\\dfrac{x}{a}$', '$x=' + KL(a, '\\sinh\\theta') + '$ 로 치환해도 된다.'],
    steps: ['$x=' + KL(a, '\\sinh\\theta') + '$', '$= \\operatorname{arsinh}' + XL(a) + '$']
  });
  add('medium', '역쌍곡선함수', '1/sqrt(x^2-' + (a * a) + ')', 'acosh(' + X(a) + ')', {
    domain: [a * 1.25, a * 3.2],
    hints: ['$\\int\\dfrac{dx}{\\sqrt{x^{2}-a^{2}}}=\\operatorname{arcosh}\\dfrac{x}{a}$', '$x=' + KL(a, '\\cosh\\theta') + '$ 로 치환한다.'],
    steps: ['$x=' + KL(a, '\\cosh\\theta') + '$', '$= \\operatorname{arcosh}' + XL(a) + '$']
  });
  add('medium', '역쌍곡선함수', '1/(' + (a * a) + '-x^2)', C(1, a, 'atanh(' + X(a) + ')'), {
    domain: [-0.7 * a, 0.7 * a],
    hints: ['$|x|<' + a + '$ 에서 $\\int\\dfrac{dx}{a^{2}-x^{2}}=\\dfrac{1}{a}\\operatorname{artanh}\\dfrac{x}{a}$',
            '부분분수로 풀면 로그 형태로도 쓸 수 있다.'],
    steps: ['$\\dfrac{1}{' + (a * a) + '-x^{2}}$ 를 부분분수로 분해',
            '$= ' + M.latexOf(C(1, a, 'atanh(' + X(a) + ')')) + '$']
  });
});
[1, 2].forEach(function (k) {
  add('medium', '부분적분', 'x*sinh(' + K(k) + ')', S(C(1, k, 'x*cosh(' + K(k) + ')'), C(-1, k * k, 'sinh(' + K(k) + ')')), {
    domain: D.hyp,
    hints: ['$u=x,\\;dv=\\sinh ' + K(k) + '\\,dx$ 로 둔다.', '삼각함수와 달리 부호가 바뀌지 않는다.'],
    steps: ['$u=x,\\;v=' + M.latexOf(C(1, k, 'cosh(' + K(k) + ')')) + '$',
            '$= ' + M.latexOf(S(C(1, k, 'x*cosh(' + K(k) + ')'), C(-1, k * k, 'sinh(' + K(k) + ')'))) + '$']
  });
  add('medium', '부분적분', 'x*cosh(' + K(k) + ')', S(C(1, k, 'x*sinh(' + K(k) + ')'), C(-1, k * k, 'cosh(' + K(k) + ')')), {
    domain: D.hyp,
    hints: ['$u=x,\\;dv=\\cosh ' + K(k) + '\\,dx$ 로 둔다.', '남는 적분은 $\\int\\sinh$ 다.'],
    steps: ['$u=x,\\;v=' + M.latexOf(C(1, k, 'sinh(' + K(k) + ')')) + '$',
            '$= ' + M.latexOf(S(C(1, k, 'x*sinh(' + K(k) + ')'), C(-1, k * k, 'cosh(' + K(k) + ')'))) + '$']
  });
});

// ================================================================== 어려움

// 부호를 붙여 항을 잇는 헬퍼 (a>=0 이면 '+a')
function sg(v) { return v < 0 ? ' - ' + (-v) : ' + ' + v; }

// 삼각치환
[1, 2, 3].forEach(function (a) {
  var a2 = a * a;
  add('hard', '삼각치환', 'sqrt(' + a2 + '-x^2)',
      S(C(1, 2, 'x*sqrt(' + a2 + '-x^2)'), C(a2, 2, 'asin(' + X(a) + ')')), {
    domain: [-0.75 * a, 0.75 * a],
    hints: ['$x=' + KL(a, '\\sin\\theta') + '$ 로 치환한다.', '$\\cos^{2}\\theta$ 는 반각공식으로 처리한다.'],
    steps: ['$x=' + KL(a, '\\sin\\theta') + ',\\;dx=' + KL(a, '\\cos\\theta') + '\\,d\\theta$',
            '$' + KL(a2, '\\int') + '\\cos^{2}\\theta\\,d\\theta = ' + KL(a2, '\\left(\\dfrac{\\theta}{2}+\\dfrac{\\sin 2\\theta}{4}\\right)') + '$',
            '$= ' + M.latexOf(S(C(1, 2, 'x*sqrt(' + a2 + '-x^2)'), C(a2, 2, 'asin(' + X(a) + ')'))) + '$']
  });
  add('hard', '쌍곡선 치환', 'sqrt(x^2+' + a2 + ')',
      S(C(1, 2, 'x*sqrt(x^2+' + a2 + ')'), C(a2, 2, 'asinh(' + X(a) + ')')), {
    domain: [-1.4, 2.4],
    hints: ['$x=' + KL(a, '\\sinh\\theta') + '$ 로 치환하면 근호가 $\\cosh$ 로 풀린다.',
            '$\\cosh^{2}\\theta=\\dfrac{\\cosh 2\\theta+1}{2}$ 를 쓴다.'],
    steps: ['$x=' + KL(a, '\\sinh\\theta') + '$', '$' + KL(a2, '\\int') + '\\cosh^{2}\\theta\\,d\\theta$',
            '$= ' + M.latexOf(S(C(1, 2, 'x*sqrt(x^2+' + a2 + ')'), C(a2, 2, 'asinh(' + X(a) + ')'))) + '$']
  });
  add('hard', '쌍곡선 치환', 'sqrt(x^2-' + a2 + ')',
      S(C(1, 2, 'x*sqrt(x^2-' + a2 + ')'), C(-a2, 2, 'acosh(' + X(a) + ')')), {
    domain: [a * 1.3, a * 3.0],
    hints: ['$x=' + KL(a, '\\cosh\\theta') + '$ 로 치환한다.', '$\\sinh^{2}\\theta=\\dfrac{\\cosh 2\\theta-1}{2}$'],
    steps: ['$x=' + KL(a, '\\cosh\\theta') + '$', '$' + KL(a2, '\\int') + '\\sinh^{2}\\theta\\,d\\theta$',
            '$= ' + M.latexOf(S(C(1, 2, 'x*sqrt(x^2-' + a2 + ')'), C(-a2, 2, 'acosh(' + X(a) + ')'))) + '$']
  });
  add('hard', '삼각치환', 'x^2/sqrt(' + a2 + '-x^2)',
      S(C(a2, 2, 'asin(' + X(a) + ')'), C(-1, 2, 'x*sqrt(' + a2 + '-x^2)')), {
    domain: [-0.75 * a, 0.75 * a],
    hints: ['$x=' + KL(a, '\\sin\\theta') + '$ 로 두면 $\\int\\sin^{2}\\theta\\,d\\theta$ 가 된다.', '반각공식 후 다시 $x$ 로 되돌린다.'],
    steps: ['$x=' + KL(a, '\\sin\\theta') + '$', '$' + KL(a2, '\\int') + '\\sin^{2}\\theta\\,d\\theta$',
            '$= ' + M.latexOf(S(C(a2, 2, 'asin(' + X(a) + ')'), C(-1, 2, 'x*sqrt(' + a2 + '-x^2)'))) + '$']
  });
  add('hard', '삼각치환', '1/(x^2*sqrt(x^2-' + a2 + '))', C(1, a2, 'sqrt(x^2-' + a2 + ')/x'), {
    domain: [a * 1.3, a * 3.4],
    hints: ['$x=' + KL(a, '\\sec\\theta') + '$ 로 치환한다.', '적분이 $\\int\\cos\\theta\\,d\\theta$ 로 줄어든다.'],
    steps: ['$x=' + KL(a, '\\sec\\theta') + '$',
            '$' + FR('1', a2) + '\\int\\cos\\theta\\,d\\theta=' + FR('\\sin\\theta', a2) + '$',
            '$= ' + M.latexOf(C(1, a2, 'sqrt(x^2-' + a2 + ')/x')) + '$']
  });
  add('hard', '삼각치환', '1/(x^2*sqrt(' + a2 + '-x^2))', C(-1, a2, 'sqrt(' + a2 + '-x^2)/x'), {
    domain: [0.35 * a, 0.8 * a],
    hints: ['$x=' + KL(a, '\\sin\\theta') + '$ 로 치환한다.', '$\\int\\csc^{2}\\theta\\,d\\theta=-\\cot\\theta$'],
    steps: ['$x=' + KL(a, '\\sin\\theta') + '$', '$\\dfrac{1}{' + a2 + '}\\int\\csc^{2}\\theta\\,d\\theta$',
            '$= ' + M.latexOf(C(-1, a2, 'sqrt(' + a2 + '-x^2)/x')) + '$']
  });
});

// 완전제곱 (b 는 짝수, d=c-(b/2)^2 은 완전제곱수)
[[2, 5, 2], [4, 13, 3], [2, 2, 1], [6, 13, 2], [-2, 5, 2], [4, 5, 1], [-4, 13, 3], [2, 10, 3], [-6, 13, 2]]
.forEach(function (q) {
  var b = q[0], c = q[1], sd = q[2], h = b / 2;
  var den = '(x^2' + sg(b) + 'x' + sg(c) + ')';
  var shift = '(x' + sg(h) + ')';
  add('hard', '완전제곱', '1/' + den, C(1, sd, 'atan(' + shift + '/' + sd + ')'), {
    domain: [-1.0, 2.6],
    hints: ['분모를 $\\left(x' + (h < 0 ? h : '+' + h) + '\\right)^{2}+' + (sd * sd) + '$ 로 완전제곱한다.',
            '$\\int\\dfrac{du}{u^{2}+a^{2}}=\\dfrac{1}{a}\\arctan\\dfrac{u}{a}$ 에서 $a=' + sd + '$'],
    steps: ['$x^{2}' + sg(b) + 'x' + sg(c) + ' = \\left(x' + (h < 0 ? h : '+' + h) + '\\right)^{2}+' + (sd * sd) + '$',
            '$= ' + M.latexOf(C(1, sd, 'atan(' + shift + '/' + sd + ')')) + '$']
  });
  add('hard', '완전제곱', '1/sqrt' + den, 'asinh(' + shift + '/' + sd + ')', {
    domain: [-1.0, 2.6],
    hints: ['분모 안을 완전제곱하면 $u^{2}+' + (sd * sd) + '$ 꼴이 된다.',
            '$\\int\\dfrac{du}{\\sqrt{u^{2}+a^{2}}}=\\operatorname{arsinh}\\dfrac{u}{a}$'],
    steps: ['$x^{2}' + sg(b) + 'x' + sg(c) + ' = \\left(x' + (h < 0 ? h : '+' + h) + '\\right)^{2}+' + (sd * sd) + '$',
            '$= \\operatorname{arsinh}\\dfrac{x' + (h < 0 ? h : '+' + h) + '}{' + sd + '}$']
  });
});
[[1, 3, 2, 5, 2], [2, 1, 4, 13, 3], [3, 2, 2, 2, 1], [1, 5, 6, 13, 2], [2, -1, -2, 5, 2], [4, 3, 4, 5, 1]]
.forEach(function (q) {
  var pp = q[0], qq = q[1], b = q[2], c = q[3], sd = q[4], h = b / 2;
  var den = '(x^2' + sg(b) + 'x' + sg(c) + ')';
  var shift = '(x' + sg(h) + ')';
  var rest = qq - pp * h;                       // 1차항을 제거하고 남는 상수
  var ans = S(C(pp, 2, 'ln' + den), C(rest, sd, 'atan(' + shift + '/' + sd + ')'));
  add('hard', '완전제곱', '(' + K(pp) + sg(qq) + ')/' + den, ans, {
    domain: [-1.0, 2.6],
    hints: ['분자를 분모의 도함수 $2x' + sg(b) + '$ 의 상수배 + 나머지 상수로 쪼갠다.',
            '앞쪽은 로그, 뒤쪽은 $\\arctan$ 이 된다.'],
    steps: ['$' + M.latexOf(K(pp) + sg(qq)) + ' = ' + M.latexOf(C(pp, 2)) + '\\left(2x' + sg(b) + '\\right)' + sg(rest) + '$',
            '$= ' + M.latexOf(ans) + '$']
  });
});

// 삼각함수 고차
[1, 2].forEach(function (k) {
  add('hard', '삼각함수 고급', 'sec(' + K(k) + ')^3',
      C(1, 2 * k, 'sec(' + K(k) + ')tan(' + K(k) + ')') + ' + ' + C(1, 2 * k, 'ln(sec(' + K(k) + ')+tan(' + K(k) + '))'), {
    domain: dTrig(k), lnAbs: true,
    hints: ['$\\sec^{3}u=\\sec u\\cdot\\sec^{2}u$ 로 나눠 부분적분한다.', '$\\int\\sec u\\,du$ 결과가 다시 필요하다.'],
    steps: ['$u=\\sec ' + K(k) + ',\\;dv=\\sec^{2}' + K(k) + 'dx$',
            '$I = \\sec\\tan-\\int\\sec\\tan^{2}$', '$2I=\\sec\\tan+\\ln|\\sec+\\tan|$']
  });
  add('hard', '삼각함수 고급', 'csc(' + K(k) + ')^3',
      C(-1, 2 * k, 'csc(' + K(k) + ')cot(' + K(k) + ')') + ' + ' + C(1, 2 * k, 'ln(csc(' + K(k) + ')-cot(' + K(k) + '))'), {
    domain: dCot(k), lnAbs: true,
    hints: ['$\\sec^{3}$ 와 같은 방식으로 부분적분한다.', '$\\int\\csc u\\,du$ 가 다시 나온다.'],
    steps: ['$I=\\int\\csc^{3}$', '$2I=-\\csc\\cot+\\ln|\\csc-\\cot|$']
  });
  add('hard', '삼각함수 홀수차', 'tan(' + K(k) + ')^3',
      S(C(1, 2 * k, 'tan(' + K(k) + ')^2'), C(1, k, 'ln(cos(' + K(k) + '))')), {
    domain: dTrig(k), lnAbs: true,
    hints: ['$\\tan^{3}u=\\tan u(\\sec^{2}u-1)$ 로 쪼갠다.', '첫 항은 $u=\\tan$ 치환이다.'],
    steps: ['$\\tan^{3}' + K(k) + ' = \\tan\\sec^{2}-\\tan$',
            '$= ' + M.latexOf(S(C(1, 2 * k, 'tan(' + K(k) + ')^2'), C(1, k, 'ln(cos(' + K(k) + '))')), { lnAbs: true }) + '$']
  });
  add('hard', '삼각함수 홀수차', 'cot(' + K(k) + ')^3',
      S(C(-1, 2 * k, 'cot(' + K(k) + ')^2'), C(-1, k, 'ln(sin(' + K(k) + '))')), {
    domain: dCot(k), lnAbs: true,
    hints: ['$\\cot^{3}u=\\cot u(\\csc^{2}u-1)$ 로 쪼갠다.', '부호에 특히 주의한다.'],
    steps: ['$\\cot^{3}' + K(k) + ' = \\cot\\csc^{2}-\\cot$',
            '$= ' + M.latexOf(S(C(-1, 2 * k, 'cot(' + K(k) + ')^2'), C(-1, k, 'ln(sin(' + K(k) + '))')), { lnAbs: true }) + '$']
  });
});
add('hard', '삼각함수 고차', 'tan(x)^4', 'tan(x)^3/3-tan(x)+x', {
  domain: D.trig,
  hints: ['$\\tan^{4}=\\tan^{2}(\\sec^{2}-1)$ 로 한 단계씩 내린다.', '마지막에 $\\int\\tan^{2}=\\tan x-x$ 를 쓴다.'],
  steps: ['$\\tan^{4}x=\\tan^{2}x\\sec^{2}x-\\tan^{2}x$', '$= \\dfrac{\\tan^{3}x}{3}-\\tan x+x$']
});
add('hard', '삼각함수 고차', 'sec(x)^4', 'tan(x)+tan(x)^3/3', {
  domain: D.trig,
  hints: ['$\\sec^{4}=\\sec^{2}\\cdot\\sec^{2}=(1+\\tan^{2})\\sec^{2}$', '$u=\\tan x$ 치환이면 끝난다.'],
  steps: ['$\\sec^{4}x=(1+\\tan^{2}x)\\sec^{2}x$', '$u=\\tan x:\\;\\int(1+u^{2})du$']
});
add('hard', '삼각함수 고차', 'cot(x)^4', '-cot(x)^3/3+cot(x)+x', {
  domain: [0.45, 1.4],
  hints: ['$\\cot^{4}=\\cot^{2}(\\csc^{2}-1)$ 로 내린다.', '$\\int\\cot^{2}=-\\cot x-x$ 를 쓴다.'],
  steps: ['$\\cot^{4}x=\\cot^{2}x\\csc^{2}x-\\cot^{2}x$', '$= -\\dfrac{\\cot^{3}x}{3}+\\cot x+x$']
});
add('hard', '삼각함수 고차', 'csc(x)^4', '-cot(x)-cot(x)^3/3', {
  domain: [0.5, 1.4],
  hints: ['$\\csc^{4}=(1+\\cot^{2})\\csc^{2}$', '$u=\\cot x$ 로 치환한다.'],
  steps: ['$\\csc^{4}x=(1+\\cot^{2}x)\\csc^{2}x$', '$u=\\cot x:\\;-\\int(1+u^{2})du$']
});

// 부분분수 (반복 인수 / 2차 인수)
[1, 2, 3].forEach(function (a) {
  add('hard', '부분분수', '1/(x^2*(x+' + a + '))',
      S(C(-1, a, '1/x'), C(-1, a * a, 'ln(x)'), C(1, a * a, 'ln(x+' + a + ')')), {
    domain: [0.4, 3.0], lnAbs: true,
    hints: ['$\\dfrac{A}{x}+\\dfrac{B}{x^{2}}+\\dfrac{D}{x+' + a + '}$ 로 분해한다.',
            '$B$ 는 $x=0$, $D$ 는 $x=-' + a + '$ 대입으로 바로 나온다.'],
    steps: ['$1=Ax(x+' + a + ')+B(x+' + a + ')+Dx^{2}$',
            '$B=' + M.latexOf(C(1, a)) + ',\\;D=' + M.latexOf(C(1, a * a)) + ',\\;A=' + M.latexOf(C(-1, a * a)) + '$',
            '$= ' + M.latexOf(S(C(-1, a, '1/x'), C(-1, a * a, 'ln(x)'), C(1, a * a, 'ln(x+' + a + ')')), { lnAbs: true }) + '$']
  });
  add('hard', '부분분수', '1/(x^3+' + (a * a) + 'x)',
      S(C(1, a * a, 'ln(x)'), C(-1, 2 * a * a, 'ln(x^2+' + (a * a) + ')')), {
    domain: [0.35, 3.0], lnAbs: true,
    hints: ['$x(x^{2}+' + (a * a) + ')$ 로 인수분해한다.',
            '$\\dfrac{1}{' + (a * a) + '}\\left(\\dfrac{1}{x}-\\dfrac{x}{x^{2}+' + (a * a) + '}\\right)$ 가 된다.'],
    steps: ['$\\dfrac{1}{x(x^{2}+' + (a * a) + ')} = \\dfrac{1}{' + (a * a) + '}\\left(\\dfrac{1}{x}-\\dfrac{x}{x^{2}+' + (a * a) + '}\\right)$',
            '$= ' + M.latexOf(S(C(1, a * a, 'ln(x)'), C(-1, 2 * a * a, 'ln(x^2+' + (a * a) + ')')), { lnAbs: true }) + '$']
  });
  add('hard', '부분분수', '1/(x^2-' + (a * a) + ')',
      S(C(1, 2 * a, 'ln(x-' + a + ')'), C(-1, 2 * a, 'ln(x+' + a + ')')), {
    domain: [a * 1.3, a * 3.4], lnAbs: true,
    hints: ['$(x-' + a + ')(x+' + a + ')$ 로 인수분해한다.',
            '$\\dfrac{1}{' + (2 * a) + '}\\left(\\dfrac{1}{x-' + a + '}-\\dfrac{1}{x+' + a + '}\\right)$'],
    steps: ['부분분수 분해',
            '$= ' + M.latexOf(S(C(1, 2 * a, 'ln(x-' + a + ')'), C(-1, 2 * a, 'ln(x+' + a + ')')), { lnAbs: true }) + '$']
  });
});
[[1, 2], [1, 3], [2, 3], [1, 4]].forEach(function (q) {
  var a = q[0], b = q[1], d = b - a;
  add('hard', '부분분수', '1/((x+' + a + ')(x+' + b + ')^2)',
      S(C(1, d * d, 'ln(x+' + a + ')'), C(-1, d * d, 'ln(x+' + b + ')'), C(1, d, '1/(x+' + b + ')')), {
    domain: [0.2, 3.0], lnAbs: true,
    hints: ['중복 인수는 $\\dfrac{B}{x+' + b + '}+\\dfrac{D}{(x+' + b + ')^{2}}$ 두 항이 필요하다.',
            '$x=-' + a + '$ 와 $x=-' + b + '$ 를 대입해 계수를 잡는다.'],
    steps: ['$\\dfrac{A}{x+' + a + '}+\\dfrac{B}{x+' + b + '}+\\dfrac{D}{(x+' + b + ')^{2}}$',
            '$A=' + M.latexOf(C(1, d * d)) + ',\\;B=' + M.latexOf(C(-1, d * d)) + ',\\;D=' + M.latexOf(C(-1, d)) + '$',
            '$= ' + M.latexOf(S(C(1, d * d, 'ln(x+' + a + ')'), C(-1, d * d, 'ln(x+' + b + ')'), C(1, d, '1/(x+' + b + ')')), { lnAbs: true }) + '$']
  });
});

// 반복 부분적분
[1, 2, 3, -1].forEach(function (a) {
  add('hard', '반복 부분적분', 'x^2*e^(' + K(a) + ')',
      'e^(' + K(a) + ')*(' + (a * a) + 'x^2 - ' + (2 * a) + 'x + 2)/' + (a * a * a), {
    domain: D.all,
    hints: ['부분적분을 두 번 해서 $x^{2}\\to x\\to 1$ 로 차수를 내린다.', '$\\int xe^{' + K(a) + '}dx$ 가 중간에 나온다.'],
    steps: ['$' + FR('x^{2}e^{' + K(a) + '}', a) + '-' + FR('2', a) + '\\int xe^{' + K(a) + '}dx$',
            '$= ' + M.latexOf('e^(' + K(a) + ')*(' + (a * a) + 'x^2 - ' + (2 * a) + 'x + 2)/' + (a * a * a)) + '$']
  });
});
[1, 2].forEach(function (a) {
  add('hard', '반복 부분적분', 'x^2*sin(' + K(a) + ')',
      S(C(-1, a, 'x^2*cos(' + K(a) + ')'), C(2, a * a, 'x*sin(' + K(a) + ')'), C(2, a * a * a, 'cos(' + K(a) + ')')), {
    domain: D.trigW,
    hints: ['$u=x^{2}$ 로 두고 부분적분을 두 번 한다.', '중간에 $\\int x\\cos ' + K(a) + 'dx$ 가 나온다.'],
    steps: ['$u=x^{2},\\;dv=\\sin ' + K(a) + 'dx$',
            '$= ' + M.latexOf(S(C(-1, a, 'x^2*cos(' + K(a) + ')'), C(2, a * a, 'x*sin(' + K(a) + ')'), C(2, a * a * a, 'cos(' + K(a) + ')'))) + '$']
  });
  add('hard', '반복 부분적분', 'x^2*cos(' + K(a) + ')',
      S(C(1, a, 'x^2*sin(' + K(a) + ')'), C(2, a * a, 'x*cos(' + K(a) + ')'), C(-2, a * a * a, 'sin(' + K(a) + ')')), {
    domain: D.trigW,
    hints: ['$u=x^{2}$ 로 두고 두 번 부분적분한다.', '$\\sin$ 일 때와 부호 배치가 다르다.'],
    steps: ['$u=x^{2},\\;dv=\\cos ' + K(a) + 'dx$',
            '$= ' + M.latexOf(S(C(1, a, 'x^2*sin(' + K(a) + ')'), C(2, a * a, 'x*cos(' + K(a) + ')'), C(-2, a * a * a, 'sin(' + K(a) + ')'))) + '$']
  });
});
add('hard', '반복 부분적분', 'ln(x)^2', 'x*ln(x)^2-2x*ln(x)+2x', {
  domain: D.pos,
  hints: ['$dv=dx$ 로 두고 부분적분한다.', '남는 적분이 $2\\int\\ln x\\,dx$ 다.'],
  steps: ['$u=(\\ln x)^{2},\\;dv=dx$', '$x(\\ln x)^{2}-2\\int\\ln x\\,dx$', '$=x(\\ln x)^{2}-2x\\ln x+2x$']
});

// 순환 부분적분 (일반 계수)
[[1, 2], [2, 1], [2, 3], [3, 2], [-1, 1], [1, 3]].forEach(function (q) {
  var a = q[0], b = q[1], den = a * a + b * b;
  add('hard', '순환 부분적분', 'e^(' + K(a) + ')sin(' + K(b) + ')',
      'e^(' + K(a) + ')*(' + K(a, 'sin(' + K(b) + ')') + ' - ' + K(b, 'cos(' + K(b) + ')') + ')/' + den, {
    domain: [0.05, 1.6],
    hints: ['부분적분 두 번 뒤 원래 적분 $I$ 가 다시 나온다.',
            '분모는 $' + (a * a) + '+' + (b * b) + '=' + den + '$ 이 된다.'],
    steps: ['$I=\\int e^{' + K(a) + '}\\sin ' + K(b) + '\\,dx$',
            '두 번 부분적분해 $I$ 에 대한 방정식을 세운다',
            '$I = ' + M.latexOf('e^(' + K(a) + ')*(' + K(a, 'sin(' + K(b) + ')') + ' - ' + K(b, 'cos(' + K(b) + ')') + ')/' + den) + '$']
  });
  add('hard', '순환 부분적분', 'e^(' + K(a) + ')cos(' + K(b) + ')',
      'e^(' + K(a) + ')*(' + K(a, 'cos(' + K(b) + ')') + ' + ' + K(b, 'sin(' + K(b) + ')') + ')/' + den, {
    domain: [0.05, 1.6],
    hints: ['$\\sin$ 일 때와 같은 방법이다.', '분모는 똑같이 $' + den + '$ 이다.'],
    steps: ['$I=\\int e^{' + K(a) + '}\\cos ' + K(b) + '\\,dx$',
            '$I = ' + M.latexOf('e^(' + K(a) + ')*(' + K(a, 'cos(' + K(b) + ')') + ' + ' + K(b, 'sin(' + K(b) + ')') + ')/' + den) + '$']
  });
});

// 치환 후 부분적분
add('hard', '치환+부분적분', 'sin(ln(x))', 'x*(sin(ln(x))-cos(ln(x)))/2', {
  domain: [0.3, 4.0],
  hints: ['$t=\\ln x$ 로 두면 $\\int e^{t}\\sin t\\,dt$ 가 된다.', '순환 부분적분 결과를 되돌린다.'],
  steps: ['$t=\\ln x,\\;dx=e^{t}dt$', '$\\int e^{t}\\sin t\\,dt=\\dfrac{e^{t}(\\sin t-\\cos t)}{2}$']
});
add('hard', '치환+부분적분', 'cos(ln(x))', 'x*(sin(ln(x))+cos(ln(x)))/2', {
  domain: [0.3, 4.0],
  hints: ['$t=\\ln x$ 치환 후 $\\int e^{t}\\cos t\\,dt$ 다.', '$\\sin(\\ln x)$ 문제와 짝을 이룬다.'],
  steps: ['$t=\\ln x$', '$\\int e^{t}\\cos t\\,dt=\\dfrac{e^{t}(\\sin t+\\cos t)}{2}$']
});
add('hard', '치환+부분적분', 'e^(sqrt(x))', '2*e^(sqrt(x))*(sqrt(x)-1)', {
  domain: [0.2, 3.0],
  hints: ['$t=\\sqrt{x},\\;dx=2t\\,dt$ 로 치환한다.', '남은 $\\int te^{t}dt$ 는 부분적분이다.'],
  steps: ['$t=\\sqrt{x},\\;dx=2t\\,dt$', '$2\\int te^{t}dt=2(t-1)e^{t}$']
});

// 유리화 치환
add('hard', '유리화 치환', 'sqrt(x)/(1+x)', '2sqrt(x)-2atan(sqrt(x))', {
  domain: [0.2, 4.0],
  hints: ['$t=\\sqrt{x}$ 로 두면 $dx=2t\\,dt$ 다.', '$\\dfrac{t^{2}}{1+t^{2}}=1-\\dfrac{1}{1+t^{2}}$'],
  steps: ['$t=\\sqrt{x}$', '$2\\int\\dfrac{t^{2}}{1+t^{2}}dt=2t-2\\arctan t$']
});
add('hard', '유리화 치환', '1/(1+sqrt(x))', '2sqrt(x)-2ln(1+sqrt(x))', {
  domain: [0.2, 4.0],
  hints: ['$t=\\sqrt{x}$ 로 치환한다.', '$\\dfrac{t}{1+t}=1-\\dfrac{1}{1+t}$ 로 나눈다.'],
  steps: ['$t=\\sqrt{x},\\;dx=2t\\,dt$', '$2\\int\\dfrac{t}{1+t}dt=2t-2\\ln(1+t)$']
});
add('hard', '유리화 치환', '1/(sqrt(x)*(1+x))', '2atan(sqrt(x))', {
  domain: [0.2, 4.0],
  hints: ['$t=\\sqrt{x}$ 로 두면 $\\dfrac{dx}{\\sqrt{x}}=2dt$ 다.', '남는 적분이 곧바로 $\\arctan$ 이다.'],
  steps: ['$t=\\sqrt{x}$', '$2\\int\\dfrac{dt}{1+t^{2}}=2\\arctan\\sqrt{x}$']
});

// 지수 유리식
add('hard', '지수 유리식', '1/(1+e^x)', 'x-ln(1+e^x)', {
  domain: [-1.5, 2.0],
  hints: ['$\\dfrac{1}{1+e^{x}}=1-\\dfrac{e^{x}}{1+e^{x}}$ 로 쪼갠다.', '두 번째 항은 로그다.'],
  steps: ['$\\dfrac{1}{1+e^{x}}=1-\\dfrac{e^{x}}{1+e^{x}}$', '$\\int = x-\\ln(1+e^{x})$']
});
add('hard', '지수 유리식', '1/(e^x+e^(-x))', 'atan(e^x)', {
  domain: [-1.5, 1.8],
  hints: ['분모·분자에 $e^{x}$ 를 곱한다.', '$u=e^{x}$ 로 두면 $\\arctan$ 이 된다.'],
  steps: ['$\\dfrac{e^{x}}{e^{2x}+1}$', '$u=e^{x}:\\;\\int\\dfrac{du}{1+u^{2}}$']
});
add('hard', '지수 유리식', 'e^x/(e^(2x)-1)', 'ln(e^x-1)/2-ln(e^x+1)/2', {
  domain: [0.35, 2.0], lnAbs: true,
  hints: ['$u=e^{x}$ 로 두면 $\\int\\dfrac{du}{u^{2}-1}$ 이다.', '부분분수로 분해한다.'],
  steps: ['$u=e^{x}$', '$\\int\\dfrac{du}{u^{2}-1}=\\dfrac{1}{2}\\ln\\left|\\dfrac{u-1}{u+1}\\right|$']
});

// 역함수 부분적분
add('hard', '부분적분', 'x*atan(x)', '(x^2+1)*atan(x)/2-x/2', {
  domain: [0.1, 2.5],
  hints: ['$v=\\dfrac{x^{2}+1}{2}$ 로 잡으면 계산이 깔끔해진다.', '적분상수를 $v$ 에 넣는 기술이다.'],
  steps: ['$u=\\arctan x,\\;v=\\dfrac{x^{2}+1}{2}$', '$\\dfrac{(x^{2}+1)\\arctan x}{2}-\\int\\dfrac{1}{2}dx$']
});
add('hard', '부분적분', 'x*asin(x)', '(2x^2-1)*asin(x)/4+x*sqrt(1-x^2)/4', {
  domain: D.unit,
  hints: ['$u=\\arcsin x,\\;dv=x\\,dx$ 로 둔다.', '남는 적분에 삼각치환이 필요하다.'],
  steps: ['$u=\\arcsin x,\\;v=\\dfrac{x^{2}}{2}$',
          '$\\dfrac{x^{2}\\arcsin x}{2}-\\dfrac{1}{2}\\int\\dfrac{x^{2}}{\\sqrt{1-x^{2}}}dx$']
});
add('hard', '부분적분', 'asin(x)', 'x*asin(x)+sqrt(1-x^2)', {
  domain: D.unit,
  hints: ['$dv=dx$ 로 두는 유형이다.', '$du=\\dfrac{dx}{\\sqrt{1-x^{2}}}$'],
  steps: ['$u=\\arcsin x,\\;dv=dx$', '$x\\arcsin x-\\int\\dfrac{x}{\\sqrt{1-x^{2}}}dx$']
});
add('hard', '부분적분', 'acos(x)', 'x*acos(x)-sqrt(1-x^2)', {
  domain: D.unit,
  hints: ['$\\arcsin$ 일 때와 부호만 다르다.', '$du=-\\dfrac{dx}{\\sqrt{1-x^{2}}}$'],
  steps: ['$u=\\arccos x,\\;dv=dx$', '$x\\arccos x+\\int\\dfrac{x}{\\sqrt{1-x^{2}}}dx$']
});
[1, 2, 3].forEach(function (a) {
  add('hard', '부분적분', 'ln(x^2+' + (a * a) + ')', 'x*ln(x^2+' + (a * a) + ')-2x+' + (2 * a) + '*atan(' + X(a) + ')', {
    domain: [0.1, 2.5],
    hints: ['$dv=dx$ 로 두고 부분적분한다.',
            '남는 $\\int\\dfrac{2x^{2}}{x^{2}+' + (a * a) + '}dx$ 를 나눗셈으로 정리한다.'],
    steps: ['$u=\\ln(x^{2}+' + (a * a) + '),\\;dv=dx$',
            '$\\dfrac{2x^{2}}{x^{2}+' + (a * a) + '}=2-\\dfrac{' + (2 * a * a) + '}{x^{2}+' + (a * a) + '}$']
  });
});

// 치환 (근호 안 다항식)
[1, 4, 9].forEach(function (a) {
  add('hard', '치환적분', 'x^3/sqrt(x^2+' + a + ')', '(x^2+' + a + ')^(3/2)/3-' + a + '*sqrt(x^2+' + a + ')', {
    domain: [0.1, 2.5],
    hints: ['$u=x^{2}+' + a + '$ 이면 $x^{2}=u-' + a + '$ 다.', '$\\dfrac{1}{2}\\int\\dfrac{u-' + a + '}{\\sqrt{u}}du$ 를 계산한다.'],
    steps: ['$u=x^{2}+' + a + ',\\;du=2x\\,dx$', '$\\dfrac{1}{2}\\int (u^{1/2}-' + a + 'u^{-1/2})du$']
  });
  add('hard', '치환적분', 'x/(x^4+' + (a * a) + ')', C(1, 2 * a, 'atan(x^2/' + a + ')'), {
    domain: [0.1, 2.5],
    hints: ['$x^{4}=(x^{2})^{2}$ 이므로 $u=x^{2}$ 로 둔다.', '$du=2x\\,dx$ 가 분자와 맞는다.'],
    steps: ['$u=x^{2},\\;du=2x\\,dx$', '$\\dfrac{1}{2}\\int\\dfrac{du}{u^{2}+' + (a * a) + '}$']
  });
});

// 쌍곡선함수 (어려움)
[1, 2].forEach(function (k) {
  add('hard', '쌍곡선함수', 'sech(' + K(k) + ')', C(1, k, 'atan(sinh(' + K(k) + '))'), {
    domain: D.hyp,
    hints: ['$\\operatorname{sech}u=\\dfrac{\\cosh u}{\\cosh^{2}u}=\\dfrac{\\cosh u}{1+\\sinh^{2}u}$',
            '$t=\\sinh ' + K(k) + '$ 로 치환하면 $\\arctan$ 이 나온다.'],
    steps: ['$\\operatorname{sech}' + K(k) + ' = \\dfrac{\\cosh ' + K(k) + '}{1+\\sinh^{2}' + K(k) + '}$',
            '$t=\\sinh ' + K(k) + '$', '$= ' + M.latexOf(C(1, k, 'atan(sinh(' + K(k) + '))')) + '$']
  });
  add('hard', '쌍곡선 홀수차', 'sinh(' + K(k) + ')^3',
      S(C(1, 3 * k, 'cosh(' + K(k) + ')^3'), C(-1, k, 'cosh(' + K(k) + ')')), {
    domain: D.hyp,
    hints: ['$\\sinh^{3}u=\\sinh u(\\cosh^{2}u-1)$', '삼각함수와 달리 $\\cosh^{2}-\\sinh^{2}=1$ 이다.'],
    steps: ['$\\sinh^{3}' + K(k) + ' = (\\cosh^{2}-1)\\sinh$',
            '$= ' + M.latexOf(S(C(1, 3 * k, 'cosh(' + K(k) + ')^3'), C(-1, k, 'cosh(' + K(k) + ')'))) + '$']
  });
  add('hard', '쌍곡선 홀수차', 'cosh(' + K(k) + ')^3',
      S(C(1, k, 'sinh(' + K(k) + ')'), C(1, 3 * k, 'sinh(' + K(k) + ')^3')), {
    domain: D.hyp,
    hints: ['$\\cosh^{3}u=\\cosh u(1+\\sinh^{2}u)$', '$t=\\sinh ' + K(k) + '$ 로 치환한다.'],
    steps: ['$\\cosh^{3}' + K(k) + ' = (1+\\sinh^{2})\\cosh$',
            '$= ' + M.latexOf(S(C(1, k, 'sinh(' + K(k) + ')'), C(1, 3 * k, 'sinh(' + K(k) + ')^3'))) + '$']
  });
  add('hard', '쌍곡선 홀수차', 'tanh(' + K(k) + ')^3',
      S(C(1, k, 'ln(cosh(' + K(k) + '))'), C(-1, 2 * k, 'tanh(' + K(k) + ')^2')), {
    domain: D.hyp,
    hints: ['$\\tanh^{3}u=\\tanh u(1-\\operatorname{sech}^{2}u)$', '$\\tan^{3}$ 문제와 부호가 반대다.'],
    steps: ['$\\tanh^{3}' + K(k) + ' = \\tanh-\\tanh\\operatorname{sech}^{2}$',
            '$= ' + M.latexOf(S(C(1, k, 'ln(cosh(' + K(k) + '))'), C(-1, 2 * k, 'tanh(' + K(k) + ')^2'))) + '$']
  });
});
add('hard', '쌍곡선함수', 'sech(x)^3', '(sech(x)tanh(x)+atan(sinh(x)))/2', {
  domain: D.hyp,
  hints: ['$\\sec^{3}$ 와 같은 구조로 부분적분한다.', '$\\int\\operatorname{sech}x\\,dx=\\arctan(\\sinh x)$ 가 다시 나온다.'],
  steps: ['$I=\\int\\operatorname{sech}^{3}x\\,dx$', '$2I=\\operatorname{sech}x\\tanh x+\\arctan(\\sinh x)$']
});
add('hard', '반복 부분적분', 'x^2*sinh(x)', 'x^2*cosh(x)-2x*sinh(x)+2cosh(x)', {
  domain: D.hyp,
  hints: ['부분적분을 두 번 한다.', '삼각함수와 달리 부호가 계속 $+$ 로 간다.'],
  steps: ['$u=x^{2},\\;dv=\\sinh x\\,dx$', '$x^{2}\\cosh x-2\\int x\\cosh x\\,dx$']
});
add('hard', '반복 부분적분', 'x^2*cosh(x)', 'x^2*sinh(x)-2x*cosh(x)+2sinh(x)', {
  domain: D.hyp,
  hints: ['$u=x^{2},\\;dv=\\cosh x\\,dx$', '두 번 부분적분한다.'],
  steps: ['$u=x^{2},\\;v=\\sinh x$', '$x^{2}\\sinh x-2\\int x\\sinh x\\,dx$']
});
add('hard', '역쌍곡선함수', 'asinh(x)', 'x*asinh(x)-sqrt(x^2+1)', {
  domain: [0.1, 2.5],
  hints: ['$dv=dx$ 로 두고 부분적분한다.', '$\\dfrac{d}{dx}\\operatorname{arsinh}x=\\dfrac{1}{\\sqrt{x^{2}+1}}$'],
  steps: ['$u=\\operatorname{arsinh}x,\\;dv=dx$', '$x\\operatorname{arsinh}x-\\int\\dfrac{x}{\\sqrt{x^{2}+1}}dx$']
});
add('hard', '역쌍곡선함수', 'atanh(x)', 'x*atanh(x)+ln(1-x^2)/2', {
  domain: [-0.7, 0.7],
  hints: ['$dv=dx$ 로 두고 부분적분한다.', '$\\dfrac{d}{dx}\\operatorname{artanh}x=\\dfrac{1}{1-x^{2}}$'],
  steps: ['$u=\\operatorname{artanh}x,\\;dv=dx$', '$x\\operatorname{artanh}x-\\int\\dfrac{x}{1-x^{2}}dx$']
});
add('hard', '역쌍곡선함수', 'ln(x+sqrt(x^2+1))', 'x*asinh(x)-sqrt(x^2+1)', {
  domain: [0.1, 2.5],
  hints: ['$\\ln(x+\\sqrt{x^{2}+1})=\\operatorname{arsinh}x$ 임을 먼저 알아본다.', '그다음은 부분적분이다.'],
  steps: ['$\\ln(x+\\sqrt{x^{2}+1})=\\operatorname{arsinh}x$',
          '$\\int\\operatorname{arsinh}x\\,dx=x\\operatorname{arsinh}x-\\sqrt{x^{2}+1}$']
});
[[2, 1], [3, 1], [3, 2], [1, 2]].forEach(function (q) {
  var a = q[0], b = q[1], den = a * a - b * b;
  add('hard', '쌍곡선함수', 'e^(' + K(a) + ')sinh(' + K(b) + ')',
      'e^(' + K(a) + ')*(' + K(a, 'sinh(' + K(b) + ')') + ' - ' + K(b, 'cosh(' + K(b) + ')') + ')/' + den, {
    domain: [0.05, 1.3],
    hints: ['$\\sinh$ 를 지수로 풀어써도 되고 순환 부분적분을 써도 된다.',
            '분모는 $' + (a * a) + '-' + (b * b) + '=' + den + '$ 이다.'],
    steps: ['$\\sinh ' + K(b) + ' = \\dfrac{e^{' + K(b) + '}-e^{-' + K(b) + '}}{2}$',
            '항별로 지수적분한 뒤 정리한다',
            '$= ' + M.latexOf('e^(' + K(a) + ')*(' + K(a, 'sinh(' + K(b) + ')') + ' - ' + K(b, 'cosh(' + K(b) + ')') + ')/' + den) + '$']
  });
});

// 삼각 유리식
add('hard', '삼각 유리식', '1/(1+sin(x))', 'tan(x)-sec(x)', {
  domain: [0.2, 1.2],
  hints: ['분모·분자에 $1-\\sin x$ 를 곱한다.', '$\\dfrac{1-\\sin x}{\\cos^{2}x}$ 로 정리된다.'],
  steps: ['$\\dfrac{1}{1+\\sin x}\\cdot\\dfrac{1-\\sin x}{1-\\sin x}=\\dfrac{1-\\sin x}{\\cos^{2}x}$',
          '$= \\sec^{2}x-\\sec x\\tan x$']
});
add('hard', '삼각 유리식', '1/(1-sin(x))', 'tan(x)+sec(x)', {
  domain: [0.2, 1.2],
  hints: ['$1+\\sin x$ 를 곱한다.', '부호만 다르고 요령은 같다.'],
  steps: ['$\\dfrac{1+\\sin x}{\\cos^{2}x}=\\sec^{2}x+\\sec x\\tan x$']
});
add('hard', '삼각 유리식', '1/(1+cos(x))', 'tan(x/2)', {
  domain: [0.2, 2.4],
  hints: ['반각공식 $1+\\cos x=2\\cos^{2}\\dfrac{x}{2}$ 를 쓴다.', '$\\dfrac{1}{2}\\sec^{2}\\dfrac{x}{2}$ 가 된다.'],
  steps: ['$1+\\cos x = 2\\cos^{2}\\dfrac{x}{2}$', '$\\dfrac{1}{2}\\int\\sec^{2}\\dfrac{x}{2}dx=\\tan\\dfrac{x}{2}$']
});
add('hard', '삼각 유리식', '1/(1-cos(x))', '-cot(x/2)', {
  domain: [0.4, 2.6],
  hints: ['$1-\\cos x=2\\sin^{2}\\dfrac{x}{2}$ 를 쓴다.', '$\\csc^{2}$ 적분이 된다.'],
  steps: ['$1-\\cos x = 2\\sin^{2}\\dfrac{x}{2}$', '$\\dfrac{1}{2}\\int\\csc^{2}\\dfrac{x}{2}dx=-\\cot\\dfrac{x}{2}$']
});
add('hard', '삼각 유리식', '1/(sin(x)cos(x))', 'ln(tan(x))', {
  domain: [0.3, 1.2], lnAbs: true,
  hints: ['분모·분자에 $\\dfrac{1}{\\cos^{2}x}$ 를 곱해 본다.', '$\\dfrac{\\sec^{2}x}{\\tan x}$ 형태가 된다.'],
  steps: ['$\\dfrac{1}{\\sin x\\cos x}=\\dfrac{\\sec^{2}x}{\\tan x}$', '$u=\\tan x$', '$\\ln|\\tan x|$']
});

// 곱-합 공식
[[2, 1], [3, 1], [3, 2], [4, 1], [5, 2]].forEach(function (q) {
  var a = q[0], b = q[1], m = a - b, pl = a + b;
  add('hard', '곱-합 공식', 'sin(' + K(a) + ')cos(' + K(b) + ')',
      S(C(-1, 2 * m, 'cos(' + K(m) + ')'), C(-1, 2 * pl, 'cos(' + K(pl) + ')')), {
    domain: D.trigW,
    hints: ['$\\sin A\\cos B=\\dfrac{\\sin(A-B)+\\sin(A+B)}{2}$',
            '각이 $' + K(m) + '$ 와 $' + K(pl) + '$ 로 갈라진다.'],
    steps: ['$\\sin ' + K(a) + '\\cos ' + K(b) + ' = \\dfrac{\\sin ' + K(m) + '+\\sin ' + K(pl) + '}{2}$',
            '$= ' + M.latexOf(S(C(-1, 2 * m, 'cos(' + K(m) + ')'), C(-1, 2 * pl, 'cos(' + K(pl) + ')'))) + '$']
  });
  add('hard', '곱-합 공식', 'sin(' + K(a) + ')sin(' + K(b) + ')',
      S(C(1, 2 * m, 'sin(' + K(m) + ')'), C(-1, 2 * pl, 'sin(' + K(pl) + ')')), {
    domain: D.trigW,
    hints: ['$\\sin A\\sin B=\\dfrac{\\cos(A-B)-\\cos(A+B)}{2}$', '두 항을 따로 적분한다.'],
    steps: ['$\\sin ' + K(a) + '\\sin ' + K(b) + ' = \\dfrac{\\cos ' + K(m) + '-\\cos ' + K(pl) + '}{2}$',
            '$= ' + M.latexOf(S(C(1, 2 * m, 'sin(' + K(m) + ')'), C(-1, 2 * pl, 'sin(' + K(pl) + ')'))) + '$']
  });
  add('hard', '곱-합 공식', 'cos(' + K(a) + ')cos(' + K(b) + ')',
      S(C(1, 2 * m, 'sin(' + K(m) + ')'), C(1, 2 * pl, 'sin(' + K(pl) + ')')), {
    domain: D.trigW,
    hints: ['$\\cos A\\cos B=\\dfrac{\\cos(A-B)+\\cos(A+B)}{2}$', '$\\sin\\sin$ 과 부호만 다르다.'],
    steps: ['$\\cos ' + K(a) + '\\cos ' + K(b) + ' = \\dfrac{\\cos ' + K(m) + '+\\cos ' + K(pl) + '}{2}$',
            '$= ' + M.latexOf(S(C(1, 2 * m, 'sin(' + K(m) + ')'), C(1, 2 * pl, 'sin(' + K(pl) + ')'))) + '$']
  });
});

// ================================================================== 몬스터

// x^4 ± 1 계열
add('monster', '4차 유리식', '(x^2+1)/(x^4+1)', 'atan((x^2-1)/(sqrt(2)x))/sqrt(2)', {
  domain: [0.25, 2.6],
  hints: ['분자·분모를 $x^{2}$ 로 나누면 $\\dfrac{1+1/x^{2}}{x^{2}+1/x^{2}}$ 가 된다.',
          '$u=x-\\dfrac{1}{x}$ 로 두면 $du=\\left(1+\\dfrac{1}{x^{2}}\\right)dx$ 이고 분모는 $u^{2}+2$ 다.'],
  steps: ['$\\dfrac{x^{2}+1}{x^{4}+1}=\\dfrac{1+x^{-2}}{x^{2}+x^{-2}}$',
          '$u=x-\\dfrac{1}{x},\\; x^{2}+x^{-2}=u^{2}+2$',
          '$\\int\\dfrac{du}{u^{2}+2}=\\dfrac{1}{\\sqrt2}\\arctan\\dfrac{u}{\\sqrt2}$']
});
add('monster', '4차 유리식', '(x^2-1)/(x^4+1)',
    'ln((x^2-sqrt(2)x+1)/(x^2+sqrt(2)x+1))/(2sqrt(2))', {
  domain: [0.25, 2.6],
  hints: ['이번엔 $u=x+\\dfrac{1}{x}$ 로 두면 분모가 $u^{2}-2$ 가 된다.', '결과는 $\\arctan$ 이 아니라 로그다.'],
  steps: ['$\\dfrac{x^{2}-1}{x^{4}+1}=\\dfrac{1-x^{-2}}{x^{2}+x^{-2}}$',
          '$u=x+\\dfrac{1}{x},\\; x^{2}+x^{-2}=u^{2}-2$',
          '$\\int\\dfrac{du}{u^{2}-2}=\\dfrac{1}{2\\sqrt2}\\ln\\left|\\dfrac{u-\\sqrt2}{u+\\sqrt2}\\right|$']
});
add('monster', '4차 유리식', '1/(x^4+1)',
    'atan((x^2-1)/(sqrt(2)x))/(2sqrt(2)) - ln((x^2-sqrt(2)x+1)/(x^2+sqrt(2)x+1))/(4sqrt(2))', {
  domain: [0.25, 2.6],
  hints: ['$1=\\dfrac{(x^{2}+1)-(x^{2}-1)}{2}$ 로 쪼개면 앞의 두 문제로 환원된다.',
          '$x^{4}+1=(x^{2}-\\sqrt2 x+1)(x^{2}+\\sqrt2 x+1)$ 인수분해를 써도 된다.'],
  steps: ['$\\dfrac{1}{x^{4}+1}=\\dfrac{1}{2}\\cdot\\dfrac{x^{2}+1}{x^{4}+1}-\\dfrac{1}{2}\\cdot\\dfrac{x^{2}-1}{x^{4}+1}$',
          '각각 $u=x\\mp\\dfrac{1}{x}$ 치환으로 계산한다',
          '$\\arctan$ 항과 로그 항이 함께 나온다']
});
add('monster', '4차 유리식', 'x^2/(x^4+1)',
    'atan((x^2-1)/(sqrt(2)x))/(2sqrt(2)) + ln((x^2-sqrt(2)x+1)/(x^2+sqrt(2)x+1))/(4sqrt(2))', {
  domain: [0.25, 2.6],
  hints: ['$x^{2}=\\dfrac{(x^{2}+1)+(x^{2}-1)}{2}$ 로 쪼갠다.', '$\\dfrac{1}{x^{4}+1}$ 문제와 부호 하나만 다르다.'],
  steps: ['$\\dfrac{x^{2}}{x^{4}+1}=\\dfrac{1}{2}\\left(\\dfrac{x^{2}+1}{x^{4}+1}+\\dfrac{x^{2}-1}{x^{4}+1}\\right)$',
          '두 결과를 더한다']
});
add('monster', '4차 유리식', '1/(x^4-1)', 'ln((x-1)/(x+1))/4 - atan(x)/2', {
  domain: [1.4, 3.4], lnAbs: true,
  hints: ['$x^{4}-1=(x^{2}-1)(x^{2}+1)$ 로 인수분해한다.',
          '$\\dfrac{1}{x^{4}-1}=\\dfrac{1}{2}\\left(\\dfrac{1}{x^{2}-1}-\\dfrac{1}{x^{2}+1}\\right)$'],
  steps: ['$\\dfrac{1}{x^{4}-1}=\\dfrac{1}{2}\\left(\\dfrac{1}{x^{2}-1}-\\dfrac{1}{x^{2}+1}\\right)$',
          '$\\int\\dfrac{dx}{x^{2}-1}=\\dfrac{1}{2}\\ln\\left|\\dfrac{x-1}{x+1}\\right|$']
});
add('hard', '치환적분', 'x/(x^4+2x^2+2)', 'atan(x^2+1)/2', {
  domain: [0.1, 2.5],
  hints: ['분모를 $(x^{2}+1)^{2}+1$ 로 완전제곱한다.', '$u=x^{2}+1$ 로 두면 $\\arctan$ 이 된다.'],
  steps: ['$x^{4}+2x^{2}+2=(x^{2}+1)^{2}+1$', '$u=x^{2}+1,\\;du=2x\\,dx$',
          '$\\dfrac{1}{2}\\int\\dfrac{du}{u^{2}+1}=\\dfrac{\\arctan(x^{2}+1)}{2}$']
});
[2, 3, 4].forEach(function (n) {
  add('hard', '유리식 치환', '1/(x*(x^' + n + '+1))', '(ln(x^' + n + ')-ln(x^' + n + '+1))/' + n, {
    domain: [0.35, 2.6], lnAbs: true,
    hints: ['분자·분모에 $x^{' + (n - 1) + '}$ 을 곱해 $u=x^{' + n + '}$ 를 만든다.',
            '$\\dfrac{1}{u(u+1)}=\\dfrac{1}{u}-\\dfrac{1}{u+1}$'],
    steps: ['$\\dfrac{x^{' + (n - 1) + '}}{x^{' + n + '}(x^{' + n + '}+1)}$', '$u=x^{' + n + '}$',
            '$\\dfrac{1}{' + n + '}\\ln\\left|\\dfrac{x^{' + n + '}}{x^{' + n + '}+1}\\right|$']
  });
});

// 고차 삼각함수
add('monster', '삼각함수 고차', 'sec(x)^5',
    'sec(x)^3*tan(x)/4 + 3*sec(x)tan(x)/8 + 3*ln(sec(x)+tan(x))/8', {
  domain: D.trig, lnAbs: true,
  hints: ['점화식 $\\int\\sec^{n}=\\dfrac{\\sec^{n-2}\\tan}{n-1}+\\dfrac{n-2}{n-1}\\int\\sec^{n-2}$ 를 쓴다.',
          '$\\int\\sec^{3}$ 를 거쳐 $\\int\\sec$ 까지 내려간다.'],
  steps: ['$\\int\\sec^{5}=\\dfrac{\\sec^{3}\\tan}{4}+\\dfrac{3}{4}\\int\\sec^{3}$',
          '$\\int\\sec^{3}=\\dfrac{\\sec\\tan+\\ln|\\sec+\\tan|}{2}$',
          '두 결과를 합친다']
});
add('monster', '삼각함수 고차', 'tan(x)^5', 'tan(x)^4/4 - tan(x)^2/2 - ln(cos(x))', {
  domain: D.trig, lnAbs: true,
  hints: ['$\\tan^{5}=\\tan^{3}(\\sec^{2}-1)$ 로 두 단계 내린다.', '마지막에 $\\int\\tan x\\,dx$ 가 남는다.'],
  steps: ['$\\int\\tan^{5}=\\dfrac{\\tan^{4}}{4}-\\int\\tan^{3}$',
          '$\\int\\tan^{3}=\\dfrac{\\tan^{2}}{2}+\\ln|\\cos x|$']
});
add('monster', '삼각함수 짝수차', 'sin(x)^4', '3x/8 - sin(2x)/4 + sin(4x)/32', {
  domain: D.trigW,
  hints: ['반각공식을 두 번 적용한다.', '$\\sin^{4}=\\left(\\dfrac{1-\\cos 2x}{2}\\right)^{2}$ 에서 $\\cos^{2}2x$ 를 또 내린다.'],
  steps: ['$\\sin^{4}x=\\dfrac{1-2\\cos 2x+\\cos^{2}2x}{4}$',
          '$\\cos^{2}2x=\\dfrac{1+\\cos 4x}{2}$', '$=\\dfrac{3}{8}-\\dfrac{\\cos 2x}{2}+\\dfrac{\\cos 4x}{8}$']
});
add('monster', '삼각함수 짝수차', 'cos(x)^4', '3x/8 + sin(2x)/4 + sin(4x)/32', {
  domain: D.trigW,
  hints: ['$\\cos^{4}=\\left(\\dfrac{1+\\cos 2x}{2}\\right)^{2}$ 로 시작한다.', '$\\sin^{4}$ 와 가운데 항의 부호만 다르다.'],
  steps: ['$\\cos^{4}x=\\dfrac{1+2\\cos 2x+\\cos^{2}2x}{4}$', '$=\\dfrac{3}{8}+\\dfrac{\\cos 2x}{2}+\\dfrac{\\cos 4x}{8}$']
});
add('hard', '삼각함수 홀수차', 'sin(x)^5', '-cos(x)+2cos(x)^3/3-cos(x)^5/5', {
  domain: D.trigW,
  hints: ['$\\sin^{5}=\\sin x(1-\\cos^{2}x)^{2}$ 로 쓴다.', '$u=\\cos x$ 치환 후 전개한다.'],
  steps: ['$\\sin^{5}x=(1-\\cos^{2}x)^{2}\\sin x$', '$u=\\cos x:\\;-\\int(1-u^{2})^{2}du$']
});
add('hard', '삼각함수 홀수차', 'cos(x)^5', 'sin(x)-2sin(x)^3/3+sin(x)^5/5', {
  domain: D.trigW,
  hints: ['$\\cos^{5}=\\cos x(1-\\sin^{2}x)^{2}$ 로 쓴다.', '$u=\\sin x$ 로 치환한다.'],
  steps: ['$\\cos^{5}x=(1-\\sin^{2}x)^{2}\\cos x$', '$u=\\sin x:\\;\\int(1-u^{2})^{2}du$']
});
add('monster', '삼각 유리식', '1/(sin(x)^4+cos(x)^4)', 'atan((tan(x)-cot(x))/sqrt(2))/sqrt(2)', {
  domain: [0.25, 1.3],
  hints: ['분자·분모를 $\\cos^{4}x$ 로 나눠 $\\tan$ 만 남긴다.',
          '$t=\\tan x-\\cot x$ 로 두면 분모가 $t^{2}+2$ 가 된다.'],
  steps: ['$\\sin^{4}+\\cos^{4}=1-\\dfrac{\\sin^{2}2x}{2}$',
          '$\\tan$ 로 정리한 뒤 $t=\\tan x-\\cot x$ 치환', '$\\int\\dfrac{dt}{t^{2}+2}$']
});
add('monster', '삼각 유리식', 'sqrt(tan(x))',
    '(atan((tan(x)-1)/sqrt(2tan(x))) + ln((tan(x)-sqrt(2tan(x))+1)/(tan(x)+sqrt(2tan(x))+1))/2)/sqrt(2)', {
  domain: [0.25, 1.2],
  hints: ['$t=\\sqrt{\\tan x}$ 로 두면 $dx=\\dfrac{2t\\,dt}{1+t^{4}}$ 가 된다.',
          '결국 $\\int\\dfrac{2t^{2}}{1+t^{4}}dt$ 로, $x^{4}+1$ 유리식 문제가 된다.'],
  steps: ['$t=\\sqrt{\\tan x},\\;x=\\arctan t^{2}$', '$\\int\\dfrac{2t^{2}}{1+t^{4}}dt$',
          '$u=t\\mp\\dfrac{1}{t}$ 치환으로 $\\arctan$ 항과 로그 항이 나온다']
});
add('monster', '삼각 유리식', 'sin(x)/(sin(x)+cos(x))', 'x/2 - ln(sin(x)+cos(x))/2', {
  domain: [0.2, 1.2], lnAbs: true,
  hints: ['$\\sin x=\\dfrac{(\\sin+\\cos)-(\\cos-\\sin)}{2}$ 로 쪼갠다.',
          '$\\cos x-\\sin x$ 는 분모의 도함수다.'],
  steps: ['$\\dfrac{\\sin}{\\sin+\\cos}=\\dfrac{1}{2}-\\dfrac{1}{2}\\cdot\\dfrac{\\cos-\\sin}{\\sin+\\cos}$',
          '$\\int\\dfrac{\\cos-\\sin}{\\sin+\\cos}dx=\\ln|\\sin x+\\cos x|$']
});
[[2, 1, 3], [3, 2, 5], [5, 3, 16], [5, 4, 9]].forEach(function (q) {
  var a = q[0], b = q[1], d = q[2];             // d = a^2-b^2
  add('monster', '바이어슈트라스 치환', '1/(' + a + '+' + K(b, 'cos(x)') + ')',
      '2*atan(' + SQ(a - b, a + b) + '*tan(x/2))/' + SQ(d), {
    domain: [0.2, 2.4],
    hints: ['$t=\\tan\\dfrac{x}{2}$ 로 두면 $\\cos x=\\dfrac{1-t^{2}}{1+t^{2}},\\;dx=\\dfrac{2dt}{1+t^{2}}$ 다.',
            '정리하면 $\\int\\dfrac{2\\,dt}{' + (a + b) + '+' + (a - b) + 't^{2}}$ 가 된다.'],
    steps: ['$t=\\tan\\dfrac{x}{2}$',
            '$\\int\\dfrac{2\\,dt}{(' + a + '+' + b + ')+(' + a + '-' + b + ')t^{2}}$',
            '$= \\dfrac{2}{\\sqrt{' + d + '}}\\arctan\\left(\\sqrt{\\dfrac{' + (a - b) + '}{' + (a + b) + '}}\\,t\\right)$']
  });
});

// 반복 부분적분 (고차)
add('monster', '반복 부분적분', 'x^3*e^x', '(x^3-3x^2+6x-6)*e^x', {
  domain: D.all,
  hints: ['부분적분을 세 번 한다.', '계수가 $3!,\\;3\\cdot 2,\\;\\ldots$ 로 떨어지는 규칙을 본다.'],
  steps: ['$\\int x^{3}e^{x}=x^{3}e^{x}-3\\int x^{2}e^{x}$', '$\\int x^{2}e^{x}=(x^{2}-2x+2)e^{x}$',
          '$=(x^{3}-3x^{2}+6x-6)e^{x}$']
});
add('monster', '반복 부분적분', 'x^4*e^x', '(x^4-4x^3+12x^2-24x+24)*e^x', {
  domain: D.all,
  hints: ['부분적분을 네 번 한다.', '표(tabular) 방식으로 정리하면 실수가 줄어든다.'],
  steps: ['$\\int x^{4}e^{x}=x^{4}e^{x}-4\\int x^{3}e^{x}$', '$\\int x^{3}e^{x}=(x^{3}-3x^{2}+6x-6)e^{x}$',
          '$=(x^{4}-4x^{3}+12x^{2}-24x+24)e^{x}$']
});
add('monster', '반복 부분적분', 'x^3*sin(x)', '-x^3*cos(x)+3x^2*sin(x)+6x*cos(x)-6sin(x)', {
  domain: D.trigW,
  hints: ['부분적분을 세 번 한다.', '$\\cos\\to\\sin\\to\\cos$ 순환과 부호를 함께 관리한다.'],
  steps: ['$u=x^{3},\\;dv=\\sin x\\,dx$', '$-x^{3}\\cos x+3\\int x^{2}\\cos x\\,dx$',
          '$=-x^{3}\\cos x+3x^{2}\\sin x+6x\\cos x-6\\sin x$']
});
add('monster', '반복 부분적분', 'x^3*cos(x)', 'x^3*sin(x)+3x^2*cos(x)-6x*sin(x)-6cos(x)', {
  domain: D.trigW,
  hints: ['$u=x^{3},\\;dv=\\cos x\\,dx$ 로 시작한다.', '$\\sin$ 문제와 부호 배치가 다르다.'],
  steps: ['$x^{3}\\sin x-3\\int x^{2}\\sin x\\,dx$', '$=x^{3}\\sin x+3x^{2}\\cos x-6x\\sin x-6\\cos x$']
});
add('monster', '반복 부분적분', 'ln(x)^3', 'x*(ln(x)^3-3ln(x)^2+6ln(x)-6)', {
  domain: D.pos,
  hints: ['$dv=dx$ 로 두고 세 번 부분적분한다.', '$\\int(\\ln x)^{2}dx$ 결과가 중간에 필요하다.'],
  steps: ['$x(\\ln x)^{3}-3\\int(\\ln x)^{2}dx$', '$\\int(\\ln x)^{2}=x(\\ln x)^{2}-2x\\ln x+2x$']
});
add('monster', '반복 부분적분', 'ln(x)^4', 'x*(ln(x)^4-4ln(x)^3+12ln(x)^2-24ln(x)+24)', {
  domain: D.pos,
  hints: ['$t=\\ln x$ 로 치환하면 $\\int t^{4}e^{t}dt$ 가 된다.', '$x^{4}e^{x}$ 문제와 같은 계수가 나온다.'],
  steps: ['$t=\\ln x,\\;dx=e^{t}dt$', '$\\int t^{4}e^{t}dt=(t^{4}-4t^{3}+12t^{2}-24t+24)e^{t}$']
});
add('hard', '부분적분', 'x*ln(x)^2', 'x^2*(ln(x)^2/2 - ln(x)/2 + 1/4)', {
  domain: D.pos,
  hints: ['$u=(\\ln x)^{2},\\;dv=x\\,dx$ 로 둔다.', '남는 적분이 $\\int x\\ln x\\,dx$ 다.'],
  steps: ['$\\dfrac{x^{2}(\\ln x)^{2}}{2}-\\int x\\ln x\\,dx$', '$\\int x\\ln x\\,dx=\\dfrac{x^{2}\\ln x}{2}-\\dfrac{x^{2}}{4}$']
});
add('monster', '부분적분', 'x^2*ln(x)^2', 'x^3*(ln(x)^2/3 - 2ln(x)/9 + 2/27)', {
  domain: D.pos,
  hints: ['$u=(\\ln x)^{2},\\;dv=x^{2}dx$ 로 둔다.', '두 번 부분적분해야 로그가 사라진다.'],
  steps: ['$\\dfrac{x^{3}(\\ln x)^{2}}{3}-\\dfrac{2}{3}\\int x^{2}\\ln x\\,dx$',
          '$\\int x^{2}\\ln x\\,dx=\\dfrac{x^{3}\\ln x}{3}-\\dfrac{x^{3}}{9}$']
});
[2, 3, 4].forEach(function (n) {
  add('hard', '부분적분', 'ln(x)/x^' + n,
      C(-1, n - 1, 'ln(x)/x^' + (n - 1)) + ' - ' + C(1, (n - 1) * (n - 1), '1/x^' + (n - 1)), {
    domain: [0.4, 3.0],
    hints: ['$u=\\ln x,\\;dv=x^{-' + n + '}dx$ 로 둔다.', '$v=-\\dfrac{1}{' + (n - 1) + 'x^{' + (n - 1) + '}}$'],
    steps: ['$u=\\ln x,\\;v=-\\dfrac{1}{' + (n - 1) + 'x^{' + (n - 1) + '}}$',
            '$-\\dfrac{\\ln x}{' + (n - 1) + 'x^{' + (n - 1) + '}}+\\dfrac{1}{' + (n - 1) + '}\\int x^{-' + n + '}dx$']
  });
});

// 세 함수의 곱
add('monster', '삼중 부분적분', 'x*e^x*sin(x)', 'e^x*(x*(sin(x)-cos(x))+cos(x))/2', {
  domain: [0.05, 1.8],
  hints: ['$u=x,\\;dv=e^{x}\\sin x\\,dx$ 로 두면 $v$ 자체가 순환 부분적분이다.',
          '$\\int e^{x}\\sin x\\,dx=\\dfrac{e^{x}(\\sin x-\\cos x)}{2}$ 를 먼저 구한다.'],
  steps: ['$v=\\dfrac{e^{x}(\\sin x-\\cos x)}{2}$', '$xv-\\int v\\,dx$',
          '$=\\dfrac{e^{x}\\left(x(\\sin x-\\cos x)+\\cos x\\right)}{2}$']
});
add('monster', '삼중 부분적분', 'x*e^x*cos(x)', 'e^x*(x*(sin(x)+cos(x))-sin(x))/2', {
  domain: [0.05, 1.8],
  hints: ['$v=\\int e^{x}\\cos x\\,dx=\\dfrac{e^{x}(\\sin x+\\cos x)}{2}$ 를 먼저 구한다.',
          '그다음 $u=x$ 로 부분적분한다.'],
  steps: ['$v=\\dfrac{e^{x}(\\sin x+\\cos x)}{2}$', '$xv-\\int v\\,dx$']
});
[[1, 1], [2, 1]].forEach(function (q) {
  var a = q[0], b = q[1], bb = 2 * b, den = a * a + bb * bb;
  add('monster', '곱-합 + 순환', 'e^(' + K(a) + ')sin(' + K(b) + ')cos(' + K(b) + ')',
      'e^(' + K(a) + ')*(' + K(a, 'sin(' + K(bb) + ')') + ' - ' + K(bb, 'cos(' + K(bb) + ')') + ')/' + (2 * den), {
    domain: [0.05, 1.5],
    hints: ['먼저 $\\sin ' + K(b) + '\\cos ' + K(b) + ' = \\dfrac{\\sin ' + K(bb) + '}{2}$ 로 합친다.',
            '그다음은 표준 순환 부분적분이다.'],
    steps: ['$\\sin ' + K(b) + '\\cos ' + K(b) + ' = \\dfrac{\\sin ' + K(bb) + '}{2}$',
            '$\\dfrac{1}{2}\\int e^{' + K(a) + '}\\sin ' + K(bb) + '\\,dx$',
            '$= ' + M.latexOf('e^(' + K(a) + ')*(' + K(a, 'sin(' + K(bb) + ')') + ' - ' + K(bb, 'cos(' + K(bb) + ')') + ')/' + (2 * den)) + '$']
  });
});

// 역함수 고급
add('monster', '역삼각 고급', 'asin(x)^2', 'x*asin(x)^2+2*sqrt(1-x^2)*asin(x)-2x', {
  domain: D.unit,
  hints: ['$dv=dx$ 로 부분적분하면 $\\int\\dfrac{x\\arcsin x}{\\sqrt{1-x^{2}}}dx$ 가 남는다.',
          '그 적분을 다시 부분적분한다.'],
  steps: ['$x(\\arcsin x)^{2}-2\\int\\dfrac{x\\arcsin x}{\\sqrt{1-x^{2}}}dx$',
          '$\\int\\dfrac{x\\arcsin x}{\\sqrt{1-x^{2}}}dx=-\\sqrt{1-x^{2}}\\arcsin x+x$']
});
add('monster', '역삼각 고급', 'x^2*atan(x)', 'x^3*atan(x)/3 - x^2/6 + ln(1+x^2)/6', {
  domain: [0.1, 2.5],
  hints: ['$u=\\arctan x,\\;dv=x^{2}dx$ 로 둔다.', '남는 $\\int\\dfrac{x^{3}}{1+x^{2}}dx$ 는 나눗셈으로 정리한다.'],
  steps: ['$\\dfrac{x^{3}\\arctan x}{3}-\\dfrac{1}{3}\\int\\dfrac{x^{3}}{1+x^{2}}dx$',
          '$\\dfrac{x^{3}}{1+x^{2}}=x-\\dfrac{x}{1+x^{2}}$']
});
add('monster', '역삼각 고급', 'atan(sqrt(x))', '(x+1)*atan(sqrt(x))-sqrt(x)', {
  domain: [0.2, 3.0],
  hints: ['$t=\\sqrt{x}$ 로 치환한 뒤 부분적분한다.', '$v=\\dfrac{x+1}{1}$ 처럼 적분상수를 잘 고르면 깔끔해진다.'],
  steps: ['$u=\\arctan\\sqrt{x},\\;v=x+1$',
          '$(x+1)\\arctan\\sqrt{x}-\\int\\dfrac{x+1}{2\\sqrt{x}(1+x)}dx$']
});
add('monster', '유리식 부분적분', '1/(x^2+1)^2', 'x/(2*(x^2+1))+atan(x)/2', {
  domain: [-1.5, 2.2],
  hints: ['$x=\\tan\\theta$ 로 치환하면 $\\int\\cos^{2}\\theta\\,d\\theta$ 가 된다.', '점화식으로 풀어도 된다.'],
  steps: ['$x=\\tan\\theta,\\;dx=\\sec^{2}\\theta\\,d\\theta$', '$\\int\\cos^{2}\\theta\\,d\\theta=\\dfrac{\\theta}{2}+\\dfrac{\\sin 2\\theta}{4}$']
});
add('monster', '유리식 부분적분', 'x^2/(x^2+1)^2', 'atan(x)/2 - x/(2*(x^2+1))', {
  domain: [-1.5, 2.2],
  hints: ['$\\dfrac{x^{2}}{(x^{2}+1)^{2}}=\\dfrac{1}{x^{2}+1}-\\dfrac{1}{(x^{2}+1)^{2}}$', '앞 문제 결과를 재활용한다.'],
  steps: ['$\\dfrac{x^{2}}{(x^{2}+1)^{2}}=\\dfrac{1}{x^{2}+1}-\\dfrac{1}{(x^{2}+1)^{2}}$',
          '$\\arctan x-\\left(\\dfrac{x}{2(x^{2}+1)}+\\dfrac{\\arctan x}{2}\\right)$']
});
[1, 2, 4].forEach(function (a) {
  add('monster', '치환+부분분수', 'x^3/(x^2+' + a + ')^2', 'ln(x^2+' + a + ')/2 + ' + a + '/(2*(x^2+' + a + '))', {
    domain: [0.1, 2.5],
    hints: ['$u=x^{2}+' + a + '$ 로 두면 $x^{2}=u-' + a + '$ 다.',
            '$\\dfrac{1}{2}\\int\\dfrac{u-' + a + '}{u^{2}}du$ 로 정리된다.'],
    steps: ['$u=x^{2}+' + a + ',\\;du=2x\\,dx$', '$\\dfrac{1}{2}\\int\\left(\\dfrac{1}{u}-\\dfrac{' + a + '}{u^{2}}\\right)du$']
  });
});
add('monster', '기교', 'e^x*(x^2+1)/(x+1)^2', 'e^x*(x-1)/(x+1)', {
  domain: [0.1, 2.2],
  hints: ['$\\dfrac{x^{2}+1}{(x+1)^{2}}=f(x)+f\'(x)$ 꼴로 쪼갤 수 있는지 본다.',
          '$\\int e^{x}(f+f\')dx=e^{x}f$ 를 쓴다.'],
  steps: ['$\\dfrac{x^{2}+1}{(x+1)^{2}}=\\dfrac{x-1}{x+1}+\\dfrac{2}{(x+1)^{2}}$',
          '$f=\\dfrac{x-1}{x+1},\\;f\'=\\dfrac{2}{(x+1)^{2}}$', '$\\int e^{x}(f+f\')dx=e^{x}f$']
});
[1, 2].forEach(function (a) {
  var a2 = a * a;
  add('monster', '삼각치환 고급', 'x^2*sqrt(' + a2 + '-x^2)',
      C(a2 * a2, 8, 'asin(' + X(a) + ')') + ' - x*(' + a2 + '-2x^2)*sqrt(' + a2 + '-x^2)/8', {
    domain: [-0.72 * a, 0.72 * a],
    hints: ['$x=' + KL(a, '\\sin\\theta') + '$ 로 치환하면 $\\int\\sin^{2}\\theta\\cos^{2}\\theta\\,d\\theta$ 가 된다.',
            '$\\sin^{2}\\theta\\cos^{2}\\theta=\\dfrac{\\sin^{2}2\\theta}{4}$ 로 차수를 내린다.'],
    steps: ['$x=' + KL(a, '\\sin\\theta') + '$', '$' + (a2 * a2) + '\\int\\dfrac{\\sin^{2}2\\theta}{4}d\\theta$',
            '반각공식을 한 번 더 적용한 뒤 $x$ 로 되돌린다']
  });
});

// 쌍곡선 몬스터
add('hard', '쌍곡선 짝수차', 'sech(x)^4', 'tanh(x)-tanh(x)^3/3', {
  domain: D.hyp,
  hints: ['$\\operatorname{sech}^{4}=(1-\\tanh^{2})\\operatorname{sech}^{2}$', '$u=\\tanh x$ 로 치환한다.'],
  steps: ['$\\operatorname{sech}^{4}x=(1-\\tanh^{2}x)\\operatorname{sech}^{2}x$', '$u=\\tanh x:\\;\\int(1-u^{2})du$']
});
add('hard', '쌍곡선 짝수차', 'tanh(x)^4', 'x-tanh(x)-tanh(x)^3/3', {
  domain: D.hyp,
  hints: ['$\\tanh^{4}=\\tanh^{2}(1-\\operatorname{sech}^{2})$ 로 내린다.', '$\\int\\tanh^{2}=x-\\tanh x$ 를 쓴다.'],
  steps: ['$\\int\\tanh^{4}=\\int\\tanh^{2}-\\int\\tanh^{2}\\operatorname{sech}^{2}$',
          '$=x-\\tanh x-\\dfrac{\\tanh^{3}x}{3}$']
});
add('monster', '역쌍곡선 고급', 'x*asinh(x)', '(2x^2+1)*asinh(x)/4 - x*sqrt(x^2+1)/4', {
  domain: [0.1, 2.2],
  hints: ['$u=\\operatorname{arsinh}x,\\;dv=x\\,dx$ 로 둔다.',
          '$v=\\dfrac{x^{2}}{2}$ 대신 $\\dfrac{x^{2}+1}{2}$ 를 쓰면 남는 적분이 간단해진다.'],
  steps: ['$u=\\operatorname{arsinh}x,\\;v=\\dfrac{2x^{2}+1}{4}$ 로 잡는다',
          '남는 적분 $\\int\\dfrac{x^{2}}{\\sqrt{x^{2}+1}}dx$ 를 정리한다']
});
add('hard', '역쌍곡선 고급', 'acosh(x)', 'x*acosh(x)-sqrt(x^2-1)', {
  domain: [1.3, 3.2],
  hints: ['$dv=dx$ 로 부분적분한다.', '$\\dfrac{d}{dx}\\operatorname{arcosh}x=\\dfrac{1}{\\sqrt{x^{2}-1}}$'],
  steps: ['$u=\\operatorname{arcosh}x,\\;dv=dx$', '$x\\operatorname{arcosh}x-\\int\\dfrac{x}{\\sqrt{x^{2}-1}}dx$']
});
add('monster', '쌍곡선 고급', 'x^2*sqrt(x^2+1)',
    'x*(x^2+1)^(3/2)/4 - x*sqrt(x^2+1)/8 - asinh(x)/8', {
  domain: [-1.3, 2.0],
  hints: ['$x=\\sinh\\theta$ 로 치환하면 $\\int\\sinh^{2}\\theta\\cosh^{2}\\theta\\,d\\theta$ 가 된다.',
          '$\\sinh^{2}\\cosh^{2}=\\dfrac{\\sinh^{2}2\\theta}{4}$ 로 내린다.'],
  steps: ['$x=\\sinh\\theta$', '$\\dfrac{1}{4}\\int\\sinh^{2}2\\theta\\,d\\theta$',
          '$\\sinh^{2}u=\\dfrac{\\cosh 2u-1}{2}$ 를 한 번 더 적용한다']
});
add('monster', '쌍곡선 고급', 'sqrt(x^2+1)^3',
    'x*(x^2+1)^(3/2)/4 + 3*x*sqrt(x^2+1)/8 + 3*asinh(x)/8', {
  domain: [-1.3, 2.0],
  hints: ['$(x^{2}+1)^{3/2}$ 이므로 $x=\\sinh\\theta$ 로 두면 $\\int\\cosh^{4}\\theta\\,d\\theta$ 다.',
          '$\\cosh^{4}$ 는 반각공식을 두 번 쓴다.'],
  steps: ['$x=\\sinh\\theta$', '$\\int\\cosh^{4}\\theta\\,d\\theta$',
          '$\\cosh^{2}u=\\dfrac{\\cosh 2u+1}{2}$ 를 두 번 적용']
});
[[2, 1], [3, 2]].forEach(function (q) {
  var a = q[0], b = q[1], den = a * a - b * b;
  add('monster', '쌍곡선 순환', 'e^(' + K(a) + ')cosh(' + K(b) + ')',
      'e^(' + K(a) + ')*(' + K(a, 'cosh(' + K(b) + ')') + ' - ' + K(b, 'sinh(' + K(b) + ')') + ')/' + den, {
    domain: [0.05, 1.3],
    hints: ['$\\cosh$ 를 지수로 풀어 항별로 적분한다.', '분모는 $' + (a * a) + '-' + (b * b) + '=' + den + '$ 이다.'],
    steps: ['$\\cosh ' + K(b) + ' = \\dfrac{e^{' + K(b) + '}+e^{-' + K(b) + '}}{2}$',
            '$= ' + M.latexOf('e^(' + K(a) + ')*(' + K(a, 'cosh(' + K(b) + ')') + ' - ' + K(b, 'sinh(' + K(b) + ')') + ')/' + den) + '$']
  });
});

// 몬스터 추가분 ------------------------------------------------------------

add('hard', '부분적분', 'x*sec(x)^2', 'x*tan(x)+ln(cos(x))', {
  domain: D.trig, lnAbs: true,
  hints: ['$u=x,\\;dv=\\sec^{2}x\\,dx$ 로 둔다.', '남는 $\\int\\tan x\\,dx$ 를 처리한다.'],
  steps: ['$u=x,\\;v=\\tan x$', '$x\\tan x-\\int\\tan x\\,dx = x\\tan x+\\ln|\\cos x|$']
});

add('monster', '반복 부분적분', 'ln(x)^2/x^2', '-(ln(x)^2+2ln(x)+2)/x', {
  domain: [0.4, 3.0],
  hints: ['$u=(\\ln x)^{2},\\;dv=x^{-2}dx$ 로 두고 두 번 부분적분한다.',
          '$\\int\\dfrac{\\ln x}{x^{2}}dx=-\\dfrac{\\ln x+1}{x}$ 를 중간에 쓴다.'],
  steps: ['$-\\dfrac{(\\ln x)^{2}}{x}+2\\int\\dfrac{\\ln x}{x^{2}}dx$',
          '$\\int\\dfrac{\\ln x}{x^{2}}dx=-\\dfrac{\\ln x+1}{x}$',
          '$= -\\dfrac{(\\ln x)^{2}+2\\ln x+2}{x}$']
});
add('monster', '부분적분', 'atan(x)/x^2', '-atan(x)/x+ln(x)-ln(1+x^2)/2', {
  domain: [0.3, 2.5], lnAbs: true,
  hints: ['$u=\\arctan x,\\;dv=x^{-2}dx$ 로 둔다.',
          '남는 $\\int\\dfrac{dx}{x(1+x^{2})}$ 는 부분분수로 나눈다.'],
  steps: ['$-\\dfrac{\\arctan x}{x}+\\int\\dfrac{dx}{x(1+x^{2})}$',
          '$\\dfrac{1}{x(1+x^{2})}=\\dfrac{1}{x}-\\dfrac{x}{1+x^{2}}$']
});
add('monster', '부분적분', 'ln(x)/(1+x)^2', '-ln(x)/(1+x)+ln(x)-ln(1+x)', {
  domain: [0.3, 3.0], lnAbs: true,
  hints: ['$dv=(1+x)^{-2}dx$ 로 두면 $v=-\\dfrac{1}{1+x}$ 다.',
          '남는 $\\int\\dfrac{dx}{x(1+x)}$ 는 부분분수다.'],
  steps: ['$-\\dfrac{\\ln x}{1+x}+\\int\\dfrac{dx}{x(1+x)}$',
          '$\\dfrac{1}{x(1+x)}=\\dfrac{1}{x}-\\dfrac{1}{1+x}$']
});
add('monster', '기교', 'x*e^x/(1+x)^2', 'e^x/(1+x)', {
  domain: [0.2, 2.5],
  hints: ['$\\dfrac{x}{(1+x)^{2}}=\\dfrac{1}{1+x}-\\dfrac{1}{(1+x)^{2}}$ 로 쪼갠다.',
          '$f=\\dfrac{1}{1+x}$ 라 하면 $f\'=-\\dfrac{1}{(1+x)^{2}}$ 이고 $\\int e^{x}(f+f\')dx=e^{x}f$ 다.'],
  steps: ['$\\dfrac{x}{(1+x)^{2}}=\\dfrac{1}{1+x}-\\dfrac{1}{(1+x)^{2}}$',
          '$f=\\dfrac{1}{1+x},\\; f\'=-\\dfrac{1}{(1+x)^{2}}$', '$\\int e^{x}(f+f\')dx=\\dfrac{e^{x}}{1+x}$']
});
add('monster', '기교', '(1+x)/(x*(1+x*e^x))', 'ln(x*e^x)-ln(1+x*e^x)', {
  domain: [0.3, 2.0], lnAbs: true,
  hints: ['$u=xe^{x}$ 로 두면 $du=(1+x)e^{x}dx$ 다.',
          '분자·분모에 $e^{x}$ 를 곱해 $u$ 를 만들어 낸다.'],
  steps: ['분자·분모에 $e^{x}$ 를 곱한다: $\\dfrac{(1+x)e^{x}}{xe^{x}(1+xe^{x})}$',
          '$u=xe^{x}$', '$\\int\\dfrac{du}{u(1+u)}=\\ln\\left|\\dfrac{u}{1+u}\\right|$']
});

// 삼각 유리식 (몬스터)
add('monster', '삼각 유리식', 'sin(x)/(1+sin(x))', 'x-tan(x)+sec(x)', {
  domain: [0.2, 1.2],
  hints: ['$\\dfrac{\\sin x}{1+\\sin x}=1-\\dfrac{1}{1+\\sin x}$ 로 쪼갠다.',
          '$\\int\\dfrac{dx}{1+\\sin x}=\\tan x-\\sec x$ 를 쓴다.'],
  steps: ['$\\dfrac{\\sin x}{1+\\sin x}=1-\\dfrac{1}{1+\\sin x}$',
          '$\\int\\dfrac{dx}{1+\\sin x}=\\tan x-\\sec x$']
});
add('monster', '삼각 유리식', 'cos(x)/(1+cos(x))', 'x-tan(x/2)', {
  domain: [0.2, 2.4],
  hints: ['$\\dfrac{\\cos x}{1+\\cos x}=1-\\dfrac{1}{1+\\cos x}$', '$\\int\\dfrac{dx}{1+\\cos x}=\\tan\\dfrac{x}{2}$'],
  steps: ['$\\dfrac{\\cos x}{1+\\cos x}=1-\\dfrac{1}{1+\\cos x}$', '$1+\\cos x=2\\cos^{2}\\dfrac{x}{2}$']
});
[[2, 1, 3], [3, 2, 5], [5, 3, 16]].forEach(function (q) {
  var a = q[0], b = q[1], d = q[2];
  add('monster', '바이어슈트라스 치환', '1/(' + a + '+' + K(b, 'sin(x)') + ')',
      '2*atan((' + K(a, 'tan(x/2)') + '+' + b + ')/' + SQ(d) + ')/' + SQ(d), {
    domain: [0.2, 2.4],
    hints: ['$t=\\tan\\dfrac{x}{2}$ 로 두면 $\\sin x=\\dfrac{2t}{1+t^{2}}$ 다.',
            '분모를 정리하면 $' + a + 't^{2}+' + (2 * b) + 't+' + a + '$ 가 되어 완전제곱이 필요하다.'],
    steps: ['$t=\\tan\\dfrac{x}{2},\\;dx=\\dfrac{2dt}{1+t^{2}}$',
            '$\\int\\dfrac{2\\,dt}{' + a + 't^{2}+' + (2 * b) + 't+' + a + '}$',
            '완전제곱 후 $\\arctan$ 형태로 정리한다']
  });
});

// 근호가 있는 유리식
add('monster', '삼각치환 고급', 'sqrt(x^2+1)/x', 'sqrt(x^2+1)-ln((1+sqrt(x^2+1))/x)', {
  domain: [0.35, 2.6], lnAbs: true,
  hints: ['$x=\\sinh\\theta$ 로 두면 $\\int\\dfrac{\\cosh^{2}\\theta}{\\sinh\\theta}d\\theta$ 가 된다.',
          '$u=\\sqrt{x^{2}+1}$ 치환으로 유리식으로 바꿔도 된다.'],
  steps: ['$u=\\sqrt{x^{2}+1},\\;u\\,du=x\\,dx$', '$\\int\\dfrac{u^{2}}{u^{2}-1}du$',
          '$= u+\\dfrac{1}{2}\\ln\\left|\\dfrac{u-1}{u+1}\\right|$ 를 정리한다']
});
add('monster', '삼각치환 고급', 'sqrt(x^2-1)/x', 'sqrt(x^2-1)-atan(sqrt(x^2-1))', {
  domain: [1.3, 3.2],
  hints: ['$x=\\sec\\theta$ 로 두면 $\\int\\tan^{2}\\theta\\,d\\theta$ 가 된다.',
          '$\\tan^{2}=\\sec^{2}-1$ 로 내린다.'],
  steps: ['$x=\\sec\\theta$', '$\\int\\tan^{2}\\theta\\,d\\theta=\\tan\\theta-\\theta$',
          '$\\tan\\theta=\\sqrt{x^{2}-1},\\;\\theta=\\operatorname{arcsec}x$']
});

// x^n 치환 + 부분적분
add('monster', '치환+부분적분', 'x^3*e^(x^2)', 'e^(x^2)*(x^2-1)/2', {
  domain: [0.1, 1.3],
  hints: ['$u=x^{2}$ 로 두면 $\\dfrac{1}{2}\\int ue^{u}du$ 가 된다.', '그다음은 부분적분이다.'],
  steps: ['$u=x^{2},\\;du=2x\\,dx$', '$\\dfrac{1}{2}\\int ue^{u}du=\\dfrac{(u-1)e^{u}}{2}$']
});
add('monster', '치환+부분적분', 'x^5*e^(x^2)', 'e^(x^2)*(x^4-2x^2+2)/2', {
  domain: [0.1, 1.2],
  hints: ['$u=x^{2}$ 로 두면 $\\dfrac{1}{2}\\int u^{2}e^{u}du$ 다.', '부분적분을 두 번 한다.'],
  steps: ['$u=x^{2}$', '$\\dfrac{1}{2}\\int u^{2}e^{u}du=\\dfrac{(u^{2}-2u+2)e^{u}}{2}$']
});
add('monster', '치환+부분적분', 'x^3*sin(x^2)', '(sin(x^2)-x^2*cos(x^2))/2', {
  domain: [0.2, 1.6],
  hints: ['$u=x^{2}$ 로 두면 $\\dfrac{1}{2}\\int u\\sin u\\,du$ 가 된다.', '부분적분으로 마무리한다.'],
  steps: ['$u=x^{2},\\;du=2x\\,dx$', '$\\dfrac{1}{2}\\int u\\sin u\\,du=\\dfrac{\\sin u-u\\cos u}{2}$']
});
add('monster', '부분적분', 'x*csc(x)^2', '-x*cot(x)+ln(sin(x))', {
  domain: [0.45, 2.3], lnAbs: true,
  hints: ['$u=x,\\;dv=\\csc^{2}x\\,dx$ 로 둔다.', '남는 $\\int\\cot x\\,dx$ 를 처리한다.'],
  steps: ['$u=x,\\;v=-\\cot x$', '$-x\\cot x+\\int\\cot x\\,dx=-x\\cot x+\\ln|\\sin x|$']
});

// 쌍곡선 4차
add('monster', '쌍곡선 짝수차', 'sinh(x)^4', '3x/8 - sinh(2x)/4 + sinh(4x)/32', {
  domain: [0.2, 1.4],
  hints: ['$\\sinh^{2}u=\\dfrac{\\cosh 2u-1}{2}$ 를 두 번 적용한다.', '$\\sin^{4}$ 과 형태가 비슷하지만 부호가 다르다.'],
  steps: ['$\\sinh^{4}x=\\dfrac{(\\cosh 2x-1)^{2}}{4}$',
          '$\\cosh^{2}2x=\\dfrac{\\cosh 4x+1}{2}$', '$=\\dfrac{3}{8}-\\dfrac{\\cosh 2x}{2}+\\dfrac{\\cosh 4x}{8}$']
});
add('monster', '쌍곡선 짝수차', 'cosh(x)^4', '3x/8 + sinh(2x)/4 + sinh(4x)/32', {
  domain: [0.2, 1.4],
  hints: ['$\\cosh^{2}u=\\dfrac{\\cosh 2u+1}{2}$ 를 두 번 적용한다.', '$\\sinh^{4}$ 과 가운데 항의 부호만 다르다.'],
  steps: ['$\\cosh^{4}x=\\dfrac{(\\cosh 2x+1)^{2}}{4}$', '$=\\dfrac{3}{8}+\\dfrac{\\cosh 2x}{2}+\\dfrac{\\cosh 4x}{8}$']
});

// ================================================================== 검증 + 출력

var LEVELS = ['easy', 'medium', 'hard', 'monster'];
var LABELS = { easy: '쉬움', medium: '보통', hard: '어려움', monster: '몬스터' };
// medium 과 monster 가 같은 'm' 을 쓰지 않도록 접두어를 명시한다
var ID_PREFIX = { easy: 'e', medium: 'm', hard: 'h', monster: 'x' };

// 기준 부정적분을 수치 미분해 피적분함수와 맞는지 확인한다.
function checkOne(p) {
  var f, F;
  try { f = M.compile(p.integrand); } catch (e) { return '피적분함수 파싱 실패: ' + e.message; }
  try { F = M.compile(p.answer); } catch (e) { return '기준답 파싱 실패: ' + e.message; }
  var lo = p.domain[0], hi = p.domain[1];
  var worst = 0, at = null, used = 0;
  for (var i = 1; i <= 14; i++) {
    var x = lo + (hi - lo) * i / 15;
    var target = f(x), got = M.derivative(F, x, 1e-5);
    if (!isFinite(target) || !isFinite(got)) continue;
    used++;
    var err = Math.abs(got - target) / Math.max(1, Math.abs(target));
    if (err > worst) { worst = err; at = x; }
  }
  if (used < 9) return '정의역에서 유효 표본이 ' + used + '개뿐';
  if (worst > 5e-5) return '불일치 rel.err=' + worst.toExponential(2) + ' (x=' + at.toFixed(3) + ')';
  if (!p.hints || p.hints.length < 2) return '힌트가 부족';
  if (!p.steps || p.steps.length < 1) return '풀이가 없음';
  return null;
}

var failures = [];
out.forEach(function (p) {
  var why = checkOne(p);
  if (why) failures.push({ p: p, why: why });
});

if (failures.length) {
  console.error('검증 실패 ' + failures.length + '건 / 전체 ' + out.length + '건\n');
  failures.forEach(function (f) {
    console.error('  [' + f.p.level + '] ' + f.p.topic);
    console.error('    ∫ ' + f.p.integrand + ' dx');
    console.error('    F = ' + f.p.answer);
    console.error('    구간 [' + f.p.domain + ']  →  ' + f.why + '\n');
  });
  process.exit(1);
}

// 레벨별로 정렬하고 id 를 붙인다
var byLevel = {};
LEVELS.forEach(function (lv) {
  byLevel[lv] = out.filter(function (p) { return p.level === lv; });
  byLevel[lv].forEach(function (p, i) { p.id = ID_PREFIX[lv] + String(i + 1).padStart(3, '0'); });
});

function q(s) { return "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'"; }

function emit(p) {
  return '    {\n' +
    '      id: ' + q(p.id) + ', topic: ' + q(p.topic) + ',\n' +
    '      integrand: ' + q(p.integrand) + ', latex: ' + q(p.latex) + ',\n' +
    '      answer: ' + q(p.answer) + ', answerLatex: ' + q(p.answerLatex) + ',\n' +
    '      domain: [' + p.domain[0] + ', ' + p.domain[1] + '],\n' +
    '      hints: [' + p.hints.map(q).join(', ') + '],\n' +
    '      steps: [' + p.steps.map(q).join(', ') + ']\n' +
    '    }';
}

var body = LEVELS.map(function (lv) {
  return '  var ' + lv.toUpperCase() + ' = [\n' +
    byLevel[lv].map(emit).join(',\n') + '\n  ];';
}).join('\n\n');

var file = [
  '/*',
  ' * problems.js - 적분 문제 은행 (자동 생성 파일).',
  ' *',
  ' *   이 파일은 generate.js 가 만든다. 직접 고치지 말고 generate.js 를 고친 뒤',
  ' *   `node generate.js` 를 다시 실행할 것.',
  ' *',
  ' *   integrand : 채점·검증용 피적분함수(ASCII)',
  ' *   answer    : 기준 부정적분(ASCII, +C 생략)',
  ' *   domain    : 수치 비교에 쓰는 안전한 구간 (특이점 회피)',
  ' *',
  ' *   전체 ' + out.length + '문항 - ' +
    LEVELS.map(function (lv) { return LABELS[lv] + ' ' + byLevel[lv].length; }).join(' / '),
  ' */',
  '(function (root, factory) {',
  '  var api = factory();',
  '  root.PROBLEMS = api;',
  '  if (typeof module !== \'undefined\' && module.exports) module.exports = api;',
  '})(typeof globalThis !== \'undefined\' ? globalThis : this, function () {',
  '  \'use strict\';',
  '',
  body,
  '',
  '  var BY_LEVEL = { easy: EASY, medium: MEDIUM, hard: HARD, monster: MONSTER };',
  '  var ALL = [].concat(EASY, MEDIUM, HARD, MONSTER);',
  '',
  '  return {',
  '    easy: EASY, medium: MEDIUM, hard: HARD, monster: MONSTER,',
  '    all: ALL, byLevel: BY_LEVEL,',
  '    levels: [\'easy\', \'medium\', \'hard\', \'monster\'],',
  '    labels: { easy: \'쉬움\', medium: \'보통\', hard: \'어려움\', monster: \'몬스터\' },',
  '    find: function (id) {',
  '      for (var i = 0; i < ALL.length; i++) if (ALL[i].id === id) return ALL[i];',
  '      return null;',
  '    }',
  '  };',
  '});',
  ''
].join('\n');

fs.writeFileSync(__dirname + '/problems.js', file);

LEVELS.forEach(function (lv) { console.log(LABELS[lv] + ':', byLevel[lv].length); });
console.log('합계:', out.length, '— problems.js 를 다시 만들었습니다.');
