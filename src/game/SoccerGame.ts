import { MathUtils, Vector3 } from "three";
import { AudioEngine } from "./AudioEngine";
import { BallPhysics, pitchDimensions } from "./BallPhysics";
import { InputController } from "./InputController";
import {
  animateCrowd,
  animatePlayer,
  applyLighting,
  createScene,
  type SceneParts,
} from "./SceneFactory";
import type { InputState, LightingPreset, MatchScore } from "./types";

const lightingCycle: LightingPreset[] = ["day", "dusk", "night"];

export class SoccerGame {
  private readonly parts: SceneParts;
  private readonly input: InputController;
  private readonly physics = new BallPhysics();
  private readonly audio = new AudioEngine();
  private readonly score: MatchScore = { home: 0, away: 0 };
  private readonly playerVelocity = new Vector3();
  private readonly cameraTarget = new Vector3();
  private readonly toastElement: HTMLElement;
  private readonly clockElement: HTMLElement;
  private readonly homeScoreElement: HTMLElement;
  private readonly awayScoreElement: HTMLElement;
  private lightingIndex = 0;
  private elapsed = 0;
  private shotCharge = 0;
  private tackleTimer = 0;
  private lastGoalAt = -10;
  private lastFrame = performance.now();

  constructor(canvas: HTMLCanvasElement, hud: HudElements) {
    this.parts = createScene(canvas);
    this.input = new InputController(hud.inputStatus);
    this.toastElement = hud.toast;
    this.clockElement = hud.clock;
    this.homeScoreElement = hud.homeScore;
    this.awayScoreElement = hud.awayScore;
    applyLighting(this.parts, lightingCycle[this.lightingIndex]);

    window.addEventListener("resize", () => this.resize());
    window.addEventListener("pointerdown", () => void this.audio.ensureStarted(), { once: true });
    window.addEventListener("keydown", () => void this.audio.ensureStarted(), { once: true });
  }

  start(): void {
    this.lastFrame = performance.now();
    this.parts.renderer.setAnimationLoop(() => this.frame());
  }

  private frame(): void {
    const now = performance.now();
    const delta = Math.min((now - this.lastFrame) / 1000, 1 / 30);
    this.lastFrame = now;
    this.elapsed += delta;
    const state = this.input.read();
    this.updatePlayer(state, delta);
    this.updateBallInteractions(state, delta);
    this.updateBall(delta);
    this.updateCamera(delta);
    this.updateHud();
    this.parts.renderer.render(this.parts.scene, this.parts.camera);
  }

  private updatePlayer(state: InputState, delta: number): void {
    if (state.cycleLighting) {
      this.lightingIndex = (this.lightingIndex + 1) % lightingCycle.length;
      applyLighting(this.parts, lightingCycle[this.lightingIndex]);
      this.showToast(`Lighting preset: ${lightingCycle[this.lightingIndex]}`);
    }

    const maxSpeed = state.sprint ? 12.8 : 8.2;
    const desiredVelocity = new Vector3(state.moveX * maxSpeed, 0, state.moveZ * maxSpeed);
    this.playerVelocity.lerp(desiredVelocity, 1 - Math.pow(0.001, delta));
    this.parts.player.root.position.addScaledVector(this.playerVelocity, delta);
    this.parts.player.root.position.x = MathUtils.clamp(
      this.parts.player.root.position.x,
      -pitchDimensions.halfWidth + 1,
      pitchDimensions.halfWidth - 1,
    );
    this.parts.player.root.position.z = MathUtils.clamp(
      this.parts.player.root.position.z,
      -pitchDimensions.halfLength + 1,
      pitchDimensions.halfLength - 1,
    );

    if (this.playerVelocity.lengthSq() > 0.1) {
      const heading = Math.atan2(this.playerVelocity.x, this.playerVelocity.z);
      this.parts.player.root.rotation.y = lerpAngle(this.parts.player.root.rotation.y, heading, 0.18);
    }

    if (state.tackle) {
      this.tackleTimer = 0.45;
      this.showToast("Standing tackle animation");
    }
    this.tackleTimer = Math.max(0, this.tackleTimer - delta);
    animatePlayer(this.parts.player, this.playerVelocity.length(), this.elapsed, this.tackleTimer > 0);
  }

  private updateBallInteractions(state: InputState, delta: number): void {
    const playerPosition = this.parts.player.root.position;
    const ballPosition = this.physics.state.position;
    const toBall = ballPosition.clone().sub(playerPosition);
    const distance = toBall.length();
    const facing = new Vector3(Math.sin(this.parts.player.root.rotation.y), 0, Math.cos(this.parts.player.root.rotation.y));

    if (distance < 1.45 && ballPosition.y < 0.85 && this.tackleTimer === 0) {
      const dribbleTarget = playerPosition.clone().addScaledVector(facing, 1.25);
      const correction = dribbleTarget.sub(ballPosition).multiplyScalar(8.5 * delta);
      this.physics.state.velocity.x += correction.x;
      this.physics.state.velocity.z += correction.z;
    }

    if (state.pass && distance < 2.15) {
      this.physics.kick(facing, 0.34, 0.03, state.moveX * 0.25);
      this.audio.kick(0.34);
      this.showToast("Driven ground pass");
    }

    if (state.shootHeld) {
      this.shotCharge = Math.min(1, this.shotCharge + delta * 0.82);
      this.showToast(`Shot power ${Math.round(this.shotCharge * 100)}%`);
    }

    if (state.shootReleased) {
      if (distance < 2.35) {
        this.physics.kick(facing, Math.max(0.2, this.shotCharge), 0.16, state.moveX * 0.65);
        this.audio.kick(this.shotCharge);
        this.showToast("Shot released");
      }
      this.shotCharge = 0;
    }
  }

  private updateBall(delta: number): void {
    const goal = this.physics.update(delta);
    this.parts.ball.position.copy(this.physics.state.position);
    this.parts.ball.rotation.x += this.physics.state.velocity.z * delta * 1.8;
    this.parts.ball.rotation.z -= this.physics.state.velocity.x * delta * 1.8;

    const attackIntensity = MathUtils.clamp(
      1 - Math.abs(this.physics.state.position.z - pitchDimensions.halfLength) / pitchDimensions.halfLength,
      0,
      1,
    );
    const crowdIntensity = goal ? 1 : Math.max(0.25, attackIntensity);
    animateCrowd(this.parts, this.elapsed, crowdIntensity);
    this.audio.updateCrowdIntensity(crowdIntensity);

    if (goal && this.elapsed - this.lastGoalAt > 1.2) {
      this.lastGoalAt = this.elapsed;
      this.score[goal] += 1;
      this.audio.goal();
      this.showToast(`${goal === "home" ? "USA" : "MEX"} goal! Broadcast camera reset.`);
      window.setTimeout(() => {
        this.physics.reset(goal === "away");
        this.audio.whistle();
      }, 900);
    }
  }

  private updateCamera(delta: number): void {
    const midpoint = this.parts.player.root.position.clone().lerp(this.physics.state.position, 0.55);
    const desired = midpoint.clone().add(new Vector3(0, 21, 31));
    this.parts.camera.position.lerp(desired, 1 - Math.pow(0.025, delta));
    this.cameraTarget.lerp(midpoint, 1 - Math.pow(0.015, delta));
    this.parts.camera.lookAt(this.cameraTarget);
  }

  private updateHud(): void {
    const seconds = Math.floor(this.elapsed);
    const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
    const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
    this.clockElement.textContent = `${minutes}:${remainingSeconds}`;
    this.homeScoreElement.textContent = String(this.score.home);
    this.awayScoreElement.textContent = String(this.score.away);
  }

  private showToast(message: string): void {
    this.toastElement.textContent = message;
  }

  private resize(): void {
    this.parts.camera.aspect = window.innerWidth / window.innerHeight;
    this.parts.camera.updateProjectionMatrix();
    this.parts.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

interface HudElements {
  inputStatus: HTMLElement;
  toast: HTMLElement;
  clock: HTMLElement;
  homeScore: HTMLElement;
  awayScore: HTMLElement;
}

function lerpAngle(current: number, target: number, alpha: number): number {
  const delta = MathUtils.euclideanModulo(target - current + Math.PI, Math.PI * 2) - Math.PI;
  return current + delta * alpha;
}
