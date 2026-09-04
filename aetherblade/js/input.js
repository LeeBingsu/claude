/* ============================================================
   AETHER BLADE  —  input.js
   키보드/마우스 + 모바일 터치(가상 스틱·버튼) 통합 입력
   ============================================================ */
(function (global) {
  'use strict';
  const AB = global.AB, U = AB.U;

  const KEYMAP = {
    KeyW: 'up', ArrowUp: 'up',
    KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right',
    Space: 'jump',
    ShiftLeft: 'sprint', ShiftRight: 'sprint',
    KeyJ: 'attack',
    KeyE: 'skill', KeyK: 'skill',
    KeyQ: 'ult', KeyL: 'ult',
    KeyF: 'interact',
    KeyR: 'potion',
    KeyV: 'lock',
    Digit1: 'char1', Digit2: 'char2', Digit3: 'char3',
    Tab: 'questlog',
    Escape: 'menu',
    KeyC: 'outfit',
    KeyM: 'map',
    KeyP: 'photo',
  };

  class Input {
    constructor(game) {
      this.game = game;
      this.held = Object.create(null);
      this.just = new Set();
      this.released = new Set();
      this.move = new THREE.Vector2();
      this.lookDX = 0;
      this.lookDY = 0;
      this.zoomDelta = 0;
      this.pointerLocked = false;
      this.isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
      this.sprintTapT = 0;
      this.sensitivity = 1.0;
      this.touchSens = 1.0;
      this.invertY = false;
      this.enabled = true;

      this._bindKeyboard();
      this._bindMouse();
      this._bindTouch();
    }

    /* ---------- 상태 조회 ---------- */
    isDown(a) { return !!this.held[a]; }
    pressed(a) { return this.just.has(a); }
    wasReleased(a) { return this.released.has(a); }

    setHeld(a, v) {
      if (v && !this.held[a]) this.just.add(a);
      if (!v && this.held[a]) this.released.add(a);
      this.held[a] = v;
    }

    /* ---------- 키보드 ---------- */
    _bindKeyboard() {
      window.addEventListener('keydown', (e) => {
        if (e.repeat) return;
        const a = KEYMAP[e.code];
        if (!a) return;
        if (a === 'questlog' || a === 'menu' || e.code === 'Space') e.preventDefault();
        this.setHeld(a, true);
        if (a === 'sprint') this.sprintTapT = performance.now();
      });
      window.addEventListener('keyup', (e) => {
        const a = KEYMAP[e.code];
        if (!a) return;
        this.setHeld(a, false);
        if (a === 'sprint') {
          // 짧게 누르면 대시
          if (performance.now() - this.sprintTapT < 220) this.just.add('dash');
        }
      });
      window.addEventListener('blur', () => {
        for (const k in this.held) this.setHeld(k, false);
      });
    }

    /* ---------- 마우스 ---------- */
    _bindMouse() {
      const cv = document.getElementById('game');
      this.canvas = cv;
      cv.addEventListener('mousedown', (e) => {
        if (!this.enabled) return;
        if (e.button === 0) {
          if (!this.pointerLocked && this.game.mode === 'play' && !this.isTouch) {
            cv.requestPointerLock && cv.requestPointerLock();
          }
          this.setHeld('attack', true);
        }
        if (e.button === 2) this.setHeld('lockHold', true);
        if (e.button === 1) { this.just.add('dash'); e.preventDefault(); }
      });
      window.addEventListener('mouseup', (e) => {
        if (e.button === 0) this.setHeld('attack', false);
        if (e.button === 2) this.setHeld('lockHold', false);
      });
      cv.addEventListener('contextmenu', e => e.preventDefault());
      document.addEventListener('pointerlockchange', () => {
        this.pointerLocked = document.pointerLockElement === cv;
      });
      window.addEventListener('mousemove', (e) => {
        if (!this.enabled) return;
        if (this.pointerLocked) {
          this.lookDX += e.movementX * 0.0022 * this.sensitivity;
          this.lookDY += e.movementY * 0.0022 * this.sensitivity * (this.invertY ? -1 : 1);
        } else if (this._dragging) {
          this.lookDX += e.movementX * 0.0030 * this.sensitivity;
          this.lookDY += e.movementY * 0.0030 * this.sensitivity * (this.invertY ? -1 : 1);
        }
      });
      // 포인터락 미지원 환경용 드래그 회전
      cv.addEventListener('mousedown', () => { this._dragging = true; });
      window.addEventListener('mouseup', () => { this._dragging = false; });
      cv.addEventListener('wheel', (e) => {
        this.zoomDelta += e.deltaY * 0.0035;
        e.preventDefault();
      }, { passive: false });
    }

    /* ---------- 터치 ---------- */
    _bindTouch() {
      const stick = document.getElementById('tc-stick');
      const knob = document.getElementById('tc-knob');
      const look = document.getElementById('tc-look');
      if (!stick || !look) return;

      this.stickEl = stick; this.knobEl = knob;
      this.stickId = null; this.lookId = null;
      this.stickOrigin = { x: 0, y: 0 };
      const R = 62;

      const startStick = (id, x, y) => {
        this.stickId = id;
        this.stickOrigin.x = x; this.stickOrigin.y = y;
        stick.style.left = (x - R) + 'px';
        stick.style.top = (y - R) + 'px';
        stick.classList.add('on');
      };
      const moveStick = (x, y) => {
        let dx = x - this.stickOrigin.x, dy = y - this.stickOrigin.y;
        const len = Math.hypot(dx, dy);
        const max = R * 0.82;
        if (len > max) { dx = dx / len * max; dy = dy / len * max; }
        knob.style.transform = `translate(${dx}px, ${dy}px)`;
        this.move.set(U.clamp(dx / max, -1, 1), U.clamp(-dy / max, -1, 1));
        // 스틱을 끝까지 밀면 질주
        this.setHeld('sprint', len > max * 0.94);
      };
      const endStick = () => {
        this.stickId = null;
        this.move.set(0, 0);
        knob.style.transform = 'translate(0px,0px)';
        stick.classList.remove('on');
        this.setHeld('sprint', false);
      };

      const surface = document.getElementById('touch-controls');
      surface.addEventListener('touchstart', (e) => {
        if (!this.enabled) return;
        for (const t of e.changedTouches) {
          const half = window.innerWidth * 0.42;
          if (t.clientX < half && this.stickId === null) {
            startStick(t.identifier, t.clientX, t.clientY);
            moveStick(t.clientX, t.clientY);
          } else if (this.lookId === null) {
            this.lookId = t.identifier;
            this.lookLast = { x: t.clientX, y: t.clientY };
            this.lookMoved = 0;
          }
        }
      }, { passive: true });

      surface.addEventListener('touchmove', (e) => {
        if (!this.enabled) return;
        for (const t of e.changedTouches) {
          if (t.identifier === this.stickId) {
            moveStick(t.clientX, t.clientY);
          } else if (t.identifier === this.lookId) {
            const dx = t.clientX - this.lookLast.x;
            const dy = t.clientY - this.lookLast.y;
            this.lookDX += dx * 0.0055 * this.touchSens;
            this.lookDY += dy * 0.0050 * this.touchSens * (this.invertY ? -1 : 1);
            this.lookMoved += Math.abs(dx) + Math.abs(dy);
            this.lookLast.x = t.clientX; this.lookLast.y = t.clientY;
          }
        }
      }, { passive: true });

      const end = (e) => {
        for (const t of e.changedTouches) {
          if (t.identifier === this.stickId) endStick();
          else if (t.identifier === this.lookId) {
            this.lookId = null;
            // 짧은 탭 = 공격
            if (this.lookMoved < 14) this.just.add('attack');
          }
        }
      };
      surface.addEventListener('touchend', end, { passive: true });
      surface.addEventListener('touchcancel', end, { passive: true });

      // 액션 버튼
      document.querySelectorAll('[data-act]').forEach(btn => {
        const act = btn.dataset.act;
        const down = (e) => {
          e.preventDefault();
          this.setHeld(act, true);
          btn.classList.add('press');
          if (navigator.vibrate) navigator.vibrate(12);
        };
        const up = (e) => {
          e.preventDefault();
          this.setHeld(act, false);
          btn.classList.remove('press');
        };
        btn.addEventListener('touchstart', down, { passive: false });
        btn.addEventListener('touchend', up, { passive: false });
        btn.addEventListener('touchcancel', up, { passive: false });
        btn.addEventListener('mousedown', down);
        btn.addEventListener('mouseup', up);
        btn.addEventListener('mouseleave', up);
      });
    }

    /** 이동 벡터 (키보드 우선, 없으면 터치 스틱) */
    getMove() {
      let x = 0, y = 0;
      if (this.isDown('left')) x -= 1;
      if (this.isDown('right')) x += 1;
      if (this.isDown('up')) y += 1;
      if (this.isDown('down')) y -= 1;
      if (x || y) {
        const l = Math.hypot(x, y);
        return { x: x / l, y: y / l, mag: 1 };
      }
      const m = this.move.length();
      if (m > 0.08) return { x: this.move.x, y: this.move.y, mag: Math.min(1, m) };
      return { x: 0, y: 0, mag: 0 };
    }

    /** 프레임 끝에서 호출 — 1회성 입력 소거 */
    endFrame() {
      this.just.clear();
      this.released.clear();
      this.lookDX = 0;
      this.lookDY = 0;
      this.zoomDelta = 0;
    }
  }

  AB.Input = Input;
})(window);
