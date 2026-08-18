/*
 * problems.js - 직접 만든 적분 문제 은행.
 *  integrand : 채점용 피적분함수(ASCII)
 *  answer    : 기준 부정적분(ASCII, +C 생략)
 *  domain    : 수치 비교에 쓰는 안전한 구간 (특이점 회피)
 */
(function (root, factory) {
  var api = factory();
  root.PROBLEMS = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var EASY = [
    {
      id: 'e01', topic: '다항함수',
      integrand: '3x^2-4x+5', latex: '3x^{2}-4x+5',
      answer: 'x^3-2x^2+5x', answerLatex: 'x^{3}-2x^{2}+5x+C',
      domain: [0.4, 2.6],
      hints: ['각 항에 거듭제곱 법칙을 따로 적용한다.', '$\\int x^{n}dx=\\dfrac{x^{n+1}}{n+1}\\;(n\\neq -1)$'],
      steps: ['$\\int 3x^{2}dx = x^{3}$', '$\\int -4x\\,dx = -2x^{2}$', '$\\int 5\\,dx = 5x$']
    },
    {
      id: 'e02', topic: '거듭제곱 법칙',
      integrand: 'sqrt(x)', latex: '\\sqrt{x}',
      answer: '(2/3)x^(3/2)', answerLatex: '\\dfrac{2}{3}x^{3/2}+C',
      domain: [0.3, 3.0],
      hints: ['$\\sqrt{x}=x^{1/2}$ 로 바꿔 쓴다.', '지수를 $1$ 더하고 그 값으로 나눈다.'],
      steps: ['$\\sqrt{x}=x^{1/2}$', '$\\int x^{1/2}dx=\\frac{x^{3/2}}{3/2}=\\frac{2}{3}x^{3/2}$']
    },
    {
      id: 'e03', topic: '거듭제곱 법칙',
      integrand: '1/x^2', latex: '\\dfrac{1}{x^{2}}',
      answer: '-1/x', answerLatex: '-\\dfrac{1}{x}+C',
      domain: [0.5, 3.0],
      hints: ['$x^{-2}$ 로 고쳐 쓴다.', '지수가 $-1$ 이 아니므로 거듭제곱 법칙을 그대로 쓸 수 있다.'],
      steps: ['$\\int x^{-2}dx = \\frac{x^{-1}}{-1} = -\\frac{1}{x}$']
    },
    {
      id: 'e04', topic: '로그',
      integrand: '5/x', latex: '\\dfrac{5}{x}',
      answer: '5ln(x)', answerLatex: '5\\ln|x|+C',
      domain: [0.4, 4.0],
      hints: ['$\\int \\dfrac{1}{x}dx$ 는 거듭제곱 법칙의 예외다.', '상수 $5$ 는 밖으로 뺀다.'],
      steps: ['$5\\int \\frac{1}{x}dx = 5\\ln|x|$']
    },
    {
      id: 'e05', topic: '지수함수',
      integrand: 'e^(2x)', latex: 'e^{2x}',
      answer: 'e^(2x)/2', answerLatex: '\\dfrac{e^{2x}}{2}+C',
      domain: [-0.8, 1.2],
      hints: ['$u=2x$ 로 두면 $du=2dx$ 이다.', '안쪽 함수의 계수로 나눠 준다.'],
      steps: ['$u=2x,\\; du=2\\,dx$', '$\\frac{1}{2}\\int e^{u}du = \\frac{e^{2x}}{2}$']
    },
    {
      id: 'e06', topic: '삼각함수',
      integrand: 'sin(3x)', latex: '\\sin 3x',
      answer: '-cos(3x)/3', answerLatex: '-\\dfrac{\\cos 3x}{3}+C',
      domain: [0.2, 1.6],
      hints: ['$\\int \\sin u\\,du=-\\cos u$', '안쪽 계수 $3$ 으로 나눈다.'],
      steps: ['$u=3x,\\;du=3\\,dx$', '$\\frac{1}{3}\\int \\sin u\\,du=-\\frac{\\cos 3x}{3}$']
    },
    {
      id: 'e07', topic: '삼각함수',
      integrand: 'cos(x/2)', latex: '\\cos\\dfrac{x}{2}',
      answer: '2sin(x/2)', answerLatex: '2\\sin\\dfrac{x}{2}+C',
      domain: [0.2, 3.0],
      hints: ['$u=x/2$ 이면 $du=dx/2$ 이다.', '계수가 $1/2$ 이므로 결과에 $2$ 를 곱한다.'],
      steps: ['$u=\\frac{x}{2},\\;dx=2\\,du$', '$2\\int \\cos u\\,du = 2\\sin\\frac{x}{2}$']
    },
    {
      id: 'e08', topic: '삼각함수',
      integrand: 'sec(x)^2', latex: '\\sec^{2}x',
      answer: 'tan(x)', answerLatex: '\\tan x+C',
      domain: [0.2, 1.2],
      hints: ['$\\tan x$ 의 도함수를 떠올린다.', '답은 한 항이다.'],
      steps: ['$\\frac{d}{dx}\\tan x=\\sec^{2}x$', '$\\therefore \\int \\sec^{2}x\\,dx=\\tan x$']
    },
    {
      id: 'e09', topic: '치환(1차식)',
      integrand: '(2x+1)^4', latex: '(2x+1)^{4}',
      answer: '(2x+1)^5/10', answerLatex: '\\dfrac{(2x+1)^{5}}{10}+C',
      domain: [-0.2, 1.5],
      hints: ['전개하지 말고 $u=2x+1$ 로 둔다.', '지수를 올린 뒤 $5$ 와 $2$ 로 나눈다.'],
      steps: ['$u=2x+1,\\;du=2\\,dx$', '$\\frac{1}{2}\\cdot\\frac{u^{5}}{5}=\\frac{(2x+1)^{5}}{10}$']
    },
    {
      id: 'e10', topic: '치환(1차식)',
      integrand: '1/(2x+3)', latex: '\\dfrac{1}{2x+3}',
      answer: 'ln(2x+3)/2', answerLatex: '\\dfrac{1}{2}\\ln|2x+3|+C',
      domain: [0.2, 3.0],
      hints: ['분모가 1차식이면 로그가 된다.', '안쪽 계수 $2$ 로 나눈다.'],
      steps: ['$u=2x+3,\\;du=2\\,dx$', '$\\frac{1}{2}\\int\\frac{du}{u}=\\frac{1}{2}\\ln|2x+3|$']
    },
    {
      id: 'e11', topic: '전개 후 적분',
      integrand: '(x^2+1)^2', latex: '(x^{2}+1)^{2}',
      answer: 'x^5/5+2x^3/3+x', answerLatex: '\\dfrac{x^{5}}{5}+\\dfrac{2x^{3}}{3}+x+C',
      domain: [0.2, 2.2],
      hints: ['치환이 통하지 않으니 먼저 전개한다.', '$x^{4}+2x^{2}+1$ 을 항별로 적분한다.'],
      steps: ['$(x^{2}+1)^{2}=x^{4}+2x^{2}+1$', '$\\int = \\frac{x^{5}}{5}+\\frac{2x^{3}}{3}+x$']
    },
    {
      id: 'e12', topic: '지수함수',
      integrand: '3^x', latex: '3^{x}',
      answer: '3^x/ln(3)', answerLatex: '\\dfrac{3^{x}}{\\ln 3}+C',
      domain: [-1.0, 1.5],
      hints: ['$3^{x}=e^{x\\ln 3}$', '밑의 자연로그로 나눈다.'],
      steps: ['$3^{x}=e^{x\\ln 3}$', '$\\int e^{x\\ln 3}dx=\\frac{3^{x}}{\\ln 3}$']
    },
    {
      id: 'e13', topic: '역삼각함수',
      integrand: '1/sqrt(1-x^2)', latex: '\\dfrac{1}{\\sqrt{1-x^{2}}}',
      answer: 'asin(x)', answerLatex: '\\arcsin x+C',
      domain: [-0.75, 0.75],
      hints: ['기본 적분표에 그대로 있는 형태다.', '$\\arcsin x$ 의 도함수를 떠올린다.'],
      steps: ['$\\frac{d}{dx}\\arcsin x=\\frac{1}{\\sqrt{1-x^{2}}}$']
    },
    {
      id: 'e14', topic: '역삼각함수',
      integrand: '1/(1+x^2)', latex: '\\dfrac{1}{1+x^{2}}',
      answer: 'atan(x)', answerLatex: '\\arctan x+C',
      domain: [-1.5, 1.8],
      hints: ['$\\arctan x$ 의 도함수 형태다.', '치환이 필요 없다.'],
      steps: ['$\\frac{d}{dx}\\arctan x=\\frac{1}{1+x^{2}}$']
    },
    {
      id: 'e15', topic: '다항함수',
      integrand: '(x-1)(x+3)', latex: '(x-1)(x+3)',
      answer: 'x^3/3+x^2-3x', answerLatex: '\\dfrac{x^{3}}{3}+x^{2}-3x+C',
      domain: [0.2, 2.5],
      hints: ['곱을 먼저 전개한다.', '$x^{2}+2x-3$ 을 적분한다.'],
      steps: ['$(x-1)(x+3)=x^{2}+2x-3$', '$\\int = \\frac{x^{3}}{3}+x^{2}-3x$']
    },
    {
      id: 'e16', topic: '거듭제곱 법칙',
      integrand: '4/x^3', latex: '\\dfrac{4}{x^{3}}',
      answer: '-2/x^2', answerLatex: '-\\dfrac{2}{x^{2}}+C',
      domain: [0.5, 3.0],
      hints: ['$4x^{-3}$ 으로 고친다.', '지수 $-3$ 에 $1$ 을 더하면 $-2$ 다.'],
      steps: ['$4\\int x^{-3}dx = 4\\cdot\\frac{x^{-2}}{-2} = -\\frac{2}{x^{2}}$']
    },
    {
      id: 'e17', topic: '기본 적분',
      integrand: 'e^x+1/x', latex: 'e^{x}+\\dfrac{1}{x}',
      answer: 'e^x+ln(x)', answerLatex: 'e^{x}+\\ln|x|+C',
      domain: [0.4, 2.2],
      hints: ['두 항을 따로 적분한다.', '$e^{x}$ 는 적분해도 그대로다.'],
      steps: ['$\\int e^{x}dx = e^{x}$', '$\\int \\frac{1}{x}dx = \\ln|x|$']
    },
    {
      id: 'e18', topic: '삼각함수',
      integrand: '2sin(x)-3cos(x)', latex: '2\\sin x-3\\cos x',
      answer: '-2cos(x)-3sin(x)', answerLatex: '-2\\cos x-3\\sin x+C',
      domain: [0.2, 3.0],
      hints: ['$\\sin$ 은 적분하면 $-\\cos$ 이다.', '부호에 주의한다.'],
      steps: ['$\\int 2\\sin x\\,dx=-2\\cos x$', '$\\int -3\\cos x\\,dx=-3\\sin x$']
    },
    {
      id: 'e19', topic: '거듭제곱 법칙',
      integrand: 'x^(2/3)', latex: 'x^{2/3}',
      answer: '(3/5)x^(5/3)', answerLatex: '\\dfrac{3}{5}x^{5/3}+C',
      domain: [0.3, 3.0],
      hints: ['지수에 $1$ 을 더하면 $5/3$ 이다.', '분수 지수는 역수를 곱한다고 생각한다.'],
      steps: ['$\\int x^{2/3}dx=\\frac{x^{5/3}}{5/3}=\\frac{3}{5}x^{5/3}$']
    },
    {
      id: 'e20', topic: '삼각항등식',
      integrand: 'tan(x)^2', latex: '\\tan^{2}x',
      answer: 'tan(x)-x', answerLatex: '\\tan x-x+C',
      domain: [0.2, 1.2],
      hints: ['$\\tan^{2}x=\\sec^{2}x-1$ 항등식을 쓴다.', '두 항 모두 기본 적분이다.'],
      steps: ['$\\tan^{2}x=\\sec^{2}x-1$', '$\\int (\\sec^{2}x-1)dx=\\tan x-x$']
    },
    {
      id: 'e21', topic: '기본 적분',
      integrand: '1/x-1', latex: '\\dfrac{1}{x}-1',
      answer: 'ln(x)-x', answerLatex: '\\ln|x|-x+C',
      domain: [0.4, 3.0],
      hints: ['항별로 나누어 적분한다.', '상수 $-1$ 의 적분은 $-x$ 다.'],
      steps: ['$\\int \\frac{1}{x}dx=\\ln|x|$', '$\\int -1\\,dx=-x$']
    },
    {
      id: 'e22', topic: '삼각함수',
      integrand: 'csc(x)^2', latex: '\\csc^{2}x',
      answer: '-cot(x)', answerLatex: '-\\cot x+C',
      domain: [0.5, 2.4],
      hints: ['$\\cot x$ 의 도함수는 $-\\csc^{2}x$ 다.', '부호를 뒤집어 준다.'],
      steps: ['$\\frac{d}{dx}(-\\cot x)=\\csc^{2}x$']
    },
    {
      id: 'e23', topic: '삼각함수',
      integrand: 'sec(x)tan(x)', latex: '\\sec x\\tan x',
      answer: 'sec(x)', answerLatex: '\\sec x+C',
      domain: [0.2, 1.2],
      hints: ['$\\sec x$ 의 도함수를 그대로 떠올린다.', '치환할 필요가 없다.'],
      steps: ['$\\frac{d}{dx}\\sec x=\\sec x\\tan x$']
    },
    {
      id: 'e24', topic: '치환',
      integrand: '6x/(3x^2+1)', latex: '\\dfrac{6x}{3x^{2}+1}',
      answer: 'ln(3x^2+1)', answerLatex: '\\ln(3x^{2}+1)+C',
      domain: [0.1, 2.0],
      hints: ['분자가 분모의 도함수인지 확인한다.', '$(3x^{2}+1)^{\\prime}=6x$'],
      steps: ['$u=3x^{2}+1,\\;du=6x\\,dx$', '$\\int\\frac{du}{u}=\\ln(3x^{2}+1)$']
    }
  ];

  var MEDIUM = [
    {
      id: 'm01', topic: '치환적분',
      integrand: 'x*e^(x^2)', latex: 'x\\,e^{x^{2}}',
      answer: 'e^(x^2)/2', answerLatex: '\\dfrac{e^{x^{2}}}{2}+C',
      domain: [0.1, 1.4],
      hints: ['$u=x^{2}$ 으로 두면 $du=2x\\,dx$ 다.', '앞의 $x$ 가 $du$ 를 만들어 준다.'],
      steps: ['$u=x^{2},\\;du=2x\\,dx$', '$\\frac{1}{2}\\int e^{u}du=\\frac{e^{x^{2}}}{2}$']
    },
    {
      id: 'm02', topic: '치환적분',
      integrand: 'x/(x^2+1)', latex: '\\dfrac{x}{x^{2}+1}',
      answer: 'ln(x^2+1)/2', answerLatex: '\\dfrac{1}{2}\\ln(x^{2}+1)+C',
      domain: [0.1, 2.5],
      hints: ['분모의 도함수가 $2x$ 다.', '분자에 맞추려면 $1/2$ 이 필요하다.'],
      steps: ['$u=x^{2}+1,\\;du=2x\\,dx$', '$\\frac{1}{2}\\ln(x^{2}+1)$']
    },
    {
      id: 'm03', topic: '부분적분',
      integrand: 'x*e^x', latex: 'x\\,e^{x}',
      answer: '(x-1)e^x', answerLatex: '(x-1)e^{x}+C',
      domain: [-1.0, 1.8],
      hints: ['$u=x,\\;dv=e^{x}dx$ 로 둔다.', '$\\int u\\,dv=uv-\\int v\\,du$'],
      steps: ['$u=x,\\;dv=e^{x}dx$', '$xe^{x}-\\int e^{x}dx = xe^{x}-e^{x}$']
    },
    {
      id: 'm04', topic: '부분적분',
      integrand: 'ln(x)', latex: '\\ln x',
      answer: 'x*ln(x)-x', answerLatex: 'x\\ln x-x+C',
      domain: [0.3, 3.0],
      hints: ['$dv=dx$ 로 두는 고전적인 수법이다.', '$u=\\ln x,\\;du=dx/x$'],
      steps: ['$u=\\ln x,\\;dv=dx$', '$x\\ln x-\\int x\\cdot\\frac{1}{x}dx = x\\ln x-x$']
    },
    {
      id: 'm05', topic: '부분적분',
      integrand: 'x*ln(x)', latex: 'x\\ln x',
      answer: 'x^2*ln(x)/2-x^2/4', answerLatex: '\\dfrac{x^{2}\\ln x}{2}-\\dfrac{x^{2}}{4}+C',
      domain: [0.3, 3.0],
      hints: ['$u=\\ln x,\\;dv=x\\,dx$', '남은 적분은 $\\int \\frac{x}{2}dx$ 다.'],
      steps: ['$u=\\ln x,\\;v=\\frac{x^{2}}{2}$', '$\\frac{x^{2}\\ln x}{2}-\\int\\frac{x}{2}dx=\\frac{x^{2}\\ln x}{2}-\\frac{x^{2}}{4}$']
    },
    {
      id: 'm06', topic: '부분적분',
      integrand: 'x*cos(x)', latex: 'x\\cos x',
      answer: 'x*sin(x)+cos(x)', answerLatex: 'x\\sin x+\\cos x+C',
      domain: [0.2, 3.0],
      hints: ['$u=x$ 로 두어 차수를 낮춘다.', '$v=\\sin x$'],
      steps: ['$u=x,\\;dv=\\cos x\\,dx$', '$x\\sin x-\\int\\sin x\\,dx = x\\sin x+\\cos x$']
    },
    {
      id: 'm07', topic: '반각공식',
      integrand: 'sin(x)^2', latex: '\\sin^{2}x',
      answer: 'x/2-sin(2x)/4', answerLatex: '\\dfrac{x}{2}-\\dfrac{\\sin 2x}{4}+C',
      domain: [0.2, 3.0],
      hints: ['$\\sin^{2}x=\\dfrac{1-\\cos 2x}{2}$', '차수를 낮춘 뒤 항별로 적분한다.'],
      steps: ['$\\sin^{2}x=\\frac{1-\\cos 2x}{2}$', '$\\int = \\frac{x}{2}-\\frac{\\sin 2x}{4}$']
    },
    {
      id: 'm08', topic: '반각공식',
      integrand: 'cos(3x)^2', latex: '\\cos^{2}3x',
      answer: 'x/2+sin(6x)/12', answerLatex: '\\dfrac{x}{2}+\\dfrac{\\sin 6x}{12}+C',
      domain: [0.1, 1.6],
      hints: ['$\\cos^{2}\\theta=\\dfrac{1+\\cos 2\\theta}{2},\\;\\theta=3x$', '안쪽 각이 $6x$ 가 된다.'],
      steps: ['$\\cos^{2}3x=\\frac{1+\\cos 6x}{2}$', '$\\int = \\frac{x}{2}+\\frac{\\sin 6x}{12}$']
    },
    {
      id: 'm09', topic: '삼각함수 치환',
      integrand: 'tan(x)', latex: '\\tan x',
      answer: '-ln(cos(x))', answerLatex: '-\\ln|\\cos x|+C',
      domain: [0.2, 1.2],
      hints: ['$\\tan x=\\dfrac{\\sin x}{\\cos x}$ 로 쓴다.', '$u=\\cos x$ 로 치환한다.'],
      steps: ['$u=\\cos x,\\;du=-\\sin x\\,dx$', '$-\\int\\frac{du}{u}=-\\ln|\\cos x|$']
    },
    {
      id: 'm10', topic: '부분분수',
      integrand: '1/(x^2-1)', latex: '\\dfrac{1}{x^{2}-1}',
      answer: '(ln(x-1)-ln(x+1))/2', answerLatex: '\\dfrac{1}{2}\\ln\\left|\\dfrac{x-1}{x+1}\\right|+C',
      domain: [1.4, 4.0],
      hints: ['$\\dfrac{1}{(x-1)(x+1)}$ 로 인수분해한다.', '$\\dfrac{1}{2}\\left(\\dfrac{1}{x-1}-\\dfrac{1}{x+1}\\right)$'],
      steps: ['$\\frac{1}{x^{2}-1}=\\frac{1}{2}\\left(\\frac{1}{x-1}-\\frac{1}{x+1}\\right)$', '$\\int = \\frac{1}{2}\\ln\\left|\\frac{x-1}{x+1}\\right|$']
    },
    {
      id: 'm11', topic: '치환적분',
      integrand: '(2x+3)/(x^2+3x+5)', latex: '\\dfrac{2x+3}{x^{2}+3x+5}',
      answer: 'ln(x^2+3x+5)', answerLatex: '\\ln(x^{2}+3x+5)+C',
      domain: [0.1, 2.5],
      hints: ['분자가 분모의 도함수와 정확히 같다.', '$\\int\\frac{f^{\\prime}}{f}=\\ln|f|$'],
      steps: ['$u=x^{2}+3x+5,\\;du=(2x+3)dx$', '$\\int\\frac{du}{u}=\\ln(x^{2}+3x+5)$']
    },
    {
      id: 'm12', topic: '삼각함수 홀수차',
      integrand: 'sin(x)^3', latex: '\\sin^{3}x',
      answer: '-cos(x)+cos(x)^3/3', answerLatex: '-\\cos x+\\dfrac{\\cos^{3}x}{3}+C',
      domain: [0.2, 2.8],
      hints: ['$\\sin^{3}x=\\sin x(1-\\cos^{2}x)$', '$u=\\cos x$ 로 치환한다.'],
      steps: ['$\\sin^{3}x=(1-\\cos^{2}x)\\sin x$', '$u=\\cos x:\\;-\\int(1-u^{2})du=-\\cos x+\\frac{\\cos^{3}x}{3}$']
    },
    {
      id: 'm13', topic: '치환적분',
      integrand: 'x*sqrt(x+1)', latex: 'x\\sqrt{x+1}',
      answer: '(2/5)(x+1)^(5/2)-(2/3)(x+1)^(3/2)', answerLatex: '\\dfrac{2}{5}(x+1)^{5/2}-\\dfrac{2}{3}(x+1)^{3/2}+C',
      domain: [0.1, 3.0],
      hints: ['$u=x+1$ 로 두면 $x=u-1$ 이다.', '$(u-1)\\sqrt{u}$ 를 전개한다.'],
      steps: ['$u=x+1,\\;x=u-1$', '$\\int (u^{3/2}-u^{1/2})du=\\frac{2}{5}u^{5/2}-\\frac{2}{3}u^{3/2}$']
    },
    {
      id: 'm14', topic: '순환 부분적분',
      integrand: 'e^x*sin(x)', latex: 'e^{x}\\sin x',
      answer: 'e^x*(sin(x)-cos(x))/2', answerLatex: '\\dfrac{e^{x}(\\sin x-\\cos x)}{2}+C',
      domain: [0.1, 2.5],
      hints: ['부분적분을 두 번 하면 원래 적분이 다시 나온다.', '$I$ 에 대한 방정식을 세워 푼다.'],
      steps: ['$I=\\int e^{x}\\sin x\\,dx$', '두 번 부분적분: $I = e^{x}\\sin x-e^{x}\\cos x-I$', '$2I=e^{x}(\\sin x-\\cos x)$']
    },
    {
      id: 'm15', topic: '역삼각함수',
      integrand: '1/(x^2+4)', latex: '\\dfrac{1}{x^{2}+4}',
      answer: 'atan(x/2)/2', answerLatex: '\\dfrac{1}{2}\\arctan\\dfrac{x}{2}+C',
      domain: [-2.0, 3.0],
      hints: ['$\\int\\dfrac{dx}{x^{2}+a^{2}}=\\dfrac{1}{a}\\arctan\\dfrac{x}{a}$', '$a=2$ 다.'],
      steps: ['$a=2$', '$\\frac{1}{2}\\arctan\\frac{x}{2}$']
    },
    {
      id: 'm16', topic: '역삼각함수',
      integrand: '1/sqrt(9-x^2)', latex: '\\dfrac{1}{\\sqrt{9-x^{2}}}',
      answer: 'asin(x/3)', answerLatex: '\\arcsin\\dfrac{x}{3}+C',
      domain: [-2.2, 2.2],
      hints: ['$\\int\\dfrac{dx}{\\sqrt{a^{2}-x^{2}}}=\\arcsin\\dfrac{x}{a}$', '$a=3$ 이다.'],
      steps: ['$a=3$', '$\\arcsin\\frac{x}{3}$']
    },
    {
      id: 'm17', topic: '치환적분',
      integrand: 'x/sqrt(x^2+4)', latex: '\\dfrac{x}{\\sqrt{x^{2}+4}}',
      answer: 'sqrt(x^2+4)', answerLatex: '\\sqrt{x^{2}+4}+C',
      domain: [0.1, 3.0],
      hints: ['$u=x^{2}+4$ 로 둔다.', '$\\int u^{-1/2}du=2\\sqrt{u}$ 를 기억한다.'],
      steps: ['$u=x^{2}+4,\\;du=2x\\,dx$', '$\\frac{1}{2}\\int u^{-1/2}du=\\sqrt{x^{2}+4}$']
    },
    {
      id: 'm18', topic: '치환적분',
      integrand: 'ln(x)/x', latex: '\\dfrac{\\ln x}{x}',
      answer: 'ln(x)^2/2', answerLatex: '\\dfrac{(\\ln x)^{2}}{2}+C',
      domain: [0.4, 4.0],
      hints: ['$u=\\ln x$ 로 두면 $du=dx/x$ 다.', '남는 것은 $\\int u\\,du$ 다.'],
      steps: ['$u=\\ln x,\\;du=\\frac{dx}{x}$', '$\\int u\\,du=\\frac{(\\ln x)^{2}}{2}$']
    },
    {
      id: 'm19', topic: '이중 치환',
      integrand: '1/(x*ln(x))', latex: '\\dfrac{1}{x\\ln x}',
      answer: 'ln(ln(x))', answerLatex: '\\ln|\\ln x|+C',
      domain: [1.4, 5.0],
      hints: ['$u=\\ln x$ 로 두면 적분이 $\\int du/u$ 가 된다.', '로그가 두 번 겹친다.'],
      steps: ['$u=\\ln x,\\;du=\\frac{dx}{x}$', '$\\int\\frac{du}{u}=\\ln|\\ln x|$']
    },
    {
      id: 'm20', topic: '부분적분',
      integrand: 'atan(x)', latex: '\\arctan x',
      answer: 'x*atan(x)-ln(1+x^2)/2', answerLatex: 'x\\arctan x-\\dfrac{1}{2}\\ln(1+x^{2})+C',
      domain: [0.1, 2.5],
      hints: ['$dv=dx$ 로 두는 유형이다.', '$du=\\dfrac{dx}{1+x^{2}}$'],
      steps: ['$u=\\arctan x,\\;dv=dx$', '$x\\arctan x-\\int\\frac{x}{1+x^{2}}dx = x\\arctan x-\\frac{1}{2}\\ln(1+x^{2})$']
    },
    {
      id: 'm21', topic: '고전 기법',
      integrand: 'sec(x)', latex: '\\sec x',
      answer: 'ln(sec(x)+tan(x))', answerLatex: '\\ln|\\sec x+\\tan x|+C',
      domain: [0.2, 1.2],
      hints: ['$\\dfrac{\\sec x+\\tan x}{\\sec x+\\tan x}$ 를 곱한다.', '분자가 분모의 도함수가 된다.'],
      steps: ['$\\sec x\\cdot\\frac{\\sec x+\\tan x}{\\sec x+\\tan x}$', '$u=\\sec x+\\tan x,\\;du=(\\sec x\\tan x+\\sec^{2}x)dx$', '$\\ln|\\sec x+\\tan x|$']
    },
    {
      id: 'm22', topic: '반복 부분적분',
      integrand: 'x^2*e^x', latex: 'x^{2}e^{x}',
      answer: '(x^2-2x+2)e^x', answerLatex: '(x^{2}-2x+2)e^{x}+C',
      domain: [-1.0, 1.8],
      hints: ['부분적분을 두 번 적용해 차수를 내린다.', '중간 결과에 $\\int xe^{x}dx$ 가 나온다.'],
      steps: ['$x^{2}e^{x}-2\\int xe^{x}dx$', '$\\int xe^{x}dx=(x-1)e^{x}$', '$(x^{2}-2x+2)e^{x}$']
    },
    {
      id: 'm23', topic: '부분분수',
      integrand: '(3x+5)/((x+1)(x+2))', latex: '\\dfrac{3x+5}{(x+1)(x+2)}',
      answer: '2ln(x+1)+ln(x+2)', answerLatex: '2\\ln|x+1|+\\ln|x+2|+C',
      domain: [0.2, 3.0],
      hints: ['$\\dfrac{A}{x+1}+\\dfrac{B}{x+2}$ 로 분해한다.', '$x=-1,\\;x=-2$ 를 대입해 $A,B$ 를 구한다.'],
      steps: ['$3x+5=A(x+2)+B(x+1)$', '$A=2,\\;B=1$', '$2\\ln|x+1|+\\ln|x+2|$']
    },
    {
      id: 'm24', topic: '치환적분',
      integrand: 'cos(x)/(1+sin(x)^2)', latex: '\\dfrac{\\cos x}{1+\\sin^{2}x}',
      answer: 'atan(sin(x))', answerLatex: '\\arctan(\\sin x)+C',
      domain: [0.1, 1.4],
      hints: ['$u=\\sin x$ 로 두면 $du=\\cos x\\,dx$ 다.', '남은 적분은 $\\arctan$ 형태다.'],
      steps: ['$u=\\sin x$', '$\\int\\frac{du}{1+u^{2}}=\\arctan(\\sin x)$']
    }
  ];

  var HARD = [
    {
      id: 'h01', topic: '순환 부분적분',
      integrand: 'e^(2x)*sin(3x)', latex: 'e^{2x}\\sin 3x',
      answer: 'e^(2x)*(2sin(3x)-3cos(3x))/13', answerLatex: '\\dfrac{e^{2x}\\left(2\\sin 3x-3\\cos 3x\\right)}{13}+C',
      domain: [0.05, 1.2],
      hints: ['부분적분 두 번 뒤 원래 적분 $I$ 가 다시 나온다.', '분모는 $2^{2}+3^{2}=13$ 이 된다.'],
      steps: ['$I=\\int e^{2x}\\sin 3x\\,dx$', '두 번 부분적분하여 $I$ 에 대한 식을 만든다', '$I=\\frac{e^{2x}(2\\sin 3x-3\\cos 3x)}{13}$']
    },
    {
      id: 'h02', topic: '삼각함수 고급',
      integrand: 'sec(x)^3', latex: '\\sec^{3}x',
      answer: '(sec(x)tan(x)+ln(sec(x)+tan(x)))/2', answerLatex: '\\dfrac{\\sec x\\tan x+\\ln|\\sec x+\\tan x|}{2}+C',
      domain: [0.2, 1.1],
      hints: ['$\\sec^{3}x=\\sec x\\cdot\\sec^{2}x$ 로 나눠 부분적분한다.', '$\\int\\sec x\\,dx$ 결과가 필요하다.'],
      steps: ['$u=\\sec x,\\;dv=\\sec^{2}x\\,dx$', '$I=\\sec x\\tan x-\\int \\sec x\\tan^{2}x\\,dx$', '$2I=\\sec x\\tan x+\\ln|\\sec x+\\tan x|$']
    },
    {
      id: 'h03', topic: '완전제곱',
      integrand: '1/(x^2+x+1)', latex: '\\dfrac{1}{x^{2}+x+1}',
      answer: '(2/sqrt(3))atan((2x+1)/sqrt(3))', answerLatex: '\\dfrac{2}{\\sqrt{3}}\\arctan\\dfrac{2x+1}{\\sqrt{3}}+C',
      domain: [-1.0, 2.5],
      hints: ['분모를 $\\left(x+\\frac12\\right)^{2}+\\frac34$ 로 완전제곱한다.', '$a=\\dfrac{\\sqrt3}{2}$ 인 $\\arctan$ 형태다.'],
      steps: ['$x^{2}+x+1=\\left(x+\\frac{1}{2}\\right)^{2}+\\frac{3}{4}$', '$\\frac{1}{a}\\arctan\\frac{u}{a},\\;a=\\frac{\\sqrt3}{2}$', '$\\frac{2}{\\sqrt3}\\arctan\\frac{2x+1}{\\sqrt3}$']
    },
    {
      id: 'h04', topic: '삼각치환',
      integrand: 'sqrt(1-x^2)', latex: '\\sqrt{1-x^{2}}',
      answer: '(x*sqrt(1-x^2)+asin(x))/2', answerLatex: '\\dfrac{x\\sqrt{1-x^{2}}+\\arcsin x}{2}+C',
      domain: [-0.8, 0.8],
      hints: ['$x=\\sin\\theta$ 로 치환한다.', '$\\cos^{2}\\theta$ 는 반각공식으로 처리한다.'],
      steps: ['$x=\\sin\\theta,\\;dx=\\cos\\theta\\,d\\theta$', '$\\int\\cos^{2}\\theta\\,d\\theta=\\frac{\\theta}{2}+\\frac{\\sin 2\\theta}{4}$', '$=\\frac{\\arcsin x+x\\sqrt{1-x^{2}}}{2}$']
    },
    {
      id: 'h05', topic: '삼각치환',
      integrand: 'x^2/sqrt(1-x^2)', latex: '\\dfrac{x^{2}}{\\sqrt{1-x^{2}}}',
      answer: '(asin(x)-x*sqrt(1-x^2))/2', answerLatex: '\\dfrac{\\arcsin x-x\\sqrt{1-x^{2}}}{2}+C',
      domain: [-0.8, 0.8],
      hints: ['$x=\\sin\\theta$ 로 두면 $\\int\\sin^{2}\\theta\\,d\\theta$ 가 된다.', '반각공식을 쓴 뒤 다시 $x$ 로 되돌린다.'],
      steps: ['$x=\\sin\\theta$', '$\\int\\sin^{2}\\theta\\,d\\theta=\\frac{\\theta}{2}-\\frac{\\sin 2\\theta}{4}$', '$=\\frac{\\arcsin x-x\\sqrt{1-x^{2}}}{2}$']
    },
    {
      id: 'h06', topic: '지수 유리식',
      integrand: '1/(1+e^x)', latex: '\\dfrac{1}{1+e^{x}}',
      answer: 'x-ln(1+e^x)', answerLatex: 'x-\\ln(1+e^{x})+C',
      domain: [-1.5, 2.0],
      hints: ['$\\dfrac{1}{1+e^{x}}=1-\\dfrac{e^{x}}{1+e^{x}}$ 로 쪼갠다.', '두 번째 항은 $\\ln$ 형태다.'],
      steps: ['$\\frac{1}{1+e^{x}}=1-\\frac{e^{x}}{1+e^{x}}$', '$\\int = x-\\ln(1+e^{x})$']
    },
    {
      id: 'h07', topic: '부분분수',
      integrand: '1/(x^3+x)', latex: '\\dfrac{1}{x^{3}+x}',
      answer: 'ln(x)-ln(x^2+1)/2', answerLatex: '\\ln|x|-\\dfrac{1}{2}\\ln(x^{2}+1)+C',
      domain: [0.3, 3.0],
      hints: ['$x(x^{2}+1)$ 로 인수분해한다.', '$\\dfrac{1}{x}-\\dfrac{x}{x^{2}+1}$ 이 된다.'],
      steps: ['$\\frac{1}{x(x^{2}+1)}=\\frac{1}{x}-\\frac{x}{x^{2}+1}$', '$\\int = \\ln|x|-\\frac{1}{2}\\ln(x^{2}+1)$']
    },
    {
      id: 'h08', topic: '부분적분',
      integrand: 'ln(x^2+1)', latex: '\\ln(x^{2}+1)',
      answer: 'x*ln(x^2+1)-2x+2atan(x)', answerLatex: 'x\\ln(x^{2}+1)-2x+2\\arctan x+C',
      domain: [0.1, 2.5],
      hints: ['$dv=dx$ 로 두고 부분적분한다.', '남는 적분 $\\int\\dfrac{2x^{2}}{x^{2}+1}dx$ 를 나눗셈으로 처리한다.'],
      steps: ['$u=\\ln(x^{2}+1),\\;dv=dx$', '$x\\ln(x^{2}+1)-\\int\\frac{2x^{2}}{x^{2}+1}dx$', '$\\frac{2x^{2}}{x^{2}+1}=2-\\frac{2}{x^{2}+1}$']
    },
    {
      id: 'h09', topic: '부분적분',
      integrand: 'x*atan(x)', latex: 'x\\arctan x',
      answer: '(x^2+1)atan(x)/2-x/2', answerLatex: '\\dfrac{(x^{2}+1)\\arctan x}{2}-\\dfrac{x}{2}+C',
      domain: [0.1, 2.5],
      hints: ['$v=\\dfrac{x^{2}+1}{2}$ 로 잡으면 계산이 깔끔해진다.', '적분상수를 $v$ 에 넣는 기술이다.'],
      steps: ['$u=\\arctan x,\\;v=\\frac{x^{2}+1}{2}$', '$\\frac{(x^{2}+1)\\arctan x}{2}-\\int\\frac{1}{2}dx$']
    },
    {
      id: 'h10', topic: '치환+부분적분',
      integrand: 'sin(ln(x))', latex: '\\sin(\\ln x)',
      answer: 'x*(sin(ln(x))-cos(ln(x)))/2', answerLatex: '\\dfrac{x\\left(\\sin(\\ln x)-\\cos(\\ln x)\\right)}{2}+C',
      domain: [0.3, 4.0],
      hints: ['$t=\\ln x$ 로 두면 $\\int e^{t}\\sin t\\,dt$ 가 된다.', '순환 부분적분 결과를 되돌린다.'],
      steps: ['$t=\\ln x,\\;dx=e^{t}dt$', '$\\int e^{t}\\sin t\\,dt=\\frac{e^{t}(\\sin t-\\cos t)}{2}$', '$=\\frac{x(\\sin(\\ln x)-\\cos(\\ln x))}{2}$']
    },
    {
      id: 'h11', topic: '유리화 치환',
      integrand: 'sqrt(x)/(1+x)', latex: '\\dfrac{\\sqrt{x}}{1+x}',
      answer: '2sqrt(x)-2atan(sqrt(x))', answerLatex: '2\\sqrt{x}-2\\arctan\\sqrt{x}+C',
      domain: [0.2, 4.0],
      hints: ['$t=\\sqrt{x}$ 로 두면 $dx=2t\\,dt$ 다.', '$\\dfrac{t^{2}}{1+t^{2}}=1-\\dfrac{1}{1+t^{2}}$'],
      steps: ['$t=\\sqrt{x},\\;dx=2t\\,dt$', '$2\\int\\frac{t^{2}}{1+t^{2}}dt=2t-2\\arctan t$', '$=2\\sqrt{x}-2\\arctan\\sqrt{x}$']
    },
    {
      id: 'h12', topic: '삼각함수 고급',
      integrand: '1/(sin(x)cos(x))', latex: '\\dfrac{1}{\\sin x\\cos x}',
      answer: 'ln(tan(x))', answerLatex: '\\ln|\\tan x|+C',
      domain: [0.3, 1.2],
      hints: ['분모·분자에 $\\dfrac{1}{\\cos^{2}x}$ 를 곱해 본다.', '$\\dfrac{\\sec^{2}x}{\\tan x}$ 형태가 된다.'],
      steps: ['$\\frac{1}{\\sin x\\cos x}=\\frac{\\sec^{2}x}{\\tan x}$', '$u=\\tan x$', '$\\ln|\\tan x|$']
    },
    {
      id: 'h13', topic: '치환적분',
      integrand: 'x^3/sqrt(x^2+1)', latex: '\\dfrac{x^{3}}{\\sqrt{x^{2}+1}}',
      answer: '(x^2+1)^(3/2)/3-sqrt(x^2+1)', answerLatex: '\\dfrac{(x^{2}+1)^{3/2}}{3}-\\sqrt{x^{2}+1}+C',
      domain: [0.1, 2.5],
      hints: ['$u=x^{2}+1$ 이면 $x^{2}=u-1$ 이다.', '$\\dfrac{1}{2}\\int\\dfrac{u-1}{\\sqrt{u}}du$ 를 계산한다.'],
      steps: ['$u=x^{2}+1,\\;du=2x\\,dx$', '$\\frac{1}{2}\\int (u^{1/2}-u^{-1/2})du$', '$=\\frac{u^{3/2}}{3}-u^{1/2}$']
    },
    {
      id: 'h14', topic: '치환+부분적분',
      integrand: 'e^(sqrt(x))', latex: 'e^{\\sqrt{x}}',
      answer: '2e^(sqrt(x))*(sqrt(x)-1)', answerLatex: '2e^{\\sqrt{x}}\\left(\\sqrt{x}-1\\right)+C',
      domain: [0.2, 3.0],
      hints: ['$t=\\sqrt{x},\\;dx=2t\\,dt$ 로 치환한다.', '남은 $\\int te^{t}dt$ 는 부분적분이다.'],
      steps: ['$t=\\sqrt{x},\\;dx=2t\\,dt$', '$2\\int te^{t}dt=2(t-1)e^{t}$', '$=2e^{\\sqrt{x}}(\\sqrt{x}-1)$']
    },
    {
      id: 'h15', topic: '삼각함수 홀수차',
      integrand: 'tan(x)^3', latex: '\\tan^{3}x',
      answer: 'tan(x)^2/2+ln(cos(x))', answerLatex: '\\dfrac{\\tan^{2}x}{2}+\\ln|\\cos x|+C',
      domain: [0.2, 1.2],
      hints: ['$\\tan^{3}x=\\tan x(\\sec^{2}x-1)$', '첫 항은 $u=\\tan x$ 치환이다.'],
      steps: ['$\\tan^{3}x=\\tan x\\sec^{2}x-\\tan x$', '$\\int\\tan x\\sec^{2}x\\,dx=\\frac{\\tan^{2}x}{2}$', '$-\\int\\tan x\\,dx=\\ln|\\cos x|$']
    },
    {
      id: 'h16', topic: '삼각치환',
      integrand: '1/(x^2*sqrt(x^2-1))', latex: '\\dfrac{1}{x^{2}\\sqrt{x^{2}-1}}',
      answer: 'sqrt(x^2-1)/x', answerLatex: '\\dfrac{\\sqrt{x^{2}-1}}{x}+C',
      domain: [1.3, 4.0],
      hints: ['$x=\\sec\\theta$ 로 치환한다.', '결과가 $\\sin\\theta$ 가 되어 되돌리면 간단해진다.'],
      steps: ['$x=\\sec\\theta,\\;dx=\\sec\\theta\\tan\\theta\\,d\\theta$', '$\\int\\cos\\theta\\,d\\theta=\\sin\\theta$', '$=\\frac{\\sqrt{x^{2}-1}}{x}$']
    },
    {
      id: 'h17', topic: '부분적분',
      integrand: 'x*sec(x)^2', latex: 'x\\sec^{2}x',
      answer: 'x*tan(x)+ln(cos(x))', answerLatex: 'x\\tan x+\\ln|\\cos x|+C',
      domain: [0.2, 1.2],
      hints: ['$u=x,\\;dv=\\sec^{2}x\\,dx$', '남은 $\\int\\tan x\\,dx$ 를 처리한다.'],
      steps: ['$u=x,\\;v=\\tan x$', '$x\\tan x-\\int\\tan x\\,dx$', '$=x\\tan x+\\ln|\\cos x|$']
    },
    {
      id: 'h18', topic: '치환적분',
      integrand: 'sin(x)/(1+cos(x)^2)', latex: '\\dfrac{\\sin x}{1+\\cos^{2}x}',
      answer: '-atan(cos(x))', answerLatex: '-\\arctan(\\cos x)+C',
      domain: [0.2, 2.8],
      hints: ['$u=\\cos x$ 로 두면 $du=-\\sin x\\,dx$ 다.', '부호에 주의한다.'],
      steps: ['$u=\\cos x$', '$-\\int\\frac{du}{1+u^{2}}=-\\arctan(\\cos x)$']
    },
    {
      id: 'h19', topic: '치환적분',
      integrand: 'x/(x^4+1)', latex: '\\dfrac{x}{x^{4}+1}',
      answer: 'atan(x^2)/2', answerLatex: '\\dfrac{1}{2}\\arctan(x^{2})+C',
      domain: [0.1, 2.5],
      hints: ['$x^{4}=(x^{2})^{2}$ 임을 이용해 $u=x^{2}$ 로 둔다.', '$du=2x\\,dx$ 가 분자와 맞는다.'],
      steps: ['$u=x^{2},\\;du=2x\\,dx$', '$\\frac{1}{2}\\int\\frac{du}{1+u^{2}}=\\frac{\\arctan(x^{2})}{2}$']
    },
    {
      id: 'h20', topic: '부분분수',
      integrand: '1/(x^2*(x+1))', latex: '\\dfrac{1}{x^{2}(x+1)}',
      answer: '-1/x-ln(x)+ln(x+1)', answerLatex: '-\\dfrac{1}{x}-\\ln|x|+\\ln|x+1|+C',
      domain: [0.4, 3.0],
      hints: ['$\\dfrac{A}{x}+\\dfrac{B}{x^{2}}+\\dfrac{D}{x+1}$ 로 분해한다.', '$A=-1,\\;B=1,\\;D=1$ 이다.'],
      steps: ['$1=Ax(x+1)+B(x+1)+Dx^{2}$', '$A=-1,\\;B=1,\\;D=1$', '$-\\ln|x|-\\frac{1}{x}+\\ln|x+1|$']
    }
  ];

  var ALL = [].concat(EASY, MEDIUM, HARD);
  var BY_LEVEL = { easy: EASY, medium: MEDIUM, hard: HARD };

  return {
    easy: EASY, medium: MEDIUM, hard: HARD,
    all: ALL, byLevel: BY_LEVEL,
    levels: ['easy', 'medium', 'hard'],
    labels: { easy: '쉬움', medium: '보통', hard: '어려움' },
    find: function (id) {
      for (var i = 0; i < ALL.length; i++) if (ALL[i].id === id) return ALL[i];
      return null;
    }
  };
});
