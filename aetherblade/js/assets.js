/* ============================================================
   AETHER BLADE  —  assets.js
   외부 파일 없이 캔버스/코드로 생성하는 텍스처·머티리얼·사운드
   ============================================================ */
(function (global) {
  'use strict';
  const AB = global.AB, U = AB.U;

  const Assets = {
    tex: {},
    mat: {},
    gradient: {},
  };

  /* ---------- 캔버스 헬퍼 ---------- */
  function canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }
  function toTexture(c, repeat) {
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    if (repeat) t.repeat.set(repeat, repeat);
    t.anisotropy = 4;
    return t;
  }

  /* ---------- 툰 셰이딩용 그라디언트 맵 ---------- */
  function gradientMap(stops) {
    const c = canvas(stops.length, 1);
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(stops.length, 1);
    for (let i = 0; i < stops.length; i++) {
      const v = Math.round(stops[i] * 255);
      img.data[i * 4 + 0] = v;
      img.data[i * 4 + 1] = v;
      img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.minFilter = t.magFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    return t;
  }

  /* ---------- 지면 텍스처 (풀 + 흙 얼룩) ---------- */
  function groundTexture() {
    const S = 512, c = canvas(S, S), ctx = c.getContext('2d');
    ctx.fillStyle = '#4a6b3f';
    ctx.fillRect(0, 0, S, S);
    const rng = U.makeRNG(9182);
    // 큰 색 얼룩
    for (let i = 0; i < 220; i++) {
      const x = rng() * S, y = rng() * S, r = 12 + rng() * 60;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      const t = rng();
      const col = t < 0.4 ? '86,110,64' : t < 0.75 ? '60,84,50' : '104,96,62';
      g.addColorStop(0, `rgba(${col},${0.20 + rng() * 0.25})`);
      g.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, U.TAU); ctx.fill();
    }
    // 풀 결
    for (let i = 0; i < 4200; i++) {
      const x = rng() * S, y = rng() * S, len = 3 + rng() * 7;
      ctx.strokeStyle = `rgba(${120 + rng() * 60 | 0},${150 + rng() * 60 | 0},${70 + rng() * 40 | 0},${0.10 + rng() * 0.22})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (rng() - 0.5) * 3, y - len);
      ctx.stroke();
    }
    return toTexture(c, 86);
  }

  /* ---------- 바위 텍스처 ---------- */
  function rockTexture() {
    const S = 256, c = canvas(S, S), ctx = c.getContext('2d');
    ctx.fillStyle = '#6d6a73';
    ctx.fillRect(0, 0, S, S);
    const rng = U.makeRNG(4471);
    for (let i = 0; i < 900; i++) {
      const x = rng() * S, y = rng() * S, r = 2 + rng() * 22;
      const v = 90 + rng() * 70 | 0;
      ctx.fillStyle = `rgba(${v},${v - 4},${v + 8},${0.06 + rng() * 0.13})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, U.TAU); ctx.fill();
    }
    for (let i = 0; i < 60; i++) { // 균열
      ctx.strokeStyle = `rgba(52,50,58,${0.07 + rng() * 0.10})`;
      ctx.lineWidth = 0.6 + rng() * 1.4;
      ctx.beginPath();
      let x = rng() * S, y = rng() * S;
      ctx.moveTo(x, y);
      for (let s = 0; s < 5; s++) {
        x += (rng() - 0.5) * 50; y += (rng() - 0.5) * 50;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    return toTexture(c, 3);
  }

  /* ---------- 나무 껍질 ---------- */
  function barkTexture() {
    const S = 128, c = canvas(S, S), ctx = c.getContext('2d');
    ctx.fillStyle = '#5b4530';
    ctx.fillRect(0, 0, S, S);
    const rng = U.makeRNG(777);
    for (let i = 0; i < 260; i++) {
      const x = rng() * S;
      ctx.strokeStyle = `rgba(${30 + rng() * 60 | 0},${20 + rng() * 40 | 0},${14 + rng() * 26 | 0},0.35)`;
      ctx.lineWidth = 1 + rng() * 3;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + (rng() - 0.5) * 14, S); ctx.stroke();
    }
    return toTexture(c, 2);
  }

  /* ---------- 하늘 (그라디언트 + 성운) ---------- */
  function skyTexture() {
    const W = 1024, H = 512, c = canvas(W, H), ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0.00, '#0d1030');
    g.addColorStop(0.30, '#26305e');
    g.addColorStop(0.55, '#6b5a86');
    g.addColorStop(0.72, '#c98a76');
    g.addColorStop(0.85, '#e8b78c');
    g.addColorStop(1.00, '#4a4160');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const rng = U.makeRNG(20240);
    // 성운
    for (let i = 0; i < 40; i++) {
      const x = rng() * W, y = rng() * H * 0.45, r = 60 + rng() * 220;
      const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, `rgba(${120 + rng() * 80 | 0},${90 + rng() * 60 | 0},${190 + rng() * 60 | 0},0.10)`);
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(x, y, r, 0, U.TAU); ctx.fill();
    }
    // 별
    for (let i = 0; i < 500; i++) {
      const x = rng() * W, y = rng() * H * 0.5;
      const a = (1 - y / (H * 0.5)) * rng() * 0.9;
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.fillRect(x, y, rng() < 0.1 ? 2 : 1, rng() < 0.1 ? 2 : 1);
    }
    // 구름 띠
    for (let i = 0; i < 26; i++) {
      const y = H * (0.5 + rng() * 0.3);
      const x = rng() * W, w = 120 + rng() * 380, h = 8 + rng() * 26;
      ctx.fillStyle = `rgba(255,${200 + rng() * 40 | 0},${180 + rng() * 50 | 0},${0.05 + rng() * 0.12})`;
      ctx.beginPath();
      ctx.ellipse(x, y, w, h, 0, 0, U.TAU);
      ctx.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.mapping = THREE.EquirectangularReflectionMapping;
    return t;
  }

  /* ---------- 파티클 스프라이트 ---------- */
  function sparkTexture() {
    const S = 64, c = canvas(S, S), ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(255,255,255,0.65)');
    g.addColorStop(0.6, 'rgba(255,255,255,0.16)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
    return new THREE.CanvasTexture(c);
  }

  /** 혈흔 스플랫 (성인 등급 액션 연출용) */
  function bloodTexture() {
    const S = 128, c = canvas(S, S), ctx = c.getContext('2d');
    const rng = U.makeRNG(6613);
    ctx.translate(S / 2, S / 2);
    // 중심 얼룩 — 불규칙한 다각형
    ctx.beginPath();
    const N = 18;
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * U.TAU;
      const r = S * (0.20 + rng() * 0.16);
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fill();
    // 튄 방울
    for (let i = 0; i < 30; i++) {
      const a = rng() * U.TAU;
      const d = S * (0.24 + rng() * 0.24);
      const r = 1.5 + rng() * 5;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * d, Math.sin(a) * d, r, r * (0.5 + rng()), a, 0, U.TAU);
      ctx.fillStyle = `rgba(255,255,255,${0.35 + rng() * 0.5})`;
      ctx.fill();
    }
    // 가장자리 페이드
    const g = ctx.createRadialGradient(0, 0, S * 0.30, 0, 0, S * 0.5);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = g;
    ctx.fillRect(-S / 2, -S / 2, S, S);
    ctx.globalCompositeOperation = 'source-over';
    return new THREE.CanvasTexture(c);
  }

  /** 부드러운 원형 그림자 */
  function shadowTexture() {
    const S = 128, c = canvas(S, S), ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0, 'rgba(0,0,0,0.55)');
    g.addColorStop(0.55, 'rgba(0,0,0,0.28)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
    return new THREE.CanvasTexture(c);
  }

  /** 슬래시 궤적용 그라디언트 (가로 방향으로 페이드) */
  function trailTexture() {
    const W = 128, H = 16, c = canvas(W, H), ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.45, 'rgba(255,255,255,0.85)');
    g.addColorStop(1, 'rgba(255,255,255,1)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // 위/아래 페이드
    const v = ctx.createLinearGradient(0, 0, 0, H);
    v.addColorStop(0, 'rgba(0,0,0,1)');
    v.addColorStop(0.5, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    return new THREE.CanvasTexture(c);
  }

  /** 바닥 원형 마법진 (스킬 인디케이터) */
  function runeTexture() {
    const S = 256, c = canvas(S, S), ctx = c.getContext('2d');
    ctx.translate(S / 2, S / 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, S * 0.45, 0, U.TAU); ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, 0, S * 0.38, 0, U.TAU); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, S * 0.16, 0, U.TAU); ctx.stroke();
    // 룬 눈금
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * U.TAU;
      const r0 = i % 3 === 0 ? S * 0.30 : S * 0.34;
      ctx.lineWidth = i % 3 === 0 ? 3 : 1.5;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
      ctx.lineTo(Math.cos(a) * S * 0.38, Math.sin(a) * S * 0.38);
      ctx.stroke();
    }
    // 삼각형
    ctx.lineWidth = 2;
    for (let k = 0; k < 2; k++) {
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * U.TAU + k * Math.PI / 3;
        const x = Math.cos(a) * S * 0.28, y = Math.sin(a) * S * 0.28;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.closePath(); ctx.stroke();
    }
    return new THREE.CanvasTexture(c);
  }

  /* ---------- 캐릭터 초상화 (HUD 용) ---------- */
  Assets.portrait = function (cfg) {
    const S = 96, c = canvas(S, S), ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, S);
    g.addColorStop(0, cfg.portraitTop || '#2c3050');
    g.addColorStop(1, cfg.portraitBottom || '#12141f');
    ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
    // 원소 글로우
    const rg = ctx.createRadialGradient(S / 2, S * 0.62, 4, S / 2, S * 0.62, S * 0.7);
    rg.addColorStop(0, cfg.elementColorCss + 'cc');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg; ctx.fillRect(0, 0, S, S);
    // 머리
    ctx.fillStyle = cfg.skinCss;
    ctx.beginPath(); ctx.ellipse(S / 2, S * 0.46, S * 0.17, S * 0.21, 0, 0, U.TAU); ctx.fill();
    // 머리카락
    ctx.fillStyle = cfg.hairCss;
    ctx.beginPath();
    ctx.ellipse(S / 2, S * 0.36, S * 0.21, S * 0.19, 0, Math.PI, U.TAU);
    ctx.fill();
    ctx.beginPath(); ctx.moveTo(S * 0.29, S * 0.36);
    ctx.quadraticCurveTo(S * 0.20, S * 0.62, S * 0.30, S * 0.72);
    ctx.lineTo(S * 0.36, S * 0.44); ctx.fill();
    ctx.beginPath(); ctx.moveTo(S * 0.71, S * 0.36);
    ctx.quadraticCurveTo(S * 0.80, S * 0.62, S * 0.70, S * 0.72);
    ctx.lineTo(S * 0.64, S * 0.44); ctx.fill();
    // 눈
    ctx.fillStyle = cfg.elementColorCss;
    ctx.fillRect(S * 0.41, S * 0.46, S * 0.055, S * 0.05);
    ctx.fillRect(S * 0.535, S * 0.46, S * 0.055, S * 0.05);
    // 몸통 (옷)
    ctx.fillStyle = cfg.coatCss;
    ctx.beginPath();
    ctx.moveTo(S * 0.5, S * 0.62);
    ctx.lineTo(S * 0.86, S * 0.92);
    ctx.lineTo(S * 0.14, S * 0.92);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = cfg.trimCss;
    ctx.fillRect(0, S - 4, S, 4);
    return c.toDataURL();
  };

  /* ============================================================
     오디오 — WebAudio 로 즉석 합성 (외부 사운드 파일 없음)
     ============================================================ */
  class SFX {
    constructor() {
      this.ctx = null;
      this.master = null;
      this.musicGain = null;
      this.enabled = true;
      this.volume = 0.7;
      this._musicTimer = null;
    }
    init() {
      if (this.ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { this.enabled = false; return; }
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      // 약간의 리버브 대용 — 짧은 노이즈 컨볼루션
      this.conv = this.ctx.createConvolver();
      this.conv.buffer = this._impulse(1.6, 2.2);
      this.wet = this.ctx.createGain(); this.wet.gain.value = 0.18;
      this.master.connect(this.ctx.destination);
      this.wet.connect(this.conv); this.conv.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.22;
      this.musicGain.connect(this.master);
    }
    resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }
    _impulse(dur, decay) {
      const rate = this.ctx.sampleRate, len = rate * dur;
      const buf = this.ctx.createBuffer(2, len, rate);
      for (let ch = 0; ch < 2; ch++) {
        const d = buf.getChannelData(ch);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
      return buf;
    }
    _noiseBuf(dur) {
      const rate = this.ctx.sampleRate, len = Math.max(1, rate * dur | 0);
      const buf = this.ctx.createBuffer(1, len, rate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      return buf;
    }
    /** 기본 톤 */
    tone(opt) {
      if (!this.enabled || !this.ctx) return;
      const t = this.ctx.currentTime + (opt.delay || 0);
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = opt.type || 'sine';
      o.frequency.setValueAtTime(opt.f0, t);
      if (opt.f1 != null) o.frequency.exponentialRampToValueAtTime(Math.max(1, opt.f1), t + opt.dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(opt.gain || 0.2, t + (opt.atk || 0.008));
      g.gain.exponentialRampToValueAtTime(0.0001, t + opt.dur);
      o.connect(g); g.connect(this.master);
      if (opt.reverb) g.connect(this.wet);
      o.start(t); o.stop(t + opt.dur + 0.05);
    }
    /** 노이즈 버스트 (임팩트/휘두름) */
    noise(opt) {
      if (!this.enabled || !this.ctx) return;
      const t = this.ctx.currentTime + (opt.delay || 0);
      const src = this.ctx.createBufferSource();
      src.buffer = this._noiseBuf(opt.dur + 0.05);
      const f = this.ctx.createBiquadFilter();
      f.type = opt.filter || 'bandpass';
      f.frequency.setValueAtTime(opt.f0, t);
      if (opt.f1 != null) f.frequency.exponentialRampToValueAtTime(Math.max(20, opt.f1), t + opt.dur);
      f.Q.value = opt.q || 1.2;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(opt.gain || 0.25, t + (opt.atk || 0.005));
      g.gain.exponentialRampToValueAtTime(0.0001, t + opt.dur);
      src.connect(f); f.connect(g); g.connect(this.master);
      if (opt.reverb) g.connect(this.wet);
      src.start(t); src.stop(t + opt.dur + 0.05);
    }

    // ---- 게임 이벤트별 사운드 ----
    swing(power = 1) {
      this.noise({ f0: 900 * power, f1: 260, dur: 0.20, gain: 0.16, filter: 'bandpass', q: 0.9 });
    }
    hit(power = 1) {
      this.noise({ f0: 1800, f1: 200, dur: 0.13, gain: 0.24 * power, filter: 'lowpass', q: 1 });
      this.tone({ type: 'square', f0: 160 * power, f1: 55, dur: 0.14, gain: 0.13 });
    }
    crit() {
      this.tone({ type: 'sawtooth', f0: 880, f1: 200, dur: 0.22, gain: 0.16, reverb: true });
      this.noise({ f0: 3200, f1: 600, dur: 0.18, gain: 0.2 });
    }
    cast(el) {
      const base = el === 'ice' ? 720 : el === 'lightning' ? 520 : 380;
      this.tone({ type: 'triangle', f0: base, f1: base * 2.6, dur: 0.35, gain: 0.16, reverb: true });
      this.tone({ type: 'sine', f0: base * 1.5, f1: base * 3.2, dur: 0.4, gain: 0.09, delay: 0.05, reverb: true });
    }
    ult() {
      this.tone({ type: 'sawtooth', f0: 120, f1: 40, dur: 1.1, gain: 0.22, reverb: true });
      this.tone({ type: 'triangle', f0: 660, f1: 1320, dur: 0.7, gain: 0.14, reverb: true });
      this.noise({ f0: 200, f1: 4000, dur: 0.6, gain: 0.18, filter: 'bandpass' });
    }
    dash() { this.noise({ f0: 2600, f1: 400, dur: 0.22, gain: 0.13, filter: 'bandpass', q: 0.6 }); }
    jump() { this.tone({ type: 'sine', f0: 300, f1: 620, dur: 0.14, gain: 0.10 }); }
    land() { this.noise({ f0: 400, f1: 80, dur: 0.16, gain: 0.16, filter: 'lowpass' }); }
    hurt() {
      this.tone({ type: 'square', f0: 220, f1: 90, dur: 0.22, gain: 0.15 });
      this.noise({ f0: 700, f1: 120, dur: 0.2, gain: 0.14, filter: 'lowpass' });
    }
    die() {
      this.tone({ type: 'sawtooth', f0: 240, f1: 40, dur: 0.9, gain: 0.18, reverb: true });
    }
    pickup() {
      this.tone({ type: 'sine', f0: 880, dur: 0.09, gain: 0.12 });
      this.tone({ type: 'sine', f0: 1320, dur: 0.12, gain: 0.10, delay: 0.07 });
    }
    quest() {
      [523, 659, 784, 1047].forEach((f, i) =>
        this.tone({ type: 'triangle', f0: f, dur: 0.35, gain: 0.12, delay: i * 0.11, reverb: true }));
    }
    levelup() {
      [523, 659, 784, 1047, 1319].forEach((f, i) =>
        this.tone({ type: 'sine', f0: f, dur: 0.5, gain: 0.14, delay: i * 0.08, reverb: true }));
    }
    ui() { this.tone({ type: 'sine', f0: 1200, f1: 900, dur: 0.05, gain: 0.06 }); }
    reaction(kind) {
      if (kind === 'melt') { this.tone({ type: 'sawtooth', f0: 300, f1: 900, dur: 0.4, gain: 0.18, reverb: true }); }
      else if (kind === 'overload') { this.noise({ f0: 120, f1: 2400, dur: 0.45, gain: 0.24, filter: 'bandpass' }); }
      else { this.tone({ type: 'triangle', f0: 1400, f1: 500, dur: 0.35, gain: 0.14, reverb: true }); }
    }

    /* ---- 배경음: 절차적 탐험 앰비언트 (모드 전환 지원) ---- */
    startMusic(mode) {
      if (!this.ctx) return;
      mode = mode || 'explore';
      if (this._musicMode === mode && this._musicTimer) return;
      this.stopMusic();
      this._musicMode = mode;
      if (mode === 'boss') return this._startBossMusic();

      const scale = [0, 3, 5, 7, 10, 12, 15]; // 마이너 펜타토닉 계열
      const roots = [110, 98, 146.83, 130.81];
      let step = 0, rootIdx = 0;
      const tick = () => {
        if (!this.enabled) return;
        const root = roots[rootIdx];
        const t = this.ctx.currentTime;
        if (step % 8 === 0) {
          rootIdx = (rootIdx + (Math.random() < 0.5 ? 1 : 3)) % roots.length;
          [1, 1.5, 2.0].forEach((m) => {
            const o = this.ctx.createOscillator(), g = this.ctx.createGain();
            o.type = 'triangle';
            o.frequency.value = root * m;
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(0.05, t + 0.9);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 4.2);
            o.connect(g); g.connect(this.musicGain); g.connect(this.wet);
            o.start(t); o.stop(t + 4.4);
          });
        }
        if (Math.random() < 0.72) {
          const semi = scale[Math.floor(Math.random() * scale.length)] + (Math.random() < 0.3 ? 12 : 0);
          const f = root * 2 * Math.pow(2, semi / 12);
          const o = this.ctx.createOscillator(), g = this.ctx.createGain();
          o.type = 'sine';
          o.frequency.value = f;
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(0.045, t + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
          o.connect(g); g.connect(this.musicGain); g.connect(this.wet);
          o.start(t); o.stop(t + 1.6);
        }
        step++;
      };
      tick();
      this._musicTimer = setInterval(tick, 620);
    }

    /* ---- 보스전 BGM: 몰아치는 드럼 + 저음 오스티나토 + 현악 스탭 ---- */
    _startBossMusic() {
      const root = 55;                        // A1
      // 하행 단조 진행 (i - VI - VII - v)
      const chords = [[0, 3, 7], [-4, 0, 3], [-2, 2, 5], [-5, -1, 2]];
      const lead = [0, 5, 7, 10, 12, 15, 14, 12];
      let step = 0, bar = 0;
      const kick = (t, gain) => {
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(150, t);
        o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
        g.gain.setValueAtTime(gain || 0.5, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
        o.connect(g); g.connect(this.musicGain); o.start(t); o.stop(t + 0.26);
      };
      const snare = (t) => {
        const s = this.ctx.createBufferSource(); s.buffer = this._noiseBuf(0.2);
        const f = this.ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1400;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.28, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
        s.connect(f); f.connect(g); g.connect(this.musicGain); g.connect(this.wet);
        s.start(t); s.stop(t + 0.22);
      };
      const tick = () => {
        if (!this.enabled || !this.ctx) return;
        const t = this.ctx.currentTime;
        const beat = step % 8;
        // 드럼
        kick(t, beat === 0 ? 0.6 : beat === 3 || beat === 6 ? 0.42 : 0);
        if (beat === 2 || beat === 6) snare(t);
        // 저음 오스티나토 (16분 펄스)
        const chord = chords[bar % chords.length];
        const bf = root * Math.pow(2, chord[0] / 12);
        [0, 0.5].forEach(off => {
          const o = this.ctx.createOscillator(), g = this.ctx.createGain();
          o.type = 'sawtooth';
          o.frequency.value = bf;
          const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
          g.gain.setValueAtTime(0.0001, t + off * 0.24);
          g.gain.exponentialRampToValueAtTime(0.11, t + off * 0.24 + 0.01);
          g.gain.exponentialRampToValueAtTime(0.0001, t + off * 0.24 + 0.22);
          o.connect(lp); lp.connect(g); g.connect(this.musicGain);
          o.start(t + off * 0.24); o.stop(t + off * 0.24 + 0.24);
        });
        // 현악 패드 (마디 시작)
        if (beat === 0) {
          chord.forEach(semi => {
            const o = this.ctx.createOscillator(), g = this.ctx.createGain();
            o.type = 'sawtooth';
            o.frequency.value = root * 2 * Math.pow(2, semi / 12);
            const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1600;
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(0.03, t + 0.25);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 1.9);
            o.connect(lp); lp.connect(g); g.connect(this.musicGain); g.connect(this.wet);
            o.start(t); o.stop(t + 2.0);
          });
          bar++;
        }
        // 리드 모티프
        if (bar % 2 === 1 && (beat === 1 || beat === 4 || beat === 7)) {
          const semi = lead[step % lead.length];
          const o = this.ctx.createOscillator(), g = this.ctx.createGain();
          o.type = 'square';
          o.frequency.value = root * 4 * Math.pow(2, semi / 12);
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(0.05, t + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
          o.connect(g); g.connect(this.musicGain); g.connect(this.wet);
          o.start(t); o.stop(t + 0.55);
        }
        step++;
      };
      tick();
      this._musicTimer = setInterval(tick, 240);   // ~125 BPM 8분음
    }

    stopMusic() {
      if (this._musicTimer) { clearInterval(this._musicTimer); this._musicTimer = null; }
      this._musicMode = null;
    }
    /** 탐험 BGM 으로 전환 (보스 종료 시) */
    exploreMusic() { this.startMusic('explore'); }
    bossMusic() { this.startMusic('boss'); }

    /** 보스 포효 */
    roar() {
      if (!this.enabled || !this.ctx) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator(), o2 = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = 'sawtooth'; o2.type = 'square';
      o.frequency.setValueAtTime(150, t);
      o.frequency.exponentialRampToValueAtTime(46, t + 0.9);
      o2.frequency.setValueAtTime(76, t);
      o2.frequency.exponentialRampToValueAtTime(30, t + 0.9);
      const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass';
      lp.frequency.setValueAtTime(1400, t);
      lp.frequency.exponentialRampToValueAtTime(300, t + 0.9);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.34, t + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
      o.connect(lp); o2.connect(lp); lp.connect(g); g.connect(this.master); g.connect(this.wet);
      o.start(t); o2.start(t); o.stop(t + 1.15); o2.stop(t + 1.15);
      // 그르렁 노이즈
      this.noise({ f0: 200, f1: 900, dur: 0.8, gain: 0.18, filter: 'bandpass', q: 0.6 });
    }

    setVolume(v) { this.volume = v; if (this.master) this.master.gain.value = v; }
  }

  Assets.sfx = new SFX();

  /* ---------- 초기화 ---------- */
  Assets.init = function () {
    const T = Assets.tex;
    T.ground = groundTexture();
    T.rock = rockTexture();
    T.bark = barkTexture();
    T.sky = skyTexture();
    T.spark = sparkTexture();
    T.shadow = shadowTexture();
    T.blood = bloodTexture();
    T.trail = trailTexture();
    T.rune = runeTexture();

    Assets.gradient.three = gradientMap([0.28, 0.62, 1.0]);
    Assets.gradient.four = gradientMap([0.22, 0.48, 0.76, 1.0]);
    Assets.gradient.two = gradientMap([0.38, 1.0]);
    return Assets;
  };

  /** 큰 구조물용 바위 텍스처 (타일 반복 수를 다르게) */
  Assets.bigRock = function (repeat) {
    Assets._bigRock = Assets._bigRock || {};
    if (!Assets._bigRock[repeat]) {
      const t = Assets.tex.rock.clone();
      t.needsUpdate = true;
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(repeat, repeat);
      Assets._bigRock[repeat] = t;
    }
    return Assets._bigRock[repeat];
  };

  /* ---------- 머티리얼 팩토리 ---------- */
  Assets.toon = function (color, opts) {
    opts = opts || {};
    return new THREE.MeshToonMaterial(Object.assign({
      color: color,
      gradientMap: Assets.gradient[opts.bands || 'three'],
    }, opts.extra || {}));
  };
  Assets.emissive = function (color, intensity) {
    return new THREE.MeshBasicMaterial({ color: color, toneMapped: false });
  };
  /** 외곽선 셸용 머티리얼 (뒷면만 렌더) */
  Assets.outline = function (color) {
    return new THREE.MeshBasicMaterial({ color: color || 0x0b0d16, side: THREE.BackSide });
  };

  AB.Assets = Assets;
})(window);
