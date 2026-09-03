/* ============================================================
   AETHER BLADE  —  quests.js
   NPC · 상호작용 오브젝트 · 퀘스트 체인 · 대사
   ============================================================ */
(function (global) {
  'use strict';
  const AB = global.AB, U = AB.U, Assets = AB.Assets;

  /* ============================================================
     NPC
     ============================================================ */
  class NPC {
    constructor(game, cfg) {
      this.game = game;
      this.cfg = cfg;
      this.name = cfg.name;
      this.rig = new AB.Rig(cfg.look);
      this.anim = new AB.Animator(this.rig);
      this.root = new THREE.Group();
      this.root.add(this.rig.root);
      const y = game.world.height(cfg.x, cfg.z);
      this.root.position.set(cfg.x, y, cfg.z);
      this.root.rotation.y = cfg.yaw || 0;
      game.scene.add(this.root);
      if (cfg.weapon) {
        const w = AB.WEAPONS.makeStaff(cfg.look.accent);
        w.scale.setScalar(0.9);
        w.rotation.set(0.2, 0, 0.15);
        this.rig.attachWeapon(w, 'handL');
        this.staff = w;
      }
      // 상호작용 마커
      this.marker = new THREE.Group();
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.5, 0.62, 24),
        new THREE.MeshBasicMaterial({ color: 0xffd98a, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.08;
      this.marker.add(ring);
      this.icon = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.20),
        new THREE.MeshBasicMaterial({ color: 0xffd98a })
      );
      this.icon.position.y = 2.35;
      this.marker.add(this.icon);
      this.root.add(this.marker);
      this.t = 0;
      this.radius = 0.6;
      game.world.obstacles.push({ x: cfg.x, z: cfg.z, r: 0.7 });
    }
    update(dt, player) {
      this.t += dt;
      this.anim.update(dt, { speed01: 0, grounded: true, vy: 0, velocity: new THREE.Vector3() });
      this.icon.rotation.y += dt * 1.6;
      this.icon.position.y = 2.35 + Math.sin(this.t * 2) * 0.12;
      // 플레이어 쪽 바라보기
      const d = new THREE.Vector3().subVectors(player.position, this.root.position);
      if (d.length() < 12) {
        this.root.rotation.y = U.angleDamp(this.root.rotation.y, Math.atan2(d.x, d.z), 3, dt);
      }
      const q = this.game.quests.markerState();
      this.icon.material.color.setHex(q === 'complete' ? 0x7fffa0 : q === 'available' ? 0xffd98a : 0x8aa0c0);
      this.marker.visible = q !== 'none';
    }
    get position() { return this.root.position; }
  }

  /* ============================================================
     상호작용 오브젝트 (유물 / 봉인석 / 보물상자)
     ============================================================ */
  class Interactable {
    constructor(game, cfg) {
      this.game = game;
      this.cfg = cfg;
      this.kind = cfg.kind;
      this.id = cfg.id;
      this.used = false;
      this.t = Math.random() * 6;
      this.radius = cfg.radius || 2.2;
      this.label = cfg.label || '조사';
      this.duration = cfg.duration || 0;

      const g = new THREE.Group();
      const color = cfg.color || 0xffd98a;
      if (cfg.kind === 'relic') {
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.62, 0.24, 8), Assets.toon(0x5b5560));
        g.add(base);
        const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.34, 0),
          new THREE.MeshBasicMaterial({ color, toneMapped: false }));
        orb.position.y = 0.95;
        g.add(orb);
        this.orb = orb;
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.045, 8, 22),
          new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7 }));
        ring.position.y = 0.95;
        ring.rotation.x = Math.PI / 2.4;
        g.add(ring);
        this.ring = ring;
      } else if (cfg.kind === 'seal') {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.68, 2.6, 6), Assets.toon(0x4a4458));
        pillar.position.y = 1.3;
        pillar.castShadow = true;
        g.add(pillar);
        const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 0),
          new THREE.MeshBasicMaterial({ color: 0x9a5cff, toneMapped: false }));
        core.position.y = 2.9;
        g.add(core);
        this.orb = core;
        const l = new THREE.PointLight(0x9a5cff, 1.6, 16, 2);
        l.position.y = 2.9;
        g.add(l);
        this.light = l;
      } else { // chest
        const body = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.7, 0.7), Assets.toon(0x6b4a2c));
        body.position.y = 0.35; body.castShadow = true;
        g.add(body);
        const lid = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.28, 0.75), Assets.toon(0x8a5f38));
        lid.position.y = 0.82;
        g.add(lid);
        this.lid = lid;
        const lock = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.2, 0.1),
          new THREE.MeshBasicMaterial({ color: 0xffd98a }));
        lock.position.set(0, 0.72, 0.38);
        g.add(lock);
      }
      const light = new THREE.PointLight(color, 1.1, 10, 2);
      light.position.y = 1.0;
      g.add(light);
      this.glowLight = light;

      const y = game.world.height(cfg.x, cfg.z);
      g.position.set(cfg.x, y, cfg.z);
      game.scene.add(g);
      this.root = g;
    }
    get position() { return this.root.position; }
    update(dt) {
      this.t += dt;
      if (this.orb) {
        this.orb.rotation.y += dt * 1.2;
        this.orb.rotation.x += dt * 0.7;
        this.orb.position.y = (this.kind === 'seal' ? 2.9 : 0.95) + Math.sin(this.t * 1.6) * 0.12;
      }
      if (this.ring) this.ring.rotation.z += dt * 0.9;
      if (this.glowLight) this.glowLight.intensity = 1.0 + Math.sin(this.t * 3) * 0.3;
      if (!this.used && Math.random() < dt * 3) {
        this.game.vfx.particles.burst(
          new THREE.Vector3(this.position.x, this.position.y + 1.0, this.position.z),
          { color: this.cfg.color || 0xffd98a, count: 1, speedMin: 0.1, speedMax: 0.5,
            sizeMin: 0.12, sizeMax: 0.3, lifeMin: 0.6, lifeMax: 1.2, up: 0.8, gravity: -0.6, spread: 0.5 });
      }
    }
    complete() {
      this.used = true;
      this.game.vfx.particles.burst(
        new THREE.Vector3(this.position.x, this.position.y + 1.2, this.position.z),
        { color: this.cfg.color || 0xffd98a, count: 28, speedMin: 2, speedMax: 8,
          sizeMin: 0.2, sizeMax: 0.6, lifeMin: 0.5, lifeMax: 1.1, up: 3 });
      Assets.sfx.pickup();
      if (this.kind === 'relic') {
        this.game.scene.remove(this.root);
      } else if (this.kind === 'seal') {
        this.orb.material.color.setHex(0x7fffa0);
        if (this.light) this.light.color.setHex(0x7fffa0);
        this.game.vfx.shockwave(this.position, 6, 0x7fffa0);
      } else if (this.lid) {
        this.lid.rotation.x = -1.2;
        this.lid.position.set(0, 0.95, -0.35);
      }
    }
  }

  /* ============================================================
     퀘스트 정의
     ============================================================ */
  const QUESTS = [
    {
      id: 'q1',
      title: '눈을 뜬 자',
      giver: '엘라라',
      summary: '야영지 서쪽 평원의 굶주린 늑대 무리를 정리한다.',
      dialogue: [
        { who: '엘라라', text: '살아 있었구나. 사흘 만이야. 균열이 터진 뒤로 깨어난 사람은 네가 처음이다.' },
        { who: '엘라라', text: '설명은 나중에. 지금은 서쪽 평원이 문제야. 늑대들이 공허에 물들어 사람을 노리고 있어.' },
        { who: '리엔', text: '…검은 아직 들 수 있어.' },
        { who: '엘라라', text: '그거면 충분해. 여섯 마리. 그 이상 남겨두면 야영지까지 내려온다.' },
      ],
      objectives: [{ type: 'kill', match: ['wolf', 'wolfAlpha'], count: 6, desc: '오염된 늑대 처치' }],
      rewards: { xp: 260, potion: 3 },
      complete: [
        { who: '엘라라', text: '몸이 기억하고 있었군. 좋아 — 널 믿어도 되겠어.' },
        { who: '엘라라', text: '동행이 하나 도착했다. 세라라고 해. …말은 아끼는 편이니 기대는 마.' },
      ],
      cutsceneOnComplete: 'sera_join',
      unlock: 'sera',
    },
    {
      id: 'q2',
      title: '잿더미 속의 유물',
      giver: '엘라라',
      summary: '동쪽 무너진 성채에서 봉인 유물 3개를 회수한다.',
      dialogue: [
        { who: '엘라라', text: '균열을 다시 닫으려면 봉인 유물이 필요해. 세 조각. 전부 동쪽 성채에 흩어져 있다.' },
        { who: '세라', text: '성채엔 허물들이 있어. 죽은 병사들이 계속 걸어 다니는 곳이야.' },
        { who: '엘라라', text: '유물만 챙겨 와. 싸움은 피할 수 있으면 피하고.' },
        { who: '세라', text: '…피할 수 있을 리가.' },
      ],
      objectives: [{ type: 'collect', id: 'relic', count: 3, desc: '봉인 유물 회수' }],
      rewards: { xp: 420, potion: 3 },
      complete: [
        { who: '엘라라', text: '세 조각 다 모였어. 손이 떨리는군… 이걸 다시 만질 날이 올 줄이야.' },
      ],
      spawn: 'relics',
    },
    {
      id: 'q3',
      title: '허물이 된 자들',
      giver: '엘라라',
      summary: '성채를 배회하는 허물 병사 8기를 정리한다.',
      dialogue: [
        { who: '엘라라', text: '유물을 옮기려면 성채가 조용해야 해. 허물들을 정리해줘.' },
        { who: '엘라라', text: '…저것들도 한때는 내 부하였다. 편하게 보내줘.' },
      ],
      objectives: [{ type: 'kill', match: ['husk', 'huskGuard'], count: 8, desc: '허물 병사 처치' }],
      rewards: { xp: 640, potion: 4 },
      complete: [
        { who: '카이', text: '오, 방금 그 마무리 좋았는데. 나도 껴도 되나?' },
        { who: '엘라라', text: '…뇌명의 방랑자. 소문대로 때를 잘 고르는군.' },
        { who: '카이', text: '균열을 쫓아 여기까지 왔어. 목적지가 같으면 같이 가는 게 이득이잖아.' },
      ],
      cutsceneOnComplete: 'kai_join',
      unlock: 'kai',
    },
    {
      id: 'q4',
      title: '균열을 봉인하라',
      giver: '엘라라',
      summary: '북쪽 균열 지대의 봉인석 3기를 활성화한다.',
      dialogue: [
        { who: '엘라라', text: '북쪽 균열 지대로 가. 봉인석 세 기를 유물로 다시 밝혀야 한다.' },
        { who: '엘라라', text: '봉인을 시작하면 저쪽도 알아챈다. 각오해.' },
        { who: '카이', text: '즉, 두들겨 맞으면서 일하란 소리네. 좋아.' },
      ],
      objectives: [{ type: 'interact', id: 'seal', count: 3, desc: '봉인석 활성화' }],
      rewards: { xp: 980, potion: 5 },
      complete: [
        { who: '엘라라', text: '봉인이 세 기 다 붙었어. 그런데… 균열이 닫히질 않아.' },
        { who: '엘라라', text: '남쪽이다. 원형장에 뭔가가 있어. 균열을 붙잡고 있는 것이.' },
      ],
      spawn: 'seals',
    },
    {
      id: 'q5',
      title: '감시자',
      giver: '엘라라',
      summary: '남쪽 원형장의 파멸의 감시자를 쓰러뜨린다.',
      dialogue: [
        { who: '엘라라', text: '남쪽 원형장. 그 안에 있는 건… 내 스승이었다.' },
        { who: '엘라라', text: '균열을 처음 연 사람이고, 그걸 닫으려다 삼켜진 사람이야.' },
        { who: '세라', text: '그래서, 죽여도 되는 거야 안 되는 거야.' },
        { who: '엘라라', text: '…끝내줘. 그게 그 사람이 마지막으로 나한테 부탁한 거니까.' },
      ],
      objectives: [{ type: 'boss', desc: '파멸의 감시자 토벌' }],
      rewards: { xp: 2600, potion: 6 },
      complete: [
        { who: '엘라라', text: '끝났어. …고마워.' },
      ],
      cutsceneOnStart: 'boss_intro',
      cutsceneOnComplete: 'ending',
      spawn: 'boss',
    },
  ];

  /* ============================================================
     퀘스트 시스템
     ============================================================ */
  class QuestSystem {
    constructor(game) {
      this.game = game;
      this.index = 0;
      this.active = null;
      this.progress = [];
      this.finished = [];
      this.state = 'available';   // available | active | complete
      this.interactables = [];
    }

    get current() { return QUESTS[this.index] || null; }

    markerState() {
      if (!this.current) return 'none';
      if (this.state === 'available') return 'available';
      if (this.state === 'complete') return 'complete';
      return 'active';
    }

    /** NPC 대화 시작 */
    talk() {
      const q = this.current;
      if (!q) {
        this.game.ui.dialogue([
          { who: '엘라라', text: '균열은 닫혔다. 하지만 대륙 어딘가엔 또 다른 균열이 있겠지.' },
          { who: '엘라라', text: '쉬어도 좋아. 다음 싸움은 아직 오지 않았으니까.' },
        ]);
        return;
      }
      if (this.state === 'available') {
        this.game.ui.dialogue(q.dialogue, () => this.start());
      } else if (this.state === 'complete') {
        this.game.ui.dialogue(q.complete, () => this.turnIn());
      } else {
        const o = q.objectives[0];
        this.game.ui.dialogue([
          { who: '엘라라', text: `${q.summary}` },
          { who: '엘라라', text: `진행: ${this.progressText()}` },
        ]);
      }
    }

    start() {
      const q = this.current;
      this.state = 'active';
      this.progress = q.objectives.map(() => 0);
      this.game.ui.questToast('퀘스트 수락', q.title);
      Assets.sfx.quest();
      if (q.spawn) this.game.spawnForQuest(q.spawn);
      if (q.cutsceneOnStart && this.game.cine) {
        // 보스 컷신은 투기장 진입 시 재생
        this.pendingCutscene = q.cutsceneOnStart;
      }
      this.game.ui.updateQuest();
    }

    turnIn() {
      const q = this.current;
      this.game.player.gainXP(q.rewards.xp);
      if (q.rewards.potion) this.game.inventory.potions += q.rewards.potion;
      this.game.ui.questToast('퀘스트 완료', `${q.title}  +${q.rewards.xp} EXP`);
      Assets.sfx.levelup();
      this.finished.push(q.id);
      if (q.unlock) this.game.unlockCharacter(q.unlock);
      const after = q.cutsceneOnComplete;
      this.index++;
      this.state = 'available';
      this.progress = [];
      this.game.ui.updateQuest();
      if (after && this.game.cine) this.game.cine.play(after);
    }

    progressText() {
      const q = this.current;
      if (!q || this.state !== 'active') return '';
      return q.objectives.map((o, i) => `${o.desc} ${this.progress[i]}/${o.count || 1}`).join(' · ');
    }

    _bump(i) {
      const q = this.current;
      this.progress[i] = Math.min(this.progress[i] + 1, q.objectives[i].count || 1);
      this.game.ui.updateQuest();
      this.game.ui.objectiveFlash();
      if (this.progress.every((p, k) => p >= (q.objectives[k].count || 1))) {
        this.state = 'complete';
        this.game.ui.questToast('목표 달성', '엘라라에게 돌아가세요');
        Assets.sfx.quest();
      }
    }

    onKill(typeKey) {
      if (this.state !== 'active') return;
      const q = this.current;
      q.objectives.forEach((o, i) => {
        if (o.type === 'kill' && o.match.includes(typeKey) && this.progress[i] < o.count) this._bump(i);
        if (o.type === 'boss' && typeKey === 'warden' && this.progress[i] < 1) this._bump(i);
      });
    }
    onCollect(id) {
      if (this.state !== 'active') return;
      const q = this.current;
      q.objectives.forEach((o, i) => {
        if (o.type === 'collect' && o.id === id && this.progress[i] < o.count) this._bump(i);
      });
    }
    onInteract(id) {
      if (this.state !== 'active') return;
      const q = this.current;
      q.objectives.forEach((o, i) => {
        if (o.type === 'interact' && o.id === id && this.progress[i] < o.count) this._bump(i);
      });
    }
  }

  AB.NPC = NPC;
  AB.Interactable = Interactable;
  AB.QuestSystem = QuestSystem;
  AB.QUESTS = QUESTS;
})(window);
