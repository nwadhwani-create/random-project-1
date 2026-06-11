import { PITCH, PHYSICS } from '@/core/constants';
import type { BallState, Vec3 } from '@/core/types';

export class BallPhysics {
  state: BallState = {
    position: { x: 0, y: PITCH.BALL_RADIUS, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    spin: { x: 0, y: 0, z: 0 },
    onGround: true,
  };

  private halfL = PITCH.LENGTH / 2;
  private halfW = PITCH.WIDTH / 2;

  reset(x = 0, z = 0): void {
    this.state.position = { x, y: PITCH.BALL_RADIUS, z };
    this.state.velocity = { x: 0, y: 0, z: 0 };
    this.state.spin = { x: 0, y: 0, z: 0 };
    this.state.onGround = true;
  }

  kick(direction: Vec3, power: number, lift = 0): void {
    const len = Math.hypot(direction.x, direction.z) || 1;
    const nx = direction.x / len;
    const nz = direction.z / len;

    this.state.velocity.x = nx * power;
    this.state.velocity.z = nz * power;
    this.state.velocity.y = lift * power * 0.15;

    // Apply curl/spin based on lateral component
    this.state.spin.y = (direction.x * 0.5) * power * 0.02;
    this.state.onGround = lift < 0.1;
  }

  update(dt: number): void {
    const { position, velocity, spin } = this.state;
    const groundY = PITCH.BALL_RADIUS;

    // Gravity
    velocity.y += PHYSICS.GRAVITY * dt;

    // Magnus effect (simplified curl)
    velocity.x += spin.y * dt * 0.3;
    velocity.z -= spin.x * dt * 0.3;

    // Air resistance when airborne
    if (position.y > groundY + 0.01) {
      velocity.x *= PHYSICS.BALL_AIR_RESISTANCE;
      velocity.y *= PHYSICS.BALL_AIR_RESISTANCE;
      velocity.z *= PHYSICS.BALL_AIR_RESISTANCE;
      spin.x *= 0.99;
      spin.y *= 0.99;
      spin.z *= 0.99;
    }

    // Integrate position
    position.x += velocity.x * dt;
    position.y += velocity.y * dt;
    position.z += velocity.z * dt;

    // Ground collision
    if (position.y <= groundY) {
      position.y = groundY;
      if (velocity.y < 0) {
        velocity.y = -velocity.y * PHYSICS.BALL_BOUNCE;
        if (Math.abs(velocity.y) < 0.5) velocity.y = 0;
      }
      velocity.x *= PHYSICS.BALL_FRICTION;
      velocity.z *= PHYSICS.BALL_FRICTION;
      spin.x *= 0.9;
      spin.z *= 0.9;
      this.state.onGround = Math.abs(velocity.y) < 0.1;
    } else {
      this.state.onGround = false;
    }

    // Pitch boundary bounce
    this.bounceWalls();

    // Spin decay on ground
    if (this.state.onGround) {
      spin.y *= 0.95;
    }
  }

  private bounceWalls(): void {
    const { position, velocity } = this.state;
    const goalHalf = PITCH.GOAL_WIDTH / 2;

    // Side lines
    if (position.z < -this.halfW) {
      position.z = -this.halfW;
      velocity.z = -velocity.z * 0.5;
    }
    if (position.z > this.halfW) {
      position.z = this.halfW;
      velocity.z = -velocity.z * 0.5;
    }

    // Goal lines (with goal mouth)
    if (position.x < -this.halfL) {
      if (Math.abs(position.z) > goalHalf) {
        position.x = -this.halfL;
        velocity.x = -velocity.x * 0.5;
      }
    }
    if (position.x > this.halfL) {
      if (Math.abs(position.z) > goalHalf) {
        position.x = this.halfL;
        velocity.x = -velocity.x * 0.5;
      }
    }
  }

  isInGoal(side: 'home' | 'away'): boolean {
    const { position } = this.state;
    const goalHalf = PITCH.GOAL_WIDTH / 2;
    const inMouth = Math.abs(position.z) < goalHalf;
    const belowBar = position.y < PITCH.GOAL_HEIGHT;

    if (side === 'away' && position.x < -this.halfL - 0.5 && inMouth && belowBar) return true;
    if (side === 'home' && position.x > this.halfL + 0.5 && inMouth && belowBar) return true;
    return false;
  }

  isOutOfPlay(): 'goal_home' | 'goal_away' | 'throwin' | 'corner' | 'goalkick' | null {
    const { position } = this.state;
    const goalHalf = PITCH.GOAL_WIDTH / 2;

    if (position.x < -this.halfL) {
      if (Math.abs(position.z) < goalHalf && position.y < PITCH.GOAL_HEIGHT) return 'goal_away';
      if (Math.abs(position.z) >= this.halfW) return 'corner';
      return 'goalkick';
    }
    if (position.x > this.halfL) {
      if (Math.abs(position.z) < goalHalf && position.y < PITCH.GOAL_HEIGHT) return 'goal_home';
      if (Math.abs(position.z) >= this.halfW) return 'corner';
      return 'goalkick';
    }
    if (Math.abs(position.z) > this.halfW) return 'throwin';
    return null;
  }

  getSpeed(): number {
    const { velocity } = this.state;
    return Math.hypot(velocity.x, velocity.y, velocity.z);
  }
}
