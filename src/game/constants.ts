// World geometry and the original game's tuning, halved into art pixels.
// The Chromium runner works in a 600x150 space; this world uses 1 art px = 2
// of those units, so speeds, gravity and gaps are halved while timings
// (frames, milliseconds) stay the same.

export const H = 100;
export const GROUND_Y = 78;
export const RUNNER_X = 22;
export const MIN_W = 220;
export const MAX_W = 480;

export const STEP_MS = 1000 / 60;

export const PHYS = {
  gravity: 0.3,
  jumpV: 5, // + speed / 10, as in the original
  dropV: 2.5, // velocity cap once the jump key is released
  minJump: 15,
  maxJump: 31.5,
  speedDropCoef: 3,
  speedDropV: 0.5,

  startSpeed: 3,
  accel: 0.0005,
  maxSpeed: 6.5,

  clearFrames: 180, // no obstacles for the first 3 s
  gapCoef: 0.6,
  maxGapCoef: 1.5,
  maxObstacleLen: 3,
  maxDup: 2,

  nightEvery: 700, // score
  nightFrames: 720, // 12 s

  scoreCoef: 0.05,
  achievement: 100,
};

export type ObstacleKind = 'small' | 'large' | 'flyer';

export interface ObstacleType {
  kind: ObstacleKind;
  /** Logical footprint per unit, used for spacing and gap maths. */
  cell: number;
  multipleSpeed: number;
  /** In original units, as the gap formula expects. */
  minGap: number;
  minSpeed: number;
  speedOffset?: number;
}

export const OBSTACLE_TYPES: ObstacleType[] = [
  { kind: 'small', cell: 9, multipleSpeed: 2, minGap: 120, minSpeed: 0 },
  { kind: 'large', cell: 13, multipleSpeed: 3.5, minGap: 120, minSpeed: 0 },
  { kind: 'flyer', cell: 23, multipleSpeed: 999, minGap: 150, minSpeed: 4.25, speedOffset: 0.4 },
];

/** Height above the ground of the flyer's lowest pixel, per lane (low, mid, high). */
export const FLYER_LANES = [3, 14, 27];

export const ANIM = {
  run: 5, // game frames per run frame
  duck: 7,
  flyer: 10,
  obstacle: 8,
};
