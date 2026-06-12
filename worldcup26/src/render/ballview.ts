import * as THREE from 'three';
import { Ball } from '../sim/ball';
import { BALL_RADIUS } from '../sim/const';

function ballTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#f4f4f4';
  g.fillRect(0, 0, 256, 128);
  // classic pentagon-ish patches
  g.fillStyle = '#1a1a1a';
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 8; x++) {
      const px = x * 32 + (y % 2) * 16;
      const py = y * 32 + 8;
      g.beginPath();
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
        const r = 9;
        if (k === 0) g.moveTo(px + Math.cos(a) * r, py + Math.sin(a) * r);
        else g.lineTo(px + Math.cos(a) * r, py + Math.sin(a) * r);
      }
      g.fill();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export class BallView {
  mesh: THREE.Mesh;
  private rotAxis = new THREE.Vector3(0, 0, 1);
  private prev = new THREE.Vector3();

  constructor() {
    this.mesh = new THREE.Mesh(
      new THREE.SphereGeometry(BALL_RADIUS, 18, 14),
      new THREE.MeshStandardMaterial({ map: ballTexture(), roughness: 0.4, metalness: 0.02 }),
    );
    this.mesh.castShadow = true;
  }

  update(ball: Ball, dt: number): void {
    this.mesh.position.copy(ball.pos);
    // roll based on horizontal travel
    const dx = ball.pos.x - this.prev.x;
    const dz = ball.pos.z - this.prev.z;
    const dist = Math.hypot(dx, dz);
    if (dist > 1e-5) {
      this.rotAxis.set(dz, 0, -dx).normalize();
      this.mesh.rotateOnWorldAxis(this.rotAxis, dist / BALL_RADIUS);
    }
    this.prev.copy(ball.pos);
    void dt;
  }
}
