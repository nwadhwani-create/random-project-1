import * as THREE from 'three';
import { PlayerSim } from '../sim/player';
import type { KitColors } from '../data/teams';
import type { PlayerData } from '../data/types';

const SKIN_TONES = ['#f5cba7', '#e8b083', '#cf9560', '#a86b38', '#7a4a21', '#5a350f'];
const HAIR_COLORS = ['#1b1b1b', '#3b2a1a', '#6b4a2a', '#b8a06a'];

interface Rig {
  root: THREE.Group;
  body: THREE.Group;      // pelvis-anchored
  torso: THREE.Group;
  head: THREE.Group;
  armL: THREE.Group; armR: THREE.Group;     // shoulders
  forearmL: THREE.Group; forearmR: THREE.Group;
  legL: THREE.Group; legR: THREE.Group;     // hips
  shinL: THREE.Group; shinR: THREE.Group;
}

/** canvas texture with shirt number front+back and name */
function kitTexture(kit: KitColors, data: PlayerData): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = kit.shirt;
  g.fillRect(0, 0, 256, 256);
  // subtle fabric shading
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, 'rgba(255,255,255,0.10)');
  grad.addColorStop(1, 'rgba(0,0,0,0.12)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  // accent band on shoulders region (top strip of texture)
  g.fillStyle = kit.accent;
  g.fillRect(0, 0, 256, 12);
  // BACK of shirt occupies right half (u 0.5-1): name + number
  g.fillStyle = kit.accent;
  g.textAlign = 'center';
  g.font = 'bold 90px Arial Narrow, Arial';
  g.fillText(String(data.no), 192, 175);
  g.font = 'bold 24px Arial Narrow, Arial';
  const name = data.shirtName.length > 12 ? data.shirtName.slice(0, 12) : data.shirtName;
  g.fillText(name, 192, 70);
  // FRONT (u 0-0.5): small number
  g.font = 'bold 34px Arial Narrow, Arial';
  g.fillText(String(data.no), 64, 150);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function buildRig(data: PlayerData, kit: KitColors): Rig {
  const h = data.look.height / 1.8; // scale factor vs base 1.8m rig
  const skin = new THREE.MeshStandardMaterial({ color: SKIN_TONES[data.look.skin % 6], roughness: 0.75 });
  const shirtTex = kitTexture(kit, data);
  const shirt = new THREE.MeshStandardMaterial({ map: shirtTex, roughness: 0.82 });
  const sleeves = new THREE.MeshStandardMaterial({ color: kit.shirt, roughness: 0.82 });
  const shorts = new THREE.MeshStandardMaterial({ color: kit.shorts, roughness: 0.85 });
  const socks = new THREE.MeshStandardMaterial({ color: kit.socks, roughness: 0.85 });
  const boots = new THREE.MeshStandardMaterial({ color: 0x16161a, roughness: 0.5 });
  const hairM = new THREE.MeshStandardMaterial({ color: HAIR_COLORS[data.look.hairColor % 4], roughness: 0.9 });

  const root = new THREE.Group();
  const body = new THREE.Group();
  body.position.y = 0.95 * h;
  root.add(body);

  // torso: box with kit texture (front half / back half via UV trick on box sides)
  const torso = new THREE.Group();
  const torsoGeo = new THREE.BoxGeometry(0.30, 0.52, 0.44);
  // remap UVs: +z face -> front half of texture, -z face -> back half
  {
    const uv = torsoGeo.attributes.uv as THREE.BufferAttribute;
    // BoxGeometry face order: +x, -x, +y, -y, +z, -z (4 verts each)
    const setFace = (f: number, u0: number, v0: number, u1: number, v1: number) => {
      const base = f * 4;
      uv.setXY(base + 0, u0, v1);
      uv.setXY(base + 1, u1, v1);
      uv.setXY(base + 2, u0, v0);
      uv.setXY(base + 3, u1, v0);
    };
    setFace(4, 0.02, 0.05, 0.48, 0.95);  // front
    setFace(5, 0.52, 0.05, 0.98, 0.95);  // back
    setFace(0, 0.0, 0.0, 0.04, 0.9);     // sides sample plain shirt color edge
    setFace(1, 0.0, 0.0, 0.04, 0.9);
    setFace(2, 0.0, 0.95, 0.04, 1.0);    // top = accent strip
    setFace(3, 0.0, 0.0, 0.04, 0.05);
    uv.needsUpdate = true;
  }
  const torsoMesh = new THREE.Mesh(torsoGeo, shirt);
  torsoMesh.position.y = 0.26;
  torsoMesh.castShadow = true;
  torso.add(torsoMesh);
  torso.position.y = 0.12;
  body.add(torso);

  // head + hair
  const head = new THREE.Group();
  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.115, 12, 10), skin);
  headMesh.castShadow = true;
  head.add(headMesh);
  const hairStyle = data.look.hair % 5;
  if (hairStyle !== 4) { // 4 = bald
    let hair: THREE.Mesh;
    if (hairStyle === 0) hair = new THREE.Mesh(new THREE.SphereGeometry(0.118, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), hairM);
    else if (hairStyle === 1) { hair = new THREE.Mesh(new THREE.SphereGeometry(0.125, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), hairM); hair.scale.y = 1.25; }
    else if (hairStyle === 2) hair = new THREE.Mesh(new THREE.SphereGeometry(0.121, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.62), hairM);
    else { hair = new THREE.Mesh(new THREE.SphereGeometry(0.117, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.45), hairM); }
    hair.position.y = 0.012;
    head.add(hair);
  }
  head.position.y = 0.66;
  torso.add(head);

  // neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.08, 8), skin);
  neck.position.y = 0.545;
  torso.add(neck);

  const mkLimb = (parent: THREE.Group, upper: THREE.Material, lower: THREE.Material, tip: THREE.Material | null, uLen: number, lLen: number, rad: number) => {
    const j1 = new THREE.Group();
    const upperMesh = new THREE.Mesh(new THREE.CapsuleGeometry(rad, uLen, 3, 8), upper);
    upperMesh.position.y = -uLen / 2 - rad * 0.5;
    upperMesh.castShadow = true;
    j1.add(upperMesh);
    const j2 = new THREE.Group();
    j2.position.y = -uLen - rad;
    const lowerMesh = new THREE.Mesh(new THREE.CapsuleGeometry(rad * 0.82, lLen, 3, 8), lower);
    lowerMesh.position.y = -lLen / 2 - rad * 0.4;
    lowerMesh.castShadow = true;
    j2.add(lowerMesh);
    if (tip) {
      const foot = new THREE.Mesh(new THREE.BoxGeometry(rad * 2.1, rad * 1.1, rad * 3.4), tip);
      foot.position.set(0, -lLen - rad * 0.9, rad * 1.0);
      foot.castShadow = true;
      j2.add(foot);
    }
    j1.add(j2);
    parent.add(j1);
    return [j1, j2] as const;
  };

  // arms (anchored at shoulders on torso)
  const [armL, forearmL] = mkLimb(torso, sleeves, skin, null, 0.24, 0.22, 0.045);
  armL.position.set(0, 0.48, -0.27);
  const [armR, forearmR] = mkLimb(torso, sleeves, skin, null, 0.24, 0.22, 0.045);
  armR.position.set(0, 0.48, 0.27);

  // legs (anchored at hips on body)
  const hipWrap = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.42), shorts);
  hipWrap.position.y = 0.06;
  hipWrap.castShadow = true;
  body.add(hipWrap);
  const [legL, shinL] = mkLimb(body, shorts, socks, boots, 0.4, 0.4, 0.062);
  legL.position.set(0, 0.02, -0.1);
  const [legR, shinR] = mkLimb(body, shorts, socks, boots, 0.4, 0.4, 0.062);
  legR.position.set(0, 0.02, 0.1);

  root.scale.setScalar(h);
  root.traverse((o) => { o.matrixAutoUpdate = true; });

  return { root, body, torso, head, armL, armR, forearmL, forearmR, legL, legR, shinL, shinR };
}

/**
 * One articulated player view. Joint rotations are driven procedurally
 * from the sim state (run cycle, kick, slide, GK dive, celebration...).
 */
export class PlayerView {
  rig: Rig;
  private runPhase = 0;

  constructor(public sim: PlayerSim, kit: KitColors) {
    this.rig = buildRig(sim.data, kit);
  }

  get object(): THREE.Object3D { return this.rig.root; }

  update(dt: number, time: number): void {
    const p = this.sim;
    const r = this.rig;
    r.root.position.set(p.pos.x, 0, p.pos.z);
    r.root.rotation.set(0, -p.facing, 0);
    // note: rig faces +x when yaw=0; legs offset along z

    const speed = Math.hypot(p.vel.x, p.vel.z);
    this.runPhase += dt * (4 + speed * 2.1);

    // reset pose accumulators
    const lerp = (cur: number, target: number, k: number) => cur + (target - cur) * Math.min(1, k);
    const setJ = (g: THREE.Group, x: number, z: number, k = 14 * dt) => {
      g.rotation.x = lerp(g.rotation.x, x, k);
      g.rotation.z = lerp(g.rotation.z, z, k);
    };

    let bodyY = 0.95 * (p.data.look.height / 1.8);
    let bodyPitch = 0; // rotation around z-axis-ish (lean forward = rotate.z since facing +x)
    let bodyRoll = 0;

    switch (p.state) {
      case 'run':
      case 'idle': {
        const amp = THREE.MathUtils.clamp(speed / p.maxSprint, 0, 1);
        const s = Math.sin(this.runPhase), c = Math.cos(this.runPhase);
        if (amp > 0.05) {
          setJ(r.legL, 0, -s * (0.55 + amp * 0.45));
          setJ(r.legR, 0, s * (0.55 + amp * 0.45));
          r.shinL.rotation.z = Math.max(0, c) * (0.6 + amp * 0.6);
          r.shinR.rotation.z = Math.max(0, -c) * (0.6 + amp * 0.6);
          setJ(r.armL, 0, s * (0.4 + amp * 0.5));
          setJ(r.armR, 0, -s * (0.4 + amp * 0.5));
          r.forearmL.rotation.z = -0.6 - amp * 0.4;
          r.forearmR.rotation.z = -0.6 - amp * 0.4;
          bodyPitch = -amp * 0.22;
          bodyY += Math.abs(Math.sin(this.runPhase)) * 0.035 * amp;
        } else {
          // idle: breathing, slight arm sway
          setJ(r.legL, 0, 0.03, 6 * dt);
          setJ(r.legR, 0, -0.03, 6 * dt);
          r.shinL.rotation.z = lerp(r.shinL.rotation.z, 0.05, 6 * dt);
          r.shinR.rotation.z = lerp(r.shinR.rotation.z, 0.05, 6 * dt);
          setJ(r.armL, 0.06, 0.06 + Math.sin(time * 1.8) * 0.02, 6 * dt);
          setJ(r.armR, -0.06, -0.06 - Math.sin(time * 1.8) * 0.02, 6 * dt);
          r.forearmL.rotation.z = lerp(r.forearmL.rotation.z, -0.15, 6 * dt);
          r.forearmR.rotation.z = lerp(r.forearmR.rotation.z, -0.15, 6 * dt);
        }
        break;
      }
      case 'kick': {
        const t = Math.min(1, p.stateTime / 0.32);
        const swing = t < 0.4 ? -(t / 0.4) * 0.9 : (1.4 * ((t - 0.4) / 0.6) - 0.0) * 1.6 - 0.9;
        const foot = p.kickFoot > 0 ? r.legR : r.legL;
        const shin = p.kickFoot > 0 ? r.shinR : r.shinL;
        const other = p.kickFoot > 0 ? r.legL : r.legR;
        foot.rotation.z = -swing;       // negative = leg forward (facing +x)
        shin.rotation.z = t < 0.4 ? 1.1 : 0.25;
        other.rotation.z = 0.18;
        setJ(r.armL, 0, p.kickFoot > 0 ? 0.6 : -0.4, 20 * dt);
        setJ(r.armR, 0, p.kickFoot > 0 ? -0.4 : 0.6, 20 * dt);
        bodyPitch = -0.12;
        break;
      }
      case 'slide': {
        const t = Math.min(1, p.stateTime / 0.25);
        bodyPitch = 0.95 * t;       // lean back
        bodyY = (0.95 - 0.55 * t) * (p.data.look.height / 1.8);
        r.legR.rotation.z = -1.35 * t;  // leading leg out front
        r.shinR.rotation.z = 0.1;
        r.legL.rotation.z = 0.5 * t;
        r.shinL.rotation.z = 1.4 * t;
        setJ(r.armL, 0, 1.4 * t, 30 * dt);
        setJ(r.armR, 0, -0.8 * t, 30 * dt);
        break;
      }
      case 'dive': {
        const t = Math.min(1, p.stateTime / 0.3);
        const dirZ = Math.sign(p.diveDir.z || 1);
        // dive sideways relative to facing: roll around x (facing axis)
        bodyRoll = dirZ * 1.45 * t;
        bodyY = (0.95 - 0.6 * t) * (p.data.look.height / 1.8);
        setJ(r.armL, 0, 2.6 * t, 30 * dt);
        setJ(r.armR, 0, 2.6 * t, 30 * dt);
        r.forearmL.rotation.z = 0;
        r.forearmR.rotation.z = 0;
        r.legL.rotation.z = -0.3 * t;
        r.legR.rotation.z = 0.4 * t;
        break;
      }
      case 'fall': {
        const t = Math.min(1, p.stateTime / 0.3);
        bodyPitch = 1.5 * t;
        bodyY = (0.95 - 0.72 * t) * (p.data.look.height / 1.8);
        setJ(r.armL, 0, 0.8 * t, 20 * dt);
        setJ(r.armR, 0, -0.8 * t, 20 * dt);
        break;
      }
      case 'celebrate': {
        const hop = Math.abs(Math.sin(time * 6));
        bodyY += hop * 0.16;
        setJ(r.armL, 0, 2.9, 10 * dt);
        setJ(r.armR, 0, 2.9, 10 * dt);
        r.forearmL.rotation.z = -0.2;
        r.forearmR.rotation.z = -0.2;
        setJ(r.legL, 0, -hop * 0.2, 10 * dt);
        setJ(r.legR, 0, hop * 0.2, 10 * dt);
        break;
      }
      case 'throw': {
        const t = Math.min(1, p.stateTime / 0.6);
        const raise = t < 0.5 ? t * 2 : 1;
        const fling = t < 0.5 ? 0 : (t - 0.5) * 2;
        setJ(r.armL, -(2.8 * raise - fling * 1.6), 0, 30 * dt);
        setJ(r.armR, -(2.8 * raise - fling * 1.6), 0, 30 * dt);
        bodyPitch = -0.15 + fling * 0.25;
        break;
      }
      case 'header': {
        bodyY += Math.sin(Math.min(1, p.stateTime / 0.5) * Math.PI) * 0.3;
        bodyPitch = -0.3;
        break;
      }
    }

    r.body.position.y = lerp(r.body.position.y, bodyY, 18 * dt);
    r.body.rotation.z = lerp(r.body.rotation.z, bodyPitch, 16 * dt);
    r.body.rotation.x = lerp(r.body.rotation.x, bodyRoll, 16 * dt);

    // head tracks ball-ish: subtle
    r.head.rotation.y = Math.sin(time * 0.7 + p.idx) * 0.08;
  }
}
