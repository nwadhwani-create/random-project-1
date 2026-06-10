import * as THREE from 'three';
import { Match } from './match';
import { PlayerSim } from './player';
import { HALF_L, HALF_W, GOAL_HALF_W, BOX_LENGTH, BOX_WIDTH, GOAL_HEIGHT } from './const';

const v1 = new THREE.Vector3();
const v2 = new THREE.Vector3();
const v3 = new THREE.Vector3();

interface Brain {
  nextThink: number;
  decision: 'idle' | 'chase' | 'press' | 'support' | 'mark' | 'hold';
}

/**
 * Team AI. Every player not controlled by the user is driven here.
 * Decisions are throttled by difficulty reaction time; movement targets update every frame.
 */
export class TeamAI {
  private brains = new Map<PlayerSim, Brain>();
  private time = 0;

  constructor(private match: Match) {}

  private brain(p: PlayerSim): Brain {
    let b = this.brains.get(p);
    if (!b) { b = { nextThink: 0, decision: 'idle' }; this.brains.set(p, b); }
    return b;
  }

  /** drive every AI player. userPlayer = the one the human currently controls (skipped). */
  step(dt: number, userPlayers: (PlayerSim | null)[]): void {
    this.time += dt;
    const m = this.match;
    if (m.phase !== 'play' && m.phase !== 'reset' && m.phase !== 'set-piece') return;

    for (let ti = 0; ti < 2; ti++) {
      const side = m.sides[ti];
      const isUserTeam = m.cfg.userTeams[ti];
      for (const p of side.players) {
        if (p.sentOff || p === userPlayers[ti]) continue;
        if (m.phase !== 'play') { p.sprinting = false; continue; } // reset/set-piece targets are set by Match
        this.drivePlayer(p, dt, isUserTeam);
      }
    }
  }

  private drivePlayer(p: PlayerSim, dt: number, isUserTeam: boolean): void {
    const m = this.match;
    const b = this.brain(p);
    if (!p.controllable) return;

    if (p.isGK) { this.driveGK(p); return; }

    const owner = m.ballOwnerPlayer();
    const weHaveBall = owner?.teamIdx === p.teamIdx;
    const ballLoose = !owner;

    if (p.hasBall) { this.driveCarrier(p, dt); return; }

    // decide (throttled)
    if (this.time >= b.nextThink) {
      b.nextThink = this.time + (isUserTeam ? 0.12 : m.diff.reaction) + Math.random() * 0.08;
      b.decision = this.decide(p, weHaveBall, ballLoose);
    }

    switch (b.decision) {
      case 'chase': this.moveChase(p); break;
      case 'press': this.movePress(p); break;
      case 'support': this.moveSupport(p); break;
      case 'mark': this.moveDefend(p); break;
      default: this.moveHold(p, weHaveBall); break;
    }

    // attempt tackles when pressing near the carrier
    const carrier = m.ballOwnerPlayer();
    if (carrier && carrier.teamIdx !== p.teamIdx && p.cooldown <= 0) {
      const d = p.pos.distanceTo(carrier.pos);
      if (d < 1.5) m.tackle(p);
      else if (!isUserTeam && d < 3.4 && Math.random() < dt * (m.diff.decision * 0.7)) {
        // occasional slide when carrier is sprinting away in dangerous area
        const goalDist = Math.hypot(carrier.pos.x - (-HALF_L * m.sides[p.teamIdx].attackDir * -1), 0);
        void goalDist;
        const dangerous = m.attX(carrier.teamIdx, carrier.pos.x) > 10;
        if (dangerous && Math.random() < 0.25) m.slideTackle(p);
      }
    }
  }

  private decide(p: PlayerSim, weHaveBall: boolean, ballLoose: boolean): Brain['decision'] {
    const m = this.match;
    if (ballLoose) {
      // two nearest of my team chase a loose ball
      const mine = m.activePlayers(p.teamIdx)
        .filter((q) => !q.isGK)
        .sort((a, b2) => a.pos.distanceToSquared(m.ball.pos) - b2.pos.distanceToSquared(m.ball.pos));
      if (mine.indexOf(p) < 2) return 'chase';
      return weHaveBall ? 'support' : 'mark';
    }
    if (weHaveBall) return 'support';
    // defending: nearest two press
    const mine = m.activePlayers(p.teamIdx)
      .filter((q) => !q.isGK)
      .sort((a, b2) => a.pos.distanceToSquared(m.ball.pos) - b2.pos.distanceToSquared(m.ball.pos));
    if (mine.indexOf(p) < 2) return 'press';
    return 'mark';
  }

  // ------------------------------------------------------------- movements

  private moveChase(p: PlayerSim): void {
    const m = this.match;
    // intercept point: lead the ball
    const t = Math.min(1.2, p.pos.distanceTo(m.ball.pos) / Math.max(4, p.maxSprint));
    v1.copy(m.ball.pos).addScaledVector(m.ball.vel, t * 0.75);
    v1.y = 0;
    p.moveTarget.copy(v1);
    p.sprinting = p.pos.distanceTo(m.ball.pos) > 4;
  }

  private movePress(p: PlayerSim): void {
    const m = this.match;
    const carrier = m.ballOwnerPlayer();
    if (!carrier) { this.moveChase(p); return; }
    // approach goal-side
    const dir = m.sides[p.teamIdx].attackDir;
    v1.copy(carrier.pos);
    v1.x -= dir * 0.9;
    p.moveTarget.copy(v1);
    p.sprinting = p.pos.distanceTo(carrier.pos) > 5;
  }

  private moveSupport(p: PlayerSim): void {
    const m = this.match;
    const side = m.sides[p.teamIdx];
    const slot = m.slot(p);
    const ball = m.ball.pos;
    // base formation position shifted toward attack and ball
    const attackShift = 16 + m.attX(p.teamIdx, ball.x) * 0.35;
    let x = slot.x * HALF_L * 0.92 + attackShift;
    let z = slot.z * HALF_W * 0.85 + ball.z * 0.25;
    x = x * 1; // in attack-normalized space
    // forward runs for attackers when ball is advanced
    if ((slot.role === 'ST' || slot.role === 'WG') && m.attX(p.teamIdx, ball.x) > 5) {
      x += 9;
    }
    // stay onside: don't go past second-last defender
    const defXs = m.activePlayers(1 - p.teamIdx).map((q) => m.attX(p.teamIdx, q.pos.x)).sort((a, b) => b - a);
    const line = defXs[1] ?? 0;
    const ballAtt = m.attX(p.teamIdx, ball.x);
    x = Math.min(x, Math.max(line - 0.4, ballAtt));
    x = Math.min(x, HALF_L - 2);
    p.moveTarget.set(x * side.attackDir, 0, z * side.attackDir);
    // spread: avoid clumping with teammates
    this.separate(p);
    p.sprinting = (slot.role === 'ST' || slot.role === 'WG') && p.pos.distanceTo(p.moveTarget) > 9;
  }

  private moveDefend(p: PlayerSim): void {
    const m = this.match;
    const side = m.sides[p.teamIdx];
    const slot = m.slot(p);
    const ball = m.ball.pos;
    const ballAtt = m.attX(p.teamIdx, ball.x); // negative = near our goal
    // defensive line height: collapse toward own goal as ball advances on us
    const retreat = THREE.MathUtils.clamp(-ballAtt * 0.5, 0, 26);
    let x = slot.x * HALF_L * 0.92 - retreat * 0.55 - 4;
    x = Math.max(x, -HALF_L + 4);
    let z = slot.z * HALF_W * 0.8 + ball.z * 0.35;
    // defenders: man-mark nearest attacker in zone
    if (slot.role === 'CB' || slot.role === 'FB' || slot.role === 'DM') {
      let danger: PlayerSim | null = null;
      let bd = 110;
      for (const o of m.activePlayers(1 - p.teamIdx)) {
        if (o.isGK) continue;
        const ox = m.attX(p.teamIdx, o.pos.x);
        if (ox > -8) continue; // only threats in our half-ish
        v2.set(x * side.attackDir, 0, z * side.attackDir);
        const d = o.pos.distanceToSquared(v2);
        if (d < bd) { bd = d; danger = o; }
      }
      if (danger && bd < 90) {
        // goal-side of the attacker
        const goalX = -HALF_L * side.attackDir;
        v1.copy(danger.pos);
        v1.x += Math.sign(goalX - danger.pos.x) * 1.4;
        p.moveTarget.copy(v1);
        p.sprinting = p.pos.distanceTo(v1) > 7;
        return;
      }
    }
    p.moveTarget.set(x * side.attackDir, 0, THREE.MathUtils.clamp(z, -HALF_W + 2, HALF_W - 2) * side.attackDir);
    this.separate(p);
    p.sprinting = p.pos.distanceTo(p.moveTarget) > 12;
  }

  private moveHold(p: PlayerSim, weHaveBall: boolean): void {
    if (weHaveBall) this.moveSupport(p); else this.moveDefend(p);
  }

  private separate(p: PlayerSim): void {
    const m = this.match;
    for (const q of m.activePlayers(p.teamIdx)) {
      if (q === p) continue;
      const d2 = q.moveTarget.distanceToSquared(p.moveTarget);
      if (d2 < 16) {
        v2.copy(p.moveTarget).sub(q.moveTarget);
        if (v2.lengthSq() < 0.01) v2.set((p.idx - q.idx) * 0.5, 0, 1);
        v2.setY(0).normalize().multiplyScalar(4 - Math.sqrt(d2));
        p.moveTarget.add(v2);
      }
    }
  }

  // ------------------------------------------------------------- carrier

  private driveCarrier(p: PlayerSim, dt: number): void {
    const m = this.match;
    const side = m.sides[p.teamIdx];
    const goalX = HALF_L * side.attackDir;
    const distGoal = Math.hypot(goalX - p.pos.x, p.pos.z);
    const q = m.diff.decision;

    // pressure level
    let pressure = 0;
    let nearestOppD = 99;
    for (const o of m.opponents(p.teamIdx)) {
      const d = o.pos.distanceTo(p.pos);
      nearestOppD = Math.min(nearestOppD, d);
      if (d < 3.5) pressure += (3.5 - d) / 3.5;
    }

    // shoot?
    const shootRange = 16 + q * 9;
    const inBox = Math.abs(p.pos.x - goalX) < BOX_LENGTH && Math.abs(p.pos.z) < BOX_WIDTH / 2;
    if (p.cooldown <= 0 && (distGoal < shootRange || inBox)) {
      const angleOk = Math.abs(p.pos.z) < GOAL_HALF_W + distGoal * 0.45;
      const shootChance = (inBox ? 2.2 : 0.8) * dt * (0.4 + q) * (pressure > 0.6 ? 1.8 : 1);
      if (angleOk && Math.random() < shootChance) {
        const power = THREE.MathUtils.clamp(0.45 + distGoal / 38 + Math.random() * 0.2, 0.4, 0.95);
        m.shoot(p, power);
        return;
      }
    }

    // cross from wide positions
    const nearByline = Math.abs(p.pos.x - goalX) < 14 && Math.abs(p.pos.z) > HALF_W * 0.5;
    if (p.cooldown <= 0 && nearByline && Math.random() < dt * 1.6 * q) {
      m.pass(p, v3.set(goalX - p.pos.x, 0, -p.pos.z).normalize(), true, false);
      return;
    }

    // pass under pressure / good option
    if (p.cooldown <= 0) {
      const wantPass = pressure > 0.55 ? dt * 4 : dt * (0.5 + q * 0.6);
      if (Math.random() < wantPass) {
        const through = Math.random() < 0.3 && m.attX(p.teamIdx, p.pos.x) > -5;
        if (m.pass(p, undefined, Math.random() < 0.18, through)) return;
      }
      // emergency clearance deep in own box
      const ownGoalX = -goalX;
      if (Math.abs(p.pos.x - ownGoalX) < BOX_LENGTH + 3 && Math.abs(p.pos.z) < BOX_WIDTH / 2 + 4 && pressure > 0.4) {
        if (Math.random() < dt * 5) { m.clearBall(p); return; }
      }
    }

    // dribble: head toward goal, swerve around the nearest defender
    v1.set(goalX, 0, THREE.MathUtils.clamp(p.pos.z * 0.4, -GOAL_HALF_W, GOAL_HALF_W)).sub(p.pos).setY(0).normalize();
    let blocker: PlayerSim | null = null;
    let bd = 36;
    for (const o of m.opponents(p.teamIdx)) {
      const d2 = o.pos.distanceToSquared(p.pos);
      if (d2 < bd) {
        v2.copy(o.pos).sub(p.pos).setY(0).normalize();
        if (v2.dot(v1) > 0.5) { bd = d2; blocker = o; }
      }
    }
    if (blocker) {
      v2.copy(blocker.pos).sub(p.pos).setY(0);
      // perpendicular swerve
      v3.set(-v2.z, 0, v2.x).normalize();
      if (v3.dot(v1) < 0) v3.multiplyScalar(-1);
      const w = THREE.MathUtils.clamp(1.6 - Math.sqrt(bd) * 0.18, 0.2, 1.4);
      v1.addScaledVector(v3, w).normalize();
    }
    p.moveTarget.copy(p.pos).addScaledVector(v1, 7);
    p.moveTarget.x = THREE.MathUtils.clamp(p.moveTarget.x, -HALF_L + 1, HALF_L - 1);
    p.moveTarget.z = THREE.MathUtils.clamp(p.moveTarget.z, -HALF_W + 1, HALF_W - 1);
    p.sprinting = nearestOppD > 2.2 && distGoal > 14;
  }

  // ------------------------------------------------------------- goalkeeper

  private driveGK(p: PlayerSim): void {
    const m = this.match;
    const side = m.sides[p.teamIdx];
    const goalX = -HALF_L * side.attackDir; // own goal
    const ball = m.ball;

    if (p.hasBall) {
      // distribute after a short hold
      if (p.stateTime > 1.1 && p.cooldown <= 0) {
        const target = m.bestPassTarget(p, undefined, true);
        if (target && Math.random() < 0.6) m.pass(p, v1.copy(target.pos).sub(p.pos), target.pos.distanceTo(p.pos) > 24);
        else m.clearBall(p);
      }
      p.moveTarget.copy(p.pos);
      return;
    }

    const ballDist = p.pos.distanceTo(ball.pos);
    const ballComing = (ball.vel.x * -side.attackDir) > 4; // moving toward our goal
    const ballInBox = Math.abs(ball.pos.x - goalX) < BOX_LENGTH && Math.abs(ball.pos.z) < BOX_WIDTH / 2;

    // shot incoming: predict crossing point and dive if needed
    if (ballComing && !ball.owner && Math.abs(ball.pos.x - goalX) < 26) {
      const t = Math.abs((goalX - ball.pos.x) / (ball.vel.x || 0.001));
      if (t < 1.4) {
        const zAt = ball.pos.z + ball.vel.z * t;
        const yAt = Math.max(0, ball.pos.y + ball.vel.y * t - 4.9 * t * t);
        if (Math.abs(zAt) < GOAL_HALF_W + 1.6 && yAt < GOAL_HEIGHT + 0.6) {
          const dz = zAt - p.pos.z;
          if (Math.abs(dz) > 0.9 && t < 0.55 && p.cooldown <= 0 && p.state !== 'dive') {
            // dive!
            const reach = 2.4 + (p.data.attrs.diving ?? 75) / 50;
            v1.set(0, 0, Math.sign(dz) * Math.min(Math.abs(dz), reach) * 2.2);
            p.startDive(v1);
            // save resolution: if reachable, deflect
            const reflexes = (p.data.attrs.reflexes ?? 75) / 100;
            const reachable = Math.abs(dz) < reach * (0.65 + reflexes * 0.45) && yAt < 2.3;
            if (reachable && Math.random() < 0.5 + reflexes * 0.42) {
              this.deflect(p, zAt, yAt);
            }
            return;
          }
          // shuffle across
          p.moveTarget.set(goalX + side.attackDir * 0.6, 0, THREE.MathUtils.clamp(zAt, -GOAL_HALF_W + 0.4, GOAL_HALF_W - 0.4));
          p.sprinting = true;
          return;
        }
      }
    }

    // claim loose balls in the six-yard area
    if (!ball.owner && ballInBox && ballDist < 4.5 && ball.speed < 9 && ball.pos.y < 1.8) {
      p.moveTarget.copy(ball.pos);
      p.sprinting = true;
      return;
    }

    // positioning: on an arc between goal center and ball
    v1.set(goalX, 0, 0);
    v2.copy(ball.pos).sub(v1).setY(0);
    const d = v2.length();
    const out = THREE.MathUtils.clamp(d * 0.12, 0.7, 5);
    v2.normalize();
    p.moveTarget.copy(v1).addScaledVector(v2, out);
    p.moveTarget.z = THREE.MathUtils.clamp(p.moveTarget.z, -GOAL_HALF_W * 0.9, GOAL_HALF_W * 0.9);
    p.sprinting = false;
  }

  /** GK gets a hand to the shot: deflect ball wide/over */
  private deflect(gk: PlayerSim, zAt: number, yAt: number): void {
    const m = this.match;
    const side = m.sides[gk.teamIdx];
    const sp = m.ball.speed;
    m.sides[gk.teamIdx].stats.saves++;
    // big saves push wide, weak parries drop in the box
    const strong = Math.random() < 0.6;
    v1.copy(m.ball.vel);
    if (strong) {
      v1.x = side.attackDir * Math.max(4, sp * 0.3);
      v1.z = Math.sign(zAt || 1) * sp * 0.45;
      v1.y = Math.abs(v1.y) * 0.3 + 2.5;
    } else {
      v1.multiplyScalar(-0.18);
      v1.y = 2.2;
      v1.x = side.attackDir * 3;
    }
    m.ball.kick(v1);
    m.ball.touch(gk.teamIdx, gk.idx, m.clock);
    m.emit('save', { player: gk });
    m.excitement = Math.min(1, m.excitement + 0.3);
    void yAt;
  }
}
