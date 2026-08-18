/*
 * problems.js - 적분 문제 은행 (자동 생성 파일).
 *
 *   이 파일은 generate.js 가 만든다. 직접 고치지 말고 generate.js 를 고친 뒤
 *   `node generate.js` 를 다시 실행할 것.
 *
 *   integrand : 채점·검증용 피적분함수(ASCII)
 *   answer    : 기준 부정적분(ASCII, +C 생략)
 *   domain    : 수치 비교에 쓰는 안전한 구간 (특이점 회피)
 *
 *   전체 532문항 - 쉬움 163 / 보통 147 / 어려움 161 / 몬스터 61
 */
(function (root, factory) {
  var api = factory();
  root.PROBLEMS = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var EASY = [
    {
      id: 'e001', topic: '거듭제곱 법칙',
      integrand: '2x^2', latex: '2 x^{2}',
      answer: '(2/3)*x^3', answerLatex: '\\frac{2}{3} x^{3}+C',
      domain: [0.3, 2.4],
      hints: ['$\\int x^{n}dx=\\dfrac{x^{n+1}}{n+1}$ 을 그대로 쓴다.', '지수를 $3$ 로 올리고 그 값으로 나눈다.'],
      steps: ['$\\int 2x^{2}dx = 2\\cdot\\dfrac{x^{3}}{3}$', '$= \\frac{2}{3} x^{3}$']
    },
    {
      id: 'e002', topic: '거듭제곱 법칙',
      integrand: '2x^3', latex: '2 x^{3}',
      answer: '(1/2)*x^4', answerLatex: '\\frac{1}{2} x^{4}+C',
      domain: [0.3, 2.4],
      hints: ['$\\int x^{n}dx=\\dfrac{x^{n+1}}{n+1}$ 을 그대로 쓴다.', '지수를 $4$ 로 올리고 그 값으로 나눈다.'],
      steps: ['$\\int 2x^{3}dx = 2\\cdot\\dfrac{x^{4}}{4}$', '$= \\frac{1}{2} x^{4}$']
    },
    {
      id: 'e003', topic: '거듭제곱 법칙',
      integrand: '2x^4', latex: '2 x^{4}',
      answer: '(2/5)*x^5', answerLatex: '\\frac{2}{5} x^{5}+C',
      domain: [0.3, 2.4],
      hints: ['$\\int x^{n}dx=\\dfrac{x^{n+1}}{n+1}$ 을 그대로 쓴다.', '지수를 $5$ 로 올리고 그 값으로 나눈다.'],
      steps: ['$\\int 2x^{4}dx = 2\\cdot\\dfrac{x^{5}}{5}$', '$= \\frac{2}{5} x^{5}$']
    },
    {
      id: 'e004', topic: '거듭제곱 법칙',
      integrand: '2x^5', latex: '2 x^{5}',
      answer: '(1/3)*x^6', answerLatex: '\\frac{1}{3} x^{6}+C',
      domain: [0.3, 2.4],
      hints: ['$\\int x^{n}dx=\\dfrac{x^{n+1}}{n+1}$ 을 그대로 쓴다.', '지수를 $6$ 로 올리고 그 값으로 나눈다.'],
      steps: ['$\\int 2x^{5}dx = 2\\cdot\\dfrac{x^{6}}{6}$', '$= \\frac{1}{3} x^{6}$']
    },
    {
      id: 'e005', topic: '거듭제곱 법칙',
      integrand: '3x^2', latex: '3 x^{2}',
      answer: 'x^3', answerLatex: 'x^{3}+C',
      domain: [0.3, 2.4],
      hints: ['$\\int x^{n}dx=\\dfrac{x^{n+1}}{n+1}$ 을 그대로 쓴다.', '지수를 $3$ 로 올리고 그 값으로 나눈다.'],
      steps: ['$\\int 3x^{2}dx = 3\\cdot\\dfrac{x^{3}}{3}$', '$= x^{3}$']
    },
    {
      id: 'e006', topic: '거듭제곱 법칙',
      integrand: '3x^3', latex: '3 x^{3}',
      answer: '(3/4)*x^4', answerLatex: '\\frac{3}{4} x^{4}+C',
      domain: [0.3, 2.4],
      hints: ['$\\int x^{n}dx=\\dfrac{x^{n+1}}{n+1}$ 을 그대로 쓴다.', '지수를 $4$ 로 올리고 그 값으로 나눈다.'],
      steps: ['$\\int 3x^{3}dx = 3\\cdot\\dfrac{x^{4}}{4}$', '$= \\frac{3}{4} x^{4}$']
    },
    {
      id: 'e007', topic: '거듭제곱 법칙',
      integrand: '3x^4', latex: '3 x^{4}',
      answer: '(3/5)*x^5', answerLatex: '\\frac{3}{5} x^{5}+C',
      domain: [0.3, 2.4],
      hints: ['$\\int x^{n}dx=\\dfrac{x^{n+1}}{n+1}$ 을 그대로 쓴다.', '지수를 $5$ 로 올리고 그 값으로 나눈다.'],
      steps: ['$\\int 3x^{4}dx = 3\\cdot\\dfrac{x^{5}}{5}$', '$= \\frac{3}{5} x^{5}$']
    },
    {
      id: 'e008', topic: '거듭제곱 법칙',
      integrand: '3x^5', latex: '3 x^{5}',
      answer: '(1/2)*x^6', answerLatex: '\\frac{1}{2} x^{6}+C',
      domain: [0.3, 2.4],
      hints: ['$\\int x^{n}dx=\\dfrac{x^{n+1}}{n+1}$ 을 그대로 쓴다.', '지수를 $6$ 로 올리고 그 값으로 나눈다.'],
      steps: ['$\\int 3x^{5}dx = 3\\cdot\\dfrac{x^{6}}{6}$', '$= \\frac{1}{2} x^{6}$']
    },
    {
      id: 'e009', topic: '거듭제곱 법칙',
      integrand: '-4x^2', latex: '-4 x^{2}',
      answer: '(-4/3)*x^3', answerLatex: '\\frac{-4}{3} x^{3}+C',
      domain: [0.3, 2.4],
      hints: ['$\\int x^{n}dx=\\dfrac{x^{n+1}}{n+1}$ 을 그대로 쓴다.', '지수를 $3$ 로 올리고 그 값으로 나눈다.'],
      steps: ['$\\int -4x^{2}dx = -4\\cdot\\dfrac{x^{3}}{3}$', '$= \\frac{-4}{3} x^{3}$']
    },
    {
      id: 'e010', topic: '거듭제곱 법칙',
      integrand: '-4x^3', latex: '-4 x^{3}',
      answer: '-x^4', answerLatex: '-x^{4}+C',
      domain: [0.3, 2.4],
      hints: ['$\\int x^{n}dx=\\dfrac{x^{n+1}}{n+1}$ 을 그대로 쓴다.', '지수를 $4$ 로 올리고 그 값으로 나눈다.'],
      steps: ['$\\int -4x^{3}dx = -4\\cdot\\dfrac{x^{4}}{4}$', '$= -x^{4}$']
    },
    {
      id: 'e011', topic: '거듭제곱 법칙',
      integrand: '-4x^4', latex: '-4 x^{4}',
      answer: '(-4/5)*x^5', answerLatex: '\\frac{-4}{5} x^{5}+C',
      domain: [0.3, 2.4],
      hints: ['$\\int x^{n}dx=\\dfrac{x^{n+1}}{n+1}$ 을 그대로 쓴다.', '지수를 $5$ 로 올리고 그 값으로 나눈다.'],
      steps: ['$\\int -4x^{4}dx = -4\\cdot\\dfrac{x^{5}}{5}$', '$= \\frac{-4}{5} x^{5}$']
    },
    {
      id: 'e012', topic: '거듭제곱 법칙',
      integrand: '-4x^5', latex: '-4 x^{5}',
      answer: '(-2/3)*x^6', answerLatex: '\\frac{-2}{3} x^{6}+C',
      domain: [0.3, 2.4],
      hints: ['$\\int x^{n}dx=\\dfrac{x^{n+1}}{n+1}$ 을 그대로 쓴다.', '지수를 $6$ 로 올리고 그 값으로 나눈다.'],
      steps: ['$\\int -4x^{5}dx = -4\\cdot\\dfrac{x^{6}}{6}$', '$= \\frac{-2}{3} x^{6}$']
    },
    {
      id: 'e013', topic: '거듭제곱 법칙',
      integrand: '7x^2', latex: '7 x^{2}',
      answer: '(7/3)*x^3', answerLatex: '\\frac{7}{3} x^{3}+C',
      domain: [0.3, 2.4],
      hints: ['$\\int x^{n}dx=\\dfrac{x^{n+1}}{n+1}$ 을 그대로 쓴다.', '지수를 $3$ 로 올리고 그 값으로 나눈다.'],
      steps: ['$\\int 7x^{2}dx = 7\\cdot\\dfrac{x^{3}}{3}$', '$= \\frac{7}{3} x^{3}$']
    },
    {
      id: 'e014', topic: '거듭제곱 법칙',
      integrand: '7x^3', latex: '7 x^{3}',
      answer: '(7/4)*x^4', answerLatex: '\\frac{7}{4} x^{4}+C',
      domain: [0.3, 2.4],
      hints: ['$\\int x^{n}dx=\\dfrac{x^{n+1}}{n+1}$ 을 그대로 쓴다.', '지수를 $4$ 로 올리고 그 값으로 나눈다.'],
      steps: ['$\\int 7x^{3}dx = 7\\cdot\\dfrac{x^{4}}{4}$', '$= \\frac{7}{4} x^{4}$']
    },
    {
      id: 'e015', topic: '거듭제곱 법칙',
      integrand: '7x^4', latex: '7 x^{4}',
      answer: '(7/5)*x^5', answerLatex: '\\frac{7}{5} x^{5}+C',
      domain: [0.3, 2.4],
      hints: ['$\\int x^{n}dx=\\dfrac{x^{n+1}}{n+1}$ 을 그대로 쓴다.', '지수를 $5$ 로 올리고 그 값으로 나눈다.'],
      steps: ['$\\int 7x^{4}dx = 7\\cdot\\dfrac{x^{5}}{5}$', '$= \\frac{7}{5} x^{5}$']
    },
    {
      id: 'e016', topic: '거듭제곱 법칙',
      integrand: '7x^5', latex: '7 x^{5}',
      answer: '(7/6)*x^6', answerLatex: '\\frac{7}{6} x^{6}+C',
      domain: [0.3, 2.4],
      hints: ['$\\int x^{n}dx=\\dfrac{x^{n+1}}{n+1}$ 을 그대로 쓴다.', '지수를 $6$ 로 올리고 그 값으로 나눈다.'],
      steps: ['$\\int 7x^{5}dx = 7\\cdot\\dfrac{x^{6}}{6}$', '$= \\frac{7}{6} x^{6}$']
    },
    {
      id: 'e017', topic: '다항함수',
      integrand: '3x^2 - 4x + 5', latex: '3 x^{2} - 4 x + 5',
      answer: 'x^3 - 2*x^2 + 5*x', answerLatex: 'x^{3} - 2 x^{2} + 5 x+C',
      domain: [0.3, 2.4],
      hints: ['각 항을 따로 적분한 뒤 더한다.', '상수항 $5$ 의 적분은 $5x$ 다.'],
      steps: ['$\\int 3 x^{2}dx = x^{3}$', '$\\int -4 x^{1}dx = -2 x^{2}$', '$\\int 5\\,dx = 5x$']
    },
    {
      id: 'e018', topic: '다항함수',
      integrand: '2x^3 + 5x - 3', latex: '2 x^{3} + 5 x - 3',
      answer: '(1/2)*x^4 + (5/2)*x^2 - 3*x', answerLatex: '\\frac{1}{2} x^{4} + \\frac{5}{2} x^{2} - 3 x+C',
      domain: [0.3, 2.4],
      hints: ['각 항을 따로 적분한 뒤 더한다.', '상수항 $-3$ 의 적분은 $-3x$ 다.'],
      steps: ['$\\int 2 x^{3}dx = \\frac{1}{2} x^{4}$', '$\\int 5 x^{1}dx = \\frac{5}{2} x^{2}$', '$\\int -3\\,dx = -3x$']
    },
    {
      id: 'e019', topic: '다항함수',
      integrand: '6x^2 - 2x + 7', latex: '6 x^{2} - 2 x + 7',
      answer: '2*x^3 - x^2 + 7*x', answerLatex: '2 x^{3} - x^{2} + 7 x+C',
      domain: [0.3, 2.4],
      hints: ['각 항을 따로 적분한 뒤 더한다.', '상수항 $7$ 의 적분은 $7x$ 다.'],
      steps: ['$\\int 6 x^{2}dx = 2 x^{3}$', '$\\int -2 x^{1}dx = -x^{2}$', '$\\int 7\\,dx = 7x$']
    },
    {
      id: 'e020', topic: '다항함수',
      integrand: '4x^3 + 3x^2 - 1', latex: '4 x^{3} + 3 x^{2} - 1',
      answer: 'x^4 + x^3 - x', answerLatex: 'x^{4} + x^{3} - x+C',
      domain: [0.3, 2.4],
      hints: ['각 항을 따로 적분한 뒤 더한다.', '상수항 $-1$ 의 적분은 $-1x$ 다.'],
      steps: ['$\\int 4 x^{3}dx = x^{4}$', '$\\int 3 x^{2}dx = x^{3}$', '$\\int -1\\,dx = -1x$']
    },
    {
      id: 'e021', topic: '다항함수',
      integrand: '5x^4 - 6x^2 + 2', latex: '5 x^{4} - 6 x^{2} + 2',
      answer: 'x^5 - 2*x^3 + 2*x', answerLatex: 'x^{5} - 2 x^{3} + 2 x+C',
      domain: [0.3, 2.4],
      hints: ['각 항을 따로 적분한 뒤 더한다.', '상수항 $2$ 의 적분은 $2x$ 다.'],
      steps: ['$\\int 5 x^{4}dx = x^{5}$', '$\\int -6 x^{2}dx = -2 x^{3}$', '$\\int 2\\,dx = 2x$']
    },
    {
      id: 'e022', topic: '다항함수',
      integrand: 'x^5 + 4x^3 - 8', latex: 'x^{5} + 4 x^{3} - 8',
      answer: '(1/6)*x^6 + x^4 - 8*x', answerLatex: '\\frac{1}{6} x^{6} + x^{4} - 8 x+C',
      domain: [0.3, 2.4],
      hints: ['각 항을 따로 적분한 뒤 더한다.', '상수항 $-8$ 의 적분은 $-8x$ 다.'],
      steps: ['$\\int x^{5}dx = \\frac{1}{6} x^{6}$', '$\\int 4 x^{3}dx = x^{4}$', '$\\int -8\\,dx = -8x$']
    },
    {
      id: 'e023', topic: '다항함수',
      integrand: '3x^3 - 5x^2 + 6', latex: '3 x^{3} - 5 x^{2} + 6',
      answer: '(3/4)*x^4 + (-5/3)*x^3 + 6*x', answerLatex: '\\frac{3}{4} x^{4} + \\frac{-5}{3} x^{3} + 6 x+C',
      domain: [0.3, 2.4],
      hints: ['각 항을 따로 적분한 뒤 더한다.', '상수항 $6$ 의 적분은 $6x$ 다.'],
      steps: ['$\\int 3 x^{3}dx = \\frac{3}{4} x^{4}$', '$\\int -5 x^{2}dx = \\frac{-5}{3} x^{3}$', '$\\int 6\\,dx = 6x$']
    },
    {
      id: 'e024', topic: '다항함수',
      integrand: '8x^2 - 3x + 1', latex: '8 x^{2} - 3 x + 1',
      answer: '(8/3)*x^3 + (-3/2)*x^2 + x', answerLatex: '\\frac{8}{3} x^{3} + \\frac{-3}{2} x^{2} + x+C',
      domain: [0.3, 2.4],
      hints: ['각 항을 따로 적분한 뒤 더한다.', '상수항 $1$ 의 적분은 $1x$ 다.'],
      steps: ['$\\int 8 x^{2}dx = \\frac{8}{3} x^{3}$', '$\\int -3 x^{1}dx = \\frac{-3}{2} x^{2}$', '$\\int 1\\,dx = 1x$']
    },
    {
      id: 'e025', topic: '다항함수',
      integrand: '7x^3 - 4x^4 + 3', latex: '7 x^{3} - 4 x^{4} + 3',
      answer: '(7/4)*x^4 + (-4/5)*x^5 + 3*x', answerLatex: '\\frac{7}{4} x^{4} + \\frac{-4}{5} x^{5} + 3 x+C',
      domain: [0.3, 2.4],
      hints: ['각 항을 따로 적분한 뒤 더한다.', '상수항 $3$ 의 적분은 $3x$ 다.'],
      steps: ['$\\int 7 x^{3}dx = \\frac{7}{4} x^{4}$', '$\\int -4 x^{4}dx = \\frac{-4}{5} x^{5}$', '$\\int 3\\,dx = 3x$']
    },
    {
      id: 'e026', topic: '다항함수',
      integrand: '3x^4 - 2x^2 + 5', latex: '3 x^{4} - 2 x^{2} + 5',
      answer: '(3/5)*x^5 + (-2/3)*x^3 + 5*x', answerLatex: '\\frac{3}{5} x^{5} + \\frac{-2}{3} x^{3} + 5 x+C',
      domain: [0.3, 2.4],
      hints: ['각 항을 따로 적분한 뒤 더한다.', '상수항 $5$ 의 적분은 $5x$ 다.'],
      steps: ['$\\int 3 x^{4}dx = \\frac{3}{5} x^{5}$', '$\\int -2 x^{2}dx = \\frac{-2}{3} x^{3}$', '$\\int 5\\,dx = 5x$']
    },
    {
      id: 'e027', topic: '거듭제곱 법칙',
      integrand: '1/x^2', latex: '\\frac{1}{x^{2}}',
      answer: '-1/x', answerLatex: '\\frac{-1}{x}+C',
      domain: [0.35, 2.6],
      hints: ['$x^{-2}$ 으로 고쳐 쓴다.', '지수 $-2$ 에 $1$ 을 더하면 $-1$ 이다.'],
      steps: ['$\\dfrac{1}{x^{2}} = 1x^{-2}$', '$\\int 1x^{-2}dx = \\frac{-1}{x^{1}}$']
    },
    {
      id: 'e028', topic: '거듭제곱 법칙',
      integrand: '1/x^3', latex: '\\frac{1}{x^{3}}',
      answer: '(-1)/(2*x^2)', answerLatex: '\\frac{-1}{2 x^{2}}+C',
      domain: [0.35, 2.6],
      hints: ['$x^{-3}$ 으로 고쳐 쓴다.', '지수 $-3$ 에 $1$ 을 더하면 $-2$ 이다.'],
      steps: ['$\\dfrac{1}{x^{3}} = 1x^{-3}$', '$\\int 1x^{-3}dx = \\frac{-1}{2 x^{2}}$']
    },
    {
      id: 'e029', topic: '거듭제곱 법칙',
      integrand: '1/x^4', latex: '\\frac{1}{x^{4}}',
      answer: '(-1)/(3*x^3)', answerLatex: '\\frac{-1}{3 x^{3}}+C',
      domain: [0.35, 2.6],
      hints: ['$x^{-4}$ 으로 고쳐 쓴다.', '지수 $-4$ 에 $1$ 을 더하면 $-3$ 이다.'],
      steps: ['$\\dfrac{1}{x^{4}} = 1x^{-4}$', '$\\int 1x^{-4}dx = \\frac{-1}{3 x^{3}}$']
    },
    {
      id: 'e030', topic: '거듭제곱 법칙',
      integrand: '3/x^2', latex: '\\frac{3}{x^{2}}',
      answer: '-3/x', answerLatex: '\\frac{-3}{x}+C',
      domain: [0.35, 2.6],
      hints: ['$x^{-2}$ 으로 고쳐 쓴다.', '지수 $-2$ 에 $1$ 을 더하면 $-1$ 이다.'],
      steps: ['$\\dfrac{3}{x^{2}} = 3x^{-2}$', '$\\int 3x^{-2}dx = \\frac{-3}{x^{1}}$']
    },
    {
      id: 'e031', topic: '거듭제곱 법칙',
      integrand: '3/x^3', latex: '\\frac{3}{x^{3}}',
      answer: '(-3)/(2*x^2)', answerLatex: '\\frac{-3}{2 x^{2}}+C',
      domain: [0.35, 2.6],
      hints: ['$x^{-3}$ 으로 고쳐 쓴다.', '지수 $-3$ 에 $1$ 을 더하면 $-2$ 이다.'],
      steps: ['$\\dfrac{3}{x^{3}} = 3x^{-3}$', '$\\int 3x^{-3}dx = \\frac{-3}{2 x^{2}}$']
    },
    {
      id: 'e032', topic: '거듭제곱 법칙',
      integrand: '3/x^4', latex: '\\frac{3}{x^{4}}',
      answer: '-1/x^3', answerLatex: '\\frac{-1}{x^{3}}+C',
      domain: [0.35, 2.6],
      hints: ['$x^{-4}$ 으로 고쳐 쓴다.', '지수 $-4$ 에 $1$ 을 더하면 $-3$ 이다.'],
      steps: ['$\\dfrac{3}{x^{4}} = 3x^{-4}$', '$\\int 3x^{-4}dx = \\frac{-1}{x^{3}}$']
    },
    {
      id: 'e033', topic: '거듭제곱 법칙',
      integrand: '6/x^2', latex: '\\frac{6}{x^{2}}',
      answer: '-6/x', answerLatex: '\\frac{-6}{x}+C',
      domain: [0.35, 2.6],
      hints: ['$x^{-2}$ 으로 고쳐 쓴다.', '지수 $-2$ 에 $1$ 을 더하면 $-1$ 이다.'],
      steps: ['$\\dfrac{6}{x^{2}} = 6x^{-2}$', '$\\int 6x^{-2}dx = \\frac{-6}{x^{1}}$']
    },
    {
      id: 'e034', topic: '거듭제곱 법칙',
      integrand: '6/x^3', latex: '\\frac{6}{x^{3}}',
      answer: '-3/x^2', answerLatex: '\\frac{-3}{x^{2}}+C',
      domain: [0.35, 2.6],
      hints: ['$x^{-3}$ 으로 고쳐 쓴다.', '지수 $-3$ 에 $1$ 을 더하면 $-2$ 이다.'],
      steps: ['$\\dfrac{6}{x^{3}} = 6x^{-3}$', '$\\int 6x^{-3}dx = \\frac{-3}{x^{2}}$']
    },
    {
      id: 'e035', topic: '거듭제곱 법칙',
      integrand: '6/x^4', latex: '\\frac{6}{x^{4}}',
      answer: '-2/x^3', answerLatex: '\\frac{-2}{x^{3}}+C',
      domain: [0.35, 2.6],
      hints: ['$x^{-4}$ 으로 고쳐 쓴다.', '지수 $-4$ 에 $1$ 을 더하면 $-3$ 이다.'],
      steps: ['$\\dfrac{6}{x^{4}} = 6x^{-4}$', '$\\int 6x^{-4}dx = \\frac{-2}{x^{3}}$']
    },
    {
      id: 'e036', topic: '거듭제곱 법칙',
      integrand: '-2/x^2', latex: '\\frac{-2}{x^{2}}',
      answer: '2/x', answerLatex: '\\frac{2}{x}+C',
      domain: [0.35, 2.6],
      hints: ['$x^{-2}$ 으로 고쳐 쓴다.', '지수 $-2$ 에 $1$ 을 더하면 $-1$ 이다.'],
      steps: ['$\\dfrac{-2}{x^{2}} = -2x^{-2}$', '$\\int -2x^{-2}dx = \\frac{2}{x^{1}}$']
    },
    {
      id: 'e037', topic: '거듭제곱 법칙',
      integrand: '-2/x^3', latex: '\\frac{-2}{x^{3}}',
      answer: '1/x^2', answerLatex: '\\frac{1}{x^{2}}+C',
      domain: [0.35, 2.6],
      hints: ['$x^{-3}$ 으로 고쳐 쓴다.', '지수 $-3$ 에 $1$ 을 더하면 $-2$ 이다.'],
      steps: ['$\\dfrac{-2}{x^{3}} = -2x^{-3}$', '$\\int -2x^{-3}dx = \\frac{1}{x^{2}}$']
    },
    {
      id: 'e038', topic: '거듭제곱 법칙',
      integrand: '-2/x^4', latex: '\\frac{-2}{x^{4}}',
      answer: '(2)/(3*x^3)', answerLatex: '\\frac{2}{3 x^{3}}+C',
      domain: [0.35, 2.6],
      hints: ['$x^{-4}$ 으로 고쳐 쓴다.', '지수 $-4$ 에 $1$ 을 더하면 $-3$ 이다.'],
      steps: ['$\\dfrac{-2}{x^{4}} = -2x^{-4}$', '$\\int -2x^{-4}dx = \\frac{2}{3 x^{3}}$']
    },
    {
      id: 'e039', topic: '로그',
      integrand: '1/x', latex: '\\frac{1}{x}',
      answer: 'ln(x)', answerLatex: '\\ln\\left|x\\right|+C',
      domain: [0.35, 2.6],
      hints: ['$\\int\\dfrac{1}{x}dx$ 는 거듭제곱 법칙의 예외다.', '상수 $1$ 는 적분 밖으로 뺀다.'],
      steps: ['$\\int\\dfrac{1}{x}dx = \\ln|x|$']
    },
    {
      id: 'e040', topic: '로그',
      integrand: '2/x', latex: '\\frac{2}{x}',
      answer: '2*ln(x)', answerLatex: '2 \\ln\\left|x\\right|+C',
      domain: [0.35, 2.6],
      hints: ['$\\int\\dfrac{1}{x}dx$ 는 거듭제곱 법칙의 예외다.', '상수 $2$ 는 적분 밖으로 뺀다.'],
      steps: ['$2\\int\\dfrac{1}{x}dx = 2\\ln|x|$']
    },
    {
      id: 'e041', topic: '로그',
      integrand: '3/x', latex: '\\frac{3}{x}',
      answer: '3*ln(x)', answerLatex: '3 \\ln\\left|x\\right|+C',
      domain: [0.35, 2.6],
      hints: ['$\\int\\dfrac{1}{x}dx$ 는 거듭제곱 법칙의 예외다.', '상수 $3$ 는 적분 밖으로 뺀다.'],
      steps: ['$3\\int\\dfrac{1}{x}dx = 3\\ln|x|$']
    },
    {
      id: 'e042', topic: '로그',
      integrand: '5/x', latex: '\\frac{5}{x}',
      answer: '5*ln(x)', answerLatex: '5 \\ln\\left|x\\right|+C',
      domain: [0.35, 2.6],
      hints: ['$\\int\\dfrac{1}{x}dx$ 는 거듭제곱 법칙의 예외다.', '상수 $5$ 는 적분 밖으로 뺀다.'],
      steps: ['$5\\int\\dfrac{1}{x}dx = 5\\ln|x|$']
    },
    {
      id: 'e043', topic: '로그',
      integrand: '7/x', latex: '\\frac{7}{x}',
      answer: '7*ln(x)', answerLatex: '7 \\ln\\left|x\\right|+C',
      domain: [0.35, 2.6],
      hints: ['$\\int\\dfrac{1}{x}dx$ 는 거듭제곱 법칙의 예외다.', '상수 $7$ 는 적분 밖으로 뺀다.'],
      steps: ['$7\\int\\dfrac{1}{x}dx = 7\\ln|x|$']
    },
    {
      id: 'e044', topic: '로그',
      integrand: '-4/x', latex: '\\frac{-4}{x}',
      answer: '-4*ln(x)', answerLatex: '-4 \\ln\\left|x\\right|+C',
      domain: [0.35, 2.6],
      hints: ['$\\int\\dfrac{1}{x}dx$ 는 거듭제곱 법칙의 예외다.', '상수 $-4$ 는 적분 밖으로 뺀다.'],
      steps: ['$-4\\int\\dfrac{1}{x}dx = -4\\ln|x|$']
    },
    {
      id: 'e045', topic: '지수함수',
      integrand: 'e^(x)', latex: 'e^{x}',
      answer: 'e^(x)', answerLatex: 'e^{x}+C',
      domain: [-1.5, 1.7],
      hints: ['$u=x$ 로 두면 $du=\\,dx$ 다.', '안쪽 $x$ 의 계수 $1$ 로 나눈다.'],
      steps: ['$u=x,\\; du=\\,dx$', '$1\\int e^{u}du = e^{x}$']
    },
    {
      id: 'e046', topic: '지수함수',
      integrand: 'e^(2x)', latex: 'e^{2 x}',
      answer: '(1/2)*e^(2x)', answerLatex: '\\frac{1}{2} e^{2 x}+C',
      domain: [-1.5, 1.7],
      hints: ['$u=2x$ 로 두면 $du=2\\,dx$ 다.', '안쪽 $x$ 의 계수 $2$ 로 나눈다.'],
      steps: ['$u=2x,\\; du=2\\,dx$', '$\\dfrac{1}{2}\\int e^{u}du = \\frac{1}{2} e^{2 x}$']
    },
    {
      id: 'e047', topic: '지수함수',
      integrand: 'e^(3x)', latex: 'e^{3 x}',
      answer: '(1/3)*e^(3x)', answerLatex: '\\frac{1}{3} e^{3 x}+C',
      domain: [-1.5, 1.7],
      hints: ['$u=3x$ 로 두면 $du=3\\,dx$ 다.', '안쪽 $x$ 의 계수 $3$ 로 나눈다.'],
      steps: ['$u=3x,\\; du=3\\,dx$', '$\\dfrac{1}{3}\\int e^{u}du = \\frac{1}{3} e^{3 x}$']
    },
    {
      id: 'e048', topic: '지수함수',
      integrand: 'e^(-2x)', latex: 'e^{-2 x}',
      answer: '(-1/2)*e^(-2x)', answerLatex: '\\frac{-1}{2} e^{-2 x}+C',
      domain: [-1.5, 1.7],
      hints: ['$u=-2x$ 로 두면 $du=-2\\,dx$ 다.', '안쪽 $x$ 의 계수 $-2$ 로 나눈다.'],
      steps: ['$u=-2x,\\; du=-2\\,dx$', '$\\dfrac{1}{-2}\\int e^{u}du = \\frac{-1}{2} e^{-2 x}$']
    },
    {
      id: 'e049', topic: '지수함수',
      integrand: '2*e^(x)', latex: '2 e^{x}',
      answer: '2*e^(x)', answerLatex: '2 e^{x}+C',
      domain: [-1.5, 1.7],
      hints: ['$u=x$ 로 두면 $du=\\,dx$ 다.', '안쪽 $x$ 의 계수 $1$ 로 나눈다.'],
      steps: ['$u=x,\\; du=\\,dx$', '$2\\int e^{u}du = 2 e^{x}$']
    },
    {
      id: 'e050', topic: '지수함수',
      integrand: '2*e^(2x)', latex: '2 e^{2 x}',
      answer: 'e^(2x)', answerLatex: 'e^{2 x}+C',
      domain: [-1.5, 1.7],
      hints: ['$u=2x$ 로 두면 $du=2\\,dx$ 다.', '안쪽 $x$ 의 계수 $2$ 로 나눈다.'],
      steps: ['$u=2x,\\; du=2\\,dx$', '$\\dfrac{2}{2}\\int e^{u}du = e^{2 x}$']
    },
    {
      id: 'e051', topic: '지수함수',
      integrand: '2*e^(3x)', latex: '2 e^{3 x}',
      answer: '(2/3)*e^(3x)', answerLatex: '\\frac{2}{3} e^{3 x}+C',
      domain: [-1.5, 1.7],
      hints: ['$u=3x$ 로 두면 $du=3\\,dx$ 다.', '안쪽 $x$ 의 계수 $3$ 로 나눈다.'],
      steps: ['$u=3x,\\; du=3\\,dx$', '$\\dfrac{2}{3}\\int e^{u}du = \\frac{2}{3} e^{3 x}$']
    },
    {
      id: 'e052', topic: '지수함수',
      integrand: '2*e^(-2x)', latex: '2 e^{-2 x}',
      answer: '-e^(-2x)', answerLatex: '-e^{-2 x}+C',
      domain: [-1.5, 1.7],
      hints: ['$u=-2x$ 로 두면 $du=-2\\,dx$ 다.', '안쪽 $x$ 의 계수 $-2$ 로 나눈다.'],
      steps: ['$u=-2x,\\; du=-2\\,dx$', '$\\dfrac{2}{-2}\\int e^{u}du = -e^{-2 x}$']
    },
    {
      id: 'e053', topic: '지수함수',
      integrand: '-5*e^(x)', latex: '-5 e^{x}',
      answer: '-5*e^(x)', answerLatex: '-5 e^{x}+C',
      domain: [-1.5, 1.7],
      hints: ['$u=x$ 로 두면 $du=\\,dx$ 다.', '안쪽 $x$ 의 계수 $1$ 로 나눈다.'],
      steps: ['$u=x,\\; du=\\,dx$', '$-5\\int e^{u}du = -5 e^{x}$']
    },
    {
      id: 'e054', topic: '지수함수',
      integrand: '-5*e^(2x)', latex: '-5 e^{2 x}',
      answer: '(-5/2)*e^(2x)', answerLatex: '\\frac{-5}{2} e^{2 x}+C',
      domain: [-1.5, 1.7],
      hints: ['$u=2x$ 로 두면 $du=2\\,dx$ 다.', '안쪽 $x$ 의 계수 $2$ 로 나눈다.'],
      steps: ['$u=2x,\\; du=2\\,dx$', '$\\dfrac{-5}{2}\\int e^{u}du = \\frac{-5}{2} e^{2 x}$']
    },
    {
      id: 'e055', topic: '지수함수',
      integrand: '-5*e^(3x)', latex: '-5 e^{3 x}',
      answer: '(-5/3)*e^(3x)', answerLatex: '\\frac{-5}{3} e^{3 x}+C',
      domain: [-1.5, 1.7],
      hints: ['$u=3x$ 로 두면 $du=3\\,dx$ 다.', '안쪽 $x$ 의 계수 $3$ 로 나눈다.'],
      steps: ['$u=3x,\\; du=3\\,dx$', '$\\dfrac{-5}{3}\\int e^{u}du = \\frac{-5}{3} e^{3 x}$']
    },
    {
      id: 'e056', topic: '지수함수',
      integrand: '-5*e^(-2x)', latex: '-5 e^{-2 x}',
      answer: '(5/2)*e^(-2x)', answerLatex: '\\frac{5}{2} e^{-2 x}+C',
      domain: [-1.5, 1.7],
      hints: ['$u=-2x$ 로 두면 $du=-2\\,dx$ 다.', '안쪽 $x$ 의 계수 $-2$ 로 나눈다.'],
      steps: ['$u=-2x,\\; du=-2\\,dx$', '$\\dfrac{-5}{-2}\\int e^{u}du = \\frac{5}{2} e^{-2 x}$']
    },
    {
      id: 'e057', topic: '지수함수',
      integrand: '2^x', latex: '2^{x}',
      answer: '2^x/ln(2)', answerLatex: '\\frac{2^{x}}{\\ln 2}+C',
      domain: [-1.5, 1.7],
      hints: ['$2^{x}=e^{x\\ln 2}$ 로 바꾼다.', '밑의 자연로그 $\\ln 2$ 로 나눈다.'],
      steps: ['$2^{x}=e^{x\\ln 2}$', '$\\int 2^{x}dx=\\dfrac{2^{x}}{\\ln 2}$']
    },
    {
      id: 'e058', topic: '지수함수',
      integrand: '2*2^x', latex: '2 \\cdot 2^{x}',
      answer: '2*2^x/ln(2)', answerLatex: '\\frac{2 \\cdot 2^{x}}{\\ln 2}+C',
      domain: [-1.5, 1.7],
      hints: ['$2^{x}=e^{x\\ln 2}$ 로 바꾼다.', '밑의 자연로그 $\\ln 2$ 로 나눈다.'],
      steps: ['$2^{x}=e^{x\\ln 2}$', '$\\int 2^{x}dx=\\dfrac{2^{x}}{\\ln 2}$']
    },
    {
      id: 'e059', topic: '지수함수',
      integrand: '3^x', latex: '3^{x}',
      answer: '3^x/ln(3)', answerLatex: '\\frac{3^{x}}{\\ln 3}+C',
      domain: [-1.5, 1.7],
      hints: ['$3^{x}=e^{x\\ln 3}$ 로 바꾼다.', '밑의 자연로그 $\\ln 3$ 로 나눈다.'],
      steps: ['$3^{x}=e^{x\\ln 3}$', '$\\int 3^{x}dx=\\dfrac{3^{x}}{\\ln 3}$']
    },
    {
      id: 'e060', topic: '지수함수',
      integrand: '2*3^x', latex: '2 \\cdot 3^{x}',
      answer: '2*3^x/ln(3)', answerLatex: '\\frac{2 \\cdot 3^{x}}{\\ln 3}+C',
      domain: [-1.5, 1.7],
      hints: ['$3^{x}=e^{x\\ln 3}$ 로 바꾼다.', '밑의 자연로그 $\\ln 3$ 로 나눈다.'],
      steps: ['$3^{x}=e^{x\\ln 3}$', '$\\int 3^{x}dx=\\dfrac{3^{x}}{\\ln 3}$']
    },
    {
      id: 'e061', topic: '지수함수',
      integrand: '5^x', latex: '5^{x}',
      answer: '5^x/ln(5)', answerLatex: '\\frac{5^{x}}{\\ln 5}+C',
      domain: [-1.5, 1.7],
      hints: ['$5^{x}=e^{x\\ln 5}$ 로 바꾼다.', '밑의 자연로그 $\\ln 5$ 로 나눈다.'],
      steps: ['$5^{x}=e^{x\\ln 5}$', '$\\int 5^{x}dx=\\dfrac{5^{x}}{\\ln 5}$']
    },
    {
      id: 'e062', topic: '지수함수',
      integrand: '2*5^x', latex: '2 \\cdot 5^{x}',
      answer: '2*5^x/ln(5)', answerLatex: '\\frac{2 \\cdot 5^{x}}{\\ln 5}+C',
      domain: [-1.5, 1.7],
      hints: ['$5^{x}=e^{x\\ln 5}$ 로 바꾼다.', '밑의 자연로그 $\\ln 5$ 로 나눈다.'],
      steps: ['$5^{x}=e^{x\\ln 5}$', '$\\int 5^{x}dx=\\dfrac{5^{x}}{\\ln 5}$']
    },
    {
      id: 'e063', topic: '삼각함수',
      integrand: 'sin(x)', latex: '\\sin x',
      answer: '-cos(x)', answerLatex: '-\\cos x+C',
      domain: [0.25, 2.85],
      hints: ['$\\int\\sin u\\,du=-\\cos u$ 다.', '안쪽 계수 $1$ 로 나눈다.'],
      steps: ['$u=x,\\;du=\\,dx$', '$= -\\cos x$']
    },
    {
      id: 'e064', topic: '삼각함수',
      integrand: 'cos(x)', latex: '\\cos x',
      answer: 'sin(x)', answerLatex: '\\sin x+C',
      domain: [0.25, 2.85],
      hints: ['$\\int\\cos u\\,du=\\sin u$ 다.', '안쪽 계수 $1$ 로 나눈다.'],
      steps: ['$u=x,\\;du=\\,dx$', '$= \\sin x$']
    },
    {
      id: 'e065', topic: '삼각함수',
      integrand: 'sin(2x)', latex: '\\sin\\left(2 x\\right)',
      answer: '(-1/2)*cos(2x)', answerLatex: '\\frac{-1}{2} \\cos\\left(2 x\\right)+C',
      domain: [0.25, 2.85],
      hints: ['$\\int\\sin u\\,du=-\\cos u$ 다.', '안쪽 계수 $2$ 로 나눈다.'],
      steps: ['$u=2x,\\;du=2\\,dx$', '$= \\frac{-1}{2} \\cos\\left(2 x\\right)$']
    },
    {
      id: 'e066', topic: '삼각함수',
      integrand: 'cos(2x)', latex: '\\cos\\left(2 x\\right)',
      answer: '(1/2)*sin(2x)', answerLatex: '\\frac{1}{2} \\sin\\left(2 x\\right)+C',
      domain: [0.25, 2.85],
      hints: ['$\\int\\cos u\\,du=\\sin u$ 다.', '안쪽 계수 $2$ 로 나눈다.'],
      steps: ['$u=2x,\\;du=2\\,dx$', '$= \\frac{1}{2} \\sin\\left(2 x\\right)$']
    },
    {
      id: 'e067', topic: '삼각함수',
      integrand: 'sin(3x)', latex: '\\sin\\left(3 x\\right)',
      answer: '(-1/3)*cos(3x)', answerLatex: '\\frac{-1}{3} \\cos\\left(3 x\\right)+C',
      domain: [0.25, 2.85],
      hints: ['$\\int\\sin u\\,du=-\\cos u$ 다.', '안쪽 계수 $3$ 로 나눈다.'],
      steps: ['$u=3x,\\;du=3\\,dx$', '$= \\frac{-1}{3} \\cos\\left(3 x\\right)$']
    },
    {
      id: 'e068', topic: '삼각함수',
      integrand: 'cos(3x)', latex: '\\cos\\left(3 x\\right)',
      answer: '(1/3)*sin(3x)', answerLatex: '\\frac{1}{3} \\sin\\left(3 x\\right)+C',
      domain: [0.25, 2.85],
      hints: ['$\\int\\cos u\\,du=\\sin u$ 다.', '안쪽 계수 $3$ 로 나눈다.'],
      steps: ['$u=3x,\\;du=3\\,dx$', '$= \\frac{1}{3} \\sin\\left(3 x\\right)$']
    },
    {
      id: 'e069', topic: '삼각함수',
      integrand: 'sin(4x)', latex: '\\sin\\left(4 x\\right)',
      answer: '(-1/4)*cos(4x)', answerLatex: '\\frac{-1}{4} \\cos\\left(4 x\\right)+C',
      domain: [0.25, 2.85],
      hints: ['$\\int\\sin u\\,du=-\\cos u$ 다.', '안쪽 계수 $4$ 로 나눈다.'],
      steps: ['$u=4x,\\;du=4\\,dx$', '$= \\frac{-1}{4} \\cos\\left(4 x\\right)$']
    },
    {
      id: 'e070', topic: '삼각함수',
      integrand: 'cos(4x)', latex: '\\cos\\left(4 x\\right)',
      answer: '(1/4)*sin(4x)', answerLatex: '\\frac{1}{4} \\sin\\left(4 x\\right)+C',
      domain: [0.25, 2.85],
      hints: ['$\\int\\cos u\\,du=\\sin u$ 다.', '안쪽 계수 $4$ 로 나눈다.'],
      steps: ['$u=4x,\\;du=4\\,dx$', '$= \\frac{1}{4} \\sin\\left(4 x\\right)$']
    },
    {
      id: 'e071', topic: '삼각함수',
      integrand: '2*sin(x)', latex: '2 \\sin x',
      answer: '-2*cos(x)', answerLatex: '-2 \\cos x+C',
      domain: [0.25, 2.85],
      hints: ['$\\int\\sin u\\,du=-\\cos u$ 다.', '안쪽 계수 $1$ 로 나눈다.'],
      steps: ['$u=x,\\;du=\\,dx$', '$= -2 \\cos x$']
    },
    {
      id: 'e072', topic: '삼각함수',
      integrand: '2*cos(x)', latex: '2 \\cos x',
      answer: '2*sin(x)', answerLatex: '2 \\sin x+C',
      domain: [0.25, 2.85],
      hints: ['$\\int\\cos u\\,du=\\sin u$ 다.', '안쪽 계수 $1$ 로 나눈다.'],
      steps: ['$u=x,\\;du=\\,dx$', '$= 2 \\sin x$']
    },
    {
      id: 'e073', topic: '삼각함수',
      integrand: '2*sin(2x)', latex: '2 \\sin\\left(2 x\\right)',
      answer: '-cos(2x)', answerLatex: '-\\cos\\left(2 x\\right)+C',
      domain: [0.25, 2.85],
      hints: ['$\\int\\sin u\\,du=-\\cos u$ 다.', '안쪽 계수 $2$ 로 나눈다.'],
      steps: ['$u=2x,\\;du=2\\,dx$', '$= -\\cos\\left(2 x\\right)$']
    },
    {
      id: 'e074', topic: '삼각함수',
      integrand: '2*cos(2x)', latex: '2 \\cos\\left(2 x\\right)',
      answer: 'sin(2x)', answerLatex: '\\sin\\left(2 x\\right)+C',
      domain: [0.25, 2.85],
      hints: ['$\\int\\cos u\\,du=\\sin u$ 다.', '안쪽 계수 $2$ 로 나눈다.'],
      steps: ['$u=2x,\\;du=2\\,dx$', '$= \\sin\\left(2 x\\right)$']
    },
    {
      id: 'e075', topic: '삼각함수',
      integrand: '2*sin(3x)', latex: '2 \\sin\\left(3 x\\right)',
      answer: '(-2/3)*cos(3x)', answerLatex: '\\frac{-2}{3} \\cos\\left(3 x\\right)+C',
      domain: [0.25, 2.85],
      hints: ['$\\int\\sin u\\,du=-\\cos u$ 다.', '안쪽 계수 $3$ 로 나눈다.'],
      steps: ['$u=3x,\\;du=3\\,dx$', '$= \\frac{-2}{3} \\cos\\left(3 x\\right)$']
    },
    {
      id: 'e076', topic: '삼각함수',
      integrand: '2*cos(3x)', latex: '2 \\cos\\left(3 x\\right)',
      answer: '(2/3)*sin(3x)', answerLatex: '\\frac{2}{3} \\sin\\left(3 x\\right)+C',
      domain: [0.25, 2.85],
      hints: ['$\\int\\cos u\\,du=\\sin u$ 다.', '안쪽 계수 $3$ 로 나눈다.'],
      steps: ['$u=3x,\\;du=3\\,dx$', '$= \\frac{2}{3} \\sin\\left(3 x\\right)$']
    },
    {
      id: 'e077', topic: '삼각함수',
      integrand: '2*sin(4x)', latex: '2 \\sin\\left(4 x\\right)',
      answer: '(-1/2)*cos(4x)', answerLatex: '\\frac{-1}{2} \\cos\\left(4 x\\right)+C',
      domain: [0.25, 2.85],
      hints: ['$\\int\\sin u\\,du=-\\cos u$ 다.', '안쪽 계수 $4$ 로 나눈다.'],
      steps: ['$u=4x,\\;du=4\\,dx$', '$= \\frac{-1}{2} \\cos\\left(4 x\\right)$']
    },
    {
      id: 'e078', topic: '삼각함수',
      integrand: '2*cos(4x)', latex: '2 \\cos\\left(4 x\\right)',
      answer: '(1/2)*sin(4x)', answerLatex: '\\frac{1}{2} \\sin\\left(4 x\\right)+C',
      domain: [0.25, 2.85],
      hints: ['$\\int\\cos u\\,du=\\sin u$ 다.', '안쪽 계수 $4$ 로 나눈다.'],
      steps: ['$u=4x,\\;du=4\\,dx$', '$= \\frac{1}{2} \\sin\\left(4 x\\right)$']
    },
    {
      id: 'e079', topic: '삼각함수',
      integrand: '-4*sin(x)', latex: '-4 \\sin x',
      answer: '4*cos(x)', answerLatex: '4 \\cos x+C',
      domain: [0.25, 2.85],
      hints: ['$\\int\\sin u\\,du=-\\cos u$ 다.', '안쪽 계수 $1$ 로 나눈다.'],
      steps: ['$u=x,\\;du=\\,dx$', '$= 4 \\cos x$']
    },
    {
      id: 'e080', topic: '삼각함수',
      integrand: '-4*cos(x)', latex: '-4 \\cos x',
      answer: '-4*sin(x)', answerLatex: '-4 \\sin x+C',
      domain: [0.25, 2.85],
      hints: ['$\\int\\cos u\\,du=\\sin u$ 다.', '안쪽 계수 $1$ 로 나눈다.'],
      steps: ['$u=x,\\;du=\\,dx$', '$= -4 \\sin x$']
    },
    {
      id: 'e081', topic: '삼각함수',
      integrand: '-4*sin(2x)', latex: '-4 \\sin\\left(2 x\\right)',
      answer: '2*cos(2x)', answerLatex: '2 \\cos\\left(2 x\\right)+C',
      domain: [0.25, 2.85],
      hints: ['$\\int\\sin u\\,du=-\\cos u$ 다.', '안쪽 계수 $2$ 로 나눈다.'],
      steps: ['$u=2x,\\;du=2\\,dx$', '$= 2 \\cos\\left(2 x\\right)$']
    },
    {
      id: 'e082', topic: '삼각함수',
      integrand: '-4*cos(2x)', latex: '-4 \\cos\\left(2 x\\right)',
      answer: '-2*sin(2x)', answerLatex: '-2 \\sin\\left(2 x\\right)+C',
      domain: [0.25, 2.85],
      hints: ['$\\int\\cos u\\,du=\\sin u$ 다.', '안쪽 계수 $2$ 로 나눈다.'],
      steps: ['$u=2x,\\;du=2\\,dx$', '$= -2 \\sin\\left(2 x\\right)$']
    },
    {
      id: 'e083', topic: '삼각함수',
      integrand: '-4*sin(3x)', latex: '-4 \\sin\\left(3 x\\right)',
      answer: '(4/3)*cos(3x)', answerLatex: '\\frac{4}{3} \\cos\\left(3 x\\right)+C',
      domain: [0.25, 2.85],
      hints: ['$\\int\\sin u\\,du=-\\cos u$ 다.', '안쪽 계수 $3$ 로 나눈다.'],
      steps: ['$u=3x,\\;du=3\\,dx$', '$= \\frac{4}{3} \\cos\\left(3 x\\right)$']
    },
    {
      id: 'e084', topic: '삼각함수',
      integrand: '-4*cos(3x)', latex: '-4 \\cos\\left(3 x\\right)',
      answer: '(-4/3)*sin(3x)', answerLatex: '\\frac{-4}{3} \\sin\\left(3 x\\right)+C',
      domain: [0.25, 2.85],
      hints: ['$\\int\\cos u\\,du=\\sin u$ 다.', '안쪽 계수 $3$ 로 나눈다.'],
      steps: ['$u=3x,\\;du=3\\,dx$', '$= \\frac{-4}{3} \\sin\\left(3 x\\right)$']
    },
    {
      id: 'e085', topic: '삼각함수',
      integrand: '-4*sin(4x)', latex: '-4 \\sin\\left(4 x\\right)',
      answer: 'cos(4x)', answerLatex: '\\cos\\left(4 x\\right)+C',
      domain: [0.25, 2.85],
      hints: ['$\\int\\sin u\\,du=-\\cos u$ 다.', '안쪽 계수 $4$ 로 나눈다.'],
      steps: ['$u=4x,\\;du=4\\,dx$', '$= \\cos\\left(4 x\\right)$']
    },
    {
      id: 'e086', topic: '삼각함수',
      integrand: '-4*cos(4x)', latex: '-4 \\cos\\left(4 x\\right)',
      answer: '-sin(4x)', answerLatex: '-\\sin\\left(4 x\\right)+C',
      domain: [0.25, 2.85],
      hints: ['$\\int\\cos u\\,du=\\sin u$ 다.', '안쪽 계수 $4$ 로 나눈다.'],
      steps: ['$u=4x,\\;du=4\\,dx$', '$= -\\sin\\left(4 x\\right)$']
    },
    {
      id: 'e087', topic: '삼각함수',
      integrand: 'sec(x)^2', latex: '\\sec^{2} x',
      answer: 'tan(x)', answerLatex: '\\tan x+C',
      domain: [0.25, 1.15],
      hints: ['$\\tan u$ 의 도함수가 $\\sec^{2}u$ 다.', '안쪽 계수 $1$ 로 나눈다.'],
      steps: ['$\\dfrac{d}{dx}\\tan x = \\sec^{2}x$']
    },
    {
      id: 'e088', topic: '삼각함수',
      integrand: 'csc(x)^2', latex: '\\csc^{2} x',
      answer: '-cot(x)', answerLatex: '-\\cot x+C',
      domain: [0.5, 2.3],
      hints: ['$\\cot u$ 의 도함수는 $-\\csc^{2}u$ 다.', '부호를 뒤집는다.'],
      steps: ['$\\dfrac{d}{dx}(-\\cot x) = \\csc^{2}x$']
    },
    {
      id: 'e089', topic: '삼각함수',
      integrand: 'sec(x)tan(x)', latex: '\\sec x \\tan x',
      answer: 'sec(x)', answerLatex: '\\sec x+C',
      domain: [0.25, 1.15],
      hints: ['$\\sec u$ 의 도함수를 그대로 떠올린다.', '치환이 필요 없다.'],
      steps: ['$\\dfrac{d}{dx}\\sec x = \\sec x\\tan x$']
    },
    {
      id: 'e090', topic: '삼각함수',
      integrand: 'csc(x)cot(x)', latex: '\\csc x \\cot x',
      answer: '-csc(x)', answerLatex: '-\\csc x+C',
      domain: [0.5, 2.3],
      hints: ['$\\csc u$ 의 도함수는 $-\\csc u\\cot u$ 다.', '부호에 주의한다.'],
      steps: ['$\\dfrac{d}{dx}(-\\csc x) = \\csc x\\cot x$']
    },
    {
      id: 'e091', topic: '삼각함수',
      integrand: 'sec(2x)^2', latex: '\\sec^{2}\\left(2 x\\right)',
      answer: '(1/2)*tan(2x)', answerLatex: '\\frac{1}{2} \\tan\\left(2 x\\right)+C',
      domain: [0.125, 0.575],
      hints: ['$\\tan u$ 의 도함수가 $\\sec^{2}u$ 다.', '안쪽 계수 $2$ 로 나눈다.'],
      steps: ['$\\dfrac{d}{dx}\\tan 2x = 2\\sec^{2}2x$']
    },
    {
      id: 'e092', topic: '삼각함수',
      integrand: 'csc(2x)^2', latex: '\\csc^{2}\\left(2 x\\right)',
      answer: '(-1/2)*cot(2x)', answerLatex: '\\frac{-1}{2} \\cot\\left(2 x\\right)+C',
      domain: [0.25, 1.15],
      hints: ['$\\cot u$ 의 도함수는 $-\\csc^{2}u$ 다.', '부호를 뒤집는다.'],
      steps: ['$\\dfrac{d}{dx}(-\\cot 2x) = 2\\csc^{2}2x$']
    },
    {
      id: 'e093', topic: '삼각함수',
      integrand: 'sec(2x)tan(2x)', latex: '\\sec\\left(2 x\\right) \\tan\\left(2 x\\right)',
      answer: '(1/2)*sec(2x)', answerLatex: '\\frac{1}{2} \\sec\\left(2 x\\right)+C',
      domain: [0.125, 0.575],
      hints: ['$\\sec u$ 의 도함수를 그대로 떠올린다.', '치환이 필요 없다.'],
      steps: ['$\\dfrac{d}{dx}\\sec 2x = 2\\sec 2x\\tan 2x$']
    },
    {
      id: 'e094', topic: '삼각함수',
      integrand: 'csc(2x)cot(2x)', latex: '\\csc\\left(2 x\\right) \\cot\\left(2 x\\right)',
      answer: '(-1/2)*csc(2x)', answerLatex: '\\frac{-1}{2} \\csc\\left(2 x\\right)+C',
      domain: [0.25, 1.15],
      hints: ['$\\csc u$ 의 도함수는 $-\\csc u\\cot u$ 다.', '부호에 주의한다.'],
      steps: ['$\\dfrac{d}{dx}(-\\csc 2x) = 2\\csc 2x\\cot 2x$']
    },
    {
      id: 'e095', topic: '치환(1차식)',
      integrand: '(2x + 1)^3', latex: '\\left(2 x + 1\\right)^{3}',
      answer: '(1/8)*(2x + 1)^4', answerLatex: '\\frac{1}{8} \\left(2 x + 1\\right)^{4}+C',
      domain: [0.2, 1.4],
      hints: ['전개하지 말고 $u=2x+1$ 로 둔다.', '$du=2\\,dx$ 이므로 마지막에 $2$ 로 나눈다.'],
      steps: ['$u=2x+1,\\;du=2\\,dx$', '$\\dfrac{1}{2}\\cdot\\dfrac{u^{4}}{4} = \\frac{1}{8} \\left(2 x + 1\\right)^{4}$']
    },
    {
      id: 'e096', topic: '치환(1차식)',
      integrand: '(2x + 1)^4', latex: '\\left(2 x + 1\\right)^{4}',
      answer: '(1/10)*(2x + 1)^5', answerLatex: '\\frac{1}{10} \\left(2 x + 1\\right)^{5}+C',
      domain: [0.2, 1.4],
      hints: ['전개하지 말고 $u=2x+1$ 로 둔다.', '$du=2\\,dx$ 이므로 마지막에 $2$ 로 나눈다.'],
      steps: ['$u=2x+1,\\;du=2\\,dx$', '$\\dfrac{1}{2}\\cdot\\dfrac{u^{5}}{5} = \\frac{1}{10} \\left(2 x + 1\\right)^{5}$']
    },
    {
      id: 'e097', topic: '치환(1차식)',
      integrand: '(2x - 1)^3', latex: '\\left(2 x - 1\\right)^{3}',
      answer: '(1/8)*(2x - 1)^4', answerLatex: '\\frac{1}{8} \\left(2 x - 1\\right)^{4}+C',
      domain: [0.2, 1.4],
      hints: ['전개하지 말고 $u=2x-1$ 로 둔다.', '$du=2\\,dx$ 이므로 마지막에 $2$ 로 나눈다.'],
      steps: ['$u=2x-1,\\;du=2\\,dx$', '$\\dfrac{1}{2}\\cdot\\dfrac{u^{4}}{4} = \\frac{1}{8} \\left(2 x - 1\\right)^{4}$']
    },
    {
      id: 'e098', topic: '치환(1차식)',
      integrand: '(2x - 1)^4', latex: '\\left(2 x - 1\\right)^{4}',
      answer: '(1/10)*(2x - 1)^5', answerLatex: '\\frac{1}{10} \\left(2 x - 1\\right)^{5}+C',
      domain: [0.2, 1.4],
      hints: ['전개하지 말고 $u=2x-1$ 로 둔다.', '$du=2\\,dx$ 이므로 마지막에 $2$ 로 나눈다.'],
      steps: ['$u=2x-1,\\;du=2\\,dx$', '$\\dfrac{1}{2}\\cdot\\dfrac{u^{5}}{5} = \\frac{1}{10} \\left(2 x - 1\\right)^{5}$']
    },
    {
      id: 'e099', topic: '치환(1차식)',
      integrand: '(2x + 3)^3', latex: '\\left(2 x + 3\\right)^{3}',
      answer: '(1/8)*(2x + 3)^4', answerLatex: '\\frac{1}{8} \\left(2 x + 3\\right)^{4}+C',
      domain: [0.2, 1.4],
      hints: ['전개하지 말고 $u=2x+3$ 로 둔다.', '$du=2\\,dx$ 이므로 마지막에 $2$ 로 나눈다.'],
      steps: ['$u=2x+3,\\;du=2\\,dx$', '$\\dfrac{1}{2}\\cdot\\dfrac{u^{4}}{4} = \\frac{1}{8} \\left(2 x + 3\\right)^{4}$']
    },
    {
      id: 'e100', topic: '치환(1차식)',
      integrand: '(2x + 3)^4', latex: '\\left(2 x + 3\\right)^{4}',
      answer: '(1/10)*(2x + 3)^5', answerLatex: '\\frac{1}{10} \\left(2 x + 3\\right)^{5}+C',
      domain: [0.2, 1.4],
      hints: ['전개하지 말고 $u=2x+3$ 로 둔다.', '$du=2\\,dx$ 이므로 마지막에 $2$ 로 나눈다.'],
      steps: ['$u=2x+3,\\;du=2\\,dx$', '$\\dfrac{1}{2}\\cdot\\dfrac{u^{5}}{5} = \\frac{1}{10} \\left(2 x + 3\\right)^{5}$']
    },
    {
      id: 'e101', topic: '치환(1차식)',
      integrand: '(3x + 1)^3', latex: '\\left(3 x + 1\\right)^{3}',
      answer: '(1/12)*(3x + 1)^4', answerLatex: '\\frac{1}{12} \\left(3 x + 1\\right)^{4}+C',
      domain: [0.2, 1.4],
      hints: ['전개하지 말고 $u=3x+1$ 로 둔다.', '$du=3\\,dx$ 이므로 마지막에 $3$ 로 나눈다.'],
      steps: ['$u=3x+1,\\;du=3\\,dx$', '$\\dfrac{1}{3}\\cdot\\dfrac{u^{4}}{4} = \\frac{1}{12} \\left(3 x + 1\\right)^{4}$']
    },
    {
      id: 'e102', topic: '치환(1차식)',
      integrand: '(3x + 1)^4', latex: '\\left(3 x + 1\\right)^{4}',
      answer: '(1/15)*(3x + 1)^5', answerLatex: '\\frac{1}{15} \\left(3 x + 1\\right)^{5}+C',
      domain: [0.2, 1.4],
      hints: ['전개하지 말고 $u=3x+1$ 로 둔다.', '$du=3\\,dx$ 이므로 마지막에 $3$ 로 나눈다.'],
      steps: ['$u=3x+1,\\;du=3\\,dx$', '$\\dfrac{1}{3}\\cdot\\dfrac{u^{5}}{5} = \\frac{1}{15} \\left(3 x + 1\\right)^{5}$']
    },
    {
      id: 'e103', topic: '치환(1차식)',
      integrand: '(3x - 1)^3', latex: '\\left(3 x - 1\\right)^{3}',
      answer: '(1/12)*(3x - 1)^4', answerLatex: '\\frac{1}{12} \\left(3 x - 1\\right)^{4}+C',
      domain: [0.2, 1.4],
      hints: ['전개하지 말고 $u=3x-1$ 로 둔다.', '$du=3\\,dx$ 이므로 마지막에 $3$ 로 나눈다.'],
      steps: ['$u=3x-1,\\;du=3\\,dx$', '$\\dfrac{1}{3}\\cdot\\dfrac{u^{4}}{4} = \\frac{1}{12} \\left(3 x - 1\\right)^{4}$']
    },
    {
      id: 'e104', topic: '치환(1차식)',
      integrand: '(3x - 1)^4', latex: '\\left(3 x - 1\\right)^{4}',
      answer: '(1/15)*(3x - 1)^5', answerLatex: '\\frac{1}{15} \\left(3 x - 1\\right)^{5}+C',
      domain: [0.2, 1.4],
      hints: ['전개하지 말고 $u=3x-1$ 로 둔다.', '$du=3\\,dx$ 이므로 마지막에 $3$ 로 나눈다.'],
      steps: ['$u=3x-1,\\;du=3\\,dx$', '$\\dfrac{1}{3}\\cdot\\dfrac{u^{5}}{5} = \\frac{1}{15} \\left(3 x - 1\\right)^{5}$']
    },
    {
      id: 'e105', topic: '치환(1차식)',
      integrand: '(3x + 3)^3', latex: '\\left(3 x + 3\\right)^{3}',
      answer: '(1/12)*(3x + 3)^4', answerLatex: '\\frac{1}{12} \\left(3 x + 3\\right)^{4}+C',
      domain: [0.2, 1.4],
      hints: ['전개하지 말고 $u=3x+3$ 로 둔다.', '$du=3\\,dx$ 이므로 마지막에 $3$ 로 나눈다.'],
      steps: ['$u=3x+3,\\;du=3\\,dx$', '$\\dfrac{1}{3}\\cdot\\dfrac{u^{4}}{4} = \\frac{1}{12} \\left(3 x + 3\\right)^{4}$']
    },
    {
      id: 'e106', topic: '치환(1차식)',
      integrand: '(3x + 3)^4', latex: '\\left(3 x + 3\\right)^{4}',
      answer: '(1/15)*(3x + 3)^5', answerLatex: '\\frac{1}{15} \\left(3 x + 3\\right)^{5}+C',
      domain: [0.2, 1.4],
      hints: ['전개하지 말고 $u=3x+3$ 로 둔다.', '$du=3\\,dx$ 이므로 마지막에 $3$ 로 나눈다.'],
      steps: ['$u=3x+3,\\;du=3\\,dx$', '$\\dfrac{1}{3}\\cdot\\dfrac{u^{5}}{5} = \\frac{1}{15} \\left(3 x + 3\\right)^{5}$']
    },
    {
      id: 'e107', topic: '치환(1차식)',
      integrand: '1/(2x + 1)', latex: '\\frac{1}{2 x + 1}',
      answer: '(1/2)*ln(2x + 1)', answerLatex: '\\frac{1}{2} \\ln\\left|2 x + 1\\right|+C',
      domain: [0.6, 2.6],
      hints: ['분모가 $1$ 차식이면 결과는 로그다.', '$du=2\\,dx$ 이므로 $2$ 로 나눈다.'],
      steps: ['$u=2x+1,\\;du=2\\,dx$', '$\\dfrac{1}{2}\\int\\dfrac{du}{u} = \\frac{1}{2} \\ln\\left|2 x + 1\\right|$']
    },
    {
      id: 'e108', topic: '치환(1차식)',
      integrand: '1/(2x + 3)', latex: '\\frac{1}{2 x + 3}',
      answer: '(1/2)*ln(2x + 3)', answerLatex: '\\frac{1}{2} \\ln\\left|2 x + 3\\right|+C',
      domain: [0.6, 2.6],
      hints: ['분모가 $1$ 차식이면 결과는 로그다.', '$du=2\\,dx$ 이므로 $2$ 로 나눈다.'],
      steps: ['$u=2x+3,\\;du=2\\,dx$', '$\\dfrac{1}{2}\\int\\dfrac{du}{u} = \\frac{1}{2} \\ln\\left|2 x + 3\\right|$']
    },
    {
      id: 'e109', topic: '치환(1차식)',
      integrand: '1/(2x - 1)', latex: '\\frac{1}{2 x - 1}',
      answer: '(1/2)*ln(2x - 1)', answerLatex: '\\frac{1}{2} \\ln\\left|2 x - 1\\right|+C',
      domain: [0.6, 2.6],
      hints: ['분모가 $1$ 차식이면 결과는 로그다.', '$du=2\\,dx$ 이므로 $2$ 로 나눈다.'],
      steps: ['$u=2x-1,\\;du=2\\,dx$', '$\\dfrac{1}{2}\\int\\dfrac{du}{u} = \\frac{1}{2} \\ln\\left|2 x - 1\\right|$']
    },
    {
      id: 'e110', topic: '치환(1차식)',
      integrand: '1/(3x + 1)', latex: '\\frac{1}{3 x + 1}',
      answer: '(1/3)*ln(3x + 1)', answerLatex: '\\frac{1}{3} \\ln\\left|3 x + 1\\right|+C',
      domain: [0.6, 2.6],
      hints: ['분모가 $1$ 차식이면 결과는 로그다.', '$du=3\\,dx$ 이므로 $3$ 로 나눈다.'],
      steps: ['$u=3x+1,\\;du=3\\,dx$', '$\\dfrac{1}{3}\\int\\dfrac{du}{u} = \\frac{1}{3} \\ln\\left|3 x + 1\\right|$']
    },
    {
      id: 'e111', topic: '치환(1차식)',
      integrand: '1/(3x + 3)', latex: '\\frac{1}{3 x + 3}',
      answer: '(1/3)*ln(3x + 3)', answerLatex: '\\frac{1}{3} \\ln\\left|3 x + 3\\right|+C',
      domain: [0.6, 2.6],
      hints: ['분모가 $1$ 차식이면 결과는 로그다.', '$du=3\\,dx$ 이므로 $3$ 로 나눈다.'],
      steps: ['$u=3x+3,\\;du=3\\,dx$', '$\\dfrac{1}{3}\\int\\dfrac{du}{u} = \\frac{1}{3} \\ln\\left|3 x + 3\\right|$']
    },
    {
      id: 'e112', topic: '치환(1차식)',
      integrand: '1/(3x - 1)', latex: '\\frac{1}{3 x - 1}',
      answer: '(1/3)*ln(3x - 1)', answerLatex: '\\frac{1}{3} \\ln\\left|3 x - 1\\right|+C',
      domain: [0.6, 2.6],
      hints: ['분모가 $1$ 차식이면 결과는 로그다.', '$du=3\\,dx$ 이므로 $3$ 로 나눈다.'],
      steps: ['$u=3x-1,\\;du=3\\,dx$', '$\\dfrac{1}{3}\\int\\dfrac{du}{u} = \\frac{1}{3} \\ln\\left|3 x - 1\\right|$']
    },
    {
      id: 'e113', topic: '역삼각함수',
      integrand: '1/(1+x^2)', latex: '\\frac{1}{1 + x^{2}}',
      answer: 'atan(x)', answerLatex: '\\arctan x+C',
      domain: [-1.5, 1.7],
      hints: ['$\\arctan x$ 의 도함수 형태다.', '상수 $1$ 만 앞으로 뺀다.'],
      steps: ['$\\dfrac{d}{dx}\\arctan x=\\dfrac{1}{1+x^{2}}$']
    },
    {
      id: 'e114', topic: '역삼각함수',
      integrand: '3/(1+x^2)', latex: '\\frac{3}{1 + x^{2}}',
      answer: '3*atan(x)', answerLatex: '3 \\arctan x+C',
      domain: [-1.5, 1.7],
      hints: ['$\\arctan x$ 의 도함수 형태다.', '상수 $3$ 만 앞으로 뺀다.'],
      steps: ['$\\dfrac{d}{dx}\\arctan x=\\dfrac{1}{1+x^{2}}$']
    },
    {
      id: 'e115', topic: '역삼각함수',
      integrand: '5/(1+x^2)', latex: '\\frac{5}{1 + x^{2}}',
      answer: '5*atan(x)', answerLatex: '5 \\arctan x+C',
      domain: [-1.5, 1.7],
      hints: ['$\\arctan x$ 의 도함수 형태다.', '상수 $5$ 만 앞으로 뺀다.'],
      steps: ['$\\dfrac{d}{dx}\\arctan x=\\dfrac{1}{1+x^{2}}$']
    },
    {
      id: 'e116', topic: '역삼각함수',
      integrand: '1/sqrt(1-x^2)', latex: '\\frac{1}{\\sqrt{1 - x^{2}}}',
      answer: 'asin(x)', answerLatex: '\\arcsin x+C',
      domain: [-0.72, 0.72],
      hints: ['$\\arcsin x$ 의 도함수 형태다.', '적분표에 그대로 있는 꼴이다.'],
      steps: ['$\\dfrac{d}{dx}\\arcsin x=\\dfrac{1}{\\sqrt{1-x^{2}}}$']
    },
    {
      id: 'e117', topic: '역삼각함수',
      integrand: '2/sqrt(1-x^2)', latex: '\\frac{2}{\\sqrt{1 - x^{2}}}',
      answer: '2*asin(x)', answerLatex: '2 \\arcsin x+C',
      domain: [-0.72, 0.72],
      hints: ['$\\arcsin x$ 의 도함수 형태다.', '적분표에 그대로 있는 꼴이다.'],
      steps: ['$\\dfrac{d}{dx}\\arcsin x=\\dfrac{1}{\\sqrt{1-x^{2}}}$']
    },
    {
      id: 'e118', topic: '역삼각함수',
      integrand: '4/sqrt(1-x^2)', latex: '\\frac{4}{\\sqrt{1 - x^{2}}}',
      answer: '4*asin(x)', answerLatex: '4 \\arcsin x+C',
      domain: [-0.72, 0.72],
      hints: ['$\\arcsin x$ 의 도함수 형태다.', '적분표에 그대로 있는 꼴이다.'],
      steps: ['$\\dfrac{d}{dx}\\arcsin x=\\dfrac{1}{\\sqrt{1-x^{2}}}$']
    },
    {
      id: 'e119', topic: '전개 후 적분',
      integrand: '(x + 1)(x + 3)', latex: '\\left(x + 1\\right) \\left(x + 3\\right)',
      answer: 'x^3/3 + 2*x^2 + 3*x', answerLatex: '\\frac{x^{3}}{3} + 2 x^{2} + 3 x+C',
      domain: [0.3, 2.4],
      hints: ['먼저 곱을 전개한다.', '$x^{2}+4x+3$ 를 적분한다.'],
      steps: ['$\\left(x + 1\\right) \\left(x + 3\\right) = x^{2}+4x+3$', '$\\int = \\frac{x^{3}}{3} + 2 x^{2} + 3 x$']
    },
    {
      id: 'e120', topic: '전개 후 적분',
      integrand: '(x + 2)(x - 1)', latex: '\\left(x + 2\\right) \\left(x - 1\\right)',
      answer: 'x^3/3 + (1/2)*x^2 - 2*x', answerLatex: '\\frac{x^{3}}{3} + \\frac{1}{2} x^{2} - 2 x+C',
      domain: [0.3, 2.4],
      hints: ['먼저 곱을 전개한다.', '$x^{2}+1x-2$ 를 적분한다.'],
      steps: ['$\\left(x + 2\\right) \\left(x - 1\\right) = x^{2}+1x-2$', '$\\int = \\frac{x^{3}}{3} + \\frac{1}{2} x^{2} - 2 x$']
    },
    {
      id: 'e121', topic: '전개 후 적분',
      integrand: '(x - 2)(x + 5)', latex: '\\left(x - 2\\right) \\left(x + 5\\right)',
      answer: 'x^3/3 + (3/2)*x^2 - 10*x', answerLatex: '\\frac{x^{3}}{3} + \\frac{3}{2} x^{2} - 10 x+C',
      domain: [0.3, 2.4],
      hints: ['먼저 곱을 전개한다.', '$x^{2}+3x-10$ 를 적분한다.'],
      steps: ['$\\left(x - 2\\right) \\left(x + 5\\right) = x^{2}+3x-10$', '$\\int = \\frac{x^{3}}{3} + \\frac{3}{2} x^{2} - 10 x$']
    },
    {
      id: 'e122', topic: '전개 후 적분',
      integrand: '(x + 3)(x + 4)', latex: '\\left(x + 3\\right) \\left(x + 4\\right)',
      answer: 'x^3/3 + (7/2)*x^2 + 12*x', answerLatex: '\\frac{x^{3}}{3} + \\frac{7}{2} x^{2} + 12 x+C',
      domain: [0.3, 2.4],
      hints: ['먼저 곱을 전개한다.', '$x^{2}+7x+12$ 를 적분한다.'],
      steps: ['$\\left(x + 3\\right) \\left(x + 4\\right) = x^{2}+7x+12$', '$\\int = \\frac{x^{3}}{3} + \\frac{7}{2} x^{2} + 12 x$']
    },
    {
      id: 'e123', topic: '전개 후 적분',
      integrand: '(x + 1)(x - 4)', latex: '\\left(x + 1\\right) \\left(x - 4\\right)',
      answer: 'x^3/3 + (-3/2)*x^2 - 4*x', answerLatex: '\\frac{x^{3}}{3} + \\frac{-3}{2} x^{2} - 4 x+C',
      domain: [0.3, 2.4],
      hints: ['먼저 곱을 전개한다.', '$x^{2}-3x-4$ 를 적분한다.'],
      steps: ['$\\left(x + 1\\right) \\left(x - 4\\right) = x^{2}-3x-4$', '$\\int = \\frac{x^{3}}{3} + \\frac{-3}{2} x^{2} - 4 x$']
    },
    {
      id: 'e124', topic: '전개 후 적분',
      integrand: '(x + 4)(x - 3)', latex: '\\left(x + 4\\right) \\left(x - 3\\right)',
      answer: 'x^3/3 + (1/2)*x^2 - 12*x', answerLatex: '\\frac{x^{3}}{3} + \\frac{1}{2} x^{2} - 12 x+C',
      domain: [0.3, 2.4],
      hints: ['먼저 곱을 전개한다.', '$x^{2}+1x-12$ 를 적분한다.'],
      steps: ['$\\left(x + 4\\right) \\left(x - 3\\right) = x^{2}+1x-12$', '$\\int = \\frac{x^{3}}{3} + \\frac{1}{2} x^{2} - 12 x$']
    },
    {
      id: 'e125', topic: '거듭제곱 법칙',
      integrand: 'sqrt(x)', latex: '\\sqrt{x}',
      answer: '(2/3)*x^(3/2)', answerLatex: '\\frac{2}{3} x^{\\frac{3}{2}}+C',
      domain: [0.35, 2.6],
      hints: ['$\\sqrt{x}=x^{1/2}$ 로 바꾼다.', '지수에 $1$ 을 더하면 $3/2$ 다.'],
      steps: ['$\\sqrt{x}=x^{1/2}$', '$\\int x^{1/2}dx=\\dfrac{2}{3}x^{3/2}$']
    },
    {
      id: 'e126', topic: '거듭제곱 법칙',
      integrand: '2*sqrt(x)', latex: '2 \\sqrt{x}',
      answer: '(4/3)*x^(3/2)', answerLatex: '\\frac{4}{3} x^{\\frac{3}{2}}+C',
      domain: [0.35, 2.6],
      hints: ['$\\sqrt{x}=x^{1/2}$ 로 바꾼다.', '지수에 $1$ 을 더하면 $3/2$ 다.'],
      steps: ['$\\sqrt{x}=x^{1/2}$', '$\\int x^{1/2}dx=\\dfrac{2}{3}x^{3/2}$']
    },
    {
      id: 'e127', topic: '거듭제곱 법칙',
      integrand: '3*sqrt(x)', latex: '3 \\sqrt{x}',
      answer: '2*x^(3/2)', answerLatex: '2 x^{\\frac{3}{2}}+C',
      domain: [0.35, 2.6],
      hints: ['$\\sqrt{x}=x^{1/2}$ 로 바꾼다.', '지수에 $1$ 을 더하면 $3/2$ 다.'],
      steps: ['$\\sqrt{x}=x^{1/2}$', '$\\int x^{1/2}dx=\\dfrac{2}{3}x^{3/2}$']
    },
    {
      id: 'e128', topic: '거듭제곱 법칙',
      integrand: 'x^(1/3)', latex: 'x^{\\frac{1}{3}}',
      answer: '(3/4)*x^((4)/3)', answerLatex: '\\frac{3}{4} x^{\\frac{4}{3}}+C',
      domain: [0.35, 2.6],
      hints: ['지수 $\\dfrac{1}{3}$ 에 $1$ 을 더하면 $\\dfrac{4}{3}$ 다.', '분수 지수는 그 역수를 곱한다고 생각한다.'],
      steps: ['$\\int x^{1/3}dx=\\dfrac{x^{4/3}}{4/3}$', '$= \\frac{3}{4} x^{\\frac{4}{3}}$']
    },
    {
      id: 'e129', topic: '거듭제곱 법칙',
      integrand: 'x^(2/3)', latex: 'x^{\\frac{2}{3}}',
      answer: '(3/5)*x^((5)/3)', answerLatex: '\\frac{3}{5} x^{\\frac{5}{3}}+C',
      domain: [0.35, 2.6],
      hints: ['지수 $\\dfrac{2}{3}$ 에 $1$ 을 더하면 $\\dfrac{5}{3}$ 다.', '분수 지수는 그 역수를 곱한다고 생각한다.'],
      steps: ['$\\int x^{2/3}dx=\\dfrac{x^{5/3}}{5/3}$', '$= \\frac{3}{5} x^{\\frac{5}{3}}$']
    },
    {
      id: 'e130', topic: '거듭제곱 법칙',
      integrand: 'x^(3/2)', latex: 'x^{\\frac{3}{2}}',
      answer: '(2/5)*x^((5)/2)', answerLatex: '\\frac{2}{5} x^{\\frac{5}{2}}+C',
      domain: [0.35, 2.6],
      hints: ['지수 $\\dfrac{3}{2}$ 에 $1$ 을 더하면 $\\dfrac{5}{2}$ 다.', '분수 지수는 그 역수를 곱한다고 생각한다.'],
      steps: ['$\\int x^{3/2}dx=\\dfrac{x^{5/2}}{5/2}$', '$= \\frac{2}{5} x^{\\frac{5}{2}}$']
    },
    {
      id: 'e131', topic: '거듭제곱 법칙',
      integrand: 'x^(4/3)', latex: 'x^{\\frac{4}{3}}',
      answer: '(3/7)*x^((7)/3)', answerLatex: '\\frac{3}{7} x^{\\frac{7}{3}}+C',
      domain: [0.35, 2.6],
      hints: ['지수 $\\dfrac{4}{3}$ 에 $1$ 을 더하면 $\\dfrac{7}{3}$ 다.', '분수 지수는 그 역수를 곱한다고 생각한다.'],
      steps: ['$\\int x^{4/3}dx=\\dfrac{x^{7/3}}{7/3}$', '$= \\frac{3}{7} x^{\\frac{7}{3}}$']
    },
    {
      id: 'e132', topic: '거듭제곱 법칙',
      integrand: 'x^(5/2)', latex: 'x^{\\frac{5}{2}}',
      answer: '(2/7)*x^((7)/2)', answerLatex: '\\frac{2}{7} x^{\\frac{7}{2}}+C',
      domain: [0.35, 2.6],
      hints: ['지수 $\\dfrac{5}{2}$ 에 $1$ 을 더하면 $\\dfrac{7}{2}$ 다.', '분수 지수는 그 역수를 곱한다고 생각한다.'],
      steps: ['$\\int x^{5/2}dx=\\dfrac{x^{7/2}}{7/2}$', '$= \\frac{2}{7} x^{\\frac{7}{2}}$']
    },
    {
      id: 'e133', topic: '거듭제곱 법칙',
      integrand: 'x^(5/3)', latex: 'x^{\\frac{5}{3}}',
      answer: '(3/8)*x^((8)/3)', answerLatex: '\\frac{3}{8} x^{\\frac{8}{3}}+C',
      domain: [0.35, 2.6],
      hints: ['지수 $\\dfrac{5}{3}$ 에 $1$ 을 더하면 $\\dfrac{8}{3}$ 다.', '분수 지수는 그 역수를 곱한다고 생각한다.'],
      steps: ['$\\int x^{5/3}dx=\\dfrac{x^{8/3}}{8/3}$', '$= \\frac{3}{8} x^{\\frac{8}{3}}$']
    },
    {
      id: 'e134', topic: '쌍곡선함수',
      integrand: 'sinh(x)', latex: '\\sinh x',
      answer: 'cosh(x)', answerLatex: '\\cosh x+C',
      domain: [0.25, 1.6],
      hints: ['$\\sinh$ 를 적분하면 $\\cosh$ 다. 삼각함수와 달리 부호가 바뀌지 않는다.', '안쪽 계수 $1$ 로 나눈다.'],
      steps: ['$\\dfrac{d}{dx}\\cosh x = \\sinh x$', '$= \\cosh x$']
    },
    {
      id: 'e135', topic: '쌍곡선함수',
      integrand: 'cosh(x)', latex: '\\cosh x',
      answer: 'sinh(x)', answerLatex: '\\sinh x+C',
      domain: [0.25, 1.6],
      hints: ['$\\cosh$ 를 적분하면 $\\sinh$ 다.', '안쪽 계수 $1$ 로 나눈다.'],
      steps: ['$\\dfrac{d}{dx}\\sinh x = \\cosh x$', '$= \\sinh x$']
    },
    {
      id: 'e136', topic: '쌍곡선함수',
      integrand: 'sinh(2x)', latex: '\\sinh\\left(2 x\\right)',
      answer: '(1/2)*cosh(2x)', answerLatex: '\\frac{1}{2} \\cosh\\left(2 x\\right)+C',
      domain: [0.25, 1.6],
      hints: ['$\\sinh$ 를 적분하면 $\\cosh$ 다. 삼각함수와 달리 부호가 바뀌지 않는다.', '안쪽 계수 $2$ 로 나눈다.'],
      steps: ['$\\dfrac{d}{dx}\\cosh 2x = 2\\sinh 2x$', '$= \\frac{1}{2} \\cosh\\left(2 x\\right)$']
    },
    {
      id: 'e137', topic: '쌍곡선함수',
      integrand: 'cosh(2x)', latex: '\\cosh\\left(2 x\\right)',
      answer: '(1/2)*sinh(2x)', answerLatex: '\\frac{1}{2} \\sinh\\left(2 x\\right)+C',
      domain: [0.25, 1.6],
      hints: ['$\\cosh$ 를 적분하면 $\\sinh$ 다.', '안쪽 계수 $2$ 로 나눈다.'],
      steps: ['$\\dfrac{d}{dx}\\sinh 2x = 2\\cosh 2x$', '$= \\frac{1}{2} \\sinh\\left(2 x\\right)$']
    },
    {
      id: 'e138', topic: '쌍곡선함수',
      integrand: 'sinh(3x)', latex: '\\sinh\\left(3 x\\right)',
      answer: '(1/3)*cosh(3x)', answerLatex: '\\frac{1}{3} \\cosh\\left(3 x\\right)+C',
      domain: [0.25, 1.6],
      hints: ['$\\sinh$ 를 적분하면 $\\cosh$ 다. 삼각함수와 달리 부호가 바뀌지 않는다.', '안쪽 계수 $3$ 로 나눈다.'],
      steps: ['$\\dfrac{d}{dx}\\cosh 3x = 3\\sinh 3x$', '$= \\frac{1}{3} \\cosh\\left(3 x\\right)$']
    },
    {
      id: 'e139', topic: '쌍곡선함수',
      integrand: 'cosh(3x)', latex: '\\cosh\\left(3 x\\right)',
      answer: '(1/3)*sinh(3x)', answerLatex: '\\frac{1}{3} \\sinh\\left(3 x\\right)+C',
      domain: [0.25, 1.6],
      hints: ['$\\cosh$ 를 적분하면 $\\sinh$ 다.', '안쪽 계수 $3$ 로 나눈다.'],
      steps: ['$\\dfrac{d}{dx}\\sinh 3x = 3\\cosh 3x$', '$= \\frac{1}{3} \\sinh\\left(3 x\\right)$']
    },
    {
      id: 'e140', topic: '쌍곡선함수',
      integrand: '2*sinh(x)', latex: '2 \\sinh x',
      answer: '2*cosh(x)', answerLatex: '2 \\cosh x+C',
      domain: [0.25, 1.6],
      hints: ['$\\sinh$ 를 적분하면 $\\cosh$ 다. 삼각함수와 달리 부호가 바뀌지 않는다.', '안쪽 계수 $1$ 로 나눈다.'],
      steps: ['$\\dfrac{d}{dx}\\cosh x = \\sinh x$', '$= 2 \\cosh x$']
    },
    {
      id: 'e141', topic: '쌍곡선함수',
      integrand: '2*cosh(x)', latex: '2 \\cosh x',
      answer: '2*sinh(x)', answerLatex: '2 \\sinh x+C',
      domain: [0.25, 1.6],
      hints: ['$\\cosh$ 를 적분하면 $\\sinh$ 다.', '안쪽 계수 $1$ 로 나눈다.'],
      steps: ['$\\dfrac{d}{dx}\\sinh x = \\cosh x$', '$= 2 \\sinh x$']
    },
    {
      id: 'e142', topic: '쌍곡선함수',
      integrand: '2*sinh(2x)', latex: '2 \\sinh\\left(2 x\\right)',
      answer: 'cosh(2x)', answerLatex: '\\cosh\\left(2 x\\right)+C',
      domain: [0.25, 1.6],
      hints: ['$\\sinh$ 를 적분하면 $\\cosh$ 다. 삼각함수와 달리 부호가 바뀌지 않는다.', '안쪽 계수 $2$ 로 나눈다.'],
      steps: ['$\\dfrac{d}{dx}\\cosh 2x = 2\\sinh 2x$', '$= \\cosh\\left(2 x\\right)$']
    },
    {
      id: 'e143', topic: '쌍곡선함수',
      integrand: '2*cosh(2x)', latex: '2 \\cosh\\left(2 x\\right)',
      answer: 'sinh(2x)', answerLatex: '\\sinh\\left(2 x\\right)+C',
      domain: [0.25, 1.6],
      hints: ['$\\cosh$ 를 적분하면 $\\sinh$ 다.', '안쪽 계수 $2$ 로 나눈다.'],
      steps: ['$\\dfrac{d}{dx}\\sinh 2x = 2\\cosh 2x$', '$= \\sinh\\left(2 x\\right)$']
    },
    {
      id: 'e144', topic: '쌍곡선함수',
      integrand: '2*sinh(3x)', latex: '2 \\sinh\\left(3 x\\right)',
      answer: '(2/3)*cosh(3x)', answerLatex: '\\frac{2}{3} \\cosh\\left(3 x\\right)+C',
      domain: [0.25, 1.6],
      hints: ['$\\sinh$ 를 적분하면 $\\cosh$ 다. 삼각함수와 달리 부호가 바뀌지 않는다.', '안쪽 계수 $3$ 로 나눈다.'],
      steps: ['$\\dfrac{d}{dx}\\cosh 3x = 3\\sinh 3x$', '$= \\frac{2}{3} \\cosh\\left(3 x\\right)$']
    },
    {
      id: 'e145', topic: '쌍곡선함수',
      integrand: '2*cosh(3x)', latex: '2 \\cosh\\left(3 x\\right)',
      answer: '(2/3)*sinh(3x)', answerLatex: '\\frac{2}{3} \\sinh\\left(3 x\\right)+C',
      domain: [0.25, 1.6],
      hints: ['$\\cosh$ 를 적분하면 $\\sinh$ 다.', '안쪽 계수 $3$ 로 나눈다.'],
      steps: ['$\\dfrac{d}{dx}\\sinh 3x = 3\\cosh 3x$', '$= \\frac{2}{3} \\sinh\\left(3 x\\right)$']
    },
    {
      id: 'e146', topic: '쌍곡선함수',
      integrand: 'sech(x)^2', latex: '\\operatorname{sech}^{2} x',
      answer: 'tanh(x)', answerLatex: '\\tanh x+C',
      domain: [0.25, 1.6],
      hints: ['$\\tanh u$ 의 도함수가 $\\operatorname{sech}^{2}u$ 다.', '삼각함수의 $\\sec^{2}$ 와 같은 자리다.'],
      steps: ['$\\dfrac{d}{dx}\\tanh x = \\operatorname{sech}^{2}x$']
    },
    {
      id: 'e147', topic: '쌍곡선함수',
      integrand: 'csch(x)^2', latex: '\\operatorname{csch}^{2} x',
      answer: '-coth(x)', answerLatex: '-\\coth x+C',
      domain: [0.35, 2],
      hints: ['$\\coth u$ 의 도함수는 $-\\operatorname{csch}^{2}u$ 다.', '부호를 뒤집는다.'],
      steps: ['$\\dfrac{d}{dx}(-\\coth x) = \\operatorname{csch}^{2}x$']
    },
    {
      id: 'e148', topic: '쌍곡선함수',
      integrand: 'sech(2x)^2', latex: '\\operatorname{sech}^{2}\\left(2 x\\right)',
      answer: '(1/2)*tanh(2x)', answerLatex: '\\frac{1}{2} \\tanh\\left(2 x\\right)+C',
      domain: [0.25, 1.6],
      hints: ['$\\tanh u$ 의 도함수가 $\\operatorname{sech}^{2}u$ 다.', '삼각함수의 $\\sec^{2}$ 와 같은 자리다.'],
      steps: ['$\\dfrac{d}{dx}\\tanh 2x = 2\\operatorname{sech}^{2}2x$']
    },
    {
      id: 'e149', topic: '쌍곡선함수',
      integrand: 'csch(2x)^2', latex: '\\operatorname{csch}^{2}\\left(2 x\\right)',
      answer: '(-1/2)*coth(2x)', answerLatex: '\\frac{-1}{2} \\coth\\left(2 x\\right)+C',
      domain: [0.35, 2],
      hints: ['$\\coth u$ 의 도함수는 $-\\operatorname{csch}^{2}u$ 다.', '부호를 뒤집는다.'],
      steps: ['$\\dfrac{d}{dx}(-\\coth 2x) = 2\\operatorname{csch}^{2}2x$']
    },
    {
      id: 'e150', topic: '쌍곡선함수',
      integrand: 'sech(3x)^2', latex: '\\operatorname{sech}^{2}\\left(3 x\\right)',
      answer: '(1/3)*tanh(3x)', answerLatex: '\\frac{1}{3} \\tanh\\left(3 x\\right)+C',
      domain: [0.25, 1.6],
      hints: ['$\\tanh u$ 의 도함수가 $\\operatorname{sech}^{2}u$ 다.', '삼각함수의 $\\sec^{2}$ 와 같은 자리다.'],
      steps: ['$\\dfrac{d}{dx}\\tanh 3x = 3\\operatorname{sech}^{2}3x$']
    },
    {
      id: 'e151', topic: '쌍곡선함수',
      integrand: 'csch(3x)^2', latex: '\\operatorname{csch}^{2}\\left(3 x\\right)',
      answer: '(-1/3)*coth(3x)', answerLatex: '\\frac{-1}{3} \\coth\\left(3 x\\right)+C',
      domain: [0.35, 2],
      hints: ['$\\coth u$ 의 도함수는 $-\\operatorname{csch}^{2}u$ 다.', '부호를 뒤집는다.'],
      steps: ['$\\dfrac{d}{dx}(-\\coth 3x) = 3\\operatorname{csch}^{2}3x$']
    },
    {
      id: 'e152', topic: '삼각항등식',
      integrand: 'tan(x)^2', latex: '\\tan^{2} x',
      answer: 'tan(x) - x', answerLatex: '\\tan x - x+C',
      domain: [0.25, 1.15],
      hints: ['$\\tan^{2}u=\\sec^{2}u-1$ 항등식을 쓴다.', '두 항 모두 기본 적분이다.'],
      steps: ['$\\tan^{2}x = \\sec^{2}x - 1$', '$\\int = \\tan x - x$']
    },
    {
      id: 'e153', topic: '삼각항등식',
      integrand: 'cot(x)^2', latex: '\\cot^{2} x',
      answer: '-cot(x) - x', answerLatex: '-\\cot x - x+C',
      domain: [0.5, 2.3],
      hints: ['$\\cot^{2}u=\\csc^{2}u-1$ 을 쓴다.', '부호에 주의한다.'],
      steps: ['$\\cot^{2}x = \\csc^{2}x - 1$', '$\\int = -\\cot x - x$']
    },
    {
      id: 'e154', topic: '삼각항등식',
      integrand: 'tan(2x)^2', latex: '\\tan^{2}\\left(2 x\\right)',
      answer: '(1/2)*tan(2x) - x', answerLatex: '\\frac{1}{2} \\tan\\left(2 x\\right) - x+C',
      domain: [0.125, 0.575],
      hints: ['$\\tan^{2}u=\\sec^{2}u-1$ 항등식을 쓴다.', '두 항 모두 기본 적분이다.'],
      steps: ['$\\tan^{2}2x = \\sec^{2}2x - 1$', '$\\int = \\frac{1}{2} \\tan\\left(2 x\\right) - x$']
    },
    {
      id: 'e155', topic: '삼각항등식',
      integrand: 'cot(2x)^2', latex: '\\cot^{2}\\left(2 x\\right)',
      answer: '(-1/2)*cot(2x) - x', answerLatex: '\\frac{-1}{2} \\cot\\left(2 x\\right) - x+C',
      domain: [0.25, 1.15],
      hints: ['$\\cot^{2}u=\\csc^{2}u-1$ 을 쓴다.', '부호에 주의한다.'],
      steps: ['$\\cot^{2}2x = \\csc^{2}2x - 1$', '$\\int = \\frac{-1}{2} \\cot\\left(2 x\\right) - x$']
    },
    {
      id: 'e156', topic: '기본 적분',
      integrand: 'e^x + 1/x', latex: 'e^{x} + \\frac{1}{x}',
      answer: 'e^x + ln(x)', answerLatex: 'e^{x} + \\ln\\left|x\\right|+C',
      domain: [0.35, 2.6],
      hints: ['두 항을 따로 적분한다.', '$e^{x}$ 는 적분해도 그대로다.'],
      steps: ['$\\int e^{x}dx = e^{x}$', '$\\int \\frac{1}{x}dx = \\ln\\left|x\\right|$']
    },
    {
      id: 'e157', topic: '기본 적분',
      integrand: '(x^2 + 1)/x', latex: '\\frac{x^{2} + 1}{x}',
      answer: '(1/2)*x^2 + ln(x)', answerLatex: '\\frac{1}{2} x^{2} + \\ln\\left|x\\right|+C',
      domain: [0.35, 2.6],
      hints: ['분자를 분모로 각각 나눠 항을 분리한다.', '$x + \\dfrac{1}{x}$ 가 된다.'],
      steps: ['$\\dfrac{x^{2} + 1}{x} = x + \\frac{1}{x}$', '$\\int = \\frac{1}{2} x^{2} + \\ln\\left|x\\right|$']
    },
    {
      id: 'e158', topic: '기본 적분',
      integrand: '2*e^x + 3/x', latex: '2 e^{x} + \\frac{3}{x}',
      answer: '2*e^x + 3*ln(x)', answerLatex: '2 e^{x} + 3 \\ln\\left|x\\right|+C',
      domain: [0.35, 2.6],
      hints: ['두 항을 따로 적분한다.', '$e^{x}$ 는 적분해도 그대로다.'],
      steps: ['$\\int 2 e^{x}dx = 2 e^{x}$', '$\\int \\frac{3}{x}dx = 3 \\ln\\left|x\\right|$']
    },
    {
      id: 'e159', topic: '기본 적분',
      integrand: '(2x^2 + 3)/x', latex: '\\frac{2 x^{2} + 3}{x}',
      answer: 'x^2 + 3*ln(x)', answerLatex: 'x^{2} + 3 \\ln\\left|x\\right|+C',
      domain: [0.35, 2.6],
      hints: ['분자를 분모로 각각 나눠 항을 분리한다.', '$2 x + \\dfrac{3}{x}$ 가 된다.'],
      steps: ['$\\dfrac{2 x^{2} + 3}{x} = 2 x + \\frac{3}{x}$', '$\\int = x^{2} + 3 \\ln\\left|x\\right|$']
    },
    {
      id: 'e160', topic: '기본 적분',
      integrand: '3*e^x - 2/x', latex: '3 e^{x} - \\frac{2}{x}',
      answer: '3*e^x - 2*ln(x)', answerLatex: '3 e^{x} - 2 \\ln\\left|x\\right|+C',
      domain: [0.35, 2.6],
      hints: ['두 항을 따로 적분한다.', '$e^{x}$ 는 적분해도 그대로다.'],
      steps: ['$\\int 3 e^{x}dx = 3 e^{x}$', '$\\int \\frac{-2}{x}dx = -2 \\ln\\left|x\\right|$']
    },
    {
      id: 'e161', topic: '기본 적분',
      integrand: '(3x^2 - 2)/x', latex: '\\frac{3 x^{2} - 2}{x}',
      answer: '(3/2)*x^2 - 2*ln(x)', answerLatex: '\\frac{3}{2} x^{2} - 2 \\ln\\left|x\\right|+C',
      domain: [0.35, 2.6],
      hints: ['분자를 분모로 각각 나눠 항을 분리한다.', '$3 x + \\dfrac{-2}{x}$ 가 된다.'],
      steps: ['$\\dfrac{3 x^{2} - 2}{x} = 3 x - \\frac{2}{x}$', '$\\int = \\frac{3}{2} x^{2} - 2 \\ln\\left|x\\right|$']
    },
    {
      id: 'e162', topic: '기본 적분',
      integrand: '-e^x + 4/x', latex: '-e^{x} + \\frac{4}{x}',
      answer: '-e^x + 4*ln(x)', answerLatex: '-e^{x} + 4 \\ln\\left|x\\right|+C',
      domain: [0.35, 2.6],
      hints: ['두 항을 따로 적분한다.', '$e^{x}$ 는 적분해도 그대로다.'],
      steps: ['$\\int -e^{x}dx = -e^{x}$', '$\\int \\frac{4}{x}dx = 4 \\ln\\left|x\\right|$']
    },
    {
      id: 'e163', topic: '기본 적분',
      integrand: '(-x^2 + 4)/x', latex: '\\frac{-x^{2} + 4}{x}',
      answer: '(-1/2)*x^2 + 4*ln(x)', answerLatex: '\\frac{-1}{2} x^{2} + 4 \\ln\\left|x\\right|+C',
      domain: [0.35, 2.6],
      hints: ['분자를 분모로 각각 나눠 항을 분리한다.', '$-x + \\dfrac{4}{x}$ 가 된다.'],
      steps: ['$\\dfrac{-x^{2} + 4}{x} = -x + \\frac{4}{x}$', '$\\int = \\frac{-1}{2} x^{2} + 4 \\ln\\left|x\\right|$']
    }
  ];

  var MEDIUM = [
    {
      id: 'm001', topic: '치환적분',
      integrand: 'x*e^(x^2)', latex: 'x e^{x^{2}}',
      answer: '(1/2)*e^(x^2)', answerLatex: '\\frac{1}{2} e^{x^{2}}+C',
      domain: [0.15, 1.3],
      hints: ['$u=x^{2}$ 로 두면 $du=2x\\,dx$ 다.', '앞의 $x$ 가 $du$ 를 만들어 준다.'],
      steps: ['$u=x^{2},\\;du=2x\\,dx$', '$\\dfrac{1}{2}\\int e^{u}du = \\frac{1}{2} e^{x^{2}}$']
    },
    {
      id: 'm002', topic: '치환적분',
      integrand: 'x*e^(2x^2)', latex: 'x e^{2 x^{2}}',
      answer: '(1/4)*e^(2x^2)', answerLatex: '\\frac{1}{4} e^{2 x^{2}}+C',
      domain: [0.15, 1.3],
      hints: ['$u=2x^{2}$ 로 두면 $du=4x\\,dx$ 다.', '앞의 $x$ 가 $du$ 를 만들어 준다.'],
      steps: ['$u=2x^{2},\\;du=4x\\,dx$', '$\\dfrac{1}{4}\\int e^{u}du = \\frac{1}{4} e^{2 x^{2}}$']
    },
    {
      id: 'm003', topic: '치환적분',
      integrand: 'x*e^(3x^2)', latex: 'x e^{3 x^{2}}',
      answer: '(1/6)*e^(3x^2)', answerLatex: '\\frac{1}{6} e^{3 x^{2}}+C',
      domain: [0.15, 1.3],
      hints: ['$u=3x^{2}$ 로 두면 $du=6x\\,dx$ 다.', '앞의 $x$ 가 $du$ 를 만들어 준다.'],
      steps: ['$u=3x^{2},\\;du=6x\\,dx$', '$\\dfrac{1}{6}\\int e^{u}du = \\frac{1}{6} e^{3 x^{2}}$']
    },
    {
      id: 'm004', topic: '치환적분',
      integrand: 'x*e^(-x^2)', latex: 'x e^{-x^{2}}',
      answer: '(-1/2)*e^(-x^2)', answerLatex: '\\frac{-1}{2} e^{-x^{2}}+C',
      domain: [0.15, 1.3],
      hints: ['$u=-x^{2}$ 로 두면 $du=-2x\\,dx$ 다.', '앞의 $x$ 가 $du$ 를 만들어 준다.'],
      steps: ['$u=-x^{2},\\;du=-2x\\,dx$', '$\\dfrac{1}{-2}\\int e^{u}du = \\frac{-1}{2} e^{-x^{2}}$']
    },
    {
      id: 'm005', topic: '치환적분',
      integrand: 'x^2*e^(x^3)', latex: 'x^{2} e^{x^{3}}',
      answer: '(1/3)*e^(x^3)', answerLatex: '\\frac{1}{3} e^{x^{3}}+C',
      domain: [0.15, 1.15],
      hints: ['$u=x^{3}$ 로 두면 $du=3x^{2}dx$ 다.', '분자가 $du$ 와 상수배로 맞는다.'],
      steps: ['$u=x^{3},\\;du=3x^{2}dx$', '$\\dfrac{1}{3}\\int e^{u}du = \\frac{1}{3} e^{x^{3}}$']
    },
    {
      id: 'm006', topic: '치환적분',
      integrand: 'x^3*e^(x^4)', latex: 'x^{3} e^{x^{4}}',
      answer: '(1/4)*e^(x^4)', answerLatex: '\\frac{1}{4} e^{x^{4}}+C',
      domain: [0.15, 1.15],
      hints: ['$u=x^{4}$ 로 두면 $du=4x^{3}dx$ 다.', '분자가 $du$ 와 상수배로 맞는다.'],
      steps: ['$u=x^{4},\\;du=4x^{3}dx$', '$\\dfrac{1}{4}\\int e^{u}du = \\frac{1}{4} e^{x^{4}}$']
    },
    {
      id: 'm007', topic: '치환적분',
      integrand: 'x/(x^2+1)', latex: '\\frac{x}{x^{2} + 1}',
      answer: '(1/2)*ln(x^2+1)', answerLatex: '\\frac{1}{2} \\ln\\left(x^{2} + 1\\right)+C',
      domain: [0.1, 2.6],
      hints: ['분모의 도함수가 $2x$ 다.', '$\\int\\dfrac{f\'}{f}dx=\\ln|f|$ 를 쓴다.'],
      steps: ['$u=x^{2}+1,\\;du=2x\\,dx$', '$= \\frac{1}{2} \\ln\\left(x^{2} + 1\\right)$']
    },
    {
      id: 'm008', topic: '치환적분',
      integrand: 'x/(x^2+3)', latex: '\\frac{x}{x^{2} + 3}',
      answer: '(1/2)*ln(x^2+3)', answerLatex: '\\frac{1}{2} \\ln\\left(x^{2} + 3\\right)+C',
      domain: [0.1, 2.6],
      hints: ['분모의 도함수가 $2x$ 다.', '$\\int\\dfrac{f\'}{f}dx=\\ln|f|$ 를 쓴다.'],
      steps: ['$u=x^{2}+3,\\;du=2x\\,dx$', '$= \\frac{1}{2} \\ln\\left(x^{2} + 3\\right)$']
    },
    {
      id: 'm009', topic: '치환적분',
      integrand: 'x/(x^2+4)', latex: '\\frac{x}{x^{2} + 4}',
      answer: '(1/2)*ln(x^2+4)', answerLatex: '\\frac{1}{2} \\ln\\left(x^{2} + 4\\right)+C',
      domain: [0.1, 2.6],
      hints: ['분모의 도함수가 $2x$ 다.', '$\\int\\dfrac{f\'}{f}dx=\\ln|f|$ 를 쓴다.'],
      steps: ['$u=x^{2}+4,\\;du=2x\\,dx$', '$= \\frac{1}{2} \\ln\\left(x^{2} + 4\\right)$']
    },
    {
      id: 'm010', topic: '치환적분',
      integrand: 'x/(x^2+9)', latex: '\\frac{x}{x^{2} + 9}',
      answer: '(1/2)*ln(x^2+9)', answerLatex: '\\frac{1}{2} \\ln\\left(x^{2} + 9\\right)+C',
      domain: [0.1, 2.6],
      hints: ['분모의 도함수가 $2x$ 다.', '$\\int\\dfrac{f\'}{f}dx=\\ln|f|$ 를 쓴다.'],
      steps: ['$u=x^{2}+9,\\;du=2x\\,dx$', '$= \\frac{1}{2} \\ln\\left(x^{2} + 9\\right)$']
    },
    {
      id: 'm011', topic: '치환적분',
      integrand: '2*x/(x^2+1)', latex: '\\frac{2 x}{x^{2} + 1}',
      answer: 'ln(x^2+1)', answerLatex: '\\ln\\left(x^{2} + 1\\right)+C',
      domain: [0.1, 2.6],
      hints: ['분모의 도함수가 $2x$ 다.', '$\\int\\dfrac{f\'}{f}dx=\\ln|f|$ 를 쓴다.'],
      steps: ['$u=x^{2}+1,\\;du=2x\\,dx$', '$= \\ln\\left(x^{2} + 1\\right)$']
    },
    {
      id: 'm012', topic: '치환적분',
      integrand: '2*x/(x^2+3)', latex: '\\frac{2 x}{x^{2} + 3}',
      answer: 'ln(x^2+3)', answerLatex: '\\ln\\left(x^{2} + 3\\right)+C',
      domain: [0.1, 2.6],
      hints: ['분모의 도함수가 $2x$ 다.', '$\\int\\dfrac{f\'}{f}dx=\\ln|f|$ 를 쓴다.'],
      steps: ['$u=x^{2}+3,\\;du=2x\\,dx$', '$= \\ln\\left(x^{2} + 3\\right)$']
    },
    {
      id: 'm013', topic: '치환적분',
      integrand: '2*x/(x^2+4)', latex: '\\frac{2 x}{x^{2} + 4}',
      answer: 'ln(x^2+4)', answerLatex: '\\ln\\left(x^{2} + 4\\right)+C',
      domain: [0.1, 2.6],
      hints: ['분모의 도함수가 $2x$ 다.', '$\\int\\dfrac{f\'}{f}dx=\\ln|f|$ 를 쓴다.'],
      steps: ['$u=x^{2}+4,\\;du=2x\\,dx$', '$= \\ln\\left(x^{2} + 4\\right)$']
    },
    {
      id: 'm014', topic: '치환적분',
      integrand: '2*x/(x^2+9)', latex: '\\frac{2 x}{x^{2} + 9}',
      answer: 'ln(x^2+9)', answerLatex: '\\ln\\left(x^{2} + 9\\right)+C',
      domain: [0.1, 2.6],
      hints: ['분모의 도함수가 $2x$ 다.', '$\\int\\dfrac{f\'}{f}dx=\\ln|f|$ 를 쓴다.'],
      steps: ['$u=x^{2}+9,\\;du=2x\\,dx$', '$= \\ln\\left(x^{2} + 9\\right)$']
    },
    {
      id: 'm015', topic: '치환적분',
      integrand: '6*x/(x^2+1)', latex: '\\frac{6 x}{x^{2} + 1}',
      answer: '3*ln(x^2+1)', answerLatex: '3 \\ln\\left(x^{2} + 1\\right)+C',
      domain: [0.1, 2.6],
      hints: ['분모의 도함수가 $2x$ 다.', '$\\int\\dfrac{f\'}{f}dx=\\ln|f|$ 를 쓴다.'],
      steps: ['$u=x^{2}+1,\\;du=2x\\,dx$', '$= 3 \\ln\\left(x^{2} + 1\\right)$']
    },
    {
      id: 'm016', topic: '치환적분',
      integrand: '6*x/(x^2+3)', latex: '\\frac{6 x}{x^{2} + 3}',
      answer: '3*ln(x^2+3)', answerLatex: '3 \\ln\\left(x^{2} + 3\\right)+C',
      domain: [0.1, 2.6],
      hints: ['분모의 도함수가 $2x$ 다.', '$\\int\\dfrac{f\'}{f}dx=\\ln|f|$ 를 쓴다.'],
      steps: ['$u=x^{2}+3,\\;du=2x\\,dx$', '$= 3 \\ln\\left(x^{2} + 3\\right)$']
    },
    {
      id: 'm017', topic: '치환적분',
      integrand: '6*x/(x^2+4)', latex: '\\frac{6 x}{x^{2} + 4}',
      answer: '3*ln(x^2+4)', answerLatex: '3 \\ln\\left(x^{2} + 4\\right)+C',
      domain: [0.1, 2.6],
      hints: ['분모의 도함수가 $2x$ 다.', '$\\int\\dfrac{f\'}{f}dx=\\ln|f|$ 를 쓴다.'],
      steps: ['$u=x^{2}+4,\\;du=2x\\,dx$', '$= 3 \\ln\\left(x^{2} + 4\\right)$']
    },
    {
      id: 'm018', topic: '치환적분',
      integrand: '6*x/(x^2+9)', latex: '\\frac{6 x}{x^{2} + 9}',
      answer: '3*ln(x^2+9)', answerLatex: '3 \\ln\\left(x^{2} + 9\\right)+C',
      domain: [0.1, 2.6],
      hints: ['분모의 도함수가 $2x$ 다.', '$\\int\\dfrac{f\'}{f}dx=\\ln|f|$ 를 쓴다.'],
      steps: ['$u=x^{2}+9,\\;du=2x\\,dx$', '$= 3 \\ln\\left(x^{2} + 9\\right)$']
    },
    {
      id: 'm019', topic: '치환적분',
      integrand: 'x^2/(x^3+1)', latex: '\\frac{x^{2}}{x^{3} + 1}',
      answer: '(1/3)*ln(x^3+1)', answerLatex: '\\frac{1}{3} \\ln\\left(x^{3} + 1\\right)+C',
      domain: [0.1, 2.2],
      hints: ['$u=x^{3}+1$ 로 둔다.', '$du=3x^{2}dx$ 이므로 $3$ 로 나눈다.'],
      steps: ['$u=x^{3}+1$', '$\\dfrac{1}{3}\\int\\dfrac{du}{u} = \\frac{1}{3} \\ln\\left(x^{3} + 1\\right)$']
    },
    {
      id: 'm020', topic: '치환적분',
      integrand: 'x^2/(x^3+2)', latex: '\\frac{x^{2}}{x^{3} + 2}',
      answer: '(1/3)*ln(x^3+2)', answerLatex: '\\frac{1}{3} \\ln\\left(x^{3} + 2\\right)+C',
      domain: [0.1, 2.2],
      hints: ['$u=x^{3}+2$ 로 둔다.', '$du=3x^{2}dx$ 이므로 $3$ 로 나눈다.'],
      steps: ['$u=x^{3}+2$', '$\\dfrac{1}{3}\\int\\dfrac{du}{u} = \\frac{1}{3} \\ln\\left(x^{3} + 2\\right)$']
    },
    {
      id: 'm021', topic: '치환적분',
      integrand: 'x^3/(x^4+1)', latex: '\\frac{x^{3}}{x^{4} + 1}',
      answer: '(1/4)*ln(x^4+1)', answerLatex: '\\frac{1}{4} \\ln\\left(x^{4} + 1\\right)+C',
      domain: [0.1, 2.2],
      hints: ['$u=x^{4}+1$ 로 둔다.', '$du=4x^{3}dx$ 이므로 $4$ 로 나눈다.'],
      steps: ['$u=x^{4}+1$', '$\\dfrac{1}{4}\\int\\dfrac{du}{u} = \\frac{1}{4} \\ln\\left(x^{4} + 1\\right)$']
    },
    {
      id: 'm022', topic: '치환적분',
      integrand: 'x^3/(x^4+2)', latex: '\\frac{x^{3}}{x^{4} + 2}',
      answer: '(1/4)*ln(x^4+2)', answerLatex: '\\frac{1}{4} \\ln\\left(x^{4} + 2\\right)+C',
      domain: [0.1, 2.2],
      hints: ['$u=x^{4}+2$ 로 둔다.', '$du=4x^{3}dx$ 이므로 $4$ 로 나눈다.'],
      steps: ['$u=x^{4}+2$', '$\\dfrac{1}{4}\\int\\dfrac{du}{u} = \\frac{1}{4} \\ln\\left(x^{4} + 2\\right)$']
    },
    {
      id: 'm023', topic: '부분적분',
      integrand: 'x*e^(x)', latex: 'x e^{x}',
      answer: '(x - 1)*e^(x)', answerLatex: '\\left(x - 1\\right) e^{x}+C',
      domain: [-1.5, 1.7],
      hints: ['$u=x,\\;dv=e^{x}dx$ 로 둔다.', '$\\int u\\,dv=uv-\\int v\\,du$'],
      steps: ['$u=x,\\;v=e^{x}$', '$xe^{x}-\\int e^{x}dx$', '$= \\left(x - 1\\right) e^{x}$']
    },
    {
      id: 'm024', topic: '부분적분',
      integrand: 'x*e^(2x)', latex: 'x e^{2 x}',
      answer: '(1/4)*(2x - 1)*e^(2x)', answerLatex: '\\frac{1}{4} \\left(2 x - 1\\right) e^{2 x}+C',
      domain: [-1.5, 1.7],
      hints: ['$u=x,\\;dv=e^{2x}dx$ 로 둔다.', '$\\int u\\,dv=uv-\\int v\\,du$'],
      steps: ['$u=x,\\;v=\\dfrac{e^{2x}}{2}$', '$\\dfrac{xe^{2x}}{2}-\\dfrac{1}{2}\\int e^{2x}dx$', '$= \\frac{1}{4} \\left(2 x - 1\\right) e^{2 x}$']
    },
    {
      id: 'm025', topic: '부분적분',
      integrand: 'x*e^(3x)', latex: 'x e^{3 x}',
      answer: '(1/9)*(3x - 1)*e^(3x)', answerLatex: '\\frac{1}{9} \\left(3 x - 1\\right) e^{3 x}+C',
      domain: [-1.5, 1.7],
      hints: ['$u=x,\\;dv=e^{3x}dx$ 로 둔다.', '$\\int u\\,dv=uv-\\int v\\,du$'],
      steps: ['$u=x,\\;v=\\dfrac{e^{3x}}{3}$', '$\\dfrac{xe^{3x}}{3}-\\dfrac{1}{3}\\int e^{3x}dx$', '$= \\frac{1}{9} \\left(3 x - 1\\right) e^{3 x}$']
    },
    {
      id: 'm026', topic: '부분적분',
      integrand: 'x*e^(-x)', latex: 'x e^{-x}',
      answer: '(-x - 1)*e^(-x)', answerLatex: '\\left(-x - 1\\right) e^{-x}+C',
      domain: [-1.5, 1.7],
      hints: ['$u=x,\\;dv=e^{-x}dx$ 로 둔다.', '$\\int u\\,dv=uv-\\int v\\,du$'],
      steps: ['$u=x,\\;v=-e^{-x}$', '$-xe^{-x}+1\\int e^{-x}dx$', '$= \\left(-x - 1\\right) e^{-x}$']
    },
    {
      id: 'm027', topic: '부분적분',
      integrand: 'x*sin(x)', latex: 'x \\sin x',
      answer: '-x*cos(x) + sin(x)', answerLatex: '-x \\cos x + \\sin x+C',
      domain: [0.25, 2.85],
      hints: ['$u=x$ 로 두어 차수를 낮춘다.', '$v=-\\cos x$'],
      steps: ['$u=x,\\;dv=\\sin x\\,dx$', '$= -x \\cos x + \\sin x$']
    },
    {
      id: 'm028', topic: '부분적분',
      integrand: 'x*cos(x)', latex: 'x \\cos x',
      answer: 'x*sin(x) + cos(x)', answerLatex: 'x \\sin x + \\cos x+C',
      domain: [0.25, 2.85],
      hints: ['$u=x,\\;dv=\\cos x\\,dx$', '남는 적분은 $\\int\\sin$ 이다.'],
      steps: ['$u=x,\\;v=\\sin x$', '$= x \\sin x + \\cos x$']
    },
    {
      id: 'm029', topic: '부분적분',
      integrand: 'x*sin(2x)', latex: 'x \\sin\\left(2 x\\right)',
      answer: '(-1/2)*x*cos(2x) + (1/4)*sin(2x)', answerLatex: '\\frac{-1}{2} x \\cos\\left(2 x\\right) + \\frac{1}{4} \\sin\\left(2 x\\right)+C',
      domain: [0.25, 2.85],
      hints: ['$u=x$ 로 두어 차수를 낮춘다.', '$v=\\frac{-1}{2} \\cos\\left(2 x\\right)$'],
      steps: ['$u=x,\\;dv=\\sin 2x\\,dx$', '$= \\frac{-1}{2} x \\cos\\left(2 x\\right) + \\frac{1}{4} \\sin\\left(2 x\\right)$']
    },
    {
      id: 'm030', topic: '부분적분',
      integrand: 'x*cos(2x)', latex: 'x \\cos\\left(2 x\\right)',
      answer: '(1/2)*x*sin(2x) + (1/4)*cos(2x)', answerLatex: '\\frac{1}{2} x \\sin\\left(2 x\\right) + \\frac{1}{4} \\cos\\left(2 x\\right)+C',
      domain: [0.25, 2.85],
      hints: ['$u=x,\\;dv=\\cos 2x\\,dx$', '남는 적분은 $\\int\\sin$ 이다.'],
      steps: ['$u=x,\\;v=\\frac{1}{2} \\sin\\left(2 x\\right)$', '$= \\frac{1}{2} x \\sin\\left(2 x\\right) + \\frac{1}{4} \\cos\\left(2 x\\right)$']
    },
    {
      id: 'm031', topic: '부분적분',
      integrand: 'x*sin(3x)', latex: 'x \\sin\\left(3 x\\right)',
      answer: '(-1/3)*x*cos(3x) + (1/9)*sin(3x)', answerLatex: '\\frac{-1}{3} x \\cos\\left(3 x\\right) + \\frac{1}{9} \\sin\\left(3 x\\right)+C',
      domain: [0.25, 2.85],
      hints: ['$u=x$ 로 두어 차수를 낮춘다.', '$v=\\frac{-1}{3} \\cos\\left(3 x\\right)$'],
      steps: ['$u=x,\\;dv=\\sin 3x\\,dx$', '$= \\frac{-1}{3} x \\cos\\left(3 x\\right) + \\frac{1}{9} \\sin\\left(3 x\\right)$']
    },
    {
      id: 'm032', topic: '부분적분',
      integrand: 'x*cos(3x)', latex: 'x \\cos\\left(3 x\\right)',
      answer: '(1/3)*x*sin(3x) + (1/9)*cos(3x)', answerLatex: '\\frac{1}{3} x \\sin\\left(3 x\\right) + \\frac{1}{9} \\cos\\left(3 x\\right)+C',
      domain: [0.25, 2.85],
      hints: ['$u=x,\\;dv=\\cos 3x\\,dx$', '남는 적분은 $\\int\\sin$ 이다.'],
      steps: ['$u=x,\\;v=\\frac{1}{3} \\sin\\left(3 x\\right)$', '$= \\frac{1}{3} x \\sin\\left(3 x\\right) + \\frac{1}{9} \\cos\\left(3 x\\right)$']
    },
    {
      id: 'm033', topic: '부분적분',
      integrand: 'x*ln(x)', latex: 'x \\ln x',
      answer: '(1/2)*x^2*ln(x) + (-1/4)*x^2', answerLatex: '\\frac{1}{2} x^{2} \\ln x + \\frac{-1}{4} x^{2}+C',
      domain: [0.35, 2.6],
      hints: ['$u=\\ln x,\\;dv=x^{1}dx$ 로 둔다.', '남는 적분은 $\\int\\dfrac{x^{1}}{2}dx$ 다.'],
      steps: ['$u=\\ln x,\\;v=\\dfrac{x^{2}}{2}$', '$= \\frac{1}{2} x^{2} \\ln x + \\frac{-1}{4} x^{2}$']
    },
    {
      id: 'm034', topic: '부분적분',
      integrand: 'x^2*ln(x)', latex: 'x^{2} \\ln x',
      answer: '(1/3)*x^3*ln(x) + (-1/9)*x^3', answerLatex: '\\frac{1}{3} x^{3} \\ln x + \\frac{-1}{9} x^{3}+C',
      domain: [0.35, 2.6],
      hints: ['$u=\\ln x,\\;dv=x^{2}dx$ 로 둔다.', '남는 적분은 $\\int\\dfrac{x^{2}}{3}dx$ 다.'],
      steps: ['$u=\\ln x,\\;v=\\dfrac{x^{3}}{3}$', '$= \\frac{1}{3} x^{3} \\ln x + \\frac{-1}{9} x^{3}$']
    },
    {
      id: 'm035', topic: '부분적분',
      integrand: 'x^3*ln(x)', latex: 'x^{3} \\ln x',
      answer: '(1/4)*x^4*ln(x) + (-1/16)*x^4', answerLatex: '\\frac{1}{4} x^{4} \\ln x + \\frac{-1}{16} x^{4}+C',
      domain: [0.35, 2.6],
      hints: ['$u=\\ln x,\\;dv=x^{3}dx$ 로 둔다.', '남는 적분은 $\\int\\dfrac{x^{3}}{4}dx$ 다.'],
      steps: ['$u=\\ln x,\\;v=\\dfrac{x^{4}}{4}$', '$= \\frac{1}{4} x^{4} \\ln x + \\frac{-1}{16} x^{4}$']
    },
    {
      id: 'm036', topic: '부분적분',
      integrand: 'x^4*ln(x)', latex: 'x^{4} \\ln x',
      answer: '(1/5)*x^5*ln(x) + (-1/25)*x^5', answerLatex: '\\frac{1}{5} x^{5} \\ln x + \\frac{-1}{25} x^{5}+C',
      domain: [0.35, 2.6],
      hints: ['$u=\\ln x,\\;dv=x^{4}dx$ 로 둔다.', '남는 적분은 $\\int\\dfrac{x^{4}}{5}dx$ 다.'],
      steps: ['$u=\\ln x,\\;v=\\dfrac{x^{5}}{5}$', '$= \\frac{1}{5} x^{5} \\ln x + \\frac{-1}{25} x^{5}$']
    },
    {
      id: 'm037', topic: '부분적분',
      integrand: 'ln(x)', latex: '\\ln x',
      answer: 'x*ln(x)-x', answerLatex: 'x \\ln x - x+C',
      domain: [0.35, 2.6],
      hints: ['$dv=dx$ 로 두는 고전적인 수법이다.', '$u=\\ln x,\\;du=\\dfrac{dx}{x}$'],
      steps: ['$u=\\ln x,\\;dv=dx$', '$x\\ln x-\\int x\\cdot\\dfrac{1}{x}dx = x\\ln x-x$']
    },
    {
      id: 'm038', topic: '부분적분',
      integrand: 'ln(2x)', latex: '\\ln\\left(2 x\\right)',
      answer: 'x*ln(2x)-x', answerLatex: 'x \\ln\\left(2 x\\right) - x+C',
      domain: [0.35, 2.6],
      hints: ['$dv=dx$ 로 두는 고전적인 수법이다.', '$u=\\ln 2x,\\;du=\\dfrac{dx}{x}$'],
      steps: ['$u=\\ln 2x,\\;dv=dx$', '$x\\ln 2x-\\int x\\cdot\\dfrac{1}{x}dx = x\\ln 2x-x$']
    },
    {
      id: 'm039', topic: '부분적분',
      integrand: 'ln(3x)', latex: '\\ln\\left(3 x\\right)',
      answer: 'x*ln(3x)-x', answerLatex: 'x \\ln\\left(3 x\\right) - x+C',
      domain: [0.35, 2.6],
      hints: ['$dv=dx$ 로 두는 고전적인 수법이다.', '$u=\\ln 3x,\\;du=\\dfrac{dx}{x}$'],
      steps: ['$u=\\ln 3x,\\;dv=dx$', '$x\\ln 3x-\\int x\\cdot\\dfrac{1}{x}dx = x\\ln 3x-x$']
    },
    {
      id: 'm040', topic: '부분적분',
      integrand: 'atan(x)', latex: '\\arctan x',
      answer: 'x*atan(x) + (-1/2)*ln(1+x^2)', answerLatex: 'x \\arctan x + \\frac{-1}{2} \\ln\\left(1 + x^{2}\\right)+C',
      domain: [0.1, 2.2],
      hints: ['$dv=dx$ 로 두고 부분적분한다.', '$du=\\dfrac{1}{1+1x^{2}}dx$'],
      steps: ['$u=\\arctan x,\\;dv=dx$', '$= x \\arctan x + \\frac{-1}{2} \\ln\\left(1 + 1 x^{2}\\right)$']
    },
    {
      id: 'm041', topic: '부분적분',
      integrand: 'asin(x)', latex: '\\arcsin x',
      answer: 'x*asin(x) + sqrt(1-x^2)', answerLatex: 'x \\arcsin x + \\sqrt{1 - x^{2}}+C',
      domain: [-0.6, 0.6],
      hints: ['$dv=dx$ 로 두고 부분적분한다.', '남는 적분은 $u$ 치환으로 근호가 나온다.'],
      steps: ['$u=\\arcsin x,\\;dv=dx$', '$= x \\arcsin x + \\sqrt{1 - 1 x^{2}}$']
    },
    {
      id: 'm042', topic: '부분적분',
      integrand: 'atan(2x)', latex: '\\arctan\\left(2 x\\right)',
      answer: 'x*atan(2x) + (-1/4)*ln(1+4x^2)', answerLatex: 'x \\arctan\\left(2 x\\right) + \\frac{-1}{4} \\ln\\left(1 + 4 x^{2}\\right)+C',
      domain: [0.1, 2.2],
      hints: ['$dv=dx$ 로 두고 부분적분한다.', '$du=\\dfrac{2}{1+4x^{2}}dx$'],
      steps: ['$u=\\arctan 2x,\\;dv=dx$', '$= x \\arctan\\left(2 x\\right) + \\frac{-1}{4} \\ln\\left(1 + 4 x^{2}\\right)$']
    },
    {
      id: 'm043', topic: '부분적분',
      integrand: 'asin(2x)', latex: '\\arcsin\\left(2 x\\right)',
      answer: 'x*asin(2x) + (1/2)*sqrt(1-4x^2)', answerLatex: 'x \\arcsin\\left(2 x\\right) + \\frac{1}{2} \\sqrt{1 - 4 x^{2}}+C',
      domain: [-0.3, 0.3],
      hints: ['$dv=dx$ 로 두고 부분적분한다.', '남는 적분은 $u$ 치환으로 근호가 나온다.'],
      steps: ['$u=\\arcsin 2x,\\;dv=dx$', '$= x \\arcsin\\left(2 x\\right) + \\frac{1}{2} \\sqrt{1 - 4 x^{2}}$']
    },
    {
      id: 'm044', topic: '반각공식',
      integrand: 'sin(x)^2', latex: '\\sin^{2} x',
      answer: 'x/2 + (-1/4)*sin(2x)', answerLatex: '\\frac{x}{2} + \\frac{-1}{4} \\sin\\left(2 x\\right)+C',
      domain: [0.25, 2.85],
      hints: ['$\\sin^{2}\\theta=\\dfrac{1-\\cos 2\\theta}{2}$ 로 차수를 낮춘다.', '안쪽 각이 $2x$ 가 된다.'],
      steps: ['$\\sin^{2}x = \\dfrac{1-\\cos 2x}{2}$', '$\\int = \\frac{x}{2} + \\frac{-1}{4} \\sin\\left(2 x\\right)$']
    },
    {
      id: 'm045', topic: '반각공식',
      integrand: 'cos(x)^2', latex: '\\cos^{2} x',
      answer: 'x/2 + (1/4)*sin(2x)', answerLatex: '\\frac{x}{2} + \\frac{1}{4} \\sin\\left(2 x\\right)+C',
      domain: [0.25, 2.85],
      hints: ['$\\cos^{2}\\theta=\\dfrac{1+\\cos 2\\theta}{2}$ 를 쓴다.', '부호가 $\\sin^{2}$ 일 때와 반대다.'],
      steps: ['$\\cos^{2}x = \\dfrac{1+\\cos 2x}{2}$', '$\\int = \\frac{x}{2} + \\frac{1}{4} \\sin\\left(2 x\\right)$']
    },
    {
      id: 'm046', topic: '반각공식',
      integrand: 'sin(2x)^2', latex: '\\sin^{2}\\left(2 x\\right)',
      answer: 'x/2 + (-1/8)*sin(4x)', answerLatex: '\\frac{x}{2} + \\frac{-1}{8} \\sin\\left(4 x\\right)+C',
      domain: [0.25, 2.85],
      hints: ['$\\sin^{2}\\theta=\\dfrac{1-\\cos 2\\theta}{2}$ 로 차수를 낮춘다.', '안쪽 각이 $4x$ 가 된다.'],
      steps: ['$\\sin^{2}2x = \\dfrac{1-\\cos 4x}{2}$', '$\\int = \\frac{x}{2} + \\frac{-1}{8} \\sin\\left(4 x\\right)$']
    },
    {
      id: 'm047', topic: '반각공식',
      integrand: 'cos(2x)^2', latex: '\\cos^{2}\\left(2 x\\right)',
      answer: 'x/2 + (1/8)*sin(4x)', answerLatex: '\\frac{x}{2} + \\frac{1}{8} \\sin\\left(4 x\\right)+C',
      domain: [0.25, 2.85],
      hints: ['$\\cos^{2}\\theta=\\dfrac{1+\\cos 2\\theta}{2}$ 를 쓴다.', '부호가 $\\sin^{2}$ 일 때와 반대다.'],
      steps: ['$\\cos^{2}2x = \\dfrac{1+\\cos 4x}{2}$', '$\\int = \\frac{x}{2} + \\frac{1}{8} \\sin\\left(4 x\\right)$']
    },
    {
      id: 'm048', topic: '반각공식',
      integrand: 'sin(3x)^2', latex: '\\sin^{2}\\left(3 x\\right)',
      answer: 'x/2 + (-1/12)*sin(6x)', answerLatex: '\\frac{x}{2} + \\frac{-1}{12} \\sin\\left(6 x\\right)+C',
      domain: [0.25, 2.85],
      hints: ['$\\sin^{2}\\theta=\\dfrac{1-\\cos 2\\theta}{2}$ 로 차수를 낮춘다.', '안쪽 각이 $6x$ 가 된다.'],
      steps: ['$\\sin^{2}3x = \\dfrac{1-\\cos 6x}{2}$', '$\\int = \\frac{x}{2} + \\frac{-1}{12} \\sin\\left(6 x\\right)$']
    },
    {
      id: 'm049', topic: '반각공식',
      integrand: 'cos(3x)^2', latex: '\\cos^{2}\\left(3 x\\right)',
      answer: 'x/2 + (1/12)*sin(6x)', answerLatex: '\\frac{x}{2} + \\frac{1}{12} \\sin\\left(6 x\\right)+C',
      domain: [0.25, 2.85],
      hints: ['$\\cos^{2}\\theta=\\dfrac{1+\\cos 2\\theta}{2}$ 를 쓴다.', '부호가 $\\sin^{2}$ 일 때와 반대다.'],
      steps: ['$\\cos^{2}3x = \\dfrac{1+\\cos 6x}{2}$', '$\\int = \\frac{x}{2} + \\frac{1}{12} \\sin\\left(6 x\\right)$']
    },
    {
      id: 'm050', topic: '삼각함수',
      integrand: 'tan(x)', latex: '\\tan x',
      answer: '-ln(cos(x))', answerLatex: '-\\ln\\left|\\cos x\\right|+C',
      domain: [0.25, 1.15],
      hints: ['$\\tan u=\\dfrac{\\sin u}{\\cos u}$ 로 쓴다.', '$u=\\cos x$ 로 치환한다.'],
      steps: ['$u=\\cos x,\\;du=-\\sin x\\,dx$', '$= -\\ln\\left|\\cos x\\right|$']
    },
    {
      id: 'm051', topic: '삼각함수',
      integrand: 'cot(x)', latex: '\\cot x',
      answer: 'ln(sin(x))', answerLatex: '\\ln\\left|\\sin x\\right|+C',
      domain: [0.5, 2.3],
      hints: ['$\\cot u=\\dfrac{\\cos u}{\\sin u}$ 다.', '$u=\\sin x$ 로 치환한다.'],
      steps: ['$u=\\sin x$', '$= \\ln\\left|\\sin x\\right|$']
    },
    {
      id: 'm052', topic: '고전 기법',
      integrand: 'sec(x)', latex: '\\sec x',
      answer: 'ln(sec(x)+tan(x))', answerLatex: '\\ln\\left|\\sec x + \\tan x\\right|+C',
      domain: [0.25, 1.15],
      hints: ['$\\dfrac{\\sec u+\\tan u}{\\sec u+\\tan u}$ 를 곱한다.', '분자가 분모의 도함수가 된다.'],
      steps: ['$\\sec u\\cdot\\dfrac{\\sec u+\\tan u}{\\sec u+\\tan u}$', '$= \\ln\\left|\\sec x + \\tan x\\right|$']
    },
    {
      id: 'm053', topic: '고전 기법',
      integrand: 'csc(x)', latex: '\\csc x',
      answer: 'ln(csc(x)-cot(x))', answerLatex: '\\ln\\left|\\csc x - \\cot x\\right|+C',
      domain: [0.5, 2.3],
      hints: ['$\\dfrac{\\csc u-\\cot u}{\\csc u-\\cot u}$ 를 곱한다.', '$\\sec$ 와 같은 요령이다.'],
      steps: ['$u=\\csc x-\\cot x$', '$= \\ln\\left|\\csc x - \\cot x\\right|$']
    },
    {
      id: 'm054', topic: '삼각함수',
      integrand: 'tan(2x)', latex: '\\tan\\left(2 x\\right)',
      answer: '(-1/2)*ln(cos(2x))', answerLatex: '\\frac{-1}{2} \\ln\\left|\\cos\\left(2 x\\right)\\right|+C',
      domain: [0.125, 0.575],
      hints: ['$\\tan u=\\dfrac{\\sin u}{\\cos u}$ 로 쓴다.', '$u=\\cos 2x$ 로 치환한다.'],
      steps: ['$u=\\cos 2x,\\;du=-2\\sin 2x\\,dx$', '$= \\frac{-1}{2} \\ln\\left|\\cos\\left(2 x\\right)\\right|$']
    },
    {
      id: 'm055', topic: '삼각함수',
      integrand: 'cot(2x)', latex: '\\cot\\left(2 x\\right)',
      answer: '(1/2)*ln(sin(2x))', answerLatex: '\\frac{1}{2} \\ln\\left|\\sin\\left(2 x\\right)\\right|+C',
      domain: [0.25, 1.15],
      hints: ['$\\cot u=\\dfrac{\\cos u}{\\sin u}$ 다.', '$u=\\sin 2x$ 로 치환한다.'],
      steps: ['$u=\\sin 2x$', '$= \\frac{1}{2} \\ln\\left|\\sin\\left(2 x\\right)\\right|$']
    },
    {
      id: 'm056', topic: '고전 기법',
      integrand: 'sec(2x)', latex: '\\sec\\left(2 x\\right)',
      answer: '(1/2)*ln(sec(2x)+tan(2x))', answerLatex: '\\frac{1}{2} \\ln\\left|\\sec\\left(2 x\\right) + \\tan\\left(2 x\\right)\\right|+C',
      domain: [0.125, 0.575],
      hints: ['$\\dfrac{\\sec u+\\tan u}{\\sec u+\\tan u}$ 를 곱한다.', '분자가 분모의 도함수가 된다.'],
      steps: ['$\\sec u\\cdot\\dfrac{\\sec u+\\tan u}{\\sec u+\\tan u}$', '$= \\frac{1}{2} \\ln\\left|\\sec\\left(2 x\\right) + \\tan\\left(2 x\\right)\\right|$']
    },
    {
      id: 'm057', topic: '고전 기법',
      integrand: 'csc(2x)', latex: '\\csc\\left(2 x\\right)',
      answer: '(1/2)*ln(csc(2x)-cot(2x))', answerLatex: '\\frac{1}{2} \\ln\\left|\\csc\\left(2 x\\right) - \\cot\\left(2 x\\right)\\right|+C',
      domain: [0.25, 1.15],
      hints: ['$\\dfrac{\\csc u-\\cot u}{\\csc u-\\cot u}$ 를 곱한다.', '$\\sec$ 와 같은 요령이다.'],
      steps: ['$u=\\csc 2x-\\cot 2x$', '$= \\frac{1}{2} \\ln\\left|\\csc\\left(2 x\\right) - \\cot\\left(2 x\\right)\\right|$']
    },
    {
      id: 'm058', topic: '삼각함수',
      integrand: 'tan(3x)', latex: '\\tan\\left(3 x\\right)',
      answer: '(-1/3)*ln(cos(3x))', answerLatex: '\\frac{-1}{3} \\ln\\left|\\cos\\left(3 x\\right)\\right|+C',
      domain: [0.08333333333333333, 0.3833333333333333],
      hints: ['$\\tan u=\\dfrac{\\sin u}{\\cos u}$ 로 쓴다.', '$u=\\cos 3x$ 로 치환한다.'],
      steps: ['$u=\\cos 3x,\\;du=-3\\sin 3x\\,dx$', '$= \\frac{-1}{3} \\ln\\left|\\cos\\left(3 x\\right)\\right|$']
    },
    {
      id: 'm059', topic: '삼각함수',
      integrand: 'cot(3x)', latex: '\\cot\\left(3 x\\right)',
      answer: '(1/3)*ln(sin(3x))', answerLatex: '\\frac{1}{3} \\ln\\left|\\sin\\left(3 x\\right)\\right|+C',
      domain: [0.16666666666666666, 0.7666666666666666],
      hints: ['$\\cot u=\\dfrac{\\cos u}{\\sin u}$ 다.', '$u=\\sin 3x$ 로 치환한다.'],
      steps: ['$u=\\sin 3x$', '$= \\frac{1}{3} \\ln\\left|\\sin\\left(3 x\\right)\\right|$']
    },
    {
      id: 'm060', topic: '고전 기법',
      integrand: 'sec(3x)', latex: '\\sec\\left(3 x\\right)',
      answer: '(1/3)*ln(sec(3x)+tan(3x))', answerLatex: '\\frac{1}{3} \\ln\\left|\\sec\\left(3 x\\right) + \\tan\\left(3 x\\right)\\right|+C',
      domain: [0.08333333333333333, 0.3833333333333333],
      hints: ['$\\dfrac{\\sec u+\\tan u}{\\sec u+\\tan u}$ 를 곱한다.', '분자가 분모의 도함수가 된다.'],
      steps: ['$\\sec u\\cdot\\dfrac{\\sec u+\\tan u}{\\sec u+\\tan u}$', '$= \\frac{1}{3} \\ln\\left|\\sec\\left(3 x\\right) + \\tan\\left(3 x\\right)\\right|$']
    },
    {
      id: 'm061', topic: '고전 기법',
      integrand: 'csc(3x)', latex: '\\csc\\left(3 x\\right)',
      answer: '(1/3)*ln(csc(3x)-cot(3x))', answerLatex: '\\frac{1}{3} \\ln\\left|\\csc\\left(3 x\\right) - \\cot\\left(3 x\\right)\\right|+C',
      domain: [0.16666666666666666, 0.7666666666666666],
      hints: ['$\\dfrac{\\csc u-\\cot u}{\\csc u-\\cot u}$ 를 곱한다.', '$\\sec$ 와 같은 요령이다.'],
      steps: ['$u=\\csc 3x-\\cot 3x$', '$= \\frac{1}{3} \\ln\\left|\\csc\\left(3 x\\right) - \\cot\\left(3 x\\right)\\right|$']
    },
    {
      id: 'm062', topic: '역삼각함수',
      integrand: '1/(x^2+1)', latex: '\\frac{1}{x^{2} + 1}',
      answer: 'atan(x)', answerLatex: '\\arctan x+C',
      domain: [-2, 3],
      hints: ['$\\int\\dfrac{dx}{x^{2}+a^{2}}=\\dfrac{1}{a}\\arctan\\dfrac{x}{a}$', '여기서 $a=1$ 다.'],
      steps: ['$a=1$', '$= \\arctan x$']
    },
    {
      id: 'm063', topic: '역삼각함수',
      integrand: '1/(x^2+4)', latex: '\\frac{1}{x^{2} + 4}',
      answer: '(1/2)*atan(x/2)', answerLatex: '\\frac{1}{2} \\arctan\\left(\\frac{x}{2}\\right)+C',
      domain: [-2, 3],
      hints: ['$\\int\\dfrac{dx}{x^{2}+a^{2}}=\\dfrac{1}{a}\\arctan\\dfrac{x}{a}$', '여기서 $a=2$ 다.'],
      steps: ['$a=2$', '$= \\frac{1}{2} \\arctan\\left(\\frac{x}{2}\\right)$']
    },
    {
      id: 'm064', topic: '역삼각함수',
      integrand: '1/(x^2+9)', latex: '\\frac{1}{x^{2} + 9}',
      answer: '(1/3)*atan(x/3)', answerLatex: '\\frac{1}{3} \\arctan\\left(\\frac{x}{3}\\right)+C',
      domain: [-2, 3],
      hints: ['$\\int\\dfrac{dx}{x^{2}+a^{2}}=\\dfrac{1}{a}\\arctan\\dfrac{x}{a}$', '여기서 $a=3$ 다.'],
      steps: ['$a=3$', '$= \\frac{1}{3} \\arctan\\left(\\frac{x}{3}\\right)$']
    },
    {
      id: 'm065', topic: '역삼각함수',
      integrand: '1/(x^2+16)', latex: '\\frac{1}{x^{2} + 16}',
      answer: '(1/4)*atan(x/4)', answerLatex: '\\frac{1}{4} \\arctan\\left(\\frac{x}{4}\\right)+C',
      domain: [-2, 3],
      hints: ['$\\int\\dfrac{dx}{x^{2}+a^{2}}=\\dfrac{1}{a}\\arctan\\dfrac{x}{a}$', '여기서 $a=4$ 다.'],
      steps: ['$a=4$', '$= \\frac{1}{4} \\arctan\\left(\\frac{x}{4}\\right)$']
    },
    {
      id: 'm066', topic: '역삼각함수',
      integrand: '1/(x^2+25)', latex: '\\frac{1}{x^{2} + 25}',
      answer: '(1/5)*atan(x/5)', answerLatex: '\\frac{1}{5} \\arctan\\left(\\frac{x}{5}\\right)+C',
      domain: [-2, 3],
      hints: ['$\\int\\dfrac{dx}{x^{2}+a^{2}}=\\dfrac{1}{a}\\arctan\\dfrac{x}{a}$', '여기서 $a=5$ 다.'],
      steps: ['$a=5$', '$= \\frac{1}{5} \\arctan\\left(\\frac{x}{5}\\right)$']
    },
    {
      id: 'm067', topic: '역삼각함수',
      integrand: '1/sqrt(4-x^2)', latex: '\\frac{1}{\\sqrt{4 - x^{2}}}',
      answer: 'asin(x/2)', answerLatex: '\\arcsin\\left(\\frac{x}{2}\\right)+C',
      domain: [-1.4, 1.4],
      hints: ['$\\int\\dfrac{dx}{\\sqrt{a^{2}-x^{2}}}=\\arcsin\\dfrac{x}{a}$', '여기서 $a=2$ 다.'],
      steps: ['$a=2$', '$= \\arcsin\\dfrac{x}{2}$']
    },
    {
      id: 'm068', topic: '역삼각함수',
      integrand: '1/sqrt(9-x^2)', latex: '\\frac{1}{\\sqrt{9 - x^{2}}}',
      answer: 'asin(x/3)', answerLatex: '\\arcsin\\left(\\frac{x}{3}\\right)+C',
      domain: [-2.0999999999999996, 2.0999999999999996],
      hints: ['$\\int\\dfrac{dx}{\\sqrt{a^{2}-x^{2}}}=\\arcsin\\dfrac{x}{a}$', '여기서 $a=3$ 다.'],
      steps: ['$a=3$', '$= \\arcsin\\dfrac{x}{3}$']
    },
    {
      id: 'm069', topic: '역삼각함수',
      integrand: '1/sqrt(16-x^2)', latex: '\\frac{1}{\\sqrt{16 - x^{2}}}',
      answer: 'asin(x/4)', answerLatex: '\\arcsin\\left(\\frac{x}{4}\\right)+C',
      domain: [-2.8, 2.8],
      hints: ['$\\int\\dfrac{dx}{\\sqrt{a^{2}-x^{2}}}=\\arcsin\\dfrac{x}{a}$', '여기서 $a=4$ 다.'],
      steps: ['$a=4$', '$= \\arcsin\\dfrac{x}{4}$']
    },
    {
      id: 'm070', topic: '역삼각함수',
      integrand: '1/sqrt(25-x^2)', latex: '\\frac{1}{\\sqrt{25 - x^{2}}}',
      answer: 'asin(x/5)', answerLatex: '\\arcsin\\left(\\frac{x}{5}\\right)+C',
      domain: [-3.5, 3.5],
      hints: ['$\\int\\dfrac{dx}{\\sqrt{a^{2}-x^{2}}}=\\arcsin\\dfrac{x}{a}$', '여기서 $a=5$ 다.'],
      steps: ['$a=5$', '$= \\arcsin\\dfrac{x}{5}$']
    },
    {
      id: 'm071', topic: '삼각함수 홀수차',
      integrand: 'sin(x)^3', latex: '\\sin^{3} x',
      answer: '-cos(x) + (1/3)*cos(x)^3', answerLatex: '-\\cos x + \\frac{1}{3} \\cos^{3} x+C',
      domain: [0.25, 2.85],
      hints: ['$\\sin^{3}u=\\sin u(1-\\cos^{2}u)$ 로 쪼갠다.', '$u=\\cos x$ 로 치환한다.'],
      steps: ['$\\sin^{3}x = (1-\\cos^{2}x)\\sin x$', '$= -\\cos x + \\frac{1}{3} \\cos^{3} x$']
    },
    {
      id: 'm072', topic: '삼각함수 홀수차',
      integrand: 'cos(x)^3', latex: '\\cos^{3} x',
      answer: 'sin(x) + (-1/3)*sin(x)^3', answerLatex: '\\sin x + \\frac{-1}{3} \\sin^{3} x+C',
      domain: [0.25, 2.85],
      hints: ['$\\cos^{3}u=\\cos u(1-\\sin^{2}u)$ 로 쪼갠다.', '$u=\\sin x$ 로 치환한다.'],
      steps: ['$\\cos^{3}x = (1-\\sin^{2}x)\\cos x$', '$= \\sin x + \\frac{-1}{3} \\sin^{3} x$']
    },
    {
      id: 'm073', topic: '삼각함수 홀수차',
      integrand: 'sin(2x)^3', latex: '\\sin^{3}\\left(2 x\\right)',
      answer: '(-1/2)*cos(2x) + (1/6)*cos(2x)^3', answerLatex: '\\frac{-1}{2} \\cos\\left(2 x\\right) + \\frac{1}{6} \\cos^{3}\\left(2 x\\right)+C',
      domain: [0.25, 2.85],
      hints: ['$\\sin^{3}u=\\sin u(1-\\cos^{2}u)$ 로 쪼갠다.', '$u=\\cos 2x$ 로 치환한다.'],
      steps: ['$\\sin^{3}2x = (1-\\cos^{2}2x)\\sin 2x$', '$= \\frac{-1}{2} \\cos\\left(2 x\\right) + \\frac{1}{6} \\cos^{3}\\left(2 x\\right)$']
    },
    {
      id: 'm074', topic: '삼각함수 홀수차',
      integrand: 'cos(2x)^3', latex: '\\cos^{3}\\left(2 x\\right)',
      answer: '(1/2)*sin(2x) + (-1/6)*sin(2x)^3', answerLatex: '\\frac{1}{2} \\sin\\left(2 x\\right) + \\frac{-1}{6} \\sin^{3}\\left(2 x\\right)+C',
      domain: [0.25, 2.85],
      hints: ['$\\cos^{3}u=\\cos u(1-\\sin^{2}u)$ 로 쪼갠다.', '$u=\\sin 2x$ 로 치환한다.'],
      steps: ['$\\cos^{3}2x = (1-\\sin^{2}2x)\\cos 2x$', '$= \\frac{1}{2} \\sin\\left(2 x\\right) + \\frac{-1}{6} \\sin^{3}\\left(2 x\\right)$']
    },
    {
      id: 'm075', topic: '치환적분',
      integrand: 'x*sqrt(x+1)', latex: 'x \\sqrt{x + 1}',
      answer: '(2/5)*(x+1)^(5/2) + (-2/3)*(x+1)^(3/2)', answerLatex: '\\frac{2}{5} \\left(x + 1\\right)^{\\frac{5}{2}} + \\frac{-2}{3} \\left(x + 1\\right)^{\\frac{3}{2}}+C',
      domain: [0.1, 2.6],
      hints: ['$u=x+1$ 로 두면 $x=u-1$ 다.', '$(u-1)\\sqrt{u}$ 를 전개해 항별로 적분한다.'],
      steps: ['$u=x+1$', '$\\int (u^{3/2}-1u^{1/2})du$', '$= \\frac{2}{5} \\left(x + 1\\right)^{\\frac{5}{2}} + \\frac{-2}{3} \\left(x + 1\\right)^{\\frac{3}{2}}$']
    },
    {
      id: 'm076', topic: '치환적분',
      integrand: 'x*sqrt(x+3)', latex: 'x \\sqrt{x + 3}',
      answer: '(2/5)*(x+3)^(5/2) - 2*(x+3)^(3/2)', answerLatex: '\\frac{2}{5} \\left(x + 3\\right)^{\\frac{5}{2}} - 2 \\left(x + 3\\right)^{\\frac{3}{2}}+C',
      domain: [0.1, 2.6],
      hints: ['$u=x+3$ 로 두면 $x=u-3$ 다.', '$(u-3)\\sqrt{u}$ 를 전개해 항별로 적분한다.'],
      steps: ['$u=x+3$', '$\\int (u^{3/2}-3u^{1/2})du$', '$= \\frac{2}{5} \\left(x + 3\\right)^{\\frac{5}{2}} - 2 \\left(x + 3\\right)^{\\frac{3}{2}}$']
    },
    {
      id: 'm077', topic: '치환적분',
      integrand: 'x/sqrt(x^2+1)', latex: '\\frac{x}{\\sqrt{x^{2} + 1}}',
      answer: 'sqrt(x^2+1)', answerLatex: '\\sqrt{x^{2} + 1}+C',
      domain: [0.1, 2.8],
      hints: ['$u=x^{2}+1$ 로 둔다.', '$\\int u^{-1/2}du=2\\sqrt{u}$ 를 기억한다.'],
      steps: ['$u=x^{2}+1,\\;du=2x\\,dx$', '$\\dfrac{1}{2}\\int u^{-1/2}du=\\sqrt{x^{2}+1}$']
    },
    {
      id: 'm078', topic: '치환적분',
      integrand: 'x/sqrt(x^2+3)', latex: '\\frac{x}{\\sqrt{x^{2} + 3}}',
      answer: 'sqrt(x^2+3)', answerLatex: '\\sqrt{x^{2} + 3}+C',
      domain: [0.1, 2.8],
      hints: ['$u=x^{2}+3$ 로 둔다.', '$\\int u^{-1/2}du=2\\sqrt{u}$ 를 기억한다.'],
      steps: ['$u=x^{2}+3,\\;du=2x\\,dx$', '$\\dfrac{1}{2}\\int u^{-1/2}du=\\sqrt{x^{2}+3}$']
    },
    {
      id: 'm079', topic: '치환적분',
      integrand: 'x/sqrt(x^2+4)', latex: '\\frac{x}{\\sqrt{x^{2} + 4}}',
      answer: 'sqrt(x^2+4)', answerLatex: '\\sqrt{x^{2} + 4}+C',
      domain: [0.1, 2.8],
      hints: ['$u=x^{2}+4$ 로 둔다.', '$\\int u^{-1/2}du=2\\sqrt{u}$ 를 기억한다.'],
      steps: ['$u=x^{2}+4,\\;du=2x\\,dx$', '$\\dfrac{1}{2}\\int u^{-1/2}du=\\sqrt{x^{2}+4}$']
    },
    {
      id: 'm080', topic: '치환적분',
      integrand: 'sqrt(x+1)', latex: '\\sqrt{x + 1}',
      answer: '(2/3)*(x+1)^(3/2)', answerLatex: '\\frac{2}{3} \\left(x + 1\\right)^{\\frac{3}{2}}+C',
      domain: [0.1, 2.6],
      hints: ['$u=x+1$ 로 두면 $du=\\,dx$ 다.', '$\\int u^{1/2}du=\\dfrac{2}{3}u^{3/2}$'],
      steps: ['$u=x+1$', '$= \\frac{2}{3} \\left(x + 1\\right)^{\\frac{3}{2}}$']
    },
    {
      id: 'm081', topic: '치환적분',
      integrand: 'sqrt(x+2)', latex: '\\sqrt{x + 2}',
      answer: '(2/3)*(x+2)^(3/2)', answerLatex: '\\frac{2}{3} \\left(x + 2\\right)^{\\frac{3}{2}}+C',
      domain: [0.1, 2.6],
      hints: ['$u=x+2$ 로 두면 $du=\\,dx$ 다.', '$\\int u^{1/2}du=\\dfrac{2}{3}u^{3/2}$'],
      steps: ['$u=x+2$', '$= \\frac{2}{3} \\left(x + 2\\right)^{\\frac{3}{2}}$']
    },
    {
      id: 'm082', topic: '치환적분',
      integrand: 'sqrt(x+3)', latex: '\\sqrt{x + 3}',
      answer: '(2/3)*(x+3)^(3/2)', answerLatex: '\\frac{2}{3} \\left(x + 3\\right)^{\\frac{3}{2}}+C',
      domain: [0.1, 2.6],
      hints: ['$u=x+3$ 로 두면 $du=\\,dx$ 다.', '$\\int u^{1/2}du=\\dfrac{2}{3}u^{3/2}$'],
      steps: ['$u=x+3$', '$= \\frac{2}{3} \\left(x + 3\\right)^{\\frac{3}{2}}$']
    },
    {
      id: 'm083', topic: '치환적분',
      integrand: 'x*sqrt(2x+1)', latex: 'x \\sqrt{2 x + 1}',
      answer: '(1/10)*(2x+1)^(5/2) + (-1/6)*(2x+1)^(3/2)', answerLatex: '\\frac{1}{10} \\left(2 x + 1\\right)^{\\frac{5}{2}} + \\frac{-1}{6} \\left(2 x + 1\\right)^{\\frac{3}{2}}+C',
      domain: [0.1, 2.6],
      hints: ['$u=2x+1$ 로 두면 $x=\\dfrac{u-1}{2}$ 다.', '$(u-1)\\sqrt{u}$ 를 전개해 항별로 적분한다.'],
      steps: ['$u=2x+1$', '$\\int (u^{3/2}-1u^{1/2})\\dfrac{du}{4}$', '$= \\frac{1}{10} \\left(2 x + 1\\right)^{\\frac{5}{2}} + \\frac{-1}{6} \\left(2 x + 1\\right)^{\\frac{3}{2}}$']
    },
    {
      id: 'm084', topic: '치환적분',
      integrand: 'x*sqrt(2x+3)', latex: 'x \\sqrt{2 x + 3}',
      answer: '(1/10)*(2x+3)^(5/2) + (-1/2)*(2x+3)^(3/2)', answerLatex: '\\frac{1}{10} \\left(2 x + 3\\right)^{\\frac{5}{2}} + \\frac{-1}{2} \\left(2 x + 3\\right)^{\\frac{3}{2}}+C',
      domain: [0.1, 2.6],
      hints: ['$u=2x+3$ 로 두면 $x=\\dfrac{u-3}{2}$ 다.', '$(u-3)\\sqrt{u}$ 를 전개해 항별로 적분한다.'],
      steps: ['$u=2x+3$', '$\\int (u^{3/2}-3u^{1/2})\\dfrac{du}{4}$', '$= \\frac{1}{10} \\left(2 x + 3\\right)^{\\frac{5}{2}} + \\frac{-1}{2} \\left(2 x + 3\\right)^{\\frac{3}{2}}$']
    },
    {
      id: 'm085', topic: '치환적분',
      integrand: 'sqrt(2x+1)', latex: '\\sqrt{2 x + 1}',
      answer: '(1/3)*(2x+1)^(3/2)', answerLatex: '\\frac{1}{3} \\left(2 x + 1\\right)^{\\frac{3}{2}}+C',
      domain: [0.1, 2.6],
      hints: ['$u=2x+1$ 로 두면 $du=2\\,dx$ 다.', '$\\int u^{1/2}du=\\dfrac{2}{3}u^{3/2}$'],
      steps: ['$u=2x+1$', '$= \\frac{1}{3} \\left(2 x + 1\\right)^{\\frac{3}{2}}$']
    },
    {
      id: 'm086', topic: '치환적분',
      integrand: 'sqrt(2x+2)', latex: '\\sqrt{2 x + 2}',
      answer: '(1/3)*(2x+2)^(3/2)', answerLatex: '\\frac{1}{3} \\left(2 x + 2\\right)^{\\frac{3}{2}}+C',
      domain: [0.1, 2.6],
      hints: ['$u=2x+2$ 로 두면 $du=2\\,dx$ 다.', '$\\int u^{1/2}du=\\dfrac{2}{3}u^{3/2}$'],
      steps: ['$u=2x+2$', '$= \\frac{1}{3} \\left(2 x + 2\\right)^{\\frac{3}{2}}$']
    },
    {
      id: 'm087', topic: '치환적분',
      integrand: 'sqrt(2x+3)', latex: '\\sqrt{2 x + 3}',
      answer: '(1/3)*(2x+3)^(3/2)', answerLatex: '\\frac{1}{3} \\left(2 x + 3\\right)^{\\frac{3}{2}}+C',
      domain: [0.1, 2.6],
      hints: ['$u=2x+3$ 로 두면 $du=2\\,dx$ 다.', '$\\int u^{1/2}du=\\dfrac{2}{3}u^{3/2}$'],
      steps: ['$u=2x+3$', '$= \\frac{1}{3} \\left(2 x + 3\\right)^{\\frac{3}{2}}$']
    },
    {
      id: 'm088', topic: '치환적분',
      integrand: 'ln(x)/x', latex: '\\frac{\\ln x}{x}',
      answer: '(1/2)*ln(x)^2', answerLatex: '\\frac{1}{2} \\left(\\ln x\\right)^{2}+C',
      domain: [0.4, 4],
      hints: ['$u=\\ln x$ 로 두면 $du=\\dfrac{dx}{x}$ 다.', '남는 것은 $\\int u^{1}du$ 다.'],
      steps: ['$u=\\ln x$', '$\\int u^{1}du = \\frac{1}{2} \\left(\\ln x\\right)^{2}$']
    },
    {
      id: 'm089', topic: '치환적분',
      integrand: 'ln(x)^2/x', latex: '\\frac{\\left(\\ln x\\right)^{2}}{x}',
      answer: '(1/3)*ln(x)^3', answerLatex: '\\frac{1}{3} \\left(\\ln x\\right)^{3}+C',
      domain: [0.4, 4],
      hints: ['$u=\\ln x$ 로 두면 $du=\\dfrac{dx}{x}$ 다.', '남는 것은 $\\int u^{2}du$ 다.'],
      steps: ['$u=\\ln x$', '$\\int u^{2}du = \\frac{1}{3} \\left(\\ln x\\right)^{3}$']
    },
    {
      id: 'm090', topic: '치환적분',
      integrand: 'ln(x)^3/x', latex: '\\frac{\\left(\\ln x\\right)^{3}}{x}',
      answer: '(1/4)*ln(x)^4', answerLatex: '\\frac{1}{4} \\left(\\ln x\\right)^{4}+C',
      domain: [0.4, 4],
      hints: ['$u=\\ln x$ 로 두면 $du=\\dfrac{dx}{x}$ 다.', '남는 것은 $\\int u^{3}du$ 다.'],
      steps: ['$u=\\ln x$', '$\\int u^{3}du = \\frac{1}{4} \\left(\\ln x\\right)^{4}$']
    },
    {
      id: 'm091', topic: '이중 치환',
      integrand: '1/(x*ln(x))', latex: '\\frac{1}{x \\ln x}',
      answer: 'ln(ln(x))', answerLatex: '\\ln\\left|\\ln\\left|x\\right|\\right|+C',
      domain: [1.4, 4.2],
      hints: ['$u=\\ln x$ 로 두면 적분이 $\\int\\dfrac{du}{u}$ 가 된다.', '로그가 두 번 겹친다.'],
      steps: ['$u=\\ln x,\\;du=\\dfrac{dx}{x}$', '$\\int\\dfrac{du}{u}=\\ln|\\ln x|$']
    },
    {
      id: 'm092', topic: '부분분수',
      integrand: '(3x + 5)/((x+1)(x+2))', latex: '\\frac{3 x + 5}{\\left(x + 1\\right) \\left(x + 2\\right)}',
      answer: '2*ln(x+1) + ln(x+2)', answerLatex: '2 \\ln\\left|x + 1\\right| + \\ln\\left|x + 2\\right|+C',
      domain: [0.2, 3],
      hints: ['$\\dfrac{A}{x+1}+\\dfrac{B}{x+2}$ 로 분해한다.', '$x=-1,\\;x=-2$ 를 대입하면 $A,B$ 가 바로 나온다.'],
      steps: ['$3 x + 5 = A(x+2)+B(x+1)$', '$A=2,\\;B=1$', '$= 2 \\ln\\left|x + 1\\right| + \\ln\\left|x + 2\\right|$']
    },
    {
      id: 'm093', topic: '부분분수',
      integrand: '(2x + 4)/((x+1)(x+3))', latex: '\\frac{2 x + 4}{\\left(x + 1\\right) \\left(x + 3\\right)}',
      answer: 'ln(x+1) + ln(x+3)', answerLatex: '\\ln\\left|x + 1\\right| + \\ln\\left|x + 3\\right|+C',
      domain: [0.2, 3],
      hints: ['$\\dfrac{A}{x+1}+\\dfrac{B}{x+3}$ 로 분해한다.', '$x=-1,\\;x=-3$ 를 대입하면 $A,B$ 가 바로 나온다.'],
      steps: ['$2 x + 4 = A(x+3)+B(x+1)$', '$A=1,\\;B=1$', '$= \\ln\\left|x + 1\\right| + \\ln\\left|x + 3\\right|$']
    },
    {
      id: 'm094', topic: '부분분수',
      integrand: '(x + 1)/((x+2)(x+3))', latex: '\\frac{x + 1}{\\left(x + 2\\right) \\left(x + 3\\right)}',
      answer: '-ln(x+2) + 2*ln(x+3)', answerLatex: '-\\ln\\left|x + 2\\right| + 2 \\ln\\left|x + 3\\right|+C',
      domain: [0.2, 3],
      hints: ['$\\dfrac{A}{x+2}+\\dfrac{B}{x+3}$ 로 분해한다.', '$x=-2,\\;x=-3$ 를 대입하면 $A,B$ 가 바로 나온다.'],
      steps: ['$x + 1 = A(x+3)+B(x+2)$', '$A=-1,\\;B=2$', '$= -\\ln\\left|x + 2\\right| + 2 \\ln\\left|x + 3\\right|$']
    },
    {
      id: 'm095', topic: '부분분수',
      integrand: '(5x + 2)/((x+1)(x+4))', latex: '\\frac{5 x + 2}{\\left(x + 1\\right) \\left(x + 4\\right)}',
      answer: '-ln(x+1) + 6*ln(x+4)', answerLatex: '-\\ln\\left|x + 1\\right| + 6 \\ln\\left|x + 4\\right|+C',
      domain: [0.2, 3],
      hints: ['$\\dfrac{A}{x+1}+\\dfrac{B}{x+4}$ 로 분해한다.', '$x=-1,\\;x=-4$ 를 대입하면 $A,B$ 가 바로 나온다.'],
      steps: ['$5 x + 2 = A(x+4)+B(x+1)$', '$A=-1,\\;B=6$', '$= -\\ln\\left|x + 1\\right| + 6 \\ln\\left|x + 4\\right|$']
    },
    {
      id: 'm096', topic: '부분분수',
      integrand: '(3x - 1)/((x+2)(x+5))', latex: '\\frac{3 x - 1}{\\left(x + 2\\right) \\left(x + 5\\right)}',
      answer: '(-7/3)*ln(x+2) + (16/3)*ln(x+5)', answerLatex: '\\frac{-7}{3} \\ln\\left|x + 2\\right| + \\frac{16}{3} \\ln\\left|x + 5\\right|+C',
      domain: [0.2, 3],
      hints: ['$\\dfrac{A}{x+2}+\\dfrac{B}{x+5}$ 로 분해한다.', '$x=-2,\\;x=-5$ 를 대입하면 $A,B$ 가 바로 나온다.'],
      steps: ['$3 x - 1 = A(x+5)+B(x+2)$', '$A=\\frac{-7}{3},\\;B=\\frac{16}{3}$', '$= \\frac{-7}{3} \\ln\\left|x + 2\\right| + \\frac{16}{3} \\ln\\left|x + 5\\right|$']
    },
    {
      id: 'm097', topic: '부분분수',
      integrand: '(4x + 7)/((x+1)(x+2))', latex: '\\frac{4 x + 7}{\\left(x + 1\\right) \\left(x + 2\\right)}',
      answer: '3*ln(x+1) + ln(x+2)', answerLatex: '3 \\ln\\left|x + 1\\right| + \\ln\\left|x + 2\\right|+C',
      domain: [0.2, 3],
      hints: ['$\\dfrac{A}{x+1}+\\dfrac{B}{x+2}$ 로 분해한다.', '$x=-1,\\;x=-2$ 를 대입하면 $A,B$ 가 바로 나온다.'],
      steps: ['$4 x + 7 = A(x+2)+B(x+1)$', '$A=3,\\;B=1$', '$= 3 \\ln\\left|x + 1\\right| + \\ln\\left|x + 2\\right|$']
    },
    {
      id: 'm098', topic: '부분분수',
      integrand: '(2x + 5)/((x+3)(x+4))', latex: '\\frac{2 x + 5}{\\left(x + 3\\right) \\left(x + 4\\right)}',
      answer: '-ln(x+3) + 3*ln(x+4)', answerLatex: '-\\ln\\left|x + 3\\right| + 3 \\ln\\left|x + 4\\right|+C',
      domain: [0.2, 3],
      hints: ['$\\dfrac{A}{x+3}+\\dfrac{B}{x+4}$ 로 분해한다.', '$x=-3,\\;x=-4$ 를 대입하면 $A,B$ 가 바로 나온다.'],
      steps: ['$2 x + 5 = A(x+4)+B(x+3)$', '$A=-1,\\;B=3$', '$= -\\ln\\left|x + 3\\right| + 3 \\ln\\left|x + 4\\right|$']
    },
    {
      id: 'm099', topic: '부분분수',
      integrand: '(2x + 3)/((x+1)(x+5))', latex: '\\frac{2 x + 3}{\\left(x + 1\\right) \\left(x + 5\\right)}',
      answer: '(1/4)*ln(x+1) + (7/4)*ln(x+5)', answerLatex: '\\frac{1}{4} \\ln\\left|x + 1\\right| + \\frac{7}{4} \\ln\\left|x + 5\\right|+C',
      domain: [0.2, 3],
      hints: ['$\\dfrac{A}{x+1}+\\dfrac{B}{x+5}$ 로 분해한다.', '$x=-1,\\;x=-5$ 를 대입하면 $A,B$ 가 바로 나온다.'],
      steps: ['$2 x + 3 = A(x+5)+B(x+1)$', '$A=\\frac{1}{4},\\;B=\\frac{7}{4}$', '$= \\frac{1}{4} \\ln\\left|x + 1\\right| + \\frac{7}{4} \\ln\\left|x + 5\\right|$']
    },
    {
      id: 'm100', topic: '치환적분',
      integrand: '(2x + 3)/(x^2 + 3x + 5)', latex: '\\frac{2 x + 3}{x^{2} + 3 x + 5}',
      answer: 'ln(x^2+3x+5)', answerLatex: '\\ln\\left|x^{2} + 3 x + 5\\right|+C',
      domain: [0.2, 2.6],
      hints: ['분자가 분모의 도함수와 정확히 같다.', '$\\int\\dfrac{f\'}{f}dx=\\ln|f|$'],
      steps: ['$u=x^{2}+3x+5$', '$\\int\\dfrac{du}{u}=\\ln|u|$']
    },
    {
      id: 'm101', topic: '치환적분',
      integrand: '(2x + 1)/(x^2 + x + 4)', latex: '\\frac{2 x + 1}{x^{2} + x + 4}',
      answer: 'ln(x^2+x+4)', answerLatex: '\\ln\\left|x^{2} + x + 4\\right|+C',
      domain: [0.2, 2.6],
      hints: ['분자가 분모의 도함수와 정확히 같다.', '$\\int\\dfrac{f\'}{f}dx=\\ln|f|$'],
      steps: ['$u=x^{2}+1x+4$', '$\\int\\dfrac{du}{u}=\\ln|u|$']
    },
    {
      id: 'm102', topic: '치환적분',
      integrand: '(2x + 2)/(x^2 + 2x + 6)', latex: '\\frac{2 x + 2}{x^{2} + 2 x + 6}',
      answer: 'ln(x^2+2x+6)', answerLatex: '\\ln\\left|x^{2} + 2 x + 6\\right|+C',
      domain: [0.2, 2.6],
      hints: ['분자가 분모의 도함수와 정확히 같다.', '$\\int\\dfrac{f\'}{f}dx=\\ln|f|$'],
      steps: ['$u=x^{2}+2x+6$', '$\\int\\dfrac{du}{u}=\\ln|u|$']
    },
    {
      id: 'm103', topic: '치환적분',
      integrand: '(2x - 1)/(x^2 - x + 3)', latex: '\\frac{2 x - 1}{x^{2} - x + 3}',
      answer: 'ln(x^2-x+3)', answerLatex: '\\ln\\left|x^{2} - x + 3\\right|+C',
      domain: [0.2, 2.6],
      hints: ['분자가 분모의 도함수와 정확히 같다.', '$\\int\\dfrac{f\'}{f}dx=\\ln|f|$'],
      steps: ['$u=x^{2}-1x+3$', '$\\int\\dfrac{du}{u}=\\ln|u|$']
    },
    {
      id: 'm104', topic: '치환적분',
      integrand: '(2x + 5)/(x^2 + 5x + 9)', latex: '\\frac{2 x + 5}{x^{2} + 5 x + 9}',
      answer: 'ln(x^2+5x+9)', answerLatex: '\\ln\\left|x^{2} + 5 x + 9\\right|+C',
      domain: [0.2, 2.6],
      hints: ['분자가 분모의 도함수와 정확히 같다.', '$\\int\\dfrac{f\'}{f}dx=\\ln|f|$'],
      steps: ['$u=x^{2}+5x+9$', '$\\int\\dfrac{du}{u}=\\ln|u|$']
    },
    {
      id: 'm105', topic: '치환적분',
      integrand: 'cos(x)/(1+sin(x)^2)', latex: '\\frac{\\cos x}{1 + \\sin^{2} x}',
      answer: 'atan(sin(x))', answerLatex: '\\arctan\\left(\\sin x\\right)+C',
      domain: [0.1, 1.4],
      hints: ['$u=\\sin x$ 로 두면 $du=\\cos x\\,dx$ 다.', '남은 적분이 $\\arctan$ 꼴이다.'],
      steps: ['$u=\\sin x$', '$\\int\\dfrac{du}{1+u^{2}}=\\arctan(\\sin x)$']
    },
    {
      id: 'm106', topic: '치환적분',
      integrand: 'sin(x)/(1+cos(x)^2)', latex: '\\frac{\\sin x}{1 + \\cos^{2} x}',
      answer: '-atan(cos(x))', answerLatex: '-\\arctan\\left(\\cos x\\right)+C',
      domain: [0.2, 2.8],
      hints: ['$u=\\cos x$ 로 두면 $du=-\\sin x\\,dx$ 다.', '부호에 주의한다.'],
      steps: ['$u=\\cos x$', '$-\\int\\dfrac{du}{1+u^{2}}=-\\arctan(\\cos x)$']
    },
    {
      id: 'm107', topic: '치환적분',
      integrand: 'e^x/(1+e^(2x))', latex: '\\frac{e^{x}}{1 + e^{2 x}}',
      answer: 'atan(e^x)', answerLatex: '\\arctan\\left(e^{x}\\right)+C',
      domain: [-1.2, 1.5],
      hints: ['$e^{2x}=(e^{x})^{2}$ 임을 이용한다.', '$u=e^{x}$ 로 치환한다.'],
      steps: ['$u=e^{x},\\;du=e^{x}dx$', '$\\int\\dfrac{du}{1+u^{2}}=\\arctan(e^{x})$']
    },
    {
      id: 'm108', topic: '치환적분',
      integrand: 'e^x/(e^x+1)', latex: '\\frac{e^{x}}{e^{x} + 1}',
      answer: 'ln(e^x+1)', answerLatex: '\\ln\\left(e^{x} + 1\\right)+C',
      domain: [-1, 1.8],
      hints: ['분자가 분모의 도함수다.', '$u=e^{x}+1$ 로 둔다.'],
      steps: ['$u=e^{x}+1$', '$\\int\\dfrac{du}{u}=\\ln(e^{x}+1)$']
    },
    {
      id: 'm109', topic: '치환적분',
      integrand: 'e^x/(e^x+2)', latex: '\\frac{e^{x}}{e^{x} + 2}',
      answer: 'ln(e^x+2)', answerLatex: '\\ln\\left(e^{x} + 2\\right)+C',
      domain: [-1, 1.8],
      hints: ['분자가 분모의 도함수다.', '$u=e^{x}+2$ 로 둔다.'],
      steps: ['$u=e^{x}+2$', '$\\int\\dfrac{du}{u}=\\ln(e^{x}+2)$']
    },
    {
      id: 'm110', topic: '치환적분',
      integrand: 'e^x/(e^x+3)', latex: '\\frac{e^{x}}{e^{x} + 3}',
      answer: 'ln(e^x+3)', answerLatex: '\\ln\\left(e^{x} + 3\\right)+C',
      domain: [-1, 1.8],
      hints: ['분자가 분모의 도함수다.', '$u=e^{x}+3$ 로 둔다.'],
      steps: ['$u=e^{x}+3$', '$\\int\\dfrac{du}{u}=\\ln(e^{x}+3)$']
    },
    {
      id: 'm111', topic: '순환 부분적분',
      integrand: 'e^x*sin(x)', latex: 'e^{x} \\sin x',
      answer: 'e^x*(sin(x)-cos(x))/2', answerLatex: '\\frac{e^{x} \\left(\\sin x - \\cos x\\right)}{2}+C',
      domain: [0.1, 2.5],
      hints: ['부분적분을 두 번 하면 원래 적분 $I$ 가 다시 나온다.', '$I$ 에 대한 방정식을 세워 푼다.'],
      steps: ['$I=\\int e^{x}\\sin x\\,dx$', '$I = e^{x}\\sin x-e^{x}\\cos x-I$', '$2I=e^{x}(\\sin x-\\cos x)$']
    },
    {
      id: 'm112', topic: '순환 부분적분',
      integrand: 'e^x*cos(x)', latex: 'e^{x} \\cos x',
      answer: 'e^x*(sin(x)+cos(x))/2', answerLatex: '\\frac{e^{x} \\left(\\sin x + \\cos x\\right)}{2}+C',
      domain: [0.1, 2.5],
      hints: ['$\\sin$ 일 때와 같은 방법이다.', '두 번 부분적분 후 $I$ 를 정리한다.'],
      steps: ['$I=\\int e^{x}\\cos x\\,dx$', '$2I=e^{x}(\\sin x+\\cos x)$']
    },
    {
      id: 'm113', topic: '반복 부분적분',
      integrand: 'x^2*e^x', latex: 'x^{2} e^{x}',
      answer: '(x^2-2x+2)*e^x', answerLatex: '\\left(x^{2} - 2 x + 2\\right) e^{x}+C',
      domain: [-1.5, 1.7],
      hints: ['부분적분을 두 번 적용해 차수를 내린다.', '중간에 $\\int xe^{x}dx$ 가 나온다.'],
      steps: ['$x^{2}e^{x}-2\\int xe^{x}dx$', '$\\int xe^{x}dx=(x-1)e^{x}$', '$=(x^{2}-2x+2)e^{x}$']
    },
    {
      id: 'm114', topic: '쌍곡선함수',
      integrand: 'tanh(x)', latex: '\\tanh x',
      answer: 'ln(cosh(x))', answerLatex: '\\ln\\left(\\cosh x\\right)+C',
      domain: [0.25, 1.6],
      hints: ['$\\tanh u=\\dfrac{\\sinh u}{\\cosh u}$ 다.', '$\\cosh$ 는 항상 양수라 절댓값이 필요 없다.'],
      steps: ['$u=\\cosh x,\\;du=\\sinh x\\,dx$', '$= \\ln\\left(\\cosh x\\right)$']
    },
    {
      id: 'm115', topic: '쌍곡선함수',
      integrand: 'coth(x)', latex: '\\coth x',
      answer: 'ln(sinh(x))', answerLatex: '\\ln\\left|\\sinh x\\right|+C',
      domain: [0.35, 2],
      hints: ['$\\coth u=\\dfrac{\\cosh u}{\\sinh u}$ 다.', '$u=\\sinh x$ 로 치환한다.'],
      steps: ['$u=\\sinh x$', '$= \\ln\\left|\\sinh x\\right|$']
    },
    {
      id: 'm116', topic: '쌍곡선 항등식',
      integrand: 'sinh(x)^2', latex: '\\sinh^{2} x',
      answer: '(1/4)*sinh(2x) - x/2', answerLatex: '\\frac{1}{4} \\sinh\\left(2 x\\right) - \\frac{x}{2}+C',
      domain: [0.25, 1.6],
      hints: ['$\\sinh^{2}u=\\dfrac{\\cosh 2u-1}{2}$ 를 쓴다.', '삼각함수의 반각공식과 부호가 다르다.'],
      steps: ['$\\sinh^{2}x = \\dfrac{\\cosh 2x-1}{2}$', '$\\int = \\frac{1}{4} \\sinh\\left(2 x\\right) - \\frac{x}{2}$']
    },
    {
      id: 'm117', topic: '쌍곡선 항등식',
      integrand: 'cosh(x)^2', latex: '\\cosh^{2} x',
      answer: '(1/4)*sinh(2x) + x/2', answerLatex: '\\frac{1}{4} \\sinh\\left(2 x\\right) + \\frac{x}{2}+C',
      domain: [0.25, 1.6],
      hints: ['$\\cosh^{2}u=\\dfrac{\\cosh 2u+1}{2}$ 를 쓴다.', '$\\sinh^{2}$ 일 때와 부호만 다르다.'],
      steps: ['$\\cosh^{2}x = \\dfrac{\\cosh 2x+1}{2}$', '$\\int = \\frac{1}{4} \\sinh\\left(2 x\\right) + \\frac{x}{2}$']
    },
    {
      id: 'm118', topic: '쌍곡선 항등식',
      integrand: 'tanh(x)^2', latex: '\\tanh^{2} x',
      answer: 'x - tanh(x)', answerLatex: 'x - \\tanh x+C',
      domain: [0.25, 1.6],
      hints: ['$\\tanh^{2}u=1-\\operatorname{sech}^{2}u$ 다.', '삼각함수의 $\\tan^{2}$ 와 부호가 반대다.'],
      steps: ['$\\tanh^{2}x = 1-\\operatorname{sech}^{2}x$', '$\\int = x - \\tanh x$']
    },
    {
      id: 'm119', topic: '쌍곡선함수',
      integrand: 'sinh(x)cosh(x)', latex: '\\sinh x \\cosh x',
      answer: '(1/4)*cosh(2x)', answerLatex: '\\frac{1}{4} \\cosh\\left(2 x\\right)+C',
      domain: [0.25, 1.6],
      hints: ['$\\sinh 2u=2\\sinh u\\cosh u$ 를 쓰거나 $u=\\sinh$ 로 치환한다.', '둘 중 어느 쪽이든 상수 차이만 난다.'],
      steps: ['$\\sinh x\\cosh x = \\dfrac{\\sinh 2x}{2}$', '$= \\frac{1}{4} \\cosh\\left(2 x\\right)$']
    },
    {
      id: 'm120', topic: '쌍곡선함수',
      integrand: 'sech(x)^2*tanh(x)', latex: '\\operatorname{sech}^{2} x \\tanh x',
      answer: '(1/2)*tanh(x)^2', answerLatex: '\\frac{1}{2} \\tanh^{2} x+C',
      domain: [0.25, 1.6],
      hints: ['$u=\\tanh x$ 로 두면 $du=\\operatorname{sech}^{2}xdx$ 다.', '남는 것은 $\\int u\\,du$ 다.'],
      steps: ['$u=\\tanh x$', '$= \\frac{1}{2} \\tanh^{2} x$']
    },
    {
      id: 'm121', topic: '쌍곡선함수',
      integrand: 'tanh(2x)', latex: '\\tanh\\left(2 x\\right)',
      answer: '(1/2)*ln(cosh(2x))', answerLatex: '\\frac{1}{2} \\ln\\left(\\cosh\\left(2 x\\right)\\right)+C',
      domain: [0.25, 1.6],
      hints: ['$\\tanh u=\\dfrac{\\sinh u}{\\cosh u}$ 다.', '$\\cosh$ 는 항상 양수라 절댓값이 필요 없다.'],
      steps: ['$u=\\cosh 2x,\\;du=2\\sinh 2x\\,dx$', '$= \\frac{1}{2} \\ln\\left(\\cosh\\left(2 x\\right)\\right)$']
    },
    {
      id: 'm122', topic: '쌍곡선함수',
      integrand: 'coth(2x)', latex: '\\coth\\left(2 x\\right)',
      answer: '(1/2)*ln(sinh(2x))', answerLatex: '\\frac{1}{2} \\ln\\left|\\sinh\\left(2 x\\right)\\right|+C',
      domain: [0.35, 2],
      hints: ['$\\coth u=\\dfrac{\\cosh u}{\\sinh u}$ 다.', '$u=\\sinh 2x$ 로 치환한다.'],
      steps: ['$u=\\sinh 2x$', '$= \\frac{1}{2} \\ln\\left|\\sinh\\left(2 x\\right)\\right|$']
    },
    {
      id: 'm123', topic: '쌍곡선 항등식',
      integrand: 'sinh(2x)^2', latex: '\\sinh^{2}\\left(2 x\\right)',
      answer: '(1/8)*sinh(4x) - x/2', answerLatex: '\\frac{1}{8} \\sinh\\left(4 x\\right) - \\frac{x}{2}+C',
      domain: [0.25, 1.6],
      hints: ['$\\sinh^{2}u=\\dfrac{\\cosh 2u-1}{2}$ 를 쓴다.', '삼각함수의 반각공식과 부호가 다르다.'],
      steps: ['$\\sinh^{2}2x = \\dfrac{\\cosh 4x-1}{2}$', '$\\int = \\frac{1}{8} \\sinh\\left(4 x\\right) - \\frac{x}{2}$']
    },
    {
      id: 'm124', topic: '쌍곡선 항등식',
      integrand: 'cosh(2x)^2', latex: '\\cosh^{2}\\left(2 x\\right)',
      answer: '(1/8)*sinh(4x) + x/2', answerLatex: '\\frac{1}{8} \\sinh\\left(4 x\\right) + \\frac{x}{2}+C',
      domain: [0.25, 1.6],
      hints: ['$\\cosh^{2}u=\\dfrac{\\cosh 2u+1}{2}$ 를 쓴다.', '$\\sinh^{2}$ 일 때와 부호만 다르다.'],
      steps: ['$\\cosh^{2}2x = \\dfrac{\\cosh 4x+1}{2}$', '$\\int = \\frac{1}{8} \\sinh\\left(4 x\\right) + \\frac{x}{2}$']
    },
    {
      id: 'm125', topic: '쌍곡선 항등식',
      integrand: 'tanh(2x)^2', latex: '\\tanh^{2}\\left(2 x\\right)',
      answer: 'x + (-1/2)*tanh(2x)', answerLatex: 'x + \\frac{-1}{2} \\tanh\\left(2 x\\right)+C',
      domain: [0.25, 1.6],
      hints: ['$\\tanh^{2}u=1-\\operatorname{sech}^{2}u$ 다.', '삼각함수의 $\\tan^{2}$ 와 부호가 반대다.'],
      steps: ['$\\tanh^{2}2x = 1-\\operatorname{sech}^{2}2x$', '$\\int = x + \\frac{-1}{2} \\tanh\\left(2 x\\right)$']
    },
    {
      id: 'm126', topic: '쌍곡선함수',
      integrand: 'sinh(2x)cosh(2x)', latex: '\\sinh\\left(2 x\\right) \\cosh\\left(2 x\\right)',
      answer: '(1/8)*cosh(4x)', answerLatex: '\\frac{1}{8} \\cosh\\left(4 x\\right)+C',
      domain: [0.25, 1.6],
      hints: ['$\\sinh 2u=2\\sinh u\\cosh u$ 를 쓰거나 $u=\\sinh$ 로 치환한다.', '둘 중 어느 쪽이든 상수 차이만 난다.'],
      steps: ['$\\sinh 2x\\cosh 2x = \\dfrac{\\sinh 4x}{2}$', '$= \\frac{1}{8} \\cosh\\left(4 x\\right)$']
    },
    {
      id: 'm127', topic: '쌍곡선함수',
      integrand: 'sech(2x)^2*tanh(2x)', latex: '\\operatorname{sech}^{2}\\left(2 x\\right) \\tanh\\left(2 x\\right)',
      answer: '(1/4)*tanh(2x)^2', answerLatex: '\\frac{1}{4} \\tanh^{2}\\left(2 x\\right)+C',
      domain: [0.25, 1.6],
      hints: ['$u=\\tanh 2x$ 로 두면 $du=2\\operatorname{sech}^{2}2xdx$ 다.', '남는 것은 $\\int u\\,du$ 다.'],
      steps: ['$u=\\tanh 2x$', '$= \\frac{1}{4} \\tanh^{2}\\left(2 x\\right)$']
    },
    {
      id: 'm128', topic: '쌍곡선함수',
      integrand: 'tanh(3x)', latex: '\\tanh\\left(3 x\\right)',
      answer: '(1/3)*ln(cosh(3x))', answerLatex: '\\frac{1}{3} \\ln\\left(\\cosh\\left(3 x\\right)\\right)+C',
      domain: [0.25, 1.6],
      hints: ['$\\tanh u=\\dfrac{\\sinh u}{\\cosh u}$ 다.', '$\\cosh$ 는 항상 양수라 절댓값이 필요 없다.'],
      steps: ['$u=\\cosh 3x,\\;du=3\\sinh 3x\\,dx$', '$= \\frac{1}{3} \\ln\\left(\\cosh\\left(3 x\\right)\\right)$']
    },
    {
      id: 'm129', topic: '쌍곡선함수',
      integrand: 'coth(3x)', latex: '\\coth\\left(3 x\\right)',
      answer: '(1/3)*ln(sinh(3x))', answerLatex: '\\frac{1}{3} \\ln\\left|\\sinh\\left(3 x\\right)\\right|+C',
      domain: [0.35, 2],
      hints: ['$\\coth u=\\dfrac{\\cosh u}{\\sinh u}$ 다.', '$u=\\sinh 3x$ 로 치환한다.'],
      steps: ['$u=\\sinh 3x$', '$= \\frac{1}{3} \\ln\\left|\\sinh\\left(3 x\\right)\\right|$']
    },
    {
      id: 'm130', topic: '쌍곡선 항등식',
      integrand: 'sinh(3x)^2', latex: '\\sinh^{2}\\left(3 x\\right)',
      answer: '(1/12)*sinh(6x) - x/2', answerLatex: '\\frac{1}{12} \\sinh\\left(6 x\\right) - \\frac{x}{2}+C',
      domain: [0.25, 1.6],
      hints: ['$\\sinh^{2}u=\\dfrac{\\cosh 2u-1}{2}$ 를 쓴다.', '삼각함수의 반각공식과 부호가 다르다.'],
      steps: ['$\\sinh^{2}3x = \\dfrac{\\cosh 6x-1}{2}$', '$\\int = \\frac{1}{12} \\sinh\\left(6 x\\right) - \\frac{x}{2}$']
    },
    {
      id: 'm131', topic: '쌍곡선 항등식',
      integrand: 'cosh(3x)^2', latex: '\\cosh^{2}\\left(3 x\\right)',
      answer: '(1/12)*sinh(6x) + x/2', answerLatex: '\\frac{1}{12} \\sinh\\left(6 x\\right) + \\frac{x}{2}+C',
      domain: [0.25, 1.6],
      hints: ['$\\cosh^{2}u=\\dfrac{\\cosh 2u+1}{2}$ 를 쓴다.', '$\\sinh^{2}$ 일 때와 부호만 다르다.'],
      steps: ['$\\cosh^{2}3x = \\dfrac{\\cosh 6x+1}{2}$', '$\\int = \\frac{1}{12} \\sinh\\left(6 x\\right) + \\frac{x}{2}$']
    },
    {
      id: 'm132', topic: '쌍곡선 항등식',
      integrand: 'tanh(3x)^2', latex: '\\tanh^{2}\\left(3 x\\right)',
      answer: 'x + (-1/3)*tanh(3x)', answerLatex: 'x + \\frac{-1}{3} \\tanh\\left(3 x\\right)+C',
      domain: [0.25, 1.6],
      hints: ['$\\tanh^{2}u=1-\\operatorname{sech}^{2}u$ 다.', '삼각함수의 $\\tan^{2}$ 와 부호가 반대다.'],
      steps: ['$\\tanh^{2}3x = 1-\\operatorname{sech}^{2}3x$', '$\\int = x + \\frac{-1}{3} \\tanh\\left(3 x\\right)$']
    },
    {
      id: 'm133', topic: '쌍곡선함수',
      integrand: 'sinh(3x)cosh(3x)', latex: '\\sinh\\left(3 x\\right) \\cosh\\left(3 x\\right)',
      answer: '(1/12)*cosh(6x)', answerLatex: '\\frac{1}{12} \\cosh\\left(6 x\\right)+C',
      domain: [0.25, 1.6],
      hints: ['$\\sinh 2u=2\\sinh u\\cosh u$ 를 쓰거나 $u=\\sinh$ 로 치환한다.', '둘 중 어느 쪽이든 상수 차이만 난다.'],
      steps: ['$\\sinh 3x\\cosh 3x = \\dfrac{\\sinh 6x}{2}$', '$= \\frac{1}{12} \\cosh\\left(6 x\\right)$']
    },
    {
      id: 'm134', topic: '쌍곡선함수',
      integrand: 'sech(3x)^2*tanh(3x)', latex: '\\operatorname{sech}^{2}\\left(3 x\\right) \\tanh\\left(3 x\\right)',
      answer: '(1/6)*tanh(3x)^2', answerLatex: '\\frac{1}{6} \\tanh^{2}\\left(3 x\\right)+C',
      domain: [0.25, 1.6],
      hints: ['$u=\\tanh 3x$ 로 두면 $du=3\\operatorname{sech}^{2}3xdx$ 다.', '남는 것은 $\\int u\\,du$ 다.'],
      steps: ['$u=\\tanh 3x$', '$= \\frac{1}{6} \\tanh^{2}\\left(3 x\\right)$']
    },
    {
      id: 'm135', topic: '역쌍곡선함수',
      integrand: '1/sqrt(x^2+1)', latex: '\\frac{1}{\\sqrt{x^{2} + 1}}',
      answer: 'asinh(x)', answerLatex: '\\operatorname{arsinh} x+C',
      domain: [-1.5, 2.5],
      hints: ['$\\int\\dfrac{dx}{\\sqrt{x^{2}+a^{2}}}=\\operatorname{arsinh}\\dfrac{x}{a}$', '$x=\\sinh\\theta$ 로 치환해도 된다.'],
      steps: ['$x=\\sinh\\theta$', '$= \\operatorname{arsinh}x$']
    },
    {
      id: 'm136', topic: '역쌍곡선함수',
      integrand: '1/sqrt(x^2-1)', latex: '\\frac{1}{\\sqrt{x^{2} - 1}}',
      answer: 'acosh(x)', answerLatex: '\\operatorname{arcosh} x+C',
      domain: [1.25, 3.2],
      hints: ['$\\int\\dfrac{dx}{\\sqrt{x^{2}-a^{2}}}=\\operatorname{arcosh}\\dfrac{x}{a}$', '$x=\\cosh\\theta$ 로 치환한다.'],
      steps: ['$x=\\cosh\\theta$', '$= \\operatorname{arcosh}x$']
    },
    {
      id: 'm137', topic: '역쌍곡선함수',
      integrand: '1/(1-x^2)', latex: '\\frac{1}{1 - x^{2}}',
      answer: 'atanh(x)', answerLatex: '\\operatorname{artanh} x+C',
      domain: [-0.7, 0.7],
      hints: ['$|x|<1$ 에서 $\\int\\dfrac{dx}{a^{2}-x^{2}}=\\dfrac{1}{a}\\operatorname{artanh}\\dfrac{x}{a}$', '부분분수로 풀면 로그 형태로도 쓸 수 있다.'],
      steps: ['$\\dfrac{1}{1-x^{2}}$ 를 부분분수로 분해', '$= \\operatorname{artanh} x$']
    },
    {
      id: 'm138', topic: '역쌍곡선함수',
      integrand: '1/sqrt(x^2+4)', latex: '\\frac{1}{\\sqrt{x^{2} + 4}}',
      answer: 'asinh(x/2)', answerLatex: '\\operatorname{arsinh}\\left(\\frac{x}{2}\\right)+C',
      domain: [-1.5, 2.5],
      hints: ['$\\int\\dfrac{dx}{\\sqrt{x^{2}+a^{2}}}=\\operatorname{arsinh}\\dfrac{x}{a}$', '$x=2\\sinh\\theta$ 로 치환해도 된다.'],
      steps: ['$x=2\\sinh\\theta$', '$= \\operatorname{arsinh}\\dfrac{x}{2}$']
    },
    {
      id: 'm139', topic: '역쌍곡선함수',
      integrand: '1/sqrt(x^2-4)', latex: '\\frac{1}{\\sqrt{x^{2} - 4}}',
      answer: 'acosh(x/2)', answerLatex: '\\operatorname{arcosh}\\left(\\frac{x}{2}\\right)+C',
      domain: [2.5, 6.4],
      hints: ['$\\int\\dfrac{dx}{\\sqrt{x^{2}-a^{2}}}=\\operatorname{arcosh}\\dfrac{x}{a}$', '$x=2\\cosh\\theta$ 로 치환한다.'],
      steps: ['$x=2\\cosh\\theta$', '$= \\operatorname{arcosh}\\dfrac{x}{2}$']
    },
    {
      id: 'm140', topic: '역쌍곡선함수',
      integrand: '1/(4-x^2)', latex: '\\frac{1}{4 - x^{2}}',
      answer: '(1/2)*atanh(x/2)', answerLatex: '\\frac{1}{2} \\operatorname{artanh}\\left(\\frac{x}{2}\\right)+C',
      domain: [-1.4, 1.4],
      hints: ['$|x|<2$ 에서 $\\int\\dfrac{dx}{a^{2}-x^{2}}=\\dfrac{1}{a}\\operatorname{artanh}\\dfrac{x}{a}$', '부분분수로 풀면 로그 형태로도 쓸 수 있다.'],
      steps: ['$\\dfrac{1}{4-x^{2}}$ 를 부분분수로 분해', '$= \\frac{1}{2} \\operatorname{artanh}\\left(\\frac{x}{2}\\right)$']
    },
    {
      id: 'm141', topic: '역쌍곡선함수',
      integrand: '1/sqrt(x^2+9)', latex: '\\frac{1}{\\sqrt{x^{2} + 9}}',
      answer: 'asinh(x/3)', answerLatex: '\\operatorname{arsinh}\\left(\\frac{x}{3}\\right)+C',
      domain: [-1.5, 2.5],
      hints: ['$\\int\\dfrac{dx}{\\sqrt{x^{2}+a^{2}}}=\\operatorname{arsinh}\\dfrac{x}{a}$', '$x=3\\sinh\\theta$ 로 치환해도 된다.'],
      steps: ['$x=3\\sinh\\theta$', '$= \\operatorname{arsinh}\\dfrac{x}{3}$']
    },
    {
      id: 'm142', topic: '역쌍곡선함수',
      integrand: '1/sqrt(x^2-9)', latex: '\\frac{1}{\\sqrt{x^{2} - 9}}',
      answer: 'acosh(x/3)', answerLatex: '\\operatorname{arcosh}\\left(\\frac{x}{3}\\right)+C',
      domain: [3.75, 9.600000000000001],
      hints: ['$\\int\\dfrac{dx}{\\sqrt{x^{2}-a^{2}}}=\\operatorname{arcosh}\\dfrac{x}{a}$', '$x=3\\cosh\\theta$ 로 치환한다.'],
      steps: ['$x=3\\cosh\\theta$', '$= \\operatorname{arcosh}\\dfrac{x}{3}$']
    },
    {
      id: 'm143', topic: '역쌍곡선함수',
      integrand: '1/(9-x^2)', latex: '\\frac{1}{9 - x^{2}}',
      answer: '(1/3)*atanh(x/3)', answerLatex: '\\frac{1}{3} \\operatorname{artanh}\\left(\\frac{x}{3}\\right)+C',
      domain: [-2.0999999999999996, 2.0999999999999996],
      hints: ['$|x|<3$ 에서 $\\int\\dfrac{dx}{a^{2}-x^{2}}=\\dfrac{1}{a}\\operatorname{artanh}\\dfrac{x}{a}$', '부분분수로 풀면 로그 형태로도 쓸 수 있다.'],
      steps: ['$\\dfrac{1}{9-x^{2}}$ 를 부분분수로 분해', '$= \\frac{1}{3} \\operatorname{artanh}\\left(\\frac{x}{3}\\right)$']
    },
    {
      id: 'm144', topic: '부분적분',
      integrand: 'x*sinh(x)', latex: 'x \\sinh x',
      answer: 'x*cosh(x) - sinh(x)', answerLatex: 'x \\cosh x - \\sinh x+C',
      domain: [0.25, 1.6],
      hints: ['$u=x,\\;dv=\\sinh x\\,dx$ 로 둔다.', '삼각함수와 달리 부호가 바뀌지 않는다.'],
      steps: ['$u=x,\\;v=\\cosh x$', '$= x \\cosh x - \\sinh x$']
    },
    {
      id: 'm145', topic: '부분적분',
      integrand: 'x*cosh(x)', latex: 'x \\cosh x',
      answer: 'x*sinh(x) - cosh(x)', answerLatex: 'x \\sinh x - \\cosh x+C',
      domain: [0.25, 1.6],
      hints: ['$u=x,\\;dv=\\cosh x\\,dx$ 로 둔다.', '남는 적분은 $\\int\\sinh$ 다.'],
      steps: ['$u=x,\\;v=\\sinh x$', '$= x \\sinh x - \\cosh x$']
    },
    {
      id: 'm146', topic: '부분적분',
      integrand: 'x*sinh(2x)', latex: 'x \\sinh\\left(2 x\\right)',
      answer: '(1/2)*x*cosh(2x) + (-1/4)*sinh(2x)', answerLatex: '\\frac{1}{2} x \\cosh\\left(2 x\\right) + \\frac{-1}{4} \\sinh\\left(2 x\\right)+C',
      domain: [0.25, 1.6],
      hints: ['$u=x,\\;dv=\\sinh 2x\\,dx$ 로 둔다.', '삼각함수와 달리 부호가 바뀌지 않는다.'],
      steps: ['$u=x,\\;v=\\frac{1}{2} \\cosh\\left(2 x\\right)$', '$= \\frac{1}{2} x \\cosh\\left(2 x\\right) + \\frac{-1}{4} \\sinh\\left(2 x\\right)$']
    },
    {
      id: 'm147', topic: '부분적분',
      integrand: 'x*cosh(2x)', latex: 'x \\cosh\\left(2 x\\right)',
      answer: '(1/2)*x*sinh(2x) + (-1/4)*cosh(2x)', answerLatex: '\\frac{1}{2} x \\sinh\\left(2 x\\right) + \\frac{-1}{4} \\cosh\\left(2 x\\right)+C',
      domain: [0.25, 1.6],
      hints: ['$u=x,\\;dv=\\cosh 2x\\,dx$ 로 둔다.', '남는 적분은 $\\int\\sinh$ 다.'],
      steps: ['$u=x,\\;v=\\frac{1}{2} \\sinh\\left(2 x\\right)$', '$= \\frac{1}{2} x \\sinh\\left(2 x\\right) + \\frac{-1}{4} \\cosh\\left(2 x\\right)$']
    }
  ];

  var HARD = [
    {
      id: 'h001', topic: '삼각치환',
      integrand: 'sqrt(1-x^2)', latex: '\\sqrt{1 - x^{2}}',
      answer: '(1/2)*x*sqrt(1-x^2) + (1/2)*asin(x)', answerLatex: '\\frac{1}{2} x \\sqrt{1 - x^{2}} + \\frac{1}{2} \\arcsin x+C',
      domain: [-0.75, 0.75],
      hints: ['$x=\\sin\\theta$ 로 치환한다.', '$\\cos^{2}\\theta$ 는 반각공식으로 처리한다.'],
      steps: ['$x=\\sin\\theta,\\;dx=\\cos\\theta\\,d\\theta$', '$\\int\\cos^{2}\\theta\\,d\\theta = \\left(\\dfrac{\\theta}{2}+\\dfrac{\\sin 2\\theta}{4}\\right)$', '$= \\frac{1}{2} x \\sqrt{1 - x^{2}} + \\frac{1}{2} \\arcsin x$']
    },
    {
      id: 'h002', topic: '쌍곡선 치환',
      integrand: 'sqrt(x^2+1)', latex: '\\sqrt{x^{2} + 1}',
      answer: '(1/2)*x*sqrt(x^2+1) + (1/2)*asinh(x)', answerLatex: '\\frac{1}{2} x \\sqrt{x^{2} + 1} + \\frac{1}{2} \\operatorname{arsinh} x+C',
      domain: [-1.4, 2.4],
      hints: ['$x=\\sinh\\theta$ 로 치환하면 근호가 $\\cosh$ 로 풀린다.', '$\\cosh^{2}\\theta=\\dfrac{\\cosh 2\\theta+1}{2}$ 를 쓴다.'],
      steps: ['$x=\\sinh\\theta$', '$\\int\\cosh^{2}\\theta\\,d\\theta$', '$= \\frac{1}{2} x \\sqrt{x^{2} + 1} + \\frac{1}{2} \\operatorname{arsinh} x$']
    },
    {
      id: 'h003', topic: '쌍곡선 치환',
      integrand: 'sqrt(x^2-1)', latex: '\\sqrt{x^{2} - 1}',
      answer: '(1/2)*x*sqrt(x^2-1) + (-1/2)*acosh(x)', answerLatex: '\\frac{1}{2} x \\sqrt{x^{2} - 1} + \\frac{-1}{2} \\operatorname{arcosh} x+C',
      domain: [1.3, 3],
      hints: ['$x=\\cosh\\theta$ 로 치환한다.', '$\\sinh^{2}\\theta=\\dfrac{\\cosh 2\\theta-1}{2}$'],
      steps: ['$x=\\cosh\\theta$', '$\\int\\sinh^{2}\\theta\\,d\\theta$', '$= \\frac{1}{2} x \\sqrt{x^{2} - 1} + \\frac{-1}{2} \\operatorname{arcosh} x$']
    },
    {
      id: 'h004', topic: '삼각치환',
      integrand: 'x^2/sqrt(1-x^2)', latex: '\\frac{x^{2}}{\\sqrt{1 - x^{2}}}',
      answer: '(1/2)*asin(x) + (-1/2)*x*sqrt(1-x^2)', answerLatex: '\\frac{1}{2} \\arcsin x + \\frac{-1}{2} x \\sqrt{1 - x^{2}}+C',
      domain: [-0.75, 0.75],
      hints: ['$x=\\sin\\theta$ 로 두면 $\\int\\sin^{2}\\theta\\,d\\theta$ 가 된다.', '반각공식 후 다시 $x$ 로 되돌린다.'],
      steps: ['$x=\\sin\\theta$', '$\\int\\sin^{2}\\theta\\,d\\theta$', '$= \\frac{1}{2} \\arcsin x + \\frac{-1}{2} x \\sqrt{1 - x^{2}}$']
    },
    {
      id: 'h005', topic: '삼각치환',
      integrand: '1/(x^2*sqrt(x^2-1))', latex: '\\frac{1}{x^{2} \\sqrt{x^{2} - 1}}',
      answer: 'sqrt(x^2-1)/x', answerLatex: '\\frac{\\sqrt{x^{2} - 1}}{x}+C',
      domain: [1.3, 3.4],
      hints: ['$x=\\sec\\theta$ 로 치환한다.', '적분이 $\\int\\cos\\theta\\,d\\theta$ 로 줄어든다.'],
      steps: ['$x=\\sec\\theta$', '$\\int\\cos\\theta\\,d\\theta=\\sin\\theta$', '$= \\frac{\\sqrt{x^{2} - 1}}{x}$']
    },
    {
      id: 'h006', topic: '삼각치환',
      integrand: '1/(x^2*sqrt(1-x^2))', latex: '\\frac{1}{x^{2} \\sqrt{1 - x^{2}}}',
      answer: '-sqrt(1-x^2)/x', answerLatex: '\\frac{-\\sqrt{1 - x^{2}}}{x}+C',
      domain: [0.35, 0.8],
      hints: ['$x=\\sin\\theta$ 로 치환한다.', '$\\int\\csc^{2}\\theta\\,d\\theta=-\\cot\\theta$'],
      steps: ['$x=\\sin\\theta$', '$1\\int\\csc^{2}\\theta\\,d\\theta$', '$= \\frac{-\\sqrt{1 - x^{2}}}{x}$']
    },
    {
      id: 'h007', topic: '삼각치환',
      integrand: 'sqrt(4-x^2)', latex: '\\sqrt{4 - x^{2}}',
      answer: '(1/2)*x*sqrt(4-x^2) + 2*asin(x/2)', answerLatex: '\\frac{1}{2} x \\sqrt{4 - x^{2}} + 2 \\arcsin\\left(\\frac{x}{2}\\right)+C',
      domain: [-1.5, 1.5],
      hints: ['$x=2\\sin\\theta$ 로 치환한다.', '$\\cos^{2}\\theta$ 는 반각공식으로 처리한다.'],
      steps: ['$x=2\\sin\\theta,\\;dx=2\\cos\\theta\\,d\\theta$', '$4\\int\\cos^{2}\\theta\\,d\\theta = 4\\left(\\dfrac{\\theta}{2}+\\dfrac{\\sin 2\\theta}{4}\\right)$', '$= \\frac{1}{2} x \\sqrt{4 - x^{2}} + 2 \\arcsin\\left(\\frac{x}{2}\\right)$']
    },
    {
      id: 'h008', topic: '쌍곡선 치환',
      integrand: 'sqrt(x^2+4)', latex: '\\sqrt{x^{2} + 4}',
      answer: '(1/2)*x*sqrt(x^2+4) + 2*asinh(x/2)', answerLatex: '\\frac{1}{2} x \\sqrt{x^{2} + 4} + 2 \\operatorname{arsinh}\\left(\\frac{x}{2}\\right)+C',
      domain: [-1.4, 2.4],
      hints: ['$x=2\\sinh\\theta$ 로 치환하면 근호가 $\\cosh$ 로 풀린다.', '$\\cosh^{2}\\theta=\\dfrac{\\cosh 2\\theta+1}{2}$ 를 쓴다.'],
      steps: ['$x=2\\sinh\\theta$', '$4\\int\\cosh^{2}\\theta\\,d\\theta$', '$= \\frac{1}{2} x \\sqrt{x^{2} + 4} + 2 \\operatorname{arsinh}\\left(\\frac{x}{2}\\right)$']
    },
    {
      id: 'h009', topic: '쌍곡선 치환',
      integrand: 'sqrt(x^2-4)', latex: '\\sqrt{x^{2} - 4}',
      answer: '(1/2)*x*sqrt(x^2-4) - 2*acosh(x/2)', answerLatex: '\\frac{1}{2} x \\sqrt{x^{2} - 4} - 2 \\operatorname{arcosh}\\left(\\frac{x}{2}\\right)+C',
      domain: [2.6, 6],
      hints: ['$x=2\\cosh\\theta$ 로 치환한다.', '$\\sinh^{2}\\theta=\\dfrac{\\cosh 2\\theta-1}{2}$'],
      steps: ['$x=2\\cosh\\theta$', '$4\\int\\sinh^{2}\\theta\\,d\\theta$', '$= \\frac{1}{2} x \\sqrt{x^{2} - 4} - 2 \\operatorname{arcosh}\\left(\\frac{x}{2}\\right)$']
    },
    {
      id: 'h010', topic: '삼각치환',
      integrand: 'x^2/sqrt(4-x^2)', latex: '\\frac{x^{2}}{\\sqrt{4 - x^{2}}}',
      answer: '2*asin(x/2) + (-1/2)*x*sqrt(4-x^2)', answerLatex: '2 \\arcsin\\left(\\frac{x}{2}\\right) + \\frac{-1}{2} x \\sqrt{4 - x^{2}}+C',
      domain: [-1.5, 1.5],
      hints: ['$x=2\\sin\\theta$ 로 두면 $\\int\\sin^{2}\\theta\\,d\\theta$ 가 된다.', '반각공식 후 다시 $x$ 로 되돌린다.'],
      steps: ['$x=2\\sin\\theta$', '$4\\int\\sin^{2}\\theta\\,d\\theta$', '$= 2 \\arcsin\\left(\\frac{x}{2}\\right) + \\frac{-1}{2} x \\sqrt{4 - x^{2}}$']
    },
    {
      id: 'h011', topic: '삼각치환',
      integrand: '1/(x^2*sqrt(x^2-4))', latex: '\\frac{1}{x^{2} \\sqrt{x^{2} - 4}}',
      answer: '(1/4)*sqrt(x^2-4)/x', answerLatex: '\\frac{\\frac{1}{4} \\sqrt{x^{2} - 4}}{x}+C',
      domain: [2.6, 6.8],
      hints: ['$x=2\\sec\\theta$ 로 치환한다.', '적분이 $\\int\\cos\\theta\\,d\\theta$ 로 줄어든다.'],
      steps: ['$x=2\\sec\\theta$', '$\\dfrac{1}{4}\\int\\cos\\theta\\,d\\theta=\\dfrac{\\sin\\theta}{4}$', '$= \\frac{\\frac{1}{4} \\sqrt{x^{2} - 4}}{x}$']
    },
    {
      id: 'h012', topic: '삼각치환',
      integrand: '1/(x^2*sqrt(4-x^2))', latex: '\\frac{1}{x^{2} \\sqrt{4 - x^{2}}}',
      answer: '(-1/4)*sqrt(4-x^2)/x', answerLatex: '\\frac{\\frac{-1}{4} \\sqrt{4 - x^{2}}}{x}+C',
      domain: [0.7, 1.6],
      hints: ['$x=2\\sin\\theta$ 로 치환한다.', '$\\int\\csc^{2}\\theta\\,d\\theta=-\\cot\\theta$'],
      steps: ['$x=2\\sin\\theta$', '$\\dfrac{1}{4}\\int\\csc^{2}\\theta\\,d\\theta$', '$= \\frac{\\frac{-1}{4} \\sqrt{4 - x^{2}}}{x}$']
    },
    {
      id: 'h013', topic: '삼각치환',
      integrand: 'sqrt(9-x^2)', latex: '\\sqrt{9 - x^{2}}',
      answer: '(1/2)*x*sqrt(9-x^2) + (9/2)*asin(x/3)', answerLatex: '\\frac{1}{2} x \\sqrt{9 - x^{2}} + \\frac{9}{2} \\arcsin\\left(\\frac{x}{3}\\right)+C',
      domain: [-2.25, 2.25],
      hints: ['$x=3\\sin\\theta$ 로 치환한다.', '$\\cos^{2}\\theta$ 는 반각공식으로 처리한다.'],
      steps: ['$x=3\\sin\\theta,\\;dx=3\\cos\\theta\\,d\\theta$', '$9\\int\\cos^{2}\\theta\\,d\\theta = 9\\left(\\dfrac{\\theta}{2}+\\dfrac{\\sin 2\\theta}{4}\\right)$', '$= \\frac{1}{2} x \\sqrt{9 - x^{2}} + \\frac{9}{2} \\arcsin\\left(\\frac{x}{3}\\right)$']
    },
    {
      id: 'h014', topic: '쌍곡선 치환',
      integrand: 'sqrt(x^2+9)', latex: '\\sqrt{x^{2} + 9}',
      answer: '(1/2)*x*sqrt(x^2+9) + (9/2)*asinh(x/3)', answerLatex: '\\frac{1}{2} x \\sqrt{x^{2} + 9} + \\frac{9}{2} \\operatorname{arsinh}\\left(\\frac{x}{3}\\right)+C',
      domain: [-1.4, 2.4],
      hints: ['$x=3\\sinh\\theta$ 로 치환하면 근호가 $\\cosh$ 로 풀린다.', '$\\cosh^{2}\\theta=\\dfrac{\\cosh 2\\theta+1}{2}$ 를 쓴다.'],
      steps: ['$x=3\\sinh\\theta$', '$9\\int\\cosh^{2}\\theta\\,d\\theta$', '$= \\frac{1}{2} x \\sqrt{x^{2} + 9} + \\frac{9}{2} \\operatorname{arsinh}\\left(\\frac{x}{3}\\right)$']
    },
    {
      id: 'h015', topic: '쌍곡선 치환',
      integrand: 'sqrt(x^2-9)', latex: '\\sqrt{x^{2} - 9}',
      answer: '(1/2)*x*sqrt(x^2-9) + (-9/2)*acosh(x/3)', answerLatex: '\\frac{1}{2} x \\sqrt{x^{2} - 9} + \\frac{-9}{2} \\operatorname{arcosh}\\left(\\frac{x}{3}\\right)+C',
      domain: [3.9000000000000004, 9],
      hints: ['$x=3\\cosh\\theta$ 로 치환한다.', '$\\sinh^{2}\\theta=\\dfrac{\\cosh 2\\theta-1}{2}$'],
      steps: ['$x=3\\cosh\\theta$', '$9\\int\\sinh^{2}\\theta\\,d\\theta$', '$= \\frac{1}{2} x \\sqrt{x^{2} - 9} + \\frac{-9}{2} \\operatorname{arcosh}\\left(\\frac{x}{3}\\right)$']
    },
    {
      id: 'h016', topic: '삼각치환',
      integrand: 'x^2/sqrt(9-x^2)', latex: '\\frac{x^{2}}{\\sqrt{9 - x^{2}}}',
      answer: '(9/2)*asin(x/3) + (-1/2)*x*sqrt(9-x^2)', answerLatex: '\\frac{9}{2} \\arcsin\\left(\\frac{x}{3}\\right) + \\frac{-1}{2} x \\sqrt{9 - x^{2}}+C',
      domain: [-2.25, 2.25],
      hints: ['$x=3\\sin\\theta$ 로 두면 $\\int\\sin^{2}\\theta\\,d\\theta$ 가 된다.', '반각공식 후 다시 $x$ 로 되돌린다.'],
      steps: ['$x=3\\sin\\theta$', '$9\\int\\sin^{2}\\theta\\,d\\theta$', '$= \\frac{9}{2} \\arcsin\\left(\\frac{x}{3}\\right) + \\frac{-1}{2} x \\sqrt{9 - x^{2}}$']
    },
    {
      id: 'h017', topic: '삼각치환',
      integrand: '1/(x^2*sqrt(x^2-9))', latex: '\\frac{1}{x^{2} \\sqrt{x^{2} - 9}}',
      answer: '(1/9)*sqrt(x^2-9)/x', answerLatex: '\\frac{\\frac{1}{9} \\sqrt{x^{2} - 9}}{x}+C',
      domain: [3.9000000000000004, 10.2],
      hints: ['$x=3\\sec\\theta$ 로 치환한다.', '적분이 $\\int\\cos\\theta\\,d\\theta$ 로 줄어든다.'],
      steps: ['$x=3\\sec\\theta$', '$\\dfrac{1}{9}\\int\\cos\\theta\\,d\\theta=\\dfrac{\\sin\\theta}{9}$', '$= \\frac{\\frac{1}{9} \\sqrt{x^{2} - 9}}{x}$']
    },
    {
      id: 'h018', topic: '삼각치환',
      integrand: '1/(x^2*sqrt(9-x^2))', latex: '\\frac{1}{x^{2} \\sqrt{9 - x^{2}}}',
      answer: '(-1/9)*sqrt(9-x^2)/x', answerLatex: '\\frac{\\frac{-1}{9} \\sqrt{9 - x^{2}}}{x}+C',
      domain: [1.0499999999999998, 2.4000000000000004],
      hints: ['$x=3\\sin\\theta$ 로 치환한다.', '$\\int\\csc^{2}\\theta\\,d\\theta=-\\cot\\theta$'],
      steps: ['$x=3\\sin\\theta$', '$\\dfrac{1}{9}\\int\\csc^{2}\\theta\\,d\\theta$', '$= \\frac{\\frac{-1}{9} \\sqrt{9 - x^{2}}}{x}$']
    },
    {
      id: 'h019', topic: '완전제곱',
      integrand: '1/(x^2 + 2x + 5)', latex: '\\frac{1}{x^{2} + 2 x + 5}',
      answer: '(1/2)*atan((x + 1)/2)', answerLatex: '\\frac{1}{2} \\arctan\\left(\\frac{x + 1}{2}\\right)+C',
      domain: [-1, 2.6],
      hints: ['분모를 $\\left(x+1\\right)^{2}+4$ 로 완전제곱한다.', '$\\int\\dfrac{du}{u^{2}+a^{2}}=\\dfrac{1}{a}\\arctan\\dfrac{u}{a}$ 에서 $a=2$'],
      steps: ['$x^{2} + 2x + 5 = \\left(x+1\\right)^{2}+4$', '$= \\frac{1}{2} \\arctan\\left(\\frac{x + 1}{2}\\right)$']
    },
    {
      id: 'h020', topic: '완전제곱',
      integrand: '1/sqrt(x^2 + 2x + 5)', latex: '\\frac{1}{\\sqrt{x^{2} + 2 x + 5}}',
      answer: 'asinh((x + 1)/2)', answerLatex: '\\operatorname{arsinh}\\left(\\frac{x + 1}{2}\\right)+C',
      domain: [-1, 2.6],
      hints: ['분모 안을 완전제곱하면 $u^{2}+4$ 꼴이 된다.', '$\\int\\dfrac{du}{\\sqrt{u^{2}+a^{2}}}=\\operatorname{arsinh}\\dfrac{u}{a}$'],
      steps: ['$x^{2} + 2x + 5 = \\left(x+1\\right)^{2}+4$', '$= \\operatorname{arsinh}\\dfrac{x+1}{2}$']
    },
    {
      id: 'h021', topic: '완전제곱',
      integrand: '1/(x^2 + 4x + 13)', latex: '\\frac{1}{x^{2} + 4 x + 13}',
      answer: '(1/3)*atan((x + 2)/3)', answerLatex: '\\frac{1}{3} \\arctan\\left(\\frac{x + 2}{3}\\right)+C',
      domain: [-1, 2.6],
      hints: ['분모를 $\\left(x+2\\right)^{2}+9$ 로 완전제곱한다.', '$\\int\\dfrac{du}{u^{2}+a^{2}}=\\dfrac{1}{a}\\arctan\\dfrac{u}{a}$ 에서 $a=3$'],
      steps: ['$x^{2} + 4x + 13 = \\left(x+2\\right)^{2}+9$', '$= \\frac{1}{3} \\arctan\\left(\\frac{x + 2}{3}\\right)$']
    },
    {
      id: 'h022', topic: '완전제곱',
      integrand: '1/sqrt(x^2 + 4x + 13)', latex: '\\frac{1}{\\sqrt{x^{2} + 4 x + 13}}',
      answer: 'asinh((x + 2)/3)', answerLatex: '\\operatorname{arsinh}\\left(\\frac{x + 2}{3}\\right)+C',
      domain: [-1, 2.6],
      hints: ['분모 안을 완전제곱하면 $u^{2}+9$ 꼴이 된다.', '$\\int\\dfrac{du}{\\sqrt{u^{2}+a^{2}}}=\\operatorname{arsinh}\\dfrac{u}{a}$'],
      steps: ['$x^{2} + 4x + 13 = \\left(x+2\\right)^{2}+9$', '$= \\operatorname{arsinh}\\dfrac{x+2}{3}$']
    },
    {
      id: 'h023', topic: '완전제곱',
      integrand: '1/(x^2 + 2x + 2)', latex: '\\frac{1}{x^{2} + 2 x + 2}',
      answer: 'atan((x + 1))', answerLatex: '\\arctan\\left(x + 1\\right)+C',
      domain: [-1, 2.6],
      hints: ['분모를 $\\left(x+1\\right)^{2}+1$ 로 완전제곱한다.', '$\\int\\dfrac{du}{u^{2}+a^{2}}=\\dfrac{1}{a}\\arctan\\dfrac{u}{a}$ 에서 $a=1$'],
      steps: ['$x^{2} + 2x + 2 = \\left(x+1\\right)^{2}+1$', '$= \\arctan\\left(x + 1\\right)$']
    },
    {
      id: 'h024', topic: '완전제곱',
      integrand: '1/sqrt(x^2 + 2x + 2)', latex: '\\frac{1}{\\sqrt{x^{2} + 2 x + 2}}',
      answer: 'asinh((x + 1))', answerLatex: '\\operatorname{arsinh}\\left(x + 1\\right)+C',
      domain: [-1, 2.6],
      hints: ['분모 안을 완전제곱하면 $u^{2}+1$ 꼴이 된다.', '$\\int\\dfrac{du}{\\sqrt{u^{2}+a^{2}}}=\\operatorname{arsinh}\\dfrac{u}{a}$'],
      steps: ['$x^{2} + 2x + 2 = \\left(x+1\\right)^{2}+1$', '$= \\operatorname{arsinh}x+1$']
    },
    {
      id: 'h025', topic: '완전제곱',
      integrand: '1/(x^2 + 6x + 13)', latex: '\\frac{1}{x^{2} + 6 x + 13}',
      answer: '(1/2)*atan((x + 3)/2)', answerLatex: '\\frac{1}{2} \\arctan\\left(\\frac{x + 3}{2}\\right)+C',
      domain: [-1, 2.6],
      hints: ['분모를 $\\left(x+3\\right)^{2}+4$ 로 완전제곱한다.', '$\\int\\dfrac{du}{u^{2}+a^{2}}=\\dfrac{1}{a}\\arctan\\dfrac{u}{a}$ 에서 $a=2$'],
      steps: ['$x^{2} + 6x + 13 = \\left(x+3\\right)^{2}+4$', '$= \\frac{1}{2} \\arctan\\left(\\frac{x + 3}{2}\\right)$']
    },
    {
      id: 'h026', topic: '완전제곱',
      integrand: '1/sqrt(x^2 + 6x + 13)', latex: '\\frac{1}{\\sqrt{x^{2} + 6 x + 13}}',
      answer: 'asinh((x + 3)/2)', answerLatex: '\\operatorname{arsinh}\\left(\\frac{x + 3}{2}\\right)+C',
      domain: [-1, 2.6],
      hints: ['분모 안을 완전제곱하면 $u^{2}+4$ 꼴이 된다.', '$\\int\\dfrac{du}{\\sqrt{u^{2}+a^{2}}}=\\operatorname{arsinh}\\dfrac{u}{a}$'],
      steps: ['$x^{2} + 6x + 13 = \\left(x+3\\right)^{2}+4$', '$= \\operatorname{arsinh}\\dfrac{x+3}{2}$']
    },
    {
      id: 'h027', topic: '완전제곱',
      integrand: '1/(x^2 - 2x + 5)', latex: '\\frac{1}{x^{2} - 2 x + 5}',
      answer: '(1/2)*atan((x - 1)/2)', answerLatex: '\\frac{1}{2} \\arctan\\left(\\frac{x - 1}{2}\\right)+C',
      domain: [-1, 2.6],
      hints: ['분모를 $\\left(x-1\\right)^{2}+4$ 로 완전제곱한다.', '$\\int\\dfrac{du}{u^{2}+a^{2}}=\\dfrac{1}{a}\\arctan\\dfrac{u}{a}$ 에서 $a=2$'],
      steps: ['$x^{2} - 2x + 5 = \\left(x-1\\right)^{2}+4$', '$= \\frac{1}{2} \\arctan\\left(\\frac{x - 1}{2}\\right)$']
    },
    {
      id: 'h028', topic: '완전제곱',
      integrand: '1/sqrt(x^2 - 2x + 5)', latex: '\\frac{1}{\\sqrt{x^{2} - 2 x + 5}}',
      answer: 'asinh((x - 1)/2)', answerLatex: '\\operatorname{arsinh}\\left(\\frac{x - 1}{2}\\right)+C',
      domain: [-1, 2.6],
      hints: ['분모 안을 완전제곱하면 $u^{2}+4$ 꼴이 된다.', '$\\int\\dfrac{du}{\\sqrt{u^{2}+a^{2}}}=\\operatorname{arsinh}\\dfrac{u}{a}$'],
      steps: ['$x^{2} - 2x + 5 = \\left(x-1\\right)^{2}+4$', '$= \\operatorname{arsinh}\\dfrac{x-1}{2}$']
    },
    {
      id: 'h029', topic: '완전제곱',
      integrand: '1/(x^2 + 4x + 5)', latex: '\\frac{1}{x^{2} + 4 x + 5}',
      answer: 'atan((x + 2))', answerLatex: '\\arctan\\left(x + 2\\right)+C',
      domain: [-1, 2.6],
      hints: ['분모를 $\\left(x+2\\right)^{2}+1$ 로 완전제곱한다.', '$\\int\\dfrac{du}{u^{2}+a^{2}}=\\dfrac{1}{a}\\arctan\\dfrac{u}{a}$ 에서 $a=1$'],
      steps: ['$x^{2} + 4x + 5 = \\left(x+2\\right)^{2}+1$', '$= \\arctan\\left(x + 2\\right)$']
    },
    {
      id: 'h030', topic: '완전제곱',
      integrand: '1/sqrt(x^2 + 4x + 5)', latex: '\\frac{1}{\\sqrt{x^{2} + 4 x + 5}}',
      answer: 'asinh((x + 2))', answerLatex: '\\operatorname{arsinh}\\left(x + 2\\right)+C',
      domain: [-1, 2.6],
      hints: ['분모 안을 완전제곱하면 $u^{2}+1$ 꼴이 된다.', '$\\int\\dfrac{du}{\\sqrt{u^{2}+a^{2}}}=\\operatorname{arsinh}\\dfrac{u}{a}$'],
      steps: ['$x^{2} + 4x + 5 = \\left(x+2\\right)^{2}+1$', '$= \\operatorname{arsinh}x+2$']
    },
    {
      id: 'h031', topic: '완전제곱',
      integrand: '1/(x^2 - 4x + 13)', latex: '\\frac{1}{x^{2} - 4 x + 13}',
      answer: '(1/3)*atan((x - 2)/3)', answerLatex: '\\frac{1}{3} \\arctan\\left(\\frac{x - 2}{3}\\right)+C',
      domain: [-1, 2.6],
      hints: ['분모를 $\\left(x-2\\right)^{2}+9$ 로 완전제곱한다.', '$\\int\\dfrac{du}{u^{2}+a^{2}}=\\dfrac{1}{a}\\arctan\\dfrac{u}{a}$ 에서 $a=3$'],
      steps: ['$x^{2} - 4x + 13 = \\left(x-2\\right)^{2}+9$', '$= \\frac{1}{3} \\arctan\\left(\\frac{x - 2}{3}\\right)$']
    },
    {
      id: 'h032', topic: '완전제곱',
      integrand: '1/sqrt(x^2 - 4x + 13)', latex: '\\frac{1}{\\sqrt{x^{2} - 4 x + 13}}',
      answer: 'asinh((x - 2)/3)', answerLatex: '\\operatorname{arsinh}\\left(\\frac{x - 2}{3}\\right)+C',
      domain: [-1, 2.6],
      hints: ['분모 안을 완전제곱하면 $u^{2}+9$ 꼴이 된다.', '$\\int\\dfrac{du}{\\sqrt{u^{2}+a^{2}}}=\\operatorname{arsinh}\\dfrac{u}{a}$'],
      steps: ['$x^{2} - 4x + 13 = \\left(x-2\\right)^{2}+9$', '$= \\operatorname{arsinh}\\dfrac{x-2}{3}$']
    },
    {
      id: 'h033', topic: '완전제곱',
      integrand: '1/(x^2 + 2x + 10)', latex: '\\frac{1}{x^{2} + 2 x + 10}',
      answer: '(1/3)*atan((x + 1)/3)', answerLatex: '\\frac{1}{3} \\arctan\\left(\\frac{x + 1}{3}\\right)+C',
      domain: [-1, 2.6],
      hints: ['분모를 $\\left(x+1\\right)^{2}+9$ 로 완전제곱한다.', '$\\int\\dfrac{du}{u^{2}+a^{2}}=\\dfrac{1}{a}\\arctan\\dfrac{u}{a}$ 에서 $a=3$'],
      steps: ['$x^{2} + 2x + 10 = \\left(x+1\\right)^{2}+9$', '$= \\frac{1}{3} \\arctan\\left(\\frac{x + 1}{3}\\right)$']
    },
    {
      id: 'h034', topic: '완전제곱',
      integrand: '1/sqrt(x^2 + 2x + 10)', latex: '\\frac{1}{\\sqrt{x^{2} + 2 x + 10}}',
      answer: 'asinh((x + 1)/3)', answerLatex: '\\operatorname{arsinh}\\left(\\frac{x + 1}{3}\\right)+C',
      domain: [-1, 2.6],
      hints: ['분모 안을 완전제곱하면 $u^{2}+9$ 꼴이 된다.', '$\\int\\dfrac{du}{\\sqrt{u^{2}+a^{2}}}=\\operatorname{arsinh}\\dfrac{u}{a}$'],
      steps: ['$x^{2} + 2x + 10 = \\left(x+1\\right)^{2}+9$', '$= \\operatorname{arsinh}\\dfrac{x+1}{3}$']
    },
    {
      id: 'h035', topic: '완전제곱',
      integrand: '1/(x^2 - 6x + 13)', latex: '\\frac{1}{x^{2} - 6 x + 13}',
      answer: '(1/2)*atan((x - 3)/2)', answerLatex: '\\frac{1}{2} \\arctan\\left(\\frac{x - 3}{2}\\right)+C',
      domain: [-1, 2.6],
      hints: ['분모를 $\\left(x-3\\right)^{2}+4$ 로 완전제곱한다.', '$\\int\\dfrac{du}{u^{2}+a^{2}}=\\dfrac{1}{a}\\arctan\\dfrac{u}{a}$ 에서 $a=2$'],
      steps: ['$x^{2} - 6x + 13 = \\left(x-3\\right)^{2}+4$', '$= \\frac{1}{2} \\arctan\\left(\\frac{x - 3}{2}\\right)$']
    },
    {
      id: 'h036', topic: '완전제곱',
      integrand: '1/sqrt(x^2 - 6x + 13)', latex: '\\frac{1}{\\sqrt{x^{2} - 6 x + 13}}',
      answer: 'asinh((x - 3)/2)', answerLatex: '\\operatorname{arsinh}\\left(\\frac{x - 3}{2}\\right)+C',
      domain: [-1, 2.6],
      hints: ['분모 안을 완전제곱하면 $u^{2}+4$ 꼴이 된다.', '$\\int\\dfrac{du}{\\sqrt{u^{2}+a^{2}}}=\\operatorname{arsinh}\\dfrac{u}{a}$'],
      steps: ['$x^{2} - 6x + 13 = \\left(x-3\\right)^{2}+4$', '$= \\operatorname{arsinh}\\dfrac{x-3}{2}$']
    },
    {
      id: 'h037', topic: '완전제곱',
      integrand: '(x + 3)/(x^2 + 2x + 5)', latex: '\\frac{x + 3}{x^{2} + 2 x + 5}',
      answer: '(1/2)*ln(x^2 + 2x + 5) + atan((x + 1)/2)', answerLatex: '\\frac{1}{2} \\ln\\left(x^{2} + 2 x + 5\\right) + \\arctan\\left(\\frac{x + 1}{2}\\right)+C',
      domain: [-1, 2.6],
      hints: ['분자를 분모의 도함수 $2x + 2$ 의 상수배 + 나머지 상수로 쪼갠다.', '앞쪽은 로그, 뒤쪽은 $\\arctan$ 이 된다.'],
      steps: ['$x + 3 = \\frac{1}{2}\\left(2x + 2\\right) + 2$', '$= \\frac{1}{2} \\ln\\left(x^{2} + 2 x + 5\\right) + \\arctan\\left(\\frac{x + 1}{2}\\right)$']
    },
    {
      id: 'h038', topic: '완전제곱',
      integrand: '(2x + 1)/(x^2 + 4x + 13)', latex: '\\frac{2 x + 1}{x^{2} + 4 x + 13}',
      answer: 'ln(x^2 + 4x + 13) - atan((x + 2)/3)', answerLatex: '\\ln\\left(x^{2} + 4 x + 13\\right) - \\arctan\\left(\\frac{x + 2}{3}\\right)+C',
      domain: [-1, 2.6],
      hints: ['분자를 분모의 도함수 $2x + 4$ 의 상수배 + 나머지 상수로 쪼갠다.', '앞쪽은 로그, 뒤쪽은 $\\arctan$ 이 된다.'],
      steps: ['$2 x + 1 = 1\\left(2x + 4\\right) - 3$', '$= \\ln\\left(x^{2} + 4 x + 13\\right) - \\arctan\\left(\\frac{x + 2}{3}\\right)$']
    },
    {
      id: 'h039', topic: '완전제곱',
      integrand: '(3x + 2)/(x^2 + 2x + 2)', latex: '\\frac{3 x + 2}{x^{2} + 2 x + 2}',
      answer: '(3/2)*ln(x^2 + 2x + 2) - atan((x + 1))', answerLatex: '\\frac{3}{2} \\ln\\left(x^{2} + 2 x + 2\\right) - \\arctan\\left(x + 1\\right)+C',
      domain: [-1, 2.6],
      hints: ['분자를 분모의 도함수 $2x + 2$ 의 상수배 + 나머지 상수로 쪼갠다.', '앞쪽은 로그, 뒤쪽은 $\\arctan$ 이 된다.'],
      steps: ['$3 x + 2 = \\frac{3}{2}\\left(2x + 2\\right) - 1$', '$= \\frac{3}{2} \\ln\\left(x^{2} + 2 x + 2\\right) - \\arctan\\left(x + 1\\right)$']
    },
    {
      id: 'h040', topic: '완전제곱',
      integrand: '(x + 5)/(x^2 + 6x + 13)', latex: '\\frac{x + 5}{x^{2} + 6 x + 13}',
      answer: '(1/2)*ln(x^2 + 6x + 13) + atan((x + 3)/2)', answerLatex: '\\frac{1}{2} \\ln\\left(x^{2} + 6 x + 13\\right) + \\arctan\\left(\\frac{x + 3}{2}\\right)+C',
      domain: [-1, 2.6],
      hints: ['분자를 분모의 도함수 $2x + 6$ 의 상수배 + 나머지 상수로 쪼갠다.', '앞쪽은 로그, 뒤쪽은 $\\arctan$ 이 된다.'],
      steps: ['$x + 5 = \\frac{1}{2}\\left(2x + 6\\right) + 2$', '$= \\frac{1}{2} \\ln\\left(x^{2} + 6 x + 13\\right) + \\arctan\\left(\\frac{x + 3}{2}\\right)$']
    },
    {
      id: 'h041', topic: '완전제곱',
      integrand: '(2x - 1)/(x^2 - 2x + 5)', latex: '\\frac{2 x - 1}{x^{2} - 2 x + 5}',
      answer: 'ln(x^2 - 2x + 5) + (1/2)*atan((x - 1)/2)', answerLatex: '\\ln\\left(x^{2} - 2 x + 5\\right) + \\frac{1}{2} \\arctan\\left(\\frac{x - 1}{2}\\right)+C',
      domain: [-1, 2.6],
      hints: ['분자를 분모의 도함수 $2x - 2$ 의 상수배 + 나머지 상수로 쪼갠다.', '앞쪽은 로그, 뒤쪽은 $\\arctan$ 이 된다.'],
      steps: ['$2 x - 1 = 1\\left(2x - 2\\right) + 1$', '$= \\ln\\left(x^{2} - 2 x + 5\\right) + \\frac{1}{2} \\arctan\\left(\\frac{x - 1}{2}\\right)$']
    },
    {
      id: 'h042', topic: '완전제곱',
      integrand: '(4x + 3)/(x^2 + 4x + 5)', latex: '\\frac{4 x + 3}{x^{2} + 4 x + 5}',
      answer: '2*ln(x^2 + 4x + 5) - 5*atan((x + 2))', answerLatex: '2 \\ln\\left(x^{2} + 4 x + 5\\right) - 5 \\arctan\\left(x + 2\\right)+C',
      domain: [-1, 2.6],
      hints: ['분자를 분모의 도함수 $2x + 4$ 의 상수배 + 나머지 상수로 쪼갠다.', '앞쪽은 로그, 뒤쪽은 $\\arctan$ 이 된다.'],
      steps: ['$4 x + 3 = 2\\left(2x + 4\\right) - 5$', '$= 2 \\ln\\left(x^{2} + 4 x + 5\\right) - 5 \\arctan\\left(x + 2\\right)$']
    },
    {
      id: 'h043', topic: '삼각함수 고급',
      integrand: 'sec(x)^3', latex: '\\sec^{3} x',
      answer: '(1/2)*sec(x)tan(x) + (1/2)*ln(sec(x)+tan(x))', answerLatex: '\\frac{1}{2} \\sec x \\tan x + \\frac{1}{2} \\ln\\left|\\sec x + \\tan x\\right|+C',
      domain: [0.25, 1.15],
      hints: ['$\\sec^{3}u=\\sec u\\cdot\\sec^{2}u$ 로 나눠 부분적분한다.', '$\\int\\sec u\\,du$ 결과가 다시 필요하다.'],
      steps: ['$u=\\sec x,\\;dv=\\sec^{2}xdx$', '$I = \\sec\\tan-\\int\\sec\\tan^{2}$', '$2I=\\sec\\tan+\\ln|\\sec+\\tan|$']
    },
    {
      id: 'h044', topic: '삼각함수 고급',
      integrand: 'csc(x)^3', latex: '\\csc^{3} x',
      answer: '(-1/2)*csc(x)cot(x) + (1/2)*ln(csc(x)-cot(x))', answerLatex: '\\frac{-1}{2} \\csc x \\cot x + \\frac{1}{2} \\ln\\left|\\csc x - \\cot x\\right|+C',
      domain: [0.5, 2.3],
      hints: ['$\\sec^{3}$ 와 같은 방식으로 부분적분한다.', '$\\int\\csc u\\,du$ 가 다시 나온다.'],
      steps: ['$I=\\int\\csc^{3}$', '$2I=-\\csc\\cot+\\ln|\\csc-\\cot|$']
    },
    {
      id: 'h045', topic: '삼각함수 홀수차',
      integrand: 'tan(x)^3', latex: '\\tan^{3} x',
      answer: '(1/2)*tan(x)^2 + ln(cos(x))', answerLatex: '\\frac{1}{2} \\tan^{2} x + \\ln\\left|\\cos x\\right|+C',
      domain: [0.25, 1.15],
      hints: ['$\\tan^{3}u=\\tan u(\\sec^{2}u-1)$ 로 쪼갠다.', '첫 항은 $u=\\tan$ 치환이다.'],
      steps: ['$\\tan^{3}x = \\tan\\sec^{2}-\\tan$', '$= \\frac{1}{2} \\tan^{2} x + \\ln\\left|\\cos x\\right|$']
    },
    {
      id: 'h046', topic: '삼각함수 홀수차',
      integrand: 'cot(x)^3', latex: '\\cot^{3} x',
      answer: '(-1/2)*cot(x)^2 - ln(sin(x))', answerLatex: '\\frac{-1}{2} \\cot^{2} x - \\ln\\left|\\sin x\\right|+C',
      domain: [0.5, 2.3],
      hints: ['$\\cot^{3}u=\\cot u(\\csc^{2}u-1)$ 로 쪼갠다.', '부호에 특히 주의한다.'],
      steps: ['$\\cot^{3}x = \\cot\\csc^{2}-\\cot$', '$= \\frac{-1}{2} \\cot^{2} x - \\ln\\left|\\sin x\\right|$']
    },
    {
      id: 'h047', topic: '삼각함수 고급',
      integrand: 'sec(2x)^3', latex: '\\sec^{3}\\left(2 x\\right)',
      answer: '(1/4)*sec(2x)tan(2x) + (1/4)*ln(sec(2x)+tan(2x))', answerLatex: '\\frac{1}{4} \\sec\\left(2 x\\right) \\tan\\left(2 x\\right) + \\frac{1}{4} \\ln\\left|\\sec\\left(2 x\\right) + \\tan\\left(2 x\\right)\\right|+C',
      domain: [0.125, 0.575],
      hints: ['$\\sec^{3}u=\\sec u\\cdot\\sec^{2}u$ 로 나눠 부분적분한다.', '$\\int\\sec u\\,du$ 결과가 다시 필요하다.'],
      steps: ['$u=\\sec 2x,\\;dv=\\sec^{2}2xdx$', '$I = \\sec\\tan-\\int\\sec\\tan^{2}$', '$2I=\\sec\\tan+\\ln|\\sec+\\tan|$']
    },
    {
      id: 'h048', topic: '삼각함수 고급',
      integrand: 'csc(2x)^3', latex: '\\csc^{3}\\left(2 x\\right)',
      answer: '(-1/4)*csc(2x)cot(2x) + (1/4)*ln(csc(2x)-cot(2x))', answerLatex: '\\frac{-1}{4} \\csc\\left(2 x\\right) \\cot\\left(2 x\\right) + \\frac{1}{4} \\ln\\left|\\csc\\left(2 x\\right) - \\cot\\left(2 x\\right)\\right|+C',
      domain: [0.25, 1.15],
      hints: ['$\\sec^{3}$ 와 같은 방식으로 부분적분한다.', '$\\int\\csc u\\,du$ 가 다시 나온다.'],
      steps: ['$I=\\int\\csc^{3}$', '$2I=-\\csc\\cot+\\ln|\\csc-\\cot|$']
    },
    {
      id: 'h049', topic: '삼각함수 홀수차',
      integrand: 'tan(2x)^3', latex: '\\tan^{3}\\left(2 x\\right)',
      answer: '(1/4)*tan(2x)^2 + (1/2)*ln(cos(2x))', answerLatex: '\\frac{1}{4} \\tan^{2}\\left(2 x\\right) + \\frac{1}{2} \\ln\\left|\\cos\\left(2 x\\right)\\right|+C',
      domain: [0.125, 0.575],
      hints: ['$\\tan^{3}u=\\tan u(\\sec^{2}u-1)$ 로 쪼갠다.', '첫 항은 $u=\\tan$ 치환이다.'],
      steps: ['$\\tan^{3}2x = \\tan\\sec^{2}-\\tan$', '$= \\frac{1}{4} \\tan^{2}\\left(2 x\\right) + \\frac{1}{2} \\ln\\left|\\cos\\left(2 x\\right)\\right|$']
    },
    {
      id: 'h050', topic: '삼각함수 홀수차',
      integrand: 'cot(2x)^3', latex: '\\cot^{3}\\left(2 x\\right)',
      answer: '(-1/4)*cot(2x)^2 + (-1/2)*ln(sin(2x))', answerLatex: '\\frac{-1}{4} \\cot^{2}\\left(2 x\\right) + \\frac{-1}{2} \\ln\\left|\\sin\\left(2 x\\right)\\right|+C',
      domain: [0.25, 1.15],
      hints: ['$\\cot^{3}u=\\cot u(\\csc^{2}u-1)$ 로 쪼갠다.', '부호에 특히 주의한다.'],
      steps: ['$\\cot^{3}2x = \\cot\\csc^{2}-\\cot$', '$= \\frac{-1}{4} \\cot^{2}\\left(2 x\\right) + \\frac{-1}{2} \\ln\\left|\\sin\\left(2 x\\right)\\right|$']
    },
    {
      id: 'h051', topic: '삼각함수 고차',
      integrand: 'tan(x)^4', latex: '\\tan^{4} x',
      answer: 'tan(x)^3/3-tan(x)+x', answerLatex: '\\frac{\\tan^{3} x}{3} - \\tan x + x+C',
      domain: [0.25, 1.15],
      hints: ['$\\tan^{4}=\\tan^{2}(\\sec^{2}-1)$ 로 한 단계씩 내린다.', '마지막에 $\\int\\tan^{2}=\\tan x-x$ 를 쓴다.'],
      steps: ['$\\tan^{4}x=\\tan^{2}x\\sec^{2}x-\\tan^{2}x$', '$= \\dfrac{\\tan^{3}x}{3}-\\tan x+x$']
    },
    {
      id: 'h052', topic: '삼각함수 고차',
      integrand: 'sec(x)^4', latex: '\\sec^{4} x',
      answer: 'tan(x)+tan(x)^3/3', answerLatex: '\\tan x + \\frac{\\tan^{3} x}{3}+C',
      domain: [0.25, 1.15],
      hints: ['$\\sec^{4}=\\sec^{2}\\cdot\\sec^{2}=(1+\\tan^{2})\\sec^{2}$', '$u=\\tan x$ 치환이면 끝난다.'],
      steps: ['$\\sec^{4}x=(1+\\tan^{2}x)\\sec^{2}x$', '$u=\\tan x:\\;\\int(1+u^{2})du$']
    },
    {
      id: 'h053', topic: '삼각함수 고차',
      integrand: 'cot(x)^4', latex: '\\cot^{4} x',
      answer: '-cot(x)^3/3+cot(x)+x', answerLatex: '\\frac{-\\cot^{3} x}{3} + \\cot x + x+C',
      domain: [0.45, 1.4],
      hints: ['$\\cot^{4}=\\cot^{2}(\\csc^{2}-1)$ 로 내린다.', '$\\int\\cot^{2}=-\\cot x-x$ 를 쓴다.'],
      steps: ['$\\cot^{4}x=\\cot^{2}x\\csc^{2}x-\\cot^{2}x$', '$= -\\dfrac{\\cot^{3}x}{3}+\\cot x+x$']
    },
    {
      id: 'h054', topic: '삼각함수 고차',
      integrand: 'csc(x)^4', latex: '\\csc^{4} x',
      answer: '-cot(x)-cot(x)^3/3', answerLatex: '-\\cot x - \\frac{\\cot^{3} x}{3}+C',
      domain: [0.5, 1.4],
      hints: ['$\\csc^{4}=(1+\\cot^{2})\\csc^{2}$', '$u=\\cot x$ 로 치환한다.'],
      steps: ['$\\csc^{4}x=(1+\\cot^{2}x)\\csc^{2}x$', '$u=\\cot x:\\;-\\int(1+u^{2})du$']
    },
    {
      id: 'h055', topic: '부분분수',
      integrand: '1/(x^2*(x+1))', latex: '\\frac{1}{x^{2} \\left(x + 1\\right)}',
      answer: '-1/x - ln(x) + ln(x+1)', answerLatex: '\\frac{-1}{x} - \\ln\\left|x\\right| + \\ln\\left|x + 1\\right|+C',
      domain: [0.4, 3],
      hints: ['$\\dfrac{A}{x}+\\dfrac{B}{x^{2}}+\\dfrac{D}{x+1}$ 로 분해한다.', '$B$ 는 $x=0$, $D$ 는 $x=-1$ 대입으로 바로 나온다.'],
      steps: ['$1=Ax(x+1)+B(x+1)+Dx^{2}$', '$B=1,\\;D=1,\\;A=-1$', '$= \\frac{-1}{x} - \\ln\\left|x\\right| + \\ln\\left|x + 1\\right|$']
    },
    {
      id: 'h056', topic: '부분분수',
      integrand: '1/(x^3+x)', latex: '\\frac{1}{x^{3} + x}',
      answer: 'ln(x) + (-1/2)*ln(x^2+1)', answerLatex: '\\ln\\left|x\\right| + \\frac{-1}{2} \\ln\\left|x^{2} + 1\\right|+C',
      domain: [0.35, 3],
      hints: ['$x(x^{2}+1)$ 로 인수분해한다.', '$1\\left(\\dfrac{1}{x}-\\dfrac{x}{x^{2}+1}\\right)$ 가 된다.'],
      steps: ['$\\dfrac{1}{x(x^{2}+1)} = 1\\left(\\dfrac{1}{x}-\\dfrac{x}{x^{2}+1}\\right)$', '$= \\ln\\left|x\\right| + \\frac{-1}{2} \\ln\\left|x^{2} + 1\\right|$']
    },
    {
      id: 'h057', topic: '부분분수',
      integrand: '1/(x^2-1)', latex: '\\frac{1}{x^{2} - 1}',
      answer: '(1/2)*ln(x-1) + (-1/2)*ln(x+1)', answerLatex: '\\frac{1}{2} \\ln\\left|x - 1\\right| + \\frac{-1}{2} \\ln\\left|x + 1\\right|+C',
      domain: [1.3, 3.4],
      hints: ['$(x-1)(x+1)$ 로 인수분해한다.', '$\\dfrac{1}{2}\\left(\\dfrac{1}{x-1}-\\dfrac{1}{x+1}\\right)$'],
      steps: ['부분분수 분해', '$= \\frac{1}{2} \\ln\\left|x - 1\\right| + \\frac{-1}{2} \\ln\\left|x + 1\\right|$']
    },
    {
      id: 'h058', topic: '부분분수',
      integrand: '1/(x^2*(x+2))', latex: '\\frac{1}{x^{2} \\left(x + 2\\right)}',
      answer: '(-1)/(2*x) + (-1/4)*ln(x) + (1/4)*ln(x+2)', answerLatex: '\\frac{-1}{2 x} + \\frac{-1}{4} \\ln\\left|x\\right| + \\frac{1}{4} \\ln\\left|x + 2\\right|+C',
      domain: [0.4, 3],
      hints: ['$\\dfrac{A}{x}+\\dfrac{B}{x^{2}}+\\dfrac{D}{x+2}$ 로 분해한다.', '$B$ 는 $x=0$, $D$ 는 $x=-2$ 대입으로 바로 나온다.'],
      steps: ['$1=Ax(x+2)+B(x+2)+Dx^{2}$', '$B=\\frac{1}{2},\\;D=\\frac{1}{4},\\;A=\\frac{-1}{4}$', '$= \\frac{-1}{2 x} + \\frac{-1}{4} \\ln\\left|x\\right| + \\frac{1}{4} \\ln\\left|x + 2\\right|$']
    },
    {
      id: 'h059', topic: '부분분수',
      integrand: '1/(x^3+4x)', latex: '\\frac{1}{x^{3} + 4 x}',
      answer: '(1/4)*ln(x) + (-1/8)*ln(x^2+4)', answerLatex: '\\frac{1}{4} \\ln\\left|x\\right| + \\frac{-1}{8} \\ln\\left|x^{2} + 4\\right|+C',
      domain: [0.35, 3],
      hints: ['$x(x^{2}+4)$ 로 인수분해한다.', '$\\dfrac{1}{4}\\left(\\dfrac{1}{x}-\\dfrac{x}{x^{2}+4}\\right)$ 가 된다.'],
      steps: ['$\\dfrac{1}{x(x^{2}+4)} = \\dfrac{1}{4}\\left(\\dfrac{1}{x}-\\dfrac{x}{x^{2}+4}\\right)$', '$= \\frac{1}{4} \\ln\\left|x\\right| + \\frac{-1}{8} \\ln\\left|x^{2} + 4\\right|$']
    },
    {
      id: 'h060', topic: '부분분수',
      integrand: '1/(x^2-4)', latex: '\\frac{1}{x^{2} - 4}',
      answer: '(1/4)*ln(x-2) + (-1/4)*ln(x+2)', answerLatex: '\\frac{1}{4} \\ln\\left|x - 2\\right| + \\frac{-1}{4} \\ln\\left|x + 2\\right|+C',
      domain: [2.6, 6.8],
      hints: ['$(x-2)(x+2)$ 로 인수분해한다.', '$\\dfrac{1}{4}\\left(\\dfrac{1}{x-2}-\\dfrac{1}{x+2}\\right)$'],
      steps: ['부분분수 분해', '$= \\frac{1}{4} \\ln\\left|x - 2\\right| + \\frac{-1}{4} \\ln\\left|x + 2\\right|$']
    },
    {
      id: 'h061', topic: '부분분수',
      integrand: '1/(x^2*(x+3))', latex: '\\frac{1}{x^{2} \\left(x + 3\\right)}',
      answer: '(-1)/(3*x) + (-1/9)*ln(x) + (1/9)*ln(x+3)', answerLatex: '\\frac{-1}{3 x} + \\frac{-1}{9} \\ln\\left|x\\right| + \\frac{1}{9} \\ln\\left|x + 3\\right|+C',
      domain: [0.4, 3],
      hints: ['$\\dfrac{A}{x}+\\dfrac{B}{x^{2}}+\\dfrac{D}{x+3}$ 로 분해한다.', '$B$ 는 $x=0$, $D$ 는 $x=-3$ 대입으로 바로 나온다.'],
      steps: ['$1=Ax(x+3)+B(x+3)+Dx^{2}$', '$B=\\frac{1}{3},\\;D=\\frac{1}{9},\\;A=\\frac{-1}{9}$', '$= \\frac{-1}{3 x} + \\frac{-1}{9} \\ln\\left|x\\right| + \\frac{1}{9} \\ln\\left|x + 3\\right|$']
    },
    {
      id: 'h062', topic: '부분분수',
      integrand: '1/(x^3+9x)', latex: '\\frac{1}{x^{3} + 9 x}',
      answer: '(1/9)*ln(x) + (-1/18)*ln(x^2+9)', answerLatex: '\\frac{1}{9} \\ln\\left|x\\right| + \\frac{-1}{18} \\ln\\left|x^{2} + 9\\right|+C',
      domain: [0.35, 3],
      hints: ['$x(x^{2}+9)$ 로 인수분해한다.', '$\\dfrac{1}{9}\\left(\\dfrac{1}{x}-\\dfrac{x}{x^{2}+9}\\right)$ 가 된다.'],
      steps: ['$\\dfrac{1}{x(x^{2}+9)} = \\dfrac{1}{9}\\left(\\dfrac{1}{x}-\\dfrac{x}{x^{2}+9}\\right)$', '$= \\frac{1}{9} \\ln\\left|x\\right| + \\frac{-1}{18} \\ln\\left|x^{2} + 9\\right|$']
    },
    {
      id: 'h063', topic: '부분분수',
      integrand: '1/(x^2-9)', latex: '\\frac{1}{x^{2} - 9}',
      answer: '(1/6)*ln(x-3) + (-1/6)*ln(x+3)', answerLatex: '\\frac{1}{6} \\ln\\left|x - 3\\right| + \\frac{-1}{6} \\ln\\left|x + 3\\right|+C',
      domain: [3.9000000000000004, 10.2],
      hints: ['$(x-3)(x+3)$ 로 인수분해한다.', '$\\dfrac{1}{6}\\left(\\dfrac{1}{x-3}-\\dfrac{1}{x+3}\\right)$'],
      steps: ['부분분수 분해', '$= \\frac{1}{6} \\ln\\left|x - 3\\right| + \\frac{-1}{6} \\ln\\left|x + 3\\right|$']
    },
    {
      id: 'h064', topic: '부분분수',
      integrand: '1/((x+1)(x+2)^2)', latex: '\\frac{1}{\\left(x + 1\\right) \\left(x + 2\\right)^{2}}',
      answer: 'ln(x+1) - ln(x+2) + 1/(x+2)', answerLatex: '\\ln\\left|x + 1\\right| - \\ln\\left|x + 2\\right| + \\frac{1}{x + 2}+C',
      domain: [0.2, 3],
      hints: ['중복 인수는 $\\dfrac{B}{x+2}+\\dfrac{D}{(x+2)^{2}}$ 두 항이 필요하다.', '$x=-1$ 와 $x=-2$ 를 대입해 계수를 잡는다.'],
      steps: ['$\\dfrac{A}{x+1}+\\dfrac{B}{x+2}+\\dfrac{D}{(x+2)^{2}}$', '$A=1,\\;B=-1,\\;D=-1$', '$= \\ln\\left|x + 1\\right| - \\ln\\left|x + 2\\right| + \\frac{1}{x + 2}$']
    },
    {
      id: 'h065', topic: '부분분수',
      integrand: '1/((x+1)(x+3)^2)', latex: '\\frac{1}{\\left(x + 1\\right) \\left(x + 3\\right)^{2}}',
      answer: '(1/4)*ln(x+1) + (-1/4)*ln(x+3) + (1)/(2*(x+3))', answerLatex: '\\frac{1}{4} \\ln\\left|x + 1\\right| + \\frac{-1}{4} \\ln\\left|x + 3\\right| + \\frac{1}{2 \\left(x + 3\\right)}+C',
      domain: [0.2, 3],
      hints: ['중복 인수는 $\\dfrac{B}{x+3}+\\dfrac{D}{(x+3)^{2}}$ 두 항이 필요하다.', '$x=-1$ 와 $x=-3$ 를 대입해 계수를 잡는다.'],
      steps: ['$\\dfrac{A}{x+1}+\\dfrac{B}{x+3}+\\dfrac{D}{(x+3)^{2}}$', '$A=\\frac{1}{4},\\;B=\\frac{-1}{4},\\;D=\\frac{-1}{2}$', '$= \\frac{1}{4} \\ln\\left|x + 1\\right| + \\frac{-1}{4} \\ln\\left|x + 3\\right| + \\frac{1}{2 \\left(x + 3\\right)}$']
    },
    {
      id: 'h066', topic: '부분분수',
      integrand: '1/((x+2)(x+3)^2)', latex: '\\frac{1}{\\left(x + 2\\right) \\left(x + 3\\right)^{2}}',
      answer: 'ln(x+2) - ln(x+3) + 1/(x+3)', answerLatex: '\\ln\\left|x + 2\\right| - \\ln\\left|x + 3\\right| + \\frac{1}{x + 3}+C',
      domain: [0.2, 3],
      hints: ['중복 인수는 $\\dfrac{B}{x+3}+\\dfrac{D}{(x+3)^{2}}$ 두 항이 필요하다.', '$x=-2$ 와 $x=-3$ 를 대입해 계수를 잡는다.'],
      steps: ['$\\dfrac{A}{x+2}+\\dfrac{B}{x+3}+\\dfrac{D}{(x+3)^{2}}$', '$A=1,\\;B=-1,\\;D=-1$', '$= \\ln\\left|x + 2\\right| - \\ln\\left|x + 3\\right| + \\frac{1}{x + 3}$']
    },
    {
      id: 'h067', topic: '부분분수',
      integrand: '1/((x+1)(x+4)^2)', latex: '\\frac{1}{\\left(x + 1\\right) \\left(x + 4\\right)^{2}}',
      answer: '(1/9)*ln(x+1) + (-1/9)*ln(x+4) + (1)/(3*(x+4))', answerLatex: '\\frac{1}{9} \\ln\\left|x + 1\\right| + \\frac{-1}{9} \\ln\\left|x + 4\\right| + \\frac{1}{3 \\left(x + 4\\right)}+C',
      domain: [0.2, 3],
      hints: ['중복 인수는 $\\dfrac{B}{x+4}+\\dfrac{D}{(x+4)^{2}}$ 두 항이 필요하다.', '$x=-1$ 와 $x=-4$ 를 대입해 계수를 잡는다.'],
      steps: ['$\\dfrac{A}{x+1}+\\dfrac{B}{x+4}+\\dfrac{D}{(x+4)^{2}}$', '$A=\\frac{1}{9},\\;B=\\frac{-1}{9},\\;D=\\frac{-1}{3}$', '$= \\frac{1}{9} \\ln\\left|x + 1\\right| + \\frac{-1}{9} \\ln\\left|x + 4\\right| + \\frac{1}{3 \\left(x + 4\\right)}$']
    },
    {
      id: 'h068', topic: '반복 부분적분',
      integrand: 'x^2*e^(x)', latex: 'x^{2} e^{x}',
      answer: 'e^(x)*(x^2 - 2x + 2)', answerLatex: 'e^{x} \\left(x^{2} - 2 x + 2\\right)+C',
      domain: [-1.5, 1.7],
      hints: ['부분적분을 두 번 해서 $x^{2}\\to x\\to 1$ 로 차수를 내린다.', '$\\int xe^{x}dx$ 가 중간에 나온다.'],
      steps: ['$x^{2}e^{x}-2\\int xe^{x}dx$', '$= e^{x} \\left(1 x^{2} - 2 x + 2\\right)$']
    },
    {
      id: 'h069', topic: '반복 부분적분',
      integrand: 'x^2*e^(2x)', latex: 'x^{2} e^{2 x}',
      answer: 'e^(2x)*(4x^2 - 4x + 2)/8', answerLatex: '\\frac{e^{2 x} \\left(4 x^{2} - 4 x + 2\\right)}{8}+C',
      domain: [-1.5, 1.7],
      hints: ['부분적분을 두 번 해서 $x^{2}\\to x\\to 1$ 로 차수를 내린다.', '$\\int xe^{2x}dx$ 가 중간에 나온다.'],
      steps: ['$\\dfrac{x^{2}e^{2x}}{2}-\\dfrac{2}{2}\\int xe^{2x}dx$', '$= \\frac{e^{2 x} \\left(4 x^{2} - 4 x + 2\\right)}{8}$']
    },
    {
      id: 'h070', topic: '반복 부분적분',
      integrand: 'x^2*e^(3x)', latex: 'x^{2} e^{3 x}',
      answer: 'e^(3x)*(9x^2 - 6x + 2)/27', answerLatex: '\\frac{e^{3 x} \\left(9 x^{2} - 6 x + 2\\right)}{27}+C',
      domain: [-1.5, 1.7],
      hints: ['부분적분을 두 번 해서 $x^{2}\\to x\\to 1$ 로 차수를 내린다.', '$\\int xe^{3x}dx$ 가 중간에 나온다.'],
      steps: ['$\\dfrac{x^{2}e^{3x}}{3}-\\dfrac{2}{3}\\int xe^{3x}dx$', '$= \\frac{e^{3 x} \\left(9 x^{2} - 6 x + 2\\right)}{27}$']
    },
    {
      id: 'h071', topic: '반복 부분적분',
      integrand: 'x^2*e^(-x)', latex: 'x^{2} e^{-x}',
      answer: 'e^(-x)*(x^2 - -2x + 2)/-1', answerLatex: '\\frac{e^{-x} \\left(x^{2} - -2 x + 2\\right)}{-1}+C',
      domain: [-1.5, 1.7],
      hints: ['부분적분을 두 번 해서 $x^{2}\\to x\\to 1$ 로 차수를 내린다.', '$\\int xe^{-x}dx$ 가 중간에 나온다.'],
      steps: ['$-x^{2}e^{-x}+2\\int xe^{-x}dx$', '$= \\frac{e^{-x} \\left(1 x^{2} - -2 x + 2\\right)}{-1}$']
    },
    {
      id: 'h072', topic: '반복 부분적분',
      integrand: 'x^2*sin(x)', latex: 'x^{2} \\sin x',
      answer: '-x^2*cos(x) + 2*x*sin(x) + 2*cos(x)', answerLatex: '-x^{2} \\cos x + 2 x \\sin x + 2 \\cos x+C',
      domain: [0.25, 2.85],
      hints: ['$u=x^{2}$ 로 두고 부분적분을 두 번 한다.', '중간에 $\\int x\\cos xdx$ 가 나온다.'],
      steps: ['$u=x^{2},\\;dv=\\sin xdx$', '$= -x^{2} \\cos x + 2 x \\sin x + 2 \\cos x$']
    },
    {
      id: 'h073', topic: '반복 부분적분',
      integrand: 'x^2*cos(x)', latex: 'x^{2} \\cos x',
      answer: 'x^2*sin(x) + 2*x*cos(x) - 2*sin(x)', answerLatex: 'x^{2} \\sin x + 2 x \\cos x - 2 \\sin x+C',
      domain: [0.25, 2.85],
      hints: ['$u=x^{2}$ 로 두고 두 번 부분적분한다.', '$\\sin$ 일 때와 부호 배치가 다르다.'],
      steps: ['$u=x^{2},\\;dv=\\cos xdx$', '$= x^{2} \\sin x + 2 x \\cos x - 2 \\sin x$']
    },
    {
      id: 'h074', topic: '반복 부분적분',
      integrand: 'x^2*sin(2x)', latex: 'x^{2} \\sin\\left(2 x\\right)',
      answer: '(-1/2)*x^2*cos(2x) + (1/2)*x*sin(2x) + (1/4)*cos(2x)', answerLatex: '\\frac{-1}{2} x^{2} \\cos\\left(2 x\\right) + \\frac{1}{2} x \\sin\\left(2 x\\right) + \\frac{1}{4} \\cos\\left(2 x\\right)+C',
      domain: [0.25, 2.85],
      hints: ['$u=x^{2}$ 로 두고 부분적분을 두 번 한다.', '중간에 $\\int x\\cos 2xdx$ 가 나온다.'],
      steps: ['$u=x^{2},\\;dv=\\sin 2xdx$', '$= \\frac{-1}{2} x^{2} \\cos\\left(2 x\\right) + \\frac{1}{2} x \\sin\\left(2 x\\right) + \\frac{1}{4} \\cos\\left(2 x\\right)$']
    },
    {
      id: 'h075', topic: '반복 부분적분',
      integrand: 'x^2*cos(2x)', latex: 'x^{2} \\cos\\left(2 x\\right)',
      answer: '(1/2)*x^2*sin(2x) + (1/2)*x*cos(2x) + (-1/4)*sin(2x)', answerLatex: '\\frac{1}{2} x^{2} \\sin\\left(2 x\\right) + \\frac{1}{2} x \\cos\\left(2 x\\right) + \\frac{-1}{4} \\sin\\left(2 x\\right)+C',
      domain: [0.25, 2.85],
      hints: ['$u=x^{2}$ 로 두고 두 번 부분적분한다.', '$\\sin$ 일 때와 부호 배치가 다르다.'],
      steps: ['$u=x^{2},\\;dv=\\cos 2xdx$', '$= \\frac{1}{2} x^{2} \\sin\\left(2 x\\right) + \\frac{1}{2} x \\cos\\left(2 x\\right) + \\frac{-1}{4} \\sin\\left(2 x\\right)$']
    },
    {
      id: 'h076', topic: '반복 부분적분',
      integrand: 'ln(x)^2', latex: '\\left(\\ln x\\right)^{2}',
      answer: 'x*ln(x)^2-2x*ln(x)+2x', answerLatex: 'x \\left(\\ln x\\right)^{2} - 2 x \\ln x + 2 x+C',
      domain: [0.35, 2.6],
      hints: ['$dv=dx$ 로 두고 부분적분한다.', '남는 적분이 $2\\int\\ln x\\,dx$ 다.'],
      steps: ['$u=(\\ln x)^{2},\\;dv=dx$', '$x(\\ln x)^{2}-2\\int\\ln x\\,dx$', '$=x(\\ln x)^{2}-2x\\ln x+2x$']
    },
    {
      id: 'h077', topic: '순환 부분적분',
      integrand: 'e^(x)sin(2x)', latex: 'e^{x} \\sin\\left(2 x\\right)',
      answer: 'e^(x)*(sin(2x) - 2cos(2x))/5', answerLatex: '\\frac{e^{x} \\left(\\sin\\left(2 x\\right) - 2 \\cos\\left(2 x\\right)\\right)}{5}+C',
      domain: [0.05, 1.6],
      hints: ['부분적분 두 번 뒤 원래 적분 $I$ 가 다시 나온다.', '분모는 $1+4=5$ 이 된다.'],
      steps: ['$I=\\int e^{x}\\sin 2x\\,dx$', '두 번 부분적분해 $I$ 에 대한 방정식을 세운다', '$I = \\frac{e^{x} \\left(\\sin\\left(2 x\\right) - 2 \\cos\\left(2 x\\right)\\right)}{5}$']
    },
    {
      id: 'h078', topic: '순환 부분적분',
      integrand: 'e^(x)cos(2x)', latex: 'e^{x} \\cos\\left(2 x\\right)',
      answer: 'e^(x)*(cos(2x) + 2sin(2x))/5', answerLatex: '\\frac{e^{x} \\left(\\cos\\left(2 x\\right) + 2 \\sin\\left(2 x\\right)\\right)}{5}+C',
      domain: [0.05, 1.6],
      hints: ['$\\sin$ 일 때와 같은 방법이다.', '분모는 똑같이 $5$ 이다.'],
      steps: ['$I=\\int e^{x}\\cos 2x\\,dx$', '$I = \\frac{e^{x} \\left(\\cos\\left(2 x\\right) + 2 \\sin\\left(2 x\\right)\\right)}{5}$']
    },
    {
      id: 'h079', topic: '순환 부분적분',
      integrand: 'e^(2x)sin(x)', latex: 'e^{2 x} \\sin x',
      answer: 'e^(2x)*(2sin(x) - cos(x))/5', answerLatex: '\\frac{e^{2 x} \\left(2 \\sin x - \\cos x\\right)}{5}+C',
      domain: [0.05, 1.6],
      hints: ['부분적분 두 번 뒤 원래 적분 $I$ 가 다시 나온다.', '분모는 $4+1=5$ 이 된다.'],
      steps: ['$I=\\int e^{2x}\\sin x\\,dx$', '두 번 부분적분해 $I$ 에 대한 방정식을 세운다', '$I = \\frac{e^{2 x} \\left(2 \\sin x - \\cos x\\right)}{5}$']
    },
    {
      id: 'h080', topic: '순환 부분적분',
      integrand: 'e^(2x)cos(x)', latex: 'e^{2 x} \\cos x',
      answer: 'e^(2x)*(2cos(x) + sin(x))/5', answerLatex: '\\frac{e^{2 x} \\left(2 \\cos x + \\sin x\\right)}{5}+C',
      domain: [0.05, 1.6],
      hints: ['$\\sin$ 일 때와 같은 방법이다.', '분모는 똑같이 $5$ 이다.'],
      steps: ['$I=\\int e^{2x}\\cos x\\,dx$', '$I = \\frac{e^{2 x} \\left(2 \\cos x + \\sin x\\right)}{5}$']
    },
    {
      id: 'h081', topic: '순환 부분적분',
      integrand: 'e^(2x)sin(3x)', latex: 'e^{2 x} \\sin\\left(3 x\\right)',
      answer: 'e^(2x)*(2sin(3x) - 3cos(3x))/13', answerLatex: '\\frac{e^{2 x} \\left(2 \\sin\\left(3 x\\right) - 3 \\cos\\left(3 x\\right)\\right)}{13}+C',
      domain: [0.05, 1.6],
      hints: ['부분적분 두 번 뒤 원래 적분 $I$ 가 다시 나온다.', '분모는 $4+9=13$ 이 된다.'],
      steps: ['$I=\\int e^{2x}\\sin 3x\\,dx$', '두 번 부분적분해 $I$ 에 대한 방정식을 세운다', '$I = \\frac{e^{2 x} \\left(2 \\sin\\left(3 x\\right) - 3 \\cos\\left(3 x\\right)\\right)}{13}$']
    },
    {
      id: 'h082', topic: '순환 부분적분',
      integrand: 'e^(2x)cos(3x)', latex: 'e^{2 x} \\cos\\left(3 x\\right)',
      answer: 'e^(2x)*(2cos(3x) + 3sin(3x))/13', answerLatex: '\\frac{e^{2 x} \\left(2 \\cos\\left(3 x\\right) + 3 \\sin\\left(3 x\\right)\\right)}{13}+C',
      domain: [0.05, 1.6],
      hints: ['$\\sin$ 일 때와 같은 방법이다.', '분모는 똑같이 $13$ 이다.'],
      steps: ['$I=\\int e^{2x}\\cos 3x\\,dx$', '$I = \\frac{e^{2 x} \\left(2 \\cos\\left(3 x\\right) + 3 \\sin\\left(3 x\\right)\\right)}{13}$']
    },
    {
      id: 'h083', topic: '순환 부분적분',
      integrand: 'e^(3x)sin(2x)', latex: 'e^{3 x} \\sin\\left(2 x\\right)',
      answer: 'e^(3x)*(3sin(2x) - 2cos(2x))/13', answerLatex: '\\frac{e^{3 x} \\left(3 \\sin\\left(2 x\\right) - 2 \\cos\\left(2 x\\right)\\right)}{13}+C',
      domain: [0.05, 1.6],
      hints: ['부분적분 두 번 뒤 원래 적분 $I$ 가 다시 나온다.', '분모는 $9+4=13$ 이 된다.'],
      steps: ['$I=\\int e^{3x}\\sin 2x\\,dx$', '두 번 부분적분해 $I$ 에 대한 방정식을 세운다', '$I = \\frac{e^{3 x} \\left(3 \\sin\\left(2 x\\right) - 2 \\cos\\left(2 x\\right)\\right)}{13}$']
    },
    {
      id: 'h084', topic: '순환 부분적분',
      integrand: 'e^(3x)cos(2x)', latex: 'e^{3 x} \\cos\\left(2 x\\right)',
      answer: 'e^(3x)*(3cos(2x) + 2sin(2x))/13', answerLatex: '\\frac{e^{3 x} \\left(3 \\cos\\left(2 x\\right) + 2 \\sin\\left(2 x\\right)\\right)}{13}+C',
      domain: [0.05, 1.6],
      hints: ['$\\sin$ 일 때와 같은 방법이다.', '분모는 똑같이 $13$ 이다.'],
      steps: ['$I=\\int e^{3x}\\cos 2x\\,dx$', '$I = \\frac{e^{3 x} \\left(3 \\cos\\left(2 x\\right) + 2 \\sin\\left(2 x\\right)\\right)}{13}$']
    },
    {
      id: 'h085', topic: '순환 부분적분',
      integrand: 'e^(-x)sin(x)', latex: 'e^{-x} \\sin x',
      answer: 'e^(-x)*(-sin(x) - cos(x))/2', answerLatex: '\\frac{e^{-x} \\left(-\\sin x - \\cos x\\right)}{2}+C',
      domain: [0.05, 1.6],
      hints: ['부분적분 두 번 뒤 원래 적분 $I$ 가 다시 나온다.', '분모는 $1+1=2$ 이 된다.'],
      steps: ['$I=\\int e^{-x}\\sin x\\,dx$', '두 번 부분적분해 $I$ 에 대한 방정식을 세운다', '$I = \\frac{e^{-x} \\left(-\\sin x - \\cos x\\right)}{2}$']
    },
    {
      id: 'h086', topic: '순환 부분적분',
      integrand: 'e^(-x)cos(x)', latex: 'e^{-x} \\cos x',
      answer: 'e^(-x)*(-cos(x) + sin(x))/2', answerLatex: '\\frac{e^{-x} \\left(-\\cos x + \\sin x\\right)}{2}+C',
      domain: [0.05, 1.6],
      hints: ['$\\sin$ 일 때와 같은 방법이다.', '분모는 똑같이 $2$ 이다.'],
      steps: ['$I=\\int e^{-x}\\cos x\\,dx$', '$I = \\frac{e^{-x} \\left(-\\cos x + \\sin x\\right)}{2}$']
    },
    {
      id: 'h087', topic: '순환 부분적분',
      integrand: 'e^(x)sin(3x)', latex: 'e^{x} \\sin\\left(3 x\\right)',
      answer: 'e^(x)*(sin(3x) - 3cos(3x))/10', answerLatex: '\\frac{e^{x} \\left(\\sin\\left(3 x\\right) - 3 \\cos\\left(3 x\\right)\\right)}{10}+C',
      domain: [0.05, 1.6],
      hints: ['부분적분 두 번 뒤 원래 적분 $I$ 가 다시 나온다.', '분모는 $1+9=10$ 이 된다.'],
      steps: ['$I=\\int e^{x}\\sin 3x\\,dx$', '두 번 부분적분해 $I$ 에 대한 방정식을 세운다', '$I = \\frac{e^{x} \\left(\\sin\\left(3 x\\right) - 3 \\cos\\left(3 x\\right)\\right)}{10}$']
    },
    {
      id: 'h088', topic: '순환 부분적분',
      integrand: 'e^(x)cos(3x)', latex: 'e^{x} \\cos\\left(3 x\\right)',
      answer: 'e^(x)*(cos(3x) + 3sin(3x))/10', answerLatex: '\\frac{e^{x} \\left(\\cos\\left(3 x\\right) + 3 \\sin\\left(3 x\\right)\\right)}{10}+C',
      domain: [0.05, 1.6],
      hints: ['$\\sin$ 일 때와 같은 방법이다.', '분모는 똑같이 $10$ 이다.'],
      steps: ['$I=\\int e^{x}\\cos 3x\\,dx$', '$I = \\frac{e^{x} \\left(\\cos\\left(3 x\\right) + 3 \\sin\\left(3 x\\right)\\right)}{10}$']
    },
    {
      id: 'h089', topic: '치환+부분적분',
      integrand: 'sin(ln(x))', latex: '\\sin\\left(\\ln x\\right)',
      answer: 'x*(sin(ln(x))-cos(ln(x)))/2', answerLatex: '\\frac{x \\left(\\sin\\left(\\ln x\\right) - \\cos\\left(\\ln x\\right)\\right)}{2}+C',
      domain: [0.3, 4],
      hints: ['$t=\\ln x$ 로 두면 $\\int e^{t}\\sin t\\,dt$ 가 된다.', '순환 부분적분 결과를 되돌린다.'],
      steps: ['$t=\\ln x,\\;dx=e^{t}dt$', '$\\int e^{t}\\sin t\\,dt=\\dfrac{e^{t}(\\sin t-\\cos t)}{2}$']
    },
    {
      id: 'h090', topic: '치환+부분적분',
      integrand: 'cos(ln(x))', latex: '\\cos\\left(\\ln x\\right)',
      answer: 'x*(sin(ln(x))+cos(ln(x)))/2', answerLatex: '\\frac{x \\left(\\sin\\left(\\ln x\\right) + \\cos\\left(\\ln x\\right)\\right)}{2}+C',
      domain: [0.3, 4],
      hints: ['$t=\\ln x$ 치환 후 $\\int e^{t}\\cos t\\,dt$ 다.', '$\\sin(\\ln x)$ 문제와 짝을 이룬다.'],
      steps: ['$t=\\ln x$', '$\\int e^{t}\\cos t\\,dt=\\dfrac{e^{t}(\\sin t+\\cos t)}{2}$']
    },
    {
      id: 'h091', topic: '치환+부분적분',
      integrand: 'e^(sqrt(x))', latex: 'e^{\\sqrt{x}}',
      answer: '2*e^(sqrt(x))*(sqrt(x)-1)', answerLatex: '2 e^{\\sqrt{x}} \\left(\\sqrt{x} - 1\\right)+C',
      domain: [0.2, 3],
      hints: ['$t=\\sqrt{x},\\;dx=2t\\,dt$ 로 치환한다.', '남은 $\\int te^{t}dt$ 는 부분적분이다.'],
      steps: ['$t=\\sqrt{x},\\;dx=2t\\,dt$', '$2\\int te^{t}dt=2(t-1)e^{t}$']
    },
    {
      id: 'h092', topic: '유리화 치환',
      integrand: 'sqrt(x)/(1+x)', latex: '\\frac{\\sqrt{x}}{1 + x}',
      answer: '2sqrt(x)-2atan(sqrt(x))', answerLatex: '2 \\sqrt{x} - 2 \\arctan\\left(\\sqrt{x}\\right)+C',
      domain: [0.2, 4],
      hints: ['$t=\\sqrt{x}$ 로 두면 $dx=2t\\,dt$ 다.', '$\\dfrac{t^{2}}{1+t^{2}}=1-\\dfrac{1}{1+t^{2}}$'],
      steps: ['$t=\\sqrt{x}$', '$2\\int\\dfrac{t^{2}}{1+t^{2}}dt=2t-2\\arctan t$']
    },
    {
      id: 'h093', topic: '유리화 치환',
      integrand: '1/(1+sqrt(x))', latex: '\\frac{1}{1 + \\sqrt{x}}',
      answer: '2sqrt(x)-2ln(1+sqrt(x))', answerLatex: '2 \\sqrt{x} - 2 \\ln\\left(1 + \\sqrt{x}\\right)+C',
      domain: [0.2, 4],
      hints: ['$t=\\sqrt{x}$ 로 치환한다.', '$\\dfrac{t}{1+t}=1-\\dfrac{1}{1+t}$ 로 나눈다.'],
      steps: ['$t=\\sqrt{x},\\;dx=2t\\,dt$', '$2\\int\\dfrac{t}{1+t}dt=2t-2\\ln(1+t)$']
    },
    {
      id: 'h094', topic: '유리화 치환',
      integrand: '1/(sqrt(x)*(1+x))', latex: '\\frac{1}{\\sqrt{x} \\left(1 + x\\right)}',
      answer: '2atan(sqrt(x))', answerLatex: '2 \\arctan\\left(\\sqrt{x}\\right)+C',
      domain: [0.2, 4],
      hints: ['$t=\\sqrt{x}$ 로 두면 $\\dfrac{dx}{\\sqrt{x}}=2dt$ 다.', '남는 적분이 곧바로 $\\arctan$ 이다.'],
      steps: ['$t=\\sqrt{x}$', '$2\\int\\dfrac{dt}{1+t^{2}}=2\\arctan\\sqrt{x}$']
    },
    {
      id: 'h095', topic: '지수 유리식',
      integrand: '1/(1+e^x)', latex: '\\frac{1}{1 + e^{x}}',
      answer: 'x-ln(1+e^x)', answerLatex: 'x - \\ln\\left(1 + e^{x}\\right)+C',
      domain: [-1.5, 2],
      hints: ['$\\dfrac{1}{1+e^{x}}=1-\\dfrac{e^{x}}{1+e^{x}}$ 로 쪼갠다.', '두 번째 항은 로그다.'],
      steps: ['$\\dfrac{1}{1+e^{x}}=1-\\dfrac{e^{x}}{1+e^{x}}$', '$\\int = x-\\ln(1+e^{x})$']
    },
    {
      id: 'h096', topic: '지수 유리식',
      integrand: '1/(e^x+e^(-x))', latex: '\\frac{1}{e^{x} + e^{-x}}',
      answer: 'atan(e^x)', answerLatex: '\\arctan\\left(e^{x}\\right)+C',
      domain: [-1.5, 1.8],
      hints: ['분모·분자에 $e^{x}$ 를 곱한다.', '$u=e^{x}$ 로 두면 $\\arctan$ 이 된다.'],
      steps: ['$\\dfrac{e^{x}}{e^{2x}+1}$', '$u=e^{x}:\\;\\int\\dfrac{du}{1+u^{2}}$']
    },
    {
      id: 'h097', topic: '지수 유리식',
      integrand: 'e^x/(e^(2x)-1)', latex: '\\frac{e^{x}}{e^{2 x} - 1}',
      answer: 'ln(e^x-1)/2-ln(e^x+1)/2', answerLatex: '\\frac{\\ln\\left|e^{x} - 1\\right|}{2} - \\frac{\\ln\\left|e^{x} + 1\\right|}{2}+C',
      domain: [0.35, 2],
      hints: ['$u=e^{x}$ 로 두면 $\\int\\dfrac{du}{u^{2}-1}$ 이다.', '부분분수로 분해한다.'],
      steps: ['$u=e^{x}$', '$\\int\\dfrac{du}{u^{2}-1}=\\dfrac{1}{2}\\ln\\left|\\dfrac{u-1}{u+1}\\right|$']
    },
    {
      id: 'h098', topic: '부분적분',
      integrand: 'x*atan(x)', latex: 'x \\arctan x',
      answer: '(x^2+1)*atan(x)/2-x/2', answerLatex: '\\frac{\\left(x^{2} + 1\\right) \\arctan x}{2} - \\frac{x}{2}+C',
      domain: [0.1, 2.5],
      hints: ['$v=\\dfrac{x^{2}+1}{2}$ 로 잡으면 계산이 깔끔해진다.', '적분상수를 $v$ 에 넣는 기술이다.'],
      steps: ['$u=\\arctan x,\\;v=\\dfrac{x^{2}+1}{2}$', '$\\dfrac{(x^{2}+1)\\arctan x}{2}-\\int\\dfrac{1}{2}dx$']
    },
    {
      id: 'h099', topic: '부분적분',
      integrand: 'x*asin(x)', latex: 'x \\arcsin x',
      answer: '(2x^2-1)*asin(x)/4+x*sqrt(1-x^2)/4', answerLatex: '\\frac{\\left(2 x^{2} - 1\\right) \\arcsin x}{4} + \\frac{x \\sqrt{1 - x^{2}}}{4}+C',
      domain: [-0.72, 0.72],
      hints: ['$u=\\arcsin x,\\;dv=x\\,dx$ 로 둔다.', '남는 적분에 삼각치환이 필요하다.'],
      steps: ['$u=\\arcsin x,\\;v=\\dfrac{x^{2}}{2}$', '$\\dfrac{x^{2}\\arcsin x}{2}-\\dfrac{1}{2}\\int\\dfrac{x^{2}}{\\sqrt{1-x^{2}}}dx$']
    },
    {
      id: 'h100', topic: '부분적분',
      integrand: 'acos(x)', latex: '\\arccos x',
      answer: 'x*acos(x)-sqrt(1-x^2)', answerLatex: 'x \\arccos x - \\sqrt{1 - x^{2}}+C',
      domain: [-0.72, 0.72],
      hints: ['$\\arcsin$ 일 때와 부호만 다르다.', '$du=-\\dfrac{dx}{\\sqrt{1-x^{2}}}$'],
      steps: ['$u=\\arccos x,\\;dv=dx$', '$x\\arccos x+\\int\\dfrac{x}{\\sqrt{1-x^{2}}}dx$']
    },
    {
      id: 'h101', topic: '부분적분',
      integrand: 'ln(x^2+1)', latex: '\\ln\\left(x^{2} + 1\\right)',
      answer: 'x*ln(x^2+1)-2x+2*atan(x)', answerLatex: 'x \\ln\\left(x^{2} + 1\\right) - 2 x + 2 \\arctan x+C',
      domain: [0.1, 2.5],
      hints: ['$dv=dx$ 로 두고 부분적분한다.', '남는 $\\int\\dfrac{2x^{2}}{x^{2}+1}dx$ 를 나눗셈으로 정리한다.'],
      steps: ['$u=\\ln(x^{2}+1),\\;dv=dx$', '$\\dfrac{2x^{2}}{x^{2}+1}=2-\\dfrac{2}{x^{2}+1}$']
    },
    {
      id: 'h102', topic: '부분적분',
      integrand: 'ln(x^2+4)', latex: '\\ln\\left(x^{2} + 4\\right)',
      answer: 'x*ln(x^2+4)-2x+4*atan(x/2)', answerLatex: 'x \\ln\\left(x^{2} + 4\\right) - 2 x + 4 \\arctan\\left(\\frac{x}{2}\\right)+C',
      domain: [0.1, 2.5],
      hints: ['$dv=dx$ 로 두고 부분적분한다.', '남는 $\\int\\dfrac{2x^{2}}{x^{2}+4}dx$ 를 나눗셈으로 정리한다.'],
      steps: ['$u=\\ln(x^{2}+4),\\;dv=dx$', '$\\dfrac{2x^{2}}{x^{2}+4}=2-\\dfrac{8}{x^{2}+4}$']
    },
    {
      id: 'h103', topic: '부분적분',
      integrand: 'ln(x^2+9)', latex: '\\ln\\left(x^{2} + 9\\right)',
      answer: 'x*ln(x^2+9)-2x+6*atan(x/3)', answerLatex: 'x \\ln\\left(x^{2} + 9\\right) - 2 x + 6 \\arctan\\left(\\frac{x}{3}\\right)+C',
      domain: [0.1, 2.5],
      hints: ['$dv=dx$ 로 두고 부분적분한다.', '남는 $\\int\\dfrac{2x^{2}}{x^{2}+9}dx$ 를 나눗셈으로 정리한다.'],
      steps: ['$u=\\ln(x^{2}+9),\\;dv=dx$', '$\\dfrac{2x^{2}}{x^{2}+9}=2-\\dfrac{18}{x^{2}+9}$']
    },
    {
      id: 'h104', topic: '치환적분',
      integrand: 'x^3/sqrt(x^2+1)', latex: '\\frac{x^{3}}{\\sqrt{x^{2} + 1}}',
      answer: '(x^2+1)^(3/2)/3-1*sqrt(x^2+1)', answerLatex: '\\frac{\\left(x^{2} + 1\\right)^{\\frac{3}{2}}}{3} - 1 \\sqrt{x^{2} + 1}+C',
      domain: [0.1, 2.5],
      hints: ['$u=x^{2}+1$ 이면 $x^{2}=u-1$ 다.', '$\\dfrac{1}{2}\\int\\dfrac{u-1}{\\sqrt{u}}du$ 를 계산한다.'],
      steps: ['$u=x^{2}+1,\\;du=2x\\,dx$', '$\\dfrac{1}{2}\\int (u^{1/2}-1u^{-1/2})du$']
    },
    {
      id: 'h105', topic: '치환적분',
      integrand: 'x/(x^4+1)', latex: '\\frac{x}{x^{4} + 1}',
      answer: '(1/2)*atan(x^2)', answerLatex: '\\frac{1}{2} \\arctan\\left(x^{2}\\right)+C',
      domain: [0.1, 2.5],
      hints: ['$x^{4}=(x^{2})^{2}$ 이므로 $u=x^{2}$ 로 둔다.', '$du=2x\\,dx$ 가 분자와 맞는다.'],
      steps: ['$u=x^{2},\\;du=2x\\,dx$', '$\\dfrac{1}{2}\\int\\dfrac{du}{u^{2}+1}$']
    },
    {
      id: 'h106', topic: '치환적분',
      integrand: 'x^3/sqrt(x^2+4)', latex: '\\frac{x^{3}}{\\sqrt{x^{2} + 4}}',
      answer: '(x^2+4)^(3/2)/3-4*sqrt(x^2+4)', answerLatex: '\\frac{\\left(x^{2} + 4\\right)^{\\frac{3}{2}}}{3} - 4 \\sqrt{x^{2} + 4}+C',
      domain: [0.1, 2.5],
      hints: ['$u=x^{2}+4$ 이면 $x^{2}=u-4$ 다.', '$\\dfrac{1}{2}\\int\\dfrac{u-4}{\\sqrt{u}}du$ 를 계산한다.'],
      steps: ['$u=x^{2}+4,\\;du=2x\\,dx$', '$\\dfrac{1}{2}\\int (u^{1/2}-4u^{-1/2})du$']
    },
    {
      id: 'h107', topic: '치환적분',
      integrand: 'x/(x^4+16)', latex: '\\frac{x}{x^{4} + 16}',
      answer: '(1/8)*atan(x^2/4)', answerLatex: '\\frac{1}{8} \\arctan\\left(\\frac{x^{2}}{4}\\right)+C',
      domain: [0.1, 2.5],
      hints: ['$x^{4}=(x^{2})^{2}$ 이므로 $u=x^{2}$ 로 둔다.', '$du=2x\\,dx$ 가 분자와 맞는다.'],
      steps: ['$u=x^{2},\\;du=2x\\,dx$', '$\\dfrac{1}{2}\\int\\dfrac{du}{u^{2}+16}$']
    },
    {
      id: 'h108', topic: '치환적분',
      integrand: 'x^3/sqrt(x^2+9)', latex: '\\frac{x^{3}}{\\sqrt{x^{2} + 9}}',
      answer: '(x^2+9)^(3/2)/3-9*sqrt(x^2+9)', answerLatex: '\\frac{\\left(x^{2} + 9\\right)^{\\frac{3}{2}}}{3} - 9 \\sqrt{x^{2} + 9}+C',
      domain: [0.1, 2.5],
      hints: ['$u=x^{2}+9$ 이면 $x^{2}=u-9$ 다.', '$\\dfrac{1}{2}\\int\\dfrac{u-9}{\\sqrt{u}}du$ 를 계산한다.'],
      steps: ['$u=x^{2}+9,\\;du=2x\\,dx$', '$\\dfrac{1}{2}\\int (u^{1/2}-9u^{-1/2})du$']
    },
    {
      id: 'h109', topic: '치환적분',
      integrand: 'x/(x^4+81)', latex: '\\frac{x}{x^{4} + 81}',
      answer: '(1/18)*atan(x^2/9)', answerLatex: '\\frac{1}{18} \\arctan\\left(\\frac{x^{2}}{9}\\right)+C',
      domain: [0.1, 2.5],
      hints: ['$x^{4}=(x^{2})^{2}$ 이므로 $u=x^{2}$ 로 둔다.', '$du=2x\\,dx$ 가 분자와 맞는다.'],
      steps: ['$u=x^{2},\\;du=2x\\,dx$', '$\\dfrac{1}{2}\\int\\dfrac{du}{u^{2}+81}$']
    },
    {
      id: 'h110', topic: '쌍곡선함수',
      integrand: 'sech(x)', latex: '\\operatorname{sech} x',
      answer: 'atan(sinh(x))', answerLatex: '\\arctan\\left(\\sinh x\\right)+C',
      domain: [0.25, 1.6],
      hints: ['$\\operatorname{sech}u=\\dfrac{\\cosh u}{\\cosh^{2}u}=\\dfrac{\\cosh u}{1+\\sinh^{2}u}$', '$t=\\sinh x$ 로 치환하면 $\\arctan$ 이 나온다.'],
      steps: ['$\\operatorname{sech}x = \\dfrac{\\cosh x}{1+\\sinh^{2}x}$', '$t=\\sinh x$', '$= \\arctan\\left(\\sinh x\\right)$']
    },
    {
      id: 'h111', topic: '쌍곡선 홀수차',
      integrand: 'sinh(x)^3', latex: '\\sinh^{3} x',
      answer: '(1/3)*cosh(x)^3 - cosh(x)', answerLatex: '\\frac{1}{3} \\cosh^{3} x - \\cosh x+C',
      domain: [0.25, 1.6],
      hints: ['$\\sinh^{3}u=\\sinh u(\\cosh^{2}u-1)$', '삼각함수와 달리 $\\cosh^{2}-\\sinh^{2}=1$ 이다.'],
      steps: ['$\\sinh^{3}x = (\\cosh^{2}-1)\\sinh$', '$= \\frac{1}{3} \\cosh^{3} x - \\cosh x$']
    },
    {
      id: 'h112', topic: '쌍곡선 홀수차',
      integrand: 'cosh(x)^3', latex: '\\cosh^{3} x',
      answer: 'sinh(x) + (1/3)*sinh(x)^3', answerLatex: '\\sinh x + \\frac{1}{3} \\sinh^{3} x+C',
      domain: [0.25, 1.6],
      hints: ['$\\cosh^{3}u=\\cosh u(1+\\sinh^{2}u)$', '$t=\\sinh x$ 로 치환한다.'],
      steps: ['$\\cosh^{3}x = (1+\\sinh^{2})\\cosh$', '$= \\sinh x + \\frac{1}{3} \\sinh^{3} x$']
    },
    {
      id: 'h113', topic: '쌍곡선 홀수차',
      integrand: 'tanh(x)^3', latex: '\\tanh^{3} x',
      answer: 'ln(cosh(x)) + (-1/2)*tanh(x)^2', answerLatex: '\\ln\\left(\\cosh x\\right) + \\frac{-1}{2} \\tanh^{2} x+C',
      domain: [0.25, 1.6],
      hints: ['$\\tanh^{3}u=\\tanh u(1-\\operatorname{sech}^{2}u)$', '$\\tan^{3}$ 문제와 부호가 반대다.'],
      steps: ['$\\tanh^{3}x = \\tanh-\\tanh\\operatorname{sech}^{2}$', '$= \\ln\\left(\\cosh x\\right) + \\frac{-1}{2} \\tanh^{2} x$']
    },
    {
      id: 'h114', topic: '쌍곡선함수',
      integrand: 'sech(2x)', latex: '\\operatorname{sech}\\left(2 x\\right)',
      answer: '(1/2)*atan(sinh(2x))', answerLatex: '\\frac{1}{2} \\arctan\\left(\\sinh\\left(2 x\\right)\\right)+C',
      domain: [0.25, 1.6],
      hints: ['$\\operatorname{sech}u=\\dfrac{\\cosh u}{\\cosh^{2}u}=\\dfrac{\\cosh u}{1+\\sinh^{2}u}$', '$t=\\sinh 2x$ 로 치환하면 $\\arctan$ 이 나온다.'],
      steps: ['$\\operatorname{sech}2x = \\dfrac{\\cosh 2x}{1+\\sinh^{2}2x}$', '$t=\\sinh 2x$', '$= \\frac{1}{2} \\arctan\\left(\\sinh\\left(2 x\\right)\\right)$']
    },
    {
      id: 'h115', topic: '쌍곡선 홀수차',
      integrand: 'sinh(2x)^3', latex: '\\sinh^{3}\\left(2 x\\right)',
      answer: '(1/6)*cosh(2x)^3 + (-1/2)*cosh(2x)', answerLatex: '\\frac{1}{6} \\cosh^{3}\\left(2 x\\right) + \\frac{-1}{2} \\cosh\\left(2 x\\right)+C',
      domain: [0.25, 1.6],
      hints: ['$\\sinh^{3}u=\\sinh u(\\cosh^{2}u-1)$', '삼각함수와 달리 $\\cosh^{2}-\\sinh^{2}=1$ 이다.'],
      steps: ['$\\sinh^{3}2x = (\\cosh^{2}-1)\\sinh$', '$= \\frac{1}{6} \\cosh^{3}\\left(2 x\\right) + \\frac{-1}{2} \\cosh\\left(2 x\\right)$']
    },
    {
      id: 'h116', topic: '쌍곡선 홀수차',
      integrand: 'cosh(2x)^3', latex: '\\cosh^{3}\\left(2 x\\right)',
      answer: '(1/2)*sinh(2x) + (1/6)*sinh(2x)^3', answerLatex: '\\frac{1}{2} \\sinh\\left(2 x\\right) + \\frac{1}{6} \\sinh^{3}\\left(2 x\\right)+C',
      domain: [0.25, 1.6],
      hints: ['$\\cosh^{3}u=\\cosh u(1+\\sinh^{2}u)$', '$t=\\sinh 2x$ 로 치환한다.'],
      steps: ['$\\cosh^{3}2x = (1+\\sinh^{2})\\cosh$', '$= \\frac{1}{2} \\sinh\\left(2 x\\right) + \\frac{1}{6} \\sinh^{3}\\left(2 x\\right)$']
    },
    {
      id: 'h117', topic: '쌍곡선 홀수차',
      integrand: 'tanh(2x)^3', latex: '\\tanh^{3}\\left(2 x\\right)',
      answer: '(1/2)*ln(cosh(2x)) + (-1/4)*tanh(2x)^2', answerLatex: '\\frac{1}{2} \\ln\\left(\\cosh\\left(2 x\\right)\\right) + \\frac{-1}{4} \\tanh^{2}\\left(2 x\\right)+C',
      domain: [0.25, 1.6],
      hints: ['$\\tanh^{3}u=\\tanh u(1-\\operatorname{sech}^{2}u)$', '$\\tan^{3}$ 문제와 부호가 반대다.'],
      steps: ['$\\tanh^{3}2x = \\tanh-\\tanh\\operatorname{sech}^{2}$', '$= \\frac{1}{2} \\ln\\left(\\cosh\\left(2 x\\right)\\right) + \\frac{-1}{4} \\tanh^{2}\\left(2 x\\right)$']
    },
    {
      id: 'h118', topic: '쌍곡선함수',
      integrand: 'sech(x)^3', latex: '\\operatorname{sech}^{3} x',
      answer: '(sech(x)tanh(x)+atan(sinh(x)))/2', answerLatex: '\\frac{\\operatorname{sech} x \\tanh x + \\arctan\\left(\\sinh x\\right)}{2}+C',
      domain: [0.25, 1.6],
      hints: ['$\\sec^{3}$ 와 같은 구조로 부분적분한다.', '$\\int\\operatorname{sech}x\\,dx=\\arctan(\\sinh x)$ 가 다시 나온다.'],
      steps: ['$I=\\int\\operatorname{sech}^{3}x\\,dx$', '$2I=\\operatorname{sech}x\\tanh x+\\arctan(\\sinh x)$']
    },
    {
      id: 'h119', topic: '반복 부분적분',
      integrand: 'x^2*sinh(x)', latex: 'x^{2} \\sinh x',
      answer: 'x^2*cosh(x)-2x*sinh(x)+2cosh(x)', answerLatex: 'x^{2} \\cosh x - 2 x \\sinh x + 2 \\cosh x+C',
      domain: [0.25, 1.6],
      hints: ['부분적분을 두 번 한다.', '삼각함수와 달리 부호가 계속 $+$ 로 간다.'],
      steps: ['$u=x^{2},\\;dv=\\sinh x\\,dx$', '$x^{2}\\cosh x-2\\int x\\cosh x\\,dx$']
    },
    {
      id: 'h120', topic: '반복 부분적분',
      integrand: 'x^2*cosh(x)', latex: 'x^{2} \\cosh x',
      answer: 'x^2*sinh(x)-2x*cosh(x)+2sinh(x)', answerLatex: 'x^{2} \\sinh x - 2 x \\cosh x + 2 \\sinh x+C',
      domain: [0.25, 1.6],
      hints: ['$u=x^{2},\\;dv=\\cosh x\\,dx$', '두 번 부분적분한다.'],
      steps: ['$u=x^{2},\\;v=\\sinh x$', '$x^{2}\\sinh x-2\\int x\\sinh x\\,dx$']
    },
    {
      id: 'h121', topic: '역쌍곡선함수',
      integrand: 'asinh(x)', latex: '\\operatorname{arsinh} x',
      answer: 'x*asinh(x)-sqrt(x^2+1)', answerLatex: 'x \\operatorname{arsinh} x - \\sqrt{x^{2} + 1}+C',
      domain: [0.1, 2.5],
      hints: ['$dv=dx$ 로 두고 부분적분한다.', '$\\dfrac{d}{dx}\\operatorname{arsinh}x=\\dfrac{1}{\\sqrt{x^{2}+1}}$'],
      steps: ['$u=\\operatorname{arsinh}x,\\;dv=dx$', '$x\\operatorname{arsinh}x-\\int\\dfrac{x}{\\sqrt{x^{2}+1}}dx$']
    },
    {
      id: 'h122', topic: '역쌍곡선함수',
      integrand: 'atanh(x)', latex: '\\operatorname{artanh} x',
      answer: 'x*atanh(x)+ln(1-x^2)/2', answerLatex: 'x \\operatorname{artanh} x + \\frac{\\ln\\left(1 - x^{2}\\right)}{2}+C',
      domain: [-0.7, 0.7],
      hints: ['$dv=dx$ 로 두고 부분적분한다.', '$\\dfrac{d}{dx}\\operatorname{artanh}x=\\dfrac{1}{1-x^{2}}$'],
      steps: ['$u=\\operatorname{artanh}x,\\;dv=dx$', '$x\\operatorname{artanh}x-\\int\\dfrac{x}{1-x^{2}}dx$']
    },
    {
      id: 'h123', topic: '역쌍곡선함수',
      integrand: 'ln(x+sqrt(x^2+1))', latex: '\\ln\\left(x + \\sqrt{x^{2} + 1}\\right)',
      answer: 'x*asinh(x)-sqrt(x^2+1)', answerLatex: 'x \\operatorname{arsinh} x - \\sqrt{x^{2} + 1}+C',
      domain: [0.1, 2.5],
      hints: ['$\\ln(x+\\sqrt{x^{2}+1})=\\operatorname{arsinh}x$ 임을 먼저 알아본다.', '그다음은 부분적분이다.'],
      steps: ['$\\ln(x+\\sqrt{x^{2}+1})=\\operatorname{arsinh}x$', '$\\int\\operatorname{arsinh}x\\,dx=x\\operatorname{arsinh}x-\\sqrt{x^{2}+1}$']
    },
    {
      id: 'h124', topic: '쌍곡선함수',
      integrand: 'e^(2x)sinh(x)', latex: 'e^{2 x} \\sinh x',
      answer: 'e^(2x)*(2sinh(x) - cosh(x))/3', answerLatex: '\\frac{e^{2 x} \\left(2 \\sinh x - \\cosh x\\right)}{3}+C',
      domain: [0.05, 1.3],
      hints: ['$\\sinh$ 를 지수로 풀어써도 되고 순환 부분적분을 써도 된다.', '분모는 $4-1=3$ 이다.'],
      steps: ['$\\sinh x = \\dfrac{e^{x}-e^{-x}}{2}$', '항별로 지수적분한 뒤 정리한다', '$= \\frac{e^{2 x} \\left(2 \\sinh x - \\cosh x\\right)}{3}$']
    },
    {
      id: 'h125', topic: '쌍곡선함수',
      integrand: 'e^(3x)sinh(x)', latex: 'e^{3 x} \\sinh x',
      answer: 'e^(3x)*(3sinh(x) - cosh(x))/8', answerLatex: '\\frac{e^{3 x} \\left(3 \\sinh x - \\cosh x\\right)}{8}+C',
      domain: [0.05, 1.3],
      hints: ['$\\sinh$ 를 지수로 풀어써도 되고 순환 부분적분을 써도 된다.', '분모는 $9-1=8$ 이다.'],
      steps: ['$\\sinh x = \\dfrac{e^{x}-e^{-x}}{2}$', '항별로 지수적분한 뒤 정리한다', '$= \\frac{e^{3 x} \\left(3 \\sinh x - \\cosh x\\right)}{8}$']
    },
    {
      id: 'h126', topic: '쌍곡선함수',
      integrand: 'e^(3x)sinh(2x)', latex: 'e^{3 x} \\sinh\\left(2 x\\right)',
      answer: 'e^(3x)*(3sinh(2x) - 2cosh(2x))/5', answerLatex: '\\frac{e^{3 x} \\left(3 \\sinh\\left(2 x\\right) - 2 \\cosh\\left(2 x\\right)\\right)}{5}+C',
      domain: [0.05, 1.3],
      hints: ['$\\sinh$ 를 지수로 풀어써도 되고 순환 부분적분을 써도 된다.', '분모는 $9-4=5$ 이다.'],
      steps: ['$\\sinh 2x = \\dfrac{e^{2x}-e^{-2x}}{2}$', '항별로 지수적분한 뒤 정리한다', '$= \\frac{e^{3 x} \\left(3 \\sinh\\left(2 x\\right) - 2 \\cosh\\left(2 x\\right)\\right)}{5}$']
    },
    {
      id: 'h127', topic: '쌍곡선함수',
      integrand: 'e^(x)sinh(2x)', latex: 'e^{x} \\sinh\\left(2 x\\right)',
      answer: 'e^(x)*(sinh(2x) - 2cosh(2x))/-3', answerLatex: '\\frac{e^{x} \\left(\\sinh\\left(2 x\\right) - 2 \\cosh\\left(2 x\\right)\\right)}{-3}+C',
      domain: [0.05, 1.3],
      hints: ['$\\sinh$ 를 지수로 풀어써도 되고 순환 부분적분을 써도 된다.', '분모는 $1-4=-3$ 이다.'],
      steps: ['$\\sinh 2x = \\dfrac{e^{2x}-e^{-2x}}{2}$', '항별로 지수적분한 뒤 정리한다', '$= \\frac{e^{x} \\left(\\sinh\\left(2 x\\right) - 2 \\cosh\\left(2 x\\right)\\right)}{-3}$']
    },
    {
      id: 'h128', topic: '삼각 유리식',
      integrand: '1/(1+sin(x))', latex: '\\frac{1}{1 + \\sin x}',
      answer: 'tan(x)-sec(x)', answerLatex: '\\tan x - \\sec x+C',
      domain: [0.2, 1.2],
      hints: ['분모·분자에 $1-\\sin x$ 를 곱한다.', '$\\dfrac{1-\\sin x}{\\cos^{2}x}$ 로 정리된다.'],
      steps: ['$\\dfrac{1}{1+\\sin x}\\cdot\\dfrac{1-\\sin x}{1-\\sin x}=\\dfrac{1-\\sin x}{\\cos^{2}x}$', '$= \\sec^{2}x-\\sec x\\tan x$']
    },
    {
      id: 'h129', topic: '삼각 유리식',
      integrand: '1/(1-sin(x))', latex: '\\frac{1}{1 - \\sin x}',
      answer: 'tan(x)+sec(x)', answerLatex: '\\tan x + \\sec x+C',
      domain: [0.2, 1.2],
      hints: ['$1+\\sin x$ 를 곱한다.', '부호만 다르고 요령은 같다.'],
      steps: ['$\\dfrac{1+\\sin x}{\\cos^{2}x}=\\sec^{2}x+\\sec x\\tan x$']
    },
    {
      id: 'h130', topic: '삼각 유리식',
      integrand: '1/(1+cos(x))', latex: '\\frac{1}{1 + \\cos x}',
      answer: 'tan(x/2)', answerLatex: '\\tan\\left(\\frac{x}{2}\\right)+C',
      domain: [0.2, 2.4],
      hints: ['반각공식 $1+\\cos x=2\\cos^{2}\\dfrac{x}{2}$ 를 쓴다.', '$\\dfrac{1}{2}\\sec^{2}\\dfrac{x}{2}$ 가 된다.'],
      steps: ['$1+\\cos x = 2\\cos^{2}\\dfrac{x}{2}$', '$\\dfrac{1}{2}\\int\\sec^{2}\\dfrac{x}{2}dx=\\tan\\dfrac{x}{2}$']
    },
    {
      id: 'h131', topic: '삼각 유리식',
      integrand: '1/(1-cos(x))', latex: '\\frac{1}{1 - \\cos x}',
      answer: '-cot(x/2)', answerLatex: '-\\cot\\left(\\frac{x}{2}\\right)+C',
      domain: [0.4, 2.6],
      hints: ['$1-\\cos x=2\\sin^{2}\\dfrac{x}{2}$ 를 쓴다.', '$\\csc^{2}$ 적분이 된다.'],
      steps: ['$1-\\cos x = 2\\sin^{2}\\dfrac{x}{2}$', '$\\dfrac{1}{2}\\int\\csc^{2}\\dfrac{x}{2}dx=-\\cot\\dfrac{x}{2}$']
    },
    {
      id: 'h132', topic: '삼각 유리식',
      integrand: '1/(sin(x)cos(x))', latex: '\\frac{1}{\\sin x \\cos x}',
      answer: 'ln(tan(x))', answerLatex: '\\ln\\left|\\tan x\\right|+C',
      domain: [0.3, 1.2],
      hints: ['분모·분자에 $\\dfrac{1}{\\cos^{2}x}$ 를 곱해 본다.', '$\\dfrac{\\sec^{2}x}{\\tan x}$ 형태가 된다.'],
      steps: ['$\\dfrac{1}{\\sin x\\cos x}=\\dfrac{\\sec^{2}x}{\\tan x}$', '$u=\\tan x$', '$\\ln|\\tan x|$']
    },
    {
      id: 'h133', topic: '곱-합 공식',
      integrand: 'sin(2x)cos(x)', latex: '\\sin\\left(2 x\\right) \\cos x',
      answer: '(-1/2)*cos(x) + (-1/6)*cos(3x)', answerLatex: '\\frac{-1}{2} \\cos x + \\frac{-1}{6} \\cos\\left(3 x\\right)+C',
      domain: [0.25, 2.85],
      hints: ['$\\sin A\\cos B=\\dfrac{\\sin(A-B)+\\sin(A+B)}{2}$', '각이 $x$ 와 $3x$ 로 갈라진다.'],
      steps: ['$\\sin 2x\\cos x = \\dfrac{\\sin x+\\sin 3x}{2}$', '$= \\frac{-1}{2} \\cos x + \\frac{-1}{6} \\cos\\left(3 x\\right)$']
    },
    {
      id: 'h134', topic: '곱-합 공식',
      integrand: 'sin(2x)sin(x)', latex: '\\sin\\left(2 x\\right) \\sin x',
      answer: '(1/2)*sin(x) + (-1/6)*sin(3x)', answerLatex: '\\frac{1}{2} \\sin x + \\frac{-1}{6} \\sin\\left(3 x\\right)+C',
      domain: [0.25, 2.85],
      hints: ['$\\sin A\\sin B=\\dfrac{\\cos(A-B)-\\cos(A+B)}{2}$', '두 항을 따로 적분한다.'],
      steps: ['$\\sin 2x\\sin x = \\dfrac{\\cos x-\\cos 3x}{2}$', '$= \\frac{1}{2} \\sin x + \\frac{-1}{6} \\sin\\left(3 x\\right)$']
    },
    {
      id: 'h135', topic: '곱-합 공식',
      integrand: 'cos(2x)cos(x)', latex: '\\cos\\left(2 x\\right) \\cos x',
      answer: '(1/2)*sin(x) + (1/6)*sin(3x)', answerLatex: '\\frac{1}{2} \\sin x + \\frac{1}{6} \\sin\\left(3 x\\right)+C',
      domain: [0.25, 2.85],
      hints: ['$\\cos A\\cos B=\\dfrac{\\cos(A-B)+\\cos(A+B)}{2}$', '$\\sin\\sin$ 과 부호만 다르다.'],
      steps: ['$\\cos 2x\\cos x = \\dfrac{\\cos x+\\cos 3x}{2}$', '$= \\frac{1}{2} \\sin x + \\frac{1}{6} \\sin\\left(3 x\\right)$']
    },
    {
      id: 'h136', topic: '곱-합 공식',
      integrand: 'sin(3x)cos(x)', latex: '\\sin\\left(3 x\\right) \\cos x',
      answer: '(-1/4)*cos(2x) + (-1/8)*cos(4x)', answerLatex: '\\frac{-1}{4} \\cos\\left(2 x\\right) + \\frac{-1}{8} \\cos\\left(4 x\\right)+C',
      domain: [0.25, 2.85],
      hints: ['$\\sin A\\cos B=\\dfrac{\\sin(A-B)+\\sin(A+B)}{2}$', '각이 $2x$ 와 $4x$ 로 갈라진다.'],
      steps: ['$\\sin 3x\\cos x = \\dfrac{\\sin 2x+\\sin 4x}{2}$', '$= \\frac{-1}{4} \\cos\\left(2 x\\right) + \\frac{-1}{8} \\cos\\left(4 x\\right)$']
    },
    {
      id: 'h137', topic: '곱-합 공식',
      integrand: 'sin(3x)sin(x)', latex: '\\sin\\left(3 x\\right) \\sin x',
      answer: '(1/4)*sin(2x) + (-1/8)*sin(4x)', answerLatex: '\\frac{1}{4} \\sin\\left(2 x\\right) + \\frac{-1}{8} \\sin\\left(4 x\\right)+C',
      domain: [0.25, 2.85],
      hints: ['$\\sin A\\sin B=\\dfrac{\\cos(A-B)-\\cos(A+B)}{2}$', '두 항을 따로 적분한다.'],
      steps: ['$\\sin 3x\\sin x = \\dfrac{\\cos 2x-\\cos 4x}{2}$', '$= \\frac{1}{4} \\sin\\left(2 x\\right) + \\frac{-1}{8} \\sin\\left(4 x\\right)$']
    },
    {
      id: 'h138', topic: '곱-합 공식',
      integrand: 'cos(3x)cos(x)', latex: '\\cos\\left(3 x\\right) \\cos x',
      answer: '(1/4)*sin(2x) + (1/8)*sin(4x)', answerLatex: '\\frac{1}{4} \\sin\\left(2 x\\right) + \\frac{1}{8} \\sin\\left(4 x\\right)+C',
      domain: [0.25, 2.85],
      hints: ['$\\cos A\\cos B=\\dfrac{\\cos(A-B)+\\cos(A+B)}{2}$', '$\\sin\\sin$ 과 부호만 다르다.'],
      steps: ['$\\cos 3x\\cos x = \\dfrac{\\cos 2x+\\cos 4x}{2}$', '$= \\frac{1}{4} \\sin\\left(2 x\\right) + \\frac{1}{8} \\sin\\left(4 x\\right)$']
    },
    {
      id: 'h139', topic: '곱-합 공식',
      integrand: 'sin(3x)cos(2x)', latex: '\\sin\\left(3 x\\right) \\cos\\left(2 x\\right)',
      answer: '(-1/2)*cos(x) + (-1/10)*cos(5x)', answerLatex: '\\frac{-1}{2} \\cos x + \\frac{-1}{10} \\cos\\left(5 x\\right)+C',
      domain: [0.25, 2.85],
      hints: ['$\\sin A\\cos B=\\dfrac{\\sin(A-B)+\\sin(A+B)}{2}$', '각이 $x$ 와 $5x$ 로 갈라진다.'],
      steps: ['$\\sin 3x\\cos 2x = \\dfrac{\\sin x+\\sin 5x}{2}$', '$= \\frac{-1}{2} \\cos x + \\frac{-1}{10} \\cos\\left(5 x\\right)$']
    },
    {
      id: 'h140', topic: '곱-합 공식',
      integrand: 'sin(3x)sin(2x)', latex: '\\sin\\left(3 x\\right) \\sin\\left(2 x\\right)',
      answer: '(1/2)*sin(x) + (-1/10)*sin(5x)', answerLatex: '\\frac{1}{2} \\sin x + \\frac{-1}{10} \\sin\\left(5 x\\right)+C',
      domain: [0.25, 2.85],
      hints: ['$\\sin A\\sin B=\\dfrac{\\cos(A-B)-\\cos(A+B)}{2}$', '두 항을 따로 적분한다.'],
      steps: ['$\\sin 3x\\sin 2x = \\dfrac{\\cos x-\\cos 5x}{2}$', '$= \\frac{1}{2} \\sin x + \\frac{-1}{10} \\sin\\left(5 x\\right)$']
    },
    {
      id: 'h141', topic: '곱-합 공식',
      integrand: 'cos(3x)cos(2x)', latex: '\\cos\\left(3 x\\right) \\cos\\left(2 x\\right)',
      answer: '(1/2)*sin(x) + (1/10)*sin(5x)', answerLatex: '\\frac{1}{2} \\sin x + \\frac{1}{10} \\sin\\left(5 x\\right)+C',
      domain: [0.25, 2.85],
      hints: ['$\\cos A\\cos B=\\dfrac{\\cos(A-B)+\\cos(A+B)}{2}$', '$\\sin\\sin$ 과 부호만 다르다.'],
      steps: ['$\\cos 3x\\cos 2x = \\dfrac{\\cos x+\\cos 5x}{2}$', '$= \\frac{1}{2} \\sin x + \\frac{1}{10} \\sin\\left(5 x\\right)$']
    },
    {
      id: 'h142', topic: '곱-합 공식',
      integrand: 'sin(4x)cos(x)', latex: '\\sin\\left(4 x\\right) \\cos x',
      answer: '(-1/6)*cos(3x) + (-1/10)*cos(5x)', answerLatex: '\\frac{-1}{6} \\cos\\left(3 x\\right) + \\frac{-1}{10} \\cos\\left(5 x\\right)+C',
      domain: [0.25, 2.85],
      hints: ['$\\sin A\\cos B=\\dfrac{\\sin(A-B)+\\sin(A+B)}{2}$', '각이 $3x$ 와 $5x$ 로 갈라진다.'],
      steps: ['$\\sin 4x\\cos x = \\dfrac{\\sin 3x+\\sin 5x}{2}$', '$= \\frac{-1}{6} \\cos\\left(3 x\\right) + \\frac{-1}{10} \\cos\\left(5 x\\right)$']
    },
    {
      id: 'h143', topic: '곱-합 공식',
      integrand: 'sin(4x)sin(x)', latex: '\\sin\\left(4 x\\right) \\sin x',
      answer: '(1/6)*sin(3x) + (-1/10)*sin(5x)', answerLatex: '\\frac{1}{6} \\sin\\left(3 x\\right) + \\frac{-1}{10} \\sin\\left(5 x\\right)+C',
      domain: [0.25, 2.85],
      hints: ['$\\sin A\\sin B=\\dfrac{\\cos(A-B)-\\cos(A+B)}{2}$', '두 항을 따로 적분한다.'],
      steps: ['$\\sin 4x\\sin x = \\dfrac{\\cos 3x-\\cos 5x}{2}$', '$= \\frac{1}{6} \\sin\\left(3 x\\right) + \\frac{-1}{10} \\sin\\left(5 x\\right)$']
    },
    {
      id: 'h144', topic: '곱-합 공식',
      integrand: 'cos(4x)cos(x)', latex: '\\cos\\left(4 x\\right) \\cos x',
      answer: '(1/6)*sin(3x) + (1/10)*sin(5x)', answerLatex: '\\frac{1}{6} \\sin\\left(3 x\\right) + \\frac{1}{10} \\sin\\left(5 x\\right)+C',
      domain: [0.25, 2.85],
      hints: ['$\\cos A\\cos B=\\dfrac{\\cos(A-B)+\\cos(A+B)}{2}$', '$\\sin\\sin$ 과 부호만 다르다.'],
      steps: ['$\\cos 4x\\cos x = \\dfrac{\\cos 3x+\\cos 5x}{2}$', '$= \\frac{1}{6} \\sin\\left(3 x\\right) + \\frac{1}{10} \\sin\\left(5 x\\right)$']
    },
    {
      id: 'h145', topic: '곱-합 공식',
      integrand: 'sin(5x)cos(2x)', latex: '\\sin\\left(5 x\\right) \\cos\\left(2 x\\right)',
      answer: '(-1/6)*cos(3x) + (-1/14)*cos(7x)', answerLatex: '\\frac{-1}{6} \\cos\\left(3 x\\right) + \\frac{-1}{14} \\cos\\left(7 x\\right)+C',
      domain: [0.25, 2.85],
      hints: ['$\\sin A\\cos B=\\dfrac{\\sin(A-B)+\\sin(A+B)}{2}$', '각이 $3x$ 와 $7x$ 로 갈라진다.'],
      steps: ['$\\sin 5x\\cos 2x = \\dfrac{\\sin 3x+\\sin 7x}{2}$', '$= \\frac{-1}{6} \\cos\\left(3 x\\right) + \\frac{-1}{14} \\cos\\left(7 x\\right)$']
    },
    {
      id: 'h146', topic: '곱-합 공식',
      integrand: 'sin(5x)sin(2x)', latex: '\\sin\\left(5 x\\right) \\sin\\left(2 x\\right)',
      answer: '(1/6)*sin(3x) + (-1/14)*sin(7x)', answerLatex: '\\frac{1}{6} \\sin\\left(3 x\\right) + \\frac{-1}{14} \\sin\\left(7 x\\right)+C',
      domain: [0.25, 2.85],
      hints: ['$\\sin A\\sin B=\\dfrac{\\cos(A-B)-\\cos(A+B)}{2}$', '두 항을 따로 적분한다.'],
      steps: ['$\\sin 5x\\sin 2x = \\dfrac{\\cos 3x-\\cos 7x}{2}$', '$= \\frac{1}{6} \\sin\\left(3 x\\right) + \\frac{-1}{14} \\sin\\left(7 x\\right)$']
    },
    {
      id: 'h147', topic: '곱-합 공식',
      integrand: 'cos(5x)cos(2x)', latex: '\\cos\\left(5 x\\right) \\cos\\left(2 x\\right)',
      answer: '(1/6)*sin(3x) + (1/14)*sin(7x)', answerLatex: '\\frac{1}{6} \\sin\\left(3 x\\right) + \\frac{1}{14} \\sin\\left(7 x\\right)+C',
      domain: [0.25, 2.85],
      hints: ['$\\cos A\\cos B=\\dfrac{\\cos(A-B)+\\cos(A+B)}{2}$', '$\\sin\\sin$ 과 부호만 다르다.'],
      steps: ['$\\cos 5x\\cos 2x = \\dfrac{\\cos 3x+\\cos 7x}{2}$', '$= \\frac{1}{6} \\sin\\left(3 x\\right) + \\frac{1}{14} \\sin\\left(7 x\\right)$']
    },
    {
      id: 'h148', topic: '치환적분',
      integrand: 'x/(x^4+2x^2+2)', latex: '\\frac{x}{x^{4} + 2 x^{2} + 2}',
      answer: 'atan(x^2+1)/2', answerLatex: '\\frac{\\arctan\\left(x^{2} + 1\\right)}{2}+C',
      domain: [0.1, 2.5],
      hints: ['분모를 $(x^{2}+1)^{2}+1$ 로 완전제곱한다.', '$u=x^{2}+1$ 로 두면 $\\arctan$ 이 된다.'],
      steps: ['$x^{4}+2x^{2}+2=(x^{2}+1)^{2}+1$', '$u=x^{2}+1,\\;du=2x\\,dx$', '$\\dfrac{1}{2}\\int\\dfrac{du}{u^{2}+1}=\\dfrac{\\arctan(x^{2}+1)}{2}$']
    },
    {
      id: 'h149', topic: '유리식 치환',
      integrand: '1/(x*(x^2+1))', latex: '\\frac{1}{x \\left(x^{2} + 1\\right)}',
      answer: '(ln(x^2)-ln(x^2+1))/2', answerLatex: '\\frac{\\ln\\left|x^{2}\\right| - \\ln\\left|x^{2} + 1\\right|}{2}+C',
      domain: [0.35, 2.6],
      hints: ['분자·분모에 $x^{1}$ 을 곱해 $u=x^{2}$ 를 만든다.', '$\\dfrac{1}{u(u+1)}=\\dfrac{1}{u}-\\dfrac{1}{u+1}$'],
      steps: ['$\\dfrac{x^{1}}{x^{2}(x^{2}+1)}$', '$u=x^{2}$', '$\\dfrac{1}{2}\\ln\\left|\\dfrac{x^{2}}{x^{2}+1}\\right|$']
    },
    {
      id: 'h150', topic: '유리식 치환',
      integrand: '1/(x*(x^3+1))', latex: '\\frac{1}{x \\left(x^{3} + 1\\right)}',
      answer: '(ln(x^3)-ln(x^3+1))/3', answerLatex: '\\frac{\\ln\\left|x^{3}\\right| - \\ln\\left|x^{3} + 1\\right|}{3}+C',
      domain: [0.35, 2.6],
      hints: ['분자·분모에 $x^{2}$ 을 곱해 $u=x^{3}$ 를 만든다.', '$\\dfrac{1}{u(u+1)}=\\dfrac{1}{u}-\\dfrac{1}{u+1}$'],
      steps: ['$\\dfrac{x^{2}}{x^{3}(x^{3}+1)}$', '$u=x^{3}$', '$\\dfrac{1}{3}\\ln\\left|\\dfrac{x^{3}}{x^{3}+1}\\right|$']
    },
    {
      id: 'h151', topic: '유리식 치환',
      integrand: '1/(x*(x^4+1))', latex: '\\frac{1}{x \\left(x^{4} + 1\\right)}',
      answer: '(ln(x^4)-ln(x^4+1))/4', answerLatex: '\\frac{\\ln\\left|x^{4}\\right| - \\ln\\left|x^{4} + 1\\right|}{4}+C',
      domain: [0.35, 2.6],
      hints: ['분자·분모에 $x^{3}$ 을 곱해 $u=x^{4}$ 를 만든다.', '$\\dfrac{1}{u(u+1)}=\\dfrac{1}{u}-\\dfrac{1}{u+1}$'],
      steps: ['$\\dfrac{x^{3}}{x^{4}(x^{4}+1)}$', '$u=x^{4}$', '$\\dfrac{1}{4}\\ln\\left|\\dfrac{x^{4}}{x^{4}+1}\\right|$']
    },
    {
      id: 'h152', topic: '삼각함수 홀수차',
      integrand: 'sin(x)^5', latex: '\\sin^{5} x',
      answer: '-cos(x)+2cos(x)^3/3-cos(x)^5/5', answerLatex: '-\\cos x + \\frac{2 \\cos^{3} x}{3} - \\frac{\\cos^{5} x}{5}+C',
      domain: [0.25, 2.85],
      hints: ['$\\sin^{5}=\\sin x(1-\\cos^{2}x)^{2}$ 로 쓴다.', '$u=\\cos x$ 치환 후 전개한다.'],
      steps: ['$\\sin^{5}x=(1-\\cos^{2}x)^{2}\\sin x$', '$u=\\cos x:\\;-\\int(1-u^{2})^{2}du$']
    },
    {
      id: 'h153', topic: '삼각함수 홀수차',
      integrand: 'cos(x)^5', latex: '\\cos^{5} x',
      answer: 'sin(x)-2sin(x)^3/3+sin(x)^5/5', answerLatex: '\\sin x - \\frac{2 \\sin^{3} x}{3} + \\frac{\\sin^{5} x}{5}+C',
      domain: [0.25, 2.85],
      hints: ['$\\cos^{5}=\\cos x(1-\\sin^{2}x)^{2}$ 로 쓴다.', '$u=\\sin x$ 로 치환한다.'],
      steps: ['$\\cos^{5}x=(1-\\sin^{2}x)^{2}\\cos x$', '$u=\\sin x:\\;\\int(1-u^{2})^{2}du$']
    },
    {
      id: 'h154', topic: '부분적분',
      integrand: 'x*ln(x)^2', latex: 'x \\left(\\ln x\\right)^{2}',
      answer: 'x^2*(ln(x)^2/2 - ln(x)/2 + 1/4)', answerLatex: 'x^{2} \\left(\\frac{\\left(\\ln x\\right)^{2}}{2} - \\frac{\\ln x}{2} + \\frac{1}{4}\\right)+C',
      domain: [0.35, 2.6],
      hints: ['$u=(\\ln x)^{2},\\;dv=x\\,dx$ 로 둔다.', '남는 적분이 $\\int x\\ln x\\,dx$ 다.'],
      steps: ['$\\dfrac{x^{2}(\\ln x)^{2}}{2}-\\int x\\ln x\\,dx$', '$\\int x\\ln x\\,dx=\\dfrac{x^{2}\\ln x}{2}-\\dfrac{x^{2}}{4}$']
    },
    {
      id: 'h155', topic: '부분적분',
      integrand: 'ln(x)/x^2', latex: '\\frac{\\ln x}{x^{2}}',
      answer: '-ln(x)/x - 1/x', answerLatex: '\\frac{-\\ln x}{x} - \\frac{1}{x}+C',
      domain: [0.4, 3],
      hints: ['$u=\\ln x,\\;dv=x^{-2}dx$ 로 둔다.', '$v=-\\dfrac{1}{1x^{1}}$'],
      steps: ['$u=\\ln x,\\;v=-\\dfrac{1}{1x^{1}}$', '$-\\dfrac{\\ln x}{1x^{1}}+1\\int x^{-2}dx$']
    },
    {
      id: 'h156', topic: '부분적분',
      integrand: 'ln(x)/x^3', latex: '\\frac{\\ln x}{x^{3}}',
      answer: '(-1/2)*ln(x)/x^2 - (1)/(4*x^2)', answerLatex: '\\frac{\\frac{-1}{2} \\ln x}{x^{2}} - \\frac{1}{4 x^{2}}+C',
      domain: [0.4, 3],
      hints: ['$u=\\ln x,\\;dv=x^{-3}dx$ 로 둔다.', '$v=-\\dfrac{1}{2x^{2}}$'],
      steps: ['$u=\\ln x,\\;v=-\\dfrac{1}{2x^{2}}$', '$-\\dfrac{\\ln x}{2x^{2}}+\\dfrac{1}{2}\\int x^{-3}dx$']
    },
    {
      id: 'h157', topic: '부분적분',
      integrand: 'ln(x)/x^4', latex: '\\frac{\\ln x}{x^{4}}',
      answer: '(-1/3)*ln(x)/x^3 - (1)/(9*x^3)', answerLatex: '\\frac{\\frac{-1}{3} \\ln x}{x^{3}} - \\frac{1}{9 x^{3}}+C',
      domain: [0.4, 3],
      hints: ['$u=\\ln x,\\;dv=x^{-4}dx$ 로 둔다.', '$v=-\\dfrac{1}{3x^{3}}$'],
      steps: ['$u=\\ln x,\\;v=-\\dfrac{1}{3x^{3}}$', '$-\\dfrac{\\ln x}{3x^{3}}+\\dfrac{1}{3}\\int x^{-4}dx$']
    },
    {
      id: 'h158', topic: '쌍곡선 짝수차',
      integrand: 'sech(x)^4', latex: '\\operatorname{sech}^{4} x',
      answer: 'tanh(x)-tanh(x)^3/3', answerLatex: '\\tanh x - \\frac{\\tanh^{3} x}{3}+C',
      domain: [0.25, 1.6],
      hints: ['$\\operatorname{sech}^{4}=(1-\\tanh^{2})\\operatorname{sech}^{2}$', '$u=\\tanh x$ 로 치환한다.'],
      steps: ['$\\operatorname{sech}^{4}x=(1-\\tanh^{2}x)\\operatorname{sech}^{2}x$', '$u=\\tanh x:\\;\\int(1-u^{2})du$']
    },
    {
      id: 'h159', topic: '쌍곡선 짝수차',
      integrand: 'tanh(x)^4', latex: '\\tanh^{4} x',
      answer: 'x-tanh(x)-tanh(x)^3/3', answerLatex: 'x - \\tanh x - \\frac{\\tanh^{3} x}{3}+C',
      domain: [0.25, 1.6],
      hints: ['$\\tanh^{4}=\\tanh^{2}(1-\\operatorname{sech}^{2})$ 로 내린다.', '$\\int\\tanh^{2}=x-\\tanh x$ 를 쓴다.'],
      steps: ['$\\int\\tanh^{4}=\\int\\tanh^{2}-\\int\\tanh^{2}\\operatorname{sech}^{2}$', '$=x-\\tanh x-\\dfrac{\\tanh^{3}x}{3}$']
    },
    {
      id: 'h160', topic: '역쌍곡선 고급',
      integrand: 'acosh(x)', latex: '\\operatorname{arcosh} x',
      answer: 'x*acosh(x)-sqrt(x^2-1)', answerLatex: 'x \\operatorname{arcosh} x - \\sqrt{x^{2} - 1}+C',
      domain: [1.3, 3.2],
      hints: ['$dv=dx$ 로 부분적분한다.', '$\\dfrac{d}{dx}\\operatorname{arcosh}x=\\dfrac{1}{\\sqrt{x^{2}-1}}$'],
      steps: ['$u=\\operatorname{arcosh}x,\\;dv=dx$', '$x\\operatorname{arcosh}x-\\int\\dfrac{x}{\\sqrt{x^{2}-1}}dx$']
    },
    {
      id: 'h161', topic: '부분적분',
      integrand: 'x*sec(x)^2', latex: 'x \\sec^{2} x',
      answer: 'x*tan(x)+ln(cos(x))', answerLatex: 'x \\tan x + \\ln\\left|\\cos x\\right|+C',
      domain: [0.25, 1.15],
      hints: ['$u=x,\\;dv=\\sec^{2}x\\,dx$ 로 둔다.', '남는 $\\int\\tan x\\,dx$ 를 처리한다.'],
      steps: ['$u=x,\\;v=\\tan x$', '$x\\tan x-\\int\\tan x\\,dx = x\\tan x+\\ln|\\cos x|$']
    }
  ];

  var MONSTER = [
    {
      id: 'x001', topic: '4차 유리식',
      integrand: '(x^2+1)/(x^4+1)', latex: '\\frac{x^{2} + 1}{x^{4} + 1}',
      answer: 'atan((x^2-1)/(sqrt(2)x))/sqrt(2)', answerLatex: '\\frac{\\arctan\\left(\\frac{x^{2} - 1}{\\sqrt{2} x}\\right)}{\\sqrt{2}}+C',
      domain: [0.25, 2.6],
      hints: ['분자·분모를 $x^{2}$ 로 나누면 $\\dfrac{1+1/x^{2}}{x^{2}+1/x^{2}}$ 가 된다.', '$u=x-\\dfrac{1}{x}$ 로 두면 $du=\\left(1+\\dfrac{1}{x^{2}}\\right)dx$ 이고 분모는 $u^{2}+2$ 다.'],
      steps: ['$\\dfrac{x^{2}+1}{x^{4}+1}=\\dfrac{1+x^{-2}}{x^{2}+x^{-2}}$', '$u=x-\\dfrac{1}{x},\\; x^{2}+x^{-2}=u^{2}+2$', '$\\int\\dfrac{du}{u^{2}+2}=\\dfrac{1}{\\sqrt2}\\arctan\\dfrac{u}{\\sqrt2}$']
    },
    {
      id: 'x002', topic: '4차 유리식',
      integrand: '(x^2-1)/(x^4+1)', latex: '\\frac{x^{2} - 1}{x^{4} + 1}',
      answer: 'ln((x^2-sqrt(2)x+1)/(x^2+sqrt(2)x+1))/(2sqrt(2))', answerLatex: '\\frac{\\ln\\left(\\frac{x^{2} - \\sqrt{2} x + 1}{x^{2} + \\sqrt{2} x + 1}\\right)}{2 \\sqrt{2}}+C',
      domain: [0.25, 2.6],
      hints: ['이번엔 $u=x+\\dfrac{1}{x}$ 로 두면 분모가 $u^{2}-2$ 가 된다.', '결과는 $\\arctan$ 이 아니라 로그다.'],
      steps: ['$\\dfrac{x^{2}-1}{x^{4}+1}=\\dfrac{1-x^{-2}}{x^{2}+x^{-2}}$', '$u=x+\\dfrac{1}{x},\\; x^{2}+x^{-2}=u^{2}-2$', '$\\int\\dfrac{du}{u^{2}-2}=\\dfrac{1}{2\\sqrt2}\\ln\\left|\\dfrac{u-\\sqrt2}{u+\\sqrt2}\\right|$']
    },
    {
      id: 'x003', topic: '4차 유리식',
      integrand: '1/(x^4+1)', latex: '\\frac{1}{x^{4} + 1}',
      answer: 'atan((x^2-1)/(sqrt(2)x))/(2sqrt(2)) - ln((x^2-sqrt(2)x+1)/(x^2+sqrt(2)x+1))/(4sqrt(2))', answerLatex: '\\frac{\\arctan\\left(\\frac{x^{2} - 1}{\\sqrt{2} x}\\right)}{2 \\sqrt{2}} - \\frac{\\ln\\left(\\frac{x^{2} - \\sqrt{2} x + 1}{x^{2} + \\sqrt{2} x + 1}\\right)}{4 \\sqrt{2}}+C',
      domain: [0.25, 2.6],
      hints: ['$1=\\dfrac{(x^{2}+1)-(x^{2}-1)}{2}$ 로 쪼개면 앞의 두 문제로 환원된다.', '$x^{4}+1=(x^{2}-\\sqrt2 x+1)(x^{2}+\\sqrt2 x+1)$ 인수분해를 써도 된다.'],
      steps: ['$\\dfrac{1}{x^{4}+1}=\\dfrac{1}{2}\\cdot\\dfrac{x^{2}+1}{x^{4}+1}-\\dfrac{1}{2}\\cdot\\dfrac{x^{2}-1}{x^{4}+1}$', '각각 $u=x\\mp\\dfrac{1}{x}$ 치환으로 계산한다', '$\\arctan$ 항과 로그 항이 함께 나온다']
    },
    {
      id: 'x004', topic: '4차 유리식',
      integrand: 'x^2/(x^4+1)', latex: '\\frac{x^{2}}{x^{4} + 1}',
      answer: 'atan((x^2-1)/(sqrt(2)x))/(2sqrt(2)) + ln((x^2-sqrt(2)x+1)/(x^2+sqrt(2)x+1))/(4sqrt(2))', answerLatex: '\\frac{\\arctan\\left(\\frac{x^{2} - 1}{\\sqrt{2} x}\\right)}{2 \\sqrt{2}} + \\frac{\\ln\\left(\\frac{x^{2} - \\sqrt{2} x + 1}{x^{2} + \\sqrt{2} x + 1}\\right)}{4 \\sqrt{2}}+C',
      domain: [0.25, 2.6],
      hints: ['$x^{2}=\\dfrac{(x^{2}+1)+(x^{2}-1)}{2}$ 로 쪼갠다.', '$\\dfrac{1}{x^{4}+1}$ 문제와 부호 하나만 다르다.'],
      steps: ['$\\dfrac{x^{2}}{x^{4}+1}=\\dfrac{1}{2}\\left(\\dfrac{x^{2}+1}{x^{4}+1}+\\dfrac{x^{2}-1}{x^{4}+1}\\right)$', '두 결과를 더한다']
    },
    {
      id: 'x005', topic: '4차 유리식',
      integrand: '1/(x^4-1)', latex: '\\frac{1}{x^{4} - 1}',
      answer: 'ln((x-1)/(x+1))/4 - atan(x)/2', answerLatex: '\\frac{\\ln\\left|\\frac{x - 1}{x + 1}\\right|}{4} - \\frac{\\arctan x}{2}+C',
      domain: [1.4, 3.4],
      hints: ['$x^{4}-1=(x^{2}-1)(x^{2}+1)$ 로 인수분해한다.', '$\\dfrac{1}{x^{4}-1}=\\dfrac{1}{2}\\left(\\dfrac{1}{x^{2}-1}-\\dfrac{1}{x^{2}+1}\\right)$'],
      steps: ['$\\dfrac{1}{x^{4}-1}=\\dfrac{1}{2}\\left(\\dfrac{1}{x^{2}-1}-\\dfrac{1}{x^{2}+1}\\right)$', '$\\int\\dfrac{dx}{x^{2}-1}=\\dfrac{1}{2}\\ln\\left|\\dfrac{x-1}{x+1}\\right|$']
    },
    {
      id: 'x006', topic: '삼각함수 고차',
      integrand: 'sec(x)^5', latex: '\\sec^{5} x',
      answer: 'sec(x)^3*tan(x)/4 + 3*sec(x)tan(x)/8 + 3*ln(sec(x)+tan(x))/8', answerLatex: '\\frac{\\sec^{3} x \\tan x}{4} + \\frac{3 \\sec x \\tan x}{8} + \\frac{3 \\ln\\left|\\sec x + \\tan x\\right|}{8}+C',
      domain: [0.25, 1.15],
      hints: ['점화식 $\\int\\sec^{n}=\\dfrac{\\sec^{n-2}\\tan}{n-1}+\\dfrac{n-2}{n-1}\\int\\sec^{n-2}$ 를 쓴다.', '$\\int\\sec^{3}$ 를 거쳐 $\\int\\sec$ 까지 내려간다.'],
      steps: ['$\\int\\sec^{5}=\\dfrac{\\sec^{3}\\tan}{4}+\\dfrac{3}{4}\\int\\sec^{3}$', '$\\int\\sec^{3}=\\dfrac{\\sec\\tan+\\ln|\\sec+\\tan|}{2}$', '두 결과를 합친다']
    },
    {
      id: 'x007', topic: '삼각함수 고차',
      integrand: 'tan(x)^5', latex: '\\tan^{5} x',
      answer: 'tan(x)^4/4 - tan(x)^2/2 - ln(cos(x))', answerLatex: '\\frac{\\tan^{4} x}{4} - \\frac{\\tan^{2} x}{2} - \\ln\\left|\\cos x\\right|+C',
      domain: [0.25, 1.15],
      hints: ['$\\tan^{5}=\\tan^{3}(\\sec^{2}-1)$ 로 두 단계 내린다.', '마지막에 $\\int\\tan x\\,dx$ 가 남는다.'],
      steps: ['$\\int\\tan^{5}=\\dfrac{\\tan^{4}}{4}-\\int\\tan^{3}$', '$\\int\\tan^{3}=\\dfrac{\\tan^{2}}{2}+\\ln|\\cos x|$']
    },
    {
      id: 'x008', topic: '삼각함수 짝수차',
      integrand: 'sin(x)^4', latex: '\\sin^{4} x',
      answer: '3x/8 - sin(2x)/4 + sin(4x)/32', answerLatex: '\\frac{3 x}{8} - \\frac{\\sin\\left(2 x\\right)}{4} + \\frac{\\sin\\left(4 x\\right)}{32}+C',
      domain: [0.25, 2.85],
      hints: ['반각공식을 두 번 적용한다.', '$\\sin^{4}=\\left(\\dfrac{1-\\cos 2x}{2}\\right)^{2}$ 에서 $\\cos^{2}2x$ 를 또 내린다.'],
      steps: ['$\\sin^{4}x=\\dfrac{1-2\\cos 2x+\\cos^{2}2x}{4}$', '$\\cos^{2}2x=\\dfrac{1+\\cos 4x}{2}$', '$=\\dfrac{3}{8}-\\dfrac{\\cos 2x}{2}+\\dfrac{\\cos 4x}{8}$']
    },
    {
      id: 'x009', topic: '삼각함수 짝수차',
      integrand: 'cos(x)^4', latex: '\\cos^{4} x',
      answer: '3x/8 + sin(2x)/4 + sin(4x)/32', answerLatex: '\\frac{3 x}{8} + \\frac{\\sin\\left(2 x\\right)}{4} + \\frac{\\sin\\left(4 x\\right)}{32}+C',
      domain: [0.25, 2.85],
      hints: ['$\\cos^{4}=\\left(\\dfrac{1+\\cos 2x}{2}\\right)^{2}$ 로 시작한다.', '$\\sin^{4}$ 와 가운데 항의 부호만 다르다.'],
      steps: ['$\\cos^{4}x=\\dfrac{1+2\\cos 2x+\\cos^{2}2x}{4}$', '$=\\dfrac{3}{8}+\\dfrac{\\cos 2x}{2}+\\dfrac{\\cos 4x}{8}$']
    },
    {
      id: 'x010', topic: '삼각 유리식',
      integrand: '1/(sin(x)^4+cos(x)^4)', latex: '\\frac{1}{\\sin^{4} x + \\cos^{4} x}',
      answer: 'atan((tan(x)-cot(x))/sqrt(2))/sqrt(2)', answerLatex: '\\frac{\\arctan\\left(\\frac{\\tan x - \\cot x}{\\sqrt{2}}\\right)}{\\sqrt{2}}+C',
      domain: [0.25, 1.3],
      hints: ['분자·분모를 $\\cos^{4}x$ 로 나눠 $\\tan$ 만 남긴다.', '$t=\\tan x-\\cot x$ 로 두면 분모가 $t^{2}+2$ 가 된다.'],
      steps: ['$\\sin^{4}+\\cos^{4}=1-\\dfrac{\\sin^{2}2x}{2}$', '$\\tan$ 로 정리한 뒤 $t=\\tan x-\\cot x$ 치환', '$\\int\\dfrac{dt}{t^{2}+2}$']
    },
    {
      id: 'x011', topic: '삼각 유리식',
      integrand: 'sqrt(tan(x))', latex: '\\sqrt{\\tan x}',
      answer: '(atan((tan(x)-1)/sqrt(2tan(x))) + ln((tan(x)-sqrt(2tan(x))+1)/(tan(x)+sqrt(2tan(x))+1))/2)/sqrt(2)', answerLatex: '\\frac{\\arctan\\left(\\frac{\\tan x - 1}{\\sqrt{2 \\tan x}}\\right) + \\frac{\\ln\\left(\\frac{\\tan x - \\sqrt{2 \\tan x} + 1}{\\tan x + \\sqrt{2 \\tan x} + 1}\\right)}{2}}{\\sqrt{2}}+C',
      domain: [0.25, 1.2],
      hints: ['$t=\\sqrt{\\tan x}$ 로 두면 $dx=\\dfrac{2t\\,dt}{1+t^{4}}$ 가 된다.', '결국 $\\int\\dfrac{2t^{2}}{1+t^{4}}dt$ 로, $x^{4}+1$ 유리식 문제가 된다.'],
      steps: ['$t=\\sqrt{\\tan x},\\;x=\\arctan t^{2}$', '$\\int\\dfrac{2t^{2}}{1+t^{4}}dt$', '$u=t\\mp\\dfrac{1}{t}$ 치환으로 $\\arctan$ 항과 로그 항이 나온다']
    },
    {
      id: 'x012', topic: '삼각 유리식',
      integrand: 'sin(x)/(sin(x)+cos(x))', latex: '\\frac{\\sin x}{\\sin x + \\cos x}',
      answer: 'x/2 - ln(sin(x)+cos(x))/2', answerLatex: '\\frac{x}{2} - \\frac{\\ln\\left|\\sin x + \\cos x\\right|}{2}+C',
      domain: [0.2, 1.2],
      hints: ['$\\sin x=\\dfrac{(\\sin+\\cos)-(\\cos-\\sin)}{2}$ 로 쪼갠다.', '$\\cos x-\\sin x$ 는 분모의 도함수다.'],
      steps: ['$\\dfrac{\\sin}{\\sin+\\cos}=\\dfrac{1}{2}-\\dfrac{1}{2}\\cdot\\dfrac{\\cos-\\sin}{\\sin+\\cos}$', '$\\int\\dfrac{\\cos-\\sin}{\\sin+\\cos}dx=\\ln|\\sin x+\\cos x|$']
    },
    {
      id: 'x013', topic: '바이어슈트라스 치환',
      integrand: '1/(2+cos(x))', latex: '\\frac{1}{2 + \\cos x}',
      answer: '2*atan(sqrt(1/3)*tan(x/2))/sqrt(3)', answerLatex: '\\frac{2 \\arctan\\left(\\sqrt{\\frac{1}{3}} \\tan\\left(\\frac{x}{2}\\right)\\right)}{\\sqrt{3}}+C',
      domain: [0.2, 2.4],
      hints: ['$t=\\tan\\dfrac{x}{2}$ 로 두면 $\\cos x=\\dfrac{1-t^{2}}{1+t^{2}},\\;dx=\\dfrac{2dt}{1+t^{2}}$ 다.', '정리하면 $\\int\\dfrac{2\\,dt}{3+1t^{2}}$ 가 된다.'],
      steps: ['$t=\\tan\\dfrac{x}{2}$', '$\\int\\dfrac{2\\,dt}{(2+1)+(2-1)t^{2}}$', '$= \\dfrac{2}{\\sqrt{3}}\\arctan\\left(\\sqrt{\\dfrac{1}{3}}\\,t\\right)$']
    },
    {
      id: 'x014', topic: '바이어슈트라스 치환',
      integrand: '1/(3+2cos(x))', latex: '\\frac{1}{3 + 2 \\cos x}',
      answer: '2*atan(sqrt(1/5)*tan(x/2))/sqrt(5)', answerLatex: '\\frac{2 \\arctan\\left(\\sqrt{\\frac{1}{5}} \\tan\\left(\\frac{x}{2}\\right)\\right)}{\\sqrt{5}}+C',
      domain: [0.2, 2.4],
      hints: ['$t=\\tan\\dfrac{x}{2}$ 로 두면 $\\cos x=\\dfrac{1-t^{2}}{1+t^{2}},\\;dx=\\dfrac{2dt}{1+t^{2}}$ 다.', '정리하면 $\\int\\dfrac{2\\,dt}{5+1t^{2}}$ 가 된다.'],
      steps: ['$t=\\tan\\dfrac{x}{2}$', '$\\int\\dfrac{2\\,dt}{(3+2)+(3-2)t^{2}}$', '$= \\dfrac{2}{\\sqrt{5}}\\arctan\\left(\\sqrt{\\dfrac{1}{5}}\\,t\\right)$']
    },
    {
      id: 'x015', topic: '바이어슈트라스 치환',
      integrand: '1/(5+3cos(x))', latex: '\\frac{1}{5 + 3 \\cos x}',
      answer: '2*atan((1/2)*tan(x/2))/4', answerLatex: '\\frac{2 \\arctan\\left(\\frac{1}{2} \\tan\\left(\\frac{x}{2}\\right)\\right)}{4}+C',
      domain: [0.2, 2.4],
      hints: ['$t=\\tan\\dfrac{x}{2}$ 로 두면 $\\cos x=\\dfrac{1-t^{2}}{1+t^{2}},\\;dx=\\dfrac{2dt}{1+t^{2}}$ 다.', '정리하면 $\\int\\dfrac{2\\,dt}{8+2t^{2}}$ 가 된다.'],
      steps: ['$t=\\tan\\dfrac{x}{2}$', '$\\int\\dfrac{2\\,dt}{(5+3)+(5-3)t^{2}}$', '$= \\dfrac{2}{\\sqrt{16}}\\arctan\\left(\\sqrt{\\dfrac{2}{8}}\\,t\\right)$']
    },
    {
      id: 'x016', topic: '바이어슈트라스 치환',
      integrand: '1/(5+4cos(x))', latex: '\\frac{1}{5 + 4 \\cos x}',
      answer: '2*atan((1/3)*tan(x/2))/3', answerLatex: '\\frac{2 \\arctan\\left(\\frac{1}{3} \\tan\\left(\\frac{x}{2}\\right)\\right)}{3}+C',
      domain: [0.2, 2.4],
      hints: ['$t=\\tan\\dfrac{x}{2}$ 로 두면 $\\cos x=\\dfrac{1-t^{2}}{1+t^{2}},\\;dx=\\dfrac{2dt}{1+t^{2}}$ 다.', '정리하면 $\\int\\dfrac{2\\,dt}{9+1t^{2}}$ 가 된다.'],
      steps: ['$t=\\tan\\dfrac{x}{2}$', '$\\int\\dfrac{2\\,dt}{(5+4)+(5-4)t^{2}}$', '$= \\dfrac{2}{\\sqrt{9}}\\arctan\\left(\\sqrt{\\dfrac{1}{9}}\\,t\\right)$']
    },
    {
      id: 'x017', topic: '반복 부분적분',
      integrand: 'x^3*e^x', latex: 'x^{3} e^{x}',
      answer: '(x^3-3x^2+6x-6)*e^x', answerLatex: '\\left(x^{3} - 3 x^{2} + 6 x - 6\\right) e^{x}+C',
      domain: [-1.5, 1.7],
      hints: ['부분적분을 세 번 한다.', '계수가 $3!,\\;3\\cdot 2,\\;\\ldots$ 로 떨어지는 규칙을 본다.'],
      steps: ['$\\int x^{3}e^{x}=x^{3}e^{x}-3\\int x^{2}e^{x}$', '$\\int x^{2}e^{x}=(x^{2}-2x+2)e^{x}$', '$=(x^{3}-3x^{2}+6x-6)e^{x}$']
    },
    {
      id: 'x018', topic: '반복 부분적분',
      integrand: 'x^4*e^x', latex: 'x^{4} e^{x}',
      answer: '(x^4-4x^3+12x^2-24x+24)*e^x', answerLatex: '\\left(x^{4} - 4 x^{3} + 12 x^{2} - 24 x + 24\\right) e^{x}+C',
      domain: [-1.5, 1.7],
      hints: ['부분적분을 네 번 한다.', '표(tabular) 방식으로 정리하면 실수가 줄어든다.'],
      steps: ['$\\int x^{4}e^{x}=x^{4}e^{x}-4\\int x^{3}e^{x}$', '$\\int x^{3}e^{x}=(x^{3}-3x^{2}+6x-6)e^{x}$', '$=(x^{4}-4x^{3}+12x^{2}-24x+24)e^{x}$']
    },
    {
      id: 'x019', topic: '반복 부분적분',
      integrand: 'x^3*sin(x)', latex: 'x^{3} \\sin x',
      answer: '-x^3*cos(x)+3x^2*sin(x)+6x*cos(x)-6sin(x)', answerLatex: '-x^{3} \\cos x + 3 x^{2} \\sin x + 6 x \\cos x - 6 \\sin x+C',
      domain: [0.25, 2.85],
      hints: ['부분적분을 세 번 한다.', '$\\cos\\to\\sin\\to\\cos$ 순환과 부호를 함께 관리한다.'],
      steps: ['$u=x^{3},\\;dv=\\sin x\\,dx$', '$-x^{3}\\cos x+3\\int x^{2}\\cos x\\,dx$', '$=-x^{3}\\cos x+3x^{2}\\sin x+6x\\cos x-6\\sin x$']
    },
    {
      id: 'x020', topic: '반복 부분적분',
      integrand: 'x^3*cos(x)', latex: 'x^{3} \\cos x',
      answer: 'x^3*sin(x)+3x^2*cos(x)-6x*sin(x)-6cos(x)', answerLatex: 'x^{3} \\sin x + 3 x^{2} \\cos x - 6 x \\sin x - 6 \\cos x+C',
      domain: [0.25, 2.85],
      hints: ['$u=x^{3},\\;dv=\\cos x\\,dx$ 로 시작한다.', '$\\sin$ 문제와 부호 배치가 다르다.'],
      steps: ['$x^{3}\\sin x-3\\int x^{2}\\sin x\\,dx$', '$=x^{3}\\sin x+3x^{2}\\cos x-6x\\sin x-6\\cos x$']
    },
    {
      id: 'x021', topic: '반복 부분적분',
      integrand: 'ln(x)^3', latex: '\\left(\\ln x\\right)^{3}',
      answer: 'x*(ln(x)^3-3ln(x)^2+6ln(x)-6)', answerLatex: 'x \\left(\\left(\\ln x\\right)^{3} - 3 \\left(\\ln x\\right)^{2} + 6 \\ln x - 6\\right)+C',
      domain: [0.35, 2.6],
      hints: ['$dv=dx$ 로 두고 세 번 부분적분한다.', '$\\int(\\ln x)^{2}dx$ 결과가 중간에 필요하다.'],
      steps: ['$x(\\ln x)^{3}-3\\int(\\ln x)^{2}dx$', '$\\int(\\ln x)^{2}=x(\\ln x)^{2}-2x\\ln x+2x$']
    },
    {
      id: 'x022', topic: '반복 부분적분',
      integrand: 'ln(x)^4', latex: '\\left(\\ln x\\right)^{4}',
      answer: 'x*(ln(x)^4-4ln(x)^3+12ln(x)^2-24ln(x)+24)', answerLatex: 'x \\left(\\left(\\ln x\\right)^{4} - 4 \\left(\\ln x\\right)^{3} + 12 \\left(\\ln x\\right)^{2} - 24 \\ln x + 24\\right)+C',
      domain: [0.35, 2.6],
      hints: ['$t=\\ln x$ 로 치환하면 $\\int t^{4}e^{t}dt$ 가 된다.', '$x^{4}e^{x}$ 문제와 같은 계수가 나온다.'],
      steps: ['$t=\\ln x,\\;dx=e^{t}dt$', '$\\int t^{4}e^{t}dt=(t^{4}-4t^{3}+12t^{2}-24t+24)e^{t}$']
    },
    {
      id: 'x023', topic: '부분적분',
      integrand: 'x^2*ln(x)^2', latex: 'x^{2} \\left(\\ln x\\right)^{2}',
      answer: 'x^3*(ln(x)^2/3 - 2ln(x)/9 + 2/27)', answerLatex: 'x^{3} \\left(\\frac{\\left(\\ln x\\right)^{2}}{3} - \\frac{2 \\ln x}{9} + \\frac{2}{27}\\right)+C',
      domain: [0.35, 2.6],
      hints: ['$u=(\\ln x)^{2},\\;dv=x^{2}dx$ 로 둔다.', '두 번 부분적분해야 로그가 사라진다.'],
      steps: ['$\\dfrac{x^{3}(\\ln x)^{2}}{3}-\\dfrac{2}{3}\\int x^{2}\\ln x\\,dx$', '$\\int x^{2}\\ln x\\,dx=\\dfrac{x^{3}\\ln x}{3}-\\dfrac{x^{3}}{9}$']
    },
    {
      id: 'x024', topic: '삼중 부분적분',
      integrand: 'x*e^x*sin(x)', latex: 'x e^{x} \\sin x',
      answer: 'e^x*(x*(sin(x)-cos(x))+cos(x))/2', answerLatex: '\\frac{e^{x} \\left(x \\left(\\sin x - \\cos x\\right) + \\cos x\\right)}{2}+C',
      domain: [0.05, 1.8],
      hints: ['$u=x,\\;dv=e^{x}\\sin x\\,dx$ 로 두면 $v$ 자체가 순환 부분적분이다.', '$\\int e^{x}\\sin x\\,dx=\\dfrac{e^{x}(\\sin x-\\cos x)}{2}$ 를 먼저 구한다.'],
      steps: ['$v=\\dfrac{e^{x}(\\sin x-\\cos x)}{2}$', '$xv-\\int v\\,dx$', '$=\\dfrac{e^{x}\\left(x(\\sin x-\\cos x)+\\cos x\\right)}{2}$']
    },
    {
      id: 'x025', topic: '삼중 부분적분',
      integrand: 'x*e^x*cos(x)', latex: 'x e^{x} \\cos x',
      answer: 'e^x*(x*(sin(x)+cos(x))-sin(x))/2', answerLatex: '\\frac{e^{x} \\left(x \\left(\\sin x + \\cos x\\right) - \\sin x\\right)}{2}+C',
      domain: [0.05, 1.8],
      hints: ['$v=\\int e^{x}\\cos x\\,dx=\\dfrac{e^{x}(\\sin x+\\cos x)}{2}$ 를 먼저 구한다.', '그다음 $u=x$ 로 부분적분한다.'],
      steps: ['$v=\\dfrac{e^{x}(\\sin x+\\cos x)}{2}$', '$xv-\\int v\\,dx$']
    },
    {
      id: 'x026', topic: '곱-합 + 순환',
      integrand: 'e^(x)sin(x)cos(x)', latex: 'e^{x} \\sin x \\cos x',
      answer: 'e^(x)*(sin(2x) - 2cos(2x))/10', answerLatex: '\\frac{e^{x} \\left(\\sin\\left(2 x\\right) - 2 \\cos\\left(2 x\\right)\\right)}{10}+C',
      domain: [0.05, 1.5],
      hints: ['먼저 $\\sin x\\cos x = \\dfrac{\\sin 2x}{2}$ 로 합친다.', '그다음은 표준 순환 부분적분이다.'],
      steps: ['$\\sin x\\cos x = \\dfrac{\\sin 2x}{2}$', '$\\dfrac{1}{2}\\int e^{x}\\sin 2x\\,dx$', '$= \\frac{e^{x} \\left(\\sin\\left(2 x\\right) - 2 \\cos\\left(2 x\\right)\\right)}{10}$']
    },
    {
      id: 'x027', topic: '곱-합 + 순환',
      integrand: 'e^(2x)sin(x)cos(x)', latex: 'e^{2 x} \\sin x \\cos x',
      answer: 'e^(2x)*(2sin(2x) - 2cos(2x))/16', answerLatex: '\\frac{e^{2 x} \\left(2 \\sin\\left(2 x\\right) - 2 \\cos\\left(2 x\\right)\\right)}{16}+C',
      domain: [0.05, 1.5],
      hints: ['먼저 $\\sin x\\cos x = \\dfrac{\\sin 2x}{2}$ 로 합친다.', '그다음은 표준 순환 부분적분이다.'],
      steps: ['$\\sin x\\cos x = \\dfrac{\\sin 2x}{2}$', '$\\dfrac{1}{2}\\int e^{2x}\\sin 2x\\,dx$', '$= \\frac{e^{2 x} \\left(2 \\sin\\left(2 x\\right) - 2 \\cos\\left(2 x\\right)\\right)}{16}$']
    },
    {
      id: 'x028', topic: '역삼각 고급',
      integrand: 'asin(x)^2', latex: '\\left(\\arcsin x\\right)^{2}',
      answer: 'x*asin(x)^2+2*sqrt(1-x^2)*asin(x)-2x', answerLatex: 'x \\left(\\arcsin x\\right)^{2} + 2 \\sqrt{1 - x^{2}} \\arcsin x - 2 x+C',
      domain: [-0.72, 0.72],
      hints: ['$dv=dx$ 로 부분적분하면 $\\int\\dfrac{x\\arcsin x}{\\sqrt{1-x^{2}}}dx$ 가 남는다.', '그 적분을 다시 부분적분한다.'],
      steps: ['$x(\\arcsin x)^{2}-2\\int\\dfrac{x\\arcsin x}{\\sqrt{1-x^{2}}}dx$', '$\\int\\dfrac{x\\arcsin x}{\\sqrt{1-x^{2}}}dx=-\\sqrt{1-x^{2}}\\arcsin x+x$']
    },
    {
      id: 'x029', topic: '역삼각 고급',
      integrand: 'x^2*atan(x)', latex: 'x^{2} \\arctan x',
      answer: 'x^3*atan(x)/3 - x^2/6 + ln(1+x^2)/6', answerLatex: '\\frac{x^{3} \\arctan x}{3} - \\frac{x^{2}}{6} + \\frac{\\ln\\left(1 + x^{2}\\right)}{6}+C',
      domain: [0.1, 2.5],
      hints: ['$u=\\arctan x,\\;dv=x^{2}dx$ 로 둔다.', '남는 $\\int\\dfrac{x^{3}}{1+x^{2}}dx$ 는 나눗셈으로 정리한다.'],
      steps: ['$\\dfrac{x^{3}\\arctan x}{3}-\\dfrac{1}{3}\\int\\dfrac{x^{3}}{1+x^{2}}dx$', '$\\dfrac{x^{3}}{1+x^{2}}=x-\\dfrac{x}{1+x^{2}}$']
    },
    {
      id: 'x030', topic: '역삼각 고급',
      integrand: 'atan(sqrt(x))', latex: '\\arctan\\left(\\sqrt{x}\\right)',
      answer: '(x+1)*atan(sqrt(x))-sqrt(x)', answerLatex: '\\left(x + 1\\right) \\arctan\\left(\\sqrt{x}\\right) - \\sqrt{x}+C',
      domain: [0.2, 3],
      hints: ['$t=\\sqrt{x}$ 로 치환한 뒤 부분적분한다.', '$v=x+1$ 처럼 적분상수를 잘 고르면 깔끔해진다.'],
      steps: ['$u=\\arctan\\sqrt{x},\\;v=x+1$', '$(x+1)\\arctan\\sqrt{x}-\\int\\dfrac{x+1}{2\\sqrt{x}(1+x)}dx$']
    },
    {
      id: 'x031', topic: '유리식 부분적분',
      integrand: '1/(x^2+1)^2', latex: '\\frac{1}{\\left(x^{2} + 1\\right)^{2}}',
      answer: 'x/(2*(x^2+1))+atan(x)/2', answerLatex: '\\frac{x}{2 \\left(x^{2} + 1\\right)} + \\frac{\\arctan x}{2}+C',
      domain: [-1.5, 2.2],
      hints: ['$x=\\tan\\theta$ 로 치환하면 $\\int\\cos^{2}\\theta\\,d\\theta$ 가 된다.', '점화식으로 풀어도 된다.'],
      steps: ['$x=\\tan\\theta,\\;dx=\\sec^{2}\\theta\\,d\\theta$', '$\\int\\cos^{2}\\theta\\,d\\theta=\\dfrac{\\theta}{2}+\\dfrac{\\sin 2\\theta}{4}$']
    },
    {
      id: 'x032', topic: '유리식 부분적분',
      integrand: 'x^2/(x^2+1)^2', latex: '\\frac{x^{2}}{\\left(x^{2} + 1\\right)^{2}}',
      answer: 'atan(x)/2 - x/(2*(x^2+1))', answerLatex: '\\frac{\\arctan x}{2} - \\frac{x}{2 \\left(x^{2} + 1\\right)}+C',
      domain: [-1.5, 2.2],
      hints: ['$\\dfrac{x^{2}}{(x^{2}+1)^{2}}=\\dfrac{1}{x^{2}+1}-\\dfrac{1}{(x^{2}+1)^{2}}$', '앞 문제 결과를 재활용한다.'],
      steps: ['$\\dfrac{x^{2}}{(x^{2}+1)^{2}}=\\dfrac{1}{x^{2}+1}-\\dfrac{1}{(x^{2}+1)^{2}}$', '$\\arctan x-\\left(\\dfrac{x}{2(x^{2}+1)}+\\dfrac{\\arctan x}{2}\\right)$']
    },
    {
      id: 'x033', topic: '치환+부분분수',
      integrand: 'x^3/(x^2+1)^2', latex: '\\frac{x^{3}}{\\left(x^{2} + 1\\right)^{2}}',
      answer: 'ln(x^2+1)/2 + 1/(2*(x^2+1))', answerLatex: '\\frac{\\ln\\left(x^{2} + 1\\right)}{2} + \\frac{1}{2 \\left(x^{2} + 1\\right)}+C',
      domain: [0.1, 2.5],
      hints: ['$u=x^{2}+1$ 로 두면 $x^{2}=u-1$ 다.', '$\\dfrac{1}{2}\\int\\dfrac{u-1}{u^{2}}du$ 로 정리된다.'],
      steps: ['$u=x^{2}+1,\\;du=2x\\,dx$', '$\\dfrac{1}{2}\\int\\left(\\dfrac{1}{u}-\\dfrac{1}{u^{2}}\\right)du$']
    },
    {
      id: 'x034', topic: '치환+부분분수',
      integrand: 'x^3/(x^2+2)^2', latex: '\\frac{x^{3}}{\\left(x^{2} + 2\\right)^{2}}',
      answer: 'ln(x^2+2)/2 + 2/(2*(x^2+2))', answerLatex: '\\frac{\\ln\\left(x^{2} + 2\\right)}{2} + \\frac{2}{2 \\left(x^{2} + 2\\right)}+C',
      domain: [0.1, 2.5],
      hints: ['$u=x^{2}+2$ 로 두면 $x^{2}=u-2$ 다.', '$\\dfrac{1}{2}\\int\\dfrac{u-2}{u^{2}}du$ 로 정리된다.'],
      steps: ['$u=x^{2}+2,\\;du=2x\\,dx$', '$\\dfrac{1}{2}\\int\\left(\\dfrac{1}{u}-\\dfrac{2}{u^{2}}\\right)du$']
    },
    {
      id: 'x035', topic: '치환+부분분수',
      integrand: 'x^3/(x^2+4)^2', latex: '\\frac{x^{3}}{\\left(x^{2} + 4\\right)^{2}}',
      answer: 'ln(x^2+4)/2 + 4/(2*(x^2+4))', answerLatex: '\\frac{\\ln\\left(x^{2} + 4\\right)}{2} + \\frac{4}{2 \\left(x^{2} + 4\\right)}+C',
      domain: [0.1, 2.5],
      hints: ['$u=x^{2}+4$ 로 두면 $x^{2}=u-4$ 다.', '$\\dfrac{1}{2}\\int\\dfrac{u-4}{u^{2}}du$ 로 정리된다.'],
      steps: ['$u=x^{2}+4,\\;du=2x\\,dx$', '$\\dfrac{1}{2}\\int\\left(\\dfrac{1}{u}-\\dfrac{4}{u^{2}}\\right)du$']
    },
    {
      id: 'x036', topic: '기교',
      integrand: 'e^x*(x^2+1)/(x+1)^2', latex: '\\frac{e^{x} \\left(x^{2} + 1\\right)}{\\left(x + 1\\right)^{2}}',
      answer: 'e^x*(x-1)/(x+1)', answerLatex: '\\frac{e^{x} \\left(x - 1\\right)}{x + 1}+C',
      domain: [0.1, 2.2],
      hints: ['$\\dfrac{x^{2}+1}{(x+1)^{2}}=f(x)+f\'(x)$ 꼴로 쪼갤 수 있는지 본다.', '$\\int e^{x}(f+f\')dx=e^{x}f$ 를 쓴다.'],
      steps: ['$\\dfrac{x^{2}+1}{(x+1)^{2}}=\\dfrac{x-1}{x+1}+\\dfrac{2}{(x+1)^{2}}$', '$f=\\dfrac{x-1}{x+1},\\;f\'=\\dfrac{2}{(x+1)^{2}}$', '$\\int e^{x}(f+f\')dx=e^{x}f$']
    },
    {
      id: 'x037', topic: '삼각치환 고급',
      integrand: 'x^2*sqrt(1-x^2)', latex: 'x^{2} \\sqrt{1 - x^{2}}',
      answer: '(1/8)*asin(x) - x*(1-2x^2)*sqrt(1-x^2)/8', answerLatex: '\\frac{1}{8} \\arcsin x - \\frac{x \\left(1 - 2 x^{2}\\right) \\sqrt{1 - x^{2}}}{8}+C',
      domain: [-0.72, 0.72],
      hints: ['$x=\\sin\\theta$ 로 치환하면 $\\int\\sin^{2}\\theta\\cos^{2}\\theta\\,d\\theta$ 가 된다.', '$\\sin^{2}\\theta\\cos^{2}\\theta=\\dfrac{\\sin^{2}2\\theta}{4}$ 로 차수를 내린다.'],
      steps: ['$x=\\sin\\theta$', '$1\\int\\dfrac{\\sin^{2}2\\theta}{4}d\\theta$', '반각공식을 한 번 더 적용한 뒤 $x$ 로 되돌린다']
    },
    {
      id: 'x038', topic: '삼각치환 고급',
      integrand: 'x^2*sqrt(4-x^2)', latex: 'x^{2} \\sqrt{4 - x^{2}}',
      answer: '2*asin(x/2) - x*(4-2x^2)*sqrt(4-x^2)/8', answerLatex: '2 \\arcsin\\left(\\frac{x}{2}\\right) - \\frac{x \\left(4 - 2 x^{2}\\right) \\sqrt{4 - x^{2}}}{8}+C',
      domain: [-1.44, 1.44],
      hints: ['$x=2\\sin\\theta$ 로 치환하면 $\\int\\sin^{2}\\theta\\cos^{2}\\theta\\,d\\theta$ 가 된다.', '$\\sin^{2}\\theta\\cos^{2}\\theta=\\dfrac{\\sin^{2}2\\theta}{4}$ 로 차수를 내린다.'],
      steps: ['$x=2\\sin\\theta$', '$16\\int\\dfrac{\\sin^{2}2\\theta}{4}d\\theta$', '반각공식을 한 번 더 적용한 뒤 $x$ 로 되돌린다']
    },
    {
      id: 'x039', topic: '역쌍곡선 고급',
      integrand: 'x*asinh(x)', latex: 'x \\operatorname{arsinh} x',
      answer: '(2x^2+1)*asinh(x)/4 - x*sqrt(x^2+1)/4', answerLatex: '\\frac{\\left(2 x^{2} + 1\\right) \\operatorname{arsinh} x}{4} - \\frac{x \\sqrt{x^{2} + 1}}{4}+C',
      domain: [0.1, 2.2],
      hints: ['$u=\\operatorname{arsinh}x,\\;dv=x\\,dx$ 로 둔다.', '$v=\\dfrac{x^{2}}{2}$ 대신 $\\dfrac{x^{2}+1}{2}$ 를 쓰면 남는 적분이 간단해진다.'],
      steps: ['$u=\\operatorname{arsinh}x,\\;v=\\dfrac{2x^{2}+1}{4}$ 로 잡는다', '남는 적분 $\\int\\dfrac{x^{2}}{\\sqrt{x^{2}+1}}dx$ 를 정리한다']
    },
    {
      id: 'x040', topic: '쌍곡선 고급',
      integrand: 'x^2*sqrt(x^2+1)', latex: 'x^{2} \\sqrt{x^{2} + 1}',
      answer: 'x*(x^2+1)^(3/2)/4 - x*sqrt(x^2+1)/8 - asinh(x)/8', answerLatex: '\\frac{x \\left(x^{2} + 1\\right)^{\\frac{3}{2}}}{4} - \\frac{x \\sqrt{x^{2} + 1}}{8} - \\frac{\\operatorname{arsinh} x}{8}+C',
      domain: [-1.3, 2],
      hints: ['$x=\\sinh\\theta$ 로 치환하면 $\\int\\sinh^{2}\\theta\\cosh^{2}\\theta\\,d\\theta$ 가 된다.', '$\\sinh^{2}\\cosh^{2}=\\dfrac{\\sinh^{2}2\\theta}{4}$ 로 내린다.'],
      steps: ['$x=\\sinh\\theta$', '$\\dfrac{1}{4}\\int\\sinh^{2}2\\theta\\,d\\theta$', '$\\sinh^{2}u=\\dfrac{\\cosh 2u-1}{2}$ 를 한 번 더 적용한다']
    },
    {
      id: 'x041', topic: '쌍곡선 고급',
      integrand: 'sqrt(x^2+1)^3', latex: '\\sqrt{x^{2} + 1}^{3}',
      answer: 'x*(x^2+1)^(3/2)/4 + 3*x*sqrt(x^2+1)/8 + 3*asinh(x)/8', answerLatex: '\\frac{x \\left(x^{2} + 1\\right)^{\\frac{3}{2}}}{4} + \\frac{3 x \\sqrt{x^{2} + 1}}{8} + \\frac{3 \\operatorname{arsinh} x}{8}+C',
      domain: [-1.3, 2],
      hints: ['$(x^{2}+1)^{3/2}$ 이므로 $x=\\sinh\\theta$ 로 두면 $\\int\\cosh^{4}\\theta\\,d\\theta$ 다.', '$\\cosh^{4}$ 는 반각공식을 두 번 쓴다.'],
      steps: ['$x=\\sinh\\theta$', '$\\int\\cosh^{4}\\theta\\,d\\theta$', '$\\cosh^{2}u=\\dfrac{\\cosh 2u+1}{2}$ 를 두 번 적용']
    },
    {
      id: 'x042', topic: '쌍곡선 순환',
      integrand: 'e^(2x)cosh(x)', latex: 'e^{2 x} \\cosh x',
      answer: 'e^(2x)*(2cosh(x) - sinh(x))/3', answerLatex: '\\frac{e^{2 x} \\left(2 \\cosh x - \\sinh x\\right)}{3}+C',
      domain: [0.05, 1.3],
      hints: ['$\\cosh$ 를 지수로 풀어 항별로 적분한다.', '분모는 $4-1=3$ 이다.'],
      steps: ['$\\cosh x = \\dfrac{e^{x}+e^{-x}}{2}$', '$= \\frac{e^{2 x} \\left(2 \\cosh x - \\sinh x\\right)}{3}$']
    },
    {
      id: 'x043', topic: '쌍곡선 순환',
      integrand: 'e^(3x)cosh(2x)', latex: 'e^{3 x} \\cosh\\left(2 x\\right)',
      answer: 'e^(3x)*(3cosh(2x) - 2sinh(2x))/5', answerLatex: '\\frac{e^{3 x} \\left(3 \\cosh\\left(2 x\\right) - 2 \\sinh\\left(2 x\\right)\\right)}{5}+C',
      domain: [0.05, 1.3],
      hints: ['$\\cosh$ 를 지수로 풀어 항별로 적분한다.', '분모는 $9-4=5$ 이다.'],
      steps: ['$\\cosh 2x = \\dfrac{e^{2x}+e^{-2x}}{2}$', '$= \\frac{e^{3 x} \\left(3 \\cosh\\left(2 x\\right) - 2 \\sinh\\left(2 x\\right)\\right)}{5}$']
    },
    {
      id: 'x044', topic: '반복 부분적분',
      integrand: 'ln(x)^2/x^2', latex: '\\frac{\\left(\\ln x\\right)^{2}}{x^{2}}',
      answer: '-(ln(x)^2+2ln(x)+2)/x', answerLatex: '\\frac{-\\left(\\left(\\ln x\\right)^{2} + 2 \\ln x + 2\\right)}{x}+C',
      domain: [0.4, 3],
      hints: ['$u=(\\ln x)^{2},\\;dv=x^{-2}dx$ 로 두고 두 번 부분적분한다.', '$\\int\\dfrac{\\ln x}{x^{2}}dx=-\\dfrac{\\ln x+1}{x}$ 를 중간에 쓴다.'],
      steps: ['$-\\dfrac{(\\ln x)^{2}}{x}+2\\int\\dfrac{\\ln x}{x^{2}}dx$', '$\\int\\dfrac{\\ln x}{x^{2}}dx=-\\dfrac{\\ln x+1}{x}$', '$= -\\dfrac{(\\ln x)^{2}+2\\ln x+2}{x}$']
    },
    {
      id: 'x045', topic: '부분적분',
      integrand: 'atan(x)/x^2', latex: '\\frac{\\arctan x}{x^{2}}',
      answer: '-atan(x)/x+ln(x)-ln(1+x^2)/2', answerLatex: '\\frac{-\\arctan x}{x} + \\ln\\left|x\\right| - \\frac{\\ln\\left|1 + x^{2}\\right|}{2}+C',
      domain: [0.3, 2.5],
      hints: ['$u=\\arctan x,\\;dv=x^{-2}dx$ 로 둔다.', '남는 $\\int\\dfrac{dx}{x(1+x^{2})}$ 는 부분분수로 나눈다.'],
      steps: ['$-\\dfrac{\\arctan x}{x}+\\int\\dfrac{dx}{x(1+x^{2})}$', '$\\dfrac{1}{x(1+x^{2})}=\\dfrac{1}{x}-\\dfrac{x}{1+x^{2}}$']
    },
    {
      id: 'x046', topic: '부분적분',
      integrand: 'ln(x)/(1+x)^2', latex: '\\frac{\\ln x}{\\left(1 + x\\right)^{2}}',
      answer: '-ln(x)/(1+x)+ln(x)-ln(1+x)', answerLatex: '\\frac{-\\ln\\left|x\\right|}{1 + x} + \\ln\\left|x\\right| - \\ln\\left|1 + x\\right|+C',
      domain: [0.3, 3],
      hints: ['$dv=(1+x)^{-2}dx$ 로 두면 $v=-\\dfrac{1}{1+x}$ 다.', '남는 $\\int\\dfrac{dx}{x(1+x)}$ 는 부분분수다.'],
      steps: ['$-\\dfrac{\\ln x}{1+x}+\\int\\dfrac{dx}{x(1+x)}$', '$\\dfrac{1}{x(1+x)}=\\dfrac{1}{x}-\\dfrac{1}{1+x}$']
    },
    {
      id: 'x047', topic: '기교',
      integrand: 'x*e^x/(1+x)^2', latex: '\\frac{x e^{x}}{\\left(1 + x\\right)^{2}}',
      answer: 'e^x/(1+x)', answerLatex: '\\frac{e^{x}}{1 + x}+C',
      domain: [0.2, 2.5],
      hints: ['$\\dfrac{x}{(1+x)^{2}}=\\dfrac{1}{1+x}-\\dfrac{1}{(1+x)^{2}}$ 로 쪼갠다.', '$f=\\dfrac{1}{1+x}$ 라 하면 $f\'=-\\dfrac{1}{(1+x)^{2}}$ 이고 $\\int e^{x}(f+f\')dx=e^{x}f$ 다.'],
      steps: ['$\\dfrac{x}{(1+x)^{2}}=\\dfrac{1}{1+x}-\\dfrac{1}{(1+x)^{2}}$', '$f=\\dfrac{1}{1+x},\\; f\'=-\\dfrac{1}{(1+x)^{2}}$', '$\\int e^{x}(f+f\')dx=\\dfrac{e^{x}}{1+x}$']
    },
    {
      id: 'x048', topic: '기교',
      integrand: '(1+x)/(x*(1+x*e^x))', latex: '\\frac{1 + x}{x \\left(1 + x e^{x}\\right)}',
      answer: 'ln(x*e^x)-ln(1+x*e^x)', answerLatex: '\\ln\\left|x e^{x}\\right| - \\ln\\left|1 + x e^{x}\\right|+C',
      domain: [0.3, 2],
      hints: ['$u=xe^{x}$ 로 두면 $du=(1+x)e^{x}dx$ 다.', '분자·분모에 $e^{x}$ 를 곱해 $u$ 를 만들어 낸다.'],
      steps: ['분자·분모에 $e^{x}$ 를 곱한다: $\\dfrac{(1+x)e^{x}}{xe^{x}(1+xe^{x})}$', '$u=xe^{x}$', '$\\int\\dfrac{du}{u(1+u)}=\\ln\\left|\\dfrac{u}{1+u}\\right|$']
    },
    {
      id: 'x049', topic: '삼각 유리식',
      integrand: 'sin(x)/(1+sin(x))', latex: '\\frac{\\sin x}{1 + \\sin x}',
      answer: 'x-tan(x)+sec(x)', answerLatex: 'x - \\tan x + \\sec x+C',
      domain: [0.2, 1.2],
      hints: ['$\\dfrac{\\sin x}{1+\\sin x}=1-\\dfrac{1}{1+\\sin x}$ 로 쪼갠다.', '$\\int\\dfrac{dx}{1+\\sin x}=\\tan x-\\sec x$ 를 쓴다.'],
      steps: ['$\\dfrac{\\sin x}{1+\\sin x}=1-\\dfrac{1}{1+\\sin x}$', '$\\int\\dfrac{dx}{1+\\sin x}=\\tan x-\\sec x$']
    },
    {
      id: 'x050', topic: '삼각 유리식',
      integrand: 'cos(x)/(1+cos(x))', latex: '\\frac{\\cos x}{1 + \\cos x}',
      answer: 'x-tan(x/2)', answerLatex: 'x - \\tan\\left(\\frac{x}{2}\\right)+C',
      domain: [0.2, 2.4],
      hints: ['$\\dfrac{\\cos x}{1+\\cos x}=1-\\dfrac{1}{1+\\cos x}$', '$\\int\\dfrac{dx}{1+\\cos x}=\\tan\\dfrac{x}{2}$'],
      steps: ['$\\dfrac{\\cos x}{1+\\cos x}=1-\\dfrac{1}{1+\\cos x}$', '$1+\\cos x=2\\cos^{2}\\dfrac{x}{2}$']
    },
    {
      id: 'x051', topic: '바이어슈트라스 치환',
      integrand: '1/(2+sin(x))', latex: '\\frac{1}{2 + \\sin x}',
      answer: '2*atan((2tan(x/2)+1)/sqrt(3))/sqrt(3)', answerLatex: '\\frac{2 \\arctan\\left(\\frac{2 \\tan\\left(\\frac{x}{2}\\right) + 1}{\\sqrt{3}}\\right)}{\\sqrt{3}}+C',
      domain: [0.2, 2.4],
      hints: ['$t=\\tan\\dfrac{x}{2}$ 로 두면 $\\sin x=\\dfrac{2t}{1+t^{2}}$ 다.', '분모를 정리하면 $2t^{2}+2t+2$ 가 되어 완전제곱이 필요하다.'],
      steps: ['$t=\\tan\\dfrac{x}{2},\\;dx=\\dfrac{2dt}{1+t^{2}}$', '$\\int\\dfrac{2\\,dt}{2t^{2}+2t+2}$', '완전제곱 후 $\\arctan$ 형태로 정리한다']
    },
    {
      id: 'x052', topic: '바이어슈트라스 치환',
      integrand: '1/(3+2sin(x))', latex: '\\frac{1}{3 + 2 \\sin x}',
      answer: '2*atan((3tan(x/2)+2)/sqrt(5))/sqrt(5)', answerLatex: '\\frac{2 \\arctan\\left(\\frac{3 \\tan\\left(\\frac{x}{2}\\right) + 2}{\\sqrt{5}}\\right)}{\\sqrt{5}}+C',
      domain: [0.2, 2.4],
      hints: ['$t=\\tan\\dfrac{x}{2}$ 로 두면 $\\sin x=\\dfrac{2t}{1+t^{2}}$ 다.', '분모를 정리하면 $3t^{2}+4t+3$ 가 되어 완전제곱이 필요하다.'],
      steps: ['$t=\\tan\\dfrac{x}{2},\\;dx=\\dfrac{2dt}{1+t^{2}}$', '$\\int\\dfrac{2\\,dt}{3t^{2}+4t+3}$', '완전제곱 후 $\\arctan$ 형태로 정리한다']
    },
    {
      id: 'x053', topic: '바이어슈트라스 치환',
      integrand: '1/(5+3sin(x))', latex: '\\frac{1}{5 + 3 \\sin x}',
      answer: '2*atan((5tan(x/2)+3)/4)/4', answerLatex: '\\frac{2 \\arctan\\left(\\frac{5 \\tan\\left(\\frac{x}{2}\\right) + 3}{4}\\right)}{4}+C',
      domain: [0.2, 2.4],
      hints: ['$t=\\tan\\dfrac{x}{2}$ 로 두면 $\\sin x=\\dfrac{2t}{1+t^{2}}$ 다.', '분모를 정리하면 $5t^{2}+6t+5$ 가 되어 완전제곱이 필요하다.'],
      steps: ['$t=\\tan\\dfrac{x}{2},\\;dx=\\dfrac{2dt}{1+t^{2}}$', '$\\int\\dfrac{2\\,dt}{5t^{2}+6t+5}$', '완전제곱 후 $\\arctan$ 형태로 정리한다']
    },
    {
      id: 'x054', topic: '삼각치환 고급',
      integrand: 'sqrt(x^2+1)/x', latex: '\\frac{\\sqrt{x^{2} + 1}}{x}',
      answer: 'sqrt(x^2+1)-ln((1+sqrt(x^2+1))/x)', answerLatex: '\\sqrt{x^{2} + 1} - \\ln\\left|\\frac{1 + \\sqrt{x^{2} + 1}}{x}\\right|+C',
      domain: [0.35, 2.6],
      hints: ['$x=\\sinh\\theta$ 로 두면 $\\int\\dfrac{\\cosh^{2}\\theta}{\\sinh\\theta}d\\theta$ 가 된다.', '$u=\\sqrt{x^{2}+1}$ 치환으로 유리식으로 바꿔도 된다.'],
      steps: ['$u=\\sqrt{x^{2}+1},\\;u\\,du=x\\,dx$', '$\\int\\dfrac{u^{2}}{u^{2}-1}du$', '$= u+\\dfrac{1}{2}\\ln\\left|\\dfrac{u-1}{u+1}\\right|$ 를 정리한다']
    },
    {
      id: 'x055', topic: '삼각치환 고급',
      integrand: 'sqrt(x^2-1)/x', latex: '\\frac{\\sqrt{x^{2} - 1}}{x}',
      answer: 'sqrt(x^2-1)-atan(sqrt(x^2-1))', answerLatex: '\\sqrt{x^{2} - 1} - \\arctan\\left(\\sqrt{x^{2} - 1}\\right)+C',
      domain: [1.3, 3.2],
      hints: ['$x=\\sec\\theta$ 로 두면 $\\int\\tan^{2}\\theta\\,d\\theta$ 가 된다.', '$\\tan^{2}=\\sec^{2}-1$ 로 내린다.'],
      steps: ['$x=\\sec\\theta$', '$\\int\\tan^{2}\\theta\\,d\\theta=\\tan\\theta-\\theta$', '$\\tan\\theta=\\sqrt{x^{2}-1},\\;\\theta=\\operatorname{arcsec}x$']
    },
    {
      id: 'x056', topic: '치환+부분적분',
      integrand: 'x^3*e^(x^2)', latex: 'x^{3} e^{x^{2}}',
      answer: 'e^(x^2)*(x^2-1)/2', answerLatex: '\\frac{e^{x^{2}} \\left(x^{2} - 1\\right)}{2}+C',
      domain: [0.1, 1.3],
      hints: ['$u=x^{2}$ 로 두면 $\\dfrac{1}{2}\\int ue^{u}du$ 가 된다.', '그다음은 부분적분이다.'],
      steps: ['$u=x^{2},\\;du=2x\\,dx$', '$\\dfrac{1}{2}\\int ue^{u}du=\\dfrac{(u-1)e^{u}}{2}$']
    },
    {
      id: 'x057', topic: '치환+부분적분',
      integrand: 'x^5*e^(x^2)', latex: 'x^{5} e^{x^{2}}',
      answer: 'e^(x^2)*(x^4-2x^2+2)/2', answerLatex: '\\frac{e^{x^{2}} \\left(x^{4} - 2 x^{2} + 2\\right)}{2}+C',
      domain: [0.1, 1.2],
      hints: ['$u=x^{2}$ 로 두면 $\\dfrac{1}{2}\\int u^{2}e^{u}du$ 다.', '부분적분을 두 번 한다.'],
      steps: ['$u=x^{2}$', '$\\dfrac{1}{2}\\int u^{2}e^{u}du=\\dfrac{(u^{2}-2u+2)e^{u}}{2}$']
    },
    {
      id: 'x058', topic: '치환+부분적분',
      integrand: 'x^3*sin(x^2)', latex: 'x^{3} \\sin\\left(x^{2}\\right)',
      answer: '(sin(x^2)-x^2*cos(x^2))/2', answerLatex: '\\frac{\\sin\\left(x^{2}\\right) - x^{2} \\cos\\left(x^{2}\\right)}{2}+C',
      domain: [0.2, 1.6],
      hints: ['$u=x^{2}$ 로 두면 $\\dfrac{1}{2}\\int u\\sin u\\,du$ 가 된다.', '부분적분으로 마무리한다.'],
      steps: ['$u=x^{2},\\;du=2x\\,dx$', '$\\dfrac{1}{2}\\int u\\sin u\\,du=\\dfrac{\\sin u-u\\cos u}{2}$']
    },
    {
      id: 'x059', topic: '부분적분',
      integrand: 'x*csc(x)^2', latex: 'x \\csc^{2} x',
      answer: '-x*cot(x)+ln(sin(x))', answerLatex: '-x \\cot x + \\ln\\left|\\sin x\\right|+C',
      domain: [0.45, 2.3],
      hints: ['$u=x,\\;dv=\\csc^{2}x\\,dx$ 로 둔다.', '남는 $\\int\\cot x\\,dx$ 를 처리한다.'],
      steps: ['$u=x,\\;v=-\\cot x$', '$-x\\cot x+\\int\\cot x\\,dx=-x\\cot x+\\ln|\\sin x|$']
    },
    {
      id: 'x060', topic: '쌍곡선 짝수차',
      integrand: 'sinh(x)^4', latex: '\\sinh^{4} x',
      answer: '3x/8 - sinh(2x)/4 + sinh(4x)/32', answerLatex: '\\frac{3 x}{8} - \\frac{\\sinh\\left(2 x\\right)}{4} + \\frac{\\sinh\\left(4 x\\right)}{32}+C',
      domain: [0.2, 1.4],
      hints: ['$\\sinh^{2}u=\\dfrac{\\cosh 2u-1}{2}$ 를 두 번 적용한다.', '$\\sin^{4}$ 과 형태가 비슷하지만 부호가 다르다.'],
      steps: ['$\\sinh^{4}x=\\dfrac{(\\cosh 2x-1)^{2}}{4}$', '$\\cosh^{2}2x=\\dfrac{\\cosh 4x+1}{2}$', '$=\\dfrac{3}{8}-\\dfrac{\\cosh 2x}{2}+\\dfrac{\\cosh 4x}{8}$']
    },
    {
      id: 'x061', topic: '쌍곡선 짝수차',
      integrand: 'cosh(x)^4', latex: '\\cosh^{4} x',
      answer: '3x/8 + sinh(2x)/4 + sinh(4x)/32', answerLatex: '\\frac{3 x}{8} + \\frac{\\sinh\\left(2 x\\right)}{4} + \\frac{\\sinh\\left(4 x\\right)}{32}+C',
      domain: [0.2, 1.4],
      hints: ['$\\cosh^{2}u=\\dfrac{\\cosh 2u+1}{2}$ 를 두 번 적용한다.', '$\\sinh^{4}$ 과 가운데 항의 부호만 다르다.'],
      steps: ['$\\cosh^{4}x=\\dfrac{(\\cosh 2x+1)^{2}}{4}$', '$=\\dfrac{3}{8}+\\dfrac{\\cosh 2x}{2}+\\dfrac{\\cosh 4x}{8}$']
    }
  ];

  var BY_LEVEL = { easy: EASY, medium: MEDIUM, hard: HARD, monster: MONSTER };
  var ALL = [].concat(EASY, MEDIUM, HARD, MONSTER);

  return {
    easy: EASY, medium: MEDIUM, hard: HARD, monster: MONSTER,
    all: ALL, byLevel: BY_LEVEL,
    levels: ['easy', 'medium', 'hard', 'monster'],
    labels: { easy: '쉬움', medium: '보통', hard: '어려움', monster: '몬스터' },
    find: function (id) {
      for (var i = 0; i < ALL.length; i++) if (ALL[i].id === id) return ALL[i];
      return null;
    }
  };
});
