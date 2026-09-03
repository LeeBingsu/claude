/* ============================================================
   AETHER BLADE  —  character.js
   절차적 휴머노이드 리그 + 키프레임/프로시저럴 애니메이터
   ============================================================ */
(function (global) {
  'use strict';
  const AB = global.AB, U = AB.U, Assets = AB.Assets;

  const BONES = [
    'hip', 'torso', 'chest', 'neck', 'head',
    'shoulderL', 'armL', 'forearmL', 'handL',
    'shoulderR', 'armR', 'forearmR', 'handR',
    'thighL', 'shinL', 'footL',
    'thighR', 'shinR', 'footR',
  ];

  /* ---------- 형상 헬퍼 ---------- */
  function box(w, h, d) { return new THREE.BoxGeometry(w, h, d); }
  function cyl(rt, rb, h, seg) { return new THREE.CylinderGeometry(rt, rb, h, seg || 8); }
  function sph(r, w, h) { return new THREE.SphereGeometry(r, w || 12, h || 10); }

  /** 메시 + 외곽선 셸 생성 */
  function part(parent, geo, mat, pos, outlineScale) {
    const m = new THREE.Mesh(geo, mat);
    if (pos) m.position.set(pos[0] || 0, pos[1] || 0, pos[2] || 0);
    m.castShadow = true;
    parent.add(m);
    if (outlineScale !== 0) {
      const o = new THREE.Mesh(geo, Rig.outlineMat);
      o.scale.setScalar(outlineScale || 1.055);
      o.renderOrder = -1;
      m.add(o);
    }
    return m;
  }
  function group(parent, pos) {
    const g = new THREE.Group();
    if (pos) g.position.set(pos[0] || 0, pos[1] || 0, pos[2] || 0);
    parent.add(g);
    return g;
  }

  function taper(wT, dT, wB, dB, h) {
    const g = new THREE.BoxGeometry(1, h, 1, 1, 1, 1);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      const t = (y + h / 2) / h;
      p.setX(i, p.getX(i) * U.lerp(wB, wT, t));
      p.setZ(i, p.getZ(i) * U.lerp(dB, dT, t));
    }
    g.computeVertexNormals();
    return g;
  }
  const H_box = box, H_cyl = cyl, H_sph = sph;

  /* ============================================================
     Rig — 휴머노이드 골격 + 메시
     ============================================================ */
  class Rig {
    /**
     * cfg: {skin, hair, coat, trim, accent, element, scale, bulk, hairStyle}
     */
    constructor(cfg) {
      this.cfg = cfg;
      this.root = new THREE.Group();
      this.bones = {};
      this.dynamics = [];   // 머리카락·코트 흔들림
      this.emissives = [];  // 원소 발광 파츠
      this.build();
    }

    build() {
      const c = this.cfg;
      const S = c.scale || 1;
      const bulk = c.bulk || 1;

      const M = {
        skin: Assets.toon(c.skin),
        skinDark: Assets.toon(new THREE.Color(c.skin).multiplyScalar(0.86).getHex()),
        hair: Assets.toon(c.hair),
        hairDark: Assets.toon(new THREE.Color(c.hair).multiplyScalar(0.72).getHex()),
        coat: Assets.toon(c.coat),
        coatDark: Assets.toon(new THREE.Color(c.coat).multiplyScalar(0.75).getHex()),
        trim: Assets.toon(c.trim),
        dark: Assets.toon(c.dark || 0x22242f),
        cloth: Assets.toon(c.cloth || 0x3a3f52),
        metal: Assets.toon(0xa8b0c4),
        glow: new THREE.MeshBasicMaterial({ color: c.accent, toneMapped: false }),
        white: Assets.toon(0xf2f4fa),
        black: new THREE.MeshBasicMaterial({ color: 0x1a1c26 }),
      };
      this.mats = M;

      const root = this.root;
      root.scale.setScalar(S);

      const hip = group(root, [0, 0.90, 0]);
      const torso = group(hip, [0, 0.09, 0]);
      const chest = group(torso, [0, 0.27, 0]);
      const neck = group(chest, [0, 0.25, 0]);
      const head = group(neck, [0, 0.07, 0]);

      /* ---------------- 골반 ---------------- */
      part(hip, taper(0.30 * bulk, 0.19, 0.26 * bulk, 0.18, 0.20), M.dark, [0, -0.04, 0]);
      part(hip, taper(0.35 * bulk, 0.23, 0.33 * bulk, 0.22, 0.09), M.trim, [0, 0.06, 0], 1.04);
      const buckle = part(hip, H_box(0.085, 0.085, 0.03), M.glow, [0, 0.06, 0.115], 0);
      buckle.rotation.z = Math.PI / 4;
      this.emissives.push(buckle);
      // 벨트 주머니
      part(hip, H_box(0.11, 0.13, 0.09), M.cloth, [-0.17 * bulk, 0.0, 0.06], 1.05);
      part(hip, H_box(0.08, 0.10, 0.07), M.cloth, [0.19 * bulk, 0.01, -0.04], 1.05);

      /* ---------------- 몸통 ---------------- */
      part(torso, taper(0.34 * bulk, 0.22, 0.30 * bulk, 0.20, 0.28), M.coat, [0, 0.13, 0]);
      // 허리 밴드
      part(torso, taper(0.31 * bulk, 0.21, 0.30 * bulk, 0.20, 0.06), M.trim, [0, 0.0, 0], 1.04);

      /* ---------------- 흉부 ---------------- */
      part(chest, taper(0.40 * bulk, 0.25, 0.35 * bulk, 0.23, 0.30), M.coat, [0, 0.12, 0]);
      // 흉갑
      const plate = part(chest, taper(0.30 * bulk, 0.10, 0.26 * bulk, 0.09, 0.26), M.trim, [0, 0.13, 0.085], 1.04);
      plate.rotation.x = -0.06;
      // 코트 옷깃
      [[-1], [1]].forEach(([sx]) => {
        const lapel = part(chest, taper(0.13, 0.05, 0.09, 0.04, 0.30), M.coatDark, [sx * 0.10 * bulk, 0.14, 0.115], 1.04);
        lapel.rotation.z = sx * 0.22;
        lapel.rotation.x = -0.12;
      });
      // 원소 코어
      const core = part(chest, H_sph(0.052, 12, 10), M.glow, [0, 0.17, 0.135], 0);
      this.emissives.push(core);
      const coreRing = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.014, 6, 16), M.metal);
      coreRing.position.set(0, 0.17, 0.132);
      chest.add(coreRing);
      // 등 십자 스트랩
      [[-1], [1]].forEach(([sx]) => {
        const st = part(chest, H_box(0.05, 0.42, 0.03), M.dark, [sx * 0.09, 0.12, -0.125], 0);
        st.rotation.z = sx * 0.28;
      });
      // 목깃 (하이칼라)
      const collar = part(chest, taper(0.20, 0.20, 0.17, 0.17, 0.16), M.coatDark, [0, 0.28, -0.01], 1.03);
      collar.rotation.x = -0.1;

      /* ---------------- 목 / 머리 ---------------- */
      part(neck, H_cyl(0.058, 0.070, 0.12, 8), M.skinDark, [0, 0.02, 0], 1.03);

      const skull = part(head, H_sph(0.153, 16, 14), M.skin, [0, 0.10, 0]);
      skull.scale.set(1.0, 1.07, 0.98);
      // 턱
      const jaw = part(head, taper(0.19, 0.20, 0.10, 0.14, 0.13), M.skin, [0, 0.005, 0.012], 1.03);
      jaw.rotation.x = -0.05;
      // 귀
      [[-1], [1]].forEach(([sx]) => {
        const ear = part(head, H_box(0.028, 0.075, 0.05), M.skin, [sx * 0.152, 0.085, -0.005], 1.05);
        ear.rotation.z = sx * 0.12;
      });
      // 코
      const nose = part(head, new THREE.ConeGeometry(0.022, 0.05, 4), M.skinDark, [0, 0.065, 0.145], 0);
      nose.rotation.x = Math.PI / 2.1;
      // 눈 (흰자 + 홍채 + 하이라이트)
      this.eyes = [];
      [[-1], [1]].forEach(([sx]) => {
        const eg = group(head, [sx * 0.052, 0.098, 0.132]);
        const w = new THREE.Mesh(new THREE.SphereGeometry(0.034, 12, 10), M.white);
        w.scale.set(1.0, 0.72, 0.42);
        eg.add(w);
        const iris = new THREE.Mesh(new THREE.CircleGeometry(0.021, 14),
          new THREE.MeshBasicMaterial({ color: c.accent, toneMapped: false }));
        iris.position.set(0, -0.002, 0.016);
        eg.add(iris);
        const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.0095, 12), M.black);
        pupil.position.set(0, -0.002, 0.0175);
        eg.add(pupil);
        const hi = new THREE.Mesh(new THREE.CircleGeometry(0.0065, 8),
          new THREE.MeshBasicMaterial({ color: 0xffffff }));
        hi.position.set(-sx * 0.007, 0.008, 0.0185);
        eg.add(hi);
        this.eyes.push(eg);
      });
      // 눈썹
      [[-1], [1]].forEach(([sx]) => {
        const b = part(head, H_box(0.044, 0.009, 0.012), M.hairDark, [sx * 0.054, 0.142, 0.138], 0);
        b.rotation.z = sx * 0.16;
      });
      // 입
      part(head, H_box(0.030, 0.007, 0.01), M.skinDark, [0, 0.020, 0.144], 0);

      /* ---------------- 머리카락 ---------------- */
      const capMesh = part(head, H_sph(0.170, 16, 14), M.hair, [0, 0.112, -0.010]);
      capMesh.scale.set(1.02, 0.95, 1.03);
      // 앞머리 (여러 갈래)
      const bangCount = 7;
      for (let i = 0; i < bangCount; i++) {
        const t = i / (bangCount - 1) - 0.5;
        const bg = group(head, [t * 0.26, 0.205, 0.075 - Math.abs(t) * 0.06]);
        const len = 0.14 + (1 - Math.abs(t) * 1.4) * 0.09;
        const b = part(bg, taper(0.055, 0.04, 0.020, 0.02, len), M.hair, [0, -len / 2, 0], 1.05);
        bg.rotation.x = 0.30 + Math.abs(t) * 0.25;
        bg.rotation.z = t * 0.6;
        bg.rotation.y = t * 0.3;
      }
      // 옆머리 (물리)
      const sideLen = c.hairStyle === 'long' ? 0.42 : 0.22;
      [[-1], [1]].forEach(([sx]) => {
        const g = group(head, [sx * 0.135, 0.16, 0.03]);
        part(g, taper(0.075, 0.06, 0.045, 0.045, sideLen), M.hair, [0, -sideLen / 2, 0], 1.04);
        g.rotation.x = -0.08;
        g.rotation.z = sx * 0.10;
        this.dynamics.push({ obj: g, restX: -0.08, restZ: sx * 0.10, vx: 0, vz: 0, k: 44, d: 7, w: 0.5 });
      });
      // 뒷머리
      const backLen = c.hairStyle === 'long' ? 0.70 : 0.26;
      const backG = group(head, [0, 0.12, -0.135]);
      part(backG, taper(0.20, 0.10, 0.12, 0.08, backLen), M.hair, [0, -backLen / 2, 0], 1.04);
      backG.rotation.x = -0.14;
      this.dynamics.push({ obj: backG, restX: -0.14, restZ: 0, vx: 0, vz: 0, k: 32, d: 6, w: 0.85 });
      if (c.hairStyle === 'long') {
        // 트윈 테일
        [[-1], [1]].forEach(([sx]) => {
          const g = group(head, [sx * 0.115, 0.19, -0.12]);
          const L = 0.50;
          part(g, taper(0.09, 0.08, 0.045, 0.04, L), M.hair, [0, -L / 2, 0], 1.04);
          const tie = part(g, H_cyl(0.055, 0.055, 0.045, 8), M.trim, [0, -0.03, 0], 1.06);
          g.rotation.x = -0.32; g.rotation.z = sx * 0.26;
          this.dynamics.push({ obj: g, restX: -0.32, restZ: sx * 0.26, vx: 0, vz: 0, k: 30, d: 5.5, w: 1.0 });
        });
      }
      // 아호게
      const ahoge = group(head, [0.02, 0.255, -0.02]);
      part(ahoge, taper(0.028, 0.024, 0.012, 0.012, 0.16), M.hair, [0, 0.08, 0], 0);
      ahoge.rotation.z = -0.35; ahoge.rotation.x = -0.2;
      this.dynamics.push({ obj: ahoge, restX: -0.2, restZ: -0.35, vx: 0, vz: 0, k: 60, d: 6, w: 0.6 });

      /* ---------------- 어깨 갑주 ---------------- */
      [[-1, 'L'], [1, 'R']].forEach(([sx, side]) => {
        const paul = group(chest, [sx * 0.225 * bulk, 0.205, 0]);
        const p1 = part(paul, taper(0.17 * bulk, 0.21, 0.19 * bulk, 0.23, 0.10), M.trim, [0, 0.0, 0], 1.04);
        p1.rotation.z = sx * 0.24;
        const p2 = part(paul, taper(0.165 * bulk, 0.205, 0.14 * bulk, 0.18, 0.085), M.trim, [sx * 0.03, -0.095, 0], 1.04);
        p2.rotation.z = sx * 0.34;
        const gem = part(paul, H_sph(0.032, 8, 8), M.glow, [sx * 0.02, 0.055, 0.10], 0);
        this.emissives.push(gem);
      });

      /* ---------------- 팔 ---------------- */
      const mkArm = (side) => {
        const sx = side === 'L' ? -1 : 1;
        const sh = group(chest, [sx * 0.225 * bulk, 0.145, 0]);
        part(sh, H_sph(0.072 * bulk, 10, 8), M.coat, [0, 0, 0], 1.05); // 어깨 관절
        const arm = group(sh, [0, 0, 0]);
        part(arm, taper(0.115 * bulk, 0.115 * bulk, 0.095 * bulk, 0.095 * bulk, 0.30), M.coat, [0, -0.15, 0]);
        // 상완 밴드
        part(arm, taper(0.105 * bulk, 0.105 * bulk, 0.10 * bulk, 0.10 * bulk, 0.045), M.trim, [0, -0.26, 0], 1.05);
        const fore = group(arm, [0, -0.30, 0]);
        part(fore, H_sph(0.058 * bulk, 10, 8), M.skin, [0, 0, 0], 1.05); // 팔꿈치
        part(fore, taper(0.095 * bulk, 0.095 * bulk, 0.072 * bulk, 0.072 * bulk, 0.28), M.skin, [0, -0.14, 0]);
        // 건틀릿
        const br = part(fore, taper(0.115 * bulk, 0.115 * bulk, 0.10 * bulk, 0.10 * bulk, 0.17), M.metal, [0, -0.13, 0], 1.04);
        part(fore, H_box(0.045, 0.10, 0.02), M.glow, [0, -0.13, 0.055 * bulk], 0);
        const hand = group(fore, [0, -0.285, 0]);
        // 손 (손등 + 엄지 + 손가락)
        part(hand, taper(0.085, 0.06, 0.075, 0.055, 0.10), M.dark, [0, -0.05, 0], 1.05);
        const thumb = part(hand, H_box(0.026, 0.055, 0.026), M.dark, [-sx * 0.045, -0.045, 0.025], 0);
        thumb.rotation.z = sx * 0.5;
        part(hand, H_box(0.072, 0.052, 0.055), M.dark, [0, -0.115, 0.005], 1.05);
        this.bones['shoulder' + side] = sh;
        this.bones['arm' + side] = arm;
        this.bones['forearm' + side] = fore;
        this.bones['hand' + side] = hand;
      };
      mkArm('L'); mkArm('R');

      /* ---------------- 다리 ---------------- */
      const mkLeg = (side) => {
        const sx = side === 'L' ? -1 : 1;
        const thigh = group(hip, [sx * 0.100 * bulk, -0.075, 0]);
        part(thigh, H_sph(0.088 * bulk, 10, 8), M.dark, [0, 0, 0], 1.04);
        part(thigh, taper(0.155 * bulk, 0.155 * bulk, 0.125 * bulk, 0.125 * bulk, 0.42), M.dark, [0, -0.21, 0]);
        // 허벅지 갑주
        const tp = part(thigh, taper(0.15 * bulk, 0.06, 0.11 * bulk, 0.05, 0.20), M.cloth, [0, -0.16, 0.062 * bulk], 1.05);
        const shin = group(thigh, [0, -0.42, 0]);
        part(shin, H_sph(0.072 * bulk, 10, 8), M.dark, [0, 0, 0], 1.04); // 무릎
        part(shin, taper(0.132 * bulk, 0.132 * bulk, 0.098 * bulk, 0.098 * bulk, 0.40), M.dark, [0, -0.20, 0]);
        // 무릎 보호대
        part(shin, taper(0.13 * bulk, 0.06, 0.10 * bulk, 0.05, 0.11), M.trim, [0, -0.03, 0.058 * bulk], 1.05);
        // 부츠
        part(shin, taper(0.16 * bulk, 0.16 * bulk, 0.14 * bulk, 0.15 * bulk, 0.20), M.trim, [0, -0.30, 0.005], 1.04);
        part(shin, taper(0.175 * bulk, 0.175 * bulk, 0.165 * bulk, 0.165 * bulk, 0.05), M.coatDark, [0, -0.205, 0], 1.05);
        const foot = group(shin, [0, -0.40, 0]);
        part(foot, taper(0.135, 0.24, 0.125, 0.26, 0.075), M.trim, [0, -0.035, 0.055], 1.04);
        part(foot, H_box(0.14, 0.03, 0.27), M.black, [0, -0.075, 0.055], 0); // 밑창
        this.bones['thigh' + side] = thigh;
        this.bones['shin' + side] = shin;
        this.bones['foot' + side] = foot;
      };
      mkLeg('L'); mkLeg('R');

      /* ---------------- 허리 장식 패널 (물리) ---------------- */
      const panels = [[-1, 0.145, -0.02], [1, 0.145, -0.02], [-1, 0.055, -0.115], [1, 0.055, -0.115]];
      panels.forEach(([sx, ox, oz], i) => {
        const g = group(hip, [sx * ox, -0.035, oz]);
        const L = i < 2 ? 0.52 : 0.62;
        part(g, taper(0.19, 0.05, 0.15, 0.045, L), i < 2 ? M.coat : M.coatDark, [0, -L / 2, 0], 1.03);
        g.rotation.x = 0.05;
        g.rotation.z = -sx * 0.05;
        this.dynamics.push({ obj: g, restX: 0.05, restZ: -sx * 0.05, vx: 0, vz: 0, k: 30, d: 5.5, w: 1.0 });
      });

      /* ---------------- 망토 ---------------- */
      if (c.cape !== false) {
        const cape = group(chest, [0, 0.24, -0.11]);
        const capeMesh = part(cape, taper(0.44, 0.05, 0.62, 0.06, 0.95), M.trim, [0, -0.47, 0], 1.02);
        capeMesh.castShadow = true;
        cape.rotation.x = 0.06;
        this.dynamics.push({ obj: cape, restX: 0.06, restZ: 0, vx: 0, vz: 0, k: 22, d: 4.6, w: 1.35 });
        this.cape = cape;
      }

      /* ---------------- 스카프 ---------------- */
      if (c.scarf) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.038, 8, 14), M.cloth);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.03;
        neck.add(ring);
        const tail = group(chest, [0.06, 0.24, -0.09]);
        part(tail, taper(0.11, 0.04, 0.07, 0.03, 0.55), M.cloth, [0, -0.27, 0], 1.04);
        tail.rotation.x = 0.2; tail.rotation.z = 0.18;
        this.dynamics.push({ obj: tail, restX: 0.2, restZ: 0.18, vx: 0, vz: 0, k: 26, d: 4.2, w: 1.5 });
      }

      Object.assign(this.bones, { hip, torso, chest, neck, head });

      this.rest = {};
      for (const b of BONES) {
        const o = this.bones[b];
        this.rest[b] = o ? [o.rotation.x, o.rotation.y, o.rotation.z] : [0, 0, 0];
      }
      this.hipRestY = hip.position.y;
      this.blinkTimer = 1 + Math.random() * 3;
    }

    /** 눈 깜빡임 */
    updateFace(dt) {
      if (!this.eyes || !this.eyes.length) return;
      this.blinkTimer -= dt;
      if (this.blinkTimer < 0) {
        const t = -this.blinkTimer;
        const k = t < 0.06 ? 1 - t / 0.06 : t < 0.12 ? (t - 0.06) / 0.06 : 1;
        for (const e of this.eyes) e.scale.y = Math.max(0.05, k);
        if (t > 0.13) this.blinkTimer = 2 + Math.random() * 4;
      } else {
        for (const e of this.eyes) e.scale.y = 1;
      }
    }

    /** 무기를 오른손(또는 지정 본)에 장착 */
    attachWeapon(weapon, boneName) {
      const b = this.bones[boneName || 'handR'];
      if (!b) return;
      if (this.weapon && this.weapon.parent) this.weapon.parent.remove(this.weapon);
      this.weapon = weapon;
      b.add(weapon);
    }

    /** 이동 가속도에 반응하는 머리카락·코트 물리 */
    updateDynamics(dt, localAccel, speed01) {
      for (const d of this.dynamics) {
        const targetX = d.restX + localAccel.z * 0.55 * d.w + speed01 * 0.30 * d.w;
        const targetZ = d.restZ - localAccel.x * 0.45 * d.w;
        d.vx += (targetX - d.obj.rotation.x) * d.k * dt;
        d.vz += (targetZ - d.obj.rotation.z) * d.k * dt;
        d.vx -= d.vx * Math.min(1, d.d * dt);
        d.vz -= d.vz * Math.min(1, d.d * dt);
        d.obj.rotation.x = U.clamp(d.obj.rotation.x + d.vx * dt, -1.2, 1.2);
        d.obj.rotation.z = U.clamp(d.obj.rotation.z + d.vz * dt, -1.0, 1.0);
      }
    }

    setOpacity(a) {
      this.root.traverse(o => {
        if (o.isMesh) {
          o.material.transparent = a < 1;
          o.material.opacity = a;
        }
      });
    }
  }
  Rig.outlineMat = null; // init() 에서 채움

  /* ============================================================
     포즈 유틸
     ============================================================ */
  function P(obj) { return obj; } // 가독성용

  /** 두 포즈 사이 보간 */
  function blendPose(out, a, b, t) {
    for (const k in a) {
      const va = a[k], vb = b[k] || [0, 0, 0];
      let o = out[k];
      if (!o) o = out[k] = [0, 0, 0];
      o[0] = U.lerp(va[0], vb[0], t);
      o[1] = U.lerp(va[1], vb[1], t);
      o[2] = U.lerp(va[2], vb[2], t);
    }
    for (const k in b) {
      if (!(k in a)) {
        const vb = b[k];
        let o = out[k];
        if (!o) o = out[k] = [0, 0, 0];
        o[0] = U.lerp(0, vb[0], t);
        o[1] = U.lerp(0, vb[1], t);
        o[2] = U.lerp(0, vb[2], t);
      }
    }
    return out;
  }

  /* ============================================================
     클립 — 키프레임 애니메이션 정의
     각 프레임: {t: 0~1 정규화, p: {bone:[x,y,z]}, rootZ, rootY}
     ============================================================ */
  const CLIPS = {};

  function defClip(name, def) { CLIPS[name] = def; }

  // 대검 3연타
  defClip('atk_heavy_1', {
    dur: 0.62, lock: 0.50, move: [0, 0, 3.2],
    hits: [{ t: 0.30, arc: 2.2, range: 2.5, mult: 1.0, kb: 3.0 }],
    trail: [0.22, 0.52],
    frames: [
      { t: 0.00, p: { chest: [0, -0.5, 0], armR: [-0.6, 0, -1.4], forearmR: [-0.5, 0, 0], armL: [-0.4, 0, 0.8], hip: [0, -0.25, 0], thighR: [-0.2, 0, 0] } },
      { t: 0.22, p: { chest: [-0.25, -1.0, 0], armR: [-2.5, 0, -1.0], forearmR: [-0.9, 0, 0], armL: [-0.9, 0, 0.6], hip: [-0.1, -0.5, 0], thighR: [-0.5, 0, 0], thighL: [0.3, 0, 0] } },
      { t: 0.38, p: { chest: [0.35, 0.75, 0], armR: [0.5, 0, -0.35], forearmR: [-0.25, 0, 0], armL: [0.2, 0, 0.7], hip: [0.22, 0.42, 0], thighR: [0.35, 0, 0], thighL: [-0.4, 0, 0] } },
      { t: 0.62, p: { chest: [0.2, 0.5, 0], armR: [0.15, 0, -0.5], forearmR: [-0.5, 0, 0], armL: [0.0, 0, 0.6], hip: [0.12, 0.3, 0], thighR: [0.2, 0, 0], thighL: [-0.2, 0, 0] } },
      { t: 1.00, p: {} },
    ],
  });
  defClip('atk_heavy_2', {
    dur: 0.66, lock: 0.54, move: [0, 0, 2.6],
    hits: [{ t: 0.32, arc: 2.4, range: 2.6, mult: 1.15, kb: 3.4 }],
    trail: [0.24, 0.56],
    frames: [
      { t: 0.00, p: {} },
      { t: 0.24, p: { chest: [-0.2, 1.05, 0], armR: [-2.2, 0, 1.1], forearmR: [-1.1, 0, 0], armL: [-0.7, 0, -0.5], hip: [-0.08, 0.5, 0] } },
      { t: 0.40, p: { chest: [0.3, -0.85, 0], armR: [0.4, 0, 0.5], forearmR: [-0.3, 0, 0], armL: [0.1, 0, -0.6], hip: [0.2, -0.45, 0] } },
      { t: 0.66, p: { chest: [0.15, -0.5, 0], armR: [0.1, 0, 0.3], forearmR: [-0.5, 0, 0], hip: [0.1, -0.3, 0] } },
      { t: 1.00, p: {} },
    ],
  });
  defClip('atk_heavy_3', {
    dur: 0.90, lock: 0.74, move: [0, 0, 3.8],
    hits: [{ t: 0.42, arc: 3.4, range: 3.0, mult: 1.7, kb: 7.0, stagger: true }],
    trail: [0.28, 0.70],
    frames: [
      { t: 0.00, p: {} },
      { t: 0.18, p: { chest: [-0.45, 0.2, 0], armR: [-2.8, 0, -0.4], forearmR: [-1.5, 0, 0], armL: [-1.2, 0, 0.4], hip: [-0.2, 0, 0], thighL: [0.4, 0, 0], thighR: [-0.3, 0, 0] } },
      { t: 0.30, p: { chest: [-0.55, 0.4, 0], armR: [-3.0, 0, -0.5], forearmR: [-1.8, 0, 0], hip: [-0.28, 0.1, 0] } },
      { t: 0.48, p: { chest: [0.62, -0.15, 0], armR: [0.9, 0, -0.1], forearmR: [-0.1, 0, 0], armL: [0.5, 0, 0.3], hip: [0.42, 0, 0], thighL: [-0.55, 0, 0], thighR: [0.5, 0, 0] } },
      { t: 0.70, p: { chest: [0.4, -0.1, 0], armR: [0.5, 0, -0.2], forearmR: [-0.4, 0, 0], hip: [0.28, 0, 0] } },
      { t: 1.00, p: {} },
    ],
  });

  // 쌍검 4연타 (빠름)
  defClip('atk_fast_1', {
    dur: 0.30, lock: 0.20, move: [0, 0, 2.6],
    hits: [{ t: 0.32, arc: 1.7, range: 2.1, mult: 0.72, kb: 1.6 }],
    trail: [0.18, 0.55],
    frames: [
      { t: 0.00, p: {} },
      { t: 0.30, p: { chest: [0, -0.7, 0], armR: [-1.9, 0, -0.7], forearmR: [-0.9, 0, 0], armL: [-0.4, 0, 0.5] } },
      { t: 0.52, p: { chest: [0.15, 0.55, 0], armR: [-0.2, 0, 0.1], forearmR: [-0.3, 0, 0], armL: [-0.9, 0, 0.4] } },
      { t: 1.00, p: {} },
    ],
  });
  defClip('atk_fast_2', {
    dur: 0.30, lock: 0.20, move: [0, 0, 2.4],
    hits: [{ t: 0.34, arc: 1.7, range: 2.1, mult: 0.72, kb: 1.6 }],
    trail: [0.18, 0.55],
    frames: [
      { t: 0.00, p: {} },
      { t: 0.32, p: { chest: [0, 0.7, 0], armL: [-1.9, 0, 0.7], forearmL: [-0.9, 0, 0], armR: [-0.4, 0, -0.5] } },
      { t: 0.54, p: { chest: [0.15, -0.55, 0], armL: [-0.2, 0, -0.1], forearmL: [-0.3, 0, 0], armR: [-0.9, 0, -0.4] } },
      { t: 1.00, p: {} },
    ],
  });
  defClip('atk_fast_3', {
    dur: 0.34, lock: 0.24, move: [0, 0, 3.0],
    hits: [{ t: 0.36, arc: 2.0, range: 2.2, mult: 0.85, kb: 2.0 }],
    trail: [0.20, 0.60],
    frames: [
      { t: 0.00, p: {} },
      { t: 0.34, p: { chest: [-0.3, 0, 0], armR: [-2.6, 0, -0.3], armL: [-2.6, 0, 0.3], forearmR: [-0.7, 0, 0], forearmL: [-0.7, 0, 0] } },
      { t: 0.56, p: { chest: [0.4, 0, 0], armR: [0.4, 0, -0.2], armL: [0.4, 0, 0.2], forearmR: [-0.2, 0, 0], forearmL: [-0.2, 0, 0] } },
      { t: 1.00, p: {} },
    ],
  });
  defClip('atk_fast_4', {
    dur: 0.55, lock: 0.42, move: [0, 0, 4.4],
    hits: [{ t: 0.34, arc: 3.6, range: 2.4, mult: 1.2, kb: 4.0 }, { t: 0.62, arc: 3.6, range: 2.4, mult: 1.2, kb: 4.0 }],
    trail: [0.20, 0.78], spin: true,
    frames: [
      { t: 0.00, p: {} },
      { t: 0.22, p: { chest: [-0.2, 0.4, 0], armR: [-1.5, 0, -1.3], armL: [-1.5, 0, 1.3] } },
      { t: 0.55, p: { chest: [0.1, -0.3, 0], armR: [-1.4, 0, -1.5], armL: [-1.4, 0, 1.5] } },
      { t: 0.80, p: { chest: [0.2, 0, 0], armR: [-0.6, 0, -0.6], armL: [-0.6, 0, 0.6] } },
      { t: 1.00, p: {} },
    ],
  });

  // 창 3연타
  defClip('atk_polearm_1', {
    dur: 0.40, lock: 0.28, move: [0, 0, 4.0],
    hits: [{ t: 0.36, arc: 0.9, range: 3.1, mult: 0.95, kb: 2.4 }],
    trail: [0.22, 0.55],
    frames: [
      { t: 0.00, p: {} },
      { t: 0.20, p: { chest: [-0.1, 0.55, 0], armR: [-1.0, 0, -0.3], forearmR: [-1.6, 0, 0], armL: [-1.4, 0, 0.4], hip: [0, 0.3, 0] } },
      { t: 0.40, p: { chest: [0.1, -0.45, 0], armR: [-1.5, 0, 0.1], forearmR: [-0.15, 0, 0], armL: [-1.0, 0, -0.1], hip: [0, -0.25, 0] } },
      { t: 0.68, p: { chest: [0.05, -0.2, 0], armR: [-1.2, 0, -0.1], forearmR: [-0.6, 0, 0], hip: [0, -0.1, 0] } },
      { t: 1.00, p: {} },
    ],
  });
  defClip('atk_polearm_2', {
    dur: 0.42, lock: 0.30, move: [0, 0, 3.0],
    hits: [{ t: 0.36, arc: 2.6, range: 2.9, mult: 1.0, kb: 2.8 }],
    trail: [0.20, 0.60],
    frames: [
      { t: 0.00, p: {} },
      { t: 0.22, p: { chest: [0, -0.9, 0], armR: [-1.6, 0, -0.9], forearmR: [-0.5, 0, 0], armL: [-0.5, 0, 0.9] } },
      { t: 0.46, p: { chest: [0, 0.85, 0], armR: [-1.5, 0, 0.5], forearmR: [-0.4, 0, 0], armL: [-1.3, 0, -0.4] } },
      { t: 1.00, p: {} },
    ],
  });
  defClip('atk_polearm_3', {
    dur: 0.70, lock: 0.56, move: [0, 0, 3.4],
    hits: [{ t: 0.40, arc: 3.6, range: 3.2, mult: 1.55, kb: 5.5, stagger: true }],
    trail: [0.24, 0.72], spin: true,
    frames: [
      { t: 0.00, p: {} },
      { t: 0.24, p: { chest: [-0.3, 0.5, 0], armR: [-2.0, 0, -0.8], forearmR: [-0.9, 0, 0], armL: [-1.4, 0, 0.8], hip: [-0.1, 0, 0] } },
      { t: 0.50, p: { chest: [0.35, -0.4, 0], armR: [-1.0, 0, -0.2], forearmR: [-0.3, 0, 0], armL: [-0.6, 0, 0.3], hip: [0.2, 0, 0] } },
      { t: 1.00, p: {} },
    ],
  });

  // 스킬 / 궁극기 / 기타
  defClip('skill_cast', {
    dur: 0.85, lock: 0.62, move: [0, 0, 0],
    frames: [
      { t: 0.00, p: {} },
      { t: 0.22, p: { chest: [-0.35, 0, 0], armR: [-2.2, 0, -0.5], forearmR: [-1.2, 0, 0], armL: [-1.6, 0, 0.9], head: [-0.2, 0, 0], hip: [-0.15, 0, 0] } },
      { t: 0.45, p: { chest: [0.4, 0, 0], armR: [-0.3, 0, -0.2], forearmR: [-0.2, 0, 0], armL: [-0.5, 0, 0.3], head: [0.15, 0, 0], hip: [0.25, 0, 0] } },
      { t: 0.72, p: { chest: [0.15, 0, 0], armR: [-0.6, 0, -0.3], forearmR: [-0.5, 0, 0], hip: [0.1, 0, 0] } },
      { t: 1.00, p: {} },
    ],
  });
  defClip('ult_cast', {
    dur: 1.85, lock: 1.55, move: [0, 0, 0],
    frames: [
      { t: 0.00, p: {} },
      { t: 0.14, p: { chest: [-0.5, 0, 0], armR: [-1.0, 0, -1.5], armL: [-1.0, 0, 1.5], forearmR: [-0.6, 0, 0], forearmL: [-0.6, 0, 0], head: [-0.5, 0, 0], hip: [-0.25, 0, 0], thighL: [0.3, 0, 0], thighR: [0.3, 0, 0] } },
      { t: 0.34, p: { chest: [-0.65, 0, 0], armR: [-2.9, 0, -0.35], armL: [-2.9, 0, 0.35], forearmR: [-0.25, 0, 0], forearmL: [-0.25, 0, 0], head: [-0.65, 0, 0], hip: [-0.32, 0, 0] } },
      { t: 0.52, p: { chest: [-0.6, 0, 0], armR: [-3.0, 0, -0.2], armL: [-3.0, 0, 0.2], head: [-0.6, 0, 0], hip: [-0.3, 0, 0] } },
      { t: 0.66, p: { chest: [0.75, 0, 0], armR: [0.9, 0, -0.6], armL: [0.9, 0, 0.6], forearmR: [-0.3, 0, 0], forearmL: [-0.3, 0, 0], head: [0.45, 0, 0], hip: [0.45, 0, 0], thighL: [-0.5, 0, 0], thighR: [-0.5, 0, 0] } },
      { t: 0.88, p: { chest: [0.25, 0, 0], armR: [0.2, 0, -0.4], armL: [0.2, 0, 0.4], hip: [0.15, 0, 0] } },
      { t: 1.00, p: {} },
    ],
  });
  defClip('hurt', {
    dur: 0.42, lock: 0.30, move: [0, 0, -1.5],
    frames: [
      { t: 0.00, p: {} },
      { t: 0.16, p: { chest: [-0.5, 0.25, 0], head: [-0.35, 0.2, 0], armR: [-0.8, 0, -0.6], armL: [-0.8, 0, 0.6], hip: [-0.25, 0, 0], thighL: [0.25, 0, 0], thighR: [0.1, 0, 0] } },
      { t: 0.50, p: { chest: [-0.2, 0.1, 0], head: [-0.15, 0.1, 0], hip: [-0.1, 0, 0] } },
      { t: 1.00, p: {} },
    ],
  });
  defClip('die', {
    dur: 1.2, lock: 999, hold: true,
    frames: [
      { t: 0.00, p: {} },
      { t: 0.25, p: { chest: [-0.6, 0, 0], head: [-0.5, 0, 0], armR: [-1.0, 0, -0.5], armL: [-1.0, 0, 0.5], hip: [-0.3, 0, 0], thighL: [0.6, 0, 0], thighR: [0.5, 0, 0] } },
      { t: 1.00, p: { chest: [0.5, 0, 0.3], head: [0.4, 0, 0.2], armR: [-1.4, 0, -1.2], armL: [-1.4, 0, 1.2], hip: [0.9, 0, 0.2], thighL: [1.4, 0, 0], thighR: [1.2, 0, 0] }, rootY: -0.8, rootPitch: 1.35 },
    ],
  });
  defClip('interact', {
    dur: 0.9, lock: 0.7,
    frames: [
      { t: 0.00, p: {} },
      { t: 0.30, p: { chest: [0.45, 0, 0], armR: [-1.5, 0, -0.25], forearmR: [-0.5, 0, 0], head: [0.35, 0, 0], hip: [0.3, 0, 0], thighL: [0.4, 0, 0], thighR: [0.15, 0, 0] } },
      { t: 0.70, p: { chest: [0.45, 0, 0], armR: [-1.7, 0, -0.25], forearmR: [-0.4, 0, 0], head: [0.35, 0, 0], hip: [0.3, 0, 0], thighL: [0.4, 0, 0], thighR: [0.15, 0, 0] } },
      { t: 1.00, p: {} },
    ],
  });
  defClip('victory', {
    dur: 1.6, lock: 1.4,
    frames: [
      { t: 0.00, p: {} },
      { t: 0.30, p: { chest: [-0.2, 0, 0], armR: [-2.6, 0, -0.6], armL: [-0.4, 0, 0.4], head: [-0.3, 0, 0] } },
      { t: 0.70, p: { chest: [-0.15, 0, 0], armR: [-2.8, 0, -0.4], armL: [-0.3, 0, 0.3], head: [-0.25, 0, 0] } },
      { t: 1.00, p: {} },
    ],
  });

  /* ============================================================
     Animator
     ============================================================ */
  class Animator {
    constructor(rig) {
      this.rig = rig;
      this.time = 0;
      this.phase = 0;          // 보행 사이클 위상
      this.clip = null;
      this.clipName = null;
      this.clipTime = 0;
      this.clipWeight = 0;
      this.onEvent = null;     // (type, data) => void
      this._firedHits = new Set();
      this._pose = {};
      this._base = {};
      this._target = {};
      this._prevPos = new THREE.Vector3();
      this._accel = new THREE.Vector3();
      this._prevVel = new THREE.Vector3();
      this.rootExtra = { y: 0, pitch: 0, spin: 0 };
      this.speedScale = 1;
    }

    play(name, opts) {
      const c = CLIPS[name];
      if (!c) return false;
      this.clip = c;
      this.clipName = name;
      this.clipTime = 0;
      this.speedScale = (opts && opts.speed) || 1;
      this._firedHits.clear();
      return true;
    }
    stop() { this.clip = null; this.clipName = null; }
    /** 클립이 이동/입력을 잠그고 있는지 */
    get locked() {
      if (!this.clip) return false;
      return this.clipTime < (this.clip.lock || 0) / this.speedScale;
    }
    get playing() { return !!this.clip; }

    /** 클립에서 t(0~1) 시점 포즈 샘플링 */
    _sampleClip(out, clip, t) {
      const f = clip.frames;
      let i = 0;
      while (i < f.length - 1 && f[i + 1].t <= t) i++;
      const a = f[i], b = f[Math.min(i + 1, f.length - 1)];
      const span = Math.max(1e-5, b.t - a.t);
      const lt = U.clamp01((t - a.t) / span);
      const e = U.easeOutCubic(lt);
      for (const k in out) delete out[k];
      blendPose(out, a.p, b.p, e);
      this.rootExtra.y = U.lerp(a.rootY || 0, b.rootY || 0, e);
      this.rootExtra.pitch = U.lerp(a.rootPitch || 0, b.rootPitch || 0, e);
      return out;
    }

    /** 프로시저럴 이동/대기 포즈 */
    _locomotion(base, st, dt) {
      const speed01 = st.speed01 || 0;
      const t = this.time;
      for (const k in base) delete base[k];

      if (!st.grounded) {
        // 공중
        const up = st.vy > 0;
        base.chest = [up ? -0.15 : 0.20, 0, 0];
        base.armR = [up ? -2.2 : -0.9, 0, -0.55];
        base.armL = [up ? -2.2 : -0.9, 0, 0.55];
        base.forearmR = [-0.5, 0, 0];
        base.forearmL = [-0.5, 0, 0];
        base.thighR = [up ? -0.7 : 0.25, 0, 0];
        base.thighL = [up ? -0.25 : -0.35, 0, 0];
        base.shinR = [up ? 1.1 : 0.5, 0, 0];
        base.shinL = [0.5, 0, 0];
        base.head = [up ? -0.15 : 0.15, 0, 0];
        this.hipBob = 0;
        return base;
      }

      if (speed01 < 0.02) {
        // 대기 — 호흡 + 미세 흔들림
        const b = Math.sin(t * 1.7);
        const b2 = Math.sin(t * 0.9 + 1.2);
        base.chest = [0.045 + b * 0.028, b2 * 0.05, 0];
        base.torso = [0.02, b2 * 0.03, 0];
        base.head = [-0.03 - b * 0.02, b2 * 0.12, b2 * 0.02];
        base.armR = [-0.06 + b * 0.035, 0, -0.16 - b * 0.02];
        base.armL = [-0.06 + b * 0.035, 0, 0.16 + b * 0.02];
        base.forearmR = [-0.16, 0, -0.05];
        base.forearmL = [-0.16, 0, 0.05];
        base.thighR = [0.02, 0, -0.02];
        base.thighL = [0.02, 0, 0.02];
        base.shinR = [-0.05, 0, 0];
        base.shinL = [-0.05, 0, 0];
        this.hipBob = b * 0.012;
        return base;
      }

      // 보행 / 질주
      const run = U.clamp01((speed01 - 0.45) / 0.55);
      const freq = U.lerp(6.4, 10.6, run);
      this.phase += dt * freq * U.clamp(speed01 * 1.6, 0.4, 1.6);
      const p = this.phase;
      const amp = U.lerp(0.42, 0.95, run) * U.clamp01(speed01 * 1.5);
      const armAmp = U.lerp(0.42, 1.05, run) * U.clamp01(speed01 * 1.5);
      const lean = U.lerp(0.06, 0.34, run) * U.clamp01(speed01 * 1.4);

      const sinP = Math.sin(p), cosP = Math.cos(p);
      base.thighR = [sinP * amp, 0, -0.03];
      base.thighL = [-sinP * amp, 0, 0.03];
      base.shinR = [Math.max(0, -Math.sin(p + 0.9)) * amp * 1.25, 0, 0];
      base.shinL = [Math.max(0, -Math.sin(p + 0.9 + Math.PI)) * amp * 1.25, 0, 0];
      base.footR = [U.clamp(Math.sin(p - 0.6) * 0.35, -0.4, 0.5), 0, 0];
      base.footL = [U.clamp(Math.sin(p - 0.6 + Math.PI) * 0.35, -0.4, 0.5), 0, 0];
      base.armR = [-sinP * armAmp - lean * 0.4, 0, -0.14 - run * 0.05];
      base.armL = [sinP * armAmp - lean * 0.4, 0, 0.14 + run * 0.05];
      base.forearmR = [-0.25 - Math.max(0, -sinP) * 0.55, 0, 0];
      base.forearmL = [-0.25 - Math.max(0, sinP) * 0.55, 0, 0];
      base.hip = [lean * 0.45, -sinP * 0.10 * run, cosP * 0.055];
      base.torso = [lean * 0.35, sinP * 0.10, -cosP * 0.04];
      base.chest = [lean * 0.5, sinP * 0.16, -cosP * 0.05];
      base.head = [-lean * 0.5, -sinP * 0.10, 0];
      this.hipBob = Math.abs(Math.sin(p)) * U.lerp(0.02, 0.075, run) - 0.02 * run;

      // 발 접지 이벤트 (먼지·발소리)
      const stepSign = Math.sin(p);
      if (this._lastStepSign === undefined) this._lastStepSign = stepSign;
      if (this._lastStepSign < 0 && stepSign >= 0 && this.onEvent) this.onEvent('footstep', { foot: 'R' });
      if (this._lastStepSign > 0 && stepSign <= 0 && this.onEvent) this.onEvent('footstep', { foot: 'L' });
      this._lastStepSign = stepSign;

      return base;
    }

    /**
     * st: {speed01, grounded, vy, velocity:Vector3}
     */
    update(dt, st) {
      this.time += dt;
      const rig = this.rig;
      rig.updateFace(dt);

      // 클립 진행
      let clipPose = null, clipW = 0;
      if (this.clip) {
        this.clipTime += dt * this.speedScale;
        const dur = this.clip.dur;
        const nt = this.clipTime / dur;
        // 히트 이벤트
        if (this.clip.hits) {
          for (let i = 0; i < this.clip.hits.length; i++) {
            const h = this.clip.hits[i];
            if (nt >= h.t && !this._firedHits.has(i)) {
              this._firedHits.add(i);
              if (this.onEvent) this.onEvent('hit', h);
            }
          }
        }
        // 트레일 on/off
        if (this.clip.trail && this.onEvent) {
          const on = nt >= this.clip.trail[0] && nt <= this.clip.trail[1];
          if (on !== this._trailOn) { this._trailOn = on; this.onEvent('trail', { on }); }
        }
        if (nt >= 1) {
          if (this.clip.hold) {
            clipPose = this._sampleClip(this._pose, this.clip, 1);
            clipW = 1;
          } else {
            if (this.onEvent) this.onEvent('clipEnd', { name: this.clipName });
            if (this._trailOn) { this._trailOn = false; if (this.onEvent) this.onEvent('trail', { on: false }); }
            this.clip = null; this.clipName = null;
            this.rootExtra.y = 0; this.rootExtra.pitch = 0;
          }
        } else {
          clipPose = this._sampleClip(this._pose, this.clip, nt);
          // 시작/끝 블렌드
          const inT = U.clamp01(nt / 0.10);
          const outT = this.clip.hold ? 1 : U.clamp01((1 - nt) / 0.14);
          clipW = Math.min(inT, outT);
        }
      }

      // 기본 포즈
      const base = this._locomotion(this._base, st, dt);
      const target = this._target;
      for (const k in target) delete target[k];
      if (clipPose) blendPose(target, base, clipPose, clipW);
      else Object.assign(target, base);

      // 본 적용 (감쇠 보간)
      const lam = this.clip ? 26 : 13;
      for (const name of BONES) {
        const o = rig.bones[name];
        if (!o) continue;
        const r = rig.rest[name];
        const t = target[name];
        const tx = r[0] + (t ? t[0] : 0);
        const ty = r[1] + (t ? t[1] : 0);
        const tz = r[2] + (t ? t[2] : 0);
        o.rotation.x = U.damp(o.rotation.x, tx, lam, dt);
        o.rotation.y = U.damp(o.rotation.y, ty, lam, dt);
        o.rotation.z = U.damp(o.rotation.z, tz, lam, dt);
      }
      // 골반 상하 바운스
      const hip = rig.bones.hip;
      const bobK = rig.bobScale || 1;
      hip.position.y = U.damp(hip.position.y, rig.hipRestY + ((this.hipBob || 0) + this.rootExtra.y) * bobK, 16, dt);

      // 회전 클립 (스핀 공격)
      if (this.clip && this.clip.spin) {
        this.rootExtra.spin += dt * 14;
      } else {
        this.rootExtra.spin = U.damp(this.rootExtra.spin, 0, 10, dt);
      }

      // 관성 물리
      const vel = st.velocity || new THREE.Vector3();
      this._accel.subVectors(vel, this._prevVel).multiplyScalar(1 / Math.max(dt, 1e-3));
      this._prevVel.copy(vel);
      // 월드 가속 -> 로컬
      const yaw = rig.root.rotation.y;
      const cos = Math.cos(-yaw), sin = Math.sin(-yaw);
      const lax = this._accel.x * cos - this._accel.z * sin;
      const laz = this._accel.x * sin + this._accel.z * cos;
      rig.updateDynamics(dt, { x: U.clamp(lax * 0.02, -1, 1), z: U.clamp(laz * 0.02, -1, 1) }, st.speed01 || 0);
    }
  }

  AB.Rig = Rig;
  AB.Animator = Animator;
  AB.CLIPS = CLIPS;
  AB.BONES = BONES;
  AB.charHelpers = { part, group, box, cyl, sph, taper };
})(window);
