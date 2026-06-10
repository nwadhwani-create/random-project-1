import * as THREE from 'three';
import { Match } from './match';
import { PlayerSim } from './player';
import { Input } from '../core/input';
import { HALF_L } from './const';

const v1 = new THREE.Vector3();

/**
 * Maps user input to the currently controlled player of one team.
 * Handles auto/manual switching, charged shots (power gauge) and set pieces.
 */
export class UserController {
  controlled: PlayerSim | null = null;
  shotCharge = 0;     // 0..1 while shoot held
  charging = false;
  passCharge = 0;
  passChargingLob = false;
  gkControlled = false;

  constructor(public teamIdx: number, private match: Match, private input: Input) {
    this.autoPick();
  }

  get side() { return this.match.sides[this.teamIdx]; }

  autoPick(): void {
    const m = this.match;
    // nearest controllable outfielder to the ball
    let best: PlayerSim | null = null, bd = Infinity;
    for (const p of m.activePlayers(this.teamIdx)) {
      if (p.isGK && !this.gkControlled) continue;
      if (!p.controllable) continue;
      const d = p.pos.distanceToSquared(m.ball.pos);
      if (d < bd) { bd = d; best = p; }
    }
    if (best) this.controlled = best;
  }

  /** cycle to next-closest player (manual switch) */
  switchPlayer(): void {
    const m = this.match;
    const sorted = m.activePlayers(this.teamIdx)
      .filter((p) => p.controllable && !p.isGK)
      .sort((a, b) => a.pos.distanceToSquared(m.ball.pos) - b.pos.distanceToSquared(m.ball.pos));
    if (!sorted.length) return;
    const i = this.controlled ? sorted.indexOf(this.controlled) : -1;
    this.controlled = sorted[(i + 1) % sorted.length];
  }

  step(dt: number): void {
    const m = this.match;
    const inp = this.input;

    // auto switch when ball changes hands / loose ball closer to someone else
    const owner = m.ballOwnerPlayer();
    if (owner && owner.teamIdx === this.teamIdx) {
      this.controlled = owner;
    } else if (!this.controlled || !this.controlled.controllable) {
      this.autoPick();
    } else if (!owner) {
      // if a teammate is much closer to the loose ball, auto-switch
      const cur = this.controlled.pos.distanceTo(m.ball.pos);
      const near = m.nearestToBall(this.teamIdx);
      if (near && near !== this.controlled && !near.isGK && cur - near.pos.distanceTo(m.ball.pos) > 6) {
        this.controlled = near;
      }
    }

    if (inp.justPressed('switch')) this.switchPlayer();
    if (inp.justPressed('gk')) this.gkControlled = !this.gkControlled;
    if (this.gkControlled) {
      this.controlled = this.side.players[0];
    } else if (this.controlled?.isGK && (!owner || owner !== this.controlled)) {
      this.autoPick();
    }

    const p = this.controlled;
    if (!p) return;

    // ----- set pieces: user takes them
    if (m.phase === 'set-piece' && m.restartTeam === this.teamIdx && m.restartTaker) {
      this.controlled = m.restartTaker;
      this.handleSetPiece(dt);
      return;
    }

    if (m.phase !== 'play') { this.charging = false; this.shotCharge = 0; return; }
    if (!p.controllable) return;

    // ----- movement
    const mx = inp.moveX, mz = inp.moveZ;
    const moving = Math.abs(mx) > 0.05 || Math.abs(mz) > 0.05;
    if (moving) {
      v1.set(mx, 0, mz).normalize();
      p.moveTarget.copy(p.pos).addScaledVector(v1, 6);
      p.sprinting = inp.isDown('sprint');
    } else {
      p.moveTarget.copy(p.pos);
      p.sprinting = false;
    }

    const aim = moving ? v1.set(mx, 0, mz).normalize().clone() : v1.set(Math.cos(p.facing), 0, Math.sin(p.facing)).clone();

    // ----- shooting with power gauge (chargeable even before receiving the ball)
    if (inp.justPressed('shoot')) { this.charging = true; this.shotCharge = 0; }
    if (this.charging && inp.isDown('shoot')) {
      this.shotCharge = Math.min(1, this.shotCharge + dt * 1.4);
    }
    if (this.charging && (inp.justReleased('shoot') || this.shotCharge >= 1)) {
      this.charging = false;
      if (p.hasBall) {
        m.shoot(p, Math.max(0.25, this.shotCharge), this.aimSide(aim));
      } else if (m.ball.pos.y > 0.7 && p.pos.distanceTo(m.ball.pos) < 2.4) {
        // volley / header attempt on an airborne ball
        m.clearBall(p);
      }
      this.shotCharge = 0;
    }

    if (p.hasBall) {
      if (inp.justPressed('pass')) m.pass(p, aim, false, false);
      if (inp.justPressed('lob')) m.pass(p, aim, true, false);
      if (inp.justPressed('through')) m.pass(p, aim, false, true);
    } else {
      if (inp.justPressed('pass')) m.tackle(p);
      if (inp.justPressed('slide')) m.slideTackle(p);
    }
  }

  private aimSide(aim: THREE.Vector3): number {
    // z-component of aim relative to attacking direction picks near/far post
    const dir = this.side.attackDir;
    return THREE.MathUtils.clamp(aim.z * dir * 1.4, -1, 1);
  }

  private handleSetPiece(dt: number): void {
    const m = this.match;
    const inp = this.input;
    const p = m.restartTaker!;
    const aimRaw = v1.set(inp.moveX, 0, inp.moveZ);
    const aim = aimRaw.lengthSq() > 0.01 ? aimRaw.clone() : undefined;

    if (m.restart === 'penalty') {
      if (inp.justPressed('shoot') || inp.justPressed('pass')) { this.charging = true; this.shotCharge = 0; }
      if (this.charging && (inp.isDown('shoot') || inp.isDown('pass'))) this.shotCharge = Math.min(1, this.shotCharge + dt * 1.5);
      if (this.charging && (inp.justReleased('shoot') || inp.justReleased('pass') || this.shotCharge >= 1)) {
        this.charging = false;
        const dirAim = aim ?? v1.set(0, 0, 0).clone();
        // z aim relative to attack dir (so "left" on stick = left side of goal)
        dirAim.z = (aim?.z ?? 0) * this.side.attackDir;
        m.takeSetPiece(dirAim, false, Math.max(0.3, this.shotCharge));
        this.shotCharge = 0;
      }
      void p;
      return;
    }

    // other set pieces: pass / lob to take
    if (inp.justPressed('pass')) m.takeSetPiece(aim && this.toWorldAim(aim), false, 0.5);
    else if (inp.justPressed('lob') || inp.justPressed('through')) m.takeSetPiece(aim && this.toWorldAim(aim), true, 0.6);
    else if (inp.justPressed('shoot')) {
      // direct shot attempt from free kick
      const goalDist = Math.hypot(HALF_L * this.side.attackDir - m.restartPos.x, m.restartPos.z);
      m.takeSetPiece(aim && this.toWorldAim(aim), goalDist > 30, 0.8);
    }
  }

  private toWorldAim(aim: THREE.Vector3): THREE.Vector3 {
    return aim; // input already in world axes (x along pitch, z across)
  }
}
