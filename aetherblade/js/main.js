/* ============================================================
   AETHER BLADE  —  main.js
   게임 루프 · 씬 구성 · 스폰 · 카메라 · 메뉴
   ============================================================ */
(function (global) {
  'use strict';
  const AB = global.AB, U = AB.U, Assets = AB.Assets;
  const $ = (id) => document.getElementById(id);

  const SAVE_KEY = 'aetherblade.save.v1';

  function detectQuality() {
    const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
      || (('ontouchstart' in window) && window.innerWidth < 1100);
    const dpr = window.devicePixelRatio || 1;
    const lowEnd = mobile || (navigator.hardwareConcurrency || 4) <= 4;
    return {
      mobile,
      shadows: !lowEnd,
      shadowSize: lowEnd ? 1024 : 2048,
      pixelRatio: Math.min(dpr, mobile ? 1.6 : 2),
      particles: lowEnd ? 700 : 2200,
      grass: lowEnd ? 3200 : 9000,
      trees: lowEnd ? 150 : 260,
      motes: lowEnd ? 260 : 700,
      fogFar: lowEnd ? 240 : 360,
      drawDist: lowEnd ? 420 : 700,
      antialias: !lowEnd,
    };
  }

  class Game {
    constructor() {
      this.quality = detectQuality();
      this.time = 0;
      this.kills = 0;
      this.mode = 'title';
      this.enemies = [];
      this.projectiles = [];
      this.hazards = [];
      this.waves = [];
      this.fields = [];
      this.afterimages = [];
      this.interactables = [];
      this.shakePower = 0;
      this.shakeT = 0;
      this.hitstopT = 0;
      this.camYaw = Math.PI;
      this.camPitch = 0.24;
      this.camDist = 5.9;
      this.camSnap = true;
      this.baseFov = this.quality.mobile ? 62 : 55;
      this.inventory = { potions: 3 };
      this.customRig = null;
      this.customApplyAll = true;
      this.signatureWeapon = false;
      this.outfits = [];
      this.activeOutfit = -1;
      this.unlocked = ['rien'];
      this.spawnPlan = [];
    }

    /* ============================================================
       초기화
       ============================================================ */
    async init() {
      const canvas = $('game');
      this.renderer = new THREE.WebGLRenderer({
        canvas, antialias: this.quality.antialias, powerPreference: 'high-performance',
      });
      this.renderer.setPixelRatio(this.quality.pixelRatio);
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.outputEncoding = THREE.sRGBEncoding;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 0.98;
      if (this.quality.shadows) {
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      }

      this.scene = new THREE.Scene();
      this.scene.fog = new THREE.Fog(0x8a8098, 70, this.quality.fogFar);

      this.camera = new THREE.PerspectiveCamera(
        this.baseFov, window.innerWidth / window.innerHeight, 0.1, this.quality.drawDist);
      this.camera.position.set(0, 6, 14);

      Assets.init();
      AB.Rig.outlineMat = Assets.outline(0x0a0c14);

      // 조명
      const hemi = new THREE.HemisphereLight(0x9fb0e0, 0x3a322c, 0.42);
      this.scene.add(hemi);
      const sun = new THREE.DirectionalLight(0xffd9b0, 0.92);
      sun.position.set(-60, 80, -40);
      if (this.quality.shadows) {
        sun.castShadow = true;
        sun.shadow.mapSize.set(this.quality.shadowSize, this.quality.shadowSize);
        const c = sun.shadow.camera;
        c.left = -34; c.right = 34; c.top = 34; c.bottom = -34;
        c.near = 1; c.far = 190;
        sun.shadow.bias = -0.0012;
        sun.shadow.normalBias = 0.035;
      }
      this.scene.add(sun);
      this.scene.add(sun.target);
      this.sun = sun;
      const rim = new THREE.DirectionalLight(0xff9a6a, 0.26);
      rim.position.set(50, 24, 60);
      this.scene.add(rim);

      // 월드
      this.world = new AB.World(this.scene, this.quality);
      this.world.build();

      // 시스템
      this.vfx = new AB.VFX(this);
      this.ui = new AB.UI(this);
      this.input = new AB.Input(this);
      this.quests = new AB.QuestSystem(this);
      this.cine = new AB.Cinematic(this);

      // 로스터 & 초상화
      this.roster = [AB.CHARACTERS[0]];
      this.portraits = {};
      AB.CHARACTERS.forEach(c => { this.portraits[c.id] = Assets.portrait(c.look); });

      // 플레이어
      this.player = new AB.Player(this);
      const sp = this.world.findSpawn(6, 12, 3);
      this.player.root.position.copy(sp);

      // NPC
      this.npc = new AB.NPC(this, {
        name: '엘라라', x: -3.5, z: 6.5, yaw: Math.PI, weapon: true,
        look: {
          skin: 0xe8c6a8, hair: 0xd8cfc0, coat: 0x2e3550, trim: 0xc0a878,
          dark: 0x1c2030, cloth: 0x4a5270, accent: 0xffd98a,
          scale: 0.99, bulk: 0.95, hairStyle: 'long', cape: true, scarf: false,
        },
      });

      this.buildSpawnPlan();
      this.spawnInitialEnemies();

      this.ui.updateParty();
      this.ui.updateStats();
      this.ui.updateQuest();

      this.bindUI();
      window.addEventListener('resize', () => this.onResize());
      this.onResize();

      this.clock = new THREE.Clock();
      this.renderer.setAnimationLoop(() => this.frame());
      return this;
    }

    onResize() {
      const w = window.innerWidth, h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
      this.W = w; this.H = h;
      document.body.classList.toggle('portrait', h > w);
    }

    /* ============================================================
       스폰
       ============================================================ */
    buildSpawnPlan() {
      const R = (id) => this.world.REGIONS.find(r => r.id === id);
      this.spawnPlan = [
        { region: R('camp'), type: 'wolf', count: 3, level: 1, radius: 34, min: 20 },
        { region: R('plain'), type: 'wolf', count: 9, level: 2, radius: 44 },
        { region: R('plain'), type: 'wolfAlpha', count: 1, level: 4, radius: 30 },
        { region: R('ruins'), type: 'husk', count: 9, level: 5, radius: 40 },
        { region: R('ruins'), type: 'huskGuard', count: 2, level: 7, radius: 26 },
        { region: R('rift'), type: 'mage', count: 5, level: 8, radius: 40 },
        { region: R('rift'), type: 'husk', count: 4, level: 9, radius: 40 },
        { region: R('lake'), type: 'wolf', count: 3, level: 4, radius: 34 },
      ];
    }

    spawnInitialEnemies() {
      for (const p of this.spawnPlan) {
        for (let i = 0; i < p.count; i++) this.spawnFromPlan(p);
      }
    }

    spawnFromPlan(p) {
      const r = p.region;
      let pos = null;
      for (let i = 0; i < 20; i++) {
        pos = this.world.findSpawn(r.x, r.z, p.radius || r.r);
        const dc = Math.hypot(pos.x, pos.z);
        if (p.min && dc < p.min) continue;
        if (pos.distanceTo(this.player.position) > 34) break;
      }
      const e = new AB.Enemy(this, p.type, pos, p.level);
      e.plan = p;
      this.enemies.push(e);
      return e;
    }

    spawnForQuest(kind) {
      if (kind === 'relics') {
        const R = this.world.REGIONS.find(r => r.id === 'ruins');
        const spots = [[0, 0], [-18, 12], [16, -14]];
        spots.forEach(([dx, dz], i) => {
          const p = this.world.findSpawn(R.x + dx, R.z + dz, 6);
          this.interactables.push(new AB.Interactable(this, {
            kind: 'relic', id: 'relic', x: p.x, z: p.z, color: 0xffd98a,
            label: '봉인 유물 회수', radius: 2.4,
          }));
        });
        this.ui.toast('무너진 성채에 유물 위치가 표시되었습니다');
      } else if (kind === 'seals') {
        const R = this.world.REGIONS.find(r => r.id === 'rift');
        const spots = [[0, -8], [-20, 10], [20, 8]];
        spots.forEach(([dx, dz]) => {
          const p = this.world.findSpawn(R.x + dx, R.z + dz, 5);
          this.interactables.push(new AB.Interactable(this, {
            kind: 'seal', id: 'seal', x: p.x, z: p.z, color: 0x9a5cff,
            label: '봉인석 활성화 (홀드)', radius: 2.8, duration: 2.6,
          }));
        });
        this.ui.toast('균열 지대에 봉인석이 표시되었습니다');
      } else if (kind === 'boss') {
        const A = this.world.ARENA;
        const pos = new THREE.Vector3(A.x, this.world.height(A.x, A.z), A.z);
        const boss = new AB.Enemy(this, 'warden', pos, 14);
        this.enemies.push(boss);
        this.boss = boss;
        this.bossIntroPending = true;
        this.ui.toast('남쪽 원형장에서 강대한 기운이 느껴진다');
      }
    }

    /* ============================================================
       전투 콜백
       ============================================================ */
    damagePlayer(amount, source, opts) {
      if (this.mode !== 'play') return;
      this.player.takeDamage(amount, source, opts);
    }

    onEnemyKilled(e) {
      this.kills++;
      this.player.gainXP(Math.round(e.type.xp * (1 + (e.level - 1) * 0.1)));
      this.player.gainEnergy(e.type.boss ? 0 : e.type.elite ? 18 : 8);
      this.quests.onKill(e.typeKey);
      // 전리품
      const loot = e.type.loot || {};
      if (loot.potion && Math.random() < loot.potion) {
        this.inventory.potions++;
        this.ui.toast('회복약 +1', 'loot');
      }
      if (e.type.boss) {
        this.ui.bossBar(false);
        this.boss = null;
        Assets.sfx.exploreMusic();   // 보스전 종료 → 탐험 BGM 복귀
      }
      // 리스폰 예약
      if (e.plan) {
        this.respawnQueue = this.respawnQueue || [];
        this.respawnQueue.push({ plan: e.plan, t: 26 + Math.random() * 16 });
      }
      this.ui.updateStats();
      this.save();
    }

    onBossPhase(boss, phase) {
      this.ui.toast(`감시자 — ${phase}단계 각성`, 'danger');
      this.ui.updateBoss(boss);
      Assets.sfx.roar();
    }

    onPlayerDeath() {
      this.mode = 'dead';
      this.ui.showDeath(true);
      setTimeout(() => {
        this.ui.showDeath(false);
        const sp = this.world.findSpawn(0, 8, 6);
        this.player.root.position.copy(sp);
        this.player.vel.set(0, 0, 0);
        this.player.revive();
        this.camSnap = true;
        this.mode = 'play';
        this.ui.toast('재의 야영지에서 눈을 떴다');
      }, 3600);
    }

    nearestEnemy(pos, range, yaw, arc) {
      let best = null, bd = range;
      const fwd = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
      for (const e of this.enemies) {
        if (e.dead) continue;
        const d = new THREE.Vector3().subVectors(e.position, pos);
        d.y = 0;
        const dist = d.length();
        if (dist > bd) continue;
        if (arc) {
          const a = Math.abs(fwd.angleTo(d.normalize()));
          if (a > arc) continue;
        }
        bd = dist; best = e;
      }
      return best;
    }

    /* ---------- 이펙트 스폰 ---------- */
    spawnEnemyProjectile(from, to, dmg, element, speed) {
      this.projectiles.push(new AB.Projectile(this, {
        from, dir: to.clone().sub(from), speed: speed || 15,
        dmg, element, fromEnemy: true, size: 0.30, homing: 1.2,
      }));
    }

    spawnGroundHazard(x, z, radius, delay, dmg, element) {
      const decal = this.vfx.groundDecal(x, z, radius, AB.Combat.ELEM_COLOR[element] || 0xff3a2a, delay + 0.1, { spin: 1.4 });
      decal.pulse = true;
      this.hazards.push({ x, z, radius, t: delay, dmg, element });
    }

    spawnExpandingWave(pos, maxR, dmg) {
      const geo = new THREE.RingGeometry(0.6, 1.5, 44);
      const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
        color: 0xff7a2a, transparent: true, opacity: 0.85, side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(pos.x, this.world.height(pos.x, pos.z) + 0.2, pos.z);
      this.scene.add(mesh);
      this.waves.push({ mesh, r: 1, maxR, dmg, hit: false, pos: pos.clone() });
    }

    spawnBurningGround(pos, radius, dot) {
      if (!dot) return;
      const d = this.vfx.groundDecal(pos.x, pos.z, radius, 0xff6a3c, dot.dur, { spin: 0.4, opacity: 0.5 });
      this.fields.push({ pos: pos.clone(), radius, t: dot.dur, tick: 0, interval: dot.tick, dmg: dot.dmg });
    }

    spawnAfterimages(actor, n, interval) {
      const color = AB.ELEMENTS[actor.def ? actor.def.element : 'ice'].color;
      for (let i = 0; i < n; i++) {
        setTimeout(() => {
          if (!actor.root) return;
          const g = new THREE.Group();
          const mat = new THREE.MeshBasicMaterial({
            color, transparent: true, opacity: 0.4,
            blending: THREE.AdditiveBlending, depthWrite: false,
          });
          const body = new THREE.Mesh(new THREE.CapsuleGeometry
            ? new THREE.CapsuleGeometry(0.26, 0.8, 4, 8)
            : new THREE.CylinderGeometry(0.26, 0.26, 1.2, 8), mat);
          body.position.y = 1.0;
          g.add(body);
          const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 10, 8), mat);
          head.position.y = 1.72;
          g.add(head);
          g.position.copy(actor.root.position);
          g.rotation.y = actor.yaw !== undefined ? actor.yaw : actor.root.rotation.y;
          this.scene.add(g);
          this.afterimages.push({ g, mat, t: 0.42, max: 0.42 });
        }, i * interval * 1000);
      }
    }

    shake(power, dur) {
      this.shakePower = Math.max(this.shakePower, power);
      this.shakeT = Math.max(this.shakeT, dur);
    }
    hitstop(t) { this.hitstopT = Math.max(this.hitstopT, t); }

    /* ============================================================
       캐릭터 해금 / 전환
       ============================================================ */
    unlockCharacter(id) {
      if (this.unlocked.includes(id)) return;
      this.unlocked.push(id);
      const def = AB.CHARACTERS.find(c => c.id === id);
      if (def) {
        this.roster.push(def);
        this.ui.updateParty();
        this.ui.toast(`${def.name} 합류 — ${this.roster.length}번 키로 전환`, 'loot');
      }
      this.save();
    }

    swapCharacter(i) {
      if (i >= this.roster.length || i === this.player.charIndex) return;
      if (this.player.anim.locked || this.mode !== 'play') return;
      this.player.setCharacter(i);
    }

    /* ============================================================
       세이브
       ============================================================ */
    save() {
      try {
        const p = this.player, q = this.quests;
        localStorage.setItem(SAVE_KEY, JSON.stringify({
          level: p.level, xp: p.xp, xpNext: p.xpNext, charIndex: p.charIndex,
          questIndex: q.index, questState: q.state, progress: q.progress, finished: q.finished,
          unlocked: this.unlocked, potions: this.inventory.potions, kills: this.kills,
          pos: [p.position.x, p.position.z],
        }));
      } catch (e) { /* 저장 실패 무시 */ }
    }

    hasSave() {
      try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
    }

    load() {
      try {
        const s = JSON.parse(localStorage.getItem(SAVE_KEY));
        if (!s) return false;
        const p = this.player, q = this.quests;
        p.level = s.level; p.xp = s.xp; p.xpNext = s.xpNext;
        this.inventory.potions = s.potions;
        this.kills = s.kills || 0;
        (s.unlocked || []).forEach(id => this.unlockCharacter(id));
        q.index = s.questIndex; q.state = s.questState;
        q.progress = s.progress || []; q.finished = s.finished || [];
        if (q.state === 'active' && q.current && q.current.spawn) this.spawnForQuest(q.current.spawn);
        if (s.pos) {
          const sp = this.world.findSpawn(s.pos[0], s.pos[1], 3);
          p.root.position.copy(sp);
        }
        p.hp = p.stats.hp;
        this.ui.updateStats(); this.ui.updateQuest(); this.ui.updateParty();
        return true;
      } catch (e) { return false; }
    }

    /* ============================================================
       상호작용
       ============================================================ */
    updateInteraction(dt) {
      const p = this.player;
      let target = null, label = '';
      const dNpc = this.npc.position.distanceTo(p.position);
      if (dNpc < 3.4) {
        target = { kind: 'npc' };
        const st = this.quests.markerState();
        label = st === 'complete' ? '보고하기' : st === 'available' ? '대화하기' : '대화하기';
      } else {
        for (const o of this.interactables) {
          if (o.used) continue;
          if (o.position.distanceTo(p.position) < o.radius) {
            target = { kind: 'obj', obj: o };
            label = o.label;
            break;
          }
        }
      }
      this.interactTarget = target;
      if (target && this.mode === 'play') this.ui.showInteract(label);
      else this.ui.hideInteract();

      // 홀드형 상호작용 진행도
      if (target && target.kind === 'obj' && target.obj.duration > 0 && this.input.isDown('interact')) {
        this.holdT = (this.holdT || 0) + dt;
        this.ui.showInteract(`${label}  ${Math.round(U.clamp01(this.holdT / target.obj.duration) * 100)}%`);
        if (!this.player.anim.playing) this.player.anim.play('interact');
        if (this.holdT >= target.obj.duration) {
          this.holdT = 0;
          this.completeInteract(target.obj);
        }
      } else this.holdT = 0;

      if (this.input.pressed('interact') && target && this.mode === 'play') {
        if (target.kind === 'npc') {
          this.quests.talk();
        } else if (target.obj.duration <= 0) {
          this.player.anim.play('interact');
          this.completeInteract(target.obj);
        }
      }
    }

    completeInteract(o) {
      o.complete();
      if (o.kind === 'relic') this.quests.onCollect(o.id);
      else if (o.kind === 'seal') {
        this.quests.onInteract(o.id);
        // 봉인 시 적 웨이브 습격
        for (let i = 0; i < 3; i++) {
          const pos = this.world.findSpawn(o.position.x, o.position.z, 12);
          const e = new AB.Enemy(this, Math.random() < 0.5 ? 'husk' : 'mage', pos, 9);
          e.state = 'chase';
          this.enemies.push(e);
        }
        this.ui.toast('균열이 반응한다 — 적이 몰려온다!', 'danger');
      }
    }

    /* ============================================================
       카메라
       ============================================================ */
    updateCamera(dt) {
      const p = this.player;
      const inp = this.input;

      this.camYaw -= inp.lookDX;
      this.camPitch = U.clamp(this.camPitch + inp.lookDY, -0.55, 1.15);
      this.camDist = U.clamp(this.camDist + inp.zoomDelta, 3.2, 13);

      // 락온 시 대상 방향으로 정렬
      if (p.lockTarget && !p.lockTarget.dead) {
        const d = new THREE.Vector3().subVectors(p.lockTarget.position, p.position);
        this.camYaw = U.angleDamp(this.camYaw, Math.atan2(d.x, d.z) + Math.PI, 5, dt);
      }

      const focus = p.position.clone();
      focus.y += 1.45;
      const cp = Math.cos(this.camPitch), sp = Math.sin(this.camPitch);
      const dist = this.camDist;
      const desired = new THREE.Vector3(
        focus.x + Math.sin(this.camYaw) * cp * dist,
        focus.y + sp * dist + 0.4,
        focus.z + Math.cos(this.camYaw) * cp * dist
      );

      // 지형 충돌 — 광선 위 지면보다 아래로 내려가지 않게
      const steps = 8;
      let allowed = dist;
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const x = U.lerp(focus.x, desired.x, t);
        const z = U.lerp(focus.z, desired.z, t);
        const y = U.lerp(focus.y, desired.y, t);
        const gh = this.world.height(x, z) + 0.9;
        let blocked = y < gh;
        if (!blocked) {
          // 나무/바위 등 장애물 관통 방지
          for (let k = 0; k < this.world.obstacles.length; k++) {
            const o = this.world.obstacles[k];
            const ox = x - o.x, oz = z - o.z;
            if (ox * ox + oz * oz < (o.r + 0.55) * (o.r + 0.55)) { blocked = true; break; }
          }
        }
        if (blocked) { allowed = dist * (t - 1 / steps); break; }
      }
      allowed = Math.max(1.6, allowed);
      const finalPos = new THREE.Vector3(
        focus.x + Math.sin(this.camYaw) * cp * allowed,
        Math.max(focus.y + sp * allowed + 0.4, this.world.height(desired.x, desired.z) + 0.8),
        focus.z + Math.cos(this.camYaw) * cp * allowed
      );

      if (this.camSnap) {
        this.camera.position.copy(finalPos);
        this.camSnap = false;
      } else {
        this.camera.position.x = U.damp(this.camera.position.x, finalPos.x, 14, dt);
        this.camera.position.y = U.damp(this.camera.position.y, finalPos.y, 10, dt);
        this.camera.position.z = U.damp(this.camera.position.z, finalPos.z, 14, dt);
      }

      // 락온 시 대상과 플레이어 중간을 바라봄
      let look = focus;
      if (p.lockTarget && !p.lockTarget.dead) {
        look = focus.clone().lerp(p.lockTarget.centerPoint(), 0.32);
      }
      this.camera.lookAt(look);

      // 화면 흔들림
      if (this.shakeT > 0) {
        this.shakeT -= dt;
        const k = this.shakePower * U.clamp01(this.shakeT / 0.35);
        this.camera.position.x += U.rand(-k, k) * 0.35;
        this.camera.position.y += U.rand(-k, k) * 0.35;
        this.camera.position.z += U.rand(-k, k) * 0.35;
        if (this.shakeT <= 0) this.shakePower = 0;
      }

      // 질주 시 FOV 확장
      const spd = Math.hypot(p.vel.x, p.vel.z);
      const targetFov = this.baseFov + U.clamp(spd - 6, 0, 6) * 1.6;
      this.camera.fov = U.damp(this.camera.fov, targetFov, 5, dt);
      this.camera.updateProjectionMatrix();
    }

    /* ============================================================
       월드 갱신
       ============================================================ */
    updateWorldEntities(dt) {
      const p = this.player;

      // 적
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const e = this.enemies[i];
        // 거리 컬링 — 멀면 저빈도 갱신
        const d = e.position.distanceTo(p.position);
        if (d > 90 && !e.type.boss) {
          e._skip = (e._skip || 0) + 1;
          if (e._skip % 4 !== 0) continue;
          e.update(dt * 4, p);
        } else {
          e.update(dt, p);
        }
        if (e.destroyed) { e.dispose(); this.enemies.splice(i, 1); }
      }
      // 보스 HUD
      if (this.boss && !this.boss.dead) {
        const inArena = this.boss.position.distanceTo(p.position) < 40;
        this.ui.bossBar(inArena);
        if (inArena) this.ui.updateBoss(this.boss);
        if (this.bossIntroPending && this.boss.position.distanceTo(p.position) < 26) {
          this.bossIntroPending = false;
          Assets.sfx.bossMusic();
          this.cine.play('boss_intro');
        }
      }

      // 리스폰
      if (this.respawnQueue && this.respawnQueue.length) {
        for (let i = this.respawnQueue.length - 1; i >= 0; i--) {
          const r = this.respawnQueue[i];
          r.t -= dt;
          if (r.t <= 0) {
            this.respawnQueue.splice(i, 1);
            if (this.enemies.length < 60) this.spawnFromPlan(r.plan);
          }
        }
      }

      // 투사체
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const pr = this.projectiles[i];
        if (!pr.update(dt) || pr.dead) this.projectiles.splice(i, 1);
      }

      // 지면 위험 지대
      for (let i = this.hazards.length - 1; i >= 0; i--) {
        const h = this.hazards[i];
        h.t -= dt;
        if (h.t <= 0) {
          const pos = new THREE.Vector3(h.x, this.world.height(h.x, h.z), h.z);
          this.vfx.shockwave(pos, h.radius, AB.Combat.ELEM_COLOR[h.element] || 0xff3a2a);
          this.vfx.particles.burst(pos.clone().setY(pos.y + 0.6), {
            color: AB.Combat.ELEM_COLOR[h.element] || 0xff6a3c, count: 30,
            speedMin: 3, speedMax: 12, sizeMin: 0.25, sizeMax: 0.8, lifeMin: 0.4, lifeMax: 1.0, up: 4,
          });
          Assets.sfx.hit(1.3);
          if (Math.hypot(p.position.x - h.x, p.position.z - h.z) < h.radius) {
            this.damagePlayer(h.dmg, null, { element: h.element });
          }
          this.hazards.splice(i, 1);
        }
      }

      // 확산 파동
      for (let i = this.waves.length - 1; i >= 0; i--) {
        const w = this.waves[i];
        w.r += dt * 22;
        w.mesh.scale.setScalar(w.r);
        w.mesh.material.opacity = 0.85 * (1 - w.r / w.maxR);
        const pd = Math.hypot(p.position.x - w.pos.x, p.position.z - w.pos.z);
        if (!w.hit && Math.abs(pd - w.r) < 1.6) {
          w.hit = true;
          this.damagePlayer(w.dmg, null, { element: 'fire', knock: 7 });
        }
        if (w.r >= w.maxR) {
          this.scene.remove(w.mesh);
          w.mesh.geometry.dispose(); w.mesh.material.dispose();
          this.waves.splice(i, 1);
        }
      }

      // 장판 (플레이어 화염 필드)
      for (let i = this.fields.length - 1; i >= 0; i--) {
        const f = this.fields[i];
        f.t -= dt; f.tick -= dt;
        if (f.tick <= 0) {
          f.tick = f.interval;
          for (const e of this.enemies) {
            if (e.dead) continue;
            if (e.position.distanceTo(f.pos) < f.radius + e.type.radius) {
              e.takeDamage(f.dmg * (1 + p.level * 0.08), 'fire', { hitPoint: e.centerPoint() });
            }
          }
          this.vfx.particles.burst(f.pos.clone().setY(f.pos.y + 0.3), {
            color: 0xff6a3c, count: 8, speedMin: 0.5, speedMax: 3,
            sizeMin: 0.25, sizeMax: 0.7, lifeMin: 0.4, lifeMax: 0.9, up: 2, gravity: -1,
            spread: f.radius * 0.6,
          });
        }
        if (f.t <= 0) this.fields.splice(i, 1);
      }

      // 잔상
      for (let i = this.afterimages.length - 1; i >= 0; i--) {
        const a = this.afterimages[i];
        a.t -= dt;
        a.mat.opacity = 0.4 * U.clamp01(a.t / a.max);
        if (a.t <= 0) {
          this.scene.remove(a.g);
          a.g.traverse(o => { if (o.isMesh) o.geometry.dispose(); });
          a.mat.dispose();
          this.afterimages.splice(i, 1);
        }
      }

      // 상호작용 오브젝트
      for (const o of this.interactables) if (!o.used) o.update(dt);
      this.npc.update(dt, p);
    }

    /* ============================================================
       메인 루프
       ============================================================ */
    frame() {
      let dt = Math.min(this.clock.getDelta(), 1 / 20);
      this.rawDt = dt;

      // 히트스톱
      if (this.hitstopT > 0) {
        this.hitstopT -= dt;
        dt *= 0.12;
      }
      this.time += dt;

      const inp = this.input;

      // 전역 키
      if (inp.pressed('questlog') && (this.mode === 'play' || this.mode === 'menu')) {
        this.ui.toggleQuestLog();
      }
      if (inp.pressed('menu')) {
        if (this.cine.active) this.cine.skip();
        else if (this.ui.el.questlog.classList.contains('on')) this.ui.toggleQuestLog();
        else this.togglePause();
      }
      if (this.mode === 'dialogue' && (inp.pressed('interact') || inp.pressed('attack') || inp.pressed('jump'))) {
        this.ui.dialogueNext();
      }
      if (this.cine.active && (inp.pressed('jump') || inp.pressed('interact'))) this.cine.skip();
      if (inp.pressed('char1')) this.swapCharacter(0);
      if (inp.pressed('char2')) this.swapCharacter(1);
      if (inp.pressed('char3')) this.swapCharacter(2);

      if (this.mode !== 'paused') {
        this.world.update(dt, this.camera.position, this.player.position);

        if (this.cine.active) {
          this.player.update(dt, { getMove: () => ({ x: 0, y: 0, mag: 0 }), isDown: () => false, pressed: () => false }, this.camYaw);
          this.updateWorldEntities(dt);
          this.cine.update(dt);
        } else {
          this.player.update(dt, inp, this.camYaw);
          this.updateWorldEntities(dt);
          this.updateInteraction(dt);
          this.updateCamera(dt);
        }

        this.vfx.update(dt, this.camera);
        this.vfx.updateNumbers(dt, this.camera, this.W, this.H);
        this.ui.updateLockMarker(this.camera, this.W, this.H);
        this.ui.drawMinimap(dt);

        // 지역 배너
        const r = this.world.regionAt(this.player.position.x, this.player.position.z);
        const rn = r ? r.name : '황야';
        if (rn !== this.ui.lastRegion) {
          this.ui.lastRegion = rn;
          this.ui.regionBanner(rn);
        }

        // 그림자 카메라를 플레이어에 붙임
        if (this.quality.shadows) {
          this.sun.position.set(this.player.position.x - 45, 70, this.player.position.z - 32);
          this.sun.target.position.copy(this.player.position);
          this.sun.target.updateMatrixWorld();
        }

        // HUD 주기 갱신
        this.hudT = (this.hudT || 0) - dt;
        if (this.hudT <= 0) { this.hudT = 0.12; this.ui.updateStats(); }
      }

      inp.endFrame();
      this.renderer.render(this.scene, this.camera);
    }

    togglePause() {
      if (this.mode === 'play') {
        this.mode = 'paused';
        this.ui.el.menu.classList.add('on');
        if (document.pointerLockElement) document.exitPointerLock();
      } else if (this.mode === 'paused') {
        this.mode = 'play';
        this.ui.el.menu.classList.remove('on');
      }
    }

    /* ============================================================
       UI 바인딩 (타이틀 · 설정 · 모델 로더)
       ============================================================ */
    bindUI() {
      const title = $('title');
      const start = (loadSave) => {
        Assets.sfx.init();
        Assets.sfx.resume();
        Assets.sfx.startMusic();
        title.classList.add('gone');
        document.body.classList.add('playing');
        this.mode = 'play';
        this.camSnap = true;
        if (loadSave) {
          this.load();
          this.ui.toast('이어하기 — 진행 상황을 불러왔습니다');
        } else {
          setTimeout(() => this.cine.play('opening'), 200);
        }
      };
      $('btn-start').addEventListener('click', () => start(false));
      const cont = $('btn-continue');
      if (this.hasSave()) cont.style.display = ''; else cont.style.display = 'none';
      cont.addEventListener('click', () => start(true));

      // 패널 토글
      document.querySelectorAll('[data-panel]').forEach(b => {
        b.addEventListener('click', () => {
          const id = b.dataset.panel;
          document.querySelectorAll('.tpanel').forEach(p => p.classList.toggle('on', p.id === id && !p.classList.contains('on')));
          Assets.sfx.ui();
        });
      });
      document.querySelectorAll('.tpanel .close').forEach(b => {
        b.addEventListener('click', () => b.closest('.tpanel').classList.remove('on'));
      });

      // 메뉴 버튼
      $('menu-resume').addEventListener('click', () => this.togglePause());
      $('menu-title').addEventListener('click', () => location.reload());
      $('menu-log').addEventListener('click', () => { this.togglePause(); this.ui.toggleQuestLog(); });
      $('ql-close').addEventListener('click', () => this.ui.toggleQuestLog());

      // 설정
      const vol = $('set-volume');
      vol.addEventListener('input', () => Assets.sfx.setVolume(parseFloat(vol.value)));
      const sens = $('set-sens');
      sens.addEventListener('input', () => {
        this.input.sensitivity = parseFloat(sens.value);
        this.input.touchSens = parseFloat(sens.value);
      });
      const inv = $('set-invert');
      inv.addEventListener('change', () => { this.input.invertY = inv.checked; });
      const sh = $('set-shadow');
      sh.checked = this.quality.shadows;
      sh.addEventListener('change', () => {
        this.renderer.shadowMap.enabled = sh.checked;
        this.scene.traverse(o => { if (o.isMesh && o.material) o.material.needsUpdate = true; });
      });

      // 모바일 컨트롤 표시
      if (this.input.isTouch) document.body.classList.add('touch');
      $('set-touch').addEventListener('change', (e) => {
        document.body.classList.toggle('touch', e.target.checked);
      });
      $('set-touch').checked = this.input.isTouch;

      this.bindModelPanel();
    }

    /* ---------- 커스텀 PMX 모델 + 의상(스킨) 전환 ---------- */
    bindModelPanel() {
      const drop = $('model-drop');
      const fileInput = $('model-file');
      const status = $('model-status');
      const say = (m) => { if (status) status.textContent = m; };
      if (!drop) return;

      this.outfits = [];          // {name, rig}
      this.activeOutfit = -1;

      const shortName = (res, files) => {
        const zn = [...files].find(f => /\.zip$/i.test(f.name));
        let n = zn ? zn.name.replace(/\.zip$/i, '') : res.picked.split('/').pop().replace(/\.(pmx|pmd)$/i, '');
        return n.length > 18 ? n.slice(0, 17) + '…' : n;
      };

      const renderOutfits = () => {
        const box = $('model-outfits'), list = $('mo-list');
        if (!this.outfits.length) { box.style.display = 'none'; return; }
        box.style.display = '';
        list.innerHTML = '';
        this.outfits.forEach((o, i) => {
          const b = document.createElement('button');
          b.className = 'mo-chip' + (i === this.activeOutfit ? ' on' : '');
          b.textContent = o.name;
          b.addEventListener('click', () => this.switchOutfit(i));
          list.appendChild(b);
        });
      };
      this._renderOutfits = renderOutfits;

      const addFiles = async (files, opts) => {
        opts = opts || {};
        if (!files || !files.length) return;
        try {
          drop.classList.add('busy');
          const res = await AB.MMDChar.loadFromFiles([...files], { onStatus: say });
          say('리그를 구성하는 중…');
          const rig = await AB.MMDChar.makeRig(res.mesh, {
            targetHeight: parseFloat($('model-height').value) || 1.72,
            faceFlip: $('model-flip').checked,
            physics: $('model-physics').checked,
            onStatus: say,
          });
          const name = shortName(res, files);
          this.outfits.push({ name, rig });
          this.switchOutfit(this.outfits.length - 1);
          renderOutfits();
          say(`적용 완료 — ${name}${this.outfits.length > 1 ? ' (의상 ' + this.outfits.length + '벌)' : ''}`);
          if (!opts.fromCache && $('model-cache').checked) {
            await AB.ModelCache.put('outfit-' + (this.outfits.length - 1), [...files]);
            await AB.ModelCache.put('outfit-count', [new File(['' + this.outfits.length], 'n.txt')]);
          }
          $('model-clear').style.display = '';
        } catch (e) {
          console.error(e);
          say('실패: ' + (e.message || e));
        } finally {
          drop.classList.remove('busy');
        }
      };
      this._addOutfitFiles = addFiles;

      drop.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', () => addFiles(fileInput.files));
      ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, (e) => {
        e.preventDefault(); drop.classList.add('over');
      }));
      ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, (e) => {
        e.preventDefault(); drop.classList.remove('over');
      }));
      drop.addEventListener('drop', (e) => addFiles(e.dataTransfer.files));

      // 전용 무기 토글
      $('model-signature').addEventListener('change', (e) => {
        this.setSignatureWeapon(e.target.checked);
      });

      $('model-clear').addEventListener('click', async () => {
        await AB.ModelCache.clear();
        this.removeCustomRig();
        this.outfits = [];
        this.activeOutfit = -1;
        renderOutfits();
        say('기본(절차 생성) 모델로 되돌렸습니다.');
        $('model-clear').style.display = 'none';
      });

      // 캐시된 의상 자동 로드 (구버전 'main' 키도 지원)
      (async () => {
        const nFile = await AB.ModelCache.get('outfit-count');
        let count = 0;
        if (nFile && nFile[0]) count = parseInt(await nFile[0].text()) || 0;
        if (!count) {
          const legacy = await AB.ModelCache.get('main');
          if (legacy && legacy.length) {
            say('저장된 모델 불러오는 중…');
            $('model-clear').style.display = '';
            await addFiles(legacy, { fromCache: true });
          }
          return;
        }
        say(`저장된 의상 ${count}벌 불러오는 중…`);
        $('model-clear').style.display = '';
        for (let i = 0; i < count; i++) {
          const files = await AB.ModelCache.get('outfit-' + i);
          if (files && files.length) await addFiles(files, { fromCache: true });
        }
      })();
    }

    /** 등록된 의상으로 갈아입기 */
    switchOutfit(i) {
      const o = this.outfits[i];
      if (!o) return;
      this.activeOutfit = i;
      this.applyCustomRig(o.rig);
      if (this._renderOutfits) this._renderOutfits();
      this.ui.toast('의상 변경 — ' + o.name);
    }

    /** 전용 무기 토글 (재장착) */
    setSignatureWeapon(on) {
      this.signatureWeapon = on;
      // 리그의 손에 붙은 기존 무기 제거 후 재구성
      const shared = this.customRig;
      if (shared && shared.weapon && shared.weapon.parent) shared.weapon.parent.remove(shared.weapon);
      if (shared) shared.weapon = null;
      for (const k in this.player.rigs) {
        const e = this.player.rigs[k];
        if (e.weapon && e.weapon.parent && !e.shared) e.weapon.parent.remove(e.weapon);
      }
      this.player.rigs = {};
      this.player.setCharacter(this.player.charIndex, true);
      this.ui.toast(on ? '전용 무기 「빙화 낙월」 장착' : '기본 무기로 복귀');
    }

    applyCustomRig(rig) {
      // 다른 커스텀 리그가 붙어 있으면 화면에서만 숨김 (dispose 하지 않음 — 재사용 위함)
      if (this.customRig && this.customRig !== rig && this.customRig.root.parent) {
        this.customRig.root.parent.remove(this.customRig.root);
      }
      this.customRig = rig;
      for (const k in this.player.rigs) {
        const e = this.player.rigs[k];
        if (e.rig.root.parent) e.rig.root.parent.remove(e.rig.root);
      }
      this.player.rigs = {};
      if (!rig.root.parent) this.player.root.add(rig.root);
      this.player.setCharacter(this.player.charIndex, true);
    }

    removeCustomRig() {
      if (!this.customRig) return;
      if (this.customRig.root.parent) this.customRig.root.parent.remove(this.customRig.root);
      // 등록된 모든 의상 리그 제거
      for (const o of (this.outfits || [])) {
        if (o.rig && o.rig.root.parent) o.rig.root.parent.remove(o.rig.root);
      }
      this.customRig = null;
      for (const k in this.player.rigs) {
        const e = this.player.rigs[k];
        if (e.rig.root.parent) e.rig.root.parent.remove(e.rig.root);
      }
      this.player.rigs = {};
      this.player.setCharacter(this.player.charIndex, true);
    }
  }

  AB.Game = Game;

  window.addEventListener('DOMContentLoaded', async () => {
    if (typeof THREE === 'undefined') {
      document.getElementById('boot-error').style.display = 'block';
      return;
    }
    try {
      const g = new Game();
      global.GAME = g;
      await g.init();
      document.getElementById('loading').classList.add('gone');
    } catch (e) {
      console.error(e);
      const be = document.getElementById('boot-error');
      be.style.display = 'block';
      be.querySelector('code').textContent = e.message + '\n' + (e.stack || '');
    }
  });
})(window);
