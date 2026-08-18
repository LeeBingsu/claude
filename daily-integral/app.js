/* app.js - 화면 로직. 상태는 localStorage 에만 저장한다. */
(function () {
  'use strict';

  var STORE_KEY = 'dailyIntegral.local.v1';
  var $ = function (id) { return document.getElementById(id); };

  // ------------------------------------------------------------- 저장소

  function blankStore() {
    return {
      theme: 'dark',
      streak: 0,
      best: 0,
      lastSolvedDay: null,
      days: {},                       // '2026-08-18': { easy: {solved, attempts, hints, revealed} }
      practice: { solved: 0, attempts: 0 }
    };
  }

  var store = load();

  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return blankStore();
      var s = JSON.parse(raw);
      var base = blankStore();
      Object.keys(base).forEach(function (k) { if (s[k] === undefined) s[k] = base[k]; });
      return s;
    } catch (e) { return blankStore(); }
  }

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) { /* 시크릿 모드 등 */ }
  }

  // ------------------------------------------------------------- 날짜

  function keyOf(d) {
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  function dayNumberOf(d) {
    return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
  }

  function dateFromKey(k) {
    var p = k.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }

  function prettyDate(k) {
    var d = dateFromKey(k);
    var w = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
    return (d.getMonth() + 1) + '월 ' + d.getDate() + '일 (' + w + ')';
  }

  var TODAY_KEY = keyOf(new Date());

  // ------------------------------------------------------------- 문제 선택

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffledIndices(n, seed) {
    var rnd = mulberry32(seed);
    var arr = [];
    for (var i = 0; i < n; i++) arr.push(i);
    for (var j = n - 1; j > 0; j--) {
      var k = Math.floor(rnd() * (j + 1));
      var t = arr[j]; arr[j] = arr[k]; arr[k] = t;
    }
    return arr;
  }

  // 같은 주기 안에서는 문제가 반복되지 않도록 순열에서 뽑는다.
  function problemForDay(level, dayNum) {
    var bank = PROBLEMS.byLevel[level];
    var n = bank.length;
    var cycle = Math.floor(dayNum / n);
    var pos = ((dayNum % n) + n) % n;
    var levelSeed = PROBLEMS.levels.indexOf(level) * 7919;
    var order = shuffledIndices(n, cycle * 1000003 + levelSeed + 4242);
    return bank[order[pos]];
  }

  function randomProblem(level, avoidId) {
    var bank = PROBLEMS.byLevel[level];
    var p, guard = 0;
    do { p = bank[Math.floor(Math.random() * bank.length)]; } while (p.id === avoidId && ++guard < 20);
    return p;
  }

  // ------------------------------------------------------------- 수식 렌더

  function renderTex(el, tex, display, fallbackText) {
    if (window.katex) {
      try {
        katex.render(tex, el, { displayMode: !!display, throwOnError: false });
        return;
      } catch (e) { /* 아래 폴백 */ }
    }
    el.innerHTML = '';
    var span = document.createElement('span');
    span.className = 'fallback';
    span.textContent = fallbackText || tex;
    el.appendChild(span);
  }

  // '$수식$' 과 한글 설명이 섞인 문자열을 렌더링한다.
  function renderMixed(el, str, big) {
    el.innerHTML = '';
    var parts = String(str).split('$');
    parts.forEach(function (part, i) {
      if (part === '') return;
      if (i % 2 === 1) {
        var span = document.createElement('span');
        renderTex(span, (big ? '\\displaystyle ' : '') + part, false, part);
        el.appendChild(span);
      } else {
        el.appendChild(document.createTextNode(part));
      }
    });
  }

  // ------------------------------------------------------------- 세션 상태

  var session = {
    mode: 'daily',        // daily | practice | archive
    dateKey: TODAY_KEY,
    level: 'easy',
    problem: null,
    attempts: 0,
    hintsShown: 0,
    solved: false,
    revealed: false
  };

  function recordFor(dateKey, level) {
    var d = store.days[dateKey];
    return d ? d[level] : null;
  }

  function ensureRecord(dateKey, level) {
    if (!store.days[dateKey]) store.days[dateKey] = {};
    if (!store.days[dateKey][level]) {
      store.days[dateKey][level] = { solved: false, attempts: 0, hints: 0, revealed: false };
    }
    return store.days[dateKey][level];
  }

  function effectiveStreak() {
    if (!store.lastSolvedDay) return 0;
    var last = dayNumberOf(dateFromKey(store.lastSolvedDay));
    var today = dayNumberOf(new Date());
    return (today - last <= 1) ? store.streak : 0;
  }

  function markSolved() {
    if (session.mode === 'practice') {
      store.practice.solved++;
      save();
      return;
    }
    var rec = ensureRecord(session.dateKey, session.level);
    rec.solved = true;
    rec.attempts = session.attempts;
    rec.hints = session.hintsShown;
    rec.revealed = session.revealed;

    // 연속 학습일은 "오늘의 문제"를 풀었을 때만 갱신된다.
    if (session.dateKey === TODAY_KEY && store.lastSolvedDay !== TODAY_KEY) {
      var yesterday = keyOf(new Date(Date.now() - 86400000));
      store.streak = (store.lastSolvedDay === yesterday) ? store.streak + 1 : 1;
      store.lastSolvedDay = TODAY_KEY;
      if (store.streak > store.best) store.best = store.streak;
    }
    save();
  }

  function bumpAttempt() {
    session.attempts++;
    if (session.mode === 'practice') { store.practice.attempts++; }
    else { ensureRecord(session.dateKey, session.level).attempts = session.attempts; }
    save();
  }

  // ------------------------------------------------------------- 화면 그리기

  function loadProblem(problem) {
    session.problem = problem;
    session.attempts = 0;
    session.hintsShown = 0;
    session.solved = false;
    session.revealed = false;

    var rec = session.mode === 'practice' ? null : recordFor(session.dateKey, session.level);
    if (rec) {
      session.attempts = rec.attempts || 0;
      session.solved = !!rec.solved;
      session.revealed = !!rec.revealed;
      session.hintsShown = rec.hints || 0;
    }

    $('topicChip').textContent = problem.topic;
    $('dateChip').textContent = session.mode === 'practice'
      ? '연습 · ' + PROBLEMS.labels[session.level]
      : prettyDate(session.dateKey);

    var modeChip = $('modeChip');
    if (session.mode === 'archive') {
      modeChip.textContent = '아카이브';
      modeChip.classList.remove('hidden');
    } else if (session.mode === 'practice') {
      modeChip.textContent = '무한 연습';
      modeChip.classList.remove('hidden');
    } else {
      modeChip.classList.add('hidden');
    }

    renderTex($('problemBox'), '\\int ' + problem.latex + '\\,dx', true,
      '∫ ' + problem.integrand + ' dx');

    $('nextBtn').classList.toggle('hidden', session.mode !== 'practice');
    $('answerInput').value = '';
    $('hintBox').innerHTML = '';
    $('solution').classList.remove('show');
    $('feedback').className = 'feedback';
    updatePreview();
    updateAttemptChip();
    renderLevels();

    if (session.solved) {
      showFeedback('ok', '이미 해결한 문제입니다. 다시 풀어 보거나 해설을 확인해 보세요.');
    }
    if (session.revealed) revealSolution(true);

    for (var i = 0; i < session.hintsShown; i++) appendHint(i);
    $('answerInput').focus();
  }

  function updateAttemptChip() {
    var bits = [];
    if (session.attempts) bits.push('시도 ' + session.attempts + '회');
    if (session.hintsShown) bits.push('힌트 ' + session.hintsShown + '개');
    if (session.solved) bits.push('해결 ✓');
    $('attemptChip').textContent = bits.join(' · ');
  }

  function showFeedback(kind, html) {
    var el = $('feedback');
    el.className = 'feedback show ' + kind;
    el.innerHTML = html;
  }

  function appendHint(i) {
    var p = session.problem;
    if (!p.hints[i]) return;
    var box = document.createElement('div');
    box.className = 'hint';
    var n = document.createElement('span');
    n.className = 'n';
    n.textContent = '힌트 ' + (i + 1);
    var body = document.createElement('span');
    renderMixed(body, p.hints[i], true);
    box.appendChild(n);
    box.appendChild(body);
    $('hintBox').appendChild(box);
  }

  function revealSolution(silent) {
    var p = session.problem;
    var steps = $('steps');
    steps.innerHTML = '';
    p.steps.forEach(function (s) {
      var row = document.createElement('div');
      row.className = 'step';
      var body = document.createElement('span');
      renderMixed(body, s, true);
      row.appendChild(body);
      steps.appendChild(row);
    });
    renderTex($('finalAnswer'), p.answerLatex, false, p.answer + ' + C');
    $('solution').classList.add('show');
    session.revealed = true;
    if (session.mode !== 'practice') {
      ensureRecord(session.dateKey, session.level).revealed = true;
      save();
    }
    if (!silent) updateAttemptChip();
  }

  // ------------------------------------------------------------- 채점

  function check() {
    var raw = $('answerInput').value.trim();
    if (!raw) { showFeedback('info', '답을 입력해 주세요.'); return; }
    var p = session.problem;

    var res;
    try {
      res = MathExpr.compareAntiderivative(raw, p.answer, p.domain, p.integrand);
    } catch (e) {
      showFeedback('bad', '수식을 읽을 수 없습니다: ' + e.message);
      return;
    }

    if (res.ok) {
      var wasSolved = session.solved;
      session.solved = true;
      if (!wasSolved) markSolved();
      var extra = session.revealed ? ' (해설을 본 뒤 정답)' : '';
      showFeedback('ok', '<b>정답입니다.</b> ' +
        (session.attempts === 0 ? '한 번에 맞혔습니다' : session.attempts + '번의 시도 끝에 맞혔습니다') + extra + '.');
      revealSolution(true);
      updateAttemptChip();
      renderLevels();
      renderStreak();
      renderArchive();
      renderStats();
      return;
    }

    bumpAttempt();
    updateAttemptChip();

    if (res.reason === 'parse') {
      showFeedback('bad', '수식 해석 실패: ' + res.detail);
    } else if (res.reason === 'novar') {
      showFeedback('bad', res.detail + ' 부정적분은 x 의 함수여야 합니다.');
    } else if (res.reason === 'domain') {
      showFeedback('bad', res.detail);
    } else {
      showFeedback('bad', '<b>오답입니다.</b> ' + (res.detail || '미분해서 피적분함수가 되는지 확인해 보세요.'));
    }
  }

  // ------------------------------------------------------------- 예쁜 입력

  // 타이핑하는 대로 * 는 ·, ^2 는 ², sqrt 는 √, pi 는 π 로 바꿔 보여 준다.
  // 파서가 이 기호들을 그대로 읽으므로 채점에는 영향이 없다.
  var SUP = {
    '0': '\u2070', '1': '\u00b9', '2': '\u00b2', '3': '\u00b3', '4': '\u2074',
    '5': '\u2075', '6': '\u2076', '7': '\u2077', '8': '\u2078', '9': '\u2079',
    '-': '\u207b', '+': '\u207a', 'x': '\u02e3', 'n': '\u207f'
  };
  var SUP_DIGITS = '\u2070\u00b9\u00b2\u00b3\u2074\u2075\u2076\u2077\u2078\u2079\u207b';
  // 괄호로 묶인 지수 안에서 위첨자로 바꿀 수 있는 글자
  var SUP_GROUP_RE = /^[0-9+\-xn]+$/;

  function ends(str, tail) {
    return str.length >= tail.length && str.slice(str.length - tail.length) === tail;
  }

  // 방금 입력한 자리만 살펴본다. 커서가 튀지 않도록 앞쪽 문자열만 손댄다.
  function prettifyAtCaret(value, caret) {
    var before = value.slice(0, caret), after = value.slice(caret);
    var last = before.slice(-1);
    var cut = 0, put = null;

    if (last === '*') { cut = 1; put = '\u00b7'; }
    else if (ends(before, 'sqrt(')) { cut = 5; put = '\u221a('; }
    else if (ends(before, 'pi') && !/[A-Za-z]/.test(before.slice(-3, -2))) { cut = 2; put = '\u03c0'; }
    else if (last === ')') { return closeExponentGroup(before, after); }
    else if (/\^[0-9\-xn]$/.test(before)) { cut = 2; put = SUP[last]; }
    else if (/[0-9]$/.test(before)) {
      // 위첨자 바로 뒤에 이어 친 숫자만 위첨자로 (x^12 -> x¹²)
      var prev = before.slice(-2, -1);
      if (prev && SUP_DIGITS.indexOf(prev) >= 0) { cut = 1; put = SUP[last]; }
    }

    if (put === null) return null;
    before = before.slice(0, before.length - cut) + put;
    return { value: before + after, caret: before.length };
  }

  // 방금 닫은 괄호가 지수 괄호 ^( ... ) 라면 통째로 위첨자로 바꾼다.
  // 괄호가 범위를 확정해 주므로 e^(2x) -> e²ˣ 가 모호하지 않다.
  function closeExponentGroup(before, after) {
    var close = before.length - 1;               // 방금 친 ')' 의 위치
    var depth = 1, open = -1;
    for (var i = close - 1; i >= 0; i--) {
      if (before[i] === ')') depth++;
      else if (before[i] === '(') { depth--; if (depth === 0) { open = i; break; } }
    }
    if (open < 1 || before[open - 1] !== '^') return null;

    var inner = before.slice(open + 1, close);
    if (!inner || !SUP_GROUP_RE.test(inner)) return null;   // 1/2, x^2 등은 그대로 둔다

    var sup = '';
    for (var j = 0; j < inner.length; j++) sup += SUP[inner[j]];
    var head = before.slice(0, open - 1) + sup;             // '^' 와 괄호는 지운다
    return { value: head + after, caret: head.length };
  }

  function toSup(_, chars) {
    var out = '';
    for (var i = 0; i < chars.length; i++) out += SUP[chars[i]];
    return out;
  }

  // 붙여넣기처럼 한꺼번에 들어온 값은 전체를 훑어서 바꾼다.
  function prettifyAll(value) {
    return value
      .replace(/sqrt\s*\(/g, '\u221a(')
      .replace(/(^|[^A-Za-z])pi(?![A-Za-z])/g, '$1\u03c0')
      .replace(/\*/g, '\u00b7')
      .replace(/\^\(([0-9+\-xn]+)\)/g, toSup)      // e^(2x) -> e²ˣ
      .replace(/\^(-?[0-9]+)(?![0-9])/g, toSup)
      .replace(/\^([xn])(?![A-Za-z0-9])/g, toSup);
  }

  function onAnswerInput(e) {
    var inp = $('answerInput');
    if (e && e.inputType === 'insertFromPaste') {
      inp.value = prettifyAll(inp.value);
      inp.setSelectionRange(inp.value.length, inp.value.length);
    } else if (!e || e.inputType !== 'deleteContentBackward') {
      var res = prettifyAtCaret(inp.value, inp.selectionStart);
      if (res) {
        inp.value = res.value;
        inp.setSelectionRange(res.caret, res.caret);
      }
    }
    updatePreview();
  }

  // ------------------------------------------------------------- 미리보기

  function updatePreview() {
    var raw = $('answerInput').value.trim();
    var body = $('previewBody');
    var box = $('preview');
    box.classList.remove('err');
    if (!raw) {
      box.classList.add('empty');
      body.className = 'muted';
      body.textContent = '입력한 식이 여기에 수식으로 표시됩니다';
      return;
    }
    box.classList.remove('empty');
    body.className = '';
    try {
      var tex = MathExpr.latexOf(raw);
      renderTex(body, '\\displaystyle ' + tex, false, raw);
    } catch (e) {
      box.classList.add('err');
      body.textContent = e.message;
    }
  }

  // ------------------------------------------------------------- 난이도 바

  function renderLevels() {
    var bar = $('levelBar');
    bar.innerHTML = '';
    PROBLEMS.levels.forEach(function (lv) {
      var b = document.createElement('button');
      b.setAttribute('aria-selected', String(lv === session.level));
      b.setAttribute('data-level', lv);
      var dot = document.createElement('span');
      dot.className = 'dot ' + lv;
      b.appendChild(dot);
      b.appendChild(document.createTextNode(PROBLEMS.labels[lv]));
      if (session.mode !== 'practice') {
        var rec = recordFor(session.dateKey, lv);
        if (rec && rec.solved) {
          var c = document.createElement('span');
          c.className = 'check';
          c.textContent = '✓';
          b.appendChild(c);
        }
      }
      b.onclick = function () {
        session.level = lv;
        if (session.mode === 'practice') loadProblem(randomProblem(lv, null));
        else loadProblem(problemForDay(lv, dayNumberOf(dateFromKey(session.dateKey))));
      };
      bar.appendChild(b);
    });
  }

  // ------------------------------------------------------------- 아카이브

  function renderArchive() {
    var grid = $('archiveGrid');
    grid.innerHTML = '';
    var now = new Date();
    for (var i = 0; i < 35; i++) {
      var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      var k = keyOf(d);
      var day = store.days[k] || {};
      var solvedCount = PROBLEMS.levels.filter(function (lv) { return day[lv] && day[lv].solved; }).length;

      var el = document.createElement('button');
      el.className = 'day' + (k === TODAY_KEY ? ' today' : '') + (solvedCount ? ' done' : '');
      el.innerHTML = '<div class="d">' + d.getDate() + '</div>' +
        '<div class="m">' + (d.getMonth() + 1) + '월</div>' +
        '<div class="marks">' + PROBLEMS.levels.map(function (lv) {
          return (day[lv] && day[lv].solved) ? '●' : '○';
        }).join('') + '</div>';
      (function (key) {
        el.onclick = function () {
          session.mode = (key === TODAY_KEY) ? 'daily' : 'archive';
          session.dateKey = key;
          switchView('daily', true);
          loadProblem(problemForDay(session.level, dayNumberOf(dateFromKey(key))));
        };
      })(k);
      grid.appendChild(el);
    }
  }

  // ------------------------------------------------------------- 통계

  function renderStats() {
    var solvedByLevel = {}, uniqueByLevel = {};
    PROBLEMS.levels.forEach(function (lv) { solvedByLevel[lv] = 0; uniqueByLevel[lv] = {}; });
    var totalAttempts = 0, totalSolved = 0, daysActive = 0;

    Object.keys(store.days).forEach(function (k) {
      var day = store.days[k];
      var any = false;
      PROBLEMS.levels.forEach(function (lv) {
        var rec = day[lv];
        if (!rec) return;
        totalAttempts += rec.attempts || 0;
        if (rec.solved) {
          solvedByLevel[lv]++; totalSolved++; any = true;
          var p = problemForDay(lv, dayNumberOf(dateFromKey(k)));
          uniqueByLevel[lv][p.id] = true;
        }
      });
      if (any) daysActive++;
    });

    var acc = (totalSolved + store.practice.solved) === 0 ? 0 :
      Math.round(100 * (totalSolved + store.practice.solved) /
        Math.max(1, totalSolved + store.practice.solved + totalAttempts + store.practice.attempts));

    var cards = [
      { k: '현재 연속 학습일', v: effectiveStreak() + '일', sub: '오늘의 문제 기준' },
      { k: '최고 연속 기록', v: store.best + '일', sub: '' },
      { k: '해결한 일일 문제', v: String(totalSolved), sub: daysActive + '일 참여' },
      { k: '연습 모드 해결', v: String(store.practice.solved), sub: '기록에 영향 없음' },
      { k: '첫 시도 성공률', v: acc + '%', sub: '오답 시도 대비' }
    ];
    var grid = $('statGrid');
    grid.innerHTML = '';
    cards.forEach(function (c) {
      var el = document.createElement('div');
      el.className = 'stat';
      el.innerHTML = '<div class="k">' + c.k + '</div><div class="v">' + c.v + '</div>' +
        (c.sub ? '<div class="sub">' + c.sub + '</div>' : '');
      grid.appendChild(el);
    });

    var lvGrid = $('levelStats');
    lvGrid.innerHTML = '';
    PROBLEMS.levels.forEach(function (lv) {
      var total = PROBLEMS.byLevel[lv].length;
      var uniq = Object.keys(uniqueByLevel[lv]).length;
      var pct = Math.round(100 * uniq / total);
      var el = document.createElement('div');
      el.className = 'stat';
      el.innerHTML = '<div class="k">' + PROBLEMS.labels[lv] + '</div>' +
        '<div class="v">' + uniq + '<span class="sub"> / ' + total + '</span></div>' +
        '<div class="bar"><i style="width:' + pct + '%"></i></div>';
      lvGrid.appendChild(el);
    });
  }

  function renderStreak() {
    $('streakVal').textContent = effectiveStreak();
  }

  // ------------------------------------------------------------- 뷰 전환

  function switchView(view, keepSession) {
    document.querySelectorAll('.tabs button').forEach(function (b) {
      b.setAttribute('aria-selected', String(b.dataset.view === view ||
        (view === 'daily' && b.dataset.view === 'daily')));
    });
    $('playView').classList.toggle('hidden', !(view === 'daily' || view === 'practice'));
    $('archiveView').classList.toggle('hidden', view !== 'archive');
    $('statsView').classList.toggle('hidden', view !== 'stats');

    if (view === 'archive') renderArchive();
    if (view === 'stats') renderStats();
    if (keepSession) return;

    if (view === 'daily') {
      session.mode = 'daily';
      session.dateKey = TODAY_KEY;
      loadProblem(problemForDay(session.level, dayNumberOf(new Date())));
    } else if (view === 'practice') {
      session.mode = 'practice';
      loadProblem(randomProblem(session.level, session.problem && session.problem.id));
    }
  }

  // ------------------------------------------------------------- 카운트다운

  function tickCountdown() {
    var now = new Date();
    var next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    var s = Math.max(0, Math.floor((next - now) / 1000));
    var hh = String(Math.floor(s / 3600)).padStart(2, '0');
    var mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    var ss = String(s % 60).padStart(2, '0');
    $('resetVal').textContent = hh + ':' + mm + ':' + ss;
    if (s === 0) setTimeout(function () { location.reload(); }, 1500);
  }

  // ------------------------------------------------------------- 팔레트

  var PALETTE = [
    ['x\u00b2', '\u00b2'], ['x\u00b3', '\u00b3'], ['x\u207f', '^'],
    ['\u221a', '\u221a('], ['ln', 'ln('], ['e\u02e3', 'e^('],
    ['sin', 'sin('], ['cos', 'cos('], ['tan', 'tan('],
    ['arctan', 'atan('], ['arcsin', 'asin('], ['sinh', 'sinh('], ['cosh', 'cosh('],
    ['|\u00b7|', '|'], ['( )', '('], ['\u00b7', '\u00b7'], ['/', '/'],
    ['\u03c0', '\u03c0'], ['+C', '+C']
  ];

  function buildPalette() {
    var box = $('palette');
    PALETTE.forEach(function (pair) {
      var b = document.createElement('button');
      b.textContent = pair[0];
      b.onclick = function () {
        var inp = $('answerInput');
        var s = inp.selectionStart || inp.value.length;
        var e = inp.selectionEnd || s;
        inp.value = inp.value.slice(0, s) + pair[1] + inp.value.slice(e);
        inp.focus();
        inp.setSelectionRange(s + pair[1].length, s + pair[1].length);
        updatePreview();
      };
      box.appendChild(b);
    });
  }

  // ------------------------------------------------------------- 초기화

  function applyTheme() {
    document.documentElement.setAttribute('data-theme', store.theme);
    $('themeBtn').textContent = store.theme === 'dark' ? '☾' : '☀';
  }

  function init() {
    applyTheme();
    buildPalette();
    $('bankCount').textContent = PROBLEMS.all.length;

    $('themeBtn').onclick = function () {
      store.theme = store.theme === 'dark' ? 'light' : 'dark';
      save(); applyTheme();
    };

    document.querySelectorAll('.tabs button').forEach(function (b) {
      b.onclick = function () { switchView(b.dataset.view); };
    });

    $('submitBtn').onclick = check;
    $('answerInput').addEventListener('input', onAnswerInput);
    $('answerInput').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); check(); }
    });

    $('hintBtn').onclick = function () {
      var p = session.problem;
      if (session.hintsShown >= p.hints.length) {
        showFeedback('info', '더 이상 힌트가 없습니다. 해설 보기를 눌러 보세요.');
        return;
      }
      appendHint(session.hintsShown);
      session.hintsShown++;
      if (session.mode !== 'practice') {
        ensureRecord(session.dateKey, session.level).hints = session.hintsShown;
        save();
      }
      updateAttemptChip();
    };

    $('revealBtn').onclick = function () { revealSolution(false); };

    $('nextBtn').onclick = function () {
      loadProblem(randomProblem(session.level, session.problem && session.problem.id));
    };

    $('resetDataBtn').onclick = function () {
      if (!confirm('저장된 기록을 모두 지웁니다. 계속할까요?')) return;
      store = blankStore();
      save();
      applyTheme();
      renderStreak(); renderStats(); renderArchive(); renderLevels();
      switchView('daily');
    };

    renderStreak();
    renderArchive();
    renderStats();
    switchView('daily');

    tickCountdown();
    setInterval(tickCountdown, 1000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
