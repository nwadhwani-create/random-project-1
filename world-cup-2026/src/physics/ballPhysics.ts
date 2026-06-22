import type { Vec3 } from '../data/types';
import { PITCH } from '../data/types';

export interface BallState {
  position: Vec3;
  velocity: Vec3;
  angularVelocity: Vec3;
  onGround: boolean;
  lastTouchedBy: string | null;
  lastTouchedTeam: 'home' | 'away' | null;
}

export class BallPhysics {
  readonly state: BallState = {
    position: { x: 0, y: PITCH.BALL_RADIUS, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    angularVelocity: { x: 0, y: 0, z: 0 },
    onGround: true,
    lastTouchedBy: null,
    lastTouchedTeam: null,
  };

  private readonly gravity = -9.81;
  private readonly groundFriction = 0.985;
  private readonly airDrag = 0.998;
  private readonly bounceRestitution = 0.65;
  private readonly spinDecay = 0.99;

  reset(x = 0, z = 0): void {
    this.state.position = { x, y: PITCH.BALL_RADIUS, z };
    this.state.velocity = { x: 0, y: 0, z: 0 };
    this.state.angularVelocity = { x: 0, y: 0, z: 0 };
    this.state.onGround = true;
    this.state.lastTouchedBy = null;
    this.state.lastTouchedTeam = null;
  }

  kick(
    direction: Vec3,
    power: number,
    loft = 0,
    curl = 0,
    playerId?: string,
    team?: 'home' | 'away',
  ): void {
    const speed = power * 28;
    const hLen = Math.hypot(direction.x, direction.z) || 1;
    this.state.velocity.x = (direction.x / hLen) * speed;
    this.state.velocity.z = (direction.z / hLen) * speed;
    this.state.velocity.y = loft * speed * 0.55;
    this.state.angularVelocity.y = curl * 12;
    this.state.onGround = loft < 0.05;
    if (playerId) this.state.lastTouchedBy = playerId;
    if (team) this.state.lastTouchedTeam = team;
  }

  applyForce(force: Vec3): void {
    this.state.velocity.x += force.x;
    this.state.velocity.y += force.y;
    this.state.velocity.z += force.z;
  }

  update(dt: number): { goal: 'home' | 'away' | null; outOfPlay: boolean } {
    const s = this.state;
    const r = PITCH.BALL_RADIUS;

    s.velocity.y += this.gravity * dt;
    s.position.x += s.velocity.x * dt;
    s.position.y += s.velocity.y * dt;
    s.position.z += s.velocity.z * dt;

    // Magnus effect from spin
    s.velocity.x += s.angularVelocity.y * s.velocity.z * 0.015 * dt;
    s.velocity.z -= s.angularVelocity.y * s.velocity.x * 0.015 * dt;

    s.angularVelocity.x *= this.spinDecay;
    s.angularVelocity.y *= this.spinDecay;
    s.angularVelocity.z *= this.spinDecay;

    // Ground collision
    if (s.position.y <= r) {
      s.position.y = r;
      if (s.velocity.y < -0.5) {
        s.velocity.y = -s.velocity.y * this.bounceRestitution;
        s.velocity.x *= 0.92;
        s.velocity.z *= 0.92;
      } else {
        s.velocity.y = 0;
        s.onGround = true;
      }
    } else {
      s.onGround = false;
    }

    // Friction
    const friction = s.onGround ? this.groundFriction : this.airDrag;
    s.velocity.x *= friction;
    s.velocity.z *= friction;
    if (!s.onGround) s.velocity.y *= this.airDrag;

    // Pitch boundaries
    const halfL = PITCH.LENGTH / 2;
    const halfW = PITCH.WIDTH / 2;
    let outOfPlay = false;

    if (Math.abs(s.position.z) > halfW) {
      outOfPlay = true;
    }

    // Goal detection
    const goalHalf = PITCH.GOAL_WIDTH / 2;
    const inGoalMouth =
      Math.abs(s.position.z) < goalHalf &&
      s.position.y < PITCH.GOAL_HEIGHT;

    if (s.position.x < -halfL) {
      if (inGoalMouth) return { goal: 'away', outOfPlay: true };
      outOfPlay = true;
      s.position.x = -halfL;
      s.velocity.x *= -0.5;
    }
    if (s.position.x > halfL) {
      if (inGoalMouth) return { goal: 'home', outOfPlay: true };
      outOfPlay = true;
      s.position.x = halfL;
      s.velocity.x *= -0.5;
    }

    if (Math.abs(s.position.z) > halfW) {
      s.position.z = Math.sign(s.position.z) * halfW;
      s.velocity.z *= -0.5;
    }

    return { goal: null, outOfPlay };
  }

  isMoving(): boolean {
    const s = this.state;
    return Math.hypot(s.velocity.x, s.velocity.z) > 0.3 || Math.abs(s.velocity.y) > 0.3;
  }
}
