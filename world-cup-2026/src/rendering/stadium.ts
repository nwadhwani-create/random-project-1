import * as THREE from 'three';
import { PITCH } from '../data/types';
import type { LightingPreset } from '../data/types';

export function createGrassTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const stripe = Math.floor(x / 32) % 2;
      const noise = (Math.random() - 0.5) * 20;
      const base = stripe === 0 ? 45 : 55;
      const g = base + noise;
      const r = g - 15 + Math.random() * 5;
      const b = g - 25 + Math.random() * 5;
      ctx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 5);
  return tex;
}

export function createPitch(): THREE.Group {
  const group = new THREE.Group();

  const grassTex = createGrassTexture();
  const pitchGeo = new THREE.PlaneGeometry(PITCH.LENGTH, PITCH.WIDTH);
  const pitchMat = new THREE.MeshStandardMaterial({
    map: grassTex,
    roughness: 0.85,
    metalness: 0.0,
  });
  const pitch = new THREE.Mesh(pitchGeo, pitchMat);
  pitch.rotation.x = -Math.PI / 2;
  pitch.receiveShadow = true;
  group.add(pitch);

  const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const lineW = 0.12;

  function addLine(w: number, h: number, x: number, z: number) {
    const geo = new THREE.PlaneGeometry(w, h);
    const mesh = new THREE.Mesh(geo, lineMat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.02, z);
    group.add(mesh);
  }

  const hl = PITCH.LENGTH / 2;
  const hw = PITCH.WIDTH / 2;

  addLine(PITCH.LENGTH, lineW, 0, -hw);
  addLine(PITCH.LENGTH, lineW, 0, hw);
  addLine(lineW, PITCH.WIDTH, -hl, 0);
  addLine(lineW, PITCH.WIDTH, hl, 0);
  addLine(lineW, PITCH.WIDTH, 0, 0);

  const circleGeo = new THREE.RingGeometry(PITCH.CENTER_CIRCLE_RADIUS - lineW / 2, PITCH.CENTER_CIRCLE_RADIUS + lineW / 2, 64);
  const circle = new THREE.Mesh(circleGeo, lineMat);
  circle.rotation.x = -Math.PI / 2;
  circle.position.y = 0.02;
  group.add(circle);

  for (const side of [-1, 1]) {
    const gx = side * hl;
    addLine(lineW, PITCH.PENALTY_AREA_WIDTH, gx - side * PITCH.PENALTY_AREA_LENGTH / 2, 0);
    addLine(PITCH.PENALTY_AREA_LENGTH, lineW, gx - side * PITCH.PENALTY_AREA_LENGTH, -PITCH.PENALTY_AREA_WIDTH / 2);
    addLine(PITCH.PENALTY_AREA_LENGTH, lineW, gx - side * PITCH.PENALTY_AREA_LENGTH, PITCH.PENALTY_AREA_WIDTH / 2);

    addLine(lineW, PITCH.GOAL_AREA_WIDTH, gx - side * PITCH.GOAL_AREA_LENGTH / 2, 0);
    addLine(PITCH.GOAL_AREA_LENGTH, lineW, gx - side * PITCH.GOAL_AREA_LENGTH, -PITCH.GOAL_AREA_WIDTH / 2);
    addLine(PITCH.GOAL_AREA_LENGTH, lineW, gx - side * PITCH.GOAL_AREA_LENGTH, PITCH.GOAL_AREA_WIDTH / 2);

    const spot = new THREE.Mesh(
      new THREE.CircleGeometry(0.25, 16),
      lineMat,
    );
    spot.rotation.x = -Math.PI / 2;
    spot.position.set(gx - side * PITCH.PENALTY_SPOT, 0.02, 0);
    group.add(spot);
  }

  return group;
}

export function createGoal(side: 1 | -1): THREE.Group {
  const group = new THREE.Group();
  const x = side * PITCH.LENGTH / 2;
  group.position.x = x;

  const postMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.6, roughness: 0.3 });
  const postR = 0.06;
  const gw = PITCH.GOAL_WIDTH;
  const gh = PITCH.GOAL_HEIGHT;
  const gd = PITCH.GOAL_DEPTH;

  const postGeo = new THREE.CylinderGeometry(postR, postR, gh, 8);
  for (const z of [-gw / 2, gw / 2]) {
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(-side * gd / 2, gh / 2, z);
    post.castShadow = true;
    group.add(post);
  }

  const barGeo = new THREE.CylinderGeometry(postR, postR, gw, 8);
  const bar = new THREE.Mesh(barGeo, postMat);
  bar.rotation.x = Math.PI / 2;
  bar.position.set(-side * gd / 2, gh, 0);
  bar.castShadow = true;
  group.add(bar);

  const netMat = new THREE.MeshStandardMaterial({
    color: 0xeeeeee,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
    wireframe: true,
  });
  const netGeo = new THREE.BoxGeometry(gd, gh, gw, 6, 8, 12);
  const net = new THREE.Mesh(netGeo, netMat);
  net.position.set(-side * gd / 2, gh / 2, 0);
  group.add(net);

  return group;
}

export function createCornerFlag(x: number, z: number): THREE.Group {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 1.5, 6),
    new THREE.MeshStandardMaterial({ color: 0xffff00, metalness: 0.5 }),
  );
  pole.position.y = 0.75;
  group.add(pole);

  const flag = new THREE.Mesh(
    new THREE.PlaneGeometry(0.4, 0.25),
    new THREE.MeshStandardMaterial({ color: 0xff0000, side: THREE.DoubleSide }),
  );
  flag.position.set(0.2, 1.35, 0);
  group.add(flag);

  return group;
}

export function createStadium(): THREE.Group {
  const stadium = new THREE.Group();

  const hl = PITCH.LENGTH / 2 + 8;
  const hw = PITCH.WIDTH / 2 + 8;

  const standMat = new THREE.MeshStandardMaterial({ color: 0x2a2a3a, roughness: 0.9 });
  const tiers = [
    { w: 12, h: 8, y: 4, dist: 6 },
    { w: 14, h: 10, y: 12, dist: 14 },
    { w: 16, h: 12, y: 22, dist: 24 },
  ];

  for (const tier of tiers) {
    const longStand = new THREE.Mesh(
      new THREE.BoxGeometry(PITCH.LENGTH + tier.w * 2, tier.h, tier.w),
      standMat,
    );
    longStand.position.set(0, tier.y, -(hw + tier.dist));
    stadium.add(longStand);
    const longStand2 = longStand.clone();
    longStand2.position.z = hw + tier.dist;
    stadium.add(longStand2);

    const shortStand = new THREE.Mesh(
      new THREE.BoxGeometry(tier.w, tier.h, PITCH.WIDTH + tier.w),
      standMat,
    );
    shortStand.position.set(-(hl + tier.dist), tier.y, 0);
    stadium.add(shortStand);
    const shortStand2 = shortStand.clone();
    shortStand2.position.x = hl + tier.dist;
    stadium.add(shortStand2);
  }

  const boardMat = new THREE.MeshStandardMaterial({ color: 0x1a3a5c });
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(PITCH.LENGTH, 1, 0.3),
    boardMat,
  );
  board.position.set(0, 0.5, -(hw + 3));
  stadium.add(board);
  const board2 = board.clone();
  board2.position.z = hw + 3;
  stadium.add(board2);

  return stadium;
}

export function createCrowd(count = 2000): THREE.InstancedMesh {
  const geo = new THREE.PlaneGeometry(0.3, 0.5);
  const mat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, vertexColors: true });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();

  const hl = PITCH.LENGTH / 2 + 10;
  const hw = PITCH.WIDTH / 2 + 10;

  for (let i = 0; i < count; i++) {
    const side = Math.floor(Math.random() * 4);
    let x: number, y: number, z: number;
    switch (side) {
      case 0: x = (Math.random() - 0.5) * PITCH.LENGTH; y = 4 + Math.random() * 20; z = -(hw + 2 + Math.random() * 8); break;
      case 1: x = (Math.random() - 0.5) * PITCH.LENGTH; y = 4 + Math.random() * 20; z = hw + 2 + Math.random() * 8; break;
      case 2: x = -(hl + 2 + Math.random() * 8); y = 4 + Math.random() * 20; z = (Math.random() - 0.5) * PITCH.WIDTH; break;
      default: x = hl + 2 + Math.random() * 8; y = 4 + Math.random() * 20; z = (Math.random() - 0.5) * PITCH.WIDTH; break;
    }
    dummy.position.set(x, y, z);
    dummy.lookAt(x, y - 1, z * 0.5);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    color.setHSL(Math.random(), 0.5 + Math.random() * 0.3, 0.3 + Math.random() * 0.3);
    mesh.setColorAt(i, color);
  }

  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  return mesh;
}

export function createBall(): THREE.Mesh {
  const geo = new THREE.SphereGeometry(PITCH.BALL_RADIUS, 24, 24);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.4,
    metalness: 0.1,
  });
  const ball = new THREE.Mesh(geo, mat);
  ball.castShadow = true;
  return ball;
}

export interface LightingSetup {
  sun: THREE.DirectionalLight;
  ambient: THREE.AmbientLight;
  hemisphere: THREE.HemisphereLight;
  floodlights: THREE.SpotLight[];
}

export function setupLighting(scene: THREE.Scene, preset: LightingPreset): LightingSetup {
  const ambient = new THREE.AmbientLight(0x404060, 0.4);
  scene.add(ambient);

  const hemisphere = new THREE.HemisphereLight(0x87ceeb, 0x3d5c3d, 0.5);
  scene.add(hemisphere);

  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(50, 80, 30);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 200;
  sun.shadow.camera.left = -60;
  sun.shadow.camera.right = 60;
  sun.shadow.camera.top = 60;
  sun.shadow.camera.bottom = -60;
  scene.add(sun);

  const floodlights: THREE.SpotLight[] = [];
  const positions = [
    [-40, 35, -30], [40, 35, -30], [-40, 35, 30], [40, 35, 30],
  ];
  for (const [x, y, z] of positions) {
    const spot = new THREE.SpotLight(0xfff5e0, 0);
    spot.position.set(x, y, z);
    spot.angle = Math.PI / 4;
    spot.penumbra = 0.5;
    spot.castShadow = true;
    spot.shadow.mapSize.set(1024, 1024);
    scene.add(spot);
    spot.target.position.set(0, 0, 0);
    scene.add(spot.target);
    floodlights.push(spot);
  }

  applyLightingPreset({ sun, ambient, hemisphere, floodlights }, preset);
  return { sun, ambient, hemisphere, floodlights };
}

export function applyLightingPreset(setup: LightingSetup, preset: LightingPreset): void {
  switch (preset) {
    case 'day':
      setup.sun.intensity = 1.4;
      setup.sun.color.set(0xfff5e0);
      setup.ambient.intensity = 0.5;
      setup.hemisphere.intensity = 0.6;
      setup.floodlights.forEach((f) => { f.intensity = 0; });
      break;
    case 'dusk':
      setup.sun.intensity = 0.7;
      setup.sun.color.set(0xff8844);
      setup.ambient.intensity = 0.35;
      setup.hemisphere.intensity = 0.4;
      setup.floodlights.forEach((f) => { f.intensity = 0.3; });
      break;
    case 'night':
      setup.sun.intensity = 0.1;
      setup.sun.color.set(0x4466aa);
      setup.ambient.intensity = 0.15;
      setup.hemisphere.intensity = 0.1;
      setup.floodlights.forEach((f) => { f.intensity = 1.8; });
      break;
  }
}

export function createSkybox(scene: THREE.Scene, preset: LightingPreset): void {
  const colors: Record<LightingPreset, number> = {
    day: 0x87ceeb,
    dusk: 0xcc6644,
    night: 0x0a0a20,
  };
  scene.background = new THREE.Color(colors[preset]);
  scene.fog = new THREE.Fog(colors[preset], 80, 200);
}
