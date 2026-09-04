/* ============================================================
   AETHER BLADE  —  mmdchar.js
   PMX(MMD) 커스텀 캐릭터 로더 + 애니메이터 어댑터

   ⚠ 모델 파일은 저장소에 포함하지 않는다.
     사용자가 로컬에서 가지고 있는 zip/pmx 를 브라우저에서 직접 읽으며,
     파일은 어디에도 업로드되지 않는다 (전부 클라이언트 사이드).
   ============================================================ */
(function (global) {
  'use strict';
  const AB = global.AB, U = AB.U;

  // 로컬 vendor/ 를 먼저 쓰고, 없으면 CDN 으로 대체한다 (오프라인에서도 동작)
  const LOCAL = {
    tga: 'vendor/TGALoader.js',
    mmdParser: 'vendor/mmdparser.min.js',
    mmdToonShader: 'vendor/MMDToonShader.js',
    mmdLoader: 'vendor/MMDLoader.js',
    mmdPhysics: 'vendor/MMDPhysics.js',
    ccdik: 'vendor/CCDIKSolver.js',
    mmdHelper: 'vendor/MMDAnimationHelper.js',
  };
  const CDN = {
    tga: 'https://cdn.jsdelivr.net/npm/three@0.147.0/examples/js/loaders/TGALoader.js',
    mmdParser: 'https://cdn.jsdelivr.net/npm/mmd-parser@1.0.4/build/mmdparser.min.js',
    mmdToonShader: 'https://cdn.jsdelivr.net/npm/three@0.147.0/examples/js/shaders/MMDToonShader.js',
    mmdLoader: 'https://cdn.jsdelivr.net/npm/three@0.147.0/examples/js/loaders/MMDLoader.js',
    ammo: 'https://cdn.jsdelivr.net/npm/three@0.147.0/examples/js/libs/ammo.wasm.js',
    mmdPhysics: 'https://cdn.jsdelivr.net/npm/three@0.147.0/examples/js/animation/MMDPhysics.js',
    ccdik: 'https://cdn.jsdelivr.net/npm/three@0.147.0/examples/js/animation/CCDIKSolver.js',
    mmdHelper: 'https://cdn.jsdelivr.net/npm/three@0.147.0/examples/js/animation/MMDAnimationHelper.js',
  };

  /** vendor 우선, 실패하면 CDN */
  async function loadLib(key) {
    if (LOCAL[key]) {
      try { await loadScript(LOCAL[key]); return; } catch (e) { /* CDN 으로 폴백 */ }
    }
    await loadScript(CDN[key]);
  }

  const RES = 'abzip/';   // MMDLoader 가 텍스처 경로 앞에 붙일 가상 경로

  function loadScript(src) {
    return new Promise((res, rej) => {
      if (document.querySelector(`script[src="${src}"]`)) return res();
      const s = document.createElement('script');
      s.src = src; s.async = false;
      s.onload = () => res();
      s.onerror = () => rej(new Error('스크립트 로드 실패: ' + src));
      document.head.appendChild(s);
    });
  }

  /* ============================================================
     ZIP 리더 — store(0) / deflate(8), 파일명 UTF-8 또는 GBK
     ============================================================ */
  async function readZip(file) {
    const buf = new Uint8Array(await file.arrayBuffer());
    const dv = new DataView(buf.buffer);
    const u16 = o => dv.getUint16(o, true), u32 = o => dv.getUint32(o, true);
    let eocd = -1;
    for (let i = buf.length - 22; i >= Math.max(0, buf.length - 66000); i--) {
      if (u32(i) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error('ZIP 구조를 찾지 못했습니다.');
    const count = u16(eocd + 10);
    let p = u32(eocd + 16);
    const out = [];
    for (let i = 0; i < count && u32(p) === 0x02014b50; i++) {
      const flag = u16(p + 8), method = u16(p + 10);
      const csize = u32(p + 20), nameLen = u16(p + 28);
      const extraLen = u16(p + 30), commentLen = u16(p + 32);
      const local = u32(p + 42);
      const raw = buf.subarray(p + 46, p + 46 + nameLen);
      let name;
      try {
        name = new TextDecoder(flag & 0x800 ? 'utf-8' : 'gbk', { fatal: true }).decode(raw);
      } catch (e) {
        try { name = new TextDecoder('shift_jis').decode(raw); }
        catch (e2) { name = new TextDecoder('utf-8').decode(raw); }
      }
      name = name.replace(/\\/g, '/');
      const dataAt = local + 30 + u16(local + 26) + u16(local + 28);
      if (!name.endsWith('/')) out.push({ name, method, bytes: buf.subarray(dataAt, dataAt + csize) });
      p += 46 + nameLen + extraLen + commentLen;
    }
    return out;
  }

  async function inflate(entry) {
    if (entry.method === 0) return entry.bytes;
    if (typeof DecompressionStream !== 'function') throw new Error('이 브라우저는 deflate 해제를 지원하지 않습니다.');
    const ds = new DecompressionStream('deflate-raw');
    const stream = new Blob([entry.bytes]).stream().pipeThrough(ds);
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  /* ============================================================
     가상 파일 시스템 — zip 항목을 blob URL 로 매핑
     ============================================================ */
  class VFS {
    constructor() { this.files = new Map(); this.urls = new Map(); }
    norm(p) { return p.replace(/\\/g, '/').replace(/^\.\//, '').toLowerCase(); }
    base(p) { const n = this.norm(p); return n.slice(n.lastIndexOf('/') + 1); }

    async addZip(file) {
      const entries = await readZip(file);
      for (const e of entries) this.files.set(this.norm(e.name), e);
      return entries;
    }
    addRaw(name, bytes) {
      this.files.set(this.norm(name), { name, method: 0, bytes });
    }
    /** 전체 경로 → 없으면 파일명만으로 유사 검색 */
    find(path) {
      const n = this.norm(path);
      if (this.files.has(n)) return n;
      const b = this.base(path);
      for (const k of this.files.keys()) if (this.base(k) === b) return k;
      // 확장자 무시 매칭 (tga <-> png 등)
      const stem = b.replace(/\.[^.]+$/, '');
      for (const k of this.files.keys()) {
        if (this.base(k).replace(/\.[^.]+$/, '') === stem) return k;
      }
      return null;
    }
    async url(path) {
      const key = this.find(path);
      if (!key) return null;
      if (this.urls.has(key)) return this.urls.get(key);
      const bytes = await inflate(this.files.get(key));
      const u = URL.createObjectURL(new Blob([bytes]));
      this.urls.set(key, u);
      return u;
    }
    /** 동기 URL (미리 준비된 것만) */
    urlSync(path) {
      const key = this.find(path);
      return key ? this.urls.get(key) || null : null;
    }
    /** 모든 항목을 미리 blob URL 로 준비 (텍스처 동기 조회용) */
    async prepareAll(onProgress) {
      const keys = [...this.files.keys()];
      let i = 0;
      for (const k of keys) {
        i++;
        if (/\.(png|jpg|jpeg|bmp|tga|dds|spa|sph|gif|pmx|pmd)$/i.test(k)) {
          try {
            const bytes = await inflate(this.files.get(k));
            this.urls.set(k, URL.createObjectURL(new Blob([bytes])));
          } catch (e) { /* 개별 실패는 무시 */ }
        }
        if (onProgress && i % 8 === 0) { onProgress(i / keys.length); await new Promise(r => setTimeout(r)); }
      }
    }
    listPMX() {
      return [...this.files.keys()].filter(k => k.endsWith('.pmx') || k.endsWith('.pmd'));
    }
    dispose() {
      for (const u of this.urls.values()) URL.revokeObjectURL(u);
      this.urls.clear(); this.files.clear();
    }
  }

  /* ============================================================
     MMD 본 이름 매핑 → 게임 애니메이터 본
     ============================================================ */
  const BONE_MAP = {
    hip: ['センター', 'center', '下半身', '腰'],
    torso: ['上半身', 'upper body'],
    chest: ['上半身2', '上半身', 'upper body2'],
    neck: ['首', 'neck'],
    head: ['頭', 'head'],
    shoulderL: ['左肩', 'shoulder_L'],
    armL: ['左腕', 'arm_L'],
    forearmL: ['左ひじ', 'elbow_L'],
    handL: ['左手首', 'wrist_L'],
    shoulderR: ['右肩', 'shoulder_R'],
    armR: ['右腕', 'arm_R'],
    forearmR: ['右ひじ', 'elbow_R'],
    handR: ['右手首', 'wrist_R'],
    thighL: ['左足', 'leg_L'],
    shinL: ['左ひざ', 'knee_L'],
    footL: ['左足首', 'ankle_L'],
    thighR: ['右足', 'leg_R'],
    shinR: ['右ひざ', 'knee_R'],
    footR: ['右足首', 'ankle_R'],
  };

  /* 게임 리그(절차 생성)에서 각 본이 뻗는 방향.
     팔·다리는 -Y, 척추는 +Y, 발은 +Z 로 뻗는다는 전제로 모션이 작성돼 있다. */
  const CANON_DIR = {
    hip: [0, 1, 0], torso: [0, 1, 0], chest: [0, 1, 0], neck: [0, 1, 0], head: [0, 1, 0],
    shoulderL: [-1, 0, 0], shoulderR: [1, 0, 0],
    armL: [0, -1, 0], armR: [0, -1, 0],
    forearmL: [0, -1, 0], forearmR: [0, -1, 0],
    handL: [0, -1, 0], handR: [0, -1, 0],
    thighL: [0, -1, 0], thighR: [0, -1, 0],
    shinL: [0, -1, 0], shinR: [0, -1, 0],
    footL: [0, 0, 1], footR: [0, 0, 1],
  };

  /* 축 보정을 계산할 때 "이 본이 어느 자식 쪽으로 뻗는가" */
  const CHAIN_CHILD = {
    hip: 'torso', torso: 'chest', chest: 'neck', neck: 'head',
    shoulderL: 'armL', armL: 'forearmL', forearmL: 'handL',
    shoulderR: 'armR', armR: 'forearmR', forearmR: 'handR',
    thighL: 'shinL', shinL: 'footL',
    thighR: 'shinR', shinR: 'footR',
  };

  /**
   * AB.Animator 와 호환되는 리그 어댑터.
   * 절차적 애니메이션을 PMX 스켈레톤에 그대로 적용한다.
   */
  class MMDRig {
    constructor(mesh, opts) {
      opts = opts || {};
      this.isMMD = true;
      this.mesh = mesh;
      this.cfg = { accent: opts.accent || 0xffffff };
      this.dynamics = [];
      this.emissives = [];
      this.eyes = [];
      this.root = new THREE.Group();

      // 크기 정규화 (목표 신장 기준)
      const bbox = new THREE.Box3().setFromObject(mesh);
      const size = bbox.getSize(new THREE.Vector3());
      const target = opts.targetHeight || 1.72;
      this.modelScale = target / Math.max(0.001, size.y);
      const inner = new THREE.Group();
      inner.scale.setScalar(this.modelScale);
      inner.rotation.y = opts.faceFlip ? Math.PI : 0;
      inner.add(mesh);
      this.inner = inner;
      this.root.add(inner);
      this.bobScale = 1 / this.modelScale;   // 골반 바운스를 모델 단위로 변환

      // 본 수집
      this.bones = {};
      const dict = {};
      mesh.skeleton && mesh.skeleton.bones.forEach(b => { dict[b.name] = b; });
      this.boneDict = dict;
      for (const key in BONE_MAP) {
        for (const n of BONE_MAP[key]) {
          if (dict[n]) { this.bones[key] = dict[n]; break; }
        }
      }
      // 필수 본이 없으면 대체
      if (!this.bones.hip) this.bones.hip = mesh.skeleton ? mesh.skeleton.bones[0] : new THREE.Object3D();
      if (!this.bones.chest) this.bones.chest = this.bones.torso || this.bones.hip;

      // 축 보정 계산 — 게임 모션의 회전축을 이 모델의 본 축으로 옮긴다
      this.buildAxisFix();

      // rest 는 0 (바인드 포즈는 restQuat 에 담아 둔다)
      this.rest = {};
      for (const name of AB.BONES) this.rest[name] = [0, 0, 0];
      this.hipRestY = this.bones.hip.position.y;

      // 다리 길이 / 키 비율로 보폭 보정 (스케일 무관하게 계산)
      // 절차 리그 기준: 다리 0.86m / 키 1.90m = 0.452
      this.legScale = 1;
      if (this.bones.shinL && this.bones.footL) {
        const legLen = this.bones.shinL.position.length() + this.bones.footL.position.length();
        const ratio = legLen / Math.max(1e-6, size.y);
        if (ratio > 0.15 && ratio < 0.9) this.legScale = U.clamp(ratio / 0.452, 0.75, 1.35);
      }

      // 표정 모프
      this.morphs = mesh.morphTargetDictionary || null;
      this.blinkIndex = null;
      if (this.morphs) {
        for (const k of ['まばたき', 'blink', 'ウィンク', '瞬き']) {
          if (this.morphs[k] !== undefined) { this.blinkIndex = this.morphs[k]; break; }
        }
        for (const k of ['にこり', 'smile', '笑い', '喜び']) {
          if (this.morphs[k] !== undefined) { this.smileIndex = this.morphs[k]; break; }
        }
      }
      this.blinkTimer = 1 + Math.random() * 3;

      // 그림자
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
    }

    /**
     * 각 본마다 "게임 모션이 가정한 축" → "이 모델의 실제 본 축" 보정 쿼터니언을 만든다.
     * MMD 모델은 A 포즈이고 본이 제각각 기울어져 있어서, 회전값을 그대로 꽂으면
     * 팔이 몸을 파고들거나 다리가 옆으로 벌어진다. 본이 실제로 뻗은 방향을 재서
     * 그 프레임 안에서 회전시키면 절차 모션이 자연스럽게 얹힌다.
     */
    buildAxisFix() {
      this.axisFix = {};
      this.restQuat = {};
      const mesh = this.mesh;
      mesh.updateMatrixWorld(true);

      const wpA = new THREE.Vector3(), wpB = new THREE.Vector3();
      const wq = new THREE.Quaternion(), wqInv = new THREE.Quaternion();
      const dir = new THREE.Vector3(), canon = new THREE.Vector3();

      for (const name of AB.BONES) {
        const bone = this.bones[name];
        if (!bone) continue;
        this.restQuat[name] = bone.quaternion.clone();

        const childName = CHAIN_CHILD[name];
        const child = childName && this.bones[childName];
        const canonArr = CANON_DIR[name];
        if (!child || !canonArr) { this.axisFix[name] = null; continue; }

        bone.getWorldPosition(wpA);
        child.getWorldPosition(wpB);
        dir.subVectors(wpB, wpA);
        if (dir.lengthSq() < 1e-10) { this.axisFix[name] = null; continue; }
        dir.normalize();

        // 월드 방향 → 이 본의 로컬 축 기준 방향
        bone.getWorldQuaternion(wq);
        wqInv.copy(wq).invert();
        dir.applyQuaternion(wqInv).normalize();

        canon.set(canonArr[0], canonArr[1], canonArr[2]).normalize();
        const q = new THREE.Quaternion().setFromUnitVectors(canon, dir);
        this.axisFix[name] = { q, qi: q.clone().invert() };
      }
    }

    /**
     * 애니메이터가 넘겨준 포즈를 축 보정을 거쳐 본에 적용한다.
     * target: {boneName: [rx, ry, rz]} — 게임 리그 기준 회전값
     */
    applyPose(target, lam, dt) {
      if (!this._pq) {
        this._pq = new THREE.Quaternion();
        this._pe = new THREE.Euler();
        this._pd = new THREE.Quaternion();
      }
      const alpha = 1 - Math.exp(-lam * dt);
      const q = this._pq, e = this._pe, out = this._pd;

      for (const name of AB.BONES) {
        const bone = this.bones[name];
        if (!bone) continue;
        const t = target[name];
        let rx = t ? t[0] : 0, ry = t ? t[1] : 0, rz = t ? t[2] : 0;

        // 다리 스윙은 모델 비율에 맞춰 보폭 보정
        if (this.legScale !== 1 &&
          (name === 'thighL' || name === 'thighR' || name === 'shinL' || name === 'shinR')) {
          rx /= this.legScale;
        }

        e.set(rx, ry, rz, 'XYZ');
        q.setFromEuler(e);

        const fix = this.axisFix[name];
        if (fix) {
          // 보정 프레임 안에서 회전: qFix * R * qFix⁻¹
          out.copy(fix.q).multiply(q).multiply(fix.qi);
        } else {
          out.copy(q);
        }
        // 바인드 포즈에 얹는다
        out.premultiply(this.restQuat[name]);
        bone.quaternion.slerp(out, alpha);
      }

      // 부여(付与) 본 — 팔 비틀림 등 종속 본 갱신
      if (this.grantSolver) {
        try { this.grantSolver.update(); } catch (e2) { this.grantSolver = null; }
      }
    }

    attachWeapon(weapon, boneName) {
      const b = this.bones[boneName || 'handR'];
      if (!b) return;
      if (this.weapon && this.weapon.parent) this.weapon.parent.remove(this.weapon);
      // 모델 스케일을 상쇄해 무기 크기를 월드 기준으로 유지
      weapon.scale.multiplyScalar(1 / this.modelScale);
      this.weapon = weapon;
      b.add(weapon);
    }

    updateDynamics(dt, accel, speed01) {
      // PMX 는 자체 물리(강체)로 치마·머리카락이 흔들린다.
      // 본 포즈가 이미 적용된 뒤이므로, 월드 행렬을 갱신하고 물리를 돌린다.
      if (this.physicsHelper) {
        try {
          this.mesh.updateMatrixWorld(true);
          this.physicsHelper.update(Math.min(dt, 1 / 30));
        } catch (e) {
          console.warn('[MMD] 물리 갱신 실패 — 비활성화', e);
          this.physicsHelper = null;
        }
      }
    }

    updateFace(dt) {
      if (this.blinkIndex == null || !this.mesh.morphTargetInfluences) return;
      this.blinkTimer -= dt;
      const inf = this.mesh.morphTargetInfluences;
      if (this.blinkTimer < 0) {
        const t = -this.blinkTimer;
        inf[this.blinkIndex] = t < 0.07 ? t / 0.07 : t < 0.14 ? 1 - (t - 0.07) / 0.07 : 0;
        if (t > 0.15) this.blinkTimer = 2 + Math.random() * 4;
      } else inf[this.blinkIndex] = 0;
    }

    setOpacity(a) {
      const mats = Array.isArray(this.mesh.material) ? this.mesh.material : [this.mesh.material];
      mats.forEach(m => { m.transparent = a < 1 || m.transparent; m.opacity = a; });
    }
  }

  /* ============================================================
     로더 진입점
     ============================================================ */
  const MMDChar = {
    ready: false,
    vfs: null,
    vfsList: [],
    lastError: null,

    /** 등록된 모든 의상의 가상 파일 시스템을 해제 (기본 모델로 되돌릴 때만) */
    disposeAll() {
      for (const v of (this.vfsList || [])) {
        try { v.dispose(); } catch (e) { /* 무시 */ }
      }
      this.vfsList = [];
      this.vfs = null;
    },

    async ensureLibs(onStatus) {
      if (this.ready) return;
      onStatus && onStatus('MMD 라이브러리를 불러오는 중…');
      await loadLib('mmdParser');
      await loadLib('tga');
      await loadLib('ccdik');
      await loadLib('mmdToonShader');   // MMDLoader 가 THREE.MMDToonShader 를 참조한다
      await loadLib('mmdLoader');
      this.ready = true;
    },

    async ensurePhysics(onStatus) {
      if (global.__abAmmoReady) return global.__abAmmoReady;
      global.__abAmmoReady = (async () => {
        onStatus && onStatus('물리 엔진(Ammo)을 불러오는 중…');
        await loadScript(CDN.ammo);
        if (typeof global.Ammo === 'function') {
          global.Ammo = await global.Ammo();
        }
        await loadLib('mmdPhysics');
        await loadLib('mmdHelper');
        return true;
      })().catch(e => { console.warn('Ammo 실패', e); return false; });
      return global.__abAmmoReady;
    },

    /**
     * files: File[] (zip 또는 pmx). 결과: {mesh, vfs, pmxList}
     */
    async loadFromFiles(files, opts) {
      opts = opts || {};
      const status = opts.onStatus || (() => { });
      await this.ensureLibs(status);

      const vfs = new VFS();
      for (const f of files) {
        if (/\.zip$/i.test(f.name)) {
          status(`압축 해제: ${f.name}`);
          await vfs.addZip(f);
        } else {
          const bytes = new Uint8Array(await f.arrayBuffer());
          vfs.addRaw(f.name, bytes);
        }
      }
      const pmxList = vfs.listPMX();
      if (!pmxList.length) throw new Error('zip 안에서 .pmx / .pmd 파일을 찾지 못했습니다.');

      status('텍스처를 준비하는 중…');
      await vfs.prepareAll(p => status(`텍스처 준비 ${Math.round(p * 100)}%`));

      // 선호 항목: 이름에 1.03 / 最新 이 들어간 것 우선
      let pick = opts.pmxPath || pmxList.find(p => /1\.?03|最新|latest/i.test(p)) || pmxList[0];

      const manager = new THREE.LoadingManager();
      manager.setURLModifier((url) => {
        if (!url.startsWith(RES)) return url;
        const rel = decodeURIComponent(url.slice(RES.length));
        const hit = vfs.urlSync(rel);
        if (!hit) console.warn('[MMD] 텍스처 없음:', rel);
        return hit || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
      });

      const loader = new THREE.MMDLoader(manager);
      loader.setResourcePath(RES);

      status('모델을 읽는 중…');
      const mesh = await new Promise((res, rej) => {
        loader.load(RES + pick, res, (p) => {
          if (p.total) status(`모델 읽는 중 ${Math.round(p.loaded / p.total * 100)}%`);
        }, rej);
      });

      // 툰 셰이딩 톤 조정 — 게임 조명에 맞춤
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach(m => {
        m.side = THREE.DoubleSide;
        if (m.emissive) m.emissive.multiplyScalar(0.35);
        m.transparent = m.transparent || false;
      });

      // 이전 VFS 를 여기서 해제하면 안 된다.
      // 의상을 여러 벌 등록할 때, 먼저 읽은 모델의 텍스처가 아직 디코딩 중인데
      // blob URL 이 revoke 되면 그 모델이 영구히 흰색으로 남는다.
      // 등록된 의상이 살아 있는 동안에는 전부 유지하고, 초기화할 때만 해제한다.
      this.vfsList = this.vfsList || [];
      this.vfsList.push(vfs);
      this.vfs = vfs;
      return { mesh, vfs, pmxList, picked: pick };
    },

    /** 리그 어댑터 생성 (+ 선택적 물리) */
    async makeRig(mesh, opts) {
      const rig = new MMDRig(mesh, opts);
      if (opts && opts.physics) {
        const ok = await this.ensurePhysics(opts.onStatus);
        if (ok && THREE.MMDAnimationHelper) {
          try {
            const helper = new THREE.MMDAnimationHelper({ afterglow: 2.0 });
            // 애니메이션 클립을 주지 않으므로 helper.update() 는 물리만 돌린다.
            helper.add(mesh, { physics: true });
            rig.physicsHelper = helper;
            // 부여(付与) 본 솔버 — 팔 비틀림 등 종속 본 처리
            const mmd = mesh.geometry && mesh.geometry.userData && mesh.geometry.userData.MMD;
            if (mmd && mmd.grants && mmd.grants.length) {
              rig.grantSolver = helper.createGrantSolver(mesh);
            }
          } catch (e) {
            console.warn('MMD 물리 초기화 실패:', e);
          }
        }
      }
      return rig;
    },
  };

  /* ============================================================
     IndexedDB 캐시 — 큰 zip 을 다시 고르지 않도록 저장
     ============================================================ */
  const Cache = {
    DB: 'aetherblade-models', STORE: 'files',
    open() {
      return new Promise((res, rej) => {
        const r = indexedDB.open(this.DB, 1);
        r.onupgradeneeded = () => { r.result.createObjectStore(this.STORE); };
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      });
    },
    async put(key, files) {
      try {
        const db = await this.open();
        const tx = db.transaction(this.STORE, 'readwrite');
        tx.objectStore(this.STORE).put(files.map(f => ({ name: f.name, blob: f })), key);
        return new Promise(res => { tx.oncomplete = () => res(true); tx.onerror = () => res(false); });
      } catch (e) { return false; }
    },
    async get(key) {
      try {
        const db = await this.open();
        const tx = db.transaction(this.STORE, 'readonly');
        const req = tx.objectStore(this.STORE).get(key);
        return new Promise(res => {
          req.onsuccess = () => {
            const v = req.result;
            if (!v) return res(null);
            res(v.map(x => new File([x.blob], x.name)));
          };
          req.onerror = () => res(null);
        });
      } catch (e) { return null; }
    },
    async clear() {
      try {
        const db = await this.open();
        const tx = db.transaction(this.STORE, 'readwrite');
        tx.objectStore(this.STORE).clear();
        return true;
      } catch (e) { return false; }
    },
  };

  AB.MMDChar = MMDChar;
  AB.MMDRig = MMDRig;
  AB.ModelCache = Cache;
  AB.readZip = readZip;
})(window);
