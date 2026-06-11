import * as THREE from 'three';
import type { LightingPreset } from '@/core/constants';

export class LightingSystem {
  readonly sun: THREE.DirectionalLight;
  readonly ambient: THREE.AmbientLight;
  readonly floodlights: THREE.SpotLight[] = [];
  private preset: LightingPreset = 'day';

  constructor(scene: THREE.Scene) {
    this.ambient = new THREE.AmbientLight(0x404060, 0.4);
    scene.add(this.ambient);

    this.sun = new THREE.DirectionalLight(0xfff5e6, 1.2);
    this.sun.position.set(50, 80, 30);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.near = 10;
    this.sun.shadow.camera.far = 200;
    this.sun.shadow.camera.left = -60;
    this.sun.shadow.camera.right = 60;
    this.sun.shadow.camera.top = 60;
    this.sun.shadow.camera.bottom = -60;
    this.sun.shadow.bias = -0.0005;
    scene.add(this.sun);
    scene.add(this.sun.target);

    this.applyPreset('day');
  }

  applyPreset(preset: LightingPreset): void {
    this.preset = preset;

    switch (preset) {
      case 'day':
        this.ambient.color.set(0x87ceeb);
        this.ambient.intensity = 0.5;
        this.sun.color.set(0xfff5e6);
        this.sun.intensity = 1.4;
        this.sun.position.set(50, 80, 30);
        this.clearFloodlights();
        break;
      case 'dusk':
        this.ambient.color.set(0xff8844);
        this.ambient.intensity = 0.35;
        this.sun.color.set(0xff6622);
        this.sun.intensity = 0.8;
        this.sun.position.set(80, 30, 20);
        this.clearFloodlights();
        break;
      case 'night':
        this.ambient.color.set(0x1a1a3e);
        this.ambient.intensity = 0.15;
        this.sun.intensity = 0.1;
        this.sun.color.set(0x8888ff);
        this.addFloodlights();
        break;
    }
  }

  private addFloodlights(): void {
    if (this.floodlights.length > 0) return;
    const positions = [
      [-40, 35, -30], [40, 35, -30], [-40, 35, 30], [40, 35, 30],
      [-40, 35, 0], [40, 35, 0],
    ];
    for (const pos of positions) {
      const [x, y, z] = pos;
      const light = new THREE.SpotLight(0xfff8e0, 2, 120, Math.PI / 4, 0.5, 1);
      light.position.set(x!, y!, z!);
      light.target.position.set(0, 0, 0);
      this.floodlights.push(light);
    }
  }

  private clearFloodlights(): void {
    this.floodlights.length = 0;
  }

  getFloodlights(): THREE.SpotLight[] {
    return this.floodlights;
  }

  getPreset(): LightingPreset {
    return this.preset;
  }

  cyclePreset(): LightingPreset {
    const order: LightingPreset[] = ['day', 'dusk', 'night'];
    const idx = (order.indexOf(this.preset) + 1) % order.length;
    const next = order[idx]!;
    this.applyPreset(next);
    return next;
  }
}
