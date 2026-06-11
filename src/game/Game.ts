import * as THREE from 'three';
import type { GameConfig, MatchState, TeamData } from '@/core/types';
import { InputManager } from '@/input/InputManager';
import { Ball } from '@/entities/Ball';
import { Player } from '@/entities/Player';
import { Pitch } from '@/rendering/Pitch';
import { Stadium } from '@/rendering/Stadium';
import { LightingSystem } from '@/rendering/Lighting';
import { CameraController } from '@/rendering/CameraController';
import { DEMO_HOME, DEMO_AWAY, hexToNumber } from '@/data/demoTeams';
import { loadTeam } from '@/data/teamLoader';
import { TeamAI } from '@/ai/TeamAI';
import { AudioManager } from '@/audio/AudioManager';
import { getFormationPositions } from './Formation';
import { MatchEngine } from './MatchEngine';
import { Referee } from './Referee';

export class Game {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private clock = new THREE.Clock();
  private input = new InputManager();
  private pitch: Pitch;
  private stadium: Stadium;
  private lighting: LightingSystem;
  private camera: CameraController;
  private ball: Ball;
  private players: Player[] = [];
  private controlledPlayer: Player | null = null;
  private running = false;
  private shootPower = 0;
  private shootCharging = false;
  private matchEngine: MatchEngine | null = null;
  private referee = new Referee();
  private homeAI = new TeamAI();
  private awayAI = new TeamAI();
  private audio = new AudioManager();
  private homeTeam: TeamData = DEMO_HOME;
  private awayTeam: TeamData = DEMO_AWAY;

  get matchState(): MatchState {
    return this.matchEngine?.state ?? {
      phase: 'menu', homeScore: 0, awayScore: 0, clock: 0,
      half: 1, halfDuration: 300, possession: 'home', setPiece: null, offside: false,
    };
  }

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.Fog(0x87ceeb, 80, 200);

    this.pitch = new Pitch();
    this.stadium = new Stadium();
    this.lighting = new LightingSystem(this.scene);
    this.camera = new CameraController(window.innerWidth / window.innerHeight);
    this.ball = new Ball();

    this.scene.add(this.pitch.group);
    this.scene.add(this.stadium.group);
    this.scene.add(this.lighting.sun);
    this.scene.add(this.lighting.sun.target);

    // HDR-style environment
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x87ceeb);
    const envTex = pmrem.fromScene(envScene).texture;
    this.scene.environment = envTex;
    pmrem.dispose();

    window.addEventListener('resize', () => this.onResize());
    this.audio.init();
  }

  async startMatch(config?: Partial<GameConfig>): Promise<void> {
    const lighting = config?.lighting ?? 'day';
    const difficulty = config?.difficulty ?? 'medium';
    this.lighting.applyPreset(lighting);
    this.updateSkyForLighting(lighting);

    this.homeTeam = await loadTeam(config?.homeTeam ?? 'USA');
    this.awayTeam = await loadTeam(config?.awayTeam ?? 'MEX');

    this.homeAI.setDifficulty(difficulty);
    this.awayAI.setDifficulty(difficulty);
    this.audio.resume();

    this.matchEngine = new MatchEngine({
      halfMinutes: config?.halfMinutes ?? 5,
      difficulty,
      isKnockout: false,
    });
    this.matchEngine.resumePlay();

    this.clearPlayers();
    this.spawnTeams();
    this.ball.reset(0, 0);

    this.controlledPlayer = this.players.find((p) => p.teamId === 'home') ?? null;
    if (this.controlledPlayer) {
      this.controlledPlayer.setControlled(true);
    }

    this.running = true;
    this.hideMenu();
    this.showScoreboard();
    this.updateScoreboard();
    this.audio.playWhistle();
  }

  private spawnTeams(): void {
    this.spawnTeam(this.homeTeam, 'home');
    this.spawnTeam(this.awayTeam, 'away');
  }

  private spawnTeam(team: typeof DEMO_HOME, side: 'home' | 'away'): void {
    const positions = getFormationPositions(team.formation, side);
    const primary = hexToNumber(team.kit.home.primary);
    const secondary = hexToNumber(team.kit.home.secondary);

    team.players.forEach((data, i) => {
      const pos = positions[i] ?? { x: 0, z: 0 };
      const player = new Player(data, side, primary, secondary);
      player.reset(pos.x, pos.z);
      this.players.push(player);
      this.scene.add(player.mesh);
    });
  }

  private clearPlayers(): void {
    for (const p of this.players) {
      this.scene.remove(p.mesh);
    }
    this.players = [];
    this.controlledPlayer = null;
  }

  update(): void {
    if (!this.running) return;

    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.input.update();

    if (this.input.state.cameraToggle) {
      this.camera.toggleMode();
    }

    if (this.matchEngine) {
      this.matchEngine.update(dt);
    }

    this.updateControlledPlayer(dt);
    this.updateAIPlayers(dt);
    this.updateBall(dt);
    this.checkBallPlayerCollision();
    this.processReferee(dt);

    const excitement = this.getExcitement();
    this.stadium.update(dt, excitement);
    this.audio.setExcitement(excitement);
    this.camera.update(
      dt,
      this.ball.position,
      this.controlledPlayer?.position
    );

    this.input.endFrame();
    this.renderer.render(this.scene, this.camera.camera);
  }

  private updateControlledPlayer(dt: number): void {
    if (this.matchState.phase === 'replay' || this.matchState.phase === 'setpiece') return;
    const cp = this.controlledPlayer;
    if (!cp) return;

    const { moveX, moveZ, sprint, pass, shootHeld, tackle, switchPlayer } = this.input.state;

    if (switchPlayer) {
      this.switchToNearestPlayer();
    }

    cp.update(dt, moveX, moveZ, sprint);

    // Pass
    if (pass && cp.distanceToBall(this.ball.position) < 1.5) {
      const target = this.findPassTarget(cp);
      const dir = target
        ? { x: target.position.x - this.ball.position.x, y: 0, z: target.position.z - this.ball.position.z }
        : { x: Math.sin(cp.physics.rotation), y: 0, z: Math.cos(cp.physics.rotation) };
      this.ball.kick(dir, 12 + cp.data.ratings.passing * 0.05);
      this.audio.playKick();
      this.referee.recordTouch(cp.teamId);
    }

    // Shoot with power gauge
    if (shootHeld && cp.distanceToBall(this.ball.position) < 1.5) {
      if (!this.shootCharging) this.shootCharging = true;
      this.shootPower = Math.min(1, this.shootPower + dt * 1.5);
      this.showPowerMeter(this.shootPower);
    } else if (this.shootCharging) {
      const dir = {
        x: Math.sin(cp.physics.rotation),
        y: 0,
        z: Math.cos(cp.physics.rotation),
      };
      const power = 15 + this.shootPower * 20 + cp.data.ratings.shooting * 0.1;
      this.ball.kick(dir, power, this.shootPower * 0.5);
      this.audio.playKick();
      this.referee.recordTouch(cp.teamId);
      this.shootCharging = false;
      this.shootPower = 0;
      this.hidePowerMeter();
    }

    // Tackle
    if (tackle) {
      cp.animation = 'tackle';
    }
  }

  private updateAIPlayers(dt: number): void {
    if (this.matchState.phase === 'replay') return;

    const ballPos = this.ball.position;
    const ballVel = this.ball.physics.state.velocity;
    const aiPlayers = this.players.filter((p) => p !== this.controlledPlayer);

    this.homeAI.update(dt, aiPlayers, ballPos, ballVel, this.homeTeam.formation, 'home');
    this.awayAI.update(dt, aiPlayers, ballPos, ballVel, this.awayTeam.formation, 'away');
  }

  private updateBall(dt: number): void {
    this.ball.update(dt);
    this.scene.add(this.ball.mesh.mesh);
  }

  private checkBallPlayerCollision(): void {
    for (const player of this.players) {
      const dist = player.distanceToBall(this.ball.position);
      if (dist < 0.8) {
        const push = {
          x: this.ball.position.x - player.position.x,
          y: 0,
          z: this.ball.position.z - player.position.z,
        };
        const len = Math.hypot(push.x, push.z) || 1;
        if (this.ball.physics.getSpeed() < 2) {
          this.ball.physics.state.position.x = player.position.x + (push.x / len) * 0.6;
          this.ball.physics.state.position.z = player.position.z + (push.z / len) * 0.6;
        }
      }
    }
  }

  private processReferee(dt: number): void {
    if (!this.matchEngine || this.matchState.phase === 'replay') return;

    const decision = this.referee.update(dt, this.ball.physics.state, this.players);
    if (!decision) return;

    this.showStatusMessage(decision.message);

    if (decision.type === 'goal' && decision.team) {
      this.matchEngine.scoreGoal(decision.team);
      this.onGoal(decision.team);
    } else if (decision.setPiece && decision.team) {
      this.matchEngine.setSetPiece(decision.setPiece, decision.team);
      if (decision.type === 'foul') this.audio.playWhistle();
      setTimeout(() => this.resumeFromSetPiece(), 2000);
    }
  }

  private onGoal(_scorer: 'home' | 'away'): void {
    this.updateScoreboard();
    this.camera.setMode('replay');
    this.audio.playGoal();
    this.audio.playNet();

    setTimeout(() => {
      this.ball.reset(0, 0);
      this.matchEngine?.resumePlay();
      this.camera.setMode('broadcast');
      this.resetPositions();
      this.audio.playWhistle();
    }, 3000);
  }

  private resumeFromSetPiece(): void {
    this.matchEngine?.resumePlay();
  }

  private resetPositions(): void {
    const homePositions = getFormationPositions(this.homeTeam.formation, 'home');
    const awayPositions = getFormationPositions(this.awayTeam.formation, 'away');

    this.players.filter((p) => p.teamId === 'home').forEach((p, i) => {
      const pos = homePositions[i] ?? { x: 0, z: 0 };
      p.reset(pos.x, pos.z);
    });
    this.players.filter((p) => p.teamId === 'away').forEach((p, i) => {
      const pos = awayPositions[i] ?? { x: 0, z: 0 };
      p.reset(pos.x, pos.z);
    });
  }

  private switchToNearestPlayer(): void {
    const team = this.controlledPlayer?.teamId ?? 'home';
    let nearest: Player | null = null;
    let minDist = Infinity;

    for (const p of this.players) {
      if (p.teamId !== team) continue;
      const d = p.distanceToBall(this.ball.position);
      if (d < minDist) {
        minDist = d;
        nearest = p;
      }
    }

    if (nearest && nearest !== this.controlledPlayer) {
      this.controlledPlayer?.setControlled(false);
      this.controlledPlayer = nearest;
      nearest.setControlled(true);
    }
  }

  private findPassTarget(from: Player): Player | null {
    let best: Player | null = null;
    let bestScore = -1;

    for (const p of this.players) {
      if (p.teamId !== from.teamId || p === from) continue;
      const dx = p.position.x - from.position.x;
      const dz = p.position.z - from.position.z;
      const forward = from.teamId === 'home' ? dx : -dx;
      if (forward < 0) continue;
      const score = forward - Math.abs(dz) * 0.3;
      if (score > bestScore) {
        bestScore = score;
        best = p;
      }
    }
    return best;
  }

  private getExcitement(): number {
    const speed = this.ball.physics.getSpeed();
    return Math.min(1, speed / 20);
  }

  private updateSkyForLighting(preset: string): void {
    const colors: Record<string, number> = {
      day: 0x87ceeb,
      dusk: 0xff7744,
      night: 0x0a1628,
    };
    const color = colors[preset] ?? 0x87ceeb;
    this.scene.background = new THREE.Color(color);
    this.scene.fog = new THREE.Fog(color, 80, 200);
  }

  private onResize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.camera.resize(w / h);
  }

  private hideMenu(): void {
    document.getElementById('menu')?.classList.add('hidden');
    document.getElementById('controls-hint')?.classList.remove('hidden');
  }

  private showScoreboard(): void {
    document.getElementById('scoreboard')?.classList.remove('hidden');
    document.getElementById('home-team')!.textContent = this.homeTeam.code;
    document.getElementById('away-team')!.textContent = this.awayTeam.code;
  }

  private updateScoreboard(): void {
    const mins = Math.floor(this.matchState.clock / 60);
    const secs = Math.floor(this.matchState.clock % 60);
    document.getElementById('score')!.textContent =
      `${this.matchState.homeScore} - ${this.matchState.awayScore}`;
    const clock = this.matchEngine?.formatClock() ??
      `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    document.getElementById('clock')!.textContent = clock;
  }

  private showStatusMessage(msg: string): void {
    let el = document.getElementById('status-msg');
    if (!el) {
      el = document.createElement('div');
      el.id = 'status-msg';
      el.className = 'hud-panel';
      el.style.cssText = 'top:60px;left:50%;transform:translateX(-50%);font-size:16px;';
      document.getElementById('hud')?.appendChild(el);
    }
    el.textContent = msg;
    setTimeout(() => { if (el) el.textContent = ''; }, 2500);
  }

  private showPowerMeter(power: number): void {
    let meter = document.getElementById('power-meter');
    if (!meter) {
      meter = document.createElement('div');
      meter.id = 'power-meter';
      meter.className = 'power-meter active';
      meter.innerHTML = '<div class="power-meter-fill"></div>';
      document.getElementById('hud')?.appendChild(meter);
    }
    meter.classList.add('active');
    const fill = meter.querySelector('.power-meter-fill') as HTMLElement;
    if (fill) fill.style.width = `${power * 100}%`;
  }

  private hidePowerMeter(): void {
    document.getElementById('power-meter')?.classList.remove('active');
  }

  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }
}
