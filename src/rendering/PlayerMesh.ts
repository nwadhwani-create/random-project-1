import * as THREE from 'three';
import type { PlayerAnimation } from '@/core/types';

export interface PlayerMeshOptions {
  primaryColor: number;
  secondaryColor: number;
  number: number;
  name: string;
  skinTone?: number;
  hairColor?: number;
  height?: number;
}

export class PlayerMeshFactory {
  static create(options: PlayerMeshOptions): THREE.Group {
    const group = new THREE.Group();
    const scale = (options.height ?? 1.8) / 1.8;
    const skin = options.skinTone ?? 0xc68642;
    const hair = options.hairColor ?? 0x2c1810;

    const skinMat = new THREE.MeshStandardMaterial({ color: skin, roughness: 0.7 });
    const hairMat = new THREE.MeshStandardMaterial({ color: hair, roughness: 0.9 });
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
    const kitMat = new THREE.MeshStandardMaterial({ color: options.primaryColor, roughness: 0.6 });
    const shortsMat = new THREE.MeshStandardMaterial({ color: options.secondaryColor, roughness: 0.6 });

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5 * scale, 0.6 * scale, 0.25 * scale), kitMat);
    torso.position.y = 1.1 * scale;
    torso.castShadow = true;
    group.add(torso);

    // Number on back
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(options.number), 32, 32);
    const numTex = new THREE.CanvasTexture(canvas);
    const numMat = new THREE.MeshBasicMaterial({ map: numTex, transparent: true });
    const numPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.25 * scale, 0.3 * scale), numMat);
    numPlane.position.set(0, 1.15 * scale, -0.13 * scale);
    group.add(numPlane);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.15 * scale, 8, 8), skinMat);
    head.position.y = 1.55 * scale;
    head.castShadow = true;
    group.add(head);

    // Hair
    const hairMesh = new THREE.Mesh(new THREE.SphereGeometry(0.16 * scale, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), hairMat);
    hairMesh.position.y = 1.6 * scale;
    group.add(hairMesh);

    // Arms
    const armGeo = new THREE.CylinderGeometry(0.06 * scale, 0.06 * scale, 0.5 * scale, 6);
    const leftArm = new THREE.Mesh(armGeo, skinMat);
    leftArm.position.set(-0.35 * scale, 1.1 * scale, 0);
    leftArm.rotation.z = 0.2;
    leftArm.castShadow = true;
    group.add(leftArm);

    const rightArm = leftArm.clone();
    rightArm.position.x = 0.35 * scale;
    rightArm.rotation.z = -0.2;
    group.add(rightArm);

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.08 * scale, 0.07 * scale, 0.55 * scale, 6);
    const leftLeg = new THREE.Mesh(legGeo, shortsMat);
    leftLeg.position.set(-0.12 * scale, 0.55 * scale, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);

    const rightLeg = leftLeg.clone();
    rightLeg.position.x = 0.12 * scale;
    group.add(rightLeg);

    // Boots
    const bootGeo = new THREE.BoxGeometry(0.1 * scale, 0.08 * scale, 0.2 * scale);
    const leftBoot = new THREE.Mesh(bootGeo, bootMat);
    leftBoot.position.set(-0.12 * scale, 0.04 * scale, 0.03 * scale);
    group.add(leftBoot);

    const rightBoot = leftBoot.clone();
    rightBoot.position.x = 0.12 * scale;
    group.add(rightBoot);

    // Store refs for animation
    group.userData['leftLeg'] = leftLeg;
    group.userData['rightLeg'] = rightLeg;
    group.userData['leftArm'] = leftArm;
    group.userData['rightArm'] = rightArm;
    group.userData['animPhase'] = 0;

    return group;
  }

  static animate(mesh: THREE.Group, animation: PlayerAnimation, speed: number, dt: number): void {
    const leftLeg = mesh.userData['leftLeg'] as THREE.Mesh;
    const rightLeg = mesh.userData['rightLeg'] as THREE.Mesh;
    const leftArm = mesh.userData['leftArm'] as THREE.Mesh;
    const rightArm = mesh.userData['rightArm'] as THREE.Mesh;
    let phase = (mesh.userData['animPhase'] as number) ?? 0;

    const isMoving = animation === 'run' || animation === 'sprint';
    if (isMoving) {
      const freq = animation === 'sprint' ? 12 : 8;
      phase += dt * freq * Math.min(speed / 5, 1.5);
      const swing = Math.sin(phase) * 0.5;

      leftLeg.rotation.x = swing;
      rightLeg.rotation.x = -swing;
      leftArm.rotation.x = -swing * 0.6;
      rightArm.rotation.x = swing * 0.6;
    } else {
      leftLeg.rotation.x *= 0.9;
      rightLeg.rotation.x *= 0.9;
      leftArm.rotation.x *= 0.9;
      rightArm.rotation.x *= 0.9;
    }

    mesh.userData['animPhase'] = phase;
  }
}
