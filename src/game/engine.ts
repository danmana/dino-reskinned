import { ANIM, FLYER_LANES, GROUND_Y, OBSTACLE_TYPES, PHYS, RUNNER_X, type ObstacleKind } from './constants.ts';
import type { SkinArt, SpriteArt } from '../render/compile.ts';

export interface Input {
  /** Jump key currently held. */
  jump: boolean;
  /** Jump key went down since the last step. */
  jumpPressed: boolean;
  down: boolean;
  downPressed: boolean;
}

export const NO_INPUT: Input = { jump: false, jumpPressed: false, down: false, downPressed: false };

export interface Runner {
  /** Height of the feet above the ground. */
  ry: number;
  /** Vertical velocity, positive is up. */
  vy: number;
  air: boolean;
  ducking: boolean;
  speedDrop: boolean;
  reachedMin: boolean;
  jumpHeld: boolean;
}

export interface Obstacle {
  kind: ObstacleKind;
  x: number;
  size: number;
  /** Per-unit variant seeds; each skin maps them onto its own variant list. */
  variants: number[];
  lane: number;
  offset: number;
  gap: number;
  width: number;
  age: number;
  followed: boolean;
}

export type GameEvent = 'start' | 'jump' | 'land' | 'score' | 'crash' | 'night' | 'day';

export const freshRunner = (): Runner => ({ ry: 0, vy: 0, air: false, ducking: false, speedDrop: false, reachedMin: false, jumpHeld: false });

/** One fixed step of runner physics. Pure apart from the optional event sink. */
export function stepRunner(r: Runner, inp: Input, speed: number, ev?: GameEvent[]): void {
  if (!r.air) {
    if (inp.jumpPressed && !inp.down) {
      r.air = true;
      r.vy = PHYS.jumpV + speed / 10;
      r.reachedMin = false;
      r.speedDrop = false;
      r.ducking = false;
      ev?.push('jump');
    } else {
      r.ducking = inp.down;
    }
  }
  if (r.air) {
    r.jumpHeld = inp.jump;
    if (inp.downPressed && !r.speedDrop) {
      r.speedDrop = true;
      r.vy = -PHYS.speedDropV;
    }
    r.ry += r.speedDrop ? r.vy * PHYS.speedDropCoef : r.vy;
    r.vy -= PHYS.gravity;
    if (r.ry > PHYS.minJump || r.speedDrop) r.reachedMin = true;
    if ((r.ry > PHYS.maxJump || !r.jumpHeld) && r.reachedMin && r.vy > PHYS.dropV) r.vy = PHYS.dropV;
    if (r.ry <= 0) {
      r.ry = 0;
      r.vy = 0;
      r.air = false;
      r.speedDrop = false;
      r.ducking = inp.down;
      ev?.push('land');
    }
  }
}

// ---------------------------------------------------------------- collision

/** Pixel-mask overlap; two or more shared pixels count as a hit, so a one-pixel graze is forgiven. */
export function overlap(a: SpriteArt, ax: number, ay: number, b: SpriteArt, bx: number, by: number, min = 2): boolean {
  const x0 = Math.max(ax, bx), x1 = Math.min(ax + a.w, bx + b.w);
  const y0 = Math.max(ay, by), y1 = Math.min(ay + a.h, by + b.h);
  if (x0 >= x1 || y0 >= y1) return false;
  let n = 0;
  for (let y = y0; y < y1; y++) {
    const ar = (y - ay) * a.w - ax, br = (y - by) * b.w - bx;
    for (let x = x0; x < x1; x++) if (a.mask[ar + x] && b.mask[br + x] && ++n >= min) return true;
  }
  return false;
}

export interface Placed {
  s: SpriteArt;
  x: number;
  y: number;
}

/** Where each unit of an obstacle is drawn, for a given skin and animation frame. */
export function placeObstacle(o: Obstacle, art: SkinArt, frameAge = o.age, x = o.x): Placed[] {
  const v = art.day;
  const t = OBSTACLE_TYPES.find((ot) => ot.kind === o.kind)!;
  const out: Placed[] = [];
  const bx = Math.round(x);
  if (o.kind === 'flyer') {
    const s = v.flyer[Math.floor(frameAge / ANIM.flyer) % v.flyer.length];
    out.push({ s, x: bx, y: GROUND_Y - FLYER_LANES[o.lane] - s.baseline });
    return out;
  }
  const list = o.kind === 'small' ? v.small : v.large;
  for (let i = 0; i < o.size; i++) {
    const frames = list[o.variants[i] % list.length];
    const s = frames[Math.floor(frameAge / ANIM.obstacle) % frames.length];
    out.push({ s, x: bx + i * t.cell + Math.floor((t.cell - s.w) / 2), y: GROUND_Y - s.baseline });
  }
  return out;
}

/** Every animation frame of every unit, for conservative look-ahead checks. */
export function placeObstacleAllFrames(o: Obstacle, art: SkinArt, x: number): Placed[] {
  const v = art.day;
  const t = OBSTACLE_TYPES.find((ot) => ot.kind === o.kind)!;
  const bx = Math.round(x);
  if (o.kind === 'flyer') return v.flyer.map((s) => ({ s, x: bx, y: GROUND_Y - FLYER_LANES[o.lane] - s.baseline }));
  const list = o.kind === 'small' ? v.small : v.large;
  const out: Placed[] = [];
  for (let i = 0; i < o.size; i++) {
    for (const s of list[o.variants[i] % list.length]) out.push({ s, x: bx + i * t.cell + Math.floor((t.cell - s.w) / 2), y: GROUND_Y - s.baseline });
  }
  return out;
}

export function runnerSprite(g: Game, art: SkinArt = g.art, v = art.day): SpriteArt {
  const r = g.runner;
  if (g.state === 'over') return v.runner.dead;
  if (g.state === 'ready') {
    const idle = v.runner.idle;
    if (idle.length > 1 && g.tick % 240 > 228) return idle[1 + (Math.floor(g.tick / 240) % (idle.length - 1))];
    return idle[0];
  }
  if (r.air) return v.runner.jump;
  if (r.ducking) return v.runner.duck[Math.floor(g.tick / ANIM.duck) % v.runner.duck.length];
  return v.runner.run[Math.floor(g.tick / ANIM.run) % v.runner.run.length];
}

// ---------------------------------------------------------------- game

export class Game {
  state: 'ready' | 'running' | 'over' = 'ready';
  runner: Runner = freshRunner();
  obstacles: Obstacle[] = [];
  history: ObstacleKind[] = [];
  speed = PHYS.startSpeed;
  distance = 0;
  frames = 0;
  score = 0;
  hi = 0;
  night = false;
  nightTimer = 0;
  flash = 0;
  flashScore = 0;
  overFrames = 0;
  tick = 0;
  runs = 0;
  worldW = 320;
  /** Touch play drops the mid flyer lane, as the original does on mobile. */
  touchLanes = false;
  events: GameEvent[] = [];
  art: SkinArt;
  rand: () => number = Math.random;

  constructor(art: SkinArt) {
    this.art = art;
  }

  reset(): void {
    this.runner = freshRunner();
    this.obstacles = [];
    this.history = [];
    this.speed = PHYS.startSpeed;
    this.distance = 0;
    this.frames = 0;
    this.score = 0;
    this.night = false;
    this.nightTimer = 0;
    this.flash = 0;
    this.overFrames = 0;
  }

  step(inp: Input): void {
    this.tick++;
    if (this.state === 'ready') {
      if (inp.jumpPressed) {
        this.state = 'running';
        this.runs++;
        this.events.push('start');
        stepRunner(this.runner, inp, this.speed, this.events);
      }
      return;
    }
    if (this.state === 'over') {
      this.overFrames++;
      if (inp.jumpPressed && this.overFrames > 24) {
        this.reset();
        this.state = 'running';
        this.runs++;
        this.events.push('start');
        stepRunner(this.runner, { ...inp, down: false }, this.speed, this.events);
      }
      return;
    }

    this.frames++;
    if (this.speed < PHYS.maxSpeed) this.speed = Math.min(PHYS.maxSpeed, this.speed + PHYS.accel);
    stepRunner(this.runner, inp, this.speed, this.events);
    if (this.frames > PHYS.clearFrames) this.updateObstacles();

    if (this.hits()) {
      this.state = 'over';
      this.overFrames = 0;
      this.hi = Math.max(this.hi, this.score);
      this.events.push('crash');
      return;
    }

    const prev = this.score;
    this.distance += this.speed;
    this.score = Math.floor(this.distance * PHYS.scoreCoef);
    if (Math.floor(prev / PHYS.achievement) < Math.floor(this.score / PHYS.achievement)) {
      this.flash = 45;
      this.flashScore = Math.floor(this.score / PHYS.achievement) * PHYS.achievement;
      this.events.push('score');
    } else if (this.flash > 0) this.flash--;

    if (this.nightTimer > 0) {
      if (--this.nightTimer === 0) {
        this.night = false;
        this.events.push('day');
      }
    } else if (Math.floor(prev / PHYS.nightEvery) < Math.floor(this.score / PHYS.nightEvery)) {
      this.night = true;
      this.nightTimer = PHYS.nightFrames;
      this.events.push('night');
    }
  }

  private updateObstacles(): void {
    for (const o of this.obstacles) {
      o.x -= this.speed + o.offset;
      o.age++;
    }
    this.obstacles = this.obstacles.filter((o) => o.x + o.width + 30 > 0);
    const last = this.obstacles[this.obstacles.length - 1];
    if (!last) this.spawn();
    else if (!last.followed && last.x + last.width + last.gap < this.worldW) {
      last.followed = true;
      this.spawn();
    }
  }

  private spawn(): void {
    const valid = OBSTACLE_TYPES.filter((t) => this.speed >= t.minSpeed && !this.duplicate(t.kind));
    const t = valid[Math.floor(this.rand() * valid.length)] ?? OBSTACLE_TYPES[0];
    let size = 1 + Math.floor(this.rand() * PHYS.maxObstacleLen);
    if (size > 1 && t.multipleSpeed > this.speed) size = 1;
    const width = t.cell * size;
    const lanes = this.touchLanes ? [0, 2] : [0, 1, 2];
    // The gap formula runs in the original's units (2x art px), then halves.
    const minGap = Math.round(width * 2 * (this.speed * 2) + t.minGap * PHYS.gapCoef);
    const maxGap = Math.round(minGap * PHYS.maxGapCoef);
    const gap = (minGap + Math.floor(this.rand() * (maxGap - minGap + 1))) / 2;
    this.obstacles.push({
      kind: t.kind,
      x: this.worldW,
      size,
      variants: Array.from({ length: size }, () => Math.floor(this.rand() * 1024)),
      lane: t.kind === 'flyer' ? lanes[Math.floor(this.rand() * lanes.length)] : 0,
      offset: t.speedOffset ? (this.rand() > 0.5 ? t.speedOffset : -t.speedOffset) : 0,
      gap,
      width,
      age: 0,
      followed: false,
    });
    this.history.unshift(t.kind);
    this.history.length = Math.min(this.history.length, PHYS.maxDup);
  }

  private duplicate(kind: ObstacleKind): boolean {
    let n = 0;
    for (const k of this.history) {
      if (k !== kind) break;
      n++;
    }
    return n >= PHYS.maxDup;
  }

  private hits(): boolean {
    const s = runnerSprite(this);
    const ry = Math.round(GROUND_Y - this.runner.ry) - s.baseline;
    for (const o of this.obstacles) {
      if (o.x > RUNNER_X + s.w + 2 || o.x + o.width + 8 < RUNNER_X) continue;
      for (const p of placeObstacle(o, this.art)) if (overlap(s, RUNNER_X, ry, p.s, p.x, p.y)) return true;
    }
    return false;
  }
}
