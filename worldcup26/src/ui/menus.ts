import { allTeams, getTeam, type Team } from '../data/roster';
import type { Difficulty } from '../sim/const';
import type { LightingPreset } from '../render/scene';
import { Tournament, type Fixture } from './tournament';
import { GROUPS } from '../data/teams';

export interface Settings {
  difficulty: Difficulty;
  halfMinutes: number;
  lighting: LightingPreset;
  sound: boolean;
}

export const defaultSettings = (): Settings => ({
  difficulty: 'pro',
  halfMinutes: 3,
  lighting: 'day',
  sound: true,
});

export function loadSettings(): Settings {
  try {
    const s = localStorage.getItem('wc26-settings');
    if (s) return { ...defaultSettings(), ...JSON.parse(s) };
  } catch { /* ignore */ }
  return defaultSettings();
}

export function saveSettings(s: Settings): void {
  try { localStorage.setItem('wc26-settings', JSON.stringify(s)); } catch { /* ignore */ }
}

export interface MenuCallbacks {
  onQuickMatch(home: Team, away: Team): void;
  onTournamentMatch(t: Tournament, fixture: Fixture, userIsHome: boolean): void;
  onPenalties(home: Team, away: Team): void;
  settings: Settings;
}

const stars = (s: number) => {
  const n = Math.round(((s - 66) / 24) * 10) / 2;
  const full = Math.floor(Math.max(0.5, Math.min(5, n)));
  const half = n - full >= 0.5;
  return '★'.repeat(full) + (half ? '½' : '');
};

/** screen manager for everything outside a live match */
export class Menus {
  private root: HTMLElement;
  tournament: Tournament | null = null;

  constructor(root: HTMLElement, private cb: MenuCallbacks) {
    this.root = root;
    this.tournament = Tournament.load();
    if (this.tournament && !this.tournament.userTeam) this.tournament = null;
  }

  private screen(html: string): HTMLElement {
    this.root.innerHTML = '';
    const el = document.createElement('div');
    el.className = 'menu-screen';
    el.innerHTML = html;
    this.root.appendChild(el);
    return el;
  }

  clear(): void { this.root.innerHTML = ''; }

  // ----------------------------------------------------------- main menu

  showMain(): void {
    const s = this.cb.settings;
    const resume = this.tournament && !this.tournament.champion;
    const el = this.screen(`
      <div class="title-wrap">
        <div class="title-badge">CANADA · MEXICO · UNITED STATES</div>
        <h1 class="game-title">WORLD CUP <span>26</span></h1>
        <div class="subtitle">48 nations · real squads · one trophy</div>
      </div>
      <div class="menu-buttons">
        <button class="btn big primary" data-act="quick">⚽ Quick Match</button>
        <button class="btn big" data-act="cup">🏆 ${resume ? 'Continue World Cup' : 'World Cup Tournament'}</button>
        ${resume ? '<button class="btn" data-act="newcup">Start New Tournament</button>' : ''}
        <button class="btn big" data-act="pens">🥅 Penalty Shootout</button>
      </div>
      <div class="settings-row">
        <label>Difficulty
          <select id="set-diff">
            <option value="amateur" ${s.difficulty === 'amateur' ? 'selected' : ''}>Amateur</option>
            <option value="pro" ${s.difficulty === 'pro' ? 'selected' : ''}>Pro</option>
            <option value="world-class" ${s.difficulty === 'world-class' ? 'selected' : ''}>World Class</option>
          </select></label>
        <label>Half length
          <select id="set-half">
            <option value="3" ${s.halfMinutes === 3 ? 'selected' : ''}>3 min</option>
            <option value="5" ${s.halfMinutes === 5 ? 'selected' : ''}>5 min</option>
            <option value="10" ${s.halfMinutes === 10 ? 'selected' : ''}>10 min</option>
          </select></label>
        <label>Lighting
          <select id="set-light">
            <option value="day" ${s.lighting === 'day' ? 'selected' : ''}>Day</option>
            <option value="dusk" ${s.lighting === 'dusk' ? 'selected' : ''}>Dusk</option>
            <option value="night" ${s.lighting === 'night' ? 'selected' : ''}>Night</option>
          </select></label>
        <label>Sound
          <select id="set-sound">
            <option value="on" ${s.sound ? 'selected' : ''}>On</option>
            <option value="off" ${!s.sound ? 'selected' : ''}>Off</option>
          </select></label>
      </div>
      <div class="footer-note">Keyboard: arrows + A/S/D/W/E · Gamepad supported · Unofficial fan game, no FIFA/EA affiliation</div>
    `);
    const upd = () => {
      s.difficulty = (el.querySelector('#set-diff') as HTMLSelectElement).value as Difficulty;
      s.halfMinutes = Number((el.querySelector('#set-half') as HTMLSelectElement).value);
      s.lighting = (el.querySelector('#set-light') as HTMLSelectElement).value as LightingPreset;
      s.sound = (el.querySelector('#set-sound') as HTMLSelectElement).value === 'on';
      saveSettings(s);
    };
    el.querySelectorAll('select').forEach((sel) => sel.addEventListener('change', upd));
    el.addEventListener('click', (e) => {
      const act = (e.target as HTMLElement).closest('button')?.dataset.act;
      if (act === 'quick') this.showTeamSelect('quick');
      else if (act === 'pens') this.showTeamSelect('pens');
      else if (act === 'cup') {
        if (this.tournament && !this.tournament.champion) this.showTournamentHub();
        else this.showTeamSelect('cup');
      } else if (act === 'newcup') {
        Tournament.clear();
        this.tournament = null;
        this.showTeamSelect('cup');
      }
    });
  }

  // ----------------------------------------------------------- team select

  showTeamSelect(mode: 'quick' | 'pens' | 'cup'): void {
    const teams = allTeams();
    let picked: Team[] = [];
    const need = mode === 'cup' ? 1 : 2;
    const title = mode === 'cup' ? 'Choose your nation' : 'Select two teams';

    const cards = teams.map((t) => `
      <div class="team-card" data-team="${t.meta.name}">
        <div class="tc-flag">${t.meta.flag}</div>
        <div class="tc-code">${t.meta.code}</div>
        <div class="tc-name">${t.meta.name}</div>
        <div class="tc-stars">${stars(t.strength)}</div>
        <div class="tc-ovr">${Math.round(t.strength)}</div>
      </div>`).join('');

    const el = this.screen(`
      <div class="select-head">
        <button class="btn back" data-act="back">← Back</button>
        <h2>${title}</h2>
        <div class="pick-status">${mode === 'cup' ? '' : 'Pick HOME team'}</div>
      </div>
      <div class="team-grid">${cards}</div>
    `);
    const status = el.querySelector('.pick-status')!;
    el.addEventListener('click', (e) => {
      const back = (e.target as HTMLElement).closest('button')?.dataset.act;
      if (back === 'back') { this.showMain(); return; }
      const card = (e.target as HTMLElement).closest('.team-card') as HTMLElement | null;
      if (!card) return;
      const team = getTeam(card.dataset.team!);
      if (picked.includes(team)) return;
      picked.push(team);
      card.classList.add(picked.length === 1 ? 'picked-home' : 'picked-away');
      if (picked.length < need) {
        status.textContent = 'Pick AWAY team';
        return;
      }
      if (mode === 'quick') this.showLineups(picked[0], picked[1], () => this.cb.onQuickMatch(picked[0], picked[1]));
      else if (mode === 'pens') this.cb.onPenalties(picked[0], picked[1]);
      else {
        this.tournament = new Tournament(picked[0].meta.name);
        this.tournament.save();
        this.showTournamentHub();
      }
    });
  }

  // ----------------------------------------------------------- lineups

  showLineups(home: Team, away: Team, onKickoff: () => void): void {
    const col = (t: Team, kit: 'home' | 'away') => `
      <div class="lineup-col">
        <div class="lineup-head" style="background:${t.meta[kit].shirt};color:${t.meta[kit].accent}">
          <span class="lh-flag">${t.meta.flag}</span> ${t.meta.name}
          <span class="lh-form">${t.meta.formation.split('').join('-')}</span>
        </div>
        <table class="lineup-table">
          ${t.lineup.map((p) => `<tr><td class="no">${p.no}</td><td class="pos">${p.pos}</td><td>${p.name}${p.captain ? ' <b>(C)</b>' : ''}</td><td class="ovr">${p.overall}</td></tr>`).join('')}
        </table>
      </div>`;
    const el = this.screen(`
      <div class="select-head"><h2>Starting Lineups</h2></div>
      <div class="lineups-wrap">${col(home, 'home')}${col(away, 'away')}</div>
      <div class="center"><button class="btn big primary" data-act="ko">KICK OFF →</button></div>
    `);
    el.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('button')?.dataset.act === 'ko') {
        this.clear();
        onKickoff();
      }
    });
  }

  // ----------------------------------------------------------- tournament hub

  showTournamentHub(): void {
    const t = this.tournament!;
    const user = t.userTeam;
    const userMeta = getTeam(user).meta;
    const next = t.nextUserFixture();
    const stage = t.state.stage;

    // group tables
    const groupHtml = GROUPS.map((g) => {
      const rows = t.table(g);
      const isUserGroup = rows.some((r) => r.team === user);
      return `
        <div class="group-table ${isUserGroup ? 'user-group' : ''}">
          <div class="gt-head">Group ${g}</div>
          <table>
            ${rows.map((r, i) => `<tr class="${r.team === user ? 'user-row' : ''} ${i < 2 ? 'q1' : i === 2 ? 'q3' : ''}">
              <td class="gt-flag">${getTeam(r.team).meta.flag}</td><td class="gt-name">${getTeam(r.team).meta.code}</td>
              <td>${r.p}</td><td>${r.gf - r.ga >= 0 ? '+' : ''}${r.gf - r.ga}</td><td class="gt-pts">${r.pts}</td></tr>`).join('')}
          </table>
        </div>`;
    }).join('');

    // bracket
    const koHtml = t.koRounds().map((r) => `
      <div class="ko-round">
        <div class="ko-label">${r.label}</div>
        ${r.fixtures.map((f) => {
          const res = f.result;
          const win = res ? t.winnerOf(f) : '';
          const fmt = (name: string, score: number | '', isWin: boolean) =>
            `<div class="ko-team ${isWin ? 'ko-win' : ''} ${name === user ? 'user-row' : ''}"><span>${getTeam(name).meta.flag} ${getTeam(name).meta.code}</span><b>${score}</b></div>`;
          return `<div class="ko-match">
            ${fmt(f.home, res ? res.scores[0] : '', win === f.home)}
            ${fmt(f.away, res ? res.scores[1] : '', win === f.away)}
            ${res?.penScores ? `<div class="ko-pens">${res.penScores[0]}-${res.penScores[1]} pens</div>` : ''}
          </div>`;
        }).join('')}
      </div>`).join('');

    const scorers = t.topScorers(10);
    const scorersHtml = scorers.length ? `
      <div class="scorers-panel">
        <h3>Top Scorers</h3>
        <table>${scorers.map((s, i) => `<tr><td>${i + 1}</td><td>${getTeam(s.team).meta.flag}</td><td>${s.name}</td><td class="gt-pts">${s.goals}</td></tr>`).join('')}</table>
      </div>` : '';

    let actionHtml = '';
    if (t.champion) {
      actionHtml = `<div class="champ-banner">🏆 ${getTeam(t.champion).meta.flag} ${t.champion} are World Champions! ${t.champion === user ? 'GLORY IS YOURS!' : ''}</div>`;
    } else if (next) {
      const opp = next.home === user ? next.away : next.home;
      actionHtml = `
        <div class="next-match">
          <div>Next: <b>${getTeam(next.home).meta.flag} ${next.home}</b> vs <b>${next.away} ${getTeam(next.away).meta.flag}</b> — ${t.currentRoundName}</div>
          <button class="btn primary" data-act="play">▶ Play Match</button>
          <button class="btn" data-act="simme">Sim My Match</button>
        </div>`;
      void opp;
    } else if (!t.userAlive() && stage !== 'done') {
      actionHtml = `
        <div class="next-match">
          <div>You're out of the tournament — watch how it ends.</div>
          <button class="btn primary" data-act="simround">Sim Next Round (${t.currentRoundName})</button>
        </div>`;
    } else {
      actionHtml = `
        <div class="next-match">
          <button class="btn primary" data-act="simround">Continue (${t.currentRoundName})</button>
        </div>`;
    }

    const el = this.screen(`
      <div class="select-head">
        <button class="btn back" data-act="back">← Menu</button>
        <h2>${userMeta.flag} World Cup 2026 — ${userMeta.name}</h2>
        <div class="pick-status">${t.currentRoundName}</div>
      </div>
      ${actionHtml}
      <div class="hub-cols">
        <div class="groups-wrap">${groupHtml}</div>
        <div class="right-col">${koHtml ? `<div class="bracket">${koHtml}</div>` : ''}${scorersHtml}</div>
      </div>
    `);
    el.addEventListener('click', (e) => {
      const act = (e.target as HTMLElement).closest('button')?.dataset.act;
      if (act === 'back') this.showMain();
      else if (act === 'play' && next) {
        const home = getTeam(next.home), away = getTeam(next.away);
        this.showLineups(home, away, () => this.cb.onTournamentMatch(this.tournament!, next, next.home === user));
      } else if (act === 'simme' && next) {
        this.tournament!.simulateCurrentRound();
        this.showTournamentHub();
      } else if (act === 'simround') {
        this.tournament!.simulateCurrentRound();
        this.showTournamentHub();
      }
    });
  }
}
