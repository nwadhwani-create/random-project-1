import * as THREE from 'three';
import { PITCH } from '@/core/constants';
import { createGrassTexture, createPitchMarkingsTexture } from './textures';

export class Pitch {
  readonly group = new THREE.Group();

  constructor() {
    this.buildPitch();
    this.buildGoals();
    this.buildCornerFlags();
  }

  private buildPitch(): void {
    const grassTex = createGrassTexture();
    const markingsTex = createPitchMarkingsTexture();

    const pitchGeo = new THREE.PlaneGeometry(PITCH.LENGTH, PITCH.WIDTH);
    const pitchMat = new THREE.MeshStandardMaterial({
      map: grassTex,
      roughness: 0.85,
      metalness: 0.0,
    });
    const pitch = new THREE.Mesh(pitchGeo, pitchMat);
    pitch.rotation.x = -Math.PI / 2;
    pitch.receiveShadow = true;
    this.group.add(pitch);

    const markingsGeo = new THREE.PlaneGeometry(PITCH.LENGTH, PITCH.WIDTH);
    const markingsMat = new THREE.MeshBasicMaterial({
      map: markingsTex,
      transparent: true,
      depthWrite: false,
    });
    const markings = new THREE.Mesh(markingsGeo, markingsMat);
    markings.rotation.x = -Math.PI / 2;
    markings.position.y = 0.01;
    this.group.add(markings);
  }

  private buildGoals(): void {
    for (const side of [-1, 1] as const) {
      const goalGroup = new THREE.Group();
      const x = side * PITCH.LENGTH / 2;

      const postMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.7 });
      const postGeo = new THREE.CylinderGeometry(0.06, 0.06, PITCH.GOAL_HEIGHT, 8);
      const barGeo = new THREE.CylinderGeometry(0.06, 0.06, PITCH.GOAL_WIDTH, 8);

      const leftPost = new THREE.Mesh(postGeo, postMat);
      leftPost.position.set(x, PITCH.GOAL_HEIGHT / 2, -PITCH.GOAL_WIDTH / 2);
      leftPost.castShadow = true;

      const rightPost = leftPost.clone();
      rightPost.position.z = PITCH.GOAL_WIDTH / 2;

      const crossbar = new THREE.Mesh(barGeo, postMat);
      crossbar.rotation.x = Math.PI / 2;
      crossbar.position.set(x, PITCH.GOAL_HEIGHT, 0);
      crossbar.castShadow = true;

      goalGroup.add(leftPost, rightPost, crossbar);

      // Net (simplified grid)
      const netMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.35,
        wireframe: true,
      });
      const netGeo = new THREE.BoxGeometry(PITCH.GOAL_DEPTH, PITCH.GOAL_HEIGHT, PITCH.GOAL_WIDTH);
      const net = new THREE.Mesh(netGeo, netMat);
      net.position.set(x + side * PITCH.GOAL_DEPTH / 2, PITCH.GOAL_HEIGHT / 2, 0);
      goalGroup.add(net);

      this.group.add(goalGroup);
    }
  }

  private buildCornerFlags(): void {
    const corners = [
      [-PITCH.LENGTH / 2, -PITCH.WIDTH / 2],
      [-PITCH.LENGTH / 2, PITCH.WIDTH / 2],
      [PITCH.LENGTH / 2, -PITCH.WIDTH / 2],
      [PITCH.LENGTH / 2, PITCH.WIDTH / 2],
    ];
    const colors = [0xff0000, 0xffff00, 0xff0000, 0xffff00];

    corners.forEach((corner, i) => {
      const [cx, cz] = corner;
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 1.5, 6),
        new THREE.MeshStandardMaterial({ color: 0xcccccc })
      );
      pole.position.set(cx!, 0.75, cz!);

      const flag = new THREE.Mesh(
        new THREE.PlaneGeometry(0.4, 0.25),
        new THREE.MeshStandardMaterial({ color: colors[i]!, side: THREE.DoubleSide })
      );
      flag.position.set(cx! + (cx! > 0 ? 0.2 : -0.2), 1.3, cz!);

      this.group.add(pole, flag);
    });
  }
}
