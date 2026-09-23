import type { Grid, SkinDef } from './types.ts';

// Fire & Blood: a knight in a red cape runs through a burning realm while
// dragons wheel overhead. Steel reads light against the ember sky; wood,
// stone and dragon hide read dark.

/** Stacks equal-sized grids; later layers draw over earlier ones. */
const over = (...layers: Grid[]): Grid =>
  layers[0].map((row, y) =>
    [...row].map((_, x) => {
      for (let i = layers.length - 1; i >= 0; i--) {
        const ch = layers[i][y]?.[x] ?? '.';
        if (ch !== '.') return ch;
      }
      return '.';
    }).join(''),
  );

// ------------------------------------------------------------------ knight
// 24 x 22. Body columns 12-21, cape streams back over columns 0-13.

const helm = [
  '.............rrr........',
  '...........rRrkkkkk.....',
  '..........rR.kSSsssk....',
  '.............kSssssk....',
  '.............ksskkkk....',
  '.............ksssssk....',
  '.............kssdsdk....',
  '..............kdddk.....',
];
const chestFwd = [
  '.............kSSsssdk...',
  '............kSSSSsssdk..',
  '............kddddsssdk..',
  '............ksSSdssssk..',
  '............ksdSSSSSSSk.',
  '............ksssdddddk..',
  '............kooooooook..',
  '............kdddddddk...',
];
const chestBack = [
  '.............kSSsssdk...',
  '............kSSSSsssdk..',
  '............kddddsssdk..',
  '...........kSSdssssssk..',
  '..........kSSkssssssdk..',
  '...........kkssssssdk...',
  '............kooooooook..',
  '............kdddddddk...',
];
const legsStand = [
  '.............kssk.kssk..',
  '.............kdsk.kdsk..',
  '.............kssk.kssk..',
  '.............kssk.kssk..',
  '.............kssskksssk.',
  '.............kkkkkkkkkk.',
];
// A: front foot planted, back foot kicked up behind.
const legsA = [
  '............ksssssk.....',
  '..........kksssk.kssk...',
  '.........kssk....kdsk...',
  '........kssk.....kssk...',
  '........kkk......ksssk..',
  '.................kkkkk..',
];
// B: back foot planted, front knee raised.
const legsB = [
  '.............ksssssssk..',
  '.............kssk.kSssk.',
  '.............kdsk..kdsk.',
  '.............kssk..kssk.',
  '.............ksssk.kkkk.',
  '.............kkkkk......',
];
const legsJump = [
  '............kssssssk....',
  '...........kssk.kssk....',
  '..........ksdk...kdsk...',
  '...........kssk...kssk..',
  '............ksssk..ksssk',
  '............kkkkk..kkkkk',
];

const blankRows = (n: number) => Array(n).fill('........................');
const capeA = [
  ...blankRows(7),
  '...........RRr..........',
  '.......RRRrrrr..........',
  '...RRRrrrrrrrr..........',
  '.RRrrrrrrrrrrr..........',
  'RrrrrrrrrrrrRr..........',
  'RrrrrRRrrrrrRr..........',
  '.RRR...RRrrrR...........',
  '........RRRR............',
  ...blankRows(7),
];
const capeB = [
  ...blankRows(7),
  '...........RRr..........',
  '.........RRrrr..........',
  '......RRRrrrrr..........',
  '...RRRrrrrrrrr..........',
  '..RrrrrrrrrrRr..........',
  '.RrrrRRRrrrrRr..........',
  'RrRR....RRrrR...........',
  '.R.........RR...........',
  ...blankRows(7),
];
const capeJump = [
  ...blankRows(3),
  '...RRR..................',
  '..RrrrRR................',
  '.RrrrrrrRR..............',
  '.RrrRRrrrrRR............',
  '..RRrrrrrrrrRr..........',
  '...RrrrrrrrrrrR.........',
  '....RRrrrrrrrr..........',
  '......RRRrrrrr..........',
  '.........RRRr...........',
  ...blankRows(10),
];

const run0 = over(capeA, [...helm, ...chestFwd, ...legsA]);
const run1 = over(capeB, [...helm, ...chestBack, ...legsB]);
const jump = over(capeJump, [...helm, ...chestBack, ...legsJump]);
const idle0 = over(capeB, [...helm, ...chestBack, ...legsStand]);
const idle1 = over(capeA, [...helm, ...chestBack, ...legsStand]);

// Flat on his back, helm rolled off beside him.
const dead: Grid = [
  ...blankRows(12),
  '........................',
  '...................rrr..',
  '.kk...............Rkkkk.',
  'kSsk.....kk......kSSsssk',
  'kssk....kSSk.....kSskkkk',
  'kdsk....kssk.kkk.ksssssk',
  'ksskkRRrkkkkkWWnkkssdsdk',
  'kssRrrrrRSSSkWnnnkkdddk.',
  'kkkRrrRRRssskWnknk.kkk..',
  '..kkkkkkkkkkkkkkkk......',
];

// Duck: crouched behind a heater shield (red field, gold chevron). 28 x 12.
const duck0: Grid = [
  '.............kkkkk..........',
  '............kSSsssk.kkkkkkk.',
  '............kSsssdkkSSSSSsdk',
  '........RRr.ksskkkkkSrrrrrdk',
  '.....RRRrrr.kssssskkSrrorrdk',
  '..RRRrrrrrrrkssdsdkkSrorordk',
  '.RrrrrrrrrrkSSsdddkkSorrrodk',
  'RrrrRRrrrkSSssssssskSrrrrrdk',
  '.RR..RRRkSsssddsssk.kSrrrdk.',
  '........kdddddddddk.kSrrrdk.',
  '.........kSsk..kSsk..kSrdk..',
  '.........kkkk..kkkk...kkk...',
];
const duck1: Grid = [
  '.............kkkkk..........',
  '............kSSsssk.kkkkkkk.',
  '............kSsssdkkSSSSSsdk',
  '.........RRrksskkkkkSrrrrrdk',
  '......RRRrrrkssssskkSrrorrdk',
  '...RRRrrrrrrkssdsdkkSrorordk',
  '.RRrrrrrrrrkSSsdddkkSorrrodk',
  'RrrrrrRRrrkSSsssssskSrrrrrdk',
  '.RRR..RRRkSsssddssk.kSrrrdk.',
  '........kdddddddddk.kSrrrdk.',
  '........kSsk.kSsk....kSrdk..',
  '........kkkk.kkkk.....kkk...',
];

// ------------------------------------------------------------------ obstacles

const stakes: Grid = [
  '....kk....',
  '...knnk...',
  '...kwWk...',
  '...kwWkkk.',
  '.kkkwWknnk',
  'knnkwWkwWk',
  'kwWkwWkwWk',
  'kwWkwWkwWk',
  'kooooooook',
  'kwWkwWkwWk',
  'kwWkwWkwWk',
  'kwWkwWkwWk',
  'kWWkwWkwWk',
  'kwWkWWkWWk',
  'kWWkWWkWWk',
];

const swordShield: Grid = [
  '.....kk....',
  '....kook...',
  '....kWWk...',
  '.kkkkookkkk',
  '.koooooooko',
  '.kkkkSdkkkk',
  '....kSdk...',
  '....kSdk...',
  '....kSdk...',
  '....kSdk...',
  'kkkkkSdk...',
  'kSSsSkdk...',
  'ksrrrkdk.k.',
  'ksroorkdksk',
  'ksrrork.krk',
  '.ksrrkk.krk',
  '.kssrk..ksk',
  'kkkkkkkkkkk',
];

const brazierBase = [
  '.kkkkkkkkk.',
  '.kdsssssdk.',
  '..kdddddk..',
  '...kkdkk...',
  '....kdk....',
  '...kdkdk...',
  '..kdk.kdk..',
  '.kkk...kkk.',
];
const brazier0: Grid = [
  '.....y.....',
  '....yf.....',
  '...fyf..f..',
  '..ffyyf.f..',
  '..fyyyffr..',
  '.rfyyyyfr..',
  '.rffyyfffr.',
  ...brazierBase,
];
const brazier1: Grid = [
  '...........',
  '......y....',
  '..f..fy....',
  '..f.fyyf...',
  '..rffyyyf..',
  '..rfyyyyfr.',
  '.rffyyyffr.',
  ...brazierBase,
];
const brazier2: Grid = [
  '...........',
  '....y......',
  '....fy..f..',
  '...fyyf.f..',
  '..ffyyyff..',
  '.rfyyyyyfr.',
  '.rfffyyffr.',
  ...brazierBase,
];

const barricade: Grid = [
  'n.............n',
  'kk...........kk',
  'kwk.........kwk',
  '.kwk.......kwk.',
  '..kwk.....kwk..',
  '...kwk...kwk...',
  '....kwk.kwk....',
  'n....kwkwk....n',
  'kk....kWk....kk',
  'kwk..kwkwk..kwk',
  '.kwkkwk.kwkkwk.',
  'kkkkkkkkkkkkkkk',
  'kwwWwwwWwwwWwwk',
  'kkkkkkkkkkkkkkk',
  '.kwkkwk.kwkkwk.',
  'kwk..kwkwk..kwk',
  'kk....kwk....kk',
  '.....kwkwk.....',
];

const pillarBody = [
  '...kkkkkkkk',
  '...kgggggGk',
  '...kkkkkkkk',
  '....kgggGk.',
  '....kgggGk.',
  '....kgGggk.',
  '....kgggGk.',
  '....kkkkkk.',
  '....kggGgk.',
  '....kgggGk.',
  '....kgggGk.',
  '....kkkkkk.',
  '....kgGggk.',
  '....kgggGk.',
  '....kgggGk.',
  '....kggGgk.',
  '....kkkkkk.',
  '...kggggGGk',
  '...kkkkkkkk',
];
const torch0: Grid = [
  '.y.........',
  '.fy........',
  'ffyf.......',
  'fyyf.......',
  'rffr.......',
  '.kWk.......',
  '.kWkkk.....',
  ...pillarBody,
];
const torch1: Grid = [
  '..y........',
  '.yf........',
  '.fyf.......',
  'fyyf.......',
  'rffr.......',
  '.kWk.......',
  '.kWkkk.....',
  ...pillarBody,
];

const swordThrone: Grid = [
  '......k........',
  '...k..S..k.....',
  '...S.kSk.S..k..',
  '..kSkkSkkSk.S..',
  '..kSkdSdkSkkSk.',
  'k.kSdSSdSSdkSk.',
  'Sk.kSdSdSdSdSkk',
  'SkkdSdSdSdSdkSk',
  '.kSdSdSdSdSdkSk',
  '.kSdSdSdSdSdSk.',
  '.kdSdSdSdSdSdk.',
  '.kdSdSdSdSdSdk.',
  'kkkkkkkkkkkkkkk',
  'SSSSokSSSSkoSSS',
  'kkkkkkkkkkkkkkk',
  '.kSSSSSSSSSSSk.',
  '.kdddddddddddk.',
  '.kSk.......kSk.',
  '.kdk.......kdk.',
  'kkkkkkkkkkkkkkk',
  'kgggggggggggggk',
  'kGGGGGGGGGGGGGk',
  'kkkkkkkkkkkkkkk',
];

// ------------------------------------------------------------------ dragon
// 26 x 20, faces left. Wing up / wing down with a fire puff.

const dragonUp: Grid = [
  '..........k...............',
  '...........kkkkkkkkkkkkkk.',
  '...........kkrRRRRRRRRRk..',
  '............krkkkRRRRk....',
  '............kkrRRkkkRk....',
  '............krkRRRRRkkkk..',
  '............krRkRRRRRRRkk.',
  '.......k.k...krRkRRRRk....',
  '......kGkGk..krRRkRRk.....',
  '....kkGGGGGk.krRRRkRRk....',
  '...kGGGyGGGGk.krRRRkkk....',
  '...kkkoGGGGGGkkrRRk.......',
  '......kkoGGGGGkkkkkk...k..',
  '........koGGGGGGGGGGkkkGk.',
  '.........kooGGGGGGGGGGGGGk',
  '..........kkoooooGGGkkkGk.',
  '...........kGkkkkkGk...k..',
  '...........kk.....kk......',
  '..........................',
  '..........................',
];
const dragonDown: Grid = [
  '..........................',
  '..........................',
  '..........................',
  '..........................',
  '..........................',
  '..........................',
  '..........................',
  '.......k.k................',
  '......kGkGk...............',
  'y...kkGGGGGk..............',
  'fy.kGGGyGGGGk.............',
  'yffkkkkGGGGGGk............',
  'fyfff.koGGGGGkkkkkk...k...',
  'yfy.kkkkoGGGGkrrrrrkkkGk..',
  '.y.......kooGkrRRRRRGGGGGk',
  '..........kkkrRkRRRRkkkGk.',
  '...........krRRRkkRRRRkk..',
  '..........krRRRRRRkkRRk...',
  '..........krRkRRRRk..kk...',
  '.........kkkk.kkkk........',
];

// ------------------------------------------------------------------ decor

const smokeA: Grid = [
  '........gggg..........',
  '.....gggggggg..ggg....',
  '...gggggGGgggggggggg..',
  '..ggGGGGGGGGGGGgggGGg.',
  '.gGGGGGGGGGGGGGGGGGGGg',
  '..GGGGG..GGGGGG..GGG..',
  '....G.......GG........',
];
const smokeB: Grid = [
  '.....ggg........',
  '..ggggggggg.gg..',
  '.gggGGGGggggGGg.',
  'gGGGGGGGGGGGGGGg',
  '.GGG...GGGG..GG.',
];
const farDragon: Grid = [
  '....k.......',
  '...kk.......',
  '.kkkkk......',
  'kk..kkkkkk.k',
  '.....kk..kk.',
  '.....k......',
];

export const dragons: SkinDef = {
  id: 'dragons',
  name: 'Fire & Blood',
  tagline: 'The realm is burning. Keep running, ser.',
  palette: {
    k: '#1c1216', // outline, iron
    d: '#5e6670', // steel shadow
    s: '#a3adb7', // steel
    S: '#e4e9ee', // steel highlight, blades
    r: '#c8202e', // cape red
    R: '#74101c', // cape shadow, wing membrane
    o: '#e0a53c', // gold trim, dragon belly, rope
    n: '#e8b48c', // skin
    w: '#8a5530', // wood
    W: '#553117', // wood shadow
    f: '#ff8424', // flame
    y: '#ffe06a', // flame core, eyes
    g: '#857a72', // stone
    G: '#3d3134', // dark stone, dragon hide, smoke
  },
  runner: { run: [run0, run1], jump, duck: [duck0, duck1], dead, idle: [idle0, idle1] },
  small: [[stakes], [swordShield], [brazier0, brazier1, brazier2]],
  large: [[barricade], [torch0, torch1], [swordThrone]],
  flyer: [dragonUp, dragonDown],
  decor: { sprites: [smokeA, smokeB, farDragon], y: [6, 36], speed: 0.12, every: [70, 190] },
  sky: { top: '#5e0a1a', bottom: '#dc5e32' },
  celestial: { kind: 'sun', x: 0.72, y: 30, r: 11, color: '#b8141e', accent: '#ff6a3a' },
  layers: [
    { kind: 'mountains', color: '#b24a32', height: 36, speed: 0.05 },
    { kind: 'castle', color: '#7c2f2c', accent: '#ffc35a', height: 32, speed: 0.14, glow: true },
    { kind: 'ruins', color: '#5c2324', accent: '#ff8a2a', height: 12, speed: 0.35, glow: true },
  ],
  ground: { style: 'cobble', color: '#4a3a38', line: '#1c1216', detail: '#6b5752' },
  weather: { kind: 'embers', color: '#ffb040', color2: '#ff5a1a', density: 0.5 },
  night: {
    mode: 'tint',
    sky: { top: '#12050a', bottom: '#4a1214' },
    tint: '#12060c',
    amount: 0.5,
    glow: ['f', 'y'],
    stars: '#8a4a48',
    celestial: { kind: 'moon', x: 0.72, y: 26, r: 12, color: '#b83a2c', accent: '#8e2820' },
    weather: { kind: 'ash', color: '#9a8a86', color2: '#6a5a58', density: 0.45 },
    ink: '#f2dcc6',
  },
  ink: '#fff2e0',
  sound: 'roar',
  gameOver: 'DRACARYS',
  ui: { bg: '#1a0b0e', fg: '#f4e2cf', accent: '#e8582a' },
};
