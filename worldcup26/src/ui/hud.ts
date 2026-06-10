import { Match } from '../sim/match';
import type { GameSession, MatchResult } from '../game';

/** DOM-based match overlay: scoreboard, power gauge, banners, pause, full-time */
export class HUD {
  private root: HTMLElement;
  private el: HTMLElement;
  private scoreEl: HTMLElement;
  private clockEl: HTMLElement;
  private powerWrap: HTMLElement;
  private powerBar: HTMLElement;
  private bannerEl: HTMLElement;
  private nameEl: HTMLElement;
  private replayEl: HTMLElement;
  private pauseEl: HTMLElement | null = null;
  private ftEl: HTMLElement | null = null;
  private shootoutEl: HTMLElement;
  private bannerTimer = 0;
  private _gaugeLinger = 0;
  private _gaugeLast = 0;
  onQuit: (() => void) | null = null;
  onRestart: (() => void) | null = null;

  constructor(root: HTMLElement, private match: Match, private session: GameSession) {
    this.root = root;
    this.el = document.createElement('div');
    this.el.className = 'hud';
    const h = this.match.sides[0].team.meta;
    const a = this.match.sides[1].team.meta;
    this.el.innerHTML = `
      <div class="scoreboard">
        <span class="sb-flag">${h.flag}</span>
        <span class="sb-team" style="border-bottom: 3px solid ${h.home.shirt}">${h.code}</span>
        <span class="sb-score">0 - 0</span>
        <span class="sb-team" style="border-bottom: 3px solid ${a.away.shirt}">${a.code}</span>
        <span class="sb-flag">${a.flag}</span>
        <span class="sb-clock">00:00</span>
      </div>
      <div class="player-name"></div>
      <div class="power-wrap hidden"><div class="power-bar"></div></div>
      <div class="banner hidden"></div>
      <div class="replay-tag hidden">● REPLAY</div>
      <div class="shootout-board hidden"></div>
      <div class="controls-hint">Arrows move · S pass · D lob · T through · A shoot (hold) · W slide · E switch · R replay · Esc pause</div>
    `;
    root.appendChild(this.el);
    this.scoreEl = this.el.querySelector('.sb-score')!;
    this.clockEl = this.el.querySelector('.sb-clock')!;
    this.powerWrap = this.el.querySelector('.power-wrap')!;
    this.powerBar = this.el.querySelector('.power-bar')!;
    this.bannerEl = this.el.querySelector('.banner')!;
    this.nameEl = this.el.querySelector('.player-name')!;
    this.replayEl = this.el.querySelector('.replay-tag')!;
    this.shootoutEl = this.el.querySelector('.shootout-board')!;
  }

  update(dt: number): void {
    const m = this.match;
    this.scoreEl.textContent = `${m.sides[0].score} - ${m.sides[1].score}`;
    this.clockEl.textContent = m.shootout ? 'PENS' : m.clockDisplay;

    // power gauge (lingers briefly after release so quick taps are visible)
    const u = this.session.users[0] ?? this.session.users[1];
    if (u && u.charging) {
      this._gaugeLinger = 0.55;
      this._gaugeLast = u.shotCharge;
    } else {
      this._gaugeLinger -= dt;
    }
    if (this._gaugeLinger > 0) {
      const v = u && u.charging ? u.shotCharge : this._gaugeLast;
      this.powerWrap.classList.remove('hidden');
      this.powerBar.style.width = `${Math.round(v * 100)}%`;
      this.powerBar.style.background = v > 0.8 ? '#ff5252' : v > 0.5 ? '#ffb300' : '#7cf26a';
      this.powerWrap.style.opacity = u && u.charging ? '1' : '0.6';
    } else {
      this.powerWrap.classList.add('hidden');
    }

    // controlled player name
    if (u?.controlled) {
      this.nameEl.textContent = `${u.controlled.data.no} ${u.controlled.data.name}`;
    } else this.nameEl.textContent = '';

    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
      if (this.bannerTimer <= 0) this.bannerEl.classList.add('hidden');
    }

    // half-time interstitial
    if (m.phase === 'half-end' && !this._breakShown) {
      this._breakShown = true;
      this.showBreak();
    }
    if (m.phase !== 'half-end') this._breakShown = false;

    // shootout board
    if (m.shootout && !m.shootoutDone) {
      this.shootoutEl.classList.remove('hidden');
      const fmt = (arr: number[], n: number) => {
        let s = '';
        for (let i = 0; i < Math.max(5, n); i++) s += arr[i] === undefined ? '○' : arr[i] ? '<b class="pg">●</b>' : '<b class="pm">✕</b>';
        return s;
      };
      const a = m.shootoutScores[0], b = m.shootoutScores[1];
      this.shootoutEl.innerHTML =
        `<div>${m.sides[0].team.meta.code} ${fmt(a, a.length)}</div><div>${m.sides[1].team.meta.code} ${fmt(b, b.length)}</div>`;
    } else {
      this.shootoutEl.classList.add('hidden');
    }
  }

  private _breakShown = false;

  banner(text: string): void {
    this.bannerEl.textContent = text;
    this.bannerEl.classList.remove('hidden');
    this.bannerTimer = 2.6;
  }

  setReplay(on: boolean): void {
    this.replayEl.classList.toggle('hidden', !on);
  }

  private showBreak(): void {
    const m = this.match;
    const ov = document.createElement('div');
    ov.className = 'overlay';
    const stats = (i: number) => m.sides[i].stats;
    const poss = stats(0).possession + stats(1).possession || 1;
    ov.innerHTML = `
      <div class="panel">
        <h2>${m.half === 2 ? 'HALF TIME' : m.half >= 3 ? 'EXTRA TIME' : 'BREAK'}</h2>
        <div class="ht-score">${m.sides[0].team.meta.flag} ${m.sides[0].team.meta.name} <b>${m.sides[0].score} - ${m.sides[1].score}</b> ${m.sides[1].team.meta.name} ${m.sides[1].team.meta.flag}</div>
        <table class="stats-table">
          <tr><td>${Math.round((stats(0).possession / poss) * 100)}%</td><th>Possession</th><td>${Math.round((stats(1).possession / poss) * 100)}%</td></tr>
          <tr><td>${stats(0).shots}</td><th>Shots</th><td>${stats(1).shots}</td></tr>
          <tr><td>${stats(0).fouls}</td><th>Fouls</th><td>${stats(1).fouls}</td></tr>
          <tr><td>${stats(0).corners}</td><th>Corners</th><td>${stats(1).corners}</td></tr>
          <tr><td>${stats(0).offsides}</td><th>Offsides</th><td>${stats(1).offsides}</td></tr>
        </table>
        <button class="btn primary">Continue</button>
      </div>`;
    this.root.appendChild(ov);
    ov.querySelector('button')!.addEventListener('click', () => {
      ov.remove();
      m.resumeFromBreak();
    });
  }

  showFullTime(r: MatchResult): void {
    const m = this.match;
    if (this.ftEl) return;
    const ov = document.createElement('div');
    this.ftEl = ov;
    ov.className = 'overlay';
    const goalsList = (team: number) => r.scorers.filter((s) => s.team === team).map((s) => `<div>${s.name} ${s.minute}'</div>`).join('');
    const pens = r.penScores ? `<div class="pens">(${r.penScores[0]} - ${r.penScores[1]} on penalties)</div>` : '';
    ov.innerHTML = `
      <div class="panel">
        <h2>FULL TIME</h2>
        <div class="ht-score">${m.sides[0].team.meta.flag} ${m.sides[0].team.meta.name} <b>${r.scores[0]} - ${r.scores[1]}</b> ${m.sides[1].team.meta.name} ${m.sides[1].team.meta.flag}</div>
        ${pens}
        <div class="scorers-cols"><div>${goalsList(0)}</div><div>${goalsList(1)}</div></div>
        <button class="btn primary">Continue</button>
      </div>`;
    this.root.appendChild(ov);
    ov.querySelector('button')!.addEventListener('click', () => {
      ov.remove();
      if (this.onQuit) this.onQuit();
    });
  }

  togglePause(): void {
    if (this.pauseEl) {
      this.pauseEl.remove();
      this.pauseEl = null;
      this.session.paused = false;
      return;
    }
    this.session.paused = true;
    const ov = document.createElement('div');
    this.pauseEl = ov;
    ov.className = 'overlay';
    ov.innerHTML = `
      <div class="panel">
        <h2>PAUSED</h2>
        <button class="btn primary" data-act="resume">Resume</button>
        <button class="btn" data-act="restart">Restart Match</button>
        <button class="btn" data-act="lighting">Lighting: <span id="lit-cur">${this.session.scene.preset}</span></button>
        <button class="btn danger" data-act="quit">Quit to Menu</button>
      </div>`;
    this.root.appendChild(ov);
    ov.addEventListener('click', (e) => {
      const act = (e.target as HTMLElement).closest('button')?.dataset.act;
      if (act === 'resume') this.togglePause();
      else if (act === 'restart') { this.togglePause(); this.onRestart?.(); }
      else if (act === 'quit') { this.togglePause(); this.onQuit?.(); }
      else if (act === 'lighting') {
        const order = ['day', 'dusk', 'night'] as const;
        const cur = this.session.scene.preset;
        const next = order[(order.indexOf(cur) + 1) % 3];
        this.session.setLighting(next);
        ov.querySelector('#lit-cur')!.textContent = next;
      }
    });
  }

  dispose(): void {
    this.el.remove();
    this.pauseEl?.remove();
    this.ftEl?.remove();
    this.root.querySelectorAll('.overlay').forEach((o) => o.remove());
  }
}
