import * as THREE from 'three';
import { PITCH } from '@/core/constants';
import { createCrowdTexture } from './textures';

export class Stadium {
  readonly group = new THREE.Group();
  private crowdInstances: THREE.InstancedMesh | null = null;
  private crowdPhase = 0;

  constructor() {
    this.buildStands();
    this.buildCrowd();
    this.buildAdBoards();
    this.buildFloodlightTowers();
  }

  private buildStands(): void {
    const standMat = new THREE.MeshStandardMaterial({ color: 0x2a3a4a, roughness: 0.8 });
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x3d5a6e, roughness: 0.9 });

    const buildStand = (w: number, d: number, h: number, x: number, z: number, rotY: number) => {
      const group = new THREE.Group();

      for (let tier = 0; tier < 3; tier++) {
        const tierH = h / 3;
        const tierD = d + tier * 4;
        const geo = new THREE.BoxGeometry(w, tierH, tierD);
        const mesh = new THREE.Mesh(geo, standMat);
        mesh.position.y = tier * tierH + tierH / 2;
        mesh.position.z = tier * 2;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);

        // Seat rows
        for (let row = 0; row < 5; row++) {
          const seatGeo = new THREE.BoxGeometry(w - 2, 0.3, 0.6);
          const seats = new THREE.Mesh(seatGeo, seatMat);
          seats.position.set(0, tier * tierH + 0.5 + row * 0.5, tier * 2 + 1 + row * 0.7);
          group.add(seats);
        }
      }

      group.position.set(x, 0, z);
      group.rotation.y = rotY;
      this.group.add(group);
    };

    const offset = PITCH.WIDTH / 2 + 12;
    const length = PITCH.LENGTH + 30;

    buildStand(length, 8, 12, 0, -offset, 0);
    buildStand(length, 8, 12, 0, offset, Math.PI);
    buildStand(PITCH.WIDTH + 20, 8, 10, -PITCH.LENGTH / 2 - 14, 0, Math.PI / 2);
    buildStand(PITCH.WIDTH + 20, 8, 10, PITCH.LENGTH / 2 + 14, 0, -Math.PI / 2);

    // Roof trusses
    const trussMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.6, roughness: 0.4 });
    for (const z of [-offset - 2, offset + 2]) {
      const truss = new THREE.Mesh(
        new THREE.BoxGeometry(length + 10, 0.5, 0.5),
        trussMat
      );
      truss.position.set(0, 14, z);
      this.group.add(truss);
    }
  }

  private buildCrowd(): void {
    const crowdTex = createCrowdTexture();
    const geo = new THREE.PlaneGeometry(0.8, 1.2);
    const mat = new THREE.MeshBasicMaterial({
      map: crowdTex,
      transparent: true,
      side: THREE.DoubleSide,
      alphaTest: 0.1,
    });

    const count = 800;
    this.crowdInstances = new THREE.InstancedMesh(geo, mat, count);
    const dummy = new THREE.Object3D();
    const offset = PITCH.WIDTH / 2 + 8;

    for (let i = 0; i < count; i++) {
      const side = Math.floor(Math.random() * 4);
      let x = 0, z = 0, rotY = 0;

      switch (side) {
        case 0:
          x = (Math.random() - 0.5) * PITCH.LENGTH;
          z = -offset - Math.random() * 8;
          rotY = 0;
          break;
        case 1:
          x = (Math.random() - 0.5) * PITCH.LENGTH;
          z = offset + Math.random() * 8;
          rotY = Math.PI;
          break;
        case 2:
          x = -PITCH.LENGTH / 2 - 10 - Math.random() * 6;
          z = (Math.random() - 0.5) * PITCH.WIDTH;
          rotY = Math.PI / 2;
          break;
        default:
          x = PITCH.LENGTH / 2 + 10 + Math.random() * 6;
          z = (Math.random() - 0.5) * PITCH.WIDTH;
          rotY = -Math.PI / 2;
      }

      const tier = Math.floor(Math.random() * 3);
      dummy.position.set(x, 3 + tier * 3 + Math.random(), z);
      dummy.rotation.y = rotY;
      dummy.updateMatrix();
      this.crowdInstances.setMatrixAt(i, dummy.matrix);
    }

    this.crowdInstances.instanceMatrix.needsUpdate = true;
    this.group.add(this.crowdInstances);
  }

  private buildAdBoards(): void {
    const boardMat = new THREE.MeshStandardMaterial({ color: 0x1a237e, roughness: 0.5 });

    const offset = PITCH.WIDTH / 2 + 1;
    for (let i = 0; i < 3; i++) {
      const board = new THREE.Mesh(
        new THREE.BoxGeometry(8, 1, 0.1),
        boardMat
      );
      board.position.set(-20 + i * 20, 0.5, -offset);
      this.group.add(board);
    }
  }

  private buildFloodlightTowers(): void {
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.5 });
    const positions = [
      [-45, -35], [45, -35], [-45, 35], [45, 35],
    ];

    for (const pos of positions) {
      const [x, z] = pos;
      const tower = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.5, 30, 8),
        towerMat
      );
      tower.position.set(x!, 15, z!);
      tower.castShadow = true;
      this.group.add(tower);

      const head = new THREE.Mesh(
        new THREE.BoxGeometry(3, 0.5, 1),
        new THREE.MeshStandardMaterial({ color: 0xeeeeee, emissive: 0xffffaa, emissiveIntensity: 0.3 })
      );
      head.position.set(x!, 30, z!);
      this.group.add(head);
    }
  }

  update(dt: number, excitement = 0): void {
    this.crowdPhase += dt * (2 + excitement * 8);
    if (!this.crowdInstances) return;

    const dummy = new THREE.Object3D();
    const count = this.crowdInstances.count;

    for (let i = 0; i < count; i++) {
      this.crowdInstances.getMatrixAt(i, dummy.matrix);
      dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

      const bounce = Math.sin(this.crowdPhase + i * 0.5) * (0.02 + excitement * 0.08);
      dummy.position.y += bounce;
      dummy.updateMatrix();
      this.crowdInstances.setMatrixAt(i, dummy.matrix);
    }
    this.crowdInstances.instanceMatrix.needsUpdate = true;
  }
}
