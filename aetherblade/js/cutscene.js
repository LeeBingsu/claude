/* ============================================================
   AETHER BLADE  —  cutscene.js
   시네마틱 카메라 · 레터박스 · 자막 · 연출 타임라인
   ============================================================ */
(function (global) {
  'use strict';
  const AB = global.AB, U = AB.U, Assets = AB.Assets;

  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  /* ---------- 위치 헬퍼 (재생 시점에 평가) ---------- */
  const at = {
    player: (dx, dy, dz) => (g) => g.player.position.clone().add(V(dx, dy, dz)),
    playerHead: (dx, dy, dz) => (g) => g.player.position.clone().add(V(0, 1.5, 0)).add(V(dx, dy, dz)),
    /** 플레이어 기준 정면/측면 오프셋 (플레이어 회전 반영) */
    playerLocal: (right, up, fwd) => (g) => {
      const y = g.player.yaw;
      const f = V(Math.sin(y), 0, Math.cos(y));
      const r = V(Math.cos(y), 0, -Math.sin(y));
      return g.player.position.clone()
        .addScaledVector(r, right).addScaledVector(f, fwd).add(V(0, up, 0));
    },
    fixed: (x, y, z) => () => V(x, y, z),
    ground: (x, z, dy) => (g) => V(x, g.world.height(x, z) + (dy || 0), z),
    boss: (dx, dy, dz) => (g) => (g.boss ? g.boss.position.clone().add(V(dx, dy, dz)) : g.player.position.clone().add(V(dx, dy, dz))),
    npc: (dx, dy, dz) => (g) => (g.npc ? g.npc.position.clone().add(V(dx, dy, dz)) : g.player.position.clone()),
    actor: (key, dx, dy, dz) => (g) => {
      const a = g.cine.actors[key];
      return (a ? a.root.position.clone() : g.player.position.clone()).add(V(dx, dy, dz));
    },
  };

  /* ============================================================
     컷신 정의
     ============================================================ */
  function buildScenes() {
    return {
      /* ---------- 오프닝 ---------- */
      opening: {
        letterbox: true, music: true, fadeIn: 1.2, fogFar: 620,
        shots: [
          { dur: 6.0, fov: 52, ease: 'inout',
            from: { pos: at.fixed(-78, 46, -104), look: at.fixed(-10, 12, -30) },
            to: { pos: at.fixed(-34, 17, -46), look: at.fixed(0, 4, -4) } },
          { dur: 5.5, fov: 42, ease: 'inout',
            from: { pos: at.ground(-24, -20, 9), look: at.ground(0, 0, 2) },
            to: { pos: at.ground(-9, -8, 3.4), look: at.ground(0, 0, 1.6) } },
          { dur: 5.0, fov: 34, ease: 'out',
            from: { pos: at.playerLocal(2.6, 1.9, 5.2), look: at.playerHead(0, 0.1, 0) },
            to: { pos: at.playerLocal(0.7, 1.62, 2.0), look: at.playerHead(0, 0.05, 0) } },
          { dur: 4.4, fov: 40, ease: 'inout',
            from: { pos: at.playerLocal(-2.2, 1.3, -3.0), look: at.playerHead(0, -0.2, 0) },
            to: { pos: at.playerLocal(-3.6, 3.4, -6.2), look: at.playerHead(0, -0.4, 0) } },
        ],
        lines: [
          { t: 0.4, who: '', text: '균열이 열린 날, 하늘이 재로 덮였다.' },
          { t: 4.0, who: '', text: '왕국은 사흘 만에 무너졌고, 죽은 자들은 끝내 눕지 않았다.' },
          { t: 8.0, who: '', text: '살아남은 자들은 시신을 태운 잿더미 위에 천막을 치고 마지막 불을 지켰다.' },
          { t: 12.6, who: '', text: '그리고 사흘 뒤 — 태우다 만 잿더미 속에서 한 사람이 눈을 떴다.' },
          { t: 17.2, who: '리엔', text: '…아직, 끝나지 않았어.' },
        ],
        events: [
          { t: 16.9, fn: (g) => { g.player.anim.play('victory'); } },
          { t: 20.0, fn: (g) => { Assets.sfx.quest(); } },
        ],
      },

      /* ---------- 세라 합류 ---------- */
      sera_join: {
        letterbox: true, fadeIn: 0.4,
        setup: (g) => {
          g.cine.spawnActor('sera', g.player.position.clone().add(V(-3.6, 0, -3.0)), 0);
        },
        shots: [
          { dur: 3.4, fov: 42, ease: 'inout',
            from: { pos: at.actor('sera', 4.2, 2.4, 5.0), look: at.actor('sera', 0, 1.5, 0) },
            to: { pos: at.actor('sera', 1.6, 1.6, 2.4), look: at.actor('sera', 0, 1.45, 0) } },
          { dur: 3.6, fov: 38, ease: 'out',
            from: { pos: at.playerLocal(2.0, 1.7, 3.2), look: at.playerHead(0, 0, 0) },
            to: { pos: at.playerLocal(1.2, 1.6, 2.2), look: at.playerHead(0, 0, 0) } },
          { dur: 3.2, fov: 48, ease: 'inout',
            from: { pos: at.playerLocal(-4.0, 2.6, 4.6), look: at.player(0, 1.2, 0) },
            to: { pos: at.playerLocal(-5.4, 3.4, 6.0), look: at.player(0, 1.0, 0) } },
        ],
        lines: [
          { t: 0.3, who: '세라', text: '네가 그 「깨어난 자」구나.' },
          { t: 3.4, who: '리엔', text: '…이름은?' },
          { t: 5.0, who: '세라', text: '세라. 이름은 버렸는데, 부를 게 없으면 곤란하다더라.' },
          { t: 8.0, who: '세라', text: '계약이야. 균열이 닫힐 때까지 — 네 등은 내가 맡지.' },
        ],
        events: [
          { t: 0.2, fn: (g) => g.cine.actorAnim('sera', 'interact') },
          { t: 7.8, fn: (g) => g.cine.actorAnim('sera', 'victory') },
        ],
        cleanup: (g) => g.cine.clearActors(),
      },

      /* ---------- 카이 합류 ---------- */
      kai_join: {
        letterbox: true, fadeIn: 0.4,
        setup: (g) => {
          g.cine.spawnActor('kai', g.player.position.clone().add(V(3.4, 0, -2.6)), Math.PI * 0.9);
        },
        shots: [
          { dur: 3.6, fov: 46, ease: 'inout',
            from: { pos: at.actor('kai', -5.0, 3.6, 4.4), look: at.actor('kai', 0, 1.4, 0) },
            to: { pos: at.actor('kai', -1.8, 1.7, 2.2), look: at.actor('kai', 0, 1.45, 0) } },
          { dur: 3.4, fov: 40, ease: 'out',
            from: { pos: at.playerLocal(-2.2, 1.7, 3.0), look: at.playerHead(0, 0, 0) },
            to: { pos: at.playerLocal(-1.3, 1.62, 2.1), look: at.playerHead(0, 0, 0) } },
          { dur: 3.4, fov: 52, ease: 'inout',
            from: { pos: at.playerLocal(0, 3.0, 6.0), look: at.player(0, 1.2, 0) },
            to: { pos: at.playerLocal(0, 5.2, 9.0), look: at.player(0, 1.0, 0) } },
        ],
        lines: [
          { t: 0.3, who: '카이', text: '창 하나 더 늘어나는 거, 손해는 아니지?' },
          { t: 3.6, who: '리엔', text: '왜 균열을 쫓지.' },
          { t: 5.4, who: '카이', text: '…내 마을이 첫 번째로 삼켜졌거든. 그 정도면 이유가 되나.' },
          { t: 8.6, who: '카이', text: '자, 가자. 하늘이 아직 화가 덜 풀렸어.' },
        ],
        events: [
          { t: 8.4, fn: (g) => g.cine.actorAnim('kai', 'skill_cast') },
          { t: 8.7, fn: (g) => { Assets.sfx.cast('lightning'); g.vfx.shockwave(g.cine.actors.kai.root.position, 4, 0xc07dff); } },
        ],
        cleanup: (g) => g.cine.clearActors(),
      },

      /* ---------- 보스 등장 ---------- */
      boss_intro: {
        letterbox: true, fadeIn: 0.6, shakeAt: 6.4, fogFar: 460,
        shots: [
          { dur: 3.6, fov: 50, ease: 'inout',
            from: { pos: at.boss(0, 26, 26), look: at.boss(0, 3, 0) },
            to: { pos: at.boss(0, 8, 15), look: at.boss(0, 3.4, 0) } },
          { dur: 3.4, fov: 32, ease: 'out',
            from: { pos: at.boss(4.4, 5.2, 7.2), look: at.boss(0, 4.2, 0) },
            to: { pos: at.boss(1.8, 4.6, 4.0), look: at.boss(0, 4.4, 0) } },
          { dur: 3.6, fov: 44, ease: 'inout',
            from: { pos: at.boss(-7.0, 3.0, 9.0), look: at.boss(0, 3.6, 0) },
            to: { pos: at.boss(-10.0, 7.5, 14.0), look: at.boss(0, 3.0, 0) } },
        ],
        lines: [
          { t: 0.4, who: '엘라라', text: '…스승님.' },
          { t: 3.0, who: '감시자', text: '「닫으려 하지 마라. 균열은 상처가 아니라 — 문이다.」' },
          { t: 6.6, who: '감시자', text: '「내가 먼저 건넜을 뿐이다.」' },
          { t: 9.2, who: '세라', text: '말이 통하는 상태로는 안 보이는데.' },
        ],
        events: [
          { t: 6.4, fn: (g) => { g.shake(1.2, 0.8); Assets.sfx.ult(); if (g.boss) g.vfx.shockwave(g.boss.position, 14, 0xff3a2a); } },
          { t: 6.5, fn: (g) => { if (g.boss && g.boss.anim) g.boss.anim.play('ult_cast', { speed: 1.2 }); } },
          { t: 10.2, fn: (g) => { g.ui.bossBar(true); } },
        ],
      },

      /* ---------- 엔딩 ---------- */
      ending: {
        letterbox: true, fadeIn: 0.8, fadeOutAtEnd: true, fogFar: 900,
        shots: [
          { dur: 4.6, fov: 40, ease: 'inout',
            from: { pos: at.playerLocal(2.6, 1.8, 4.0), look: at.playerHead(0, 0, 0) },
            to: { pos: at.playerLocal(1.4, 1.7, 2.6), look: at.playerHead(0, 0, 0) } },
          { dur: 5.0, fov: 55, ease: 'inout',
            from: { pos: at.player(0, 6, 12), look: at.player(0, 1.4, 0) },
            to: { pos: at.player(0, 34, 42), look: at.player(0, 2, 0) } },
          { dur: 5.4, fov: 62, ease: 'inout',
            from: { pos: at.fixed(30, 70, 150), look: at.fixed(0, 10, 0) },
            to: { pos: at.fixed(-40, 160, 240), look: at.fixed(0, 30, 0) } },
        ],
        lines: [
          { t: 0.5, who: '리엔', text: '…끝났다.' },
          { t: 3.0, who: '엘라라', text: '균열이 닫히고 있어. 하늘이… 돌아오고 있다.' },
          { t: 7.0, who: '', text: '문은 닫혔다. 그러나 대륙에는 아직 세지 못한 무덤이 남아 있었다.' },
          { t: 11.0, who: '', text: '그리고 잿더미를 밟는 발소리는, 아직 멈추지 않았다.' },
          { t: 14.0, who: '', text: '— AETHER BLADE · 1부 끝 —' },
        ],
        events: [
          { t: 0.3, fn: (g) => g.player.anim.play('victory') },
          { t: 14.2, fn: (g) => { Assets.sfx.levelup(); } },
        ],
      },
    };
  }

  /* ============================================================
     시네마틱 플레이어
     ============================================================ */
  class Cinematic {
    constructor(game) {
      this.game = game;
      this.scenes = buildScenes();
      this.active = false;
      this.actors = {};
      this.el = {
        wrap: document.getElementById('cine'),
        top: document.getElementById('cine-top'),
        bot: document.getElementById('cine-bot'),
        who: document.getElementById('cine-who'),
        text: document.getElementById('cine-text'),
        sub: document.getElementById('cine-sub'),
        skip: document.getElementById('cine-skip'),
        fade: document.getElementById('cine-fade'),
      };
      if (this.el.skip) this.el.skip.addEventListener('click', () => this.skip());
      this._tmpA = new THREE.Vector3();
      this._tmpB = new THREE.Vector3();
      this.onEnd = null;
    }

    play(id, onEnd) {
      const def = this.scenes[id];
      if (!def) { onEnd && onEnd(); return false; }
      this.def = def;
      this.id = id;
      this.t = 0;
      this.shotIdx = 0;
      this.shotT = 0;
      this.firedEvents = new Set();
      this.firedLines = new Set();
      this.active = true;
      this.onEnd = onEnd || null;
      this.total = def.shots.reduce((a, s) => a + s.dur, 0);

      this.game.mode = 'cutscene';
      if (def.fogFar && this.game.scene.fog) {
        this._fogRestore = this.game.scene.fog.far;
        this.game.scene.fog.far = def.fogFar;
      }
      if (def.setup) def.setup(this.game);
      // 샷 위치 미리 평가
      this.resolved = def.shots.map(s => ({
        dur: s.dur, fov: s.fov || 45, ease: s.ease || 'inout',
        fromPos: s.from.pos(this.game), fromLook: s.from.look(this.game),
        toPos: s.to.pos(this.game), toLook: s.to.look(this.game),
      }));

      if (this.el.wrap) {
        this.el.wrap.classList.add('on');
        document.body.classList.add('cinematic');
      }
      if (this.el.fade && def.fadeIn) {
        this.el.fade.style.transition = 'none';
        this.el.fade.style.opacity = '1';
        requestAnimationFrame(() => {
          this.el.fade.style.transition = `opacity ${def.fadeIn}s ease`;
          this.el.fade.style.opacity = '0';
        });
      }
      this.setSub('', '');
      return true;
    }

    setSub(who, text) {
      if (!this.el.sub) return;
      if (!text) { this.el.sub.classList.remove('on'); return; }
      this.el.who.textContent = who || '';
      this.el.who.style.display = who ? 'block' : 'none';
      this.el.text.textContent = text;
      this.el.sub.classList.add('on');
    }

    /* ---- 임시 배우 ---- */
    spawnActor(charId, pos, yaw) {
      const def = AB.CHARACTERS.find(c => c.id === charId);
      if (!def) return null;
      const rig = new AB.Rig(def.look);
      const anim = new AB.Animator(rig);
      const root = new THREE.Group();
      root.add(rig.root);
      root.position.copy(pos);
      root.position.y = this.game.world.height(pos.x, pos.z);
      root.rotation.y = yaw || 0;
      const wb = AB.WEAPONS.WEAPON_BUILDERS[def.weaponType](def.look.accent);
      wb.main.rotation.set(...wb.mainRot);
      rig.attachWeapon(wb.main, 'handR');
      if (wb.off) {
        wb.off.rotation.set(...wb.offRot);
        rig.bones.handL.add(wb.off);
      }
      this.game.scene.add(root);
      const a = { rig, anim, root, def };
      this.actors[charId] = a;
      return a;
    }
    actorAnim(key, clip) {
      const a = this.actors[key];
      if (a) a.anim.play(clip);
    }
    clearActors() {
      for (const k in this.actors) {
        this.game.scene.remove(this.actors[k].root);
      }
      this.actors = {};
    }

    ease(name, t) {
      if (name === 'out') return U.easeOutCubic(t);
      if (name === 'in') return U.easeInCubic(t);
      if (name === 'linear') return t;
      return U.easeInOutCubic(t);
    }

    update(dt) {
      if (!this.active) return;
      this.t += dt;

      // 자막 / 이벤트
      const def = this.def;
      for (let i = 0; i < def.lines.length; i++) {
        const l = def.lines[i];
        if (this.t >= l.t && !this.firedLines.has(i)) {
          this.firedLines.add(i);
          this.setSub(l.who, l.text);
          this.lineHideAt = this.t + Math.max(2.4, l.text.length * 0.09);
        }
      }
      if (this.lineHideAt && this.t > this.lineHideAt) { this.setSub('', ''); this.lineHideAt = 0; }
      if (def.events) {
        for (let i = 0; i < def.events.length; i++) {
          const e = def.events[i];
          if (this.t >= e.t && !this.firedEvents.has(i)) {
            this.firedEvents.add(i);
            try { e.fn(this.game); } catch (err) { console.warn('컷신 이벤트 오류', err); }
          }
        }
      }

      // 배우 애니메이션
      for (const k in this.actors) {
        const a = this.actors[k];
        a.anim.update(dt, { speed01: 0, grounded: true, vy: 0, velocity: new THREE.Vector3() });
      }

      // 카메라
      this.shotT += dt;
      let shot = this.resolved[this.shotIdx];
      while (shot && this.shotT > shot.dur) {
        this.shotT -= shot.dur;
        this.shotIdx++;
        shot = this.resolved[this.shotIdx];
      }
      if (!shot) return this.finish();
      const k = this.ease(shot.ease, U.clamp01(this.shotT / shot.dur));
      const cam = this.game.camera;
      this._tmpA.lerpVectors(shot.fromPos, shot.toPos, k);
      this._tmpB.lerpVectors(shot.fromLook, shot.toLook, k);
      cam.position.copy(this._tmpA);
      cam.lookAt(this._tmpB);
      if (cam.fov !== shot.fov) { cam.fov = shot.fov; cam.updateProjectionMatrix(); }

      // 남은 자막까지 다 나왔고 샷도 끝났으면 종료
      if (this.t > this.total && this.firedLines.size >= def.lines.length) this.finish();
    }

    skip() {
      if (!this.active) return;
      const def = this.def;
      // 남은 이벤트 즉시 실행 (상태 일관성 유지)
      if (def.events) {
        def.events.forEach((e, i) => {
          if (!this.firedEvents.has(i)) {
            this.firedEvents.add(i);
            try { e.fn(this.game); } catch (err) { /* noop */ }
          }
        });
      }
      this.finish();
    }

    finish() {
      if (!this.active) return;
      this.active = false;
      this.setSub('', '');
      if (this._fogRestore != null && this.game.scene.fog) {
        this.game.scene.fog.far = this._fogRestore;
        this._fogRestore = null;
      }
      if (this.def.cleanup) this.def.cleanup(this.game);
      if (this.el.wrap) {
        this.el.wrap.classList.remove('on');
        document.body.classList.remove('cinematic');
      }
      if (this.el.fade) { this.el.fade.style.transition = 'opacity 0.35s ease'; this.el.fade.style.opacity = '0'; }
      const cam = this.game.camera;
      cam.fov = this.game.baseFov;
      cam.updateProjectionMatrix();
      this.game.mode = 'play';
      this.game.camSnap = true;
      const cb = this.onEnd; this.onEnd = null;
      if (cb) cb();
    }
  }

  AB.Cinematic = Cinematic;
})(window);
