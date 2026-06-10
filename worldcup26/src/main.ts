import { GameSession } from './game';
import { Input } from './core/input';
import { AudioEngine } from './core/audio';
import { Menus, loadSettings } from './ui/menus';
import { getTeam, type Team } from './data/roster';
import type { Tournament, Fixture } from './ui/tournament';
import type { MatchConfig } from './sim/match';

const canvasHost = document.getElementById('canvas-host')!;
const uiRoot = document.getElementById('ui-root')!;

const input = new Input();
const audio = new AudioEngine();
const settings = loadSettings();

let session: GameSession | null = null;
let raf = 0;
let lastT = 0;

// init audio on first interaction (browser autoplay policy)
const initAudio = () => { audio.init(); audio.setEnabled(settings.sound); };
window.addEventListener('pointerdown', initAudio, { once: true });
window.addEventListener('keydown', initAudio, { once: true });

function freshCanvas(): HTMLCanvasElement {
  canvasHost.innerHTML = '';
  const c = document.createElement('canvas');
  canvasHost.appendChild(c);
  return c;
}

function endSession(): void {
  if (session) { session.dispose(); session = null; }
  cancelAnimationFrame(raf);
  canvasHost.innerHTML = '';
}

function loop(t: number): void {
  raf = requestAnimationFrame(loop);
  const dt = (t - lastT) / 1000;
  lastT = t;
  session?.update(dt);
}

function startMatch(home: Team, away: Team, cfg: MatchConfig, onDone: (r: { scores: [number, number]; penScores?: [number, number]; scorers: { name: string; minute: number; team: number }[]; winner: number }) => void): void {
  endSession();
  audio.setEnabled(settings.sound);
  session = new GameSession(freshCanvas(), home, away, cfg, input, audio, settings.lighting, uiRoot);
  session.hud.onQuit = () => {
    const r = session && session.over ? {
      scores: [session.match.sides[0].score, session.match.sides[1].score] as [number, number],
      scorers: session.match.scorers,
      winner: session.match.winner,
      penScores: session.match.shootoutDone
        ? [session.match.shootoutScores[0].reduce((s, x) => s + x, 0), session.match.shootoutScores[1].reduce((s, x) => s + x, 0)] as [number, number]
        : undefined,
    } : null;
    endSession();
    if (r) onDone(r);
    else menus.showMain();
  };
  session.hud.onRestart = () => startMatch(home, away, cfg, onDone);
  lastT = performance.now();
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(loop);
}

const menus = new Menus(uiRoot, {
  settings,
  onQuickMatch(home, away) {
    startMatch(home, away, {
      halfMinutes: settings.halfMinutes,
      difficulty: settings.difficulty,
      knockout: false,
      userTeams: [true, false],
    }, () => menus.showMain());
  },
  onPenalties(home, away) {
    startMatch(home, away, {
      halfMinutes: settings.halfMinutes,
      difficulty: settings.difficulty,
      knockout: true,
      userTeams: [true, false],
      shootoutOnly: true,
    }, () => menus.showMain());
  },
  onTournamentMatch(t: Tournament, fixture: Fixture, userIsHome: boolean) {
    startMatch(getTeam(fixture.home), getTeam(fixture.away), {
      halfMinutes: settings.halfMinutes,
      difficulty: settings.difficulty,
      knockout: !fixture.group,
      userTeams: [userIsHome, !userIsHome],
    }, (r) => {
      t.reportUserResult(fixture, { scores: r.scores, scorers: r.scorers, penScores: r.penScores });
      menus.showTournamentHub();
    });
  },
});

menus.showMain();
