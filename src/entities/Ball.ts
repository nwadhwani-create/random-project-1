import { BallPhysics } from '@/physics/BallPhysics';
import { BallMesh } from '@/rendering/BallMesh';
import type { Vec3 } from '@/core/types';

export class Ball {
  readonly physics = new BallPhysics();
  readonly mesh = new BallMesh();

  get position(): Vec3 {
    return this.physics.state.position;
  }

  reset(x = 0, z = 0): void {
    this.physics.reset(x, z);
    this.syncMesh(0);
  }

  kick(direction: Vec3, power: number, lift = 0): void {
    this.physics.kick(direction, power, lift);
  }

  update(dt: number): void {
    this.physics.update(dt);
    this.syncMesh(dt);
  }

  private syncMesh(dt: number): void {
    const { position, velocity } = this.physics.state;
    this.mesh.sync(position, velocity, dt);
  }
}
