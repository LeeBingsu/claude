/*
 * verify.js - 문제 은행 자가 검증.
 *   1) answer 를 미분하면 integrand 와 같은가
 *   2) latex/answerLatex 등 필수 필드가 있는가
 *   3) id 가 중복되지 않는가
 * 실행: node verify.js
 */
var M = require('./parser.js');
var P = require('./problems.js');

var fails = 0, checked = 0;
var seen = {};

P.all.forEach(function (p) {
  var tag = '[' + p.id + '] ' + p.topic;
  ['id', 'level', 'integrand', 'latex', 'answer', 'answerLatex', 'domain', 'hints', 'steps', 'topic'].forEach(function (k) {
    if (k === 'level') return;                       // level 은 byLevel 로 주입
    if (p[k] === undefined || p[k] === null) { console.log('MISSING  ' + tag + ' -> ' + k); fails++; }
  });
  if (seen[p.id]) { console.log('DUP ID   ' + tag); fails++; }
  seen[p.id] = true;

  var f, F;
  try { f = M.compile(p.integrand); } catch (e) { console.log('PARSE!   ' + tag + ' integrand: ' + e.message); fails++; return; }
  try { F = M.compile(p.answer); } catch (e) { console.log('PARSE!   ' + tag + ' answer: ' + e.message); fails++; return; }

  var lo = p.domain[0], hi = p.domain[1];
  var worst = 0, worstAt = null, used = 0;
  for (var i = 1; i <= 12; i++) {
    var x = lo + (hi - lo) * i / 13;
    var target = f(x);
    var got = M.derivative(F, x, 1e-5);
    if (!isFinite(target) || !isFinite(got)) continue;
    used++;
    var err = Math.abs(got - target) / Math.max(1, Math.abs(target));
    if (err > worst) { worst = err; worstAt = x; }
  }
  checked++;
  if (used < 8) { console.log('DOMAIN!  ' + tag + ' 유효 표본 ' + used + '개'); fails++; return; }
  if (worst > 2e-5) {
    console.log('MISMATCH ' + tag + '  rel.err=' + worst.toExponential(2) + ' at x=' + worstAt.toFixed(3));
    console.log('           ∫ ' + p.integrand + '  vs  F = ' + p.answer);
    fails++;
  }
});

console.log('---');
console.log('문제 수: ' + P.all.length + ' (쉬움 ' + P.easy.length + ' / 보통 ' + P.medium.length + ' / 어려움 ' + P.hard.length + ')');
console.log(fails === 0 ? '모든 문제 검증 통과 (' + checked + '개)' : fails + '건 실패');
process.exit(fails === 0 ? 0 : 1);
