import * as THREE from 'three';
import type { MatchConfig, LightingPreset } from '../data/types';
import { getTeamById } from '../data/teams';
import { MatchState } from '../match/matchState';
import { InputManager } from '../input/inputManager';
import { UIManager } from '../ui/uiManager';
import { AudioManager } from '../audio/audioManager';
import { PlayerRenderer } from '../rendering/playerRenderer';
import { BroadcastCamera } from '../rendering/camera';
import {
  createPitch, createGoal, createCornerFlag, createStadium,
  createCrowd, createBall, setupLighting, createSkybox, applyLightingPreset,
} from '../rendering/stadium';
import { setupPostProcessing, resizePostProcessing, type PostProcessing } from '../rendering/postProcessing';
import { updatePlayerMovement } from '../physics/playerPhysics';
import { distance2D } from '../utils/math';
import { TournamentManager } from '../match/tournament';

export class GameEngine {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private broadcastCamera: BroadcastCamera;
  private postProcessing: PostProcessing | null = null;
  private playerRenderer: PlayerRenderer;
  private ballMesh: THREE.Mesh;
  private match: MatchState | null = null;
  private input: InputManager;
  private ui: UIManager;
  private audio: AudioManager;
  private tournament: TournamentManager | null = null;
  private running = false;
  private paused = false;
  private lastTime = 0;
  private animationId = 0;
  private lighting: ReturnType<typeof setupLighting> | null = null;
  private currentLighting: LightingPreset = 'day';

  constructor(canvas: HTMLCanvasElement, uiRoot: string) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.5, 300);
    this.broadcastCamera = new BroadcastCamera(this.camera);
    this.playerRenderer = new PlayerRenderer();
    this.ballMesh = createBall();
    this.input = new InputManager();
    this.audio = new AudioManager();
    this.ui = new UIManager(uiRoot);

    this.setupScene();
    this.setupUI();
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
  }

  private setupScene(): void {
    this.currentLighting = 'day';
    createSkybox(this.scene, this.currentLighting);
    this.lighting = setupLighting(this.scene, this.currentLighting);

    this.scene.add(createPitch());
    this.scene.add(createStadium());
    this.scene.add(createGoal(1));
    this.scene.add(createGoal(-1));

    const hl = 105 / 2;
    const hw = 68 / 2;
    for (const [x, z] of [[hl, hw], [hl, -hw], [-hl, hw], [-hl, -hw]] as [number, number][]) {
      this.scene.add(createCornerFlag(x, z));
    }

    this.scene.add(createCrowd(1500));
    this.scene.add(this.playerRenderer.container);
    this.scene.add(this.ballMesh);

    this.postProcessing = setupPostProcessing(
      this.renderer, this.scene, this.camera,
      window.innerWidth, window.innerHeight,
      window.innerWidth > 1280,
    );
  }

  private setupUI(): void {
    this.ui.onStartMatch = (config) => this.startMatch(config);
    this.ui.onStartTournament = (teamId) => this.startTournament(teamId);
    this.ui.onStartPenalties = (home, away) => {
      this.startMatch({
        homeTeamId: home,
        awayTeamId: away,
        halfLengthMinutes: 3,
        difficulty: 'medium',
        isKnockout: true,
        lighting: 'night',
      });
    };
  }

  startMatch(config: MatchConfig): void {
    const home = getTeamById(config.homeTeamId);
    const away = getTeamById(config.awayTeamId);
    if (!home || !away) return;

    if (config.lighting !== this.currentLighting) {
      this.currentLighting = config.lighting;
      createSkybox(this.scene, this.currentLighting);
      if (this.lighting) applyLightingPreset(this.lighting, this.currentLighting);
    }

    this.cleanupMatch();
    this.match = new MatchState(config, home, away);

    for (const player of this.match.players) {
      const kit = player.team === 'home' ? home.kitHome : away.kitAway;
      this.playerRenderer.addPlayer(player, kit);
    }

    this.ui.showLineup(config.homeTeamId, config.awayTeamId, () => {
      this.ui.showHUD();
      this.match!.start();
      this.match!.phase = 'playing';
      this.audio.init();
      this.audio.playWhistle();
      this.running = true;
      this.paused = false;
      this.lastTime = performance.now();
      this.animate();
    });
  }

  startTournament(teamId: string): void {
    this.tournament = new TournamentManager(teamId);
    const next = this.tournament.getNextUserMatch();
    if (next) {
      this.startMatch({
        homeTeamId: next.homeId,
        awayTeamId: next.awayId,
        halfLengthMinutes: 5,
        difficulty: 'medium',
        isKnockout: false,
        lighting: 'day',
      });
    }
  }

  private cleanupMatch(): void {
    this.playerRenderer.clear();
    this.match = null;
    cancelAnimationFrame(this.animationId);
    document.getElementById('hud')?.remove();
  }

  private handleResize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    if (this.postProcessing) resizePostProcessing(this.postProcessing, w, h);
  }

  private animate = (): void => {
    if (!this.running) return;
    this.animationId = requestAnimationFrame(this.animate);

    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;

    if (!this.paused && this.match) {
      this.update(dt);
    }

    if (this.postProcessing?.enabled) {
      this.postProcessing.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  };

  private update(dt: number): void {
    const match = this.match!;
    this.input.update();

    if (this.input.justPressed('pause')) {
      this.paused = true;
      this.ui.showPauseMenu(
        () => { this.paused = false; },
        () => { this.running = false; this.cleanupMatch(); this.ui.showMainMenu(); },
      );
      return;
    }

    const controlled = match.getControlledPlayer();
    if (controlled) {
      updatePlayerMovement(
        controlled,
        this.input.state.moveX,
        this.input.state.moveZ,
        dt,
        this.input.state.sprint,
      );

      if (this.input.justPressed('pass')) match.handlePass(controlled, false);
      if (this.input.justPressed('lob')) match.handlePass(controlled, true);
      if (this.input.justPressed('shoot')) match.handleShoot(controlled, this.input.state.power);
      if (this.input.justPressed('tackle')) match.handleTackle(controlled, false);
      if (this.input.justPressed('slideTackle')) match.handleTackle(controlled, true);
      if (this.input.justPressed('switchPlayer')) match.switchPlayer(controlled.team);
      if (this.input.justPressed('goalkeeper')) {
        const gk = match.players.find((p) => p.team === controlled.team && p.role === 'GK');
        if (gk) {
          controlled.isControlled = false;
          gk.isControlled = true;
          match.controlledPlayerId = gk.id;
        }
      }

      const ballDist = distance2D(controlled.position, match.ball.state.position);
      if (ballDist < 1.2 && !match.ball.isMoving()) {
        match.ball.state.position.x = controlled.position.x + Math.sin(controlled.rotation) * 0.5;
        match.ball.state.position.z = controlled.position.z + Math.cos(controlled.rotation) * 0.5;
      }
    }

    const attackingTeam = match.ball.state.lastTouchedTeam ?? 'home';
    match.homeAI.update(match.players.filter((p) => p.team === 'home'), match.ball, dt, attackingTeam);
    match.awayAI.update(match.players.filter((p) => p.team === 'away'), match.ball, dt, attackingTeam);

    const prevScore = { ...match.score };
    match.update(dt);

    if (match.score.home > prevScore.home || match.score.away > prevScore.away) {
      const scorer = match.score.home > prevScore.home ? match.homeTeam.name : match.awayTeam.name;
      this.ui.showEvent(`GOAL! ${scorer}`);
      this.audio.playGoal();
      this.audio.playNet();
      this.broadcastCamera.setMode('replay');
    }

    this.playerRenderer.update(match.players, dt);

    const bs = match.ball.state;
    this.ballMesh.position.set(bs.position.x, bs.position.y, bs.position.z);
    this.ballMesh.rotation.x += bs.angularVelocity.x * dt;
    this.ballMesh.rotation.y += bs.angularVelocity.y * dt;

    const cp = match.getControlledPlayer();
    this.broadcastCamera.update(bs.position, cp?.position ?? null, dt);

    const shootHeld = this.input.state.power > 0 && !this.input.state.shoot;
    this.ui.updateHUD(
      match.homeTeam.code, match.awayTeam.code,
      match.score.home, match.score.away,
      match.clock.minute, match.clock.second,
      this.input.state.power, shootHeld,
    );

    const ballSpeed = Math.hypot(bs.velocity.x, bs.velocity.z);
    this.audio.setCrowdIntensity(0.3 + ballSpeed * 0.02);
    this.audio.update(dt);
  }
}
