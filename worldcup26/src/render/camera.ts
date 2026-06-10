import * as THREE from 'three';
import { Match } from '../sim/match';
import { HALF_L } from '../sim/const';

export type CamMode = 'tv' | 'replay' | 'celebration' | 'penalty';

const target = new THREE.Vector3();
const desired = new THREE.Vector3();

/**
 * Broadcast-style camera: elevated sideline view tracking the ball with
 * smooth damping, plus replay / celebration framings.
 */
export class TVCamera {
  mode: CamMode = 'tv';
  private lookAt = new THREE.Vector3();
  private pos = new THREE.Vector3(0, 36, 54);
  private celebTime = 0;
  private replayOrbit = 0;

  constructor(private cam: THREE.PerspectiveCamera) {}

  snap(match: Match): void {
    this.computeTV(match, desired, target);
    this.pos.copy(desired);
    this.lookAt.copy(target);
    this.apply();
  }

  private computeTV(match: Match, outPos: THREE.Vector3, outLook: THREE.Vector3): void {
    const b = match.ball.pos;
    // follow ball x, stay on one sideline; zoom out near boxes
    const x = THREE.MathUtils.clamp(b.x * 0.82, -HALF_L + 14, HALF_L - 14);
    const depth = 42 + Math.abs(b.z) * 0.3;
    outPos.set(x, 23 + Math.abs(b.x) * 0.04, depth);
    outLook.set(THREE.MathUtils.clamp(b.x * 0.9, -HALF_L, HALF_L), 1.0, b.z * 0.5);
  }

  update(match: Match, dt: number, time: number): void {
    const m = match;

    if (m.phase === 'goal') {
      // celebration cutaway: orbit the scorer
      this.celebTime += dt;
      const lt = m.ball.lastTouch;
      const scorer = lt ? m.sides[lt.teamIdx].players[lt.playerIdx] : null;
      if (scorer) {
        const a = time * 0.4;
        desired.set(scorer.pos.x + Math.cos(a) * 9, 3.4, scorer.pos.z + Math.sin(a) * 9);
        target.set(scorer.pos.x, 1.2, scorer.pos.z);
      } else {
        this.computeTV(m, desired, target);
      }
      this.damp(desired, target, dt, 2.2);
      return;
    }
    this.celebTime = 0;

    if ((m.restart === 'penalty' && (m.phase === 'set-piece' || m.phase === 'play')) || m.shootout) {
      // behind-the-kicker penalty cam
      const atk = m.sides[m.restartTeam];
      const goalX = HALF_L * atk.attackDir;
      desired.set(m.restartPos.x - atk.attackDir * 9, 3.2, 6.5);
      target.set(goalX, 1.2, 0);
      this.damp(desired, target, dt, 3);
      return;
    }

    this.computeTV(m, desired, target);
    this.damp(desired, target, dt, 3.2);
  }

  /** orbiting replay camera around a world point */
  updateReplay(center: THREE.Vector3, t01: number, dt: number): void {
    this.replayOrbit += dt * 0.5;
    const r = 14 - t01 * 5;
    desired.set(center.x + Math.cos(this.replayOrbit) * r, 4.5 + t01 * 2, center.z + Math.sin(this.replayOrbit) * r);
    target.copy(center).setY(1);
    this.damp(desired, target, dt, 4);
  }

  private damp(p: THREE.Vector3, l: THREE.Vector3, dt: number, k: number): void {
    const a = 1 - Math.exp(-k * dt);
    this.pos.lerp(p, a);
    this.lookAt.lerp(l, a);
    this.apply();
  }

  private apply(): void {
    this.cam.position.copy(this.pos);
    this.cam.lookAt(this.lookAt);
  }
}
