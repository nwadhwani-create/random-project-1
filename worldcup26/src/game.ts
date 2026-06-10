import * as THREE from 'three';
import { createScene, type SceneCtx, type LightingPreset } from './render/scene';
import { createPitch } from './render/pitch';
import { createStadium, type Stadium } from './render/stadium';
import { PlayerView } from './render/players';
import { BallView } from './render/ballview';
import { TVCamera } from './render/camera';
import { Match, type MatchConfig } from './sim/match';
import { TeamAI } from './sim/ai';
import { UserController } from './sim/userctl';
import { Input } from './core/input';
import { AudioEngine } from './core/audio';
import type { Team } from './data/roster';
import { HUD } from './ui/hud';

interface Snapshot {
  ball: THREE.Vector3;
  players: { x: number; z: number; facing: number; state: string; stateTime: number }[];
}

export interface MatchResult {
  scores: [number, number];
  penScores?: [number, number];
  scorers: { name: string; minute: number; team: number }[];
  winner: number; // 0/1/-1 draw
}

/**
 * A running 3D match: owns the scene graph, sim, AI, user control, HUD,
 * replay buffer and audio reactions.
 */
export class GameSession {
  scene: SceneCtx;
  match: Match;
  ai: TeamAI;
  users: (UserController | null)[] = [null, null];
  hud: HUD;
  cam: TVCamera;
  stadium: Stadium;
  views: PlayerView[] = [];
  ballView: BallView;
  paused = false;
  over = false;
  private time = 0;
  private accum = 0;
  private replayBuf: Snapshot[] = [];
  private replayBufMax = 30 * 9;
  private replaying = false;
  private replayFrames: Snapshot[] = [];
  private replayIdx = 0;
  private replayTimer = 0;
  private pitchGroup: THREE.Group;
  private ring!: THREE.Mesh;
  onEnd: ((r: MatchResult) => void) | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    public home: Team,
    public away: Team,
    cfg: MatchConfig,
    public input: Input,
    public audio: AudioEngine,
    lighting: LightingPreset,
    uiRoot: HTMLElement,
  ) {
    this.scene = createScene(canvas);
    this.scene.setPreset(lighting);
    this.pitchGroup = createPitch();
    this.scene.scene.add(this.pitchGroup);
    this.stadium = createStadium(home.meta.home.shirt, away.meta.away.shirt);
    this.scene.scene.add(this.stadium.group);

    this.match = new Match(home, away, cfg);
    this.ai = new TeamAI(this.match);
    if (cfg.userTeams[0]) this.users[0] = new UserController(0, this.match, input);
    if (cfg.userTeams[1]) this.users[1] = new UserController(1, this.match, input);

    // player views
    for (let ti = 0; ti < 2; ti++) {
      const side = this.match.sides[ti];
      const meta = side.team.meta;
      // away wears away kit if home shirt color is similar
      const kit = ti === 0 ? meta.home : meta.away;
      for (const p of side.players) {
        const v = new PlayerView(p, p.isGK ? meta.gk : kit);
        this.views.push(v);
        this.scene.scene.add(v.object);
      }
    }
    this.ballView = new BallView();
    this.scene.scene.add(this.ballView.mesh);

    // controlled player indicator ring
    this.ring = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.75, 28),
      new THREE.MeshBasicMaterial({ color: 0xffe14d, transparent: true, opacity: 0.85, depthWrite: false }),
    );
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.y = 0.02;
    this.scene.scene.add(this.ring);

    this.cam = new TVCamera(this.scene.camera);
    this.cam.snap(this.match);

    this.hud = new HUD(uiRoot, this.match, this);
  }

  /** main loop hook; dt = real seconds */
  update(dt: number): void {
    dt = Math.min(dt, 0.05);
    this.time += dt;
    this.input.update(dt);

    if (this.input.justPressed('pause')) this.hud.togglePause();
    if (this.input.justPressed('replay') && !this.replaying && this.replayBuf.length > 30) {
      this.startReplay();
    }

    if (this.replaying) {
      this.stepReplay(dt);
      this.input.lateUpdate();
      this.render(dt);
      return;
    }

    if (!this.paused && !this.over) {
      const m = this.match;
      const prevPhase = m.phase;
      const prevEvents = m.events.length;

      for (const u of this.users) u?.step(dt);
      this.ai.step(dt, [this.users[0]?.controlled ?? null, this.users[1]?.controlled ?? null]);
      m.step(dt);

      // audio + hud reactions to new events
      for (let i = prevEvents; i < m.events.length; i++) {
        this.onEvent(m.events[i].type, m.events[i].text);
      }
      if (m.ball.justBounced) this.audio.bounce();
      if (m.ball.justHitNet) this.audio.netRipple();
      if (m.ball.justHitPost) { this.audio.post(); this.audio.ooh(); }

      // record replay frames at ~30Hz (only live action, so replays end at the goal)
      if (m.phase === 'play' || m.phase === 'set-piece') {
        this.accum += dt;
        if (this.accum > 1 / 30) {
          this.accum = 0;
          this.recordSnapshot();
        }
      }

      // goal replay trigger
      if (prevPhase === 'goal' && m.phaseTime > 2.1 && !this._replayedThisGoal) {
        this._replayedThisGoal = true;
        this.startReplay();
      }
      if (prevPhase !== 'goal' && m.phase === 'goal') this._replayedThisGoal = false;

      if (m.over && !this.over) {
        this.over = true;
        const sum = (arr: number[]) => arr.reduce((s, x) => s + x, 0);
        const r: MatchResult = {
          scores: [m.sides[0].score, m.sides[1].score],
          scorers: m.scorers,
          winner: m.winner,
          penScores: m.shootoutDone ? [sum(m.shootoutScores[0]), sum(m.shootoutScores[1])] : undefined,
        };
        this.hud.showFullTime(r);
        if (this.onEnd) this.onEnd(r);
      }

      this.audio.setExcitement(m.excitement, dt);
    }

    this.hud.update(dt);
    this.input.lateUpdate();
    this.render(dt);
  }

  private _replayedThisGoal = false;

  private render(dt: number): void {
    if (!this.replaying) this.cam.update(this.match, dt, this.time);
    // controlled player ring
    const ctl = this.users[0]?.controlled ?? this.users[1]?.controlled;
    if (ctl && !this.replaying) {
      this.ring.visible = true;
      this.ring.position.set(ctl.pos.x, 0.02, ctl.pos.z);
      const pulse = 1 + Math.sin(this.time * 5) * 0.07;
      this.ring.scale.setScalar(pulse);
    } else {
      this.ring.visible = false;
    }
    for (const v of this.views) v.update(dt, this.time);
    this.ballView.update(this.match.ball, dt);
    this.stadium.update(this.time, this.match.excitement);
    this.scene.render();
  }

  private allPlayers() {
    return [...this.match.sides[0].players, ...this.match.sides[1].players];
  }

  private recordSnapshot(): void {
    const snap: Snapshot = {
      ball: this.match.ball.pos.clone(),
      players: this.allPlayers().map((p) => ({ x: p.pos.x, z: p.pos.z, facing: p.facing, state: p.state, stateTime: p.stateTime })),
    };
    this.replayBuf.push(snap);
    if (this.replayBuf.length > this.replayBufMax) this.replayBuf.shift();
  }

  startReplay(): void {
    if (this.replayBuf.length < 30) return;
    this.replaying = true;
    this.replayFrames = this.replayBuf.slice(-30 * 7);
    this.replayIdx = 0;
    this.replayTimer = 0;
    this.hud.setReplay(true);
  }

  private stepReplay(dt: number): void {
    this.replayTimer += dt;
    // play at 60% speed
    this.replayIdx += dt * 30 * 0.6;
    if (this.replayIdx >= this.replayFrames.length - 1 || this.input.justPressed('pass') || this.input.justPressed('pause')) {
      this.replaying = false;
      this.hud.setReplay(false);
      // restore current sim state to views happens naturally next frame
      return;
    }
    const i = Math.floor(this.replayIdx);
    const f = this.replayFrames[i];
    const f2 = this.replayFrames[Math.min(i + 1, this.replayFrames.length - 1)];
    const t = this.replayIdx - i;
    // apply interpolated snapshot
    const players = this.allPlayers();
    players.forEach((p, k) => {
      const a = f.players[k], b = f2.players[k];
      p.pos.x = a.x + (b.x - a.x) * t;
      p.pos.z = a.z + (b.z - a.z) * t;
      p.facing = a.facing;
      p.state = a.state as any;
      p.stateTime = a.stateTime;
    });
    this.match.ball.pos.lerpVectors(f.ball, f2.ball, t);
    const t01 = this.replayIdx / this.replayFrames.length;
    this.cam.updateReplay(this.match.ball.pos, t01, dt);
  }

  private onEvent(type: string, text?: string): void {
    const a = this.audio;
    switch (type) {
      case 'whistle': a.whistle(); break;
      case 'halftime': case 'fulltime': a.whistle(true); break;
      case 'kick': case 'cross': a.kick(0.5); break;
      case 'shot': a.kick(0.9); break;
      case 'goal': case 'pen-goal': a.goalRoar(); break;
      case 'save': a.ooh(); break;
      case 'foul': a.whistle(); break;
      case 'offside': a.whistle(); break;
      case 'penalty': a.whistle(); a.ooh(); break;
      case 'pen-miss': a.ooh(); break;
      case 'tackle': a.bounce(); break;
    }
    if (text) this.hud.banner(text);
  }

  setLighting(p: LightingPreset): void {
    this.scene.setPreset(p);
  }

  dispose(): void {
    this.hud.dispose();
    this.scene.renderer.dispose();
    this.scene.renderer.forceContextLoss();
  }
}

// ----------------------------------------------------------------- quick sim

export interface SimResult {
  scores: [number, number];
  penScores?: [number, number];
  scorers: { name: string; minute: number; team: number }[];
}

/** simulate a match the user doesn't play, Poisson goals from team strength */
export function simulateMatch(a: Team, b: Team, knockout: boolean, rand: () => number = Math.random): SimResult {
  const diff = a.strength - b.strength;
  const baseA = 1.35 + diff * 0.075;
  const baseB = 1.35 - diff * 0.075;
  const poisson = (lambda: number) => {
    const L = Math.exp(-Math.max(0.1, lambda));
    let k = 0, p = 1;
    do { k++; p *= rand(); } while (p > L);
    return k - 1;
  };
  let ga = poisson(baseA);
  let gb = poisson(baseB);
  const scorers: SimResult['scorers'] = [];
  const pickScorer = (team: Team) => {
    // attackers weighted by shooting
    const cands = team.lineup.filter((p) => p.pos !== 'GK');
    const weights = cands.map((p) => Math.pow(p.attrs.shooting, 3) * (p.pos === 'FW' ? 2.2 : p.pos === 'MF' ? 1 : 0.25));
    const total = weights.reduce((s, w) => s + w, 0);
    let r = rand() * total;
    for (let i = 0; i < cands.length; i++) { r -= weights[i]; if (r <= 0) return cands[i].name; }
    return cands[0].name;
  };
  const minutes = new Set<number>();
  const mkMinute = () => {
    let m = 1 + Math.floor(rand() * 90);
    while (minutes.has(m)) m = 1 + Math.floor(rand() * 90);
    minutes.add(m);
    return m;
  };
  for (let i = 0; i < ga; i++) scorers.push({ name: pickScorer(a), minute: mkMinute(), team: 0 });
  for (let i = 0; i < gb; i++) scorers.push({ name: pickScorer(b), minute: mkMinute(), team: 1 });
  scorers.sort((x, y) => x.minute - y.minute);

  const res: SimResult = { scores: [ga, gb], scorers };
  if (knockout && ga === gb) {
    // extra time (30% chance of a goal each)
    if (rand() < 0.18 + Math.max(0, diff) * 0.02) { res.scores[0]++; scorers.push({ name: pickScorer(a), minute: 90 + Math.ceil(rand() * 30), team: 0 }); }
    else if (rand() < 0.18 + Math.max(0, -diff) * 0.02) { res.scores[1]++; scorers.push({ name: pickScorer(b), minute: 90 + Math.ceil(rand() * 30), team: 1 }); }
    if (res.scores[0] === res.scores[1]) {
      // shootout
      let pa = 0, pb = 0, round = 0;
      while (round < 10) {
        round++;
        if (rand() < 0.76) pa++;
        if (rand() < 0.76) pb++;
        if (round >= 5 && pa !== pb) break;
      }
      if (pa === pb) { if (rand() < 0.5) pa++; else pb++; }
      res.penScores = [pa, pb];
    }
  }
  return res;
}
