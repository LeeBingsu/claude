/* ============================================================
   AETHER BLADE  —  combat.js
   VFX(파티클·궤적·텔레그래프) · 원소 반응 · 투사체 · 데미지 표기
   ============================================================ */
(function (global) {
  'use strict';
  const AB = global.AB, U = AB.U, Assets = AB.Assets;

  /* ---------- 원소 반응 ---------- */
  const REACTIONS = {
    'ice>fire': { key: 'melt', name: '융해', mult: 2.0, color: 0xff8a4a },
    'fire>ice': { key: 'melt', name: '융해', mult: 1.6, color: 0xff8a4a },
    'ice>lightning': { key: 'superconduct', name: '초전도', mult: 1.3, color: 0x9ad8ff },
    'lightning>ice': { key: 'superconduct', name: '초전도', mult: 1.3, color: 0x9ad8ff },
    'fire>lightning': { key: 'overload', name: '과부하', mult: 1.5, color: 0xff5ac0, aoe: 4.5 },
    'lightning>fire': { key: 'overload', name: '과부하', mult: 1.5, color: 0xff5ac0, aoe: 4.5 },
    'void>fire': { key: 'rupture', name: '균열 파열', mult: 1.7, color: 0xb06aff, aoe: 3.5 },
    'void>ice': { key: 'rupture', name: '균열 파열', mult: 1.7, color: 0xb06aff, aoe: 3.5 },
    'void>lightning': { key: 'rupture', name: '균열 파열', mult: 1.7, color: 0xb06aff, aoe: 3.5 },
  };

  const ELEM_COLOR = {
    fire: 0xff6a3c, ice: 0x6fd8ff, lightning: 0xc07dff, void: 0x7a5cff, phys: 0xffe9c0,
  };

  /* ============================================================
     파티클 시스템 (단일 Points 풀)
     ============================================================ */
  class Particles {
    constructor(scene, max) {
      this.max = max;
      this.count = 0;
      this.pos = new Float32Array(max * 3);
      this.col = new Float32Array(max * 3);
      this.siz = new Float32Array(max);
      this.vel = new Float32Array(max * 3);
      this.life = new Float32Array(max);
      this.maxLife = new Float32Array(max);
      this.grav = new Float32Array(max);
      this.baseCol = new Float32Array(max * 3);
      this.baseSize = new Float32Array(max);
      this.drag = new Float32Array(max);

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
      geo.setAttribute('aColor', new THREE.BufferAttribute(this.col, 3));
      geo.setAttribute('aSize', new THREE.BufferAttribute(this.siz, 1));
      geo.setDrawRange(0, 0);
      this.geo = geo;

      const mat = new THREE.ShaderMaterial({
        uniforms: { uMap: { value: Assets.tex.spark } },
        vertexShader: `
          attribute float aSize;
          attribute vec3 aColor;
          varying vec3 vColor;
          void main() {
            vColor = aColor;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = aSize * (320.0 / max(0.001, -mv.z));
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: `
          uniform sampler2D uMap;
          varying vec3 vColor;
          void main() {
            vec4 t = texture2D(uMap, gl_PointCoord);
            gl_FragColor = vec4(vColor, 1.0) * t;
          }`,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      this.points = new THREE.Points(geo, mat);
      this.points.frustumCulled = false;
      this.points.renderOrder = 20;
      scene.add(this.points);
    }

    emit(x, y, z, vx, vy, vz, r, g, b, size, life, gravity, drag) {
      let i = this.count;
      if (i >= this.max) {
        // 가장 오래된 것 재사용
        i = this._rr = ((this._rr || 0) + 1) % this.max;
      } else this.count++;
      this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z;
      this.vel[i * 3] = vx; this.vel[i * 3 + 1] = vy; this.vel[i * 3 + 2] = vz;
      this.baseCol[i * 3] = r; this.baseCol[i * 3 + 1] = g; this.baseCol[i * 3 + 2] = b;
      this.col[i * 3] = r; this.col[i * 3 + 1] = g; this.col[i * 3 + 2] = b;
      this.baseSize[i] = size; this.siz[i] = size;
      this.life[i] = life; this.maxLife[i] = life;
      this.grav[i] = gravity === undefined ? -9 : gravity;
      this.drag[i] = drag === undefined ? 1.6 : drag;
    }

    burst(pos, opts) {
      const n = opts.count || 12;
      const c = new THREE.Color(opts.color === undefined ? 0xffffff : opts.color);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * U.TAU;
        const el = opts.flat ? 0 : (Math.random() - 0.3) * 1.5;
        const sp = U.rand(opts.speedMin || 2, opts.speedMax || 7);
        const vx = Math.cos(a) * Math.cos(el) * sp + (opts.dir ? opts.dir.x * (opts.dirPower || 0) : 0);
        const vy = Math.sin(el) * sp + (opts.up || 1.5);
        const vz = Math.sin(a) * Math.cos(el) * sp + (opts.dir ? opts.dir.z * (opts.dirPower || 0) : 0);
        const jitter = opts.spread || 0.2;
        this.emit(
          pos.x + U.rand(-jitter, jitter), pos.y + U.rand(-jitter, jitter), pos.z + U.rand(-jitter, jitter),
          vx, vy, vz,
          c.r * U.rand(0.8, 1.3), c.g * U.rand(0.8, 1.3), c.b * U.rand(0.8, 1.3),
          U.rand(opts.sizeMin || 0.25, opts.sizeMax || 0.7),
          U.rand(opts.lifeMin || 0.35, opts.lifeMax || 0.9),
          opts.gravity, opts.drag
        );
      }
    }

    update(dt) {
      const n = this.count;
      for (let i = 0; i < n; i++) {
        if (this.life[i] <= 0) { this.siz[i] = 0; continue; }
        this.life[i] -= dt;
        const k = U.clamp01(this.life[i] / this.maxLife[i]);
        const i3 = i * 3;
        this.vel[i3 + 1] += this.grav[i] * dt;
        const d = Math.max(0, 1 - this.drag[i] * dt);
        this.vel[i3] *= d; this.vel[i3 + 1] *= d; this.vel[i3 + 2] *= d;
        this.pos[i3] += this.vel[i3] * dt;
        this.pos[i3 + 1] += this.vel[i3 + 1] * dt;
        this.pos[i3 + 2] += this.vel[i3 + 2] * dt;
        const f = k * k;
        this.col[i3] = this.baseCol[i3] * f;
        this.col[i3 + 1] = this.baseCol[i3 + 1] * f;
        this.col[i3 + 2] = this.baseCol[i3 + 2] * f;
        this.siz[i] = this.baseSize[i] * (0.4 + k * 0.8);
      }
      this.geo.setDrawRange(0, this.count);
      this.geo.attributes.position.needsUpdate = true;
      this.geo.attributes.aColor.needsUpdate = true;
      this.geo.attributes.aSize.needsUpdate = true;
    }
  }

  /* ============================================================
     무기 궤적 (리본)
     ============================================================ */
  class Trail {
    constructor(scene, color, segments) {
      this.N = segments || 16;
      this.pts = [];
      const geo = new THREE.BufferGeometry();
      this.positions = new Float32Array(this.N * 2 * 3);
      this.uvs = new Float32Array(this.N * 2 * 2);
      const idx = [];
      for (let i = 0; i < this.N - 1; i++) {
        const a = i * 2, b = i * 2 + 1, c = (i + 1) * 2, d = (i + 1) * 2 + 1;
        idx.push(a, b, c, b, d, c);
      }
      for (let i = 0; i < this.N; i++) {
        const t = i / (this.N - 1);
        this.uvs[i * 4] = t; this.uvs[i * 4 + 1] = 0;
        this.uvs[i * 4 + 2] = t; this.uvs[i * 4 + 3] = 1;
      }
      geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
      geo.setAttribute('uv', new THREE.BufferAttribute(this.uvs, 2));
      geo.setIndex(idx);
      this.geo = geo;
      this.mat = new THREE.MeshBasicMaterial({
        color: color, map: Assets.tex.trail, transparent: true, opacity: 0.9,
        side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false,
      });
      this.mesh = new THREE.Mesh(geo, this.mat);
      this.mesh.frustumCulled = false;
      this.mesh.renderOrder = 15;
      scene.add(this.mesh);
      this.active = false;
      this.fade = 0;
    }
    start(color) { this.active = true; this.pts.length = 0; this.fade = 1; if (color !== undefined) this.mat.color.setHex(color); }
    stop() { this.active = false; }
    sample(base, tip) {
      if (!this.active) return;
      this.pts.unshift([base.clone(), tip.clone()]);
      if (this.pts.length > this.N) this.pts.length = this.N;
    }
    update(dt) {
      if (!this.active && this.pts.length) {
        this._decay = (this._decay || 0) + dt;
        if (this._decay > 0.02) { this._decay = 0; this.pts.pop(); }
      } else this._decay = 0;
      const n = this.pts.length;
      this.mesh.visible = n > 2;
      if (n < 2) return;
      for (let i = 0; i < this.N; i++) {
        const p = this.pts[Math.min(i, n - 1)];
        this.positions[i * 6 + 0] = p[0].x;
        this.positions[i * 6 + 1] = p[0].y;
        this.positions[i * 6 + 2] = p[0].z;
        this.positions[i * 6 + 3] = p[1].x;
        this.positions[i * 6 + 4] = p[1].y;
        this.positions[i * 6 + 5] = p[1].z;
      }
      this.geo.attributes.position.needsUpdate = true;
      this.geo.computeBoundingSphere();
    }
    dispose(scene) { scene.remove(this.mesh); this.geo.dispose(); this.mat.dispose(); }
  }

  /* ============================================================
     VFX 매니저
     ============================================================ */
  class VFX {
    constructor(game) {
      this.game = game;
      this.scene = game.scene;
      this.particles = new Particles(game.scene, game.quality.particles);
      this.decals = [];      // {mesh, life, maxLife, grow, spin}
      this.trails = new Map();
      this.numbers = [];
      this.layer = document.getElementById('dmg-layer');
      this._v = new THREE.Vector3();
      this.freeNumbers = [];
    }

    /* ---- 데미지 숫자 (DOM) ---- */
    damageNumber(worldPos, amount, opts) {
      opts = opts || {};
      if (!this.layer) return;
      let el = this.freeNumbers.pop();
      if (!el) {
        el = document.createElement('div');
        el.className = 'dmg';
        this.layer.appendChild(el);
      }
      el.style.display = 'block';
      const crit = opts.crit;
      el.textContent = (crit ? '' : '') + Math.round(amount) + (crit ? '!' : '');
      el.className = 'dmg' + (crit ? ' crit' : '') + (opts.element ? ' el-' + opts.element : '') + (opts.player ? ' player' : '') + (opts.heal ? ' heal' : '');
      const p = worldPos.clone();
      p.y += opts.y || 1.4;
      this.numbers.push({
        el, pos: p, life: 1.05, max: 1.05,
        vx: U.rand(-26, 26), vy: crit ? -68 : -52, scale: crit ? 1.5 : 1,
      });
    }

    updateNumbers(dt, camera, w, h) {
      for (let i = this.numbers.length - 1; i >= 0; i--) {
        const n = this.numbers[i];
        n.life -= dt;
        if (n.life <= 0) {
          n.el.style.display = 'none';
          this.freeNumbers.push(n.el);
          this.numbers.splice(i, 1);
          continue;
        }
        const t = 1 - n.life / n.max;
        this._v.copy(n.pos).project(camera);
        if (this._v.z > 1) { n.el.style.display = 'none'; continue; }
        n.el.style.display = 'block';
        const x = (this._v.x * 0.5 + 0.5) * w + n.vx * t;
        const y = (-this._v.y * 0.5 + 0.5) * h + n.vy * t * (1 - t * 0.35);
        const sc = n.scale * (t < 0.15 ? U.easeOutBack(t / 0.15) : 1) * (1 - t * 0.2);
        n.el.style.transform = `translate(-50%,-50%) translate(${x.toFixed(1)}px,${y.toFixed(1)}px) scale(${sc.toFixed(2)})`;
        n.el.style.opacity = String(U.clamp01((1 - t) * 2.2));
      }
    }

    /* ---- 타격 이펙트 ---- */
    hitBurst(pos, element, power) {
      const color = ELEM_COLOR[element] || 0xffe9c0;
      this.particles.burst(pos, {
        color, count: Math.round(14 * (power || 1)), speedMin: 3, speedMax: 11 * (power || 1),
        sizeMin: 0.2, sizeMax: 0.55 * (power || 1), lifeMin: 0.2, lifeMax: 0.5, up: 2,
      });
      this.particles.burst(pos, {
        color: 0xffffff, count: 5, speedMin: 5, speedMax: 13,
        sizeMin: 0.12, sizeMax: 0.3, lifeMin: 0.12, lifeMax: 0.26, up: 1,
      });
      // 임팩트 플래시 판
      this.flash(pos, color, 1.1 * (power || 1));
    }

    flash(pos, color, size) {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(size, size),
        new THREE.MeshBasicMaterial({
          map: Assets.tex.spark, color, transparent: true,
          blending: THREE.AdditiveBlending, depthWrite: false,
        })
      );
      m.position.copy(pos);
      m.renderOrder = 18;
      this.scene.add(m);
      this.decals.push({ mesh: m, life: 0.18, maxLife: 0.18, grow: 3.2, billboard: true });
    }

    deathBurst(pos, element, scale) {
      const color = ELEM_COLOR[element] || 0xff7a4a;
      scale = scale || 1;
      this.particles.burst(pos, {
        color, count: 40 * scale, speedMin: 3, speedMax: 12 * scale,
        sizeMin: 0.25, sizeMax: 0.8 * scale, lifeMin: 0.5, lifeMax: 1.3, up: 3, spread: 0.5,
      });
      this.particles.burst(pos, {
        color: 0x552222, count: 22 * scale, speedMin: 1, speedMax: 5,
        sizeMin: 0.4, sizeMax: 1.1 * scale, lifeMin: 0.7, lifeMax: 1.6, up: 1.5, gravity: -2, spread: 0.6,
      });
      this.shockwave(pos, 2.6 * scale, color);
    }

    /* ---- 원소 반응 ---- */
    reaction(pos, rx, enemy) {
      const p = pos.clone(); p.y += 1.2;
      this.particles.burst(p, {
        color: rx.color, count: 34, speedMin: 4, speedMax: 14,
        sizeMin: 0.3, sizeMax: 0.9, lifeMin: 0.4, lifeMax: 1.0, up: 3,
      });
      this.shockwave(pos, rx.aoe || 3, rx.color);
      this.game.ui.reactionToast(rx.name);
      Assets.sfx.reaction(rx.key);
      if (rx.aoe) {
        for (const e of this.game.enemies) {
          if (e === enemy || e.dead) continue;
          if (e.position.distanceTo(pos) < rx.aoe) {
            e.takeDamage(this.game.player.stats.atk * 1.2, null, { hitPoint: e.centerPoint() });
          }
        }
      }
    }

    auraTick(enemy, dt) {
      enemy._auraT = (enemy._auraT || 0) - dt;
      if (enemy._auraT > 0) return;
      enemy._auraT = 0.09;
      const c = ELEM_COLOR[enemy.aura.element];
      const p = enemy.centerPoint();
      this.particles.burst(p, {
        color: c, count: 2, speedMin: 0.2, speedMax: 1.2,
        sizeMin: 0.15, sizeMax: 0.4, lifeMin: 0.4, lifeMax: 0.8, up: 1.2, gravity: -1, spread: 0.5,
      });
    }

    /* ---- 지면 데칼 ---- */
    groundDecal(x, z, radius, color, life, opts) {
      opts = opts || {};
      const y = this.game.world.height(x, z) + 0.06;
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(radius * 2, radius * 2),
        new THREE.MeshBasicMaterial({
          map: Assets.tex.rune, color, transparent: true, opacity: opts.opacity || 0.85,
          blending: THREE.AdditiveBlending, depthWrite: false,
        })
      );
      m.rotation.x = -Math.PI / 2;
      m.position.set(x, y, z);
      m.renderOrder = 5;
      this.scene.add(m);
      const d = { mesh: m, life, maxLife: life, spin: opts.spin || 0.6, grow: opts.grow || 0, fadeIn: opts.fadeIn };
      this.decals.push(d);
      return d;
    }

    shockwave(pos, radius, color) {
      const geo = new THREE.RingGeometry(0.4, 0.62, 40);
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: 0.9, side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      m.rotation.x = -Math.PI / 2;
      m.position.set(pos.x, this.game.world.height(pos.x, pos.z) + 0.12, pos.z);
      m.renderOrder = 6;
      this.scene.add(m);
      this.decals.push({ mesh: m, life: 0.5, maxLife: 0.5, grow: radius / 0.5, spin: 0 });
    }

    /** 적 공격 예고 — 부채꼴 */
    telegraphCone(enemy, range, arc, dur) {
      const geo = new THREE.RingGeometry(0.5, range, 24, 1, -arc / 2 + Math.PI / 2, arc);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xff3a2a, transparent: true, opacity: 0.24, side: THREE.DoubleSide,
        depthWrite: false, blending: THREE.AdditiveBlending,
      });
      const m = new THREE.Mesh(geo, mat);
      m.rotation.x = -Math.PI / 2;
      m.position.y = 0.10;
      m.renderOrder = 4;
      enemy.root.add(m);
      this.decals.push({ mesh: m, life: dur, maxLife: dur, pulse: true, parent: enemy.root });
    }
    telegraphCircle(pos, radius, dur, color) {
      const d = this.groundDecal(pos.x, pos.z, radius, color || 0xff3a2a, dur, { opacity: 0.5, spin: 1.2 });
      d.pulse = true;
      return d;
    }
    telegraphLine(enemy, dur) {
      const geo = new THREE.PlaneGeometry(0.35, 20);
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
        color: 0xc07dff, transparent: true, opacity: 0.3, side: THREE.DoubleSide,
        depthWrite: false, blending: THREE.AdditiveBlending,
      }));
      m.rotation.x = -Math.PI / 2;
      m.position.set(0, 0.12, 10);
      enemy.root.add(m);
      this.decals.push({ mesh: m, life: dur, maxLife: dur, pulse: true, parent: enemy.root });
    }

    /* ---- 무기 궤적 ---- */
    setTrail(owner, on, weapon, color) {
      let t = this.trails.get(owner);
      if (on) {
        if (!t) {
          t = { trail: new Trail(this.scene, color || 0xffffff, 18), weapon };
          this.trails.set(owner, t);
        }
        t.weapon = weapon;
        t.trail.start(color);
      } else if (t) {
        t.trail.stop();
      }
    }
    updateTrails(dt) {
      const wp1 = new THREE.Vector3(), wp2 = new THREE.Vector3();
      for (const [owner, t] of this.trails) {
        if (t.trail.active && t.weapon && t.weapon.userData.base) {
          t.weapon.userData.base.getWorldPosition(wp1);
          t.weapon.userData.tip.getWorldPosition(wp2);
          t.trail.sample(wp1, wp2);
        }
        t.trail.update(dt);
      }
    }

    /* ---- 갱신 ---- */
    update(dt, camera) {
      this.particles.update(dt);
      this.updateTrails(dt);
      for (let i = this.decals.length - 1; i >= 0; i--) {
        const d = this.decals[i];
        d.life -= dt;
        const k = U.clamp01(d.life / d.maxLife);
        if (d.life <= 0) {
          if (d.mesh.parent) d.mesh.parent.remove(d.mesh);
          d.mesh.geometry.dispose();
          d.mesh.material.dispose();
          this.decals.splice(i, 1);
          continue;
        }
        if (d.grow) {
          const s = 1 + (1 - k) * d.grow;
          d.mesh.scale.setScalar(s);
          d.mesh.material.opacity = k * 0.9;
        } else if (d.pulse) {
          d.mesh.material.opacity = (0.18 + (1 - k) * 0.45) * (0.7 + 0.3 * Math.sin(this.game.time * 30));
        } else {
          d.mesh.material.opacity = (d.fadeIn && k > 0.85 ? (1 - k) / 0.15 : 1) * Math.min(1, k * 2.5) * 0.85;
        }
        if (d.spin) d.mesh.rotation.z += dt * d.spin;
        if (d.billboard && camera) d.mesh.quaternion.copy(camera.quaternion);
      }
    }
  }

  /* ============================================================
     투사체
     ============================================================ */
  class Projectile {
    constructor(game, opts) {
      this.game = game;
      this.pos = opts.from.clone();
      this.vel = opts.dir.clone().normalize().multiplyScalar(opts.speed);
      this.dmg = opts.dmg;
      this.element = opts.element;
      this.fromEnemy = !!opts.fromEnemy;
      this.life = opts.life || 4;
      this.radius = opts.radius || 0.7;
      this.chains = opts.chains || 0;
      this.chainRange = opts.chainRange || 7;
      this.hitSet = new Set();
      this.homing = opts.homing || 0;
      this.target = opts.target || null;

      const color = ELEM_COLOR[opts.element] || 0xffffff;
      const g = new THREE.Group();
      const core = new THREE.Mesh(
        new THREE.OctahedronGeometry(opts.size || 0.28),
        new THREE.MeshBasicMaterial({ color, toneMapped: false })
      );
      g.add(core);
      const halo = new THREE.Mesh(
        new THREE.SphereGeometry((opts.size || 0.28) * 2.1, 10, 8),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      g.add(halo);
      const light = new THREE.PointLight(color, 1.4, 10, 2);
      g.add(light);
      g.position.copy(this.pos);
      game.scene.add(g);
      this.mesh = g; this.core = core;
    }

    update(dt) {
      this.life -= dt;
      if (this.homing && this.target && !this.target.dead) {
        const d = new THREE.Vector3().subVectors(this.target.centerPoint(), this.pos).normalize();
        this.vel.lerp(d.multiplyScalar(this.vel.length()), U.clamp01(this.homing * dt));
      }
      this.pos.addScaledVector(this.vel, dt);
      this.mesh.position.copy(this.pos);
      this.core.rotation.x += dt * 8;
      this.core.rotation.y += dt * 6;

      this.game.vfx.particles.burst(this.pos, {
        color: ELEM_COLOR[this.element] || 0xffffff, count: 1,
        speedMin: 0, speedMax: 0.6, sizeMin: 0.15, sizeMax: 0.35,
        lifeMin: 0.2, lifeMax: 0.4, up: 0, gravity: 0,
      });

      const groundY = this.game.world.height(this.pos.x, this.pos.z);
      if (this.pos.y < groundY + 0.1) return this.explode();
      if (this.life <= 0) return this.explode();

      if (this.fromEnemy) {
        const p = this.game.player;
        if (!p.dead && p.centerPoint().distanceTo(this.pos) < this.radius + 0.6) {
          this.game.damagePlayer(this.dmg, null, { element: this.element });
          return this.explode();
        }
      } else {
        for (const e of this.game.enemies) {
          if (e.dead || this.hitSet.has(e)) continue;
          if (e.centerPoint().distanceTo(this.pos) < this.radius + e.type.radius) {
            this.hitSet.add(e);
            const r = this.game.player.rollDamage(this.dmg);
            e.takeDamage(r.dmg, this.element, { crit: r.crit, hitPoint: this.pos.clone(), knockback: 1.5 });
            if (this.chains > 0) {
              const next = this.findChain(e);
              if (next) {
                this.chains--;
                this.game.vfx.chainBolt(this.pos.clone(), next.centerPoint(), this.element);
                this.pos.copy(e.centerPoint());
                this.vel.copy(next.centerPoint()).sub(this.pos).normalize().multiplyScalar(this.vel.length());
                this.target = next; this.homing = 8;
                this.life = Math.max(this.life, 0.9);
                return true;
              }
            }
            return this.explode();
          }
        }
      }
      return true;
    }

    findChain(from) {
      let best = null, bd = this.chainRange;
      for (const e of this.game.enemies) {
        if (e.dead || this.hitSet.has(e)) continue;
        const d = e.centerPoint().distanceTo(from.centerPoint());
        if (d < bd) { bd = d; best = e; }
      }
      return best;
    }

    explode() {
      this.game.vfx.hitBurst(this.pos, this.element, 1.3);
      this.dispose();
      return false;
    }
    dispose() {
      this.game.scene.remove(this.mesh);
      this.mesh.traverse(o => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
      this.dead = true;
    }
  }

  /* 연쇄 번개 시각 효과 */
  VFX.prototype.chainBolt = function (a, b, element) {
    const color = ELEM_COLOR[element] || 0xc07dff;
    const N = 8;
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const p = new THREE.Vector3().lerpVectors(a, b, t);
      if (i > 0 && i < N) {
        p.x += U.rand(-0.5, 0.5); p.y += U.rand(-0.5, 0.5); p.z += U.rand(-0.5, 0.5);
      }
      pts.push(p);
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
      color, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    line.renderOrder = 19;
    this.scene.add(line);
    this.decals.push({ mesh: line, life: 0.16, maxLife: 0.16 });
  };

  const Combat = {
    REACTIONS, ELEM_COLOR,
    reactionOf(auraEl, incEl) { return REACTIONS[auraEl + '>' + incEl] || null; },
  };

  AB.VFX = VFX;
  AB.Projectile = Projectile;
  AB.Particles = Particles;
  AB.Trail = Trail;
  AB.Combat = Combat;
})(window);
