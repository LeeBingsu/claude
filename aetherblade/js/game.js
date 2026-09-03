/* ============================================================
   AETHER BLADE  —  game.js
   플레이어 · 카메라 · UI · 스폰 · 메인 루프
   ============================================================ */
(function (global) {
  'use strict';
  const AB = global.AB, U = AB.U, Assets = AB.Assets;

  /* ============================================================
     플레이어
     ============================================================ */
  class Player {
    constructor(game) {
      this.game = game;
      this.root = new THREE.Group();
      game.scene.add(this.root);

      this.rigs = {};           // charId -> {rig, anim, weapons}
      this.charIndex = 0;
      this.level = 1;
      this.xp = 0;
      this.xpNext = 220;
      this.dead = false;

      this.pos = new THREE.Vector3(4, 0, 10);
      this.vel = new THREE.Vector3();
      this.yaw = Math.PI;
      this.grounded = true;
      this.radius = 0.45;

      this.stamina = 100; this.staminaMax = 100;
      this.energy = 0; this.energyMax = 100;
      this.iframe = 0;
      this.comboIndex = 0;
      this.comboTimer = 0;
      this.skillCd = 0;
      this.dashCd = 0;
      this.hurtCd = 0;
      this.buff = null;
      this.lockTarget = null;
      this.dashing = 0;

      // 접지 그림자
      const sh = new THREE.Mesh(
        new THREE.PlaneGeometry(1.5, 1.5),
        new THREE.MeshBasicMaterial({ map: Assets.tex.shadow, transparent: true, opacity: 0.6, depthWrite: false })
      );
      sh.rotation.x = -Math.PI / 2;
      sh.position.y = 0.05;
      this.root.add(sh);
      this.shadowPlane = sh;

      this.setCharacter(0, true);
      this.hp = this.stats.hp;
    }

    get def() { return this.game.roster[this.charIndex]; }
    get stats() {
      const d = this.def;
      const lm = 1 + (this.level - 1) * 0.11;
      return {
        hp: Math.round(d.stats.hp * lm),
        atk: d.stats.atk * lm,
        def: d.stats.def * lm,
        crit: d.stats.crit, critDmg: d.stats.critDmg,
        speed: d.stats.speed, sprint: d.stats.sprint,
      };
    }
    get position() { return this.root.position; }
    centerPoint() { return this.root.position.clone().add(new THREE.Vector3(0, 1.0, 0)); }

    /* ---------- 캐릭터 전환 ---------- */
    setCharacter(i, silent) {
      const def = this.game.roster[i];
      if (!def) return;
      const prevHpRatio = this.hp ? this.hp / this.stats.hp : 1;
      this.charIndex = i;

      // 기존 리그 숨김
      for (const k in this.rigs) this.rigs[k].rig.root.visible = false;

      let entry = this.rigs[def.id];
      if (!entry) {
        const useCustom = this.game.customRig && this.game.customApplyAll;
        let rig, anim;
        if (useCustom) {
          rig = this.game.customRig;
          anim = new AB.Animator(rig);
        } else {
          rig = new AB.Rig(def.look);
          anim = new AB.Animator(rig);
        }
        // 시그니처 무기 토글이 켜져 있으면 전용 무기로 대체 (창 모션 사용)
        const useSig = this.game.signatureWeapon;
        const wType = useSig ? 'signature' : def.weaponType;
        const wb = AB.WEAPONS.WEAPON_BUILDERS[wType](def.look.accent);
        wb.main.rotation.set(...wb.mainRot);
        rig.attachWeapon(wb.main, 'handR');
        if (wb.off) {
          wb.off.rotation.set(...wb.offRot);
          if (rig.isMMD) wb.off.scale.multiplyScalar(1 / rig.modelScale);
          rig.bones.handL.add(wb.off);
        }
        if (!rig.root.parent) this.root.add(rig.root);
        entry = { rig, anim, weapon: wb.main, off: wb.off, shared: useCustom, sig: useSig };
        this.rigs[def.id] = entry;
        anim.onEvent = (t, d) => this.onAnimEvent(t, d);
      }
      // 공유(커스텀) 리그면 무기만 교체
      if (entry.shared) {
        const shared = this.game.customRig;
        if (shared.weapon !== entry.weapon) {
          if (shared.weapon && shared.weapon.parent) shared.weapon.parent.remove(shared.weapon);
          shared.weapon = entry.weapon;
          shared.bones.handR.add(entry.weapon);
        }
        // 오프핸드 정리
        const hl = shared.bones.handL;
        for (let c = hl.children.length - 1; c >= 0; c--) {
          if (hl.children[c].userData && hl.children[c].userData.tip) hl.remove(hl.children[c]);
        }
        if (entry.off) hl.add(entry.off);
      }
      entry.rig.root.visible = true;
      this.rig = entry.rig;
      this.anim = entry.anim;
      this.anim.onEvent = (t, d) => this.onAnimEvent(t, d);
      this.weapon = entry.weapon;
      this.offWeapon = entry.off;
      this.comboIndex = 0;

      const s = this.stats;
      this.hp = Math.max(1, Math.round(s.hp * prevHpRatio));
      if (!silent) {
        Assets.sfx.cast(def.element);
        this.game.vfx.shockwave(this.position, 3.4, AB.ELEMENTS[def.element].color);
        this.game.vfx.particles.burst(this.centerPoint(), {
          color: AB.ELEMENTS[def.element].color, count: 26, speedMin: 2, speedMax: 8,
          sizeMin: 0.2, sizeMax: 0.6, lifeMin: 0.3, lifeMax: 0.8, up: 2,
        });
        this.iframe = Math.max(this.iframe, 0.5);
        this.anim.play('skill_cast', { speed: 1.6 });
      }
      this.game.ui.updateParty();
      this.game.ui.updateStats();
    }

    /* ---------- 애니메이션 이벤트 ---------- */
    onAnimEvent(type, data) {
      if (type === 'hit') this.resolveAttack(data);
      else if (type === 'trail') {
        const c = AB.ELEMENTS[this.def.element].color;
        this.game.vfx.setTrail(this, data.on, this.weapon, c);
        if (this.offWeapon) this.game.vfx.setTrail(this.offWeapon, data.on, this.offWeapon, c);
        if (data.on) Assets.sfx.swing(this.def.weaponType === 'greatsword' ? 0.7 : 1.2);
      } else if (type === 'footstep') {
        if (Math.random() < 0.55) {
          this.game.vfx.particles.burst(this.position.clone().add(new THREE.Vector3(U.rand(-0.2, 0.2), 0.08, 0)), {
            color: 0x8a7a5a, count: 2, speedMin: 0.4, speedMax: 1.6,
            sizeMin: 0.14, sizeMax: 0.34, lifeMin: 0.25, lifeMax: 0.5, up: 0.6, gravity: -3,
          });
        }
      }
    }

    rollDamage(base) {
      const crit = Math.random() < this.stats.crit;
      let d = base * (crit ? this.stats.critDmg : 1);
      if (this.buff && this.buff.t > 0) d *= (1 + this.buff.mult);
      return { dmg: d, crit };
    }

    /** 부채꼴 범위 근접 판정 */
    resolveAttack(h) {
      const el = this.def.element;
      const fwd = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
      const origin = this.position;
      let hitAny = false;
      for (const e of this.game.enemies) {
        if (e.dead) continue;
        const d = new THREE.Vector3().subVectors(e.position, origin);
        d.y = 0;
        const dist = d.length() - e.type.radius;
        if (dist > h.range) continue;
        if (dist > 0.2) {
          const ang = Math.abs(fwd.angleTo(d.normalize()));
          if (ang > h.arc / 2) continue;
        }
        const r = this.rollDamage(this.stats.atk * h.mult);
        const hp = e.centerPoint();
        e.takeDamage(r.dmg, el, {
          crit: r.crit, hitPoint: hp, knockback: h.kb, stagger: h.stagger, from: origin,
        });
        hitAny = true;
        this.gainEnergy(r.crit ? 5 : 3.4);
        // 궁극기 버프 — 추가 원소 폭발
        if (this.buff && this.buff.t > 0 && this.buff.explode) {
          this.game.vfx.shockwave(e.position, 2.6, AB.ELEMENTS[el].color);
        }
      }
      if (hitAny) {
        Assets.sfx.hit(h.mult);
        this.game.hitstop(h.stagger ? 0.075 : 0.035);
        this.game.shake(h.stagger ? 0.35 : 0.14, 0.18);
      }
    }

    gainEnergy(n) {
      this.energy = Math.min(this.energyMax, this.energy + n);
      this.game.ui.updateStats();
    }

    /* ---------- 공격 ---------- */
    tryAttack() {
      if (this.anim.locked || this.dead) return;
      const combo = this.def.combo;
      if (this.comboTimer <= 0) this.comboIndex = 0;
      const clip = combo[this.comboIndex % combo.length];
      this.anim.play(clip);
      this.attackMove = AB.CLIPS[clip].move ? AB.CLIPS[clip].move[2] : 0;
      this.attackMoveT = 0.22;
      this.comboIndex = (this.comboIndex + 1) % combo.length;
      this.comboTimer = 1.0;
      this.game.ui.comboPip(this.comboIndex, combo.length);
      // 락온 대상 쪽으로 자동 정렬
      const t = this.lockTarget || this.game.nearestEnemy(this.position, 6.5, this.yaw, 1.6);
      if (t && !t.dead) {
        const d = new THREE.Vector3().subVectors(t.position, this.position);
        this.yaw = Math.atan2(d.x, d.z);
      }
    }

    /* ---------- 원소 스킬 ---------- */
    trySkill() {
      if (this.skillCd > 0 || this.anim.locked || this.dead) return;
      const s = this.def.skill;
      const el = this.def.element;
      this.skillCd = s.cd;
      this.anim.play('skill_cast');
      Assets.sfx.cast(el);
      this.gainEnergy(14);

      const fwd = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));

      if (s.type === 'burst_forward') {
        this.vel.addScaledVector(fwd, 12);
        this.vel.y = 5.5;
        setTimeout(() => {
          if (this.dead) return;
          const c = this.position.clone().addScaledVector(fwd, 2.4);
          this.game.vfx.shockwave(c, s.radius, AB.ELEMENTS[el].color);
          this.game.vfx.particles.burst(c.clone().setY(c.y + 0.6), {
            color: AB.ELEMENTS[el].color, count: 46, speedMin: 3, speedMax: 13,
            sizeMin: 0.3, sizeMax: 0.9, lifeMin: 0.4, lifeMax: 1.1, up: 3,
          });
          this.game.shake(0.6, 0.4);
          Assets.sfx.ult();
          this.aoeDamage(c, s.radius, s.mult, el, { kb: 5, stagger: true });
          this.game.spawnBurningGround(c, s.radius * 0.8, s.dot);
        }, 380);
      } else if (s.type === 'dash_strike') {
        const start = this.position.clone();
        this.vel.copy(fwd).multiplyScalar(s.dist * 2.4);
        this.iframe = Math.max(this.iframe, 0.45);
        this.dashing = 0.4;
        this.game.spawnAfterimages(this, 6, 0.05);
        setTimeout(() => {
          if (this.dead) return;
          const mid = start.clone().lerp(this.position, 0.5);
          this.aoeDamage(mid, s.radius + s.dist * 0.36, s.mult, el, { kb: 3 });
          for (const e of this.game.enemies) {
            if (!e.dead && e.position.distanceTo(mid) < s.radius + s.dist * 0.4) {
              e.slow = s.slow.dur; e.slowFactor = s.slow.factor;
            }
          }
          this.game.vfx.particles.burst(mid, {
            color: AB.ELEMENTS[el].color, count: 40, speedMin: 3, speedMax: 12,
            sizeMin: 0.25, sizeMax: 0.7, lifeMin: 0.4, lifeMax: 1.0, up: 2,
          });
        }, 220);
      } else if (s.type === 'projectile_chain') {
        setTimeout(() => {
          if (this.dead) return;
          const from = this.centerPoint().addScaledVector(fwd, 0.7);
          const target = this.lockTarget && !this.lockTarget.dead
            ? this.lockTarget.centerPoint()
            : from.clone().addScaledVector(fwd, 20);
          this.game.projectiles.push(new AB.Projectile(this.game, {
            from, dir: target.clone().sub(from), speed: s.speed,
            dmg: this.stats.atk * s.mult, element: el,
            chains: s.chains, chainRange: s.chainRange, size: 0.34,
            homing: this.lockTarget ? 4 : 0, target: this.lockTarget,
          }));
        }, 260);
      }
      this.game.ui.updateStats();
    }

    /* ---------- 궁극기 ---------- */
    tryUlt() {
      if (this.energy < this.energyMax || this.anim.locked || this.dead) return;
      const s = this.def.ult;
      const el = this.def.element;
      this.energy = 0;
      this.anim.play('ult_cast');
      this.iframe = Math.max(this.iframe, 1.3);
      Assets.sfx.ult();
      this.game.ui.ultFlash(AB.ELEMENTS[el].css, this.def.name, s.name);
      this.game.shake(1.0, 0.9);

      if (s.type === 'nova_field') {
        setTimeout(() => {
          if (this.dead) return;
          const c = this.position.clone();
          this.game.vfx.shockwave(c, s.radius, AB.ELEMENTS[el].color);
          this.game.vfx.shockwave(c, s.radius * 0.6, 0xffffff);
          this.game.vfx.particles.burst(c.clone().setY(c.y + 1), {
            color: AB.ELEMENTS[el].color, count: 120, speedMin: 4, speedMax: 22,
            sizeMin: 0.3, sizeMax: 1.2, lifeMin: 0.6, lifeMax: 1.6, up: 6,
          });
          this.aoeDamage(c, s.radius, s.mult, el, { kb: 9, stagger: true });
          this.buff = { t: s.buffDur, mult: s.buffMult, explode: true };
          this.game.spawnBurningGround(c, s.radius * 0.7, { dmg: 30, dur: s.buffDur, tick: 0.6 });
        }, 900);
      } else if (s.type === 'shatter_storm') {
        let n = 0;
        const iv = setInterval(() => {
          if (this.dead || n >= s.ticks) { clearInterval(iv); return; }
          n++;
          const c = this.position.clone();
          const a = Math.random() * U.TAU, r = Math.random() * s.radius * 0.8;
          const p = c.clone().add(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
          this.game.vfx.shockwave(p, 3.4, AB.ELEMENTS[el].color);
          this.game.vfx.particles.burst(p.clone().setY(p.y + 1.2), {
            color: AB.ELEMENTS[el].color, count: 26, speedMin: 3, speedMax: 12,
            sizeMin: 0.25, sizeMax: 0.8, lifeMin: 0.4, lifeMax: 1.0, up: 4,
          });
          this.aoeDamage(p, 4.6, s.mult / s.ticks * 2.2, el, { kb: 2 });
          for (const e of this.game.enemies) {
            if (!e.dead && e.position.distanceTo(p) < 4.6) e.frozen = Math.max(e.frozen, s.freezeDur);
          }
          Assets.sfx.hit(1.4);
        }, 220);
      } else if (s.type === 'strike_rain') {
        this.buff = { t: s.dur, mult: 0.25 };
        let elapsed = 0;
        const iv = setInterval(() => {
          elapsed += s.interval;
          if (this.dead || elapsed > s.dur) { clearInterval(iv); return; }
          const alive = this.game.enemies.filter(e => !e.dead && e.position.distanceTo(this.position) < s.radius);
          const target = alive.length ? U.pick(alive).position.clone() : null;
          if (!target) return;
          const top = target.clone().add(new THREE.Vector3(0, 14, 0));
          this.game.vfx.chainBolt(top, target, el);
          this.game.vfx.particles.burst(target, {
            color: AB.ELEMENTS[el].color, count: 18, speedMin: 3, speedMax: 10,
            sizeMin: 0.2, sizeMax: 0.6, lifeMin: 0.3, lifeMax: 0.7, up: 3,
          });
          this.aoeDamage(target, 3.6, s.mult, el, { kb: 2 });
          Assets.sfx.hit(1.2);
        }, s.interval * 1000);
      }
      this.game.ui.updateStats();
    }

    aoeDamage(center, radius, mult, element, opts) {
      opts = opts || {};
      for (const e of this.game.enemies) {
        if (e.dead) continue;
        if (e.position.distanceTo(center) > radius + e.type.radius) continue;
        const r = this.rollDamage(this.stats.atk * mult);
        e.takeDamage(r.dmg, element, {
          crit: r.crit, hitPoint: e.centerPoint(), knockback: opts.kb,
          stagger: opts.stagger, from: center,
        });
        this.gainEnergy(1.6);
      }
    }

    /* ---------- 피해 ---------- */
    takeDamage(amount, source, opts) {
      if (this.dead || this.iframe > 0) return;
      opts = opts || {};
      const dmg = Math.max(1, amount * (1 - this.stats.def / (this.stats.def + 380)));
      this.hp -= dmg;
      this.iframe = 0.55;
      this.game.ui.hurtFlash();
      this.game.shake(0.4, 0.3);
      this.game.vfx.damageNumber(this.centerPoint(), dmg, { player: true, y: 0.6 });
      this.game.vfx.bloodBurst(this.centerPoint(), 1.1);
      Assets.sfx.hurt();
      if (source) {
        const d = new THREE.Vector3().subVectors(this.position, source.position);
        d.y = 0; d.normalize();
        this.vel.addScaledVector(d, opts.knock || 3.5);
      }
      if (!this.anim.locked) this.anim.play('hurt');
      if (this.hp <= 0) this.die();
      this.game.ui.updateStats();
    }

    die() {
      this.dead = true;
      this.hp = 0;
      this.anim.play('die');
      Assets.sfx.die();
      this.game.vfx.goreKill(this.centerPoint(), 1.6);
      this.game.onPlayerDeath();
    }

    revive() {
      this.dead = false;
      this.hp = this.stats.hp;
      this.energy = 0;
      this.stamina = this.staminaMax;
      this.anim.stop();
      this.rig.root.rotation.set(0, 0, 0);
      this.iframe = 2.0;
      this.game.ui.updateStats();
    }

    usePotion() {
      if (this.game.inventory.potions <= 0 || this.dead) return;
      if (this.hp >= this.stats.hp) { this.game.ui.toast('체력이 가득 찼습니다'); return; }
      this.game.inventory.potions--;
      const heal = this.stats.hp * 0.4;
      this.hp = Math.min(this.stats.hp, this.hp + heal);
      this.game.vfx.damageNumber(this.centerPoint(), heal, { heal: true, y: 1.2 });
      this.game.vfx.particles.burst(this.centerPoint(), {
        color: 0x7fffa0, count: 24, speedMin: 1, speedMax: 5,
        sizeMin: 0.2, sizeMax: 0.5, lifeMin: 0.5, lifeMax: 1.0, up: 3, gravity: -1,
      });
      Assets.sfx.pickup();
      this.game.ui.updateStats();
    }

    gainXP(n) {
      this.xp += n;
      let leveled = false;
      while (this.xp >= this.xpNext) {
        this.xp -= this.xpNext;
        this.level++;
        this.xpNext = Math.round(this.xpNext * 1.32 + 60);
        leveled = true;
      }
      if (leveled) {
        this.hp = this.stats.hp;
        this.game.ui.levelUp(this.level);
        Assets.sfx.levelup();
        this.game.vfx.particles.burst(this.centerPoint(), {
          color: 0xffe08a, count: 60, speedMin: 2, speedMax: 9,
          sizeMin: 0.25, sizeMax: 0.8, lifeMin: 0.7, lifeMax: 1.5, up: 4, gravity: -1.5,
        });
        this.game.vfx.shockwave(this.position, 5, 0xffe08a);
      }
      this.game.ui.updateStats();
    }

    /* ---------- 매 프레임 ---------- */
    update(dt, input, camYaw) {
      const g = this.game;
      if (this.iframe > 0) this.iframe -= dt;
      if (this.comboTimer > 0) this.comboTimer -= dt;
      if (this.skillCd > 0) this.skillCd -= dt;
      if (this.dashCd > 0) this.dashCd -= dt;
      if (this.dashing > 0) this.dashing -= dt;
      if (this.buff) { this.buff.t -= dt; if (this.buff.t <= 0) this.buff = null; }

      let speed01 = 0;

      if (!this.dead && g.mode === 'play') {
        const mv = input.getMove();
        const locked = this.anim.locked;

        // 이동 방향 (카메라 기준)
        let wishX = 0, wishZ = 0;
        if (mv.mag > 0) {
          const s = Math.sin(camYaw), c = Math.cos(camYaw);
          wishX = mv.x * c + mv.y * s;
          wishZ = -mv.x * s + mv.y * c;
        }

        // 질주 / 스태미나
        const wantSprint = input.isDown('sprint') && mv.mag > 0.5 && this.stamina > 1;
        let maxSpeed = wantSprint ? this.stats.sprint : this.stats.speed * (mv.mag);
        if (wantSprint) {
          this.stamina = Math.max(0, this.stamina - 18 * dt);
        } else {
          this.stamina = Math.min(this.staminaMax, this.stamina + 22 * dt);
        }

        // 대시
        if (input.pressed('dash') && this.dashCd <= 0 && this.stamina > 22 && !locked) {
          this.dashCd = 0.55;
          this.stamina -= 22;
          this.iframe = Math.max(this.iframe, 0.32);
          this.dashing = 0.28;
          const dx = wishX || Math.sin(this.yaw), dz = wishZ || Math.cos(this.yaw);
          const l = Math.hypot(dx, dz) || 1;
          this.vel.x = dx / l * 21;
          this.vel.z = dz / l * 21;
          Assets.sfx.dash();
          g.spawnAfterimages(this, 5, 0.045);
          g.vfx.particles.burst(this.position.clone().setY(this.position.y + 0.4), {
            color: 0xdfe8ff, count: 14, speedMin: 1, speedMax: 5,
            sizeMin: 0.2, sizeMax: 0.5, lifeMin: 0.2, lifeMax: 0.5, up: 1, gravity: -2,
          });
        }

        // 가속
        const accel = this.grounded ? 34 : 12;
        if (!locked && (wishX || wishZ) && this.dashing <= 0) {
          const l = Math.hypot(wishX, wishZ);
          const tx = wishX / l * maxSpeed, tz = wishZ / l * maxSpeed;
          this.vel.x = U.damp(this.vel.x, tx, accel * 0.35, dt);
          this.vel.z = U.damp(this.vel.z, tz, accel * 0.35, dt);
          const targetYaw = Math.atan2(wishX, wishZ);
          this.yaw = U.angleDamp(this.yaw, targetYaw, 14, dt);
          speed01 = U.clamp01(Math.hypot(this.vel.x, this.vel.z) / this.stats.sprint);
        } else {
          const damping = this.dashing > 0 ? 4 : (locked ? 9 : 13);
          this.vel.x = U.damp(this.vel.x, 0, damping, dt);
          this.vel.z = U.damp(this.vel.z, 0, damping, dt);
          speed01 = U.clamp01(Math.hypot(this.vel.x, this.vel.z) / this.stats.sprint);
          if (locked) speed01 = 0;
        }

        // 공격 시 전진
        if (this.attackMoveT > 0) {
          this.attackMoveT -= dt;
          const f = this.attackMove * dt * 3.2;
          this.vel.x += Math.sin(this.yaw) * f;
          this.vel.z += Math.cos(this.yaw) * f;
        }

        // 점프
        if (input.pressed('jump') && this.grounded && !locked) {
          this.vel.y = 9.6;
          this.grounded = false;
          Assets.sfx.jump();
        }

        // 락온
        if (input.pressed('lock')) {
          if (this.lockTarget) this.lockTarget = null;
          else this.lockTarget = g.nearestEnemy(this.position, 32, camYaw, 1.2);
          g.ui.setLockTarget(this.lockTarget);
        }
        if (this.lockTarget && (this.lockTarget.dead || this.lockTarget.position.distanceTo(this.position) > 45)) {
          this.lockTarget = null;
          g.ui.setLockTarget(null);
        }

        // 전투 입력
        if (input.pressed('attack')) this.tryAttack();
        if (input.pressed('skill')) this.trySkill();
        if (input.pressed('ult')) this.tryUlt();
        if (input.pressed('potion')) this.usePotion();
      } else {
        this.vel.x = U.damp(this.vel.x, 0, 8, dt);
        this.vel.z = U.damp(this.vel.z, 0, 8, dt);
      }

      // 중력 & 지면
      this.vel.y -= 26 * dt;
      const np = this.position.clone();
      np.x += this.vel.x * dt;
      np.z += this.vel.z * dt;
      np.y += this.vel.y * dt;
      g.world.resolveCollision(np, this.radius);
      const ground = g.world.height(np.x, np.z);
      if (np.y <= ground) {
        if (!this.grounded && this.vel.y < -8) {
          Assets.sfx.land();
          g.vfx.particles.burst(new THREE.Vector3(np.x, ground + 0.1, np.z), {
            color: 0x9a8a6a, count: 10, speedMin: 1, speedMax: 4,
            sizeMin: 0.2, sizeMax: 0.5, lifeMin: 0.3, lifeMax: 0.6, up: 0.6, gravity: -6, flat: true,
          });
        }
        np.y = ground;
        this.vel.y = 0;
        this.grounded = true;
      } else {
        this.grounded = false;
      }
      this.root.position.copy(np);
      this.root.rotation.y = this.yaw + this.anim.rootExtra.spin;
      this.rig.root.rotation.x = this.anim.rootExtra.pitch;

      // 그림자 크기/높이
      const airK = U.clamp01(1 - (np.y - ground) / 5);
      this.shadowPlane.material.opacity = 0.6 * airK;
      this.shadowPlane.scale.setScalar(U.lerp(1.5, 1, airK));

      this.anim.update(dt, {
        speed01, grounded: this.grounded, vy: this.vel.y, velocity: this.vel,
      });

      // 시그니처 무기 부유 파편 회전
      const shards = this.weapon && this.weapon.userData.shards;
      if (shards) {
        shards.rotation.y += dt * 1.5;
        for (let i = 0; i < shards.children.length; i++) {
          shards.children[i].rotation.x += dt * (1 + i * 0.3);
          shards.children[i].rotation.z += dt * 0.7;
        }
      }

      // 물속 표시
      if (g.world.inWater(np.x, np.z, np.y)) {
        if (Math.random() < dt * 6) {
          g.vfx.particles.burst(new THREE.Vector3(np.x, g.world.LAKE.y + 0.2, np.z), {
            color: 0x8fd8ff, count: 2, speedMin: 0.5, speedMax: 2.5,
            sizeMin: 0.1, sizeMax: 0.3, lifeMin: 0.2, lifeMax: 0.5, up: 1.5,
          });
        }
      }
    }
  }

  AB.Player = Player;
})(window);
