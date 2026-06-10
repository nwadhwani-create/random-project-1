import * as THREE from 'three';
import { BALL_RADIUS, GRAVITY, GOAL_HALF_W, GOAL_HEIGHT, GOAL_DEPTH, HALF_L, POST_RADIUS } from './const';

export interface BallTouch {
  teamIdx: number;
  playerIdx: number;
  time: number;
}

const tmp = new THREE.Vector3();
const tmp2 = new THREE.Vector3();

/**
 * Lightweight ball physics: gravity, quadratic air drag, Magnus lift from spin,
 * ground bounce + rolling friction, goal frame and net collision.
 */
export class Ball {
  pos = new THREE.Vector3(0, BALL_RADIUS, 0);
  vel = new THREE.Vector3();
  spin = new THREE.Vector3(); // rad/s, axis = angular velocity
  /** player currently dribbling, or null when ball is loose */
  owner: { teamIdx: number; playerIdx: number } | null = null;
  lastTouch: BallTouch | null = null;
  prevTouch: BallTouch | null = null;
  // events for audio/fx
  justBounced = false;
  justHitNet = false;
  justHitPost = false;

  reset(x = 0, z = 0): void {
    this.pos.set(x, BALL_RADIUS, z);
    this.vel.set(0, 0, 0);
    this.spin.set(0, 0, 0);
    this.owner = null;
  }

  kick(v: THREE.Vector3, spin?: THREE.Vector3): void {
    this.vel.copy(v);
    if (spin) this.spin.copy(spin); else this.spin.set(0, 0, 0);
    this.owner = null;
  }

  touch(teamIdx: number, playerIdx: number, time: number): void {
    if (!this.lastTouch || this.lastTouch.teamIdx !== teamIdx || this.lastTouch.playerIdx !== playerIdx) {
      this.prevTouch = this.lastTouch;
    }
    this.lastTouch = { teamIdx, playerIdx, time };
  }

  get speed(): number { return this.vel.length(); }

  step(dt: number): void {
    this.justBounced = this.justHitNet = this.justHitPost = false;
    if (this.owner) return; // ball glued to dribbler, positioned externally

    const v = this.vel;
    const speed = v.length();

    // gravity
    v.y -= GRAVITY * dt;

    // air drag: a = -kd * |v| * v   (kd tuned for a football)
    if (speed > 0.01) {
      const kd = 0.012;
      tmp.copy(v).multiplyScalar(-kd * speed * dt);
      v.add(tmp);
      // Magnus: a = km * (spin x v)
      tmp.copy(this.spin).cross(v).multiplyScalar(0.0045 * dt);
      v.add(tmp);
    }

    this.pos.addScaledVector(v, dt);

    // ground contact
    if (this.pos.y < BALL_RADIUS) {
      this.pos.y = BALL_RADIUS;
      if (v.y < -0.8) {
        v.y = -v.y * 0.62; // bounce
        v.x *= 0.78; v.z *= 0.78;
        this.spin.multiplyScalar(0.6);
        this.justBounced = true;
      } else {
        v.y = 0;
        // rolling resistance
        const f = Math.max(0, 1 - 0.55 * dt - (0.25 * dt) / Math.max(0.4, Math.hypot(v.x, v.z)));
        v.x *= f; v.z *= f;
        this.spin.multiplyScalar(1 - 1.6 * dt);
        if (Math.hypot(v.x, v.z) < 0.05) { v.x = 0; v.z = 0; }
      }
    }

    this.collideGoals(dt);
  }

  private collideGoals(dt: number): void {
    for (const side of [1, -1]) {
      const lineX = HALF_L * side;
      // posts
      for (const pz of [-GOAL_HALF_W, GOAL_HALF_W]) {
        const dx = this.pos.x - lineX;
        const dz = this.pos.z - pz;
        const d2 = dx * dx + dz * dz;
        const r = POST_RADIUS + BALL_RADIUS;
        if (this.pos.y < GOAL_HEIGHT + 0.1 && d2 < r * r && d2 > 1e-7) {
          const d = Math.sqrt(d2);
          const nx = dx / d, nz = dz / d;
          const dot = this.vel.x * nx + this.vel.z * nz;
          if (dot < 0) {
            this.vel.x -= 2 * dot * nx * 0.85;
            this.vel.z -= 2 * dot * nz * 0.85;
            this.justHitPost = true;
          }
          this.pos.x = lineX + nx * r;
          this.pos.z = pz + nz * r;
        }
      }
      // crossbar
      {
        const dx = this.pos.x - lineX;
        const dy = this.pos.y - GOAL_HEIGHT;
        const r = POST_RADIUS + BALL_RADIUS;
        if (Math.abs(this.pos.z) < GOAL_HALF_W + 0.2 && dx * dx + dy * dy < r * r) {
          const d = Math.hypot(dx, dy) || 1e-4;
          const nx = dx / d, ny = dy / d;
          const dot = this.vel.x * nx + this.vel.y * ny;
          if (dot < 0) {
            this.vel.x -= 2 * dot * nx * 0.8;
            this.vel.y -= 2 * dot * ny * 0.8;
            this.justHitPost = true;
          }
          this.pos.x = lineX + nx * r;
          this.pos.y = GOAL_HEIGHT + ny * r;
        }
      }
      // net: volume behind goal line within frame
      const behind = (this.pos.x - lineX) * side;
      if (behind > 0 && behind < GOAL_DEPTH + 0.4 && Math.abs(this.pos.z) < GOAL_HALF_W + 0.4 && this.pos.y < GOAL_HEIGHT + 0.3) {
        const sp = this.vel.length();
        if (sp > 2 && behind > 0.25) {
          // hit the back/side netting: kill most velocity
          this.vel.multiplyScalar(Math.max(0, 1 - 8 * dt));
          tmp2.set(-side, 0, 0).multiplyScalar(Math.min(sp, 4) * 0.4);
          this.vel.add(tmp2.multiplyScalar(dt * 8));
          if (sp > 4) this.justHitNet = true;
        }
        // hard wall at back of net
        if (behind > GOAL_DEPTH) {
          this.pos.x = (HALF_L + GOAL_DEPTH) * side;
          this.vel.x *= -0.2;
        }
        if (Math.abs(this.pos.z) > GOAL_HALF_W - BALL_RADIUS && behind > 0.1) {
          this.vel.z *= 0.5;
        }
      }
    }
  }
}
