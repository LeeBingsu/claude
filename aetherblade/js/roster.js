/* ============================================================
   AETHER BLADE  —  roster.js
   무기 프리팹 + 플레이어블 캐릭터 3인 정의
   ============================================================ */
(function (global) {
  'use strict';
  const AB = global.AB, U = AB.U, Assets = AB.Assets;
  const H = AB.charHelpers;

  /* ---------- 원소 정의 ---------- */
  const ELEMENTS = {
    fire: { key: 'fire', name: '염화', color: 0xff6a3c, css: '#ff6a3c', light: 0xff9a5c },
    ice: { key: 'ice', name: '빙결', color: 0x6fd8ff, css: '#6fd8ff', light: 0xa8ecff },
    lightning: { key: 'lightning', name: '뇌전', color: 0xc07dff, css: '#c07dff', light: 0xdcb0ff },
    void: { key: 'void', name: '공허', color: 0x7a5cff, css: '#7a5cff', light: 0xa08cff },
  };

  /* ---------- 무기 공통 ---------- */
  function markers(g, baseY, tipY) {
    const base = new THREE.Object3D(); base.position.y = baseY; g.add(base);
    const tip = new THREE.Object3D(); tip.position.y = tipY; g.add(tip);
    g.userData.base = base;
    g.userData.tip = tip;
    return g;
  }

  function glowMat(color) {
    return new THREE.MeshBasicMaterial({ color: color, toneMapped: false });
  }

  /* ---------- 대검 ---------- */
  function makeGreatsword(accent) {
    const g = new THREE.Group();
    const steel = Assets.toon(0xb9c2d6);
    const dark = Assets.toon(0x2a2d3a);
    const trim = Assets.toon(0x8a6a3a);
    const glow = glowMat(accent);

    // 손잡이
    H.part(g, H.cyl(0.032, 0.036, 0.34, 8), dark, [0, -0.15, 0], 1.1);
    H.part(g, H.sph(0.05, 10, 8), trim, [0, -0.33, 0], 1.1);
    // 가드
    H.part(g, H.box(0.42, 0.06, 0.10), trim, [0, 0.03, 0], 1.06);
    H.part(g, H.box(0.09, 0.09, 0.13), glow, [0, 0.05, 0], 0);
    // 검신
    const blade = H.part(g, H.box(0.26, 1.55, 0.055), steel, [0, 0.85, 0], 1.03);
    blade.castShadow = true;
    // 날 발광
    H.part(g, H.box(0.045, 1.5, 0.062), glow, [-0.10, 0.85, 0], 0);
    H.part(g, H.box(0.045, 1.5, 0.062), glow, [0.10, 0.85, 0], 0);
    // 검 끝
    const tipGeo = new THREE.ConeGeometry(0.14, 0.34, 4);
    const tipMesh = H.part(g, tipGeo, steel, [0, 1.74, 0], 1.05);
    tipMesh.rotation.y = Math.PI / 4;
    tipMesh.scale.set(1.3, 1, 0.35);
    // 룬 홈
    H.part(g, H.box(0.05, 0.9, 0.07), glow, [0, 0.75, 0], 0);
    return markers(g, 0.08, 1.85);
  }

  /* ---------- 쌍검 (한 자루) ---------- */
  function makeShortBlade(accent, mirror) {
    const g = new THREE.Group();
    const steel = Assets.toon(0xd6dcea);
    const dark = Assets.toon(0x24262f);
    const glow = glowMat(accent);
    H.part(g, H.cyl(0.026, 0.030, 0.24, 8), dark, [0, -0.10, 0], 1.1);
    H.part(g, H.box(0.20, 0.045, 0.08), Assets.toon(0x9aa3b8), [0, 0.03, 0], 1.06);
    H.part(g, H.box(0.055, 0.055, 0.10), glow, [0, 0.04, 0], 0);
    const blade = H.part(g, H.box(0.10, 0.92, 0.032), steel, [0, 0.52, 0], 1.04);
    blade.castShadow = true;
    H.part(g, H.box(0.028, 0.90, 0.040), glow, [mirror ? -0.035 : 0.035, 0.52, 0], 0);
    const tipGeo = new THREE.ConeGeometry(0.075, 0.24, 4);
    const t = H.part(g, tipGeo, steel, [0, 1.08, 0], 1.05);
    t.rotation.y = Math.PI / 4; t.scale.set(1.1, 1, 0.4);
    return markers(g, 0.06, 1.16);
  }

  /* ---------- 장창 ---------- */
  function makePolearm(accent) {
    const g = new THREE.Group();
    const shaft = Assets.toon(0x3d3a46);
    const steel = Assets.toon(0xc8d2e6);
    const trim = Assets.toon(0x6d5a86);
    const glow = glowMat(accent);
    H.part(g, H.cyl(0.038, 0.038, 2.30, 8), shaft, [0, 0.35, 0], 1.05);
    for (let i = -3; i <= 3; i++) H.part(g, H.cyl(0.048, 0.048, 0.045, 8), trim, [0, 0.35 + i * 0.30, 0], 1.05);
    // 창날
    const head = new THREE.ConeGeometry(0.13, 0.62, 4);
    const hm = H.part(g, head, steel, [0, 1.78, 0], 1.04);
    hm.rotation.y = Math.PI / 4; hm.scale.set(1.0, 1, 0.32);
    H.part(g, H.box(0.05, 0.5, 0.06), glow, [0, 1.72, 0], 0);
    // 날개 장식
    H.part(g, H.box(0.30, 0.06, 0.05), trim, [0, 1.44, 0], 1.05);
    H.part(g, H.sph(0.07, 10, 8), glow, [0, 1.40, 0], 0);
    // 물미
    H.part(g, H.cyl(0.02, 0.06, 0.20, 8), trim, [0, -0.88, 0], 1.06);
    return markers(g, 1.30, 2.06);
  }

  /* ---------- NPC / 소품용 단검 ---------- */
  function makeStaff(accent) {
    const g = new THREE.Group();
    const wood = Assets.toon(0x51402e);
    const glow = glowMat(accent);
    H.part(g, H.cyl(0.032, 0.036, 1.80, 8), wood, [0, 0.2, 0], 1.06);
    const orb = H.part(g, H.sph(0.13, 12, 10), glow, [0, 1.16, 0], 0);
    const ring = new THREE.TorusGeometry(0.20, 0.022, 8, 20);
    const r = H.part(g, ring, Assets.toon(0x8f7fb0), [0, 1.16, 0], 1.06);
    r.rotation.x = Math.PI / 2;
    g.userData.orb = orb;
    return markers(g, 0.9, 1.3);
  }

  /* ---------- 시그니처 무기: 「빙화 낙월」 (원작 오리지널)
     서리꽃 장식이 달린 초승달형 글레이브 + 부유하는 얼음 파편 ---------- */
  function makeSignature(accent) {
    accent = accent || 0x6fd8ff;
    const g = new THREE.Group();
    const shaft = Assets.toon(0x2a2f3e);
    const trim = Assets.toon(0xbfe6f5);
    const ice = new THREE.MeshPhongMaterial({
      color: 0xbfeaff, emissive: 0x2a6a8a, shininess: 90,
      transparent: true, opacity: 0.9,
    });
    const glow = glowMat(accent);

    // 자루
    H.part(g, H.cyl(0.032, 0.036, 1.70, 8), shaft, [0, 0.30, 0], 1.05);
    for (let i = -2; i <= 2; i++)
      H.part(g, H.cyl(0.045, 0.045, 0.04, 8), trim, [0, 0.30 + i * 0.34, 0], 1.06);
    // 물미 보석
    H.part(g, H.sph(0.06, 10, 8), glow, [0, -0.56, 0], 0);

    // 초승달 날 — 여러 조각으로 곡선 구성
    const blade = new THREE.Group();
    blade.position.y = 1.30;
    g.add(blade);
    const N = 7;
    for (let i = 0; i < N; i++) {
      const a = (-0.15 + i / (N - 1)) * Math.PI * 0.95;   // 곡선 각도
      const r = 0.62;
      const seg = H.part(blade, H.box(0.055, 0.30 - i * 0.02, 0.02), ice,
        [Math.cos(a) * r * 0.5, Math.sin(a) * r, 0], 1.04);
      seg.rotation.z = a - Math.PI / 2;
      // 날 발광 심
      const core = H.part(blade, H.box(0.018, 0.30 - i * 0.02, 0.03), glow,
        [Math.cos(a) * r * 0.5, Math.sin(a) * r, 0], 0);
      core.rotation.z = a - Math.PI / 2;
    }
    // 날 밑동 장식 (서리꽃)
    const flower = new THREE.Group();
    flower.position.y = 1.18;
    g.add(flower);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * U.TAU;
      const petal = H.part(flower, new THREE.ConeGeometry(0.05, 0.16, 4), trim,
        [Math.cos(a) * 0.10, 0, Math.sin(a) * 0.10], 1.05);
      petal.rotation.z = Math.PI;
      petal.rotation.y = a;
      petal.rotation.x = 0.5;
    }
    H.part(flower, H.sph(0.07, 10, 8), glow, [0, 0, 0], 0);

    // 부유 얼음 파편 (애니메이션은 game 쪽 회전에 맡김 — 여기선 정적)
    const shards = new THREE.Group();
    blade.add(shards);
    for (let i = 0; i < 3; i++) {
      const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.06 + i * 0.02), ice);
      const a = (i / 3) * U.TAU;
      s.position.set(Math.cos(a) * 0.34, 0.2 + i * 0.15, Math.sin(a) * 0.1);
      shards.add(s);
    }
    g.userData.shards = shards;
    g.userData.signature = true;
    return markers(g, 0.9, 1.95);
  }

  /* ============================================================
     플레이어블 캐릭터 3인
     ============================================================ */
  const CHARACTERS = [
    {
      id: 'rien',
      name: '리엔',
      title: '잿불의 파수꾼',
      element: 'fire',
      weaponType: 'greatsword',
      desc: '무너진 성채의 마지막 기사. 잿더미 속에서 검을 다시 들었다.',
      look: {
        skin: 0xf0c9a8, hair: 0x8c2f24, coat: 0x4a2018, trim: 0xb87333,
        dark: 0x2b1c18, accent: 0xff6a3c, scale: 1.05, bulk: 1.12, hairStyle: 'short',
        cloth: 0x6b3b28, cape: true, scarf: false,
        portraitTop: '#3a1a14', portraitBottom: '#160a08',
        skinCss: '#f0c9a8', hairCss: '#8c2f24', coatCss: '#4a2018', trimCss: '#b87333',
        elementColorCss: '#ff6a3c',
      },
      stats: { hp: 1180, atk: 96, def: 62, crit: 0.15, critDmg: 1.65, speed: 5.6, sprint: 9.4 },
      combo: ['atk_heavy_1', 'atk_heavy_2', 'atk_heavy_3'],
      skill: {
        name: '작열 참격', cd: 7.5, energy: 0, type: 'burst_forward',
        desc: '전방으로 도약하며 화염을 두른 대검을 내리찍는다. 착탄 지점에 불길이 남는다.',
        mult: 2.4, radius: 3.6, dot: { dmg: 26, dur: 5, tick: 0.5 },
      },
      ult: {
        name: '인페르노 클레이모어', cost: 100, type: 'nova_field',
        desc: '검을 대지에 꽂아 화염 폭발을 일으키고, 12초간 공격에 염화 폭발을 부여한다.',
        mult: 6.0, radius: 9.0, buffDur: 12, buffMult: 0.55,
      },
    },
    {
      id: 'sera',
      name: '세라',
      title: '서리 그림자',
      element: 'ice',
      weaponType: 'dual',
      desc: '이름을 지운 암살자. 얼어붙은 계약만이 그녀를 움직인다.',
      look: {
        skin: 0xf7dcc4, hair: 0xbfe6f5, coat: 0x1e3550, trim: 0x5fb9d6,
        dark: 0x16202e, accent: 0x6fd8ff, scale: 0.97, bulk: 0.92, hairStyle: 'long',
        cloth: 0x2b4b6b, cape: false, scarf: true,
        portraitTop: '#14293e', portraitBottom: '#070d16',
        skinCss: '#f7dcc4', hairCss: '#bfe6f5', coatCss: '#1e3550', trimCss: '#5fb9d6',
        elementColorCss: '#6fd8ff',
      },
      stats: { hp: 930, atk: 74, def: 48, crit: 0.28, critDmg: 1.9, speed: 6.4, sprint: 11.0 },
      combo: ['atk_fast_1', 'atk_fast_2', 'atk_fast_3', 'atk_fast_4'],
      skill: {
        name: '서리 잔영', cd: 6.0, energy: 0, type: 'dash_strike',
        desc: '잔상을 남기며 관통 돌진. 경로상의 적을 얼려 이동을 늦춘다.',
        mult: 1.9, radius: 2.0, dist: 9.5, slow: { factor: 0.4, dur: 4 },
      },
      ult: {
        name: '빙하의 장송', cost: 100, type: 'shatter_storm',
        desc: '광역 빙결 폭풍. 얼어붙은 적은 추가 파쇄 피해를 받는다.',
        mult: 4.4, radius: 10.5, ticks: 7, freezeDur: 2.6,
      },
    },
    {
      id: 'kai',
      name: '카이',
      title: '뇌명의 방랑자',
      element: 'lightning',
      weaponType: 'polearm',
      desc: '균열을 쫓아 대륙을 떠도는 사냥꾼. 하늘의 분노를 창끝에 담는다.',
      look: {
        skin: 0xdba97e, hair: 0x2f2a3f, coat: 0x33285a, trim: 0xa88ce0,
        dark: 0x1d1a2b, accent: 0xc07dff, scale: 1.02, bulk: 1.0, hairStyle: 'short',
        cloth: 0x453a6b, cape: true, scarf: true,
        portraitTop: '#2a1f4a', portraitBottom: '#0d0916',
        skinCss: '#dba97e', hairCss: '#2f2a3f', coatCss: '#33285a', trimCss: '#a88ce0',
        elementColorCss: '#c07dff',
      },
      stats: { hp: 1020, atk: 84, def: 55, crit: 0.20, critDmg: 1.75, speed: 6.0, sprint: 10.2 },
      combo: ['atk_polearm_1', 'atk_polearm_2', 'atk_polearm_3'],
      skill: {
        name: '뇌창 투척', cd: 6.8, energy: 0, type: 'projectile_chain',
        desc: '뇌전 창을 던져 최대 4명에게 연쇄시킨다.',
        mult: 1.7, chains: 4, chainRange: 7.0, speed: 26,
      },
      ult: {
        name: '천뢰강림', cost: 100, type: 'strike_rain',
        desc: '9초간 주변에 낙뢰를 불러 적을 연쇄 마비시킨다.',
        mult: 1.5, radius: 12, dur: 9, interval: 0.45,
      },
    },
  ];

  const WEAPON_BUILDERS = {
    greatsword: (accent) => ({ main: makeGreatsword(accent), off: null, mainRot: [1.05, 0, 0.1], offRot: null }),
    dual: (accent) => ({
      main: makeShortBlade(accent, false), off: makeShortBlade(accent, true),
      mainRot: [0.62, 0, 0.20], offRot: [0.62, 0, -0.20],
    }),
    polearm: (accent) => ({ main: makePolearm(accent), off: null, mainRot: [0.22, 0, 0.06] }),
  };

  AB.ELEMENTS = ELEMENTS;
  AB.CHARACTERS = CHARACTERS;
  // 시그니처 무기: 창 계열 콤보/모션을 그대로 쓰되 근접 판정을 넓힘
  WEAPON_BUILDERS.signature = (accent) => ({
    main: makeSignature(accent), off: null, mainRot: [0.28, 0, 0.05],
  });

  AB.WEAPONS = { makeGreatsword, makeShortBlade, makePolearm, makeStaff, makeSignature, WEAPON_BUILDERS };
})(window);
