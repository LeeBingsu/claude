/*
 * verify.js - 배포된 problems.js 를 독립적으로 재검증한다.
 *   1) answer 를 수치 미분하면 integrand 와 같은가
 *   2) 필수 필드가 모두 있는가 / id 가 중복되지 않는가
 *   3) 힌트·풀이가 비어 있지 않은가
 * 실행: node verify.js
 */
var M = require('./parser.js');
var P = require('./problems.js');

var fails = 0, checked = 0, seen = {};

P.all.forEach(function (p) {
  var tag = '[' + p.id + '] ' + p.topic;

  ['id', 'topic', 'integrand', 'latex', 'answer', 'answerLatex', 'domain', 'hints', 'steps']
    .forEach(function (k) {
      if (p[k] === undefined || p[k] === null) { console.log('MISSING  ' + tag + ' -> ' + k); fails++; }
    });
  if (seen[p.id]) { console.log('DUP ID   ' + tag); fails++; }
  seen[p.id] = true;
  if (!p.hints || p.hints.length < 2) { console.log('HINTS!   ' + tag); fails++; }
  if (!p.steps || p.steps.length < 1) { console.log('STEPS!   ' + tag); fails++; }

  var f, F;
  try { f = M.compile(p.integrand); } catch (e) { console.log('PARSE!   ' + tag + ' integrand: ' + e.message); fails++; return; }
  try { F = M.compile(p.answer); } catch (e) { console.log('PARSE!   ' + tag + ' answer: ' + e.message); fails++; return; }

  var lo = p.domain[0], hi = p.domain[1];
  var worst = 0, worstAt = null, used = 0;
  for (var i = 1; i <= 14; i++) {
    var x = lo + (hi - lo) * i / 15;
    var target = f(x), got = M.derivative(F, x, 1e-5);
    if (!isFinite(target) || !isFinite(got)) continue;
    used++;
    var err = Math.abs(got - target) / Math.max(1, Math.abs(target));
    if (err > worst) { worst = err; worstAt = x; }
  }
  checked++;
  if (used < 9) { console.log('DOMAIN!  ' + tag + ' 유효 표본 ' + used + '개'); fails++; return; }
  if (worst > 5e-5) {
    console.log('MISMATCH ' + tag + '  rel.err=' + worst.toExponential(2) + ' at x=' + worstAt.toFixed(3));
    console.log('           ∫ ' + p.integrand + '  vs  F = ' + p.answer);
    fails++;
  }
});

console.log('---');
console.log('문제 수: ' + P.all.length + ' (' +
  P.levels.map(function (lv) { return P.labels[lv] + ' ' + P.byLevel[lv].length; }).join(' / ') + ')');
console.log(fails === 0 ? '모든 문제 검증 통과 (' + checked + '개)' : fails + '건 실패');
process.exit(fails === 0 ? 0 : 1);
