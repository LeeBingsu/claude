const M = require('./parser.js');
const P = require('./problems.js');
const p = id => P.find(id);

const cases = [
  // [문제, 사용자입력, 기대]
  ['e01', 'x^3-2x^2+5x', true],
  ['e01', 'x^3-2x^2+5x+C', true],
  ['e01', 'x^3-2x^2+5x - 42', true],          // 상수 차이는 정답
  ['e01', 'x^3-2x^2+4x', false],
  ['e01', '3x^2-4x+5', false],                // 피적분함수를 그대로 적음
  ['e01', '7', false],                        // x 없음
  ['e02', '2x^(3/2)/3', true],
  ['e02', '2/3*x*sqrt(x)', true],             // 다른 표현, 같은 함수
  ['e04', '5ln|x|', true],
  ['e04', 'ln(x^5)', true],                   // 로그 성질로 동치
  ['e06', '-cos(3x)/3', true],
  ['e06', 'cos(3x)/3', false],                // 부호 오류
  ['e06', '-cos(3x)', false],                 // 계수 누락 -> 배수 힌트
  ['e20', 'tan x - x', true],
  ['m07', 'x/2-sin(2x)/4', true],
  ['m07', 'x/2 - sin(x)cos(x)/2', true],      // 동치 표현
  ['m07', 'x/2 - sin(x)cos(x)', false],       // 계수 누락
  ['m10', '0.5*ln((x-1)/(x+1))', true],
  ['m12', 'cos(x)^3/3-cos(x)', true],
  ['h04', '(x*sqrt(1-x^2)+asin(x))/2', true],
  ['h04', 'asin(x)/2 + x*sqrt(1-x^2)/2', true],
  ['h11', '2sqrt(x)-2arctan(sqrt(x))', true],
  ['h03', '(2/sqrt3)atan((2x+1)/sqrt3)', true],
  ['m03', 'x*e^x - e^x', true],
  ['m22', 'e^x*(x^2-2x+2)', true],
];

let bad = 0;
for (const [id, input, expect] of cases) {
  const pr = p(id);
  const r = M.compareAntiderivative(input, pr.answer, pr.domain, pr.integrand);
  const got = r.ok;
  const mark = got === expect ? 'ok  ' : 'FAIL';
  if (got !== expect) bad++;
  console.log(`${mark} ${id}  "${input}" -> ${got}${r.detail ? '  :: ' + r.detail : ''}`);
}
console.log('---');
console.log(bad === 0 ? `채점 테스트 ${cases.length}건 전부 통과` : `${bad}건 실패`);
process.exit(bad ? 1 : 0);
