import * as THREE from 'three';
import type { KitColors } from '../data/types';
import type { PlayerEntity } from '../physics/playerPhysics';
import { hexToRgb } from '../utils/math';

const SKIN_TONES = [0xf5d0a9, 0xe8b88a, 0xd4a574, 0xc68642, 0x8d5524, 0x6b3a2a];
const HAIR_COLORS = [0x1a1a1a, 0x4a3728, 0x8b6914, 0xd4a017, 0xaaaaaa];

export function createPlayerMesh(
  kit: KitColors,
  skinTone: number,
  hairStyle: number,
  number: number,
): THREE.Group {
  const group = new THREE.Group();
  const scale = 1.0;

  const skinColor = SKIN_TONES[skinTone % SKIN_TONES.length];
  const hairColor = HAIR_COLORS[hairStyle % HAIR_COLORS.length];
  const [pr, pg, pb] = hexToRgb(kit.primary);
  const [sr, sg, sb] = hexToRgb(kit.shorts);

  const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.7 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(pr, pg, pb), roughness: 0.8 });
  const shortsMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(sr, sg, sb), roughness: 0.8 });
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
  const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.9 });

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.5, 4, 8), shirtMat);
  torso.position.y = 1.1;
  torso.castShadow = true;
  group.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), skinMat);
  head.position.y = 1.55;
  head.castShadow = true;
  group.add(head);

  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2), hairMat);
  hair.position.y = 1.6;
  group.add(hair);

  const legGeo = new THREE.CapsuleGeometry(0.08, 0.35, 4, 6);
  for (const side of [-1, 1]) {
    const upperLeg = new THREE.Mesh(legGeo, shortsMat);
    upperLeg.position.set(side * 0.1, 0.65, 0);
    upperLeg.castShadow = true;
    group.add(upperLeg);

    const lowerLeg = new THREE.Mesh(legGeo, skinMat);
    lowerLeg.position.set(side * 0.1, 0.25, 0);
    lowerLeg.castShadow = true;
    group.add(lowerLeg);

    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.18), bootMat);
    boot.position.set(side * 0.1, 0.04, 0.03);
    group.add(boot);
  }

  const armGeo = new THREE.CapsuleGeometry(0.06, 0.3, 4, 6);
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(armGeo, skinMat);
    arm.position.set(side * 0.3, 1.1, 0);
    arm.rotation.z = side * 0.3;
    arm.castShadow = true;
    group.add(arm);
  }

  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = kit.primary;
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 40px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(number), 32, 32);
  const numTex = new THREE.CanvasTexture(canvas);
  const numMat = new THREE.MeshBasicMaterial({ map: numTex, transparent: true });
  const numPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), numMat);
  numPlane.position.set(0, 1.15, 0.23);
  group.add(numPlane);

  group.scale.setScalar(scale);
  return group;
}

export function updatePlayerMesh(
  mesh: THREE.Group,
  player: PlayerEntity,
  _dt: number,
): void {
  mesh.position.set(player.position.x, player.position.y, player.position.z);
  mesh.rotation.y = player.rotation;

  const t = player.animTime;
  const legs = mesh.children.filter((c) => c.position.y < 0.8 && c.position.y > 0);

  switch (player.animState) {
    case 'run':
    case 'sprint': {
      const freq = player.animState === 'sprint' ? 12 : 8;
      const amp = player.animState === 'sprint' ? 0.4 : 0.25;
      legs.forEach((leg, i) => {
        leg.rotation.x = Math.sin(t * freq + i * Math.PI) * amp;
      });
      break;
    }
    case 'idle':
    case 'gk_idle':
      legs.forEach((leg) => { leg.rotation.x = 0; });
      break;
    case 'shoot':
    case 'pass':
      if (player.animTime < 0.3) {
        legs[0] && (legs[0].rotation.x = -0.8);
      }
      break;
    case 'tackle':
    case 'slide':
      mesh.rotation.x = player.animState === 'slide' ? -Math.PI / 4 : 0;
      break;
    case 'gk_dive':
      mesh.rotation.z = Math.sin(t * 6) * 0.8;
      break;
    case 'celebrate':
      mesh.position.y = Math.abs(Math.sin(t * 8)) * 0.3;
      break;
  }
}

export class PlayerRenderer {
  private meshes = new Map<string, THREE.Group>();
  readonly container = new THREE.Group();

  clear(): void {
    this.meshes.forEach((mesh) => this.container.remove(mesh));
    this.meshes.clear();
  }

  addPlayer(player: PlayerEntity, kit: KitColors): THREE.Group {
    const mesh = createPlayerMesh(kit, player.data.skinTone, player.data.hairStyle, player.data.number);
    this.meshes.set(player.id, mesh);
    this.container.add(mesh);
    return mesh;
  }

  update(players: PlayerEntity[], dt: number): void {
    for (const player of players) {
      const mesh = this.meshes.get(player.id);
      if (mesh) updatePlayerMesh(mesh, player, dt);
    }
  }

  getMesh(id: string): THREE.Group | undefined {
    return this.meshes.get(id);
  }
}
