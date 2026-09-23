import type { Grid, SkinDef } from './types.ts';

// Tokyo Lights: a red cyber-bike tearing through a rain-soaked neon city.
// Frames are built by stamping shared parts (bike body, wheels, rider) onto
// fixed canvases, so every frame of an animation keeps the same anchor.

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

/** Tilts a grid by shifting column x up by round((x - pivot) * k). */
function tilt(g: Grid, k: number, pivot: number): Grid {
  const h = g.length, w = g[0].length;
  const rows = Array.from({ length: h }, () => Array<string>(w).fill('.'));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ch = g[y][x];
    if (ch === '.') continue;
    const Y = y - Math.round((x - pivot) * k);
    if (Y >= 0 && Y < h) rows[Y][x] = ch;
  }
  return rows.map((r) => r.join(''));
}

const flipV = (g: Grid): Grid => [...g].reverse();

// ---------------------------------------------------------------- runner

// Hubless wheels: dark tyre, neon rim, grey hub. The two frames rotate the
// spokes and move a glint around the rim.
const wheelA: Grid = [
  '..ooo..',
  '.occco.',
  'ocxgxco',
  'ohgggco',
  'ocxgxco',
  '.occco.',
  '..ooo..',
];
const wheelB: Grid = [
  '..ooo..',
  '.occco.',
  'ocgxgco',
  'ocxgxco',
  'ocgxgco',
  '.ochco.',
  '..ooo..',
];

// Bodywork, 25 wide: a kicked-up tail, a dip for the rider, a tall front
// cowl with a bubble screen, and a nose that slopes to the headlight. The
// wheels hang under rows 5-11. `tail` is the tail-light pixel.
const bodyRows = (tail: string): Grid => [
  '..................cc.....',
  '.................cccc....',
  'pp..............pprrcp...',
  '.prrp..........prrrrrrp..',
  tail + 'rrrrrpooooooprrhhrrrrrp.',
  '.drrrrrrrrrrrrrrrrrrrrrry',
  '..dddddodgggggggoddddddd.',
  '........oxxoxxo..........',
];
const bodyA = bodyRows('m');
const bodyB = bodyRows('p');

const RW = 25, RH = 22;
const BIKE_Y = 10;
/** The whole bike on a 25×12 strip: wheels under the bodywork. */
const bikeStrip = (wheel: Grid, body: Grid): Grid =>
  compose(RW, 12, [[wheel, 1, 5], [wheel, 17, 5], [body, 0, 0]]);

// Rider in the dip, leaning into the bars. Torso in shadow (j), the near arm
// and leg lit (J) so the limbs read against the body.
const rider: Grid = [
  '..............hhh........',
  '.............hhhhh.......',
  '............hhhhhcc......',
  '............hhhhhcc......',
  '............jhhhh........',
  '..........jjjjJJ.........',
  '.........jjjj..JJ........',
  '........jjjj....JJ.......',
  '.......jjjj......Jo......',
  '.......jjJJJJJJ..........',
  '.......jjj....JJ.........',
  '..............JJ.........',
  '.............ooo.........',
];
const RIDER_Y = 3;

const run0 = compose(RW, RH, [[bikeStrip(wheelA, bodyA), 0, BIKE_Y], [rider, 0, RIDER_Y]]);
// Second frame: the suspension dips, so the rider bobs a pixel lower.
const run1 = compose(RW, RH, [[bikeStrip(wheelB, bodyB), 0, BIKE_Y], [rider, 0, RIDER_Y + 1]]);

// Wheelie: the bodywork tilts about the rear axle and the front wheel lifts.
const jump = compose(RW, RH, [
  [wheelA, 1, BIKE_Y + 5],
  [wheelA, 17, BIKE_Y + 1],
  [tilt(compose(RW, RH, [[bodyA, 0, BIKE_Y]]), 0.25, 4), 0, 0],
  [rider, 0, RIDER_Y - 2],
]);

// Crash: the bike lands wheels-up in a shower of sparks, the rider sails
// over it head-first.
const tumble: Grid = [
  '..o.......o...',
  '..JJ.....JJ...',
  '...JJ...JJ....',
  '....jJJJj.....',
  '.....jjj......',
  '..oJJjjjJJo...',
  '.....hhhh.....',
  '....hhhhcc....',
  '....hhhhcc....',
  '.....hhh......',
];
const dead = compose(RW, RH, [
  [flipV(bikeStrip(wheelB, bodyA)), 0, BIKE_Y],
  [tumble, 5, 0],
  [[
    'h....................y..',
    '.y..................y.h.',
    'y.h..................y..',
    '.y.......................',
    'y........................',
  ], 0, 14],
]);

// Idle: engine ticking over, a glint running along the screen.
const idle = [run0, compose(RW, RH, [[run0, 0, 0], [['h'], 19, BIKE_Y]])];

// Duck: rider flat along the bike, helmet tucked behind the screen.
const duckRider: Grid = [
  '............hhhh.........',
  '.....jjjjjjhhhhcc........',
  '....jjjjjJJJJJhcc........',
  '....oJJJJJ...............',
];
const duck0 = compose(RW, 12, [[bikeStrip(wheelA, bodyA), 0, 0], [duckRider, 0, 0]]);
const duck1 = compose(RW, 12, [[bikeStrip(wheelB, bodyB), 0, 0], [duckRider, 0, 0]]);

// ---------------------------------------------------------------- obstacles

const cone: Grid = [
  '...oo...',
  '...nn...',
  '..nccn..',
  '..nnnn..',
  '..nnnn..',
  '.nccccn.',
  '.nnnnnn.',
  '.nnnnnn.',
  'nccccccn',
  'oooooooo',
];

const barrierBase: Grid = [
  '....oo....',
  'nnoonnoonn',
  'noonnoonno',
  'oonnoonnoo',
  'cccccccccc',
  '.g......g.',
  '.g......g.',
  'g........g',
  'g........g',
];
const barrierA: Grid = ['....yy....', ...barrierBase];
const barrierB: Grid = ['....oo....', ...barrierBase];

// A maneki-neko outside a shop, waving its paw.
const catHead = [
  'h....h...',
  'hp..ph...',
  'hhhhhh...',
  'hohhoh...',
  'hhhphh...',
  '.hhhhh...',
];
const catBody = [
  'rrryrrr..',
  'hhhhhhh..',
  'hhyyyhh..',
  'hhyyyhh..',
  'hhhhhhh..',
  '.rrrrr...',
];
const catA: Grid = compose(9, 12, [[catHead, 0, 0], [catBody, 0, 6], [['hh', 'hh', 'hh', 'h.'], 7, 1], [['hh'], 6, 4]]);
const catB: Grid = compose(9, 12, [[catHead, 0, 0], [catBody, 0, 6], [['hh', 'hh'], 7, 3], [['hhh'], 6, 4], [['.h'], 7, 5]]);

const vending = (hdr: string, lit: string): Grid => [
  'ooooooooooo',
  'ohhhhhhhhho',
  'oh' + hdr.repeat(7) + 'ho',
  'ohhhhhhhhho',
  'oh' + lit.repeat(7) + 'ho',
  'oh' + lit + 'm' + lit + 'r' + lit + 'c' + lit + 'ho',
  'oh' + lit + 'm' + lit + 'r' + lit + 'c' + lit + 'ho',
  'oh' + lit.repeat(7) + 'ho',
  'oh' + lit + 'c' + lit + 'm' + lit + 'r' + lit + 'ho',
  'oh' + lit + 'c' + lit + 'm' + lit + 'r' + lit + 'ho',
  'oh' + lit.repeat(7) + 'ho',
  'ohxxxxxxxho',
  'ohhhhhhhhho',
  'ohhhhhhhxho',
  'ohhhhhhhxho',
  'ohhhhhhhhho',
  'ohoooooooho',
  'ohoooooooho',
  'ohhhhhhhhho',
  'ooooooooooo',
];

// A street lamp with a vertical neon sign; the middle glyph flickers.
const glyphs = [
  ['..c..', 'ccccc', '..c..', '.c.c.', 'c...c'],
  ['ccccc', '..c..', '.ccc.', '..c..', 'ccccc'],
  ['c.c.c', 'c.c.c', 'ccccc', '..c..', '.c.c.'],
];
const lampPost = (flicker: boolean): Grid => {
  const g = glyphs.map((gl, i) => gl.map((r) => (flicker && i === 1 ? r.replace(/c/g, 'x') : r).replace(/\./g, 'o')));
  const board = (r: string) => '...gm' + r + 'm';
  return [
    '..yyy......',
    '.ggggg.....',
    '...g.......',
    '...gmmmmmmm',
    ...g[0].map(board),
    board('ooooo'),
    ...g[1].map(board),
    board('ooooo'),
    ...g[2].map(board),
    '...gmmmmmmm',
    '...g.......',
    '...g.......',
    '..ggg......',
    '.ggggg.....',
  ];
};

// ---------------------------------------------------------------- flyer

// Surveillance drone, facing left: red camera eye, rotors spinning.
const droneBody: Grid = [
  '...oo............oo...',
  '..xggxxxxxxxxxxxxggx..',
  '......oxhhhhhhxo......',
  '.....oxggggggggxo.....',
  '.....ooeoggggggxo.....',
  '.....oeheoggggxxo.....',
  '.....ooeoxxxxxxo......',
  '.......oxxxxxxo.......',
];
const droneA: Grid = ['gggggggg......gggggggg', ...droneBody, '........o.mm.o........'];
const droneB: Grid = ['..gggg..........gggg..', ...droneBody, '........o.cc.o........'];

// ---------------------------------------------------------------- scenery

// A broadcast spire far behind the skyline, decks and tip lit.
const spire: Grid = [
  '....m....',
  '....x....',
  '....x....',
  '....x....',
  '....x....',
  '....x....',
  '...xxx...',
  '..xcccx..',
  '...xxx...',
  '...xxx...',
  '...xxx...',
  '...xxx...',
  '...xxx...',
  '...xxx...',
  '..xxxxx..',
  '.xmmmmmx.',
  '.xxxxxxx.',
  '..xxxxx..',
  ...Array(12).fill('..xxxxx..'),
  ...Array(12).fill('.xxxxxxx.'),
  ...Array(12).fill('xxxxxxxxx'),
];

// ---------------------------------------------------------------- decor

const blimp: Grid = [
  '..........oooooooooooooo............',
  '......oooxxxxxxxxxxxxxxxxooo........',
  '....ooxxxxxxxxxxxxxxxxxxxxxxxoo..oo.',
  '...oxxxmmmmmmmmmmmmmmmmmmmxxxxxoooo.',
  '..oxxxxmccccmmmcccmmmmcccmxxxxxxxoo.',
  '..oxxxxmmmmmmmmmmmmmmmmmmmxxxxxxxoo.',
  '...oxxxxxxxxxxxxxxxxxxxxxxxxxxxoooo.',
  '....ooxxxxxxxxxxxxxxxxxxxxxxxoo..oo.',
  '......oooxxxxxxxxxxxxxxxxooo........',
  '..........ooooxxxxxoooo.............',
  '..............ooooo.................',
];
// A flying car, headlights forward, thrusters glowing underneath.
const car: Grid = [
  '......ooooo.......',
  '....oocccccoo.....',
  '..oohhhhhhhhhho...',
  '.ogggggggggggggoo.',
  'yggggggggggggggggm',
  '.oxxxxxxxxxxxxxxo.',
  '...mm........mm...',
];

export const tokyo: SkinDef = {
  id: 'tokyo',
  name: 'Tokyo Lights',
  tagline: 'Neon, rain and a very red motorbike.',
  palette: {
    o: '#120a22',
    x: '#2e2448',
    g: '#7d78a6',
    h: '#eceaff',
    j: '#5a48a0',
    J: '#a08ee8',
    r: '#ff2d55',
    d: '#a8123f',
    p: '#ff9ec0',
    m: '#ff3fd2',
    c: '#3ef3ff',
    y: '#fff3a0',
    n: '#ff8a1f',
    e: '#ff1a1a',
  },
  runner: {
    run: [run0, run1],
    jump,
    duck: [duck0, duck1],
    dead,
    idle,
  },
  small: [[cone], [barrierA, barrierB], [catA, catB]],
  large: [[vending('c', 'y'), vending('m', 'y')], [lampPost(false), lampPost(true)]],
  flyer: [droneA, droneB],
  decor: { sprites: [blimp, car], y: [6, 30], speed: 0.12, every: [80, 220] },
  sky: { top: '#0e0826', bottom: '#6a1a6e' },
  celestial: { kind: 'synthsun', x: 0.68, y: 52, r: 14, color: '#ffd23f', accent: '#ff2d95' },
  layers: [
    { kind: 'sprites', sprites: [spire], speed: 0.06, gap: [260, 420] },
    { kind: 'city', color: '#2a1552', accent: '#3ef3ff', height: 36, speed: 0.15, glow: true },
    { kind: 'city', color: '#150a2b', accent: '#ff3fd2', height: 26, speed: 0.4, glow: true },
  ],
  ground: { style: 'wet', color: '#1b1030', line: '#ff3fd2', detail: '#3ef3ff' },
  weather: { kind: 'rain', color: '#9ff6ff', density: 0.5 },
  reflection: true,
  night: {
    mode: 'tint',
    sky: { top: '#04020e', bottom: '#2a0a3a' },
    tint: '#0a0520',
    amount: 0.45,
    glow: ['c', 'm', 'y', 'e'],
    stars: '#8a7fc0',
    celestial: { kind: 'crescent', x: 0.74, y: 20, r: 6, color: '#ffc8ea' },
    ink: '#7ff6ff',
  },
  ink: '#7ff6ff',
  sound: 'neon',
  gameOver: 'SYSTEM CRASH',
  ui: { bg: '#0e0826', fg: '#eceaff', accent: '#ff2d55' },
};
