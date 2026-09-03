/* ============================================================
   AETHER BLADE  —  ui.js
   HUD · 미니맵 · 대화창 · 퀘스트 로그 · 토스트
   ============================================================ */
(function (global) {
  'use strict';
  const AB = global.AB, U = AB.U, Assets = AB.Assets;
  const $ = (id) => document.getElementById(id);

  class UI {
    constructor(game) {
      this.game = game;
      this.el = {
        hud: $('hud'),
        hpFill: $('hp-fill'), hpText: $('hp-text'),
        stamFill: $('stam-fill'),
        xpFill: $('xp-fill'), lvText: $('lv-text'),
        party: $('party'),
        skillBtn: $('btn-skill'), skillCd: $('skill-cd'), skillName: $('skill-name'),
        ultBtn: $('btn-ult'), ultFill: $('ult-fill'), ultName: $('ult-name'),
        potionCount: $('potion-count'),
        combo: $('combo-pips'),
        region: $('region-name'),
        quest: $('quest-tracker'),
        questTitle: $('qt-title'), questObjs: $('qt-objs'),
        bossBar: $('boss-bar'), bossName: $('bb-name'), bossFill: $('bb-fill'), bossPhase: $('bb-phase'),
        toast: $('toast-layer'),
        dialogue: $('dialogue'), dlgName: $('dlg-name'), dlgText: $('dlg-text'), dlgPortrait: $('dlg-portrait'),
        questlog: $('questlog'), qlBody: $('ql-body'),
        ultFlash: $('ult-flash'), ultFlashName: $('uf-name'), ultFlashSkill: $('uf-skill'),
        hurtVig: $('hurt-vig'),
        death: $('death-screen'),
        lockMark: $('lock-marker'),
        minimap: $('minimap'),
        interact: $('interact-prompt'), interactText: $('ip-text'),
        menu: $('menu'),
      };
      this.mmCtx = this.el.minimap ? this.el.minimap.getContext('2d') : null;
      this.mmT = 0;
      this.dlgQueue = null;
      this.dlgIndex = 0;
      this.dlgDone = null;
      this._v = new THREE.Vector3();
      this.lastRegion = null;

      if (this.el.dialogue) {
        this.el.dialogue.addEventListener('click', () => this.dialogueNext());
      }
    }

    /* ---------- 스탯 HUD ---------- */
    updateStats() {
      const p = this.game.player;
      if (!p) return;
      const s = p.stats;
      const hpR = U.clamp01(p.hp / s.hp);
      if (this.el.hpFill) this.el.hpFill.style.width = (hpR * 100).toFixed(1) + '%';
      if (this.el.hpText) this.el.hpText.textContent = `${Math.ceil(Math.max(0, p.hp))} / ${s.hp}`;
      if (this.el.hpFill) this.el.hpFill.classList.toggle('low', hpR < 0.3);
      if (this.el.stamFill) this.el.stamFill.style.width = (p.stamina / p.staminaMax * 100).toFixed(1) + '%';
      if (this.el.xpFill) this.el.xpFill.style.width = (p.xp / p.xpNext * 100).toFixed(1) + '%';
      if (this.el.lvText) this.el.lvText.textContent = 'Lv.' + p.level;
      if (this.el.potionCount) this.el.potionCount.textContent = this.game.inventory.potions;

      // 스킬 쿨다운
      const cdR = p.skillCd > 0 ? p.skillCd / p.def.skill.cd : 0;
      if (this.el.skillCd) {
        this.el.skillCd.style.height = (cdR * 100).toFixed(1) + '%';
        this.el.skillBtn.classList.toggle('ready', cdR <= 0);
        this.el.skillBtn.dataset.cd = cdR > 0 ? p.skillCd.toFixed(1) : '';
      }
      const eR = p.energy / p.energyMax;
      if (this.el.ultFill) {
        this.el.ultFill.style.height = (eR * 100).toFixed(1) + '%';
        this.el.ultBtn.classList.toggle('ready', eR >= 1);
      }
    }

    updateParty() {
      const g = this.game;
      if (!this.el.party || !g.player) return;
      this.el.party.innerHTML = '';
      g.roster.forEach((c, i) => {
        const d = document.createElement('div');
        d.className = 'pslot' + (i === g.player.charIndex ? ' active' : '');
        d.style.setProperty('--el', AB.ELEMENTS[c.element].css);
        d.innerHTML = `
          <img src="${g.portraits[c.id]}" alt="${c.name}">
          <span class="pkey">${i + 1}</span>
          <span class="pname">${c.name}</span>
          <span class="pel"></span>`;
        d.addEventListener('click', () => { g.swapCharacter(i); });
        this.el.party.appendChild(d);
      });
      const p = g.player;
      if (this.el.skillName) this.el.skillName.textContent = p.def.skill.name;
      if (this.el.ultName) this.el.ultName.textContent = p.def.ult.name;
      const css = AB.ELEMENTS[p.def.element].css;
      document.documentElement.style.setProperty('--elem', css);
    }

    /* ---------- 퀘스트 ---------- */
    updateQuest() {
      const q = this.game.quests;
      if (!this.el.quest) return;
      const cur = q.current;
      if (!cur) {
        this.el.questTitle.textContent = '모든 임무 완료';
        this.el.questObjs.innerHTML = '<li class="done">균열은 닫혔다.</li>';
        return;
      }
      this.el.questTitle.textContent = cur.title;
      if (q.state === 'available') {
        this.el.questObjs.innerHTML = `<li class="pending">엘라라에게 말을 건다</li>`;
      } else if (q.state === 'complete') {
        this.el.questObjs.innerHTML = `<li class="done">엘라라에게 보고한다</li>`;
      } else {
        this.el.questObjs.innerHTML = cur.objectives.map((o, i) => {
          const n = q.progress[i] || 0, m = o.count || 1;
          const done = n >= m;
          return `<li class="${done ? 'done' : ''}">${o.desc} <b>${n}/${m}</b></li>`;
        }).join('');
      }
    }

    objectiveFlash() {
      if (!this.el.quest) return;
      this.el.quest.classList.remove('flash');
      void this.el.quest.offsetWidth;
      this.el.quest.classList.add('flash');
    }

    toggleQuestLog() {
      const el = this.el.questlog;
      if (!el) return;
      const on = el.classList.toggle('on');
      if (on) this.renderQuestLog();
      Assets.sfx.ui();
      return on;
    }

    renderQuestLog() {
      const q = this.game.quests;
      const rows = AB.QUESTS.map((quest, i) => {
        let st = '미개방', cls = 'locked';
        if (q.finished.includes(quest.id)) { st = '완료'; cls = 'done'; }
        else if (i === q.index) { st = q.state === 'complete' ? '보고 대기' : q.state === 'active' ? '진행 중' : '수락 가능'; cls = 'active'; }
        const objs = (i === q.index && q.state === 'active')
          ? '<ul>' + quest.objectives.map((o, k) => `<li>${o.desc} ${q.progress[k] || 0}/${o.count || 1}</li>`).join('') + '</ul>'
          : '';
        return `<div class="qrow ${cls}">
          <div class="qrow-h"><b>${quest.title}</b><span>${st}</span></div>
          <p>${quest.summary}</p>${objs}
          <small>보상 ${quest.rewards.xp} EXP · 회복약 ${quest.rewards.potion}</small>
        </div>`;
      }).join('');
      const p = this.game.player;
      this.el.qlBody.innerHTML = `
        <div class="ql-side">
          <h3>${p.def.name} <small>${p.def.title}</small></h3>
          <p class="ql-desc">${p.def.desc}</p>
          <dl>
            <dt>레벨</dt><dd>${p.level} (${Math.floor(p.xp)}/${p.xpNext})</dd>
            <dt>속성</dt><dd style="color:${AB.ELEMENTS[p.def.element].css}">${AB.ELEMENTS[p.def.element].name}</dd>
            <dt>공격력</dt><dd>${Math.round(p.stats.atk)}</dd>
            <dt>방어력</dt><dd>${Math.round(p.stats.def)}</dd>
            <dt>치명타</dt><dd>${(p.stats.crit * 100).toFixed(0)}% / ${(p.stats.critDmg * 100).toFixed(0)}%</dd>
            <dt>처치</dt><dd>${this.game.kills}</dd>
          </dl>
          <h4>원소 스킬 · ${p.def.skill.name}</h4><p>${p.def.skill.desc}</p>
          <h4>궁극기 · ${p.def.ult.name}</h4><p>${p.def.ult.desc}</p>
          <h4>원소 반응</h4>
          <p class="rx"><b style="color:#ff8a4a">융해</b> 빙결+염화 ×2.0 · <b style="color:#9ad8ff">초전도</b> 빙결+뇌전 방어↓ · <b style="color:#ff5ac0">과부하</b> 염화+뇌전 폭발</p>
        </div>
        <div class="ql-main">${rows}</div>`;
    }

    /* ---------- 토스트 / 배너 ---------- */
    toast(msg, cls) {
      if (!this.el.toast) return;
      const d = document.createElement('div');
      d.className = 'toast ' + (cls || '');
      d.textContent = msg;
      this.el.toast.appendChild(d);
      setTimeout(() => d.classList.add('out'), 2200);
      setTimeout(() => d.remove(), 2900);
    }
    questToast(kind, title) {
      if (!this.el.toast) return;
      const d = document.createElement('div');
      d.className = 'toast quest';
      d.innerHTML = `<span>${kind}</span><b>${title}</b>`;
      this.el.toast.appendChild(d);
      setTimeout(() => d.classList.add('out'), 3200);
      setTimeout(() => d.remove(), 3900);
    }
    reactionToast(name) {
      if (!this.el.toast) return;
      const d = document.createElement('div');
      d.className = 'toast reaction';
      d.textContent = name;
      this.el.toast.appendChild(d);
      setTimeout(() => d.classList.add('out'), 900);
      setTimeout(() => d.remove(), 1500);
    }
    levelUp(lv) {
      this.questToast('레벨 업', `Lv.${lv} 달성`);
    }
    regionBanner(name) {
      if (!this.el.region) return;
      this.el.region.textContent = name;
      this.el.region.classList.remove('on');
      void this.el.region.offsetWidth;
      this.el.region.classList.add('on');
    }
    ultFlash(color, name, skill) {
      const el = this.el.ultFlash;
      if (!el) return;
      el.style.setProperty('--uc', color);
      this.el.ultFlashName.textContent = name;
      this.el.ultFlashSkill.textContent = skill;
      el.classList.remove('on');
      void el.offsetWidth;
      el.classList.add('on');
      setTimeout(() => el.classList.remove('on'), 1700);
    }
    hurtFlash() {
      const el = this.el.hurtVig;
      if (!el) return;
      el.classList.remove('on');
      void el.offsetWidth;
      el.classList.add('on');
    }
    comboPip(i, total) {
      if (!this.el.combo) return;
      let html = '';
      for (let k = 0; k < total; k++) html += `<i class="${k < i ? 'on' : ''}"></i>`;
      this.el.combo.innerHTML = html;
      this.el.combo.classList.add('on');
      clearTimeout(this._comboT);
      this._comboT = setTimeout(() => this.el.combo.classList.remove('on'), 1100);
    }

    /* ---------- 보스 ---------- */
    bossBar(show) {
      if (!this.el.bossBar) return;
      this.el.bossBar.classList.toggle('on', !!show);
    }
    updateBoss(boss) {
      if (!this.el.bossBar || !boss) return;
      this.el.bossName.textContent = boss.type.name;
      this.el.bossFill.style.width = (U.clamp01(boss.hp / boss.maxHp) * 100).toFixed(1) + '%';
      this.el.bossPhase.textContent = `PHASE ${boss.phase}`;
    }

    /* ---------- 락온 마커 ---------- */
    setLockTarget(t) {
      this.lockT = t;
      if (this.el.lockMark) this.el.lockMark.style.display = t ? 'block' : 'none';
    }
    updateLockMarker(camera, w, h) {
      if (!this.lockT || !this.el.lockMark) return;
      if (this.lockT.dead) { this.setLockTarget(null); return; }
      this._v.copy(this.lockT.centerPoint()).project(camera);
      if (this._v.z > 1) { this.el.lockMark.style.display = 'none'; return; }
      this.el.lockMark.style.display = 'block';
      this.el.lockMark.style.transform =
        `translate(-50%,-50%) translate(${((this._v.x * 0.5 + 0.5) * w).toFixed(0)}px, ${((-this._v.y * 0.5 + 0.5) * h).toFixed(0)}px)`;
    }

    /* ---------- 상호작용 프롬프트 ---------- */
    showInteract(text) {
      if (!this.el.interact) return;
      this.el.interact.classList.add('on');
      this.el.interactText.textContent = text;
    }
    hideInteract() {
      if (this.el.interact) this.el.interact.classList.remove('on');
    }

    /* ---------- 대화 ---------- */
    dialogue(lines, onDone) {
      this.dlgQueue = lines.slice();
      this.dlgIndex = 0;
      this.dlgDone = onDone || null;
      this.game.mode = 'dialogue';
      this.el.dialogue.classList.add('on');
      this.renderDialogue();
    }
    renderDialogue() {
      const l = this.dlgQueue[this.dlgIndex];
      if (!l) return;
      this.el.dlgName.textContent = l.who;
      const char = this.game.roster.find(c => c.name === l.who);
      if (this.el.dlgPortrait) {
        if (char) {
          this.el.dlgPortrait.src = this.game.portraits[char.id];
          this.el.dlgPortrait.style.display = 'block';
        } else this.el.dlgPortrait.style.display = 'none';
      }
      // 타이핑 연출
      const text = l.text;
      this.el.dlgText.textContent = '';
      clearInterval(this._typeIv);
      let i = 0;
      this.typing = true;
      this._typeIv = setInterval(() => {
        i += 2;
        this.el.dlgText.textContent = text.slice(0, i);
        if (i >= text.length) { clearInterval(this._typeIv); this.typing = false; }
      }, 18);
    }
    dialogueNext() {
      if (this.game.mode !== 'dialogue') return;
      if (this.typing) {
        clearInterval(this._typeIv);
        this.el.dlgText.textContent = this.dlgQueue[this.dlgIndex].text;
        this.typing = false;
        return;
      }
      this.dlgIndex++;
      if (this.dlgIndex >= this.dlgQueue.length) {
        this.el.dialogue.classList.remove('on');
        this.game.mode = 'play';
        const cb = this.dlgDone; this.dlgDone = null;
        if (cb) cb();
      } else {
        Assets.sfx.ui();
        this.renderDialogue();
      }
    }

    /* ---------- 사망 ---------- */
    showDeath(on) {
      if (this.el.death) this.el.death.classList.toggle('on', !!on);
    }

    /* ---------- 미니맵 ---------- */
    drawMinimap(dt) {
      if (!this.mmCtx) return;
      this.mmT -= dt;
      if (this.mmT > 0) return;
      this.mmT = 0.1;
      const g = this.game, ctx = this.mmCtx;
      const S = this.el.minimap.width;
      const R = g.world.WORLD_R;
      const k = (S * 0.5) / R;
      const cx = S / 2, cy = S / 2;

      ctx.clearRect(0, 0, S, S);
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, S / 2 - 1, 0, U.TAU); ctx.clip();
      ctx.fillStyle = 'rgba(12,14,22,0.82)';
      ctx.fillRect(0, 0, S, S);

      // 지역
      for (const r of g.world.REGIONS) {
        ctx.beginPath();
        ctx.arc(cx + r.x * k, cy + r.z * k, r.r * k, 0, U.TAU);
        ctx.fillStyle = r.css + '22';
        ctx.fill();
        ctx.strokeStyle = r.css + '55';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      // 호수
      const L = g.world.LAKE;
      ctx.beginPath();
      ctx.arc(cx + L.x * k, cy + L.z * k, L.r * k, 0, U.TAU);
      ctx.fillStyle = 'rgba(60,140,180,0.45)';
      ctx.fill();

      // 적
      for (const e of g.enemies) {
        if (e.dead) continue;
        ctx.beginPath();
        ctx.arc(cx + e.position.x * k, cy + e.position.z * k, e.type.boss ? 4 : 2, 0, U.TAU);
        ctx.fillStyle = e.type.boss ? '#ff3a2a' : e.type.elite ? '#ffb03a' : '#e0483a';
        ctx.fill();
      }
      // 상호작용
      for (const o of g.interactables) {
        if (o.used) continue;
        ctx.beginPath();
        ctx.arc(cx + o.position.x * k, cy + o.position.z * k, 3, 0, U.TAU);
        ctx.fillStyle = '#7fffa0';
        ctx.fill();
      }
      // NPC
      if (g.npc) {
        ctx.beginPath();
        ctx.arc(cx + g.npc.position.x * k, cy + g.npc.position.z * k, 3.4, 0, U.TAU);
        ctx.fillStyle = '#ffd98a';
        ctx.fill();
      }
      // 플레이어 (화살표)
      const p = g.player.position;
      const px = cx + p.x * k, py = cy + p.z * k;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(-g.player.yaw + Math.PI);
      ctx.beginPath();
      ctx.moveTo(0, -6); ctx.lineTo(4.2, 5); ctx.lineTo(0, 2.6); ctx.lineTo(-4.2, 5);
      ctx.closePath();
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.restore();

      // 시야각
      ctx.beginPath();
      ctx.moveTo(px, py);
      const a0 = -g.camYaw + Math.PI / 2;
      ctx.arc(px, py, 22, a0 - 0.5, a0 + 0.5);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      ctx.fill();

      ctx.restore();
      ctx.beginPath();
      ctx.arc(cx, cy, S / 2 - 1, 0, U.TAU);
      ctx.strokeStyle = 'rgba(255,220,170,0.35)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  AB.UI = UI;
})(window);
