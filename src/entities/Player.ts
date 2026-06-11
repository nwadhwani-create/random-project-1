import * as THREE from 'three';
import { PlayerPhysics } from '@/physics/PlayerPhysics';
import { PlayerMeshFactory } from '@/rendering/PlayerMesh';
import type { PlayerAnimation, PlayerData, Vec3 } from '@/core/types';

export class Player {
  readonly id: string;
  readonly teamId: 'home' | 'away';
  readonly data: PlayerData;
  readonly physics = new PlayerPhysics();
  readonly mesh: THREE.Group;
  isControlled = false;
  animation: PlayerAnimation = 'idle';

  constructor(
    data: PlayerData,
    teamId: 'home' | 'away',
    primaryColor: number,
    secondaryColor: number
  ) {
    this.id = data.id;
    this.teamId = teamId;
    this.data = data;
    this.mesh = PlayerMeshFactory.create({
      primaryColor,
      secondaryColor,
      number: data.number,
      name: data.name,
      skinTone: data.skinTone,
      hairColor: data.hairColor,
      height: data.height,
    });
  }

  get position(): Vec3 {
    return this.physics.position;
  }

  reset(x: number, z: number): void {
    this.physics.reset(x, z);
    this.syncMesh();
  }

  update(
    dt: number,
    moveX: number,
    moveZ: number,
    sprint: boolean
  ): void {
    const paceMod = 0.7 + (this.data.ratings.pace / 99) * 0.3;
    this.physics.update(dt, moveX, moveZ, sprint, paceMod);

    const speed = Math.hypot(this.physics.velocity.x, this.physics.velocity.z);
    if (speed > 7) this.animation = 'sprint';
    else if (speed > 0.5) this.animation = 'run';
    else this.animation = 'idle';

    this.syncMesh();
    PlayerMeshFactory.animate(this.mesh, this.animation, speed, dt);
  }

  syncMesh(): void {
    this.mesh.position.set(
      this.physics.position.x,
      0,
      this.physics.position.z
    );
    this.mesh.rotation.y = this.physics.rotation;
  }

  distanceToBall(ballPos: Vec3): number {
    return this.physics.distanceTo(ballPos);
  }

  setControlled(controlled: boolean): void {
    this.isControlled = controlled;
    if (controlled) {
      const ring = this.mesh.getObjectByName('controlRing');
      if (!ring) {
        const ringGeo = new THREE.RingGeometry(0.5, 0.6, 16);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xffd700,
          transparent: true,
          opacity: 0.7,
          side: THREE.DoubleSide,
        });
        const newRing = new THREE.Mesh(ringGeo, ringMat);
        newRing.rotation.x = -Math.PI / 2;
        newRing.position.y = 0.05;
        newRing.name = 'controlRing';
        this.mesh.add(newRing);
      }
    } else {
      const ring = this.mesh.getObjectByName('controlRing');
      if (ring) this.mesh.remove(ring);
    }
  }
}
