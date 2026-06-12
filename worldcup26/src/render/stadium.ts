import * as THREE from 'three';
import { PITCH_LENGTH, PITCH_WIDTH } from '../sim/const';

export interface Stadium {
  group: THREE.Group;
  /** call each frame: excitement 0..1 drives crowd motion */
  update(time: number, excitement: number): void;
}

const SKIN = [0xf3c6a5, 0xe0ac69, 0xc68642, 0x8d5524, 0x5c3317, 0xffdbac];

/**
 * Tiered stands on all four sides with an instanced low-poly crowd.
 * Crowd spectators are simple double-cone "imposters" colored randomly with
 * team-ish hues; they bob with excitement.
 */
export function createStadium(homeColor: string, awayColor: string): Stadium {
  const group = new THREE.Group();

  const standMat = new THREE.MeshStandardMaterial({ color: 0x9aa1ad, roughness: 0.9 });
  const standMatDark = new THREE.MeshStandardMaterial({ color: 0x59616e, roughness: 0.95 });
  const seatPositions: THREE.Vector3[] = [];
  const seatRows: number[] = [];

  const innerL = PITCH_LENGTH / 2 + 9;
  const innerW = PITCH_WIDTH / 2 + 8;
  const tiers = 2;
  const rowsPerTier = 11;
  const rowDepth = 1.05;
  const rowRise = 0.62;

  // four rectangular stands
  const sides = [
    { axis: 'z' as const, sign: -1, len: PITCH_LENGTH + 26 },
    { axis: 'z' as const, sign: 1, len: PITCH_LENGTH + 26 },
    { axis: 'x' as const, sign: -1, len: PITCH_WIDTH + 18 },
    { axis: 'x' as const, sign: 1, len: PITCH_WIDTH + 18 },
  ];

  for (const s of sides) {
    const base = s.axis === 'z' ? innerW : innerL;
    let y = 1.2;
    let off = base;
    for (let tier = 0; tier < tiers; tier++) {
      const rows = rowsPerTier + tier * 3;
      // tier slab (stepped wedge simplified as inclined box)
      const depth = rows * rowDepth;
      const height = rows * rowRise;
      const slab = new THREE.Mesh(new THREE.BoxGeometry(s.len, 0.8, depth), standMat);
      slab.rotation.x = (s.axis === 'z' ? -s.sign : 0) * Math.atan2(rowRise, rowDepth);
      if (s.axis === 'x') slab.rotation.z = s.sign * Math.atan2(rowRise, rowDepth);
      if (s.axis === 'z') {
        slab.position.set(0, y + height / 2, s.sign * (off + depth / 2));
        slab.rotation.y = 0;
      } else {
        slab.rotation.y = Math.PI / 2;
        slab.position.set(s.sign * (off + depth / 2), y + height / 2, 0);
      }
      slab.receiveShadow = true;
      group.add(slab);

      // wall below tier
      const wall = new THREE.Mesh(new THREE.BoxGeometry(s.len, y + 0.6, 0.5), standMatDark);
      if (s.axis === 'z') wall.position.set(0, (y + 0.6) / 2, s.sign * off);
      else { wall.rotation.y = Math.PI / 2; wall.position.set(s.sign * off, (y + 0.6) / 2, 0); }
      group.add(wall);

      // seat positions
      const across = Math.floor(s.len / 1.0) - 4;
      for (let r = 0; r < rows; r++) {
        const rr = off + 0.8 + r * rowDepth;
        const ry = y + 0.7 + r * rowRise;
        for (let i = 0; i < across; i += 1) {
          if (Math.random() < 0.12) continue; // empty seats
          const t = (i / (across - 1) - 0.5) * (s.len - 4);
          if (s.axis === 'z') seatPositions.push(new THREE.Vector3(t, ry, s.sign * rr));
          else seatPositions.push(new THREE.Vector3(s.sign * rr, ry, t));
          seatRows.push(r);
        }
      }
      y += height + 2.2;
      off += depth + 1.6;
    }
  }

  // roof ring
  const roofMat = new THREE.MeshStandardMaterial({ color: 0xdfe5ec, roughness: 0.55, metalness: 0.25, side: THREE.DoubleSide });
  for (const s of sides) {
    const base = (s.axis === 'z' ? innerW : innerL) + tiers * (rowsPerTier + 1.5) * rowDepth + 4;
    const roof = new THREE.Mesh(new THREE.PlaneGeometry(s.len + 6, 14), roofMat);
    roof.rotation.x = -Math.PI / 2 + (s.axis === 'z' ? s.sign * 0.16 : 0);
    if (s.axis === 'z') roof.position.set(0, 24.5, s.sign * (base - 4));
    else {
      roof.rotation.y = Math.PI / 2;
      roof.rotation.x = -Math.PI / 2;
      roof.rotation.z = s.sign * -0.16;
      roof.position.set(s.sign * (base - 4), 24.5, 0);
    }
    group.add(roof);
  }

  // floodlight pylons
  const pylonMat = new THREE.MeshStandardMaterial({ color: 0x3a3f46, roughness: 0.6, metalness: 0.5 });
  const lampMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xf4f8ff, emissiveIntensity: 2.2 });
  for (const [x, z] of [[-75, -52], [75, -52], [-75, 52], [75, 52]] as const) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 46, 8), pylonMat);
    pole.position.set(x, 23, z);
    group.add(pole);
    const head = new THREE.Mesh(new THREE.BoxGeometry(7, 4, 1.2), lampMat);
    head.position.set(x * 0.93, 46, z * 0.93);
    head.lookAt(0, 0, 0);
    group.add(head);
  }

  // ----- instanced crowd
  const count = seatPositions.length;
  const bodyGeo = new THREE.ConeGeometry(0.26, 0.95, 5);
  bodyGeo.translate(0, 0.48, 0);
  const headGeo = new THREE.SphereGeometry(0.14, 6, 5);
  headGeo.translate(0, 1.05, 0);

  const bodyMesh = new THREE.InstancedMesh(bodyGeo, new THREE.MeshLambertMaterial({}), count);
  const headMesh = new THREE.InstancedMesh(headGeo, new THREE.MeshLambertMaterial({}), count);
  bodyMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  headMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  const home = new THREE.Color(homeColor);
  const away = new THREE.Color(awayColor);
  const neutral = [new THREE.Color(0xcccccc), new THREE.Color(0x444a55), new THREE.Color(0x8899bb), new THREE.Color(0xddbb66), new THREE.Color(0x66aa77)];
  const tmpC = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const r = Math.random();
    if (r < 0.34) tmpC.copy(home).offsetHSL((Math.random() - 0.5) * 0.04, 0, (Math.random() - 0.5) * 0.25);
    else if (r < 0.52) tmpC.copy(away).offsetHSL((Math.random() - 0.5) * 0.04, 0, (Math.random() - 0.5) * 0.25);
    else tmpC.copy(neutral[Math.floor(Math.random() * neutral.length)]).offsetHSL(0, 0, (Math.random() - 0.5) * 0.2);
    bodyMesh.setColorAt(i, tmpC);
    headMesh.setColorAt(i, tmpC.set(SKIN[Math.floor(Math.random() * SKIN.length)]));
  }
  bodyMesh.instanceColor!.needsUpdate = true;
  headMesh.instanceColor!.needsUpdate = true;

  const m4 = new THREE.Matrix4();
  const phase = new Float32Array(count);
  const ampl = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    phase[i] = Math.random() * Math.PI * 2;
    ampl[i] = 0.5 + Math.random();
  }

  group.add(bodyMesh);
  group.add(headMesh);

  let lastUpdate = -1;
  function update(time: number, excitement: number): void {
    // throttle crowd matrix updates to 20 Hz for performance
    if (time - lastUpdate < 0.05) return;
    lastUpdate = time;
    const e = excitement;
    for (let i = 0; i < count; i++) {
      const p = seatPositions[i];
      // idle sway + jumping with excitement
      const jump = Math.max(0, Math.sin(time * (4 + ampl[i] * 3) + phase[i])) * 0.42 * e * ampl[i] * 0.7;
      const sway = Math.sin(time * 1.4 + phase[i]) * 0.03;
      m4.makeTranslation(p.x + sway, p.y + jump, p.z);
      bodyMesh.setMatrixAt(i, m4);
      headMesh.setMatrixAt(i, m4);
    }
    bodyMesh.instanceMatrix.needsUpdate = true;
    headMesh.instanceMatrix.needsUpdate = true;
  }

  // initial layout
  update(0, 0);

  return { group, update };
}
