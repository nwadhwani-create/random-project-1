import type { GameMode, LightingPreset, MatchConfig, Difficulty } from '../data/types';
import { getTeamById, getAllTeams } from '../data/teams';

export class UIManager {
  private root: HTMLElement;

  constructor(rootId: string) {
    this.root = document.getElementById(rootId)!;
    this.showMainMenu();
  }

  showMainMenu(): void {
    this.root.innerHTML = `
      <div class="menu interactive" style="
        position:absolute;inset:0;display:flex;flex-direction:column;
        align-items:center;justify-content:center;
        background:linear-gradient(135deg,#0a1628 0%,#1a2a4a 50%,#0a1628 100%);
      ">
        <h1 style="font-size:3rem;font-weight:800;letter-spacing:0.05em;margin-bottom:0.5rem;
          background:linear-gradient(90deg,#ffd700,#fff,#ffd700);-webkit-background-clip:text;
          -webkit-text-fill-color:transparent;">
          WORLD CUP 2026
        </h1>
        <p style="color:#8899aa;margin-bottom:2rem;font-size:1.1rem;">International Soccer Championship</p>
        <div style="display:flex;flex-direction:column;gap:12px;width:320px;">
          <button class="menu-btn" data-mode="quick_match">Quick Match</button>
          <button class="menu-btn" data-mode="tournament">World Cup Tournament</button>
          <button class="menu-btn" data-mode="penalty_practice">Penalty Shootout</button>
          <button class="menu-btn" data-mode="sandbox">Training Ground</button>
        </div>
        <p style="color:#556;margin-top:2rem;font-size:0.85rem;">
          WASD/Arrows: Move | Shift: Sprint | Space/E: Shoot | X: Pass | C: Lob | Z: Tackle | Q: Switch
        </p>
      </div>
    `;
    this.root.querySelectorAll('.menu-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = (btn as HTMLElement).dataset.mode as GameMode;
        if (mode === 'quick_match') this.showTeamSelect();
        else if (mode === 'tournament') this.showTournamentSetup();
        else if (mode === 'penalty_practice') this.showPenaltySetup();
        else if (mode === 'sandbox') this.onStartMatch?.(this.defaultConfig('usa', 'mex'));
      });
    });
  }

  showTeamSelect(onComplete?: (config: MatchConfig) => void): void {
    const teams = getAllTeams();
    this.root.innerHTML = `
      <div class="menu interactive" style="
        position:absolute;inset:0;display:flex;flex-direction:column;
        align-items:center;padding:2rem;
        background:linear-gradient(135deg,#0a1628,#1a2a4a);
        overflow-y:auto;
      ">
        <h2 style="font-size:1.8rem;margin-bottom:1.5rem;">Select Teams</h2>
        <div style="display:flex;gap:2rem;flex-wrap:wrap;justify-content:center;margin-bottom:1.5rem;">
          <div>
            <label style="color:#8af;display:block;margin-bottom:8px;">Home Team</label>
            <select id="home-team" style="padding:8px 16px;font-size:1rem;border-radius:6px;
              background:#1a2a4a;color:#fff;border:1px solid #345;width:220px;">
              ${teams.map((t) => `<option value="${t.id}">${t.name} (${t.code})</option>`).join('')}
            </select>
          </div>
          <div>
            <label style="color:#f88;display:block;margin-bottom:8px;">Away Team</label>
            <select id="away-team" style="padding:8px 16px;font-size:1rem;border-radius:6px;
              background:#1a2a4a;color:#fff;border:1px solid #345;width:220px;">
              ${teams.map((t) => `<option value="${t.id}" ${t.id === 'bra' ? 'selected' : ''}>${t.name} (${t.code})</option>`).join('')}
            </select>
          </div>
        </div>
        <div style="display:flex;gap:1.5rem;margin-bottom:1.5rem;flex-wrap:wrap;justify-content:center;">
          <div>
            <label style="color:#aaa;display:block;margin-bottom:4px;">Half Length</label>
            <select id="half-length" style="padding:6px 12px;border-radius:4px;background:#1a2a4a;color:#fff;border:1px solid #345;">
              <option value="3">3 minutes</option>
              <option value="5" selected>5 minutes</option>
              <option value="10">10 minutes</option>
            </select>
          </div>
          <div>
            <label style="color:#aaa;display:block;margin-bottom:4px;">Difficulty</label>
            <select id="difficulty" style="padding:6px 12px;border-radius:4px;background:#1a2a4a;color:#fff;border:1px solid #345;">
              <option value="easy">Easy</option>
              <option value="medium" selected>Medium</option>
              <option value="hard">Hard</option>
              <option value="legendary">Legendary</option>
            </select>
          </div>
          <div>
            <label style="color:#aaa;display:block;margin-bottom:4px;">Lighting</label>
            <select id="lighting" style="padding:6px 12px;border-radius:4px;background:#1a2a4a;color:#fff;border:1px solid #345;">
              <option value="day" selected>Day</option>
              <option value="dusk">Dusk</option>
              <option value="night">Night / Floodlights</option>
            </select>
          </div>
        </div>
        <div style="display:flex;gap:12px;">
          <button class="menu-btn" id="btn-back">Back</button>
          <button class="menu-btn" id="btn-start" style="background:linear-gradient(135deg,#1a6b3a,#2a9b5a);">
            Kick Off
          </button>
        </div>
      </div>
    `;

    document.getElementById('btn-back')?.addEventListener('click', () => this.showMainMenu());
    document.getElementById('btn-start')?.addEventListener('click', () => {
      const config = this.readMatchConfig();
      if (onComplete) onComplete(config);
      else this.onStartMatch?.(config);
    });
  }

  showTournamentSetup(): void {
    const teams = getAllTeams();
    this.root.innerHTML = `
      <div class="menu interactive" style="
        position:absolute;inset:0;display:flex;flex-direction:column;
        align-items:center;justify-content:center;
        background:linear-gradient(135deg,#0a1628,#1a2a4a);
      ">
        <h2 style="font-size:1.8rem;margin-bottom:1.5rem;">World Cup 2026 Tournament</h2>
        <p style="color:#8899aa;margin-bottom:1.5rem;max-width:500px;text-align:center;">
          12 groups of 4 — Top 2 + 8 best 3rd place advance to Round of 32
        </p>
        <label style="color:#8af;margin-bottom:8px;">Choose Your Nation</label>
        <select id="user-team" style="padding:8px 16px;font-size:1rem;border-radius:6px;
          background:#1a2a4a;color:#fff;border:1px solid #345;width:280px;margin-bottom:1.5rem;">
          ${teams.map((t) => `<option value="${t.id}">${t.name}</option>`).join('')}
        </select>
        <div style="display:flex;gap:12px;">
          <button class="menu-btn" id="btn-back">Back</button>
          <button class="menu-btn" id="btn-start-tournament" style="background:linear-gradient(135deg,#1a3a6b,#2a5a9b);">
            Begin Tournament
          </button>
        </div>
      </div>
    `;
    document.getElementById('btn-back')?.addEventListener('click', () => this.showMainMenu());
    document.getElementById('btn-start-tournament')?.addEventListener('click', () => {
      const teamId = (document.getElementById('user-team') as HTMLSelectElement).value;
      this.onStartTournament?.(teamId);
    });
  }

  showPenaltySetup(): void {
    const teams = getAllTeams();
    this.root.innerHTML = `
      <div class="menu interactive" style="
        position:absolute;inset:0;display:flex;flex-direction:column;
        align-items:center;justify-content:center;
        background:linear-gradient(135deg,#0a1628,#1a2a4a);
      ">
        <h2 style="font-size:1.8rem;margin-bottom:1.5rem;">Penalty Shootout Practice</h2>
        <select id="home-team" style="padding:8px 16px;margin:8px;border-radius:6px;background:#1a2a4a;color:#fff;border:1px solid #345;width:280px;">
          ${teams.map((t) => `<option value="${t.id}">${t.name}</option>`).join('')}
        </select>
        <span style="color:#666;margin:8px;">vs</span>
        <select id="away-team" style="padding:8px 16px;margin:8px;border-radius:6px;background:#1a2a4a;color:#fff;border:1px solid #345;width:280px;">
          ${teams.map((t) => `<option value="${t.id}" ${t.id === 'ger' ? 'selected' : ''}>${t.name}</option>`).join('')}
        </select>
        <div style="display:flex;gap:12px;margin-top:1.5rem;">
          <button class="menu-btn" id="btn-back">Back</button>
          <button class="menu-btn" id="btn-start-pen">Start</button>
        </div>
      </div>
    `;
    document.getElementById('btn-back')?.addEventListener('click', () => this.showMainMenu());
    document.getElementById('btn-start-pen')?.addEventListener('click', () => {
      const home = (document.getElementById('home-team') as HTMLSelectElement).value;
      const away = (document.getElementById('away-team') as HTMLSelectElement).value;
      this.onStartPenalties?.(home, away);
    });
  }

  showLineup(homeTeam: string, awayTeam: string, onContinue: () => void): void {
    const home = getTeamById(homeTeam)!;
    const away = getTeamById(awayTeam)!;
    this.root.innerHTML = `
      <div class="menu interactive" style="
        position:absolute;inset:0;display:flex;flex-direction:column;
        align-items:center;padding:2rem;
        background:rgba(10,22,40,0.95);
        overflow-y:auto;
      ">
        <h2 style="font-size:1.5rem;margin-bottom:1rem;">Team Lineups</h2>
        <div style="display:flex;gap:3rem;flex-wrap:wrap;justify-content:center;">
          <div style="min-width:280px;">
            <h3 style="color:${home.kitHome.primary};margin-bottom:8px;">${home.name} (${home.formation})</h3>
            ${home.squad.slice(0, 11).map((p) => `
              <div style="display:flex;gap:8px;padding:3px 0;color:#ccc;font-size:0.9rem;">
                <span style="width:24px;color:#888;">${p.number}</span>
                <span style="width:32px;color:#666;">${p.position}</span>
                <span>${p.name}</span>
              </div>
            `).join('')}
          </div>
          <div style="min-width:280px;">
            <h3 style="color:${away.kitHome.primary};margin-bottom:8px;">${away.name} (${away.formation})</h3>
            ${away.squad.slice(0, 11).map((p) => `
              <div style="display:flex;gap:8px;padding:3px 0;color:#ccc;font-size:0.9rem;">
                <span style="width:24px;color:#888;">${p.number}</span>
                <span style="width:32px;color:#666;">${p.position}</span>
                <span>${p.name}</span>
              </div>
            `).join('')}
          </div>
        </div>
        <button class="menu-btn" id="btn-continue" style="margin-top:2rem;">Continue</button>
      </div>
    `;
    document.getElementById('btn-continue')?.addEventListener('click', () => {
      this.hideMenu();
      onContinue();
    });
  }

  showHUD(): void {
    const existing = document.getElementById('hud');
    if (existing) return;
    const hud = document.createElement('div');
    hud.id = 'hud';
    hud.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
    hud.innerHTML = `
      <div id="scoreboard" style="
        position:absolute;top:16px;left:50%;transform:translateX(-50%);
        display:flex;align-items:center;gap:16px;
        background:rgba(0,0,0,0.7);padding:8px 24px;border-radius:8px;
        font-size:1.2rem;font-weight:700;letter-spacing:0.05em;
      ">
        <span id="home-name" style="min-width:60px;text-align:right;">HOME</span>
        <span id="home-score" style="font-size:1.6rem;color:#ffd700;">0</span>
        <span style="color:#666;">-</span>
        <span id="away-score" style="font-size:1.6rem;color:#ffd700;">0</span>
        <span id="away-name" style="min-width:60px;">AWAY</span>
        <span id="clock" style="margin-left:16px;color:#8af;font-size:1rem;">0:00</span>
      </div>
      <div id="power-meter" style="
        position:absolute;bottom:80px;right:40px;width:120px;height:8px;
        background:rgba(0,0,0,0.5);border-radius:4px;display:none;
      ">
        <div id="power-fill" style="height:100%;width:0%;background:linear-gradient(90deg,#2a9,#ff0,#f80);border-radius:4px;transition:width 0.05s;"></div>
      </div>
      <div id="match-event" style="
        position:absolute;top:40%;left:50%;transform:translate(-50%,-50%);
        font-size:2.5rem;font-weight:800;opacity:0;transition:opacity 0.5s;
        text-shadow:0 2px 20px rgba(0,0,0,0.8);
      "></div>
      <div id="controls-hint" style="
        position:absolute;bottom:12px;left:50%;transform:translateX(-50%);
        color:rgba(255,255,255,0.4);font-size:0.75rem;
      ">Q: Switch | Tab: GK | Esc: Pause</div>
    `;
    this.root.appendChild(hud);
  }

  updateHUD(homeName: string, awayName: string, homeScore: number, awayScore: number, minute: number, second: number, power: number, showPower: boolean): void {
    const el = (id: string) => document.getElementById(id);
    el('home-name')!.textContent = homeName;
    el('away-name')!.textContent = awayName;
    el('home-score')!.textContent = String(homeScore);
    el('away-score')!.textContent = String(awayScore);
    el('clock')!.textContent = `${minute}:${String(Math.floor(second)).padStart(2, '0')}`;
    const meter = el('power-meter')!;
    meter.style.display = showPower ? 'block' : 'none';
    if (showPower) el('power-fill')!.style.width = `${power * 100}%`;
  }

  showEvent(text: string, duration = 3000): void {
    const el = document.getElementById('match-event');
    if (!el) return;
    el.textContent = text;
    el.style.opacity = '1';
    setTimeout(() => { el.style.opacity = '0'; }, duration);
  }

  hideMenu(): void {
    this.root.querySelectorAll('.menu').forEach((m) => m.remove());
  }

  showPauseMenu(onResume: () => void, onQuit: () => void): void {
    const overlay = document.createElement('div');
    overlay.className = 'menu interactive';
    overlay.style.cssText = `
      position:absolute;inset:0;display:flex;flex-direction:column;
      align-items:center;justify-content:center;
      background:rgba(0,0,0,0.7);
    `;
    overlay.innerHTML = `
      <h2 style="font-size:2rem;margin-bottom:1.5rem;">Paused</h2>
      <button class="menu-btn" id="btn-resume">Resume</button>
      <button class="menu-btn" id="btn-quit" style="margin-top:12px;">Quit to Menu</button>
    `;
    this.root.appendChild(overlay);
    overlay.querySelector('#btn-resume')?.addEventListener('click', () => { overlay.remove(); onResume(); });
    overlay.querySelector('#btn-quit')?.addEventListener('click', () => { overlay.remove(); onQuit(); });
  }

  private readMatchConfig(): MatchConfig {
    return {
      homeTeamId: (document.getElementById('home-team') as HTMLSelectElement).value,
      awayTeamId: (document.getElementById('away-team') as HTMLSelectElement).value,
      halfLengthMinutes: Number((document.getElementById('half-length') as HTMLSelectElement).value) as 3 | 5 | 10,
      difficulty: (document.getElementById('difficulty') as HTMLSelectElement).value as Difficulty,
      isKnockout: false,
      lighting: (document.getElementById('lighting') as HTMLSelectElement).value as LightingPreset,
    };
  }

  private defaultConfig(home: string, away: string): MatchConfig {
    return {
      homeTeamId: home,
      awayTeamId: away,
      halfLengthMinutes: 5,
      difficulty: 'medium',
      isKnockout: false,
      lighting: 'day',
    };
  }

  onStartMatch?: (config: MatchConfig) => void;
  onStartTournament?: (teamId: string) => void;
  onStartPenalties?: (home: string, away: string) => void;
}

const style = document.createElement('style');
style.textContent = `
  .menu-btn {
    padding: 12px 32px; font-size: 1rem; font-weight: 600;
    background: linear-gradient(135deg, #1a2a4a, #2a3a5a);
    color: #fff; border: 1px solid #456; border-radius: 8px;
    cursor: pointer; transition: all 0.2s; letter-spacing: 0.03em;
  }
  .menu-btn:hover { background: linear-gradient(135deg, #2a3a5a, #3a4a6a); transform: translateY(-1px); }
`;
document.head.appendChild(style);
