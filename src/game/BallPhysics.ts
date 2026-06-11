import { Vector3 } from "three";
import type { BallState } from "./types";

const PITCH_HALF_WIDTH = 34;
const PITCH_HALF_LENGTH = 52.5;
const GOAL_HALF_WIDTH = 3.66;
const BALL_RADIUS = 0.38;

export class BallPhysics {
  readonly state: BallState = {
    position: new Vector3(0, BALL_RADIUS, -5),
    velocity: new Vector3(),
    spin: new Vector3(),
  };

  update(delta: number): "home" | "away" | null {
    this.state.velocity.y -= 17.2 * delta;
    this.state.velocity.x += this.state.spin.z * 0.16 * delta;
    this.state.velocity.z -= this.state.spin.x * 0.16 * delta;
    this.state.position.addScaledVector(this.state.velocity, delta);

    if (this.state.position.y < BALL_RADIUS) {
      this.state.position.y = BALL_RADIUS;
      if (Math.abs(this.state.velocity.y) > 1.5) {
        this.state.velocity.y *= -0.48;
      } else {
        this.state.velocity.y = 0;
      }
      const friction = Math.max(0, 1 - 1.85 * delta);
      this.state.velocity.x *= friction;
      this.state.velocity.z *= friction;
    }

    this.state.spin.multiplyScalar(Math.max(0, 1 - 0.9 * delta));

    const goal = this.detectGoal();
    if (goal) return goal;

    if (Math.abs(this.state.position.x) > PITCH_HALF_WIDTH) {
      this.state.position.x = Math.sign(this.state.position.x) * PITCH_HALF_WIDTH;
      this.state.velocity.x *= -0.42;
    }

    if (Math.abs(this.state.position.z) > PITCH_HALF_LENGTH) {
      this.state.position.z = Math.sign(this.state.position.z) * PITCH_HALF_LENGTH;
      this.state.velocity.z *= -0.42;
    }

    return null;
  }

  kick(direction: Vector3, power: number, lift = 0.08, curl = 0): void {
    const clampedPower = Math.min(Math.max(power, 0), 1);
    const shot = direction.clone().normalize();
    this.state.velocity.copy(shot.multiplyScalar(10 + clampedPower * 30));
    this.state.velocity.y = lift * 26 + clampedPower * 8;
    this.state.spin.set(curl * 6, 0, -curl * 5);
  }

  reset(towardAwayGoal = true): void {
    this.state.position.set(0, BALL_RADIUS, towardAwayGoal ? -5 : 5);
    this.state.velocity.set(0, 0, 0);
    this.state.spin.set(0, 0, 0);
  }

  private detectGoal(): "home" | "away" | null {
    const insideGoalMouth = Math.abs(this.state.position.x) < GOAL_HALF_WIDTH && this.state.position.y < 2.8;
    if (!insideGoalMouth) return null;
    if (this.state.position.z < -PITCH_HALF_LENGTH - 0.7) return "home";
    if (this.state.position.z > PITCH_HALF_LENGTH + 0.7) return "away";
    return null;
  }
}

export const pitchDimensions = {
  halfWidth: PITCH_HALF_WIDTH,
  halfLength: PITCH_HALF_LENGTH,
  goalHalfWidth: GOAL_HALF_WIDTH,
  ballRadius: BALL_RADIUS,
};
