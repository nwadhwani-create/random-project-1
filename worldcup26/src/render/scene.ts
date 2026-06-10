import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

export type LightingPreset = 'day' | 'dusk' | 'night';

export interface SceneCtx {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  composer: EffectComposer;
  sun: THREE.DirectionalLight;
  setPreset(p: LightingPreset): void;
  preset: LightingPreset;
  floodlights: THREE.Group;
  resize(): void;
  render(): void;
}

/** simple procedural sky + ambient gradient via large sphere */
function makeSky(): { mesh: THREE.Mesh; mat: THREE.ShaderMaterial } {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      topColor: { value: new THREE.Color('#3a7bd5') },
      horizonColor: { value: new THREE.Color('#cfe8ff') },
      bottomColor: { value: new THREE.Color('#9db8c9') },
    },
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor; uniform vec3 horizonColor; uniform vec3 bottomColor;
      varying vec3 vDir;
      void main() {
        float h = vDir.y;
        vec3 c = h > 0.0 ? mix(horizonColor, topColor, pow(min(h * 1.6, 1.0), 0.7))
                         : mix(horizonColor, bottomColor, min(-h * 3.0, 1.0));
        gl_FragColor = vec4(c, 1.0);
      }
    `,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(900, 24, 16), mat);
  mesh.frustumCulled = false;
  return { mesh, mat };
}

export function createScene(canvas: HTMLCanvasElement): SceneCtx {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xcfe8ff, 250, 800);

  const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.5, 1200);
  camera.position.set(0, 42, 62);
  camera.lookAt(0, 0, 0);

  const sky = makeSky();
  scene.add(sky.mesh);

  const hemi = new THREE.HemisphereLight(0xbfd8ff, 0x3c5a36, 0.85);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffffff, 2.6);
  sun.position.set(-80, 120, 60);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -90;
  sun.shadow.camera.right = 90;
  sun.shadow.camera.top = 90;
  sun.shadow.camera.bottom = -90;
  sun.shadow.camera.near = 20;
  sun.shadow.camera.far = 320;
  sun.shadow.bias = -0.0004;
  scene.add(sun);
  scene.add(sun.target);

  // floodlight spots (only strong at night)
  const floodlights = new THREE.Group();
  const floodPositions: [number, number][] = [[-75, -52], [75, -52], [-75, 52], [75, 52]];
  for (const [x, z] of floodPositions) {
    // physical inverse-square decay; intensity is set per lighting preset
    const spot = new THREE.SpotLight(0xeef4ff, 0, 0, 0.62, 0.45, 2);
    spot.position.set(x, 46, z);
    spot.target.position.set(x * 0.2, 0, z * 0.2);
    floodlights.add(spot);
    floodlights.add(spot.target);
  }
  scene.add(floodlights);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.32, 0.55, 0.92);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  let preset: LightingPreset = 'day';

  function setPreset(p: LightingPreset): void {
    preset = ctx.preset = p;
    const skyU = (sky.mat.uniforms as any);
    if (p === 'day') {
      sun.intensity = 2.6;
      sun.color.set(0xfff6e6);
      sun.position.set(-80, 120, 60);
      hemi.intensity = 0.85;
      hemi.color.set(0xbfd8ff);
      skyU.topColor.value.set('#3a7bd5');
      skyU.horizonColor.value.set('#cfe8ff');
      scene.fog!.color.set(0xcfe8ff);
      renderer.toneMappingExposure = 1.0;
      bloom.strength = 0.25;
      floodlights.children.forEach((c) => { if ((c as THREE.SpotLight).isSpotLight) (c as THREE.SpotLight).intensity = 0; });
    } else if (p === 'dusk') {
      sun.intensity = 1.5;
      sun.color.set(0xffa45e);
      sun.position.set(-140, 30, 80);
      hemi.intensity = 0.42;
      hemi.color.set(0xb08aa0);
      skyU.topColor.value.set('#2d2566');
      skyU.horizonColor.value.set('#e8824f');
      scene.fog!.color.set(0x8a6a5d);
      renderer.toneMappingExposure = 0.92;
      bloom.strength = 0.3;
      floodlights.children.forEach((c) => { if ((c as THREE.SpotLight).isSpotLight) (c as THREE.SpotLight).intensity = 1400; });
    } else {
      sun.intensity = 0.18;
      sun.color.set(0x8fa8d8);
      sun.position.set(60, 140, -40);
      hemi.intensity = 0.3;
      hemi.color.set(0x6f86c2);
      skyU.topColor.value.set('#0a1030');
      skyU.horizonColor.value.set('#1d2c55');
      scene.fog!.color.set(0x131c38);
      renderer.toneMappingExposure = 1.0;
      bloom.strength = 0.42;
      floodlights.children.forEach((c) => { if ((c as THREE.SpotLight).isSpotLight) (c as THREE.SpotLight).intensity = 9500; });
    }
  }

  function resize(): void {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', resize);

  const ctx: SceneCtx = {
    renderer, scene, camera, composer, sun, floodlights,
    setPreset, preset,
    resize,
    render: () => composer.render(),
  };
  setPreset('day');
  return ctx;
}
