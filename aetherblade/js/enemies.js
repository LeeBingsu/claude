/* ============================================================
   AETHER BLADE  —  enemies.js
   몬스터 리그 · AI 상태기계 · 보스 페이즈
   ============================================================ */
(function (global) {
  'use strict';
  const AB = global.AB, U = AB.U, Assets = AB.Assets;
  const H = AB.charHelpers;
  const part = H.part, group = H.group, box = H.box, cyl = H.cyl, sph = H.sph, taper = H.taper;

  /* ============================================================
     체력 바 (빌보드)
     ============================================================ */
  class HealthBar {
    constructor(width, color, y) {
      this.group = new THREE.Group();
      this.group.position.y = y;
      const bg = new THREE.Mesh(
        new THREE.PlaneGeometry(width, width * 0.10),
        new THREE.MeshBasicMaterial({ color: 0x14161f, transparent: true, opacity: 0.8, depthTest: false })
      );
      bg.renderOrder = 900;
      this.group.add(bg);
      this.fillMat = new THREE.MeshBasicMaterial({ color: color, depthTest: false });
      this.fill = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.96, width * 0.072), this.fillMat);
      this.fill.position.z = 0.001;
      this.fill.renderOrder = 901;
      this.group.add(this.fill);
      // 지연 감소 바 (흰색)
      this.ghostMat = new THREE.MeshBasicMaterial({ color: 0xffe7c0, transparent: true, opacity: 0.55, depthTest: false });
      this.ghost = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.96, width * 0.072), this.ghostMat);
      this.ghost.position.z = 0.0005;
      this.ghost.renderOrder = 900;
      this.group.add(this.ghost);
      this.w = width * 0.96;
      this.ratio = 1; this.ghostRatio = 1;
      this.group.visible = false;
    }
    set(r) { this.ratio = U.clamp01(r); }
    update(dt, camera) {
      this.ghostRatio = U.damp(this.ghostRatio, this.ratio, 4, dt);
      this.fill.scale.x = Math.max(0.001, this.ratio);
      this.fill.position.x = -this.w * (1 - this.ratio) / 2;
      this.ghost.scale.x = Math.max(0.001, this.ghostRatio);
      this.ghost.position.x = -this.w * (1 - this.ghostRatio) / 2;
      if (camera) this.group.quaternion.copy(camera.quaternion);
    }
  }

  /* ============================================================
     몬스터 모델 빌더
     ============================================================ */

  /** 황무지 늑대 — 사족 보행 */
  function buildWolf(tint) {
    const g = new THREE.Group();
    const fur = Assets.toon(tint || 0x4a4550);
    const furDark = Assets.toon(0x2c2932);
    const glow = new THREE.MeshBasicMaterial({ color: 0xff4a3a, toneMapped: false });
    const bones = {};

    const body = group(g, [0, 0.86, 0]);
    part(body, taper(0.42, 0.50, 0.36, 0.46, 1.10), fur, [0, 0, 0.0]).rotation.x = Math.PI / 2;
    // 등 갈기
    for (let i = 0; i < 6; i++) {
      const s = part(body, taper(0.09, 0.05, 0.04, 0.03, 0.24), furDark, [0, 0.22, 0.38 - i * 0.16], 1.05);
      s.rotation.x = -0.5;
    }
    const neck = group(body, [0, 0.10, 0.50]);
    part(neck, taper(0.30, 0.30, 0.26, 0.26, 0.34), fur, [0, 0, 0.14]).rotation.x = Math.PI / 2;
    const head = group(neck, [0, 0.05, 0.32]);
    part(head, taper(0.30, 0.32, 0.24, 0.26, 0.30), fur, [0, 0, 0.13]).rotation.x = Math.PI / 2;
    // 주둥이
    part(head, taper(0.17, 0.16, 0.13, 0.14, 0.26), furDark, [0, -0.05, 0.28]).rotation.x = Math.PI / 2;
    part(head, box(0.10, 0.05, 0.03), new THREE.MeshBasicMaterial({ color: 0xf5f5f5 }), [0, -0.08, 0.40], 0);
    // 귀
    [[-1], [1]].forEach(([sx]) => {
      const e = part(head, new THREE.ConeGeometry(0.075, 0.20, 4), fur, [sx * 0.11, 0.16, -0.02], 1.05);
      e.rotation.z = sx * 0.28;
    });
    // 눈
    [[-1], [1]].forEach(([sx]) => part(head, sph(0.038, 8, 6), glow, [sx * 0.10, 0.04, 0.15], 0));

    const legs = [];
    [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([sx, sz], i) => {
      const hipG = group(body, [sx * 0.20, -0.12, sz * 0.38]);
      part(hipG, taper(0.15, 0.15, 0.11, 0.11, 0.40), fur, [0, -0.20, 0], 1.05);
      const knee = group(hipG, [0, -0.40, 0]);
      part(knee, taper(0.10, 0.10, 0.08, 0.08, 0.34), furDark, [0, -0.17, 0], 1.05);
      const paw = group(knee, [0, -0.34, 0]);
      part(paw, box(0.14, 0.09, 0.20), furDark, [0, -0.04, 0.03], 1.05);
      legs.push({ hip: hipG, knee, paw, sx, sz, phase: (i % 2 === 0 ? 0 : Math.PI) + (sz > 0 ? 0 : Math.PI * 0.5) });
    });
    const tail = group(body, [0, 0.12, -0.56]);
    part(tail, taper(0.13, 0.13, 0.06, 0.06, 0.55), fur, [0, -0.27, 0], 1.05);
    tail.rotation.x = -0.9;

    bones.body = body; bones.neck = neck; bones.head = head; bones.tail = tail; bones.legs = legs;
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    return { root: g, bones };
  }

  /** 부유 술사 — 로브 + 후드 + 구슬 */
  function buildMage(accent) {
    const g = new THREE.Group();
    const robe = Assets.toon(0x2e2a44);
    const robeDark = Assets.toon(0x1d1a2c);
    const trim = Assets.toon(0x7a5cff);
    const glow = new THREE.MeshBasicMaterial({ color: accent || 0x9a7cff, toneMapped: false });
    const bones = {};

    const body = group(g, [0, 1.35, 0]);
    // 로브 (원뿔)
    const skirt = part(body, new THREE.ConeGeometry(0.62, 1.5, 10), robe, [0, -0.62, 0]);
    part(body, taper(0.40, 0.32, 0.46, 0.36, 0.40), robe, [0, 0.10, 0]);
    // 후드
    const hood = group(body, [0, 0.36, 0]);
    const hm = part(hood, sph(0.26, 12, 10), robeDark, [0, 0.04, -0.02]);
    hm.scale.set(1, 1.05, 1.1);
    part(hood, new THREE.ConeGeometry(0.24, 0.42, 8), robeDark, [0, 0.22, -0.04], 1.04);
    // 어둠 속 눈
    part(hood, sph(0.045, 8, 6), glow, [-0.09, 0.0, 0.20], 0);
    part(hood, sph(0.045, 8, 6), glow, [0.09, 0.0, 0.20], 0);
    // 팔
    const arms = [];
    [[-1], [1]].forEach(([sx]) => {
      const a = group(body, [sx * 0.30, 0.16, 0.02]);
      part(a, taper(0.12, 0.12, 0.09, 0.09, 0.46), robe, [0, -0.23, 0], 1.05);
      const hand = group(a, [0, -0.46, 0]);
      part(hand, sph(0.075, 8, 8), Assets.toon(0x9aa0b8), [0, 0, 0], 1.05);
      a.rotation.z = sx * 0.5;
      arms.push({ arm: a, hand, sx });
    });
    // 부유 구슬 3개
    const orbs = [];
    for (let i = 0; i < 3; i++) {
      const o = new THREE.Mesh(new THREE.OctahedronGeometry(0.13), glow);
      g.add(o);
      orbs.push(o);
    }
    const light = new THREE.PointLight(accent || 0x9a7cff, 1.1, 12, 2);
    light.position.y = 1.5;
    g.add(light);
    bones.body = body; bones.hood = hood; bones.arms = arms; bones.orbs = orbs;
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    return { root: g, bones };
  }

  /* ============================================================
     Enemy — 공통 액터
     ============================================================ */
  const TYPES = {
    wolf: {
      name: '황무지 늑대', hp: 240, atk: 26, def: 8, speed: 5.4, accel: 16,
      radius: 0.7, height: 1.4, sight: 34, attackRange: 2.3, attackCd: 1.9, windup: 0.42,
      xp: 22, barW: 1.1, barY: 2.0, kind: 'wolf', tint: 0x4a4550,
      loot: { potion: 0.16, shard: 0.32 },
    },
    wolfAlpha: {
      name: '늑대 우두머리', hp: 620, atk: 40, def: 14, speed: 6.2, accel: 18,
      radius: 0.85, height: 1.7, sight: 40, attackRange: 2.7, attackCd: 1.6, windup: 0.38,
      xp: 90, barW: 1.5, barY: 2.5, kind: 'wolf', tint: 0x5c3a3a, scale: 1.3, elite: true,
      loot: { potion: 0.6, shard: 1 },
    },
    husk: {
      name: '폐허 병사', hp: 460, atk: 38, def: 20, speed: 3.1, accel: 12,
      radius: 0.6, height: 1.9, sight: 30, attackRange: 2.6, attackCd: 2.4, windup: 0.62,
      xp: 38, barW: 1.2, barY: 2.35, kind: 'husk',
      loot: { potion: 0.2, shard: 0.4 },
    },
    huskGuard: {
      name: '성채 근위병', hp: 980, atk: 56, def: 34, speed: 2.9, accel: 11,
      radius: 0.75, height: 2.3, sight: 32, attackRange: 3.0, attackCd: 2.6, windup: 0.72,
      xp: 120, barW: 1.7, barY: 2.9, kind: 'husk', scale: 1.22, elite: true,
      loot: { potion: 0.7, shard: 1 },
    },
    mage: {
      name: '균열 술사', hp: 320, atk: 32, def: 12, speed: 2.4, accel: 8,
      radius: 0.6, height: 2.0, sight: 38, attackRange: 18, attackCd: 2.8, windup: 0.85,
      xp: 46, barW: 1.2, barY: 2.6, kind: 'mage', ranged: true, keepDist: 12,
      loot: { potion: 0.25, shard: 0.55 },
    },
    warden: {
      name: '파멸의 감시자', hp: 16000, atk: 78, def: 45, speed: 3.4, accel: 10,
      radius: 1.8, height: 4.6, sight: 60, attackRange: 5.2, attackCd: 2.2, windup: 0.75,
      xp: 1400, barW: 3.6, barY: 6.6, kind: 'boss', scale: 2.9, boss: true,
      loot: {},
    },
  };

  class Enemy {
    constructor(game, typeKey, pos, level) {
      this.game = game;
      this.type = TYPES[typeKey];
      this.typeKey = typeKey;
      this.level = level || 1;
      const lm = 1 + (this.level - 1) * 0.16;

      this.maxHp = Math.round(this.type.hp * lm);
      this.hp = this.maxHp;
      this.atk = this.type.atk * lm;
      this.def = this.type.def * lm;
      this.dead = false;
      this.deadTimer = 0;
      this.aura = null;         // {element, timer}
      this.slow = 0;            // 감속 타이머
      this.slowFactor = 1;
      this.frozen = 0;
      this.stagger = 0;
      this.state = 'idle';
      this.stateT = 0;
      this.attackCd = U.rand(0.3, 1.5);
      this.vel = new THREE.Vector3();
      this.pos = pos.clone();
      this.yaw = Math.random() * U.TAU;
      this.homePos = pos.clone();
      this.animT = Math.random() * 10;
      this.hitFlash = 0;
      this.targetPoint = null;
      this.pendingHit = null;
      this.phase = 1;
      this.attackName = null;

      this.build();
      this.bar = new HealthBar(this.type.barW, this.type.boss ? 0xff3a2a : (this.type.elite ? 0xffb03a : 0xe0483a), this.type.barY);
      this.root.add(this.bar.group);
      game.scene.add(this.root);

      // 접지 그림자
      const shadow = new THREE.Mesh(
        new THREE.PlaneGeometry(this.type.radius * 3.2, this.type.radius * 3.2),
        new THREE.MeshBasicMaterial({ map: Assets.tex.shadow, transparent: true, opacity: 0.55, depthWrite: false })
      );
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = 0.04;
      this.root.add(shadow);
      this.shadow = shadow;
    }

    build() {
      const t = this.type;
      this.root = new THREE.Group();
      this.root.position.copy(this.pos);
      const s = t.scale || 1;

      if (t.kind === 'wolf') {
        const w = buildWolf(t.tint);
        this.model = w.root; this.mbones = w.bones;
      } else if (t.kind === 'mage') {
        const m = buildMage(0x9a7cff);
        this.model = m.root; this.mbones = m.bones;
      } else if (t.kind === 'husk') {
        const rig = new AB.Rig({
          skin: 0x8fa08a, hair: 0x2b2b30, coat: 0x3b3a36, trim: 0x6a6258,
          dark: 0x232228, cloth: 0x4a463c, accent: 0xff5a3a,
          scale: 1, bulk: 1.15, hairStyle: 'short', cape: true, scarf: false,
        });
        this.rig = rig;
        this.anim = new AB.Animator(rig);
        this.model = rig.root;
        const sword = AB.WEAPONS.makeGreatsword(0xff5a3a);
        sword.scale.setScalar(0.8);
        sword.rotation.set(1.15, 0, 0.1);
        rig.attachWeapon(sword, 'handR');
        this.weapon = sword;
      } else if (t.kind === 'boss') {
        const rig = new AB.Rig({
          skin: 0x6a5a72, hair: 0x160f22, coat: 0x241b33, trim: 0x8a3a5a,
          dark: 0x120d1c, cloth: 0x3a2a4a, accent: 0xff3a2a,
          scale: 1, bulk: 1.7, hairStyle: 'long', cape: true, scarf: false,
        });
        this.rig = rig;
        this.anim = new AB.Animator(rig);
        this.model = rig.root;
        // 보스 전용 장식: 뿔 + 파열된 코어
        const hornMat = Assets.toon(0x3a2038);
        [[-1], [1]].forEach(([sx]) => {
          const h = part(rig.bones.head, new THREE.ConeGeometry(0.09, 0.62, 5), hornMat, [sx * 0.15, 0.24, -0.04], 1.05);
          h.rotation.z = sx * 0.55; h.rotation.x = -0.35;
          const h2 = part(rig.bones.head, new THREE.ConeGeometry(0.06, 0.34, 5), hornMat, [sx * 0.20, 0.12, -0.10], 1.05);
          h2.rotation.z = sx * 0.9;
        });
        const coreGlow = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10),
          new THREE.MeshBasicMaterial({ color: 0xff3a2a, toneMapped: false }));
        coreGlow.position.set(0, 0.16, 0.16);
        rig.bones.chest.add(coreGlow);
        this.bossCore = coreGlow;
        const light = new THREE.PointLight(0xff3a2a, 2.2, 18, 2);
        light.position.set(0, 2.6, 0);
        this.root.add(light);
        this.bossLight = light;
        const axe = AB.WEAPONS.makeGreatsword(0xff3a2a);
        axe.scale.set(1.5, 1.35, 1.5);
        axe.rotation.set(1.05, 0, 0.1);
        rig.attachWeapon(axe, 'handR');
        this.weapon = axe;
      }
      this.model.scale.setScalar(s);
      this.root.add(this.model);
      this.root.traverse(o => { if (o.isMesh) o.castShadow = true; });

      if (this.anim) {
        this.anim.onEvent = (type, data) => this.onAnimEvent(type, data);
      }
    }

    onAnimEvent(type, data) {
      if (type === 'hit') this.resolveMeleeHit(data);
      if (type === 'trail' && this.weapon && this.game.vfx) {
        this.game.vfx.setTrail(this, data.on, this.weapon, 0xff5a3a);
      }
    }

    get position() { return this.root.position; }

    /* ---------- 피해 ---------- */
    takeDamage(dmg, element, opts) {
      if (this.dead) return 0;
      opts = opts || {};
      let final = dmg;
      // 원소 반응
      let reaction = null;
      if (element && this.aura && this.aura.element !== element) {
        reaction = AB.Combat.reactionOf(this.aura.element, element);
        if (reaction) {
          final *= reaction.mult;
          this.game.vfx.reaction(this.position, reaction, this);
          if (reaction.key === 'freeze') this.frozen = Math.max(this.frozen, 1.8);
          if (reaction.key === 'superconduct') this.def *= 0.7;
          this.aura = null;
        }
      } else if (element) {
        this.aura = { element, timer: 8 };
      }
      final = Math.max(1, final * (1 - this.def / (this.def + 320)));
      this.hp -= final;
      this.hitFlash = 0.16;
      this.bar.group.visible = true;
      this.bar.set(this.hp / this.maxHp);

      this.game.vfx.damageNumber(this.position, final, {
        crit: opts.crit, element, y: this.type.height * (this.type.scale || 1) * 0.8,
      });
      const hitAt = opts.hitPoint || this.centerPoint();
      this.game.vfx.hitBurst(hitAt, element, opts.crit ? 1.6 : 1.0);
      // 유혈 (17+ 연출) — 타격 방향으로 튄다
      let bdir = null;
      if (opts.from) {
        bdir = new THREE.Vector3().subVectors(this.position, opts.from);
        bdir.y = 0; bdir.normalize();
      }
      this.game.vfx.bloodBurst(hitAt, opts.crit ? 1.5 : 1.0, bdir);

      if (opts.knockback) {
        const d = new THREE.Vector3().subVectors(this.position, opts.from || this.game.player.position);
        d.y = 0; d.normalize();
        const kb = opts.knockback * (this.type.boss ? 0.06 : (this.type.elite ? 0.4 : 1));
        this.vel.addScaledVector(d, kb);
      }
      if (opts.stagger && !this.type.boss) {
        this.stagger = this.type.elite ? 0.35 : 0.6;
        this.state = 'stagger'; this.stateT = 0;
        if (this.anim) this.anim.play('hurt');
      } else if (!this.type.boss && Math.random() < 0.3) {
        if (this.anim && !this.anim.playing) this.anim.play('hurt');
      }

      if (this.hp <= 0) this.die();
      else if (this.state === 'idle' || this.state === 'patrol') {
        this.state = 'chase'; this.stateT = 0;
      }
      return final;
    }

    centerPoint() {
      const p = this.position.clone();
      p.y += this.type.height * (this.type.scale || 1) * 0.5;
      return p;
    }

    die() {
      if (this.dead) return;
      this.dead = true;
      this.hp = 0;
      this.state = 'dead';
      this.bar.group.visible = false;
      if (this.anim) this.anim.play('die');
      this.game.onEnemyKilled(this);
      Assets.sfx.die();
      this.game.vfx.deathBurst(this.centerPoint(), this.aura ? this.aura.element : null, this.type.boss ? 3 : 1);
      this.game.vfx.goreKill(this.centerPoint(), this.type.boss ? 2.4 : this.type.elite ? 1.5 : 1);
      if (this.game.vfx) this.game.vfx.setTrail(this, false);
    }

    /* ---------- 근접 히트 판정 ---------- */
    resolveMeleeHit(h) {
      const p = this.game.player;
      if (!p || p.dead) return;
      const d = new THREE.Vector3().subVectors(p.position, this.position);
      d.y = 0;
      const dist = d.length();
      const range = (h.range || this.type.attackRange) * (this.type.scale || 1);
      if (dist > range) return;
      const fwd = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
      const ang = Math.abs(fwd.angleTo(d.normalize()));
      if (ang > (h.arc || 1.4) / 2 + 0.25) return;
      this.game.damagePlayer(this.atk * (h.mult || 1), this, { element: h.element });
    }

    /* ---------- AI ---------- */
    update(dt, player) {
      if (this.dead) {
        this.deadTimer += dt;
        if (this.anim) this.anim.update(dt, { speed01: 0, grounded: true, vy: 0, velocity: this.vel });
        // 가라앉으며 소멸
        if (this.deadTimer > 2.2) {
          const k = U.clamp01((this.deadTimer - 2.2) / 1.4);
          this.model.position.y = -k * 2.2;
          if (this.shadow) this.shadow.material.opacity = 0.55 * (1 - k);
          if (k >= 1) this.destroyed = true;
        }
        return;
      }

      this.stateT += dt;
      this.animT += dt;
      if (this.hitFlash > 0) this.hitFlash -= dt;
      if (this.aura) { this.aura.timer -= dt; if (this.aura.timer <= 0) this.aura = null; }
      if (this.slow > 0) { this.slow -= dt; if (this.slow <= 0) this.slowFactor = 1; }
      if (this.frozen > 0) this.frozen -= dt;
      if (this.stagger > 0) this.stagger -= dt;
      if (this.attackCd > 0) this.attackCd -= dt;

      const toP = new THREE.Vector3().subVectors(player.position, this.position);
      toP.y = 0;
      const dist = toP.length();
      const canAct = this.frozen <= 0 && this.stagger <= 0;

      let desired = new THREE.Vector3();
      let moving = false;

      if (!canAct) {
        this.state = this.frozen > 0 ? 'frozen' : 'stagger';
      } else if (this.state === 'frozen' || this.state === 'stagger') {
        this.state = 'chase'; this.stateT = 0;
      }

      if (canAct) {
        switch (this.state) {
          case 'idle':
            if (this.stateT > U.rand(1.5, 4)) {
              this.state = 'patrol'; this.stateT = 0;
              const a = Math.random() * U.TAU, r = U.rand(4, 14);
              this.targetPoint = this.homePos.clone().add(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
            }
            if (dist < this.type.sight) { this.state = 'chase'; this.stateT = 0; this.onAggro(); }
            break;

          case 'patrol': {
            if (this.targetPoint) {
              const d = new THREE.Vector3().subVectors(this.targetPoint, this.position); d.y = 0;
              if (d.length() < 1.2 || this.stateT > 8) { this.state = 'idle'; this.stateT = 0; }
              else { desired.copy(d.normalize()).multiplyScalar(0.42); moving = true; }
            } else this.state = 'idle';
            if (dist < this.type.sight) { this.state = 'chase'; this.stateT = 0; this.onAggro(); }
            break;
          }

          case 'chase': {
            if (dist > this.type.sight * 1.7 && !this.type.boss) {
              this.state = 'return'; this.stateT = 0; break;
            }
            const stopAt = this.type.ranged ? this.type.keepDist : this.type.attackRange * (this.type.scale || 1) * 0.75;
            if (this.type.ranged) {
              if (dist < stopAt * 0.7) { desired.copy(toP).normalize().multiplyScalar(-0.8); moving = true; }
              else if (dist > stopAt * 1.25) { desired.copy(toP).normalize().multiplyScalar(0.9); moving = true; }
              else {
                // 측면 이동
                const perp = new THREE.Vector3(-toP.z, 0, toP.x).normalize();
                desired.copy(perp).multiplyScalar(0.5 * (this.strafeDir || 1));
                moving = true;
                if (Math.random() < dt * 0.5) this.strafeDir = -(this.strafeDir || 1);
              }
            } else if (dist > stopAt) {
              desired.copy(toP).normalize().multiplyScalar(1);
              moving = true;
            }
            if (this.attackCd <= 0 && dist < (this.type.ranged ? this.type.attackRange : this.type.attackRange * (this.type.scale || 1))) {
              this.beginAttack(dist);
            }
            break;
          }

          case 'windup': {
            if (this.stateT >= this.currentWindup) {
              this.executeAttack();
            } else if (!this.type.boss) {
              // 윈드업 중 살짝 조준
              this.faceTarget(player.position, dt, 3);
            }
            break;
          }

          case 'attack': {
            if (this.stateT > (this.attackDur || 0.6)) {
              this.state = 'chase'; this.stateT = 0;
            }
            break;
          }

          case 'return': {
            const d = new THREE.Vector3().subVectors(this.homePos, this.position); d.y = 0;
            if (d.length() < 2) { this.state = 'idle'; this.stateT = 0; }
            else { desired.copy(d.normalize()).multiplyScalar(0.8); moving = true; }
            if (dist < this.type.sight * 0.6) { this.state = 'chase'; this.stateT = 0; }
            break;
          }
        }
      }

      // 보스 페이즈 전환
      if (this.type.boss) this.updateBoss(dt, dist, player);

      // 이동 물리
      const spd = this.type.speed * this.slowFactor * (this.frozen > 0 ? 0 : 1);
      const target = desired.multiplyScalar(spd);
      this.vel.x = U.damp(this.vel.x, target.x, this.type.accel * 0.5, dt);
      this.vel.z = U.damp(this.vel.z, target.z, this.type.accel * 0.5, dt);

      const np = this.position.clone();
      np.x += this.vel.x * dt;
      np.z += this.vel.z * dt;
      this.game.world.resolveCollision(np, this.type.radius);
      // 다른 적과 밀어내기
      np.y = this.game.world.height(np.x, np.z);
      this.root.position.copy(np);
      this.pos.copy(np);

      // 회전
      if (moving && (Math.abs(this.vel.x) + Math.abs(this.vel.z)) > 0.2) {
        const targetYaw = Math.atan2(this.vel.x, this.vel.z);
        this.yaw = U.angleDamp(this.yaw, targetYaw, 8, dt);
      } else if (this.state === 'chase' || this.state === 'windup' || this.state === 'attack') {
        this.faceTarget(player.position, dt, this.type.boss ? 2.4 : 6);
      }
      this.root.rotation.y = this.yaw;

      const speed01 = U.clamp01(Math.hypot(this.vel.x, this.vel.z) / this.type.speed);
      this.animate(dt, speed01);

      // 체력바
      this.bar.update(dt, this.game.camera);
      if (this.bar.group.visible && dist > 46) this.bar.group.visible = false;

      // 피격 플래시
      const flash = this.hitFlash > 0;
      if (flash !== this._flashState) {
        this._flashState = flash;
        this.model.traverse(o => {
          if (o.isMesh && o.material && o.material.emissive) {
            o.material.emissive.setHex(flash ? 0x772222 : 0x000000);
          }
        });
      }
      // 원소 오라 색
      if (this.aura && this.game.vfx) this.game.vfx.auraTick(this, dt);
    }

    onAggro() {
      if (this.type.kind === 'wolf') Assets.sfx.tone({ type: 'sawtooth', f0: 420, f1: 180, dur: 0.5, gain: 0.10, reverb: true });
    }

    faceTarget(p, dt, lam) {
      const d = new THREE.Vector3().subVectors(p, this.position);
      this.yaw = U.angleDamp(this.yaw, Math.atan2(d.x, d.z), lam, dt);
    }

    beginAttack(dist) {
      this.state = 'windup';
      this.stateT = 0;
      this.currentWindup = this.type.windup;
      this.attackCd = this.type.attackCd + U.rand(-0.3, 0.6);

      if (this.type.boss) {
        this.chooseBossAttack(dist);
      } else if (this.type.ranged) {
        this.attackName = 'orb';
        this.game.vfx.telegraphLine(this, 0.85);
      } else if (this.type.kind === 'wolf') {
        this.attackName = 'lunge';
        this.game.vfx.telegraphCone(this, this.type.attackRange * 1.4, 1.1, this.currentWindup);
      } else {
        this.attackName = 'swing';
        if (this.anim) this.anim.play('atk_heavy_1', { speed: 0.8 });
        this.game.vfx.telegraphCone(this, this.type.attackRange * (this.type.scale || 1), 1.7, this.currentWindup);
      }
    }

    executeAttack() {
      this.state = 'attack';
      this.stateT = 0;
      this.attackDur = 0.7;
      const p = this.game.player;

      if (this.attackName === 'orb') {
        const from = this.centerPoint();
        this.game.spawnEnemyProjectile(from, p.centerPoint(), this.atk * 1.0, 'void', 15);
        Assets.sfx.cast('lightning');
      } else if (this.attackName === 'lunge') {
        const d = new THREE.Vector3().subVectors(p.position, this.position); d.y = 0; d.normalize();
        this.vel.addScaledVector(d, 13);
        this.lungeHit = 0.28;
        Assets.sfx.swing(1.2);
        this.attackDur = 0.55;
      } else if (this.attackName === 'swing') {
        Assets.sfx.swing(0.8);
        this.resolveMeleeHit({ range: this.type.attackRange * (this.type.scale || 1), arc: 1.7, mult: 1 });
        this.attackDur = 0.8;
      } else if (this.bossAttackExec) {
        this.bossAttackExec();
      }
    }

    /* ---------- 보스 로직 ---------- */
    updateBoss(dt, dist, player) {
      const ratio = this.hp / this.maxHp;
      const wanted = ratio > 0.66 ? 1 : ratio > 0.33 ? 2 : 3;
      if (wanted !== this.phase) {
        this.phase = wanted;
        this.game.onBossPhase(this, wanted);
        this.attackCd = 1.6;
        this.type.speed = 3.4 + (wanted - 1) * 0.75;
        this.game.vfx.shockwave(this.centerPoint(), 12, 0xff3a2a);
        this.game.shake(0.9, 0.7);
        Assets.sfx.ult();
      }
      if (this.bossLight) {
        this.bossLight.intensity = 1.8 + Math.sin(this.animT * 4) * 0.5 + (this.phase - 1) * 0.8;
      }
      if (this.bossCore) {
        const s = 1 + Math.sin(this.animT * 5) * 0.12 + (this.phase - 1) * 0.15;
        this.bossCore.scale.setScalar(s);
      }
      // 지속 낙뢰 (3페이즈)
      if (this.phase === 3) {
        this._rainT = (this._rainT || 0) - dt;
        if (this._rainT <= 0) {
          this._rainT = 2.2;
          const a = Math.random() * U.TAU, r = Math.random() * 14;
          const px = player.position.x + Math.cos(a) * r;
          const pz = player.position.z + Math.sin(a) * r;
          this.game.spawnGroundHazard(px, pz, 3.4, 1.2, this.atk * 0.9, 'fire');
        }
      }
    }

    chooseBossAttack(dist) {
      const pool = [];
      pool.push('cleave');
      if (dist > 7) pool.push('charge');
      if (this.phase >= 2) pool.push('slam');
      if (this.phase >= 2) pool.push('ringWave');
      if (this.phase >= 3) pool.push('meteor');
      const pick = U.pick(pool);
      const p = this.game.player;

      if (pick === 'cleave') {
        this.currentWindup = 0.75;
        if (this.anim) this.anim.play('atk_heavy_3', { speed: 0.75 });
        this.game.vfx.telegraphCone(this, 8.0, 2.2, this.currentWindup);
        this.bossAttackExec = () => {
          Assets.sfx.swing(0.6);
          this.game.shake(0.35, 0.25);
          this.resolveMeleeHit({ range: 8.0, arc: 2.2, mult: 1.25, element: 'fire' });
          this.attackDur = 1.0;
        };
      } else if (pick === 'charge') {
        this.currentWindup = 0.9;
        this.game.vfx.telegraphCone(this, 20, 0.5, this.currentWindup);
        this.bossAttackExec = () => {
          const d = new THREE.Vector3().subVectors(p.position, this.position); d.y = 0; d.normalize();
          this.vel.addScaledVector(d, 26);
          this.lungeHit = 0.7;
          this.lungeDmg = 1.1;
          Assets.sfx.swing(1.4);
          this.game.shake(0.5, 0.5);
          this.attackDur = 1.1;
        };
      } else if (pick === 'slam') {
        this.currentWindup = 1.0;
        if (this.anim) this.anim.play('ult_cast', { speed: 1.6 });
        this.game.vfx.telegraphCircle(this.position, 9.5, this.currentWindup, 0xff3a2a);
        this.bossAttackExec = () => {
          this.game.vfx.shockwave(this.position, 9.5, 0xff6a3c);
          this.game.shake(0.8, 0.5);
          Assets.sfx.ult();
          const d = p.position.distanceTo(this.position);
          if (d < 9.5) this.game.damagePlayer(this.atk * 1.5, this, { element: 'fire', knock: 8 });
          this.attackDur = 1.2;
        };
      } else if (pick === 'ringWave') {
        this.currentWindup = 1.1;
        this.game.vfx.telegraphCircle(this.position, 16, this.currentWindup, 0xff8a2a);
        this.bossAttackExec = () => {
          this.game.spawnExpandingWave(this.position.clone(), 16, this.atk * 1.2);
          this.game.shake(0.6, 0.4);
          Assets.sfx.ult();
          this.attackDur = 1.0;
        };
      } else { // meteor
        this.currentWindup = 1.3;
        this.bossAttackExec = () => {
          for (let i = 0; i < 6; i++) {
            const a = Math.random() * U.TAU, r = Math.random() * 16;
            this.game.spawnGroundHazard(
              p.position.x + Math.cos(a) * r, p.position.z + Math.sin(a) * r,
              3.6, 1.1 + i * 0.16, this.atk * 1.0, 'fire');
          }
          Assets.sfx.ult();
          this.attackDur = 1.4;
        };
      }
      this.attackName = pick;
    }

    /* ---------- 애니메이션 ---------- */
    animate(dt, speed01) {
      const t = this.animT;
      // 돌진 히트 지속 판정
      if (this.lungeHit > 0) {
        this.lungeHit -= dt;
        const p = this.game.player;
        if (p && !p.dead && p.position.distanceTo(this.position) < this.type.radius + 1.5) {
          if (!this._lungeDone) {
            this._lungeDone = true;
            this.game.damagePlayer(this.atk * (this.lungeDmg || 1.0), this, { knock: 6 });
          }
        }
        if (this.lungeHit <= 0) this._lungeDone = false;
      }

      if (this.anim) {
        this.anim.update(dt, { speed01, grounded: true, vy: 0, velocity: this.vel });
        return;
      }

      if (this.type.kind === 'wolf') {
        const b = this.mbones;
        const windup = this.state === 'windup';
        const freq = U.lerp(4, 13, speed01);
        this._wp = (this._wp || 0) + dt * freq;
        const p = this._wp;
        b.legs.forEach((L) => {
          const ph = p + L.phase;
          const amp = U.lerp(0.12, 0.85, speed01);
          L.hip.rotation.x = Math.sin(ph) * amp + (windup ? -0.3 : 0);
          L.knee.rotation.x = Math.max(0, -Math.sin(ph + 0.8)) * amp * 1.1;
          L.paw.rotation.x = -Math.sin(ph + 0.4) * amp * 0.4;
        });
        b.body.position.y = 0.86 + Math.abs(Math.sin(p * 2)) * 0.06 * speed01 - (windup ? 0.18 : 0);
        b.body.rotation.x = U.lerp(0, -0.12, speed01) + (windup ? 0.22 : 0) + Math.sin(p * 2) * 0.03;
        b.neck.rotation.x = 0.1 - speed01 * 0.15 + (windup ? -0.3 : 0);
        b.head.rotation.x = Math.sin(t * 1.5) * 0.05 + (this.state === 'attack' ? -0.4 : 0);
        b.head.rotation.z = Math.sin(t * 0.9) * 0.06;
        b.tail.rotation.x = -0.9 + Math.sin(t * 3 + speed01 * 4) * 0.25;
        b.tail.rotation.z = Math.sin(t * 4) * 0.3 * (0.4 + speed01);
        if (this.frozen > 0) { b.body.rotation.x = 0; }
      } else if (this.type.kind === 'mage') {
        const b = this.mbones;
        b.body.position.y = 1.35 + Math.sin(t * 1.4) * 0.16;
        b.body.rotation.y = Math.sin(t * 0.6) * 0.12;
        b.hood.rotation.x = Math.sin(t * 0.9) * 0.06;
        const casting = this.state === 'windup';
        b.arms.forEach((A, i) => {
          A.arm.rotation.z = A.sx * (casting ? 0.9 : 0.5 + Math.sin(t * 1.1 + i) * 0.08);
          A.arm.rotation.x = casting ? -1.1 : Math.sin(t * 0.8 + i * 2) * 0.1;
        });
        b.orbs.forEach((o, i) => {
          const a = t * (1.4 + i * 0.3) + (i / 3) * U.TAU;
          const r = casting ? 0.7 : 1.25;
          o.position.set(Math.cos(a) * r, 1.5 + Math.sin(t * 2 + i) * 0.3, Math.sin(a) * r);
          o.rotation.set(t * 2, t * 1.3, 0);
          o.scale.setScalar(casting ? 1.5 : 1);
        });
        // 부유 몬스터는 지면 위 고정 높이
        this.root.position.y = this.game.world.height(this.position.x, this.position.z) + 0.6 + Math.sin(t) * 0.1;
      }
    }

    dispose() {
      this.game.scene.remove(this.root);
      this.root.traverse(o => {
        if (o.isMesh) { o.geometry.dispose(); }
      });
    }
  }

  AB.Enemy = Enemy;
  AB.ENEMY_TYPES = TYPES;
  AB.HealthBar = HealthBar;
  AB.buildWolf = buildWolf;
  AB.buildMage = buildMage;
})(window);
