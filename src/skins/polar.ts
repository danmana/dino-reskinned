import type { Grid, SkinDef } from './types.ts';

// Arctic ice under a huge sky. A penguin in a red scarf waddles past ice
// shards, fish buckets and snowmen; ducking is a belly slide. At night the
// sky goes navy and the northern lights come out.

// ---------------------------------------------------------------- penguin
// Side view, facing right. 22 x 22; the top rows are headroom for the
// flippers-up jump.

const e = '......................';
const head = [
  '........kkkkk.........',
  '.......kkkkkkk........',
  '......kkkkkkkkk.......',
  '......kkkkkkwkkk......',
  '......kkkkkkkkkooo....',
  '......kkyykkwwkoooo...',
  '......kkyykwwwwoo.....',
];
const scarf = [
  '...rr.rrrrrrrrrr......',
  '..rrRRRRRRRRRRRR......',
];
const scarf2 = [
  '......rrrrrrrrrr......',
  '..rrrrRRRRRRRRRR......',
];
const bodyA = [
  '.rR...kkkkwwwwwbs.....',
  'rR...kkkkwwwwwwwbs....',
  '....kkkkkwwwwwwwwbs...',
  '...kkkkkkwwwwwwwwbs...',
  '..kkkkkkwwwwwwwwwbs...',
  '.kk.kkkkwwwwwwwwwbs...',
  '....kkkkwwwwwwwwbsb...',
  '....kkkkbwwwwwwbsbb...',
  '.....kkkbbwwwwbsbb....',
  '......kkkbbbbbbbb.....',
];
const bodyB = [
  '..R...kkkkwwwwwbs.....',
  '.rR..kkkkwwwwwwwbs....',
  'rR..kkkkkwwwwwwwwbs...',
  '...kkkkkkwwwwwwwwbs...',
  '...kkkkkwwwwwwwwwbs...',
  '..kkkkkkwwwwwwwwwbs...',
  '..k.kkkkwwwwwwwwbsb...',
  '....kkkkbwwwwwwbsbb...',
  '.....kkkbbwwwwbsbb....',
  '......kkkbbbbbbbb.....',
];
const feetA = [
  '.......oo....ooo......',
  '......ooo.....oo......',
];
const feetB = [
  '........ooo..oo.......',
  '........oo...ooo......',
];

const feetStand = [
  '........oo...oo.......',
  '.......ooo..ooo.......',
];
const standBody = [...bodyB.slice(0, 5), ...bodyA.slice(5)];
const run0: Grid = [e, ...head, ...scarf, ...bodyA, ...feetA];
const run1: Grid = [e, ...head, ...scarf2, ...bodyB, ...feetB];
const stand: Grid = [e, ...head, ...scarf2, ...standBody, ...feetStand];
const blink: Grid = [e, ...head.slice(0, 3), '......kkkkkkkkkk......', ...head.slice(4), ...scarf2, ...standBody, ...feetStand];

const jump: Grid = [
  '......................',
  '......................',
  '......................',
  '........kkkkk.........',
  'k......kkkkkkk........',
  'kk....kkkkkkkkk.......',
  'kKk...kkkkkkwkkk......',
  '.kKk..kkkkkkkkkooo....',
  '.kkKk.kkyykkwwkoooo...',
  '..kkKkkkyykwwwwoo.....',
  '...kkrrrrrrrrrrr......',
  '....rRRRRRRRRRRR......',
  '...rR.kkkkwwwwwww.....',
  '..rR.kkkkwwwwwwbs.....',
  '..rR.kkkkwwwwwwwbs....',
  '...R.kkkkwwwwwwwbs....',
  '....kkkkwwwwwwwwbs....',
  '....kkkkwwwwwwwwbs....',
  '....kkkkbwwwwwwbbs....',
  '.....kkkbbwwwwbbs.....',
  '......kkkbbbbbbs......',
  '.......oo.oo..........',
];

// Flat on its back, feet up, seeing stars.
const dead: Grid = [
  e, e, e, e, e, e, e, e, e, e, e,
  '..........y.....y.....',
  '.........yyy...yyy....',
  '..........y..y..y.....',
  '.o..o.......yyy...oo..',
  '.oo.oo.......y...ooo..',
  '..oooo..bbbbbb...kook.',
  '...kbbbwwwwwwwbrrkkkkk',
  '..kbwwwwwwwwwwwrRkwkwk',
  '..kwwwwwwwwwwwwrRkkwkk',
  '.kKswwwwwwwwwwsrRkwkwk',
  'kKkkssssssssskkRRkkkk.',
];

// The belly slide: flat on the ice, flipper swept back, scarf streaming.
const duckA: Grid = [
  '..............................',
  '......rr...........kkkkkk.....',
  '....rrRRrrrr.....kkkkkkkkkk...',
  '..rRR.....rrrrrrkkkkkkkkwkkk..',
  '.........kkkkkkRRkkkkkkkkkkooo',
  '.oo...kkkkKKKKKkkkkkkkkkyykooo',
  '..ooookkkkkkkKKKKkkkkwwwwwwoo.',
  '...ookkbwwwwwwwwwwwwwwwwwwbk..',
  '.....kbbbwwwwwwwwwwwwwwwwbk...',
  '.......ssssssssssssssssss.....',
];
const duckB: Grid = [
  '..............................',
  '.......................kkkkkk.',
  '...rr.............kkkkkkkkkk..',
  '.rrRRrrrrr.....kkkkkkkkkwkkk..',
  '.........rrrrrrRRkkkkkkkkkkooo',
  '..o...kkkkkkKKKKKkkkkkkkyykooo',
  '.ooooookkkkkkkkKKKKkkwwwwwwoo.',
  '...ookkbwwwwwwwwwwwwwwwwwwbk..',
  '.....kbbbwwwwwwwwwwwwwwwwbk...',
  '.......ssssssssssssssssss.....',
];

// ---------------------------------------------------------------- obstacles

const shards: Grid = [
  '....i......',
  '....iD.....',
  '...iiD.....',
  '...iIDD.i..',
  '.i.iIIDiID.',
  '.iDiIIDiID.',
  'iiDiIIDiIDD',
  'iIDiIIDiIDD',
  'iIDiIIDiIID',
  'iIIDIIDiIID',
  'DDDDDDDDDDD',
];

// A pail of fish: one head-up, one tail-up.
const bucket: Grid = [
  '........D.D',
  '.DDD....DID',
  'DIwkD....I.',
  'DIIID....I.',
  '.DII.....I.',
  'kgggggggggk',
  '.krwrrrrRk.',
  '.krwrrrrRk.',
  '.krwrrrrRk.',
  '..krrrrRk..',
  '..kkkkkkk..',
];

// A snow drift with ice spikes poking out of it.
const drift: Grid = [
  '.....D.....',
  '....iD.....',
  '....iD.....',
  '....iID....',
  '.D..iID....',
  '.iD.iIDD...',
  '.iDwiIDDw..',
  '.wwwwwwwwbs',
  'wwwwwwwwwbs',
  'wwwwwwwwbbs',
  'swwwwwwbbss',
  '.sssssssss.',
];

const snowmanTop = [
  '....kkkkk......',
  '....kkkkk......',
  '...kkkkkkk.....',
  '....wwwww......',
  '...wwkwkws.....',
  '.oooowwwbs.....',
  '...swwwbs......',
  '....rrrrr......',
];
const snowmanBody = [
  '...wwwwwwb.....',
  '..wwwwkwwbs....',
  '..wwwwwwwbs....',
  '..wwwwkwwbs....',
  '...wwwwwbs.....',
  '..wwwwwwwbs....',
  '.wwwwwwwwwbs...',
  '.wwwwwwwwwbs...',
  '.wwwwwwwwwbs...',
  '.bwwwwwwwbbs...',
  '..sssssssss....',
];
const snowmanA: Grid = [
  ...snowmanTop.slice(0, 7),
  'n...rrrrr.....n',
  '.n.rrrrrrR...n.',
  '..nwwwwwrb..n..',
  ...snowmanBody.slice(1),
];
const snowmanB: Grid = [
  ...snowmanTop.slice(0, 7),
  '....rrrrr....n.',
  '...rrrrrrR...n.',
  'nnnwwwwwrbnnn..',
  ...snowmanBody.slice(1),
];

const blocks: Grid = [
  '..iiiiiiii...',
  '..iwwiiiiiD..',
  '..iwIIIIIIDD.',
  '..iIIIIIIIDD.',
  '..iIIIIIIIDD.',
  '..iIIIIIIIDD.',
  '..iIIIIIIIDD.',
  '..DDDDDDDDDD.',
  'iiiiiiiiiii..',
  'iwiiiiiiiiiD.',
  'iwIIIIIIIIIDD',
  'iIIIIIIIIIIDD',
  'iIIIIIIIwIIDD',
  'iIIIIIIIIIIDD',
  'iIIIIIIIIIIDD',
  'iIIIIIIIIIIDD',
  'iIIIIIIIIIIDD',
  'DDDDDDDDDDDDD',
];

const pillar: Grid = [
  '....i....',
  '...iiD...',
  '...iID...',
  '..iiIDD..',
  '..iwIDD..',
  '..iwIDD..',
  '..iIIDD..',
  '.iiIIIDD.',
  '.iwIIIDD.',
  '.iwIIIDD.',
  '.iIIIIDD.',
  '.iIIIIDD.',
  '.iIIIIDD.',
  'iiIIIIIDD',
  'iwIIIIIDD',
  'iwIIIIIDD',
  'iIIIIIIDD',
  'iIIIIIIDD',
  'iIIIIIIDD',
  'iIIIIIIDD',
  'DDDDDDDDD',
];

// ---------------------------------------------------------------- owl
// A snowy owl flying left, face turned to stare at you. 24 x 20; one broad
// wing beats from above the body to below it.

const owlUp: Grid = [
  '....................k...',
  '..................kkwk..',
  '................kkwwsk..',
  '..............kkwwwwsk..',
  '............kkwwwwwwsk..',
  '..........kkwwwwswwwsk..',
  '.........kwwwwwwwwwwsk..',
  '.........kwwwswwwwwwsk..',
  '..kkkkk..kwwwwwwwwwsk...',
  '.kwwwwwk.kwwwwwwwwsk....',
  'kwwwwwwwkkwwwwwwwsk.....',
  'kyyywyyykkkkkkkkkkkkk...',
  'kykywykywwwwwwwwwwwwwkk.',
  'kyyywyyywwwwswwwwwwwwwkk',
  'kwwwkwwwwwwwwwwwswwwkkk.',
  '.kwwwwwkkswwwwwwwwkkk...',
  '..kkkkk..kssssssskk.....',
  '........................',
  '........................',
  '........................',
];
const owlDown: Grid = [
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '..kkkkk.................',
  '.kwwwwwk................',
  'kwwwwwwwk...............',
  'kyyywyyykkkkkkkkkkkkk...',
  'kykywykywwwwwwwwwwwwwkk.',
  'kyyywyyywwwwswwwwwwwwwkk',
  'kwwwkwwwwwwwwwwwswwwkkk.',
  '.kwwwwwkkkwwwwwwwwkkk...',
  '..kkkkk..kwwwwwwwwwwsk..',
  '..........kwwwwswwwwsk..',
  '............kkwwwwwwsk..',
  '..............kkkkksk...',
];

// ---------------------------------------------------------------- decor

const cloudBig: Grid = [
  '...........wwww.................',
  '.........wwwwwwww.......wwww....',
  '....www.wwwwwwwwww....wwwwwwww..',
  '..wwwwwwwwwwwwwwwwww.wwwwwwwwww.',
  '.wwwwwwwwwwwwwwwwwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwbw',
  'bwwbwwwwwwbwwwwwwwwbwwwwwwbbbbbb',
  '.bbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.',
];
const cloudSmall: Grid = [
  '......wwww.......',
  '..www.wwwwww.....',
  '.wwwwwwwwwwwwww..',
  'wwwwwwwwwwwwwwwww',
  'bwwwwbwwwwwwbbbbb',
  '.bbbbbbbbbbbbbbb.',
];

export const polar: SkinDef = {
  id: 'polar',
  name: 'Polar Night',
  tagline: 'Waddle, slide, and never skip the scarf.',
  palette: {
    k: '#1c2438', // penguin black, outlines
    K: '#43527a', // black sheen
    w: '#ffffff',
    b: '#d3e4ef', // white shade
    s: '#8ea8c2', // white edge
    o: '#f28c28', // beak, feet, carrot
    y: '#ffd23f', // ear patch, owl eyes, dizzy stars
    r: '#d8343f', // scarf, pail
    R: '#8f1f2e', // scarf shade
    i: '#e2f5fc', // ice light
    I: '#9fd3ea', // ice mid
    D: '#4d8db6', // ice shadow
    n: '#6b4a33', // twigs
    g: '#8797ab', // pail handle
  },
  runner: {
    run: [run0, run1],
    jump,
    duck: [duckA, duckB],
    dead,
    idle: [stand, blink],
  },
  small: [[shards], [bucket], [drift]],
  large: [[snowmanA, snowmanB], [blocks], [pillar]],
  flyer: [owlUp, owlDown],
  decor: { sprites: [cloudBig, cloudSmall], y: [4, 30], speed: 0.12, every: [70, 200] },
  sky: { top: '#8ec9e6', bottom: '#dcf1f8' },
  celestial: { kind: 'sun', x: 0.6, y: 46, r: 8, color: '#fff7dc', accent: '#ffe6ad' },
  layers: [
    { kind: 'mountains', color: '#9dbfd6', accent: '#f4fbff', height: 30, speed: 0.12 },
    { kind: 'icebergs', color: '#e6f4fa', accent: '#bcd9e8', height: 14, speed: 0.35 },
  ],
  ground: { style: 'ice', color: '#bfe3f1', line: '#f6fdff', detail: '#86bdd8' },
  reflection: true,
  weather: { kind: 'snow', color: '#ffffff', density: 0.3 },
  night: {
    mode: 'tint',
    sky: { top: '#050a1e', bottom: '#15295a' },
    tint: '#14224e',
    amount: 0.44,
    glow: ['y'],
    stars: '#eef3ff',
    celestial: { kind: 'moon', x: 0.8, y: 16, r: 6, color: '#f2f4ff', accent: '#cdd5ea' },
    weather: { kind: 'snow', color: '#c9d6f0', density: 0.2 },
    aurora: ['#3fdc9c', '#b05ee6'],
    ink: '#dff4ff',
  },
  ink: '#1c2c48',
  sound: 'chime',
  gameOver: 'FROZEN SOLID',
  ui: { bg: '#0e1a33', fg: '#e3f3fb', accent: '#4dffa0' },
};
