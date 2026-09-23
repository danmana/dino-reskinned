import { GROUND_Y, RUNNER_X } from './constants.ts';
import { NO_INPUT, overlap, placeObstacleAllFrames, stepRunner, type Game, type Input, type Obstacle, type Runner } from './engine.ts';
import type { SpriteArt } from '../render/compile.ts';

// Autoplay. Each frame it forward-simulates the real runner physics against
// the obstacles on screen, using the current skin's pixel masks, and picks
// the laziest plan that survives: keep running, duck, or jump (shortest hop
// first) at the earliest frame that clears the threat. In the air it can
// fast-drop or land ducking when the next obstacle is close.

type Plan = (f: number, r: Runner) => Input;

const HORIZON = 72;
/** Jump-key hold lengths to try, shortest (lowest, quickest hop) first. */
const HOLDS = [1, 5, 99];

const run: Plan = () => NO_INPUT;
const duck: Plan = () => ({ jump: false, jumpPressed: false, down: true, downPressed: false });
const jumpAt = (start: number, hold: number): Plan => (f) => ({
  jump: f >= start && f < start + hold,
  jumpPressed: f === start,
  down: false,
  downPressed: false,
});
/** Fast-drop now and keep ducking after touchdown. */
const dropNow: Plan = (f) => ({ jump: false, jumpPressed: false, down: true, downPressed: f === 0 });
const keepAir = (holdLeft: number): Plan => (f) => ({ jump: f < holdLeft, jumpPressed: false, down: false, downPressed: false });
/** Finish the jump as planned, then land already ducking. */
const landDucking = (holdLeft: number): Plan => (f) => ({ jump: f < holdLeft, jumpPressed: false, down: true, downPressed: false });

interface Sim {
  hitFrame: number;
  hit: Obstacle | null;
  landFrame: number;
}

export class Bot {
  /** Frames the jump key stays held in the current jump. */
  private holdLeft = 99;
  private overWait = 0;

  decide(g: Game): Input {
    if (g.state === 'ready') {
      this.holdLeft = 99;
      return { ...NO_INPUT, jump: true, jumpPressed: true };
    }
    if (g.state === 'over') {
      this.overWait++;
      if (this.overWait > 55) {
        this.overWait = 0;
        this.holdLeft = 99;
        return { ...NO_INPUT, jump: true, jumpPressed: true };
      }
      return NO_INPUT;
    }
    this.overWait = 0;
    const r = g.runner;

    if (r.air) {
      this.holdLeft = Math.max(0, this.holdLeft - 1);
      const cont = this.sim(g, keepAir(this.holdLeft), HORIZON, true);
      if (cont.hitFrame >= 0) {
        const pass = cont.hit ? this.passFrame(g, cont.hit) : HORIZON;
        const limit = Math.min(HORIZON, Math.max(pass, cont.hitFrame) + 1);
        if (this.sim(g, landDucking(this.holdLeft), limit, false).hitFrame < 0) return landDucking(this.holdLeft)(0, r);
        if (!r.speedDrop && this.sim(g, dropNow, limit, false).hitFrame < 0) return dropNow(0, r);
      }
      // After landing, would a following obstacle be unavoidable? Dropping early buys time.
      if (!r.speedDrop && r.vy < 0 && cont.hitFrame < 0) {
        const after = this.sim(g, keepAir(this.holdLeft), HORIZON, false);
        if (after.hitFrame >= 0 && after.hitFrame - cont.landFrame < 14) {
          const drop = this.sim(g, dropNow, HORIZON, true);
          if (drop.hitFrame < 0) return dropNow(0, r);
        }
      }
      return keepAir(this.holdLeft)(0, r);
    }

    const threat = this.sim(g, run, HORIZON, false);
    if (threat.hitFrame < 0) return NO_INPUT;

    if (threat.hit?.kind === 'flyer') {
      const pass = this.passFrame(g, threat.hit);
      const d = this.sim(g, duck, Math.min(HORIZON, pass + 1), false);
      if (d.hitFrame < 0) return duck(0, r);
    }
    // Take off at the earliest frame whose jump clears the threat: it lands
    // soonest, leaving the most room for whatever follows. A hop that comes
    // down before the obstacle has passed doesn't count as clearing it.
    const pass = threat.hit ? this.passFrame(g, threat.hit) : threat.hitFrame;
    const clears = (k: number, hold: number) => {
      const s = this.sim(g, jumpAt(k, hold), HORIZON, true);
      return s.hitFrame < 0 && (s.landFrame < 0 || s.landFrame > pass);
    };
    for (const hold of HOLDS) {
      if (clears(0, hold)) {
        this.holdLeft = hold;
        return jumpAt(0, hold)(0, r);
      }
    }
    for (let k = 1; k <= threat.hitFrame; k++) if (HOLDS.some((hold) => clears(k, hold))) return NO_INPUT;
    this.holdLeft = 99;
    return jumpAt(0, 99)(0, r);
  }

  private passFrame(g: Game, o: Obstacle): number {
    const rel = g.speed + o.offset;
    return Math.ceil((o.x + o.width + 4 - RUNNER_X) / Math.max(0.5, rel));
  }

  /** Simulates a plan. With untilLanding, stops once an airborne runner touches down. */
  private sim(g: Game, plan: Plan, frames: number, untilLanding: boolean): Sim {
    const r: Runner = { ...g.runner };
    const v = g.art.day;
    let wasAir = r.air;
    let landFrame = -1;
    for (let f = 0; f < frames; f++) {
      stepRunner(r, plan(f, r), g.speed);
      if (wasAir && !r.air && landFrame < 0) {
        landFrame = f;
        if (untilLanding) {
          const hit = this.collideWhich(g, r, f, r.ducking ? v.runner.duck : v.runner.run);
          return { hitFrame: hit ? f : -1, hit, landFrame };
        }
      }
      wasAir = r.air;
      const frames = r.air ? [v.runner.jump] : r.ducking ? v.runner.duck : v.runner.run;
      const hit = this.collideWhich(g, r, f, frames);
      if (hit) return { hitFrame: f, hit, landFrame };
    }
    return { hitFrame: -1, hit: null, landFrame };
  }

  private collideWhich(g: Game, r: Runner, f: number, frames: SpriteArt[]): Obstacle | null {
    for (const o of g.obstacles) {
      const x = o.x - (f + 1) * (g.speed + o.offset);
      if (x > RUNNER_X + 34 || x + o.width + 10 < RUNNER_X) continue;
      // Conservative: every animation frame of both sprites must be clear.
      for (const p of placeObstacleAllFrames(o, g.art, x)) {
        for (const s of frames) {
          const ry = Math.round(GROUND_Y - r.ry) - s.baseline;
          if (overlap(s, RUNNER_X, ry, p.s, p.x, p.y, 1)) return o;
        }
      }
    }
    return null;
  }
}
