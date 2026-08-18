/*
 * grade-test.js - 채점 엔진 회귀 테스트.
 *   문제는 id 가 아니라 피적분함수로 찾는다(문제 은행을 다시 생성해도 깨지지 않도록).
 * 실행: node grade-test.js
 */
var M = require('./parser.js');
var P = require('./problems.js');

function pick(integrand) {
  var p = P.all.filter(function (q) { return q.integrand === integrand; })[0];
  if (!p) throw new Error('문제 은행에 없는 피적분함수: ' + integrand);
  return p;
}

// [피적분함수, 사용자 입력, 정답으로 인정되어야 하는가]
var cases = [
  ['3x^2 - 4x + 5', 'x^3-2x^2+5x', true],
  ['3x^2 - 4x + 5', 'x^3-2x^2+5x+C', true],
  ['3x^2 - 4x + 5', 'x^3-2x^2+5x - 42', true],        // 상수 차이는 정답
  ['3x^2 - 4x + 5', 'x^3-2x^2+4x', false],
  ['3x^2 - 4x + 5', '3x^2-4x+5', false],              // 피적분함수를 그대로 적음
  ['3x^2 - 4x + 5', '7', false],                      // x 가 없음

  ['5/x', '5ln|x|', true],
  ['5/x', 'ln(x^5)', true],                           // 로그 성질로 동치
  ['5/x', '5ln(x)+3', true],

  ['sin(3x)', '-cos(3x)/3', true],
  ['sin(3x)', 'cos(3x)/3', false],                    // 부호 오류
  ['sin(3x)', '-cos(3x)', false],                     // 계수 누락

  ['sin(x)^2', 'x/2-sin(2x)/4', true],
  ['sin(x)^2', 'x/2 - sin(x)cos(x)/2', true],         // 다른 표현, 같은 함수
  ['sin(x)^2', 'x/2 - sin(x)cos(x)', false],

  ['1/(x^2+1)', 'atan(x)', true],
  ['1/(x^2+1)', 'arctan(x) + pi', true],

  ['sqrt(1-x^2)', '(x*sqrt(1-x^2)+asin(x))/2', true],
  ['sqrt(1-x^2)', 'asin(x)/2 + x*sqrt(1-x^2)/2', true],

  ['x^2*ln(x)', 'x^3*ln(x)/3 - x^3/9', true],
  ['x^2*ln(x)', 'x^3*ln(x)/3 - x^3/3', false],

  // 쌍곡선함수
  ['tanh(x)', 'ln(cosh(x))', true],
  ['tanh(x)', 'ln(cosh x)', true],
  ['tanh(x)', 'ln(sinh(x))', false],
  ['1/sqrt(x^2+1)', 'asinh(x)', true],
  ['1/sqrt(x^2+1)', 'ln(x+sqrt(x^2+1))', true],       // arsinh 의 로그 표현
  ['sech(x)', 'atan(sinh(x))', true],
  ['sech(x)', '2atan(tanh(x/2))', true],              // 완전히 다른 표현이지만 상수 차이
  ['sinh(x)^2', 'sinh(2x)/4-x/2', true],
  ['sinh(x)^2', 'sinh(x)cosh(x)/2 - x/2', true],

  // 몬스터
  ['ln(x)^3', 'x*ln(x)^3 - 3x*ln(x)^2 + 6x*ln(x) - 6x', true],
  ['ln(x)^3', 'x*ln(x)^3 - 3x*ln(x)^2 + 6x*ln(x)', false],
  ['x*e^x*sin(x)', 'e^x*(x*sin(x)-x*cos(x)+cos(x))/2', true],
  ['sec(x)^5', 'sec(x)^3*tan(x)/4 + 3*sec(x)tan(x)/8 + 3*ln(sec(x)+tan(x))/8', true],
  ['1/(x^4+1)', 'atan((x^2-1)/(sqrt(2)x))/(2sqrt(2)) - ln((x^2-sqrt(2)x+1)/(x^2+sqrt(2)x+1))/(4sqrt(2))', true]
];

var bad = 0;
cases.forEach(function (c) {
  var p = pick(c[0]), input = c[1], expect = c[2];
  var r = M.compareAntiderivative(input, p.answer, p.domain, p.integrand);
  if (r.ok !== expect) bad++;
  console.log((r.ok === expect ? 'ok   ' : 'FAIL ') + '∫' + c[0] + '  "' + input + '" -> ' + r.ok +
              (r.detail ? '  :: ' + r.detail : ''));
});

console.log('---');
console.log(bad === 0 ? '채점 테스트 ' + cases.length + '건 전부 통과' : bad + '건 실패');
process.exit(bad ? 1 : 0);
