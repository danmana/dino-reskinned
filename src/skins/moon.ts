import type { Grid, SkinDef } from './types.ts';

// Moonwalk: an astronaut bounding across the regolith under a black sky,
// with Earth hanging overhead. Frames are stamped from shared parts onto
// fixed canvases so every frame of an animation keeps the same anchor.

type Part = [Grid, number, number];

/** Paints parts onto a blank w×h canvas, later parts on top. '.' is transparent. */
function compose(w: number, h: number, parts: Part[]): Grid {
  const rows = Array.from({ length: h }, () => Array<string>(w).fill('.'));
  for (const [g, ox, oy] of parts) {
    g.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        const X = ox + x, Y = oy + y;
        if (ch !== '.' && ch !== ' ' && Y >= 0 && Y < h && X >= 0 && X < w) rows[Y][X] = ch;
      }
    });
  }
  return rows.map((r) => r.join(''));
}

const flipV = (g: Grid): Grid => [...g].reverse();
const flipH = (g: Grid): Grid => g.map((r) => [...r].reverse().join(''));
/** Rotates a grid a quarter turn clockwise: its top ends up on the right. */
const rotCW = (g: Grid): Grid =>
  Array.from({ length: g[0].length }, (_, y) => Array.from({ length: g.length }, (_, x) => g[g.length - 1 - x][y]).join(''));

// ---------------------------------------------------------------- runner

// Helmet facing right: white shell, gold visor with a glint.
const helmet: Grid = [
  '..wwwww..',
  '.wwwwwwww',
  'wwwwgggg.',
  'wwwgggGgg',
  'wwwggggGg',
  'swwwgggg.',
  '.swwwwww.',
];
// The same helmet after a hard landing: a zig-zag crack across the visor.
const crackedHelmet: Grid = [
  '..wwwww..',
  '.wwwwwwww',
  'wwwwggkg.',
  'wwwggkGgg',
  'wwwgkggGg',
  'swwwgkgg.',
  '.swwwwww.',
];
// Life-support backpack.
const pack: Grid = [
  '.ss.',
  'swws',
  'swws',
  'swws',
  'swws',
  'swws',
  'ssss',
];
const torso: Grid = [
  'sssssss',
  'swwwwww',
  'swwwwww',
  'swwbrww',
  'swwwwww',
  'sswwwws',
  'skkkkks',
  'swwwwww',
];
const armDown: Grid = [
  'ww.',
  'www',
  'sww',
  'sww',
  'sww',
  'kk.',
];
const armFwd: Grid = [
  'ww..',
  'www.',
  'swww',
  '.sww',
  '..kk',
];
const armBack: Grid = [
  '.ww',
  'www',
  'wws',
  'ws.',
  'kk.',
];

// Legs, hips at row 0. Far leg shaded (s), near leg lit (w).
const legsStand: Grid = [
  'swww.swww..',
  'swww.swww..',
  'swww..www..',
  'swws..sww..',
  'skkks.skkk.',
  'kkkkk.kkkkk',
];
const legsStride: Grid = [
  '..swwwwww....',
  '.swww..www...',
  'swww....www..',
  'sww......sww.',
  'kkks.....skkk',
  'kkk.......kkk',
];
const legsTuck: Grid = [
  '.swwwwwwww..',
  '.sswwwwwwww.',
  'skks...swww.',
  'kkk....swws.',
  '......skkk..',
  '......kkkk..',
];

const RW = 20, RH = 24;
/** Upper body with the helmet top at row y. */
const upper = (y: number, arm: Part, head = helmet): Part[] => [
  [pack, 3, y + 5],
  [torso, 6, y + 6],
  [head, 7, y],
  [arm[0], arm[1], y + arm[2]],
];

const stand = compose(RW, RH, [...upper(2, [armDown, 12, 7]), [legsStand, 5, 18]]);
// Bounding: a long stride on the ground, then knees tucked two pixels up.
const run0 = compose(RW, RH, [...upper(2, [armFwd, 12, 7]), [legsStride, 4, 18]]);
const run1 = compose(RW, RH, [...upper(0, [armBack, 11, 7]), [legsTuck, 5, 16]]);
const wave = compose(RW, RH, [...upper(2, [['..kk', '.ww.', 'www.', 'ww..', 'ww..'], 13, 2]), [legsStand, 5, 18]]);

// Jump: a star — arms up and out, legs spread. The boots stay on the same
// baseline as the standing frames, so the hitbox doesn't shrink mid-jump.
const jump = compose(RW, RH, [
  [['kk..', 'www.', '.www', '..ww'], 1, 5],
  ...upper(2, [['..kk', '.www', 'www.', 'ww..'], 13, 3]),
  [[
    '..swwwwwww...',
    '.swww...www..',
    '.sww.....www.',
    'sww......swww',
    'sww.......sww',
    'sww.......sww',
    'kks.......skk',
    'kk.........kk',
  ], 3, 16],
]);

// Dead: tumbling head over heels, limbs limp, visor cracked. Drawn upright,
// then turned upside down; it floats a few pixels off the ground.
const limp = compose(RW, 21, [
  ...upper(0, [['ww..', 'www.', '.www', '..ww', '...kk'], 12, 7], crackedHelmet),
  [[
    'swwwwwww.....',
    'swww.swww....',
    'swww..swwww..',
    'swww....skkk.',
    'skkk....kkk..',
    'kkkk.........',
  ], 5, 14],
]);
const dead = compose(RW, RH, [[flipV(flipH(limp)), 0, 0]]);

// Duck: a Superman dive, low along the ground, head up and legs fluttering.
// The body is built upright and turned a quarter (shoulders lead, backpack on
// top); the helmet stays upright so the visor still looks where it's going.
const diveBody = (kick: number): Grid => rotCW(compose(9, 14, [
  [pack, 0, 0],
  [torso, 2, 0],
  [['ww', 'ww', 'ww', 'ww', 'kk'], 7, 1],
  [['swww', 'swww', 'swww', 'swww', 'skkk', 'kkkk'], 2 - kick, 8],
  [['swww', 'swww', 'swww', 'swww', 'swkk', 'skkk'], 4 + kick, 8],
]));
const DW = 22, DH = 11;
const duck0 = compose(DW, DH, [[diveBody(0), 0, 2], [helmet, 12, 1]]);
const duck1 = compose(DW, DH, [[diveBody(1), 0, 2], [helmet, 12, 1]]);

// ---------------------------------------------------------------- obstacles

const rockA: Grid = [
  '....sss...',
  '..ssmmmss.',
  '.smmmmmmms',
  'smmdmmmmmd',
  'smmmmmddmd',
  'mmmmmmmmdd',
  'dmmmddmmdd',
  '.dddddddd.',
];
const rockB: Grid = [
  '.....ss....',
  '....smms...',
  '...smmmmd..',
  '...smmdmd..',
  '..smmmmmmd.',
  '.ssmmmmmmd.',
  'smmmdmmmmdd',
  'smmmmmmmddd',
  'mmmddmmmddd',
  'dmmmmmmdddd',
  '.ddddddddd.',
];
// A little science probe: solar wings, gold foil, a blinking beacon.
const probe = (light: string): Grid => [
  '....' + light + '....',
  '....k....',
  'bb.kkk.bb',
  'bbkfFfkbb',
  'bbkFfFkbb',
  '..kfFfk..',
  '..kkkkk..',
  '..k...k..',
  '.k.....k.',
];

const lander = (light: string): Grid => [
  '......' + light + '........',
  '......k........',
  '....sssss......',
  '...sswwwss.....',
  '..sswbbwwss....',
  '..swwwwwwws....',
  '.kkkkkkkkkkk...',
  '.fFfFfFfFfFf...',
  '.FfFfFfFfFfF...',
  '.fFfFfFfFfFf...',
  '.kkkkkkkkkkk...',
  '.s...mmm...s...',
  's....m.m....s..',
  's...........s..',
  'ss.........ss..',
];

// Radio dish on a lattice mast; the beacon on the feed horn blinks.
const dish = (light: string): Grid => [
  '...' + light + '.......',
  '...m.......',
  'sss.....sss',
  '.sss...sss.',
  '..sssssss..',
  '...sssss...',
  '.....m.....',
  '.....m.....',
  '....sms....',
  '....s.m....',
  '...smmmm...',
  '...s...m...',
  '..smmmmmm..',
  '..s.....m..',
  '.smmmmmmmm.',
  '.s.......m.',
  'ssmmmmmmmmm',
];

const rocket: Grid = [
  '....e....',
  '...wrw...',
  '...www...',
  '..wwwww..',
  '..wbbbw..',
  '..wbGbw..',
  '..wbbbw..',
  '..wwwww..',
  '..wwwww..',
  '..rrrrr..',
  '..wwwww..',
  '..wwwww..',
  '..wwwww..',
  '..wwwww..',
  '.rwwwwwr.',
  'rrwwwwwrr',
  'rr.kkk.rr',
  'r..kkk..r',
];

// ---------------------------------------------------------------- flyer

// Flying saucer with a little green pilot; the rim lights chase.
const ufo = (a: string, b: string): Grid => [
  '........cccccc........',
  '.......cckcckcc.......',
  '......cccccccccc......',
  '...ssssssssssssssss...',
  '.ssmmmmmmmmmmmmmmmmss.',
  'ks' + a + 'm' + b + 'mm' + a + 'mm' + b + 'mm' + a + 'mm' + b + 'mm' + a + 'sk',
  '.kkmmmmmmmmmmmmmmmmkk.',
  '....kkkkkkkkkkkkkk....',
];

// ---------------------------------------------------------------- decor

// Far-off moon base: habitat domes with lit portholes, a rover, a flag.
const habitat: Grid = [
  '...ddddd...',
  '..ddddddd..',
  '.ddcddcddd.',
  'ddddddddddd',
];
const rover: Grid = [
  '..d.....',
  '.dddddd.',
  'ddcddddd',
  '.dd..dd.',
];
const flag: Grid = [
  'dmmm',
  'dmmm',
  'd...',
  'd...',
  'd...',
];

const satellite: Grid = [
  '.......k.......',
  'bbbbb..k..bbbbb',
  'bbbbbkssskbbbbb',
  'bbbbbksgskbbbbb',
  'bbbbbkssskbbbbb',
  '......kkk......',
];
const comet: Grid = flipH([
  '..........................wG.',
  '.................ssswwwwwwGGw',
  '......sss..sswwwwwwwwwwwGGGG.',
  '..............ssswwwwwwwGGw..',
  '.........................wG..',
]);

export const moon: SkinDef = {
  id: 'moon',
  name: 'Moonwalk',
  tagline: 'One small hop for a runner.',
  palette: {
    w: '#f2f2ec',
    s: '#aeb2c6',
    k: '#5a5e74',
    g: '#ffb22e',
    G: '#fff0a0',
    f: '#c98a22',
    F: '#eab24a',
    r: '#e8453c',
    e: '#ff5a4a',
    b: '#4a86ff',
    c: '#7cffd8',
    m: '#8a8a96',
    d: '#55555f',
  },
  runner: {
    run: [run0, run1],
    jump,
    duck: [duck0, duck1],
    dead,
    idle: [stand, wave],
  },
  small: [[rockA], [rockB], [probe('e'), probe('k')]],
  large: [[lander('e'), lander('k')], [dish('e'), dish('k')], [rocket]],
  flyer: [ufo('e', 'c'), ufo('c', 'e')],
  decor: { sprites: [satellite, comet], y: [4, 26], speed: 0.08, every: [120, 320] },
  sky: { top: '#030306', bottom: '#15151c' },
  stars: '#e6e8ff',
  celestial: { kind: 'earth', x: 0.74, y: 24, r: 10, color: '#3a7cf0', accent: '#34a052' },
  layers: [
    { kind: 'craters', color: '#26262e', accent: '#3a3a46', height: 16, speed: 0.1 },
    { kind: 'sprites', sprites: [habitat, rover, flag, habitat], baseline: 73, speed: 0.2, gap: [90, 220] },
    { kind: 'craters', color: '#3a3a44', accent: '#5a5a68', height: 10, speed: 0.3 },
    { kind: 'rocks', color: '#4a4a54', accent: '#6a6a76', height: 5, speed: 0.55 },
  ],
  ground: { style: 'moon', color: '#8c8c94', line: '#b8b8c0', detail: '#6c6c76' },
  weather: { kind: 'meteors', color: '#fff2c0', color2: '#ff9a40', density: 0.3 },
  night: {
    mode: 'tint',
    sky: { top: '#010105', bottom: '#070a18' },
    tint: '#081030',
    amount: 0.5,
    glow: ['g', 'G', 'e', 'c'],
    stars: '#c8d0ff',
    celestial: { kind: 'sun', x: 0.74, y: 24, r: 10, color: '#0b0d1a', accent: '#ff7a3a' },
    ink: '#c8d0ff',
  },
  ink: '#e8e8f0',
  sound: 'blip',
  gameOver: 'HOUSTON...',
  ui: { bg: '#0b0b10', fg: '#e8e8f0', accent: '#ffb22e' },
};
