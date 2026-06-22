import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

export interface PostProcessing {
  composer: EffectComposer;
  bloom: UnrealBloomPass;
  ssao: SSAOPass | null;
  enabled: boolean;
}

export function setupPostProcessing(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  width: number,
  height: number,
  enableSSAO = true,
): PostProcessing {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const ssao = enableSSAO
    ? new SSAOPass(scene, camera, width, height)
    : null;
  if (ssao) {
    ssao.kernelRadius = 8;
    ssao.minDistance = 0.005;
    ssao.maxDistance = 0.1;
    composer.addPass(ssao);
  }

  const bloom = new UnrealBloomPass(
    new THREE.Vector2(width, height),
    0.3,
    0.5,
    0.85,
  );
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  return { composer, bloom, ssao, enabled: true };
}

export function resizePostProcessing(pp: PostProcessing, width: number, height: number): void {
  pp.composer.setSize(width, height);
  if (pp.ssao) pp.ssao.setSize(width, height);
  pp.bloom.resolution.set(width, height);
}
