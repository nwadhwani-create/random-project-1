import * as THREE from 'three';
import type { Vec3 } from '../data/types';
import { damp } from '../utils/math';

export type CameraMode = 'broadcast' | 'follow' | 'replay' | 'celebration';

export class BroadcastCamera {
  private camera: THREE.PerspectiveCamera;
  private target = new THREE.Vector3();
  private currentPos = new THREE.Vector3(0, 25, 40);
  private mode: CameraMode = 'broadcast';
  private replayTime = 0;
  private celebrationTarget: THREE.Vector3 | null = null;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.target);
  }

  setMode(mode: CameraMode): void {
    this.mode = mode;
    if (mode === 'replay') this.replayTime = 0;
  }

  startCelebration(pos: Vec3): void {
    this.mode = 'celebration';
    this.celebrationTarget = new THREE.Vector3(pos.x, pos.y, pos.z);
  }

  update(
    ballPos: Vec3,
    controlledPlayerPos: Vec3 | null,
    dt: number,
  ): void {
    let desiredPos: THREE.Vector3;
    let lookAt: THREE.Vector3;

    switch (this.mode) {
      case 'broadcast': {
        const bx = ballPos.x;
        const bz = ballPos.z;
        desiredPos = new THREE.Vector3(bx * 0.3, 22 + Math.abs(bz) * 0.05, bz + 38);
        lookAt = new THREE.Vector3(bx * 0.5, 0, bz * 0.3);
        break;
      }
      case 'follow': {
        const px = controlledPlayerPos?.x ?? ballPos.x;
        const pz = controlledPlayerPos?.z ?? ballPos.z;
        desiredPos = new THREE.Vector3(px - 5, 8, pz + 12);
        lookAt = new THREE.Vector3(px, 1, pz);
        break;
      }
      case 'replay': {
        this.replayTime += dt;
        desiredPos = new THREE.Vector3(ballPos.x, 12, ballPos.z + 20);
        lookAt = new THREE.Vector3(ballPos.x, 1, ballPos.z);
        if (this.replayTime > 4) this.mode = 'broadcast';
        break;
      }
      case 'celebration': {
        const ct = this.celebrationTarget ?? new THREE.Vector3();
        desiredPos = new THREE.Vector3(ct.x + 3, 3, ct.z + 5);
        lookAt = ct;
        break;
      }
      default:
        desiredPos = this.currentPos.clone();
        lookAt = this.target.clone();
    }

    this.currentPos.x = damp(this.currentPos.x, desiredPos.x, 3, dt);
    this.currentPos.y = damp(this.currentPos.y, desiredPos.y, 3, dt);
    this.currentPos.z = damp(this.currentPos.z, desiredPos.z, 3, dt);

    this.target.x = damp(this.target.x, lookAt.x, 4, dt);
    this.target.y = damp(this.target.y, lookAt.y, 4, dt);
    this.target.z = damp(this.target.z, lookAt.z, 4, dt);

    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.target);
  }

  getMode(): CameraMode {
    return this.mode;
  }
}
