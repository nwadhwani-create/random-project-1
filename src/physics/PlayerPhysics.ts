import { PHYSICS, PITCH } from '@/core/constants';
import type { Vec3 } from '@/core/types';

export class PlayerPhysics {
  position: Vec3 = { x: 0, y: 0, z: 0 };
  velocity: Vec3 = { x: 0, y: 0, z: 0 };
  rotation = 0;
  isSprinting = false;

  private halfL = PITCH.LENGTH / 2 - 1;
  private halfW = PITCH.WIDTH / 2 - 1;

  update(
    dt: number,
    moveX: number,
    moveZ: number,
    sprint: boolean,
    paceMod = 1
  ): void {
    this.isSprinting = sprint;

    const maxSpeed = (sprint ? PHYSICS.PLAYER_SPRINT_SPEED : PHYSICS.PLAYER_MAX_SPEED) * paceMod;
    const targetVx = moveX * maxSpeed;
    const targetVz = moveZ * maxSpeed;

    const accel = PHYSICS.PLAYER_ACCELERATION;
    const decel = PHYSICS.PLAYER_DECELERATION;

    if (moveX !== 0 || moveZ !== 0) {
      this.velocity.x += (targetVx - this.velocity.x) * Math.min(1, accel * dt);
      this.velocity.z += (targetVz - this.velocity.z) * Math.min(1, accel * dt);
      this.rotation = Math.atan2(this.velocity.x, this.velocity.z);
    } else {
      this.velocity.x *= Math.max(0, 1 - decel * dt);
      this.velocity.z *= Math.max(0, 1 - decel * dt);
      if (Math.abs(this.velocity.x) < 0.01) this.velocity.x = 0;
      if (Math.abs(this.velocity.z) < 0.01) this.velocity.z = 0;
    }

    this.position.x += this.velocity.x * dt;
    this.position.z += this.velocity.z * dt;

    // Clamp to pitch
    this.position.x = Math.max(-this.halfL, Math.min(this.halfL, this.position.x));
    this.position.z = Math.max(-this.halfW, Math.min(this.halfW, this.position.z));
  }

  distanceTo(target: Vec3): number {
    return Math.hypot(target.x - this.position.x, target.z - this.position.z);
  }

  reset(x: number, z: number): void {
    this.position = { x, y: 0, z };
    this.velocity = { x: 0, y: 0, z: 0 };
  }
}
