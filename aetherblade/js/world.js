/* ============================================================
   AETHER BLADE  —  world.js
   절차적 지형 · 식생 · 하늘 · 구조물 · 지역 정의
   ============================================================ */
(function (global) {
  'use strict';
  const AB = global.AB, U = AB.U, Assets = AB.Assets;
  const H = AB.charHelpers;

  const WORLD_R = 168;      // 플레이 가능 반경
  const LAKE = { x: -66, z: 74, r: 36, y: -4.5 };
  const ARENA = { x: 12, z: 118, y: 2.0, r: 30 };

  function smoothstep(e0, e1, x) {
    const t = U.clamp01((x - e0) / (e1 - e0));
    return t * t * (3 - 2 * t);
  }

  /* ---------- 지역 ---------- */
  const REGIONS = [
    { id: 'camp', name: '재의 야영지', x: 0, z: 0, r: 40, css: '#e8c07a' },
    { id: 'plain', name: '늑대 평원', x: -86, z: -46, r: 58, css: '#8fbf6a' },
    { id: 'ruins', name: '무너진 성채', x: 96, z: 24, r: 56, css: '#c0a0d0' },
    { id: 'rift', name: '균열 지대', x: -6, z: -118, r: 52, css: '#7a5cff' },
    { id: 'lake', name: '침묵의 호수', x: LAKE.x, z: LAKE.z, r: 42, css: '#6fd8ff' },
    { id: 'arena', name: '감시자의 원형장', x: ARENA.x, z: ARENA.z, r: 34, css: '#ff6a3c' },
  ];

  class World {
    constructor(scene, quality) {
      this.scene = scene;
      this.q = quality || { grass: 9000, trees: 260, motes: 700 };
      this.noise = new U.ValueNoise(20260903);
      this.obstacles = [];   // {x,z,r} 원형 충돌
      this.shaders = [];     // 바람 셰이더 uniform 갱신용
      this.time = 0;
      this.WORLD_R = WORLD_R;
      this.LAKE = LAKE;
      this.ARENA = ARENA;
      this.REGIONS = REGIONS;
    }

    /* ---------- 높이 필드 ---------- */
    height(x, z) {
      const n = this.noise;
      let h = n.fbm(x * 0.0065, z * 0.0065, 4) * 21;
      h += n.fbm(x * 0.022, z * 0.022, 3) * 4.2;
      h += Math.pow(Math.abs(n.noise2(x * 0.0042, z * 0.0042)), 1.6) * 20;

      // 호수 분지
      const dl = Math.hypot(x - LAKE.x, z - LAKE.z);
      h -= 17 * smoothstep(LAKE.r + 6, 4, dl);

      // 야영지 평탄화
      const dc = Math.hypot(x, z);
      h = U.lerp(1.4, h, smoothstep(15, 46, dc));

      // 원형 투기장 평탄화
      const da = Math.hypot(x - ARENA.x, z - ARENA.z);
      h = U.lerp(ARENA.y, h, smoothstep(20, 40, da));

      // 외곽 절벽
      const over = Math.max(0, dc - (WORLD_R - 18));
      h += Math.pow(over / 16, 2.1) * 30;
      return h;
    }

    normalAt(x, z) {
      const e = 1.2;
      const hL = this.height(x - e, z), hR = this.height(x + e, z);
      const hD = this.height(x, z - e), hU = this.height(x, z + e);
      return new THREE.Vector3(hL - hR, 2 * e, hD - hU).normalize();
    }
    slopeAt(x, z) { return 1 - this.normalAt(x, z).y; }

    inWater(x, z, y) {
      return Math.hypot(x - LAKE.x, z - LAKE.z) < LAKE.r && y < LAKE.y + 0.6;
    }

    regionAt(x, z) {
      let best = null, bestD = Infinity;
      for (const r of REGIONS) {
        const d = Math.hypot(x - r.x, z - r.z) - r.r;
        if (d < 0 && d < bestD) { bestD = d; best = r; }
      }
      return best;
    }

    /* ---------- 빌드 ---------- */
    build() {
      this.buildSky();
      this.buildTerrain();
      this.buildWater();
      this.buildVegetation();
      this.buildRocks();
      this.buildCamp();
      this.buildRuins();
      this.buildRiftZone();
      this.buildArena();
      this.buildAtmosphere();
    }

    /* ---------- 하늘 ---------- */
    buildSky() {
      const geo = new THREE.SphereGeometry(600, 32, 20);
      const mat = new THREE.MeshBasicMaterial({
        map: Assets.tex.sky, side: THREE.BackSide, fog: false, depthWrite: false,
      });
      const sky = new THREE.Mesh(geo, mat);
      sky.renderOrder = -100;
      this.scene.add(sky);
      this.sky = sky;

      // 거대한 달
      const moon = new THREE.Mesh(
        new THREE.SphereGeometry(34, 24, 18),
        new THREE.MeshBasicMaterial({ color: 0xf5e6d0, fog: false })
      );
      moon.position.set(-320, 200, -420);
      this.scene.add(moon);
      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(52, 20, 14),
        new THREE.MeshBasicMaterial({ color: 0xffd9b0, transparent: true, opacity: 0.13, fog: false })
      );
      halo.position.copy(moon.position);
      this.scene.add(halo);

      // 부유섬 (배경 장식)
      const rockMat = Assets.toon(0x574f63);
      for (let i = 0; i < 7; i++) {
        const g = new THREE.Group();
        const s = 8 + Math.random() * 18;
        const top = new THREE.Mesh(new THREE.CylinderGeometry(s, s * 0.8, s * 0.35, 7), Assets.toon(0x4d6440));
        const bot = new THREE.Mesh(new THREE.ConeGeometry(s * 0.8, s * 1.6, 7), rockMat);
        bot.position.y = -s * 0.9;
        g.add(top, bot);
        const a = (i / 7) * U.TAU + 0.6;
        const d = 260 + Math.random() * 140;
        g.position.set(Math.cos(a) * d, 70 + Math.random() * 70, Math.sin(a) * d);
        g.rotation.y = Math.random() * U.TAU;
        this.scene.add(g);
      }
    }

    /* ---------- 지형 메시 ---------- */
    buildTerrain() {
      const SEG = 190, SIZE = (WORLD_R + 40) * 2;
      const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
      geo.rotateX(-Math.PI / 2);
      const pos = geo.attributes.position;
      const colors = new Float32Array(pos.count * 3);
      const cGrass = new THREE.Color(0x5c8046);
      const cGrassDry = new THREE.Color(0x87874e);
      const cRock = new THREE.Color(0x6a6572);
      const cSand = new THREE.Color(0xb0a077);
      const cDeep = new THREE.Color(0x35502f);
      const tmp = new THREE.Color();

      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), z = pos.getZ(i);
        const y = this.height(x, z);
        pos.setY(i, y);
        const slope = this.slopeAt(x, z);
        const dl = Math.hypot(x - LAKE.x, z - LAKE.z);

        tmp.copy(y < 6 ? cDeep : cGrass);
        // 건조한 고지대
        tmp.lerp(cGrassDry, U.clamp01((y - 12) / 22));
        // 급경사 → 바위
        tmp.lerp(cRock, U.clamp01((slope - 0.12) / 0.30));
        // 호숫가 모래
        if (dl < LAKE.r + 10 && y < LAKE.y + 3.5) {
          tmp.lerp(cSand, U.clamp01(1 - Math.abs(y - LAKE.y - 1.2) / 4));
        }
        // 균열 지대 물듦
        const dr = Math.hypot(x + 6, z + 118);
        if (dr < 60) tmp.lerp(new THREE.Color(0x4a3d70), U.clamp01((60 - dr) / 60) * 0.55);
        // 노이즈 변화
        const v = 0.90 + this.noise.noise2(x * 0.09, z * 0.09) * 0.12;
        colors[i * 3] = tmp.r * v;
        colors[i * 3 + 1] = tmp.g * v;
        colors[i * 3 + 2] = tmp.b * v;
      }
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geo.computeVertexNormals();

      const mat = new THREE.MeshLambertMaterial({
        vertexColors: true, map: Assets.tex.ground,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      this.terrain = mesh;
    }

    /* ---------- 호수 ---------- */
    buildWater() {
      const geo = new THREE.CircleGeometry(LAKE.r + 8, 48);
      geo.rotateX(-Math.PI / 2);
      const mat = new THREE.MeshPhongMaterial({
        color: 0x2c6f8f, transparent: true, opacity: 0.78,
        shininess: 90, specular: 0x88ccee,
      });
      mat.onBeforeCompile = (sh) => {
        sh.uniforms.uTime = { value: 0 };
        sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
           transformed.y += sin(transformed.x*0.35 + uTime*1.4)*0.16
                          + cos(transformed.z*0.28 - uTime*1.1)*0.13;`
        );
        this.shaders.push(sh);
      };
      const w = new THREE.Mesh(geo, mat);
      w.position.set(LAKE.x, LAKE.y, LAKE.z);
      this.scene.add(w);
      this.water = w;
    }

    /* ---------- 나무 / 풀 ---------- */
    makeTree(rng, kind) {
      const g = new THREE.Group();
      const barkMat = Assets.toon(0x51402e, { extra: { map: Assets.tex.bark } });
      if (kind === 'pine') {
        const h = 6 + rng() * 6;
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.34, h, 6), barkMat);
        trunk.position.y = h / 2; trunk.castShadow = true;
        g.add(trunk);
        const leafMat = Assets.toon(rng() < 0.5 ? 0x2f5a38 : 0x27492f);
        const layers = 3 + (rng() * 3 | 0);
        for (let i = 0; i < layers; i++) {
          const t = i / layers;
          const r = (2.6 - t * 1.6) * (0.8 + rng() * 0.4);
          const c = new THREE.Mesh(new THREE.ConeGeometry(r, h * 0.42, 7), leafMat);
          c.position.y = h * (0.42 + t * 0.52);
          c.rotation.y = rng() * U.TAU;
          c.castShadow = true;
          g.add(c);
        }
      } else {
        const h = 4.5 + rng() * 4;
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.42, h, 6), barkMat);
        trunk.position.y = h / 2; trunk.castShadow = true;
        trunk.rotation.z = (rng() - 0.5) * 0.12;
        g.add(trunk);
        const leafMat = Assets.toon(rng() < 0.4 ? 0x6f8f3c : 0x4f7a3a);
        const blobs = 3 + (rng() * 3 | 0);
        for (let i = 0; i < blobs; i++) {
          const r = 1.6 + rng() * 1.5;
          const b = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), leafMat);
          b.position.set((rng() - 0.5) * 2.6, h + rng() * 2.0 - 0.3, (rng() - 0.5) * 2.6);
          b.rotation.set(rng() * 3, rng() * 3, rng() * 3);
          b.castShadow = true;
          g.add(b);
        }
      }
      return g;
    }

    buildVegetation() {
      const rng = U.makeRNG(5150);
      const trees = new THREE.Group();
      let placed = 0, tries = 0;
      while (placed < this.q.trees && tries < 4000) {
        tries++;
        const a = rng() * U.TAU, d = Math.sqrt(rng()) * (WORLD_R - 16);
        const x = Math.cos(a) * d, z = Math.sin(a) * d;
        const y = this.height(x, z);
        if (y < LAKE.y + 2.2) continue;                       // 물속
        if (Math.hypot(x, z) < 24) continue;                  // 야영지
        if (Math.hypot(x - ARENA.x, z - ARENA.z) < ARENA.r * 0.95) continue;
        if (this.slopeAt(x, z) > 0.34) continue;              // 절벽
        const noiseVal = this.noise.fbm(x * 0.012, z * 0.012, 2);
        if (noiseVal < -0.12 && rng() < 0.75) continue;       // 자연스러운 밀집
        const kind = y > 20 || noiseVal > 0.18 ? 'pine' : (rng() < 0.5 ? 'pine' : 'broad');
        const t = this.makeTree(rng, kind);
        t.position.set(x, y - 0.3, z);
        t.rotation.y = rng() * U.TAU;
        const s = 0.8 + rng() * 0.6;
        t.scale.setScalar(s);
        trees.add(t);
        this.obstacles.push({ x, z, r: 0.7 * s });
        placed++;
      }
      this.scene.add(trees);
      this.trees = trees;

      // ---- 풀 (인스턴싱 + 바람) : 플레이어 주변에만 촘촘히 배치 ----
      const bladeGeo = new THREE.PlaneGeometry(0.10, 0.44, 1, 4);
      bladeGeo.translate(0, 0.22, 0);
      {
        const pa = bladeGeo.attributes.position;
        for (let i = 0; i < pa.count; i++) {
          const t = U.clamp01(pa.getY(i) / 0.44);
          pa.setX(i, pa.getX(i) * (1 - t * 0.90));   // 끝으로 갈수록 뾰족하게
          pa.setZ(i, pa.getZ(i) + t * t * 0.09);     // 살짝 휘어짐
        }
        bladeGeo.computeVertexNormals();
      }
      const grassMat = new THREE.MeshLambertMaterial({
        color: 0xffffff, side: THREE.DoubleSide,
      });
      grassMat.onBeforeCompile = (sh) => {
        sh.uniforms.uTime = { value: 0 };
        sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
           float ix = instanceMatrix[3][0];
           float iz = instanceMatrix[3][2];
           float w = sin(uTime*1.9 + ix*0.28 + iz*0.19) * 0.5 + sin(uTime*3.1 + ix*0.11)*0.22;
           transformed.x += w * transformed.y * 0.26;
           transformed.z += cos(uTime*1.5 + iz*0.24) * transformed.y * 0.16;`
        );
        this.shaders.push(sh);
      };
      const COUNT = this.q.grass;
      const grass = new THREE.InstancedMesh(bladeGeo, grassMat, COUNT);
      grass.count = 0;
      grass.frustumCulled = false;
      grass.receiveShadow = false;
      this.scene.add(grass);
      this.grass = grass;
      this.grassRadius = Math.sqrt(COUNT / Math.PI) * 0.80;
      this.grassCell = 0.78;
      this.grassCenter = new THREE.Vector3(1e9, 0, 1e9);
      this._gm = new THREE.Matrix4();
      this._gq = new THREE.Quaternion();
      this._gv = new THREE.Vector3();
      this._gs = new THREE.Vector3();
      this._gc = new THREE.Color();
      this._gaxis = new THREE.Vector3(0, 1, 0);
      this.refreshGrass(new THREE.Vector3(0, 0, 0));
    }

    /** 셀 해시 기반 난수 — 같은 좌표는 항상 같은 값 (풀이 움직이지 않음) */
    _cellRand(cx, cz, salt) {
      let h = (cx * 374761393 + cz * 668265263 + salt * 2246822519) | 0;
      h = (h ^ (h >>> 13)) * 1274126177;
      return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    }

    /** 플레이어 주변으로 잔디 인스턴스를 다시 채운다 */
    refreshGrass(center) {
      const grass = this.grass;
      if (!grass) return;
      const R = this.grassRadius, C = this.grassCell;
      const cx0 = Math.floor((center.x - R) / C), cx1 = Math.ceil((center.x + R) / C);
      const cz0 = Math.floor((center.z - R) / C), cz1 = Math.ceil((center.z + R) / C);
      const max = grass.instanceMatrix.count;
      let n = 0;
      const R2 = R * R;
      for (let cz = cz0; cz <= cz1 && n < max; cz++) {
        for (let cx = cx0; cx <= cx1 && n < max; cx++) {
          const r0 = this._cellRand(cx, cz, 1);
          if (r0 > 0.78) continue;                     // 자연스러운 빈 자리
          const x = (cx + this._cellRand(cx, cz, 2)) * C;
          const z = (cz + this._cellRand(cx, cz, 3)) * C;
          const dx = x - center.x, dz = z - center.z;
          if (dx * dx + dz * dz > R2) continue;
          const dc = Math.hypot(x, z);
          if (dc > WORLD_R - 10) continue;
          if (dc < 13) continue;                                        // 야영지 중앙
          if (Math.hypot(x - ARENA.x, z - ARENA.z) < ARENA.r * 0.80) continue;  // 투기장 석판
          const y = this.height(x, z);
          if (y < LAKE.y + 1.4) continue;
          if (this.slopeAt(x, z) > 0.38) continue;
          this._gv.set(x, y - 0.04, z);
          this._gq.setFromAxisAngle(this._gaxis, r0 * U.TAU * 7.3);
          const sc = 0.7 + this._cellRand(cx, cz, 4) * 0.6;
          this._gs.set(sc, sc * (0.75 + this._cellRand(cx, cz, 5) * 0.7), sc);
          this._gm.compose(this._gv, this._gq, this._gs);
          grass.setMatrixAt(n, this._gm);
          this._gc.setHSL(0.215 + this._cellRand(cx, cz, 6) * 0.055,
                          0.30 + this._cellRand(cx, cz, 7) * 0.24,
                          0.17 + this._cellRand(cx, cz, 8) * 0.16);
          grass.setColorAt(n, this._gc);
          n++;
        }
      }
      grass.count = n;
      grass.instanceMatrix.needsUpdate = true;
      if (grass.instanceColor) grass.instanceColor.needsUpdate = true;
      this.grassCenter.copy(center);
    }

    /* ---------- 바위 ---------- */
    buildRocks() {
      const rng = U.makeRNG(3399);
      const rockMat = Assets.toon(0x6d6a73, { extra: { map: Assets.tex.rock } });
      const group = new THREE.Group();
      for (let i = 0; i < 170; i++) {
        const a = rng() * U.TAU, d = Math.sqrt(rng()) * (WORLD_R - 8);
        const x = Math.cos(a) * d, z = Math.sin(a) * d;
        const y = this.height(x, z);
        if (Math.hypot(x, z) < 18) continue;
        const r = 0.6 + rng() * 2.6;
        const geo = new THREE.DodecahedronGeometry(r, 0);
        // 불규칙화
        const pa = geo.attributes.position;
        for (let v = 0; v < pa.count; v++) {
          pa.setXYZ(v,
            pa.getX(v) * (0.75 + rng() * 0.5),
            pa.getY(v) * (0.55 + rng() * 0.45),
            pa.getZ(v) * (0.75 + rng() * 0.5));
        }
        geo.computeVertexNormals();
        const mesh = new THREE.Mesh(geo, rockMat);
        mesh.position.set(x, y - r * 0.3, z);
        mesh.rotation.set(rng() * 3, rng() * 3, rng() * 3);
        mesh.castShadow = true; mesh.receiveShadow = true;
        group.add(mesh);
        if (r > 1.4) this.obstacles.push({ x, z, r: r * 0.75 });
      }
      this.scene.add(group);
    }

    /* ---------- 야영지 ---------- */
    buildCamp() {
      const g = new THREE.Group();
      const canvasMat = Assets.toon(0xb9a07c);
      const woodMat = Assets.toon(0x5b4530);
      const stoneMat = Assets.toon(0x6a6572);

      // 텐트 4개
      const tentAngles = [0.4, 1.9, 3.5, 5.0];
      tentAngles.forEach((a, i) => {
        const x = Math.cos(a) * 11, z = Math.sin(a) * 11;
        const t = new THREE.Group();
        const cone = new THREE.Mesh(new THREE.ConeGeometry(2.4, 3.2, 8), canvasMat);
        cone.position.y = 1.6; cone.castShadow = true;
        t.add(cone);
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4.0, 6), woodMat);
        pole.position.y = 2.0; t.add(pole);
        const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.5),
          new THREE.MeshBasicMaterial({ color: [0xff6a3c, 0x6fd8ff, 0xc07dff, 0xe8c07a][i], side: THREE.DoubleSide }));
        flag.position.set(0.45, 3.75, 0);
        t.add(flag);
        t.userData.flag = flag;
        t.position.set(x, this.height(x, z), z);
        t.rotation.y = -a;
        g.add(t);
        this.obstacles.push({ x, z, r: 2.2 });
      });

      // 모닥불
      const fire = new THREE.Group();
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * U.TAU;
        const s = new THREE.Mesh(new THREE.DodecahedronGeometry(0.34, 0), stoneMat);
        s.position.set(Math.cos(a) * 1.25, 0.1, Math.sin(a) * 1.25);
        s.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
        s.castShadow = true;
        fire.add(s);
      }
      for (let i = 0; i < 5; i++) {
        const log = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 1.5, 6), woodMat);
        const a = (i / 5) * U.TAU;
        log.position.set(Math.cos(a) * 0.28, 0.3, Math.sin(a) * 0.28);
        log.rotation.set(0.9, a, 0);
        fire.add(log);
      }
      const flameMat = new THREE.MeshBasicMaterial({ color: 0xff8c3a, transparent: true, opacity: 0.92 });
      const flames = [];
      for (let i = 0; i < 5; i++) {
        const f = new THREE.Mesh(new THREE.ConeGeometry(0.30 - i * 0.04, 1.0 + i * 0.18, 6), flameMat.clone());
        f.material.color.setHex([0xffcf6a, 0xff9a3a, 0xff6a2a, 0xffb84d, 0xff7a30][i]);
        f.position.set((Math.random() - 0.5) * 0.4, 0.55 + i * 0.12, (Math.random() - 0.5) * 0.4);
        fire.add(f);
        flames.push(f);
      }
      const fireLight = new THREE.PointLight(0xff8c3a, 2.2, 26, 2);
      fireLight.position.y = 1.4;
      fire.add(fireLight);
      fire.position.set(0, this.height(0, 0), 0);
      g.add(fire);
      this.campfire = { group: fire, flames, light: fireLight };
      this.obstacles.push({ x: 0, z: 0, r: 1.5 });

      // 나무 상자 / 통
      const rng = U.makeRNG(881);
      for (let i = 0; i < 10; i++) {
        const a = rng() * U.TAU, d = 6 + rng() * 12;
        const x = Math.cos(a) * d, z = Math.sin(a) * d;
        const box = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 0.9), woodMat);
        box.position.set(x, this.height(x, z) + 0.4, z);
        box.rotation.y = rng() * U.TAU;
        box.castShadow = true;
        g.add(box);
      }
      // 깃대
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 7, 8), woodMat);
      mast.position.set(-5, this.height(-5, -6) + 3.5, -6);
      mast.castShadow = true;
      g.add(mast);
      const banner = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 3.2),
        new THREE.MeshBasicMaterial({ color: 0x8f2f28, side: THREE.DoubleSide }));
      banner.position.set(-3.9, this.height(-5, -6) + 4.6, -6);
      g.add(banner);
      this.banner = banner;

      this.scene.add(g);
      this.camp = g;
    }

    /* ---------- 폐허 성채 ---------- */
    buildRuins() {
      const R = REGIONS.find(r => r.id === 'ruins');
      const rng = U.makeRNG(6612);
      const g = new THREE.Group();
      const stone = Assets.toon(0x8b8578, { extra: { map: Assets.bigRock(7) } });
      const stoneDark = Assets.toon(0x625d55);

      // 부서진 원형 성벽
      for (let i = 0; i < 26; i++) {
        const a = (i / 26) * U.TAU;
        if (rng() < 0.28) continue;
        const d = 30 + rng() * 4;
        const x = R.x + Math.cos(a) * d, z = R.z + Math.sin(a) * d;
        const h = 3 + rng() * 7;
        const w = new THREE.Mesh(new THREE.BoxGeometry(4.2, h, 1.6), stone);
        w.position.set(x, this.height(x, z) + h / 2 - 0.6, z);
        w.rotation.y = -a + (rng() - 0.5) * 0.3;
        w.rotation.z = (rng() - 0.5) * 0.12;
        w.castShadow = true; w.receiveShadow = true;
        g.add(w);
        this.obstacles.push({ x, z, r: 1.8 });
      }
      // 기둥
      for (let i = 0; i < 14; i++) {
        const a = rng() * U.TAU, d = rng() * 24;
        const x = R.x + Math.cos(a) * d, z = R.z + Math.sin(a) * d;
        const h = 4 + rng() * 9;
        const broken = rng() < 0.5;
        const p = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.85, h, 10), stone);
        p.position.set(x, this.height(x, z) + h / 2, z);
        if (broken) p.rotation.z = (rng() - 0.5) * 0.5;
        p.castShadow = true;
        g.add(p);
        if (!broken) {
          const cap = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.5, 2.0), stoneDark);
          cap.position.set(x, this.height(x, z) + h + 0.25, z);
          g.add(cap);
        }
        this.obstacles.push({ x, z, r: 1.0 });
      }
      // 중앙 계단 단상
      const dais = new THREE.Group();
      for (let i = 0; i < 4; i++) {
        const s = new THREE.Mesh(new THREE.CylinderGeometry(9 - i * 1.8, 9 - i * 1.8, 0.6, 24), stoneDark);
        s.position.y = i * 0.55;
        s.receiveShadow = true;
        dais.add(s);
      }
      dais.position.set(R.x, this.height(R.x, R.z), R.z);
      g.add(dais);
      this.scene.add(g);
      this.ruinsCenter = new THREE.Vector3(R.x, this.height(R.x, R.z) + 1.8, R.z);
    }

    /* ---------- 균열 지대 ---------- */
    buildRiftZone() {
      const R = REGIONS.find(r => r.id === 'rift');
      const rng = U.makeRNG(9931);
      const g = new THREE.Group();
      const crystalMat = new THREE.MeshPhongMaterial({
        color: 0x6a4fd0, emissive: 0x3a1f8a, shininess: 80,
        transparent: true, opacity: 0.85,
      });
      this.crystals = [];
      for (let i = 0; i < 40; i++) {
        const a = rng() * U.TAU, d = Math.sqrt(rng()) * 46;
        const x = R.x + Math.cos(a) * d, z = R.z + Math.sin(a) * d;
        const y = this.height(x, z);
        const h = 1.5 + rng() * 6;
        const c = new THREE.Mesh(new THREE.ConeGeometry(0.4 + rng() * 0.8, h, 5), crystalMat);
        c.position.set(x, y + h * 0.35, z);
        c.rotation.set((rng() - 0.5) * 0.6, rng() * 3, (rng() - 0.5) * 0.6);
        c.castShadow = true;
        g.add(c);
        if (rng() < 0.35) {
          const l = new THREE.PointLight(0x8a5cff, 0.9, 18, 2);
          l.position.set(x, y + h * 0.7, z);
          g.add(l);
        }
        if (h > 4) this.obstacles.push({ x, z, r: 0.9 });
      }
      // 떠다니는 파편
      const shardMat = new THREE.MeshBasicMaterial({ color: 0xa07cff, transparent: true, opacity: 0.75 });
      this.shards = [];
      for (let i = 0; i < 60; i++) {
        const a = rng() * U.TAU, d = Math.sqrt(rng()) * 44;
        const x = R.x + Math.cos(a) * d, z = R.z + Math.sin(a) * d;
        const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.16 + rng() * 0.4), shardMat);
        s.position.set(x, this.height(x, z) + 1.5 + rng() * 7, z);
        s.userData = { baseY: s.position.y, sp: 0.4 + rng(), ph: rng() * 6 };
        g.add(s);
        this.shards.push(s);
      }
      this.scene.add(g);
    }

    /* ---------- 보스 투기장 ---------- */
    buildArena() {
      const g = new THREE.Group();
      const stone = Assets.toon(0x565163, { extra: { map: Assets.bigRock(14) } });
      const glowMat = new THREE.MeshBasicMaterial({ color: 0xff5a2a });
      // 바닥 원반
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(ARENA.r * 0.72, ARENA.r * 0.76, 0.7, 40), stone);
      disc.position.set(ARENA.x, ARENA.y - 0.35, ARENA.z);
      disc.receiveShadow = true;
      g.add(disc);
      // 룬 원
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(ARENA.r * 0.52, ARENA.r * 0.60, 48),
        new THREE.MeshBasicMaterial({ color: 0xff5a2a, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(ARENA.x, ARENA.y + 0.28, ARENA.z);
      g.add(ring);
      this.arenaRing = ring;
      // 외곽 오벨리스크
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * U.TAU;
        const x = ARENA.x + Math.cos(a) * ARENA.r * 0.80;
        const z = ARENA.z + Math.sin(a) * ARENA.r * 0.80;
        const h = 7 + (i % 3) * 2.2;
        const p = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.95, h, 6), stone);
        p.position.set(x, this.height(x, z) + h / 2, z);
        p.castShadow = true;
        g.add(p);
        const tip = new THREE.Mesh(new THREE.OctahedronGeometry(0.55), glowMat);
        tip.position.set(x, this.height(x, z) + h + 0.4, z);
        g.add(tip);
        this.obstacles.push({ x, z, r: 1.0 });
      }
      this.scene.add(g);
    }

    /* ---------- 대기 (먼지·반딧불) ---------- */
    buildAtmosphere() {
      const N = this.q.motes;
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(N * 3);
      const rng = U.makeRNG(1212);
      this.motePhase = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        const a = rng() * U.TAU, d = Math.sqrt(rng()) * WORLD_R;
        const x = Math.cos(a) * d, z = Math.sin(a) * d;
        pos[i * 3] = x;
        pos[i * 3 + 1] = this.height(x, z) + 0.5 + rng() * 12;
        pos[i * 3 + 2] = z;
        this.motePhase[i] = rng() * 6.28;
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({
        size: 0.5, map: Assets.tex.spark, transparent: true, opacity: 0.6,
        depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffd9a0,
      });
      const pts = new THREE.Points(geo, mat);
      pts.frustumCulled = false;
      this.scene.add(pts);
      this.motes = pts;
    }

    /* ---------- 갱신 ---------- */
    update(dt, camPos, playerPos) {
      this.time += dt;
      // 잔디를 플레이어 주변으로 이동
      if (playerPos && this.grass) {
        const d = Math.hypot(playerPos.x - this.grassCenter.x, playerPos.z - this.grassCenter.z);
        if (d > this.grassRadius * 0.22) this.refreshGrass(playerPos);
      }
      for (const sh of this.shaders) if (sh.uniforms.uTime) sh.uniforms.uTime.value = this.time;

      // 모닥불 일렁임
      if (this.campfire) {
        const t = this.time;
        this.campfire.flames.forEach((f, i) => {
          const s = 0.75 + Math.abs(Math.sin(t * (5.5 + i * 1.3) + i)) * 0.5;
          f.scale.set(s, 0.85 + Math.sin(t * (7 + i) + i * 2) * 0.35, s);
          f.rotation.y = t * (0.7 + i * 0.2);
          f.position.y = 0.55 + i * 0.12 + Math.sin(t * 6 + i) * 0.06;
        });
        this.campfire.light.intensity = 1.9 + Math.sin(t * 9.3) * 0.4 + Math.sin(t * 4.1) * 0.3;
      }
      // 배너 흔들림
      if (this.banner) this.banner.rotation.y = Math.sin(this.time * 1.3) * 0.22;
      // 균열 파편 부유
      if (this.shards) {
        for (const s of this.shards) {
          s.position.y = s.userData.baseY + Math.sin(this.time * s.userData.sp + s.userData.ph) * 0.8;
          s.rotation.y += dt * s.userData.sp;
          s.rotation.x += dt * s.userData.sp * 0.6;
        }
      }
      if (this.arenaRing) {
        this.arenaRing.material.opacity = 0.25 + Math.sin(this.time * 1.6) * 0.12;
        this.arenaRing.rotation.z += dt * 0.08;
      }
      // 먼지 부유 + 카메라 추적
      if (this.motes && camPos) {
        const p = this.motes.geometry.attributes.position;
        for (let i = 0; i < p.count; i++) {
          let y = p.getY(i) + Math.sin(this.time * 0.7 + this.motePhase[i]) * dt * 1.4 + dt * 0.35;
          let x = p.getX(i) + Math.sin(this.time * 0.4 + this.motePhase[i] * 2) * dt * 0.6;
          let z = p.getZ(i);
          // 카메라 주변으로 순환
          const dx = x - camPos.x, dz = z - camPos.z;
          if (dx * dx + dz * dz > 60 * 60) {
            const a = Math.random() * U.TAU, d = 10 + Math.random() * 40;
            x = camPos.x + Math.cos(a) * d;
            z = camPos.z + Math.sin(a) * d;
            y = this.height(x, z) + Math.random() * 10;
          }
          if (y > this.height(x, z) + 14) y = this.height(x, z) + 0.5;
          p.setXYZ(i, x, y, z);
        }
        p.needsUpdate = true;
      }
      if (this.sky && camPos) this.sky.position.copy(camPos);
    }

    /* ---------- 충돌 / 경계 ---------- */
    resolveCollision(pos, radius) {
      // 장애물
      for (const o of this.obstacles) {
        const dx = pos.x - o.x, dz = pos.z - o.z;
        const d2 = dx * dx + dz * dz;
        const rr = o.r + radius;
        if (d2 < rr * rr && d2 > 1e-6) {
          const d = Math.sqrt(d2);
          const push = (rr - d);
          pos.x += (dx / d) * push;
          pos.z += (dz / d) * push;
        }
      }
      // 월드 경계
      const dc = Math.hypot(pos.x, pos.z);
      if (dc > WORLD_R - 6) {
        const s = (WORLD_R - 6) / dc;
        pos.x *= s; pos.z *= s;
      }
    }

    /** 안전한 스폰 지점 찾기 */
    findSpawn(cx, cz, radius, rng) {
      rng = rng || Math.random;
      for (let i = 0; i < 40; i++) {
        const a = rng() * U.TAU, d = Math.sqrt(rng()) * radius;
        const x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
        if (Math.hypot(x, z) > WORLD_R - 12) continue;
        const y = this.height(x, z);
        if (y < LAKE.y + 1.5) continue;
        if (this.slopeAt(x, z) > 0.35) continue;
        let blocked = false;
        for (const o of this.obstacles) {
          if (Math.hypot(x - o.x, z - o.z) < o.r + 1.5) { blocked = true; break; }
        }
        if (blocked) continue;
        return new THREE.Vector3(x, y, z);
      }
      return new THREE.Vector3(cx, this.height(cx, cz), cz);
    }
  }

  AB.World = World;
  AB.smoothstep = smoothstep;
})(window);
