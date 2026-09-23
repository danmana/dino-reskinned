import type { Grid, SkinDef } from './types.ts';

// Graveyard Shift: a skeleton on the night shift, sprinting between the
// headstones under a harvest moon. Bone and stone read light against the
// purple dusk; eye sockets and jack-o'-lanterns stay lit after dark.

// ------------------------------------------------------------------ skeleton
// 24 x 22. The skull (cols 10-23, rows 0-8) is shared by every frame.

const skull = [
  '..............kkkkk.....',
  '............kkbbbbbkk...',
  '...........kbbbbbbbbbk..',
  '..........kbbbbbbbbbbbk.',
  '..........kbbbbbbbkkbbk.',
  '..........kBbbbbbbkekbk.',
  '..........kBbbbbbbbbbkk.',
  '...........kBBbbbbbbbbk.',
  '............kkkbkbkbkk..',
];
const skullBlink = [...skull.slice(0, 5), '..........kBbbbbbbkkkbk.', ...skull.slice(6)];

const run0: Grid = [
  ...skull,
  '.............kbkkkkk....',
  '...........kkbbbbbbkkk..',
  '..........kbkbB..kbbbbk.',
  '.........kbkkbbbbbkkkbk.',
  '........kbk.kbB..k...k..',
  '........kk..kbbbbk......',
  '.............kbkk.......',
  '............kbbbbk......',
  '...........kbkk.kbk.....',
  '..........kbk....kbk....',
  '.........kbk......kbk...',
  '........kbbk......kbbk..',
  '........kkkk......kkkk..',
];
const run1: Grid = [
  ...skull,
  '.............kbkkkkk....',
  '...........kkbbbbbbk....',
  '..........kbkbB..kbk....',
  '..........kbkbbbbkbk....',
  '..........kbkbB..kbbk...',
  '..........kbkbbbbkkbbk..',
  '..........kbkkbkk..kk...',
  '..........kbkbbbbk......',
  '..........kkkbkkbbk.....',
  '.............kbkkkbbk...',
  '............kbk..kkbk...',
  '...........kbbk...kbbk..',
  '...........kkkk...kkkk..',
];
const standBody = [
  '.............kbkkkkk....',
  '...........kkbbbbbbk....',
  '..........kbkbB..kk.....',
  '..........kbkbbbbbk.....',
  '..........kbkbB..k......',
  '..........kbkbbbbk......',
  '..........kbkkbkk.......',
  '..........kbkbbbbk......',
  '..........kkkbkkbk......',
  '.............kbkkbk.....',
  '.............kbk.kbk....',
  '............kbbk.kbbk...',
  '............kkkk.kkkk...',
];
const jump: Grid = [
  '......kk......kkkkk.....',
  '.....kbbk...kkbbbbbkk...',
  '.....kbbk..kbbbbbbbbbk..',
  '......kbk.kbbbbbbbbbbbk.',
  '......kbk.kbbbbbbbkkbbk.',
  '.......kbkkBbbbbbbkekbkk',
  '.......kbkkBbbbbbbbbbkkb',
  '........kbkkBBbbbbbbbkbk',
  '........kbk.kkkbkbkbkbk.',
  '.........kbk.kbkkkkkbk..',
  '..........kbkbbbbbbbk...',
  '...........kbbB..kkk....',
  '...........kbbbbbbk.....',
  '............kbB..k......',
  '............kbbbbk......',
  '.............kbkk.......',
  '............kbbbbk......',
  '...........kbkkkbk......',
  '..........kbk..kbk......',
  '..........kbk...kbk.....',
  '.........kbbk...kbbk....',
  '.........kkkk...kkkk....',
];
// A heap of bones with the skull resting on top.
const dead: Grid = [
  ...Array(9).fill('........................'),
  '...........kkkkk........',
  '.........kkbbbbbkk......',
  '........kbbbbbbbbbk.....',
  '........kbbbbbbkkbk.....',
  '........kBbbbbbkekk.....',
  '.....kk.kBBbbbbbbbk.kk..',
  '....kbbkkkkkbkbkbkkkbbk.',
  '...kbkkbbbbkkkkkkbbbkbbk',
  '..kbbkkbkkkbbbbbkkkkbkk.',
  '.kkbbbbbbkkbkbkbbbbbbk..',
  'kbbkkkkbbbbbkkkkkkbbbbk.',
  'kbbbbbbbbkkbbbbbbkkkbbbk',
  'kkkkkkkkkkkkkkkkkkkkkkkk',
];

// Crawling on all fours. 32 x 12.
const crawlSkull = [
  '..................kkkkk.........',
  '................kkbbbbbkk.......',
  '...............kbbbbbbbbbk......',
  '..............kbbbbbbbbbbbk.....',
  '..............kbbbbbbbkkbbk.....',
  '..............kBbbbbbbkekbk.....',
];
const duck0: Grid = [
  ...crawlSkull,
  '....kk.kkkkkkkkBbbbbbbbbbkk.....',
  '...kbbkbbbbbbbbkBBbbbbbbbbk.....',
  '..kbkkbkkbkbkbkbkkkbkbkbkk......',
  '.kbk..kbkbkbkbkk.kbkkkkkk.......',
  'kbbk.kbbkkkkkkkk.kbbbbbbbbk.....',
  'kkkk.kkkk.........kkkkkkkkk.....',
];
const duck1: Grid = [
  ...crawlSkull,
  '.......kkkkkkkkBbbbbbbbbbkk.....',
  '..kkkkkbbbbbbbbkBBbbbbbbbbk.....',
  '.kbbbbbkkbkbkbkbkkkbkbkbkk......',
  '.kkkkkbkbkbkbkbk..kbkkk.........',
  '....kbbkkkkkkkkk.kbbk.kbbbk.....',
  '....kkkk.........kkkk.kkkkk.....',
];

// ------------------------------------------------------------------ obstacles

const tombstone: Grid = [
  '..kkkkk..',
  '.ksssssk.',
  'kssssssSk',
  'ksssSsskk',
  'ksssSskSk',
  'kssSSSkSk',
  'ksssSskSk',
  'ksssSsssk',
  'ksssSssSk',
  'kssssssSk',
  'ksssssSSk',
  'kgsssssSk',
  'kggsSgSgk',
  'kkkkkkkkk',
];

const lanternTop = [
  '.....kk....',
  '....kgk....',
  '..kkkgkkk..',
  '.kppPpPppk.',
];
const lantern0: Grid = [
  ...lanternTop,
  'kpyyPpPyypk',
  'kppyPpPyppk',
  'kpPppyppPpk',
  'kpyyyyyyypk',
  '.kpyPyPypk.',
  '..kkkkkkk..',
];
const lantern1: Grid = [
  ...lanternTop,
  'kpllPpPllpk',
  'kpplPpPlppk',
  'kpPpplppPpk',
  'kplllllllpk',
  '.kplPlPlpk.',
  '..kkkkkkk..',
];

const skullPile: Grid = [
  '...kkkkk...',
  '..kbbbbbk..',
  '..kbkbkbk..',
  '..kbkbkbk..',
  '..kBbkbBk..',
  '.kkkbbbkkk.',
  'kbbbkkkbbbk',
  'kbkbkbkbkbk',
  'kbkbkbkbkbk',
  'kBbkkBbkbBk',
  '.kbbbkbbbk.',
  '..kkk.kkk..',
];

const celticCross: Grid = [
  '.....kkk.....',
  '....kssSk....',
  '....kssSk....',
  '...kSssSSk...',
  '..kSSssSSSk..',
  '.kSSkssSkSSk.',
  'ksssssssssssk',
  'ksssssssssssk',
  'kSSSSssSSSSSk',
  '.kSSkssSkSSk.',
  '..kSSssSSSk..',
  '...kSssSSk...',
  '....kssSk....',
  '....kssSk....',
  '....ksSSk....',
  '....kssSk....',
  '....kssSk....',
  '....kssSk....',
  '....kssSk....',
  '..kkkssSkkk..',
  '..kssssssSk..',
  '.kkkkkkkkkkk.',
  '.ksssssssSSk.',
  'kkkkkkkkkkkkk',
];

const coffinRows = (eye: string): Grid => [
  '...kkkkkk..',
  '..kwwwwwWk.',
  '.kwwwwwwWWk',
  `k${eye}wwwbwwwWk`,
  'kkwwwbwwwWk',
  `k${eye}wbbbbbwWk`,
  'kkwwwbwwwWk',
  '.kwwwbwwwWk',
  '.kwwwbwwwWk',
  '.kwwwbwwWWk',
  '.kwwwwwwwWk',
  '.kwwwwwwWWk',
  '.kwwwwwwwWk',
  '.kwwwwwwWWk',
  '..kwwwwwWk.',
  '..kwwwwwWk.',
  '..kwwwwwWk.',
  '..kkkkkkkk.',
];
const coffin0 = coffinRows('e');
const coffin1 = coffinRows('k');

const stumpCrow: Grid = [
  '.....kkk.......',
  '....kvvvk......',
  '...Svyvvk......',
  '....kvvvvk.....',
  '.....kvvvvk....',
  '......kvvVVk...',
  '.......kkvkkk..',
  '......kkkWkk...',
  '...kk.kwwwkk...',
  '..kwk.kwwwWWk..',
  '..kwwkwwwwWWk..',
  '...kwwwwwWWWk..',
  '....kwwwwwWWk..',
  '....kwwwwwWWk..',
  '....kwwWwwWWk..',
  '....kwwwwwWWk..',
  '....kwwwwWWWk..',
  '...kwwwwwwWWWk.',
  '..kwwWwwwwwWWWk',
  '.kwwkkwwwkkwWWk',
  'kkkk.kkkkk.kkkk',
];

// ------------------------------------------------------------------ bat
// 24 x 14, flying left (head on the left of the body).

const batUp: Grid = [
  '.k....................k.',
  '.kk..................kk.',
  '.kVk....k.k.........kVk.',
  '.kVVk..kvkvk.......kVVk.',
  '.kVVVk.kvvvk......kVVVk.',
  '.kVVVVkvevevk....kVVVVk.',
  '..kVVVkvvvvvkk..kVVVVk..',
  '..kVVVVkvbvbkVkkVVVVk...',
  '...kVVVkkvvvkVVVVVVk....',
  '...kVkVkkkvkkVVkVVk.....',
  '....k.kk..k..kk.kk......',
  '........................',
  '........................',
  '........................',
];
const batDown: Grid = [
  '........................',
  '........................',
  '........................',
  '........k.k.............',
  '.......kvkvk............',
  '.......kvvvk............',
  '...kkkkvevevkkkkkkkk....',
  '..kVVVVkvvvvkVVVVVVVkk..',
  '.kVVVVVkvbvbkVVVVVVVVVk.',
  'kVVVVVkkkvvvkkVVVVVVVVVk',
  'kVVkVVk..kvk..kVVkVVkVVk',
  'kVk.kVk.......kVk.kVk.kk',
  'kk..kk.........kk..kk...',
  '........................',
];

// ------------------------------------------------------------------ decor

const ghost: Grid = [
  '...ffff...',
  '..ffffff..',
  '.ffkffkff.',
  '.ffkffkff.',
  '.ffffffff.',
  'fffffkffff',
  'ffffffffff',
  'ffffffffff',
  'fff.ff.fff',
  '.f...f...f',
];
const ghostSmall: Grid = [
  '..ffff..',
  '.ffffff.',
  '.fkffkf.',
  'ffffffff',
  'fffkkfff',
  '.ffffff.',
  '.ffffff.',
  '.f.ff.f.',
];
const wisp: Grid = [
  '...e..',
  '..ee..',
  '.eeye.',
  '.eyye.',
  '..eee.',
  '...e..',
];

// Haunted house on a hill, for a slow parallax layer.
const hauntedHill: Grid = [
  '...................................h....................',
  '...................................h....................',
  '..................................hhh...................',
  '..................................hhh...................',
  '.................................hhhhh..................',
  '.................................hhhhh..................',
  '................................hhhhhhh.................',
  '.................h..............hhyhyhh.................',
  '................hhh.............hhyhyhh.................',
  '...............hhhhh...hh.......hhhhhhh.................',
  '..............hhhhhhh..hh.......hhhhhhh.................',
  '.............hhhhhhhhhhhh.......hhhhhhh.................',
  '............hhhhhhhhhhhhhh......hhyhyhh.......h.........',
  '...........hhhhhhhhhhhhhhhh.....hhyhyhh......h.h........',
  '..........hhhhhhhhhhhhhhhhhh....hhhhhhh...h..h..........',
  '............hyyhhhhhyyhhhh......hhhhhhh....h.h..........',
  '............hyyhhhhhyyhhhhhhhhhhhhhhhhh.....hh..h.......',
  '............hhhhhhhhhhhhhhyyhhhyyhhhhhh.....h.hh........',
  '............hhhhhhhhhhhhhhyyhhhyyhhhhhh.....hh..........',
  '............hhhhhyyyhhhhhhhhhhhhhhhhhhh.....h...........',
  '............hhhhhyyyhhhhhhhhhhhhhhhhhhh.....h...........',
  '..........hhhhhhhyyyhhhhhhhhhhhhhhhhhhhhh...hh..........',
  '.....hh...hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh..hh...',
  '..hhhh.hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh..',
  'hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh',
];

export const graveyard: SkinDef = {
  id: 'graveyard',
  name: 'Graveyard Shift',
  tagline: 'Clocked in at midnight. Try not to lose your head.',
  palette: {
    k: '#1a1026', // outline
    b: '#efe8d4', // bone
    B: '#b8ad94', // bone shadow
    e: '#7dff5a', // eye glow, wisps
    s: '#a09ab0', // stone
    S: '#635c78', // stone shadow, engraving
    p: '#f28c28', // pumpkin
    P: '#a8481c', // pumpkin ribs
    y: '#ffd84a', // candle light
    l: '#c8501c', // candle light, guttering
    g: '#6a8a3a', // stem, moss
    w: '#7a5238', // wood
    W: '#472e24', // wood shadow
    v: '#34223f', // bat and crow
    V: '#5c3d6c', // wing membrane
    f: '#dfe6f0', // ghost sheet
    h: '#2c2040', // haunted hill silhouette
  },
  runner: { run: [run0, run1], jump, duck: [duck0, duck1], dead, idle: [[...skull, ...standBody], [...skullBlink, ...standBody]] },
  small: [[tombstone], [lantern0, lantern0, lantern1], [skullPile]],
  large: [[celticCross], [coffin0, coffin0, coffin0, coffin1], [stumpCrow]],
  flyer: [batUp, batDown],
  decor: { sprites: [ghost, ghostSmall, wisp], y: [8, 40], speed: 0.1, every: [80, 220] },
  sky: { top: '#2a1840', bottom: '#72806c' },
  celestial: { kind: 'moon', x: 0.68, y: 28, r: 13, color: '#f2a444', accent: '#e39238' },
  layers: [
    { kind: 'graves', color: '#4a3a62', height: 12, speed: 0.1 },
    { kind: 'sprites', sprites: [hauntedHill], speed: 0.2, gap: [140, 300] },
  ],
  ground: { style: 'grass', color: '#2a2622', line: '#56603e', detail: '#3c382e' },
  weather: { kind: 'fog', color: '#b4c0ae', color2: '#96a494', density: 0.5 },
  night: {
    mode: 'tint',
    sky: { top: '#0c0716', bottom: '#26322e' },
    tint: '#0a0614',
    amount: 0.4,
    glow: ['e', 'y', 'l', 'f'],
    stars: '#c8c0e0',
    celestial: { kind: 'moon', x: 0.68, y: 26, r: 12, color: '#f6c878', accent: '#e8b868' },
    weather: { kind: 'fireflies', color: '#7dff5a', color2: '#c8ff9a', density: 0.35 },
    ink: '#e6f2dc',
  },
  ink: '#f0f6e6',
  sound: 'spooky',
  gameOver: 'REST IN PIECES',
  ui: { bg: '#170f22', fg: '#e8f0dc', accent: '#f28c28' },
};
