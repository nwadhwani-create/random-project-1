import * as THREE from 'three';
import { PITCH } from '@/core/constants';

export class BallMesh {
  readonly mesh: THREE.Mesh;

  constructor() {
    const geo = new THREE.SphereGeometry(PITCH.BALL_RADIUS, 24, 24);

    // Procedural soccer ball pattern
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 512, 256);

    ctx.fillStyle = '#1a1a1a';
    const drawPent = (cx: number, cy: number, r: number) => {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    };

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 5; col++) {
        drawPent(50 + col * 100 + (row % 2) * 50, 50 + row * 100, 30);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);

    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.4,
      metalness: 0.0,
    });

    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.castShadow = true;
  }

  sync(position: { x: number; y: number; z: number }, velocity: { x: number; y: number; z: number }, dt: number): void {
    this.mesh.position.set(position.x, position.y, position.z);

    const speed = Math.hypot(velocity.x, velocity.z);
    if (speed > 0.1) {
      this.mesh.rotation.x += velocity.z * dt * 2;
      this.mesh.rotation.z -= velocity.x * dt * 2;
    }
  }
}
