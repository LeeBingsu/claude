/* ============================================================
   AETHER BLADE  —  utils.js
   수학 / 난수 / 노이즈 / 보간 유틸리티
   ============================================================ */
(function (global) {
  'use strict';
  const AB = (global.AB = global.AB || {});

  const U = {
    TAU: Math.PI * 2,
    DEG: Math.PI / 180,

    clamp(v, a, b) { return v < a ? a : v > b ? b : v; },
    clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; },
    lerp(a, b, t) { return a + (b - a) * t; },
    inv(a, b, v) { return b === a ? 0 : (v - a) / (b - a); },
    /** 프레임 독립적인 지수 감쇠 보간 */
    damp(a, b, lambda, dt) { return U.lerp(a, b, 1 - Math.exp(-lambda * dt)); },
    /** -PI..PI 로 정규화 */
    wrapPI(a) {
      while (a > Math.PI) a -= U.TAU;
      while (a < -Math.PI) a += U.TAU;
      return a;
    },
    angleLerp(a, b, t) { return a + U.wrapPI(b - a) * t; },
    angleDamp(a, b, lambda, dt) { return a + U.wrapPI(b - a) * (1 - Math.exp(-lambda * dt)); },

    rand(a, b) { return a + Math.random() * (b - a); },
    randInt(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); },
    pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    chance(p) { return Math.random() < p; },

    // ---- 이징 ----
    easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); },
    easeInCubic(t) { return t * t * t; },
    easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
    easeOutBack(t) { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
    easeOutElastic(t) {
      const c4 = U.TAU / 3;
      return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    },
    easeOutQuint(t) { return 1 - Math.pow(1 - t, 5); },
    /** 0에서 올라갔다 0으로 내려오는 펄스 */
    pulse(t) { return Math.sin(U.clamp01(t) * Math.PI); },

    // ---- 시드 난수 (mulberry32) ----
    makeRNG(seed) {
      let a = seed >>> 0;
      return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    },

    /** 문자열 -> 32bit 해시 (시드용) */
    hash(str) {
      let h = 2166136261 >>> 0;
      for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return h >>> 0;
    },

    format(n) {
      n = Math.round(n);
      return n >= 10000 ? (n / 1000).toFixed(1) + 'k' : String(n);
    },
  };

  /* ------------------------------------------------------------
     2D 값 노이즈 (지형 생성용). 격자 보간 + 옥타브 합성.
     ------------------------------------------------------------ */
  class ValueNoise {
    constructor(seed = 1337) {
      this.perm = new Uint8Array(512);
      const rng = U.makeRNG(seed);
      const p = new Uint8Array(256);
      for (let i = 0; i < 256; i++) p[i] = i;
      for (let i = 255; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        const t = p[i]; p[i] = p[j]; p[j] = t;
      }
      for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255];
    }
    _g(ix, iy) {
      return this.perm[(ix & 255) + this.perm[iy & 255]] / 255 * 2 - 1;
    }
    noise2(x, y) {
      const ix = Math.floor(x), iy = Math.floor(y);
      const fx = x - ix, fy = y - iy;
      const ux = fx * fx * (3 - 2 * fx);
      const uy = fy * fy * (3 - 2 * fy);
      const a = this._g(ix, iy), b = this._g(ix + 1, iy);
      const c = this._g(ix, iy + 1), d = this._g(ix + 1, iy + 1);
      return U.lerp(U.lerp(a, b, ux), U.lerp(c, d, ux), uy);
    }
    fbm(x, y, octaves = 4, lac = 2.0, gain = 0.5) {
      let amp = 1, freq = 1, sum = 0, norm = 0;
      for (let i = 0; i < octaves; i++) {
        sum += this.noise2(x * freq, y * freq) * amp;
        norm += amp;
        amp *= gain; freq *= lac;
      }
      return sum / norm;
    }
  }

  U.ValueNoise = ValueNoise;

  /* ------------------------------------------------------------
     오브젝트 풀 — GC 스파이크 방지
     ------------------------------------------------------------ */
  class Pool {
    constructor(factory, reset, size = 16) {
      this.factory = factory; this.reset = reset;
      this.free = []; this.used = [];
      for (let i = 0; i < size; i++) this.free.push(factory());
    }
    get() {
      const o = this.free.pop() || this.factory();
      this.used.push(o);
      return o;
    }
    release(o) {
      const i = this.used.indexOf(o);
      if (i >= 0) this.used.splice(i, 1);
      if (this.reset) this.reset(o);
      this.free.push(o);
    }
  }
  U.Pool = Pool;

  AB.U = U;
})(window);
