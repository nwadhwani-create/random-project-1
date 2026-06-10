import * as THREE from 'three';
import {
  PITCH_LENGTH, PITCH_WIDTH, HALF_L, HALF_W, GOAL_WIDTH, GOAL_HALF_W, GOAL_HEIGHT, GOAL_DEPTH,
  BOX_LENGTH, BOX_WIDTH, SIX_LENGTH, SIX_WIDTH, PENALTY_SPOT, CENTER_CIRCLE_R, POST_RADIUS,
} from '../sim/const';

/** procedural grass texture with mowing stripes + noise */
function grassTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 1024;
  const g = c.getContext('2d')!;
  const stripes = 16;
  for (let i = 0; i < stripes; i++) {
    g.fillStyle = i % 2 ? '#2e7d32' : '#388e3c';
    g.fillRect((i / stripes) * c.width, 0, c.width / stripes + 1, c.height);
  }
  // grain noise
  const img = g.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 22;
    d[i] += n; d[i + 1] += n; d[i + 2] += n * 0.6;
  }
  g.putImageData(img, 0, 0);
  // subtle blade streaks
  g.globalAlpha = 0.05;
  for (let i = 0; i < 1600; i++) {
    g.strokeStyle = Math.random() < 0.5 ? '#1d5e21' : '#54a857';
    const x = Math.random() * c.width, y = Math.random() * c.height;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + (Math.random() - 0.5) * 3, y + 4 + Math.random() * 7); g.stroke();
  }
  g.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function lineMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: 0xf4f6f0, roughness: 0.85, metalness: 0 });
}

/** flat line segment laid on the pitch */
function line(group: THREE.Group, x: number, z: number, w: number, h: number, mat: THREE.Material): void {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, 0.015, z);
  m.receiveShadow = true;
  group.add(m);
}

function ring(group: THREE.Group, x: number, z: number, r: number, mat: THREE.Material, thetaStart = 0, thetaLen = Math.PI * 2): void {
  const m = new THREE.Mesh(new THREE.RingGeometry(r - 0.06, r + 0.06, 64, 1, thetaStart, thetaLen), mat);
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, 0.015, z);
  group.add(m);
}

function makeNet(side: number): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffffff, wireframe: true, transparent: true, opacity: 0.32,
  });
  // back panel
  const back = new THREE.Mesh(new THREE.PlaneGeometry(GOAL_WIDTH, GOAL_HEIGHT, 14, 6), mat);
  back.position.set(side * GOAL_DEPTH, GOAL_HEIGHT / 2, 0);
  back.rotation.y = -side * Math.PI / 2;
  g.add(back);
  // top panel
  const top = new THREE.Mesh(new THREE.PlaneGeometry(GOAL_DEPTH, GOAL_WIDTH, 5, 14), mat);
  top.rotation.z = -side * Math.PI / 2;
  top.rotation.x = -Math.PI / 2;
  top.position.set(side * GOAL_DEPTH / 2, GOAL_HEIGHT - 0.02, 0);
  g.add(top);
  // side panels
  for (const s of [-1, 1]) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(side * -GOAL_DEPTH, 0);
    shape.lineTo(side * -GOAL_DEPTH, GOAL_HEIGHT);
    shape.lineTo(0, GOAL_HEIGHT);
    shape.lineTo(0, 0);
    const sideMesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), mat);
    sideMesh.rotation.y = Math.PI / 2;
    sideMesh.position.set(0, 0, s * GOAL_HALF_W);
    g.add(sideMesh);
  }
  return g;
}

function makeGoal(side: number): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xf8f8f8, roughness: 0.35, metalness: 0.15 });
  const postGeo = new THREE.CylinderGeometry(POST_RADIUS, POST_RADIUS, GOAL_HEIGHT + POST_RADIUS, 12);
  for (const z of [-GOAL_HALF_W, GOAL_HALF_W]) {
    const post = new THREE.Mesh(postGeo, mat);
    post.position.set(0, (GOAL_HEIGHT + POST_RADIUS) / 2, z);
    post.castShadow = true;
    g.add(post);
  }
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(POST_RADIUS, POST_RADIUS, GOAL_WIDTH + POST_RADIUS * 2, 12), mat);
  bar.rotation.x = Math.PI / 2;
  bar.position.set(0, GOAL_HEIGHT, 0);
  bar.castShadow = true;
  g.add(bar);
  // back stanchions
  const supGeo = new THREE.CylinderGeometry(0.03, 0.03, GOAL_DEPTH * 1.18, 8);
  for (const z of [-GOAL_HALF_W, GOAL_HALF_W]) {
    const sup = new THREE.Mesh(supGeo, mat);
    sup.rotation.z = side * Math.PI / 2.6;
    sup.position.set(side * GOAL_DEPTH / 2, GOAL_HEIGHT / 2 + 0.4, z);
    g.add(sup);
  }
  g.add(makeNet(side));
  g.position.set(side * HALF_L, 0, 0);
  return g;
}

function cornerFlag(x: number, z: number): THREE.Group {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.025, 1.5, 8),
    new THREE.MeshStandardMaterial({ color: 0xffe14d, roughness: 0.6 }),
  );
  pole.position.y = 0.75;
  g.add(pole);
  const flag = new THREE.Mesh(
    new THREE.PlaneGeometry(0.42, 0.3),
    new THREE.MeshStandardMaterial({ color: 0xff4d4d, side: THREE.DoubleSide, roughness: 0.8 }),
  );
  flag.position.set(0.21 * -Math.sign(x), 1.32, 0);
  flag.rotation.y = Math.sign(x) > 0 ? Math.PI : 0;
  g.add(flag);
  g.position.set(x, 0, z);
  return g;
}

function adBoards(): THREE.Group {
  const g = new THREE.Group();
  const texts = ['WORLD CUP 26™', 'CANADA · MEXICO · USA', 'WE ARE 26', 'FOOTBALL UNITES', 'GOOOAL ENERGY', 'SKY ATLAS AIR', 'CURSOR ARENA', 'PITCHSIDE COLA'];
  const colors = ['#0c2340', '#7a003c', '#0a5c36', '#222266', '#90261c', '#114455', '#202020', '#5c2d91'];
  const makeTex = (i: number) => {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 64;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const t = texts[i % texts.length];
    for (let x = 170; x < c.width; x += 400) ctx.fillText(t, x, c.height / 2 + 2);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  };
  let i = 0;
  const H = 0.95;
  const mk = (w: number) => {
    const mat = new THREE.MeshStandardMaterial({ map: makeTex(i++), roughness: 0.5, emissive: 0xffffff, emissiveMap: null, emissiveIntensity: 0 });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, H), mat);
    m.position.y = H / 2;
    return m;
  };
  // along far/near touchlines
  for (const zs of [-1, 1]) {
    const seg = PITCH_LENGTH / 4;
    for (let k = 0; k < 4; k++) {
      const b = mk(seg - 0.6);
      b.position.x = -HALF_L + seg * (k + 0.5);
      b.position.z = zs * (HALF_W + 4.2);
      if (zs < 0) b.rotation.y = 0; else b.rotation.y = Math.PI;
      g.add(b);
    }
  }
  // behind goals
  for (const xs of [-1, 1]) {
    const seg = PITCH_WIDTH / 3;
    for (let k = 0; k < 3; k++) {
      const b = mk(seg - 0.6);
      b.position.z = -HALF_W + seg * (k + 0.5);
      b.position.x = xs * (HALF_L + 5.5);
      b.rotation.y = xs < 0 ? Math.PI / 2 : -Math.PI / 2;
      g.add(b);
    }
  }
  return g;
}

export function createPitch(): THREE.Group {
  const root = new THREE.Group();

  const tex = grassTexture();
  tex.repeat.set(1, 1);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(PITCH_LENGTH + 14, PITCH_WIDTH + 14),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, metalness: 0 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  root.add(ground);

  // apron (darker surround)
  const apron = new THREE.Mesh(
    new THREE.PlaneGeometry(PITCH_LENGTH + 60, PITCH_WIDTH + 56),
    new THREE.MeshStandardMaterial({ color: 0x24512a, roughness: 1 }),
  );
  apron.rotation.x = -Math.PI / 2;
  apron.position.y = -0.02;
  apron.receiveShadow = true;
  root.add(apron);

  // ----- markings
  const lines = new THREE.Group();
  const lm = lineMaterial();
  const LW = 0.12;
  // boundary
  line(lines, 0, -HALF_W, PITCH_LENGTH + LW, LW, lm);
  line(lines, 0, HALF_W, PITCH_LENGTH + LW, LW, lm);
  line(lines, -HALF_L, 0, LW, PITCH_WIDTH + LW, lm);
  line(lines, HALF_L, 0, LW, PITCH_WIDTH + LW, lm);
  // halfway
  line(lines, 0, 0, LW, PITCH_WIDTH, lm);
  ring(lines, 0, 0, CENTER_CIRCLE_R, lm);
  line(lines, 0, 0, 0.4, 0.4, lm); // center spot
  for (const s of [-1, 1]) {
    const gx = s * HALF_L;
    // penalty area
    line(lines, gx - s * BOX_LENGTH / 2, -BOX_WIDTH / 2, BOX_LENGTH, LW, lm);
    line(lines, gx - s * BOX_LENGTH / 2, BOX_WIDTH / 2, BOX_LENGTH, LW, lm);
    line(lines, gx - s * BOX_LENGTH, 0, LW, BOX_WIDTH + LW, lm);
    // six-yard
    line(lines, gx - s * SIX_LENGTH / 2, -SIX_WIDTH / 2, SIX_LENGTH, LW, lm);
    line(lines, gx - s * SIX_LENGTH / 2, SIX_WIDTH / 2, SIX_LENGTH, LW, lm);
    line(lines, gx - s * SIX_LENGTH, 0, LW, SIX_WIDTH + LW, lm);
    // penalty spot + arc
    line(lines, gx - s * PENALTY_SPOT, 0, 0.4, 0.4, lm);
    const arcStart = s > 0 ? Math.PI - 0.93 : -0.93;
    ring(lines, gx - s * PENALTY_SPOT, 0, CENTER_CIRCLE_R, lm, arcStart, 1.86);
    // corner arcs
    for (const zs of [-1, 1]) {
      const t0 = s > 0 ? (zs > 0 ? Math.PI : Math.PI / 2) : (zs > 0 ? -Math.PI / 2 : 0);
      ring(lines, gx, zs * HALF_W, 1, lm, t0, Math.PI / 2);
    }
  }
  root.add(lines);

  root.add(makeGoal(1));
  root.add(makeGoal(-1));
  root.add(cornerFlag(-HALF_L, -HALF_W));
  root.add(cornerFlag(-HALF_L, HALF_W));
  root.add(cornerFlag(HALF_L, -HALF_W));
  root.add(cornerFlag(HALF_L, HALF_W));
  root.add(adBoards());

  return root;
}
