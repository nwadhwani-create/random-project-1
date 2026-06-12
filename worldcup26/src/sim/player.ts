import * as THREE from 'three';
import type { PlayerData } from '../data/types';
import type { Role } from './formations';

export type PlayerState =
  | 'idle' | 'run' | 'kick' | 'slide' | 'fall' | 'dive'
  | 'celebrate' | 'throw' | 'header';

const tmp = new THREE.Vector3();

export class PlayerSim {
  pos = new THREE.Vector3();
  vel = new THREE.Vector3();
  /** desired move target set by AI / user each frame */
  moveTarget = new THREE.Vector3();
  facing = 0; // radians, 0 = +x
  sprinting = false;
  state: PlayerState = 'idle';
  stateTime = 0;
  /** generic action lockout (can't kick/tackle while > 0) */
  cooldown = 0;
  /** time until this player may regain a loose ball (after passing/being tackled) */
  ballLock = 0;
  stamina = 1;
  hasBall = false;
  yellow = 0;
  sentOff = false;
  /** dive direction for GK animation */
  diveDir = new THREE.Vector3();
  kickFoot = 1; // 1 right, -1 left, alternates for looks

  readonly maxSprint: number;
  readonly maxJog: number;
  readonly accel: number;

  constructor(
    public readonly teamIdx: number,
    public readonly idx: number,
    public readonly data: PlayerData,
    public readonly role: Role,
  ) {
    const pace = data.attrs.pace;
    this.maxSprint = 6.1 + (pace / 100) * 3.1; // 6.1 - 9.2 m/s
    this.maxJog = this.maxSprint * 0.66;
    this.accel = 9 + (data.attrs.physical / 100) * 7;
  }

  get isGK(): boolean { return this.role === 'GK'; }

  get controllable(): boolean {
    return !this.sentOff && this.state !== 'fall' && this.state !== 'slide' && this.state !== 'dive' && this.state !== 'celebrate' && this.state !== 'throw';
  }

  setState(s: PlayerState): void {
    if (this.state !== s) { this.state = s; this.stateTime = 0; }
  }

  /** instantly place the player (restarts) */
  warp(x: number, z: number, facing?: number): void {
    this.pos.set(x, 0, z);
    this.vel.set(0, 0, 0);
    this.moveTarget.copy(this.pos);
    if (facing !== undefined) this.facing = facing;
    this.setState('idle');
    this.hasBall = false;
  }

  step(dt: number, speedMul = 1): void {
    this.stateTime += dt;
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.ballLock = Math.max(0, this.ballLock - dt);

    // non-locomotion states play out, body may keep sliding
    if (this.state === 'slide') {
      this.pos.addScaledVector(this.vel, dt);
      this.vel.multiplyScalar(1 - 3.2 * dt);
      if (this.stateTime > 0.62) this.setState('idle');
      return;
    }
    if (this.state === 'fall') {
      this.vel.multiplyScalar(1 - 6 * dt);
      this.pos.addScaledVector(this.vel, dt);
      if (this.stateTime > 0.95) this.setState('idle');
      return;
    }
    if (this.state === 'dive') {
      this.pos.addScaledVector(this.vel, dt);
      this.vel.multiplyScalar(1 - 2.5 * dt);
      if (this.stateTime > 0.9) this.setState('idle');
      return;
    }
    if (this.state === 'kick' || this.state === 'throw' || this.state === 'header') {
      this.vel.multiplyScalar(1 - 8 * dt);
      this.pos.addScaledVector(this.vel, dt);
      if (this.stateTime > (this.state === 'kick' ? 0.32 : 0.6)) this.setState('idle');
      return;
    }
    if (this.state === 'celebrate') {
      this.vel.set(0, 0, 0);
      return;
    }

    // locomotion toward moveTarget
    tmp.copy(this.moveTarget).sub(this.pos);
    tmp.y = 0;
    const dist = tmp.length();
    let desiredSpeed = 0;
    if (dist > 0.08) {
      const max = (this.sprinting ? this.maxSprint * (0.82 + 0.18 * this.stamina) : this.maxJog) * speedMul;
      desiredSpeed = Math.min(max, dist * 4.5);
      tmp.normalize().multiplyScalar(desiredSpeed);
    } else {
      tmp.set(0, 0, 0);
    }
    // dribbling slows you down
    if (this.hasBall) tmp.multiplyScalar(0.82 + 0.13 * (this.data.attrs.dribbling / 100));

    // steer velocity toward desired
    const steer = this.accel * dt;
    this.vel.x += THREE.MathUtils.clamp(tmp.x - this.vel.x, -steer, steer);
    this.vel.z += THREE.MathUtils.clamp(tmp.z - this.vel.z, -steer, steer);
    this.pos.addScaledVector(this.vel, dt);

    const sp = Math.hypot(this.vel.x, this.vel.z);
    if (sp > 0.4) {
      const want = Math.atan2(this.vel.z, this.vel.x);
      let d = want - this.facing;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      this.facing += THREE.MathUtils.clamp(d, -10 * dt, 10 * dt);
      this.setState('run');
    } else if (this.state === 'run') {
      this.setState('idle');
    }

    // stamina
    if (this.sprinting && sp > this.maxJog) this.stamina = Math.max(0.25, this.stamina - 0.022 * dt);
    else this.stamina = Math.min(1, this.stamina + 0.012 * dt);
  }

  /** begin a kicking animation + action lockout */
  startKick(): void {
    this.setState('kick');
    this.kickFoot *= -1;
    this.cooldown = 0.42;
  }

  startSlide(dir: THREE.Vector3): void {
    this.setState('slide');
    this.vel.copy(dir).setY(0).normalize().multiplyScalar(this.maxSprint * 1.12);
    this.facing = Math.atan2(this.vel.z, this.vel.x);
    this.cooldown = 1.0;
  }

  startDive(dir: THREE.Vector3): void {
    this.setState('dive');
    this.diveDir.copy(dir);
    this.vel.copy(dir).setY(0).multiplyScalar(1);
    this.cooldown = 0.9;
  }

  knockDown(): void {
    this.setState('fall');
    this.hasBall = false;
    this.cooldown = 1.0;
  }
}
