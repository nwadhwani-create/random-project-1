import * as THREE from 'three';
import type { Vec3 } from '@/core/types';

export type CameraMode = 'broadcast' | 'follow' | 'replay';

export class CameraController {
  readonly camera: THREE.PerspectiveCamera;
  private mode: CameraMode = 'broadcast';
  private target = new THREE.Vector3();
  private position = new THREE.Vector3(0, 25, 40);
  private damping = 4;

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 500);
    this.camera.position.copy(this.position);
    this.camera.lookAt(this.target);
  }

  setMode(mode: CameraMode): void {
    this.mode = mode;
  }

  toggleMode(): CameraMode {
    const modes: CameraMode[] = ['broadcast', 'follow'];
    const idx = (modes.indexOf(this.mode) + 1) % modes.length;
    this.mode = modes[idx]!;
    return this.mode;
  }

  resize(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  update(dt: number, ballPos: Vec3, focusPlayer?: Vec3): void {
    let desiredPos: THREE.Vector3;
    let lookAt: THREE.Vector3;

    switch (this.mode) {
      case 'follow':
        if (focusPlayer) {
          desiredPos = new THREE.Vector3(
            focusPlayer.x - 8,
            6,
            focusPlayer.z + 12
          );
          lookAt = new THREE.Vector3(focusPlayer.x, 1, focusPlayer.z);
        } else {
          desiredPos = new THREE.Vector3(ballPos.x - 5, 8, ballPos.z + 15);
          lookAt = new THREE.Vector3(ballPos.x, 0, ballPos.z);
        }
        break;
      case 'replay':
        desiredPos = new THREE.Vector3(ballPos.x + 5, 4, ballPos.z + 8);
        lookAt = new THREE.Vector3(ballPos.x, 1, ballPos.z);
        break;
      case 'broadcast':
      default:
        desiredPos = new THREE.Vector3(ballPos.x * 0.6, 28, ballPos.z * 0.4 + 38);
        lookAt = new THREE.Vector3(ballPos.x * 0.3, 0, ballPos.z * 0.3);
        break;
    }

    const t = 1 - Math.exp(-this.damping * dt);
    this.position.lerp(desiredPos, t);
    this.target.lerp(lookAt, t);

    this.camera.position.copy(this.position);
    this.camera.lookAt(this.target);
  }
}
