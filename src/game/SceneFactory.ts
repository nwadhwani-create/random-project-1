import {
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  CapsuleGeometry,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DynamicDrawUsage,
  Group,
  HemisphereLight,
  InstancedMesh,
  Line,
  LineBasicMaterial,
  MathUtils,
  Matrix4,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  RingGeometry,
  Scene,
  SphereGeometry,
  SpotLight,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from "three";
import { starterTeams } from "../data/teams";
import { pitchDimensions } from "./BallPhysics";
import type { LightingPreset, SquadPlayer } from "./types";

export interface PlayerVisual {
  root: Group;
  body: Mesh;
  leftLeg: Mesh;
  rightLeg: Mesh;
  leftArm: Mesh;
  rightArm: Mesh;
}

export interface SceneParts {
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  player: PlayerVisual;
  ball: Mesh;
  crowd: InstancedMesh;
  crowdOffsets: Float32Array;
  keyLight: DirectionalLight;
  hemiLight: HemisphereLight;
  floodlights: SpotLight[];
}

const turfDark = new Color("#247337");
const turfLight = new Color("#2e8a42");

export function createScene(canvas: HTMLCanvasElement): SceneParts {
  const renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMappingExposure = 1.05;

  const scene = new Scene();
  scene.background = new Color("#86bff7");

  const camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 550);
  camera.position.set(0, 24, 38);

  const hemiLight = new HemisphereLight("#b8ddff", "#15350f", 2.2);
  scene.add(hemiLight);

  const keyLight = new DirectionalLight("#fff3d5", 3.4);
  keyLight.position.set(-26, 52, 18);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.camera.left = -80;
  keyLight.shadow.camera.right = 80;
  keyLight.shadow.camera.top = 80;
  keyLight.shadow.camera.bottom = -80;
  scene.add(keyLight);

  const floodlights = createFloodlights(scene);
  createPitch(scene);
  createGoals(scene);
  createStadium(scene);
  createAdBoards(scene);
  createCornerFlags(scene);

  const crowd = createCrowd(scene);
  const ball = createBall(scene);
  const player = createPlayer(starterTeams[0].squad[0], starterTeams[0].kit.home, starterTeams[0].kit.trim);
  scene.add(player.root);

  return {
    scene,
    camera,
    renderer,
    player,
    ball,
    crowd: crowd.mesh,
    crowdOffsets: crowd.offsets,
    keyLight,
    hemiLight,
    floodlights,
  };
}

export function applyLighting(parts: SceneParts, preset: LightingPreset): void {
  const { scene, keyLight, hemiLight, floodlights, renderer } = parts;
  if (preset === "day") {
    scene.background = new Color("#86bff7");
    keyLight.color.set("#fff3d5");
    keyLight.intensity = 3.4;
    hemiLight.intensity = 2.2;
    renderer.toneMappingExposure = 1.05;
    floodlights.forEach((light) => (light.intensity = 0));
  }

  if (preset === "dusk") {
    scene.background = new Color("#d48b6a");
    keyLight.color.set("#ffb36c");
    keyLight.intensity = 2.25;
    hemiLight.intensity = 1.55;
    renderer.toneMappingExposure = 1.1;
    floodlights.forEach((light) => (light.intensity = 2.8));
  }

  if (preset === "night") {
    scene.background = new Color("#06152a");
    keyLight.color.set("#a9c8ff");
    keyLight.intensity = 0.65;
    hemiLight.intensity = 0.65;
    renderer.toneMappingExposure = 1.25;
    floodlights.forEach((light) => (light.intensity = 6.8));
  }
}

export function animatePlayer(visual: PlayerVisual, speed: number, time: number, tackling: boolean): void {
  const stride = Math.sin(time * (8 + speed * 0.6)) * Math.min(speed * 0.09, 0.7);
  visual.leftLeg.rotation.x = stride;
  visual.rightLeg.rotation.x = -stride;
  visual.leftArm.rotation.x = -stride * 0.7;
  visual.rightArm.rotation.x = stride * 0.7;
  visual.body.rotation.z = Math.sin(time * 5) * Math.min(speed * 0.006, 0.06);
  if (tackling) {
    visual.root.rotation.x = -0.62;
    visual.leftLeg.rotation.x = -1.05;
    visual.rightLeg.rotation.x = -0.2;
  } else {
    visual.root.rotation.x = MathUtils.lerp(visual.root.rotation.x, 0, 0.18);
  }
}

export function animateCrowd(parts: SceneParts, time: number, intensity: number): void {
  const matrix = new Matrix4();
  const object = new Object3D();
  const count = parts.crowd.count;
  for (let index = 0; index < count; index += 1) {
    const phase = parts.crowdOffsets[index];
    parts.crowd.getMatrixAt(index, matrix);
    matrix.decompose(object.position, object.quaternion, object.scale);
    object.position.y = 3 + Math.sin(time * 3.5 + phase) * 0.08 * intensity;
    object.updateMatrix();
    parts.crowd.setMatrixAt(index, object.matrix);
  }
  parts.crowd.instanceMatrix.needsUpdate = true;
}

function createPitch(scene: Scene): void {
  const turf = new MeshPhysicalMaterial({
    color: turfDark,
    roughness: 0.84,
    metalness: 0,
    clearcoat: 0.12,
    clearcoatRoughness: 0.9,
  });
  const pitch = new Mesh(new PlaneGeometry(74, 112), turf);
  pitch.rotation.x = -Math.PI / 2;
  pitch.receiveShadow = true;
  scene.add(pitch);

  for (let i = 0; i < 14; i += 1) {
    const stripe = new Mesh(
      new PlaneGeometry(74, 8),
      new MeshStandardMaterial({ color: i % 2 === 0 ? turfLight : turfDark, roughness: 0.92 }),
    );
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.z = -52 + i * 8 + 4;
    stripe.position.y = 0.012;
    stripe.receiveShadow = true;
    scene.add(stripe);
  }

  const lineMaterial = new LineBasicMaterial({ color: "#f5fff7", linewidth: 2 });
  addRectangle(scene, 68, 105, lineMaterial);
  addRectangle(scene, 40.3, 16.5, lineMaterial, 0, -44.25);
  addRectangle(scene, 40.3, 16.5, lineMaterial, 0, 44.25);
  addRectangle(scene, 18.3, 5.5, lineMaterial, 0, -49.75);
  addRectangle(scene, 18.3, 5.5, lineMaterial, 0, 49.75);
  addLine(scene, [-34, 0.04, 0], [34, 0.04, 0], lineMaterial);

  const center = new Line(new RingGeometry(9.15, 9.2, 80).rotateX(-Math.PI / 2), lineMaterial);
  center.position.y = 0.035;
  scene.add(center);

  const spotMaterial = new MeshStandardMaterial({ color: "#f5fff7" });
  [-41.5, 0, 41.5].forEach((z) => {
    const spot = new Mesh(new CircleGeometry(0.35, 24), spotMaterial);
    spot.rotation.x = -Math.PI / 2;
    spot.position.set(0, 0.045, z);
    scene.add(spot);
  });
}

function createGoals(scene: Scene): void {
  [-1, 1].forEach((side) => {
    const goal = new Group();
    goal.position.z = side * 54;
    const postMaterial = new MeshStandardMaterial({ color: "#f7fbff", roughness: 0.35 });
    const netMaterial = new LineBasicMaterial({ color: "#d7edf5", transparent: true, opacity: 0.48 });

    [-3.66, 3.66].forEach((x) => {
      const post = new Mesh(new CylinderGeometry(0.08, 0.08, 2.44, 12), postMaterial);
      post.position.set(x, 1.22, 0);
      post.castShadow = true;
      goal.add(post);
    });
    const crossbar = new Mesh(new CylinderGeometry(0.08, 0.08, 7.32, 12), postMaterial);
    crossbar.rotation.z = Math.PI / 2;
    crossbar.position.set(0, 2.44, 0);
    crossbar.castShadow = true;
    goal.add(crossbar);

    for (let x = -3.6; x <= 3.61; x += 0.6) {
      addLine(goal, [x, 0.1, 0], [x * 0.86, 2.4, side * 1.8], netMaterial);
    }
    for (let y = 0.25; y <= 2.41; y += 0.36) {
      addLine(goal, [-3.6, y, 0], [-3.05, y, side * 1.8], netMaterial);
      addLine(goal, [3.6, y, 0], [3.05, y, side * 1.8], netMaterial);
      addLine(goal, [-3.05, y, side * 1.8], [3.05, y, side * 1.8], netMaterial);
    }
    scene.add(goal);
  });
}

function createStadium(scene: Scene): void {
  const concrete = new MeshStandardMaterial({ color: "#55616d", roughness: 0.78, metalness: 0.05 });
  for (let tier = 0; tier < 3; tier += 1) {
    const height = 2 + tier * 4;
    const width = 100 + tier * 17;
    const length = 136 + tier * 19;
    const stand = new Mesh(new BoxGeometry(width, 3, 7), concrete);
    stand.position.set(0, height, -length / 2);
    stand.rotation.x = -0.08;
    stand.receiveShadow = true;
    scene.add(stand);
    const standFar = stand.clone();
    standFar.position.z *= -1;
    standFar.rotation.x = 0.08;
    scene.add(standFar);

    const sideStand = new Mesh(new BoxGeometry(7, 3, length), concrete);
    sideStand.position.set(-width / 2, height, 0);
    sideStand.rotation.z = 0.08;
    scene.add(sideStand);
    const sideStandFar = sideStand.clone();
    sideStandFar.position.x *= -1;
    sideStandFar.rotation.z = -0.08;
    scene.add(sideStandFar);
  }
}

function createCrowd(scene: Scene): { mesh: InstancedMesh; offsets: Float32Array } {
  const geometry = new BoxGeometry(0.5, 0.9, 0.18);
  const material = new MeshStandardMaterial({ roughness: 0.9, metalness: 0.02, vertexColors: false });
  const count = 760;
  const crowd = new InstancedMesh(geometry, material, count);
  crowd.instanceMatrix.setUsage(DynamicDrawUsage);
  const object = new Object3D();
  const offsets = new Float32Array(count);
  const colors = ["#e11d48", "#f8fafc", "#0f766e", "#2563eb", "#facc15", "#171717"];

  for (let i = 0; i < count; i += 1) {
    const side = i % 4;
    const row = Math.floor(i / 95) % 8;
    const spread = (i % 95) / 94 - 0.5;
    if (side < 2) {
      object.position.set(spread * 108, 3 + row * 0.58, side === 0 ? -61 - row * 2.2 : 61 + row * 2.2);
    } else {
      object.position.set(side === 2 ? -46 - row * 2.2 : 46 + row * 2.2, 3 + row * 0.58, spread * 128);
      object.rotation.y = Math.PI / 2;
    }
    object.scale.setScalar(MathUtils.randFloat(0.8, 1.2));
    object.updateMatrix();
    crowd.setMatrixAt(i, object.matrix);
    crowd.setColorAt(i, new Color(colors[i % colors.length]));
    offsets[i] = Math.random() * Math.PI * 2;
    object.rotation.y = 0;
  }
  crowd.castShadow = true;
  crowd.receiveShadow = true;
  scene.add(crowd);
  return { mesh: crowd, offsets };
}

function createAdBoards(scene: Scene): void {
  const messages = ["GLOBAL FOOTBALL", "2026 SUMMER CUP", "PLAY THE WORLD", "ORIGINAL KITS"];
  const positions = [
    [0, -57, 0],
    [0, 57, Math.PI],
    [-40, 0, Math.PI / 2],
    [40, 0, -Math.PI / 2],
  ] as const;
  positions.forEach(([x, z, rotation], index) => {
    for (let offset = -32; offset <= 32; offset += 16) {
      const board = new Mesh(
        new BoxGeometry(14, 2.1, 0.2),
        new MeshStandardMaterial({ map: makeTextTexture(messages[index], "#07111f", "#7dd3fc"), emissive: "#06131f" }),
      );
      board.position.set(x === 0 ? offset : x, 1.1, z === 0 ? offset : z);
      board.rotation.y = rotation;
      board.castShadow = true;
      scene.add(board);
    }
  });
}

function createCornerFlags(scene: Scene): void {
  const poleMaterial = new MeshStandardMaterial({ color: "#f8fafc" });
  const flagMaterial = new MeshStandardMaterial({ color: "#f97316", side: 2 });
  [
    [-34, -52.5],
    [34, -52.5],
    [-34, 52.5],
    [34, 52.5],
  ].forEach(([x, z]) => {
    const group = new Group();
    const pole = new Mesh(new CylinderGeometry(0.035, 0.035, 1.6, 8), poleMaterial);
    pole.position.y = 0.8;
    const flag = new Mesh(new PlaneGeometry(0.75, 0.42), flagMaterial);
    flag.position.set(0.35, 1.35, 0);
    group.add(pole, flag);
    group.position.set(x, 0, z);
    scene.add(group);
  });
}

function createFloodlights(scene: Scene): SpotLight[] {
  const lights: SpotLight[] = [];
  [
    [-47, 23, -64],
    [47, 23, -64],
    [-47, 23, 64],
    [47, 23, 64],
  ].forEach(([x, y, z]) => {
    const mast = new Mesh(
      new CylinderGeometry(0.2, 0.3, y, 12),
      new MeshStandardMaterial({ color: "#9aa8b8", roughness: 0.45, metalness: 0.7 }),
    );
    mast.position.set(x, y / 2, z);
    scene.add(mast);
    const light = new SpotLight("#dfefff", 0, 125, Math.PI / 5, 0.45, 1.2);
    light.position.set(x, y, z);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;
    scene.add(light, light.target);
    lights.push(light);
  });
  return lights;
}

function createBall(scene: Scene): Mesh {
  const ball = new Mesh(
    new SphereGeometry(pitchDimensions.ballRadius, 32, 18),
    new MeshPhysicalMaterial({ color: "#f8fafc", roughness: 0.4, clearcoat: 0.7, clearcoatRoughness: 0.35 }),
  );
  ball.castShadow = true;
  scene.add(ball);
  return ball;
}

function createPlayer(player: SquadPlayer, kitColor: string, trim: string): PlayerVisual {
  const root = new Group();
  const kit = new MeshStandardMaterial({ color: kitColor, roughness: 0.62, metalness: 0.02 });
  const skin = new MeshStandardMaterial({ color: player.skinTone, roughness: 0.72 });
  const hair = new MeshStandardMaterial({ color: player.hair, roughness: 0.85 });
  const sock = new MeshStandardMaterial({ color: trim, roughness: 0.7 });

  const body = new Mesh(new CapsuleGeometry(0.48, 1.0, 6, 12), kit);
  body.position.y = 1.45;
  body.castShadow = true;
  const head = new Mesh(new SphereGeometry(0.28, 18, 14), skin);
  head.position.y = 2.35;
  head.castShadow = true;
  const hairCap = new Mesh(new SphereGeometry(0.29, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), hair);
  hairCap.position.y = 2.42;
  hairCap.castShadow = true;

  const leftLeg = limb(0.16, 0.9, sock, -0.22, 0.62);
  const rightLeg = limb(0.16, 0.9, sock, 0.22, 0.62);
  const leftArm = limb(0.12, 0.85, skin, -0.58, 1.55);
  const rightArm = limb(0.12, 0.85, skin, 0.58, 1.55);

  const nameplate = new Mesh(
    new PlaneGeometry(1.15, 0.45),
    new MeshStandardMaterial({
      map: makeTextTexture(`${player.number} ${player.name.split(" ").at(-1)}`, "rgba(255,255,255,0)", trim),
      transparent: true,
    }),
  );
  nameplate.position.set(0, 1.58, -0.51);
  nameplate.rotation.y = Math.PI;

  root.add(body, head, hairCap, leftLeg, rightLeg, leftArm, rightArm, nameplate);
  root.position.set(0, 0, 8);
  return { root, body, leftLeg, rightLeg, leftArm, rightArm };
}

function limb(radius: number, height: number, material: MeshStandardMaterial, x: number, y: number): Mesh {
  const mesh = new Mesh(new CapsuleGeometry(radius, height, 4, 10), material);
  mesh.position.set(x, y, 0);
  mesh.castShadow = true;
  return mesh;
}

function addRectangle(
  group: Scene | Group,
  width: number,
  length: number,
  material: LineBasicMaterial,
  x = 0,
  z = 0,
): void {
  const halfW = width / 2;
  const halfL = length / 2;
  const points = [
    new Vector3(x - halfW, 0.04, z - halfL),
    new Vector3(x + halfW, 0.04, z - halfL),
    new Vector3(x + halfW, 0.04, z + halfL),
    new Vector3(x - halfW, 0.04, z + halfL),
    new Vector3(x - halfW, 0.04, z - halfL),
  ];
  group.add(new Line(new BufferGeometry().setFromPoints(points), material));
}

function addLine(group: Scene | Group, from: number[], to: number[], material: LineBasicMaterial): void {
  group.add(new Line(new BufferGeometry().setFromPoints([new Vector3(...from), new Vector3(...to)]), material));
}

function makeTextTexture(text: string, background: string, foreground: string): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D context unavailable.");
  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = foreground;
  context.font = "800 44px Arial";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
