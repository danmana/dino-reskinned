import type { Grid, SkinDef } from './types.ts';

// Goat Mode: a goat with a long tongue loose in cheerful suburbia.

// ---------------------------------------------------------------- runner
// Horns, head, beard, tongue and barrel are shared; only the legs change.
const top = [
  '.................ooo......',
  '................ohhho.....',
  '...............ohooho.....',
  '...............oo.ohho....',
  '..............oooowwwwo...',
  '.............oeeewwyowwwo.',
  '..............ooowwwwwwwwo',
  '................owwwwwwweo',
  '................owwwwooooo',
  '....oo..........oweeopp...',
  '...owo..........oweeoppo..',
  '...oo.ooooooooooowweo.ppo.',
  '.....owwwwwwwwwwwweeo..pp.',
  '....owwwwwwwwwwwwweo....o.',
  '....oewwwwwwwwwwwwo.......',
  '....oewwwwwwwwwwwwo.......',
  '.....oeewwwwwwwweeo.......',
  '......oeeeeeeeeeeo........',
];
const legsOut = [
  '.....wwo.ee.....eewwo.....',
  '....wwo...ee....ee.wwo....',
  '...wwo.....ee..ee...wwo...',
  '..ww.......ee..ee....ww...',
  '..oo.......oo..oo....oo...',
];
const legsPronk = [
  '......www.ee....ee.www....',
  '.......ww.ee....ee.ww.....',
  '.......ww.ee....ee.ww.....',
  '.......oo.oo....oo.oo.....',
  '..........................',
];
const legsTucked = [
  '....wwwwo.ee.....eewwww...',
  '..wwo......ee...ee...ww...',
  '..oo........o...o...ww....',
  '...................oo.....',
  '..........................',
];
const legsStand = [
  '......ww.ee.....ee.ww.....',
  '......ww.ee.....ee.ww.....',
  '......ww.ee.....ee.ww.....',
  '......ww.ee.....ee.ww.....',
  '......oo.oo.....oo.oo.....',
];
const runA: Grid = [...top, ...legsOut];
const runB: Grid = [...top, ...legsPronk];
const leap: Grid = [...top, ...legsTucked];
const stand: Grid = [...top, ...legsStand];
// Idle: a blink and a blep.
const wag: Grid = [
  ...top.slice(0, 5),
  '.............oeeewwooowwo.',
  ...top.slice(6, 9),
  '....oo..........oweeopppp.',
  '...owo..........oweeoopppp',
  '...oo.ooooooooooowweo.oooo',
  '.....owwwwwwwwwwwweeo.....',
  '....owwwwwwwwwwwwweo......',
  ...top.slice(14),
  ...legsStand,
];

// Ragdoll: flat on its back, legs in the air, head flopped back, X eyes.
const ragdoll: Grid = [
  '..........................',
  '..........................',
  '..........................',
  '..........................',
  '..........................',
  '..........................',
  '..........................',
  '..........................',
  '..........................',
  '.oo....oo..oo....oo.......',
  '..ww...ee..ee...ww........',
  '..ww...ee..ee...ww....pp..',
  '...ww..ee..ee..ww....pppo.',
  '...ww..ee..ee..ww....pp...',
  '....ww.ee..ee.wwowwwwpoooo',
  '....ww.ee..ee.wwowwwwwwweo',
  '....oeeeeeeeeeooowowowwwwo',
  '...oeewwwwwwwoeeewwowwwwo.',
  '..oewwwwwwwwwwooooowowo...',
  '.ooewwwwwwwwwwwoo.ohho....',
  '.owowwwwwwwwwwwohooho.....',
  '..oowwwwwwwwwwwoohhho.....',
  '....ooooooooooo..ooo......',
];

// Belly to the lawn, head down, horns first: ready to headbutt.
const crouchTop = [
  '...................ooo......',
  '...oo.............ohhho.....',
  '..owo............ohooho.....',
  '..oo.ooooooooooo.oo.ohho....',
  '....owwwwwwwwwwwoooowwwwo...',
  '...owwwwwwwwwwwoeeewwyowwwo.',
  '...oewwwwwwwwwwwooowwwwwwwwo',
  '...oewwwwwwwwwwwwoowwwwwwweo',
  '....oeewwwwwwwweeoowwwwooooo',
  '.....oeeeeeeeeeeo.oeeoppo...',
];
const crouchA: Grid = [
  ...crouchTop,
  '....wwo.ee...ee.ww.oeo.pp...',
  '...oo....oo..oo..oo.o...p...',
];
const crouchB: Grid = [
  ...crouchTop,
  '.....wweee..eeww...oeo.pp...',
  '.....oo..oo.oo.oo...o...p...',
];

// ---------------------------------------------------------------- small
const gnome: Grid = [
  '...o....',
  '..orw...',
  '..orro..',
  '.orrrro.',
  '.orrrro.',
  'oooooooo',
  '.ossso..',
  '.owwwwo.',
  'owwwwwwo',
  'obwwwwbo',
  'obbwwbbo',
  '.obbbbo.',
  '.onoono.',
  'oonooono',
];
const gasCan: Grid = [
  '.......oo.',
  '......oYo.',
  '.oooo.omo.',
  '.o..ooomoo',
  'orrrrrrrro',
  'orprrrrrro',
  'orprrrrrro',
  'orrrrrrrro',
  'orrrrrrrro',
  'orrrrrrrro',
  '.oooooooo.',
];
const cone: Grid = [
  '....oo....',
  '....cco...',
  '...occo...',
  '...owwo...',
  '..owwwwo..',
  '..occcco..',
  '..occcco..',
  '.owwwwwwo.',
  '.occccccco',
  '.occccccco',
  'oooooooooo',
];

// ---------------------------------------------------------------- large
const bale = [
  'oooooooooooo',
  'oYYHYYYYHYYo',
  'oHYYYYHYYYHo',
  'onnYYHYYYnno',
  'oYYHYYYYHYYo',
  'oHYYYHYYYYHo',
  'oooooooooooo',
];
const haystack: Grid = [
  '..Y..Y.YY.Y.',
  ...bale,
  ...bale,
  ...bale,
];
const mailbox: Grid = [
  '..........oo.',
  '.oooooooo.or.',
  'ommmmmmmmoor.',
  'ommmmmmmmmoo.',
  'ommommmmmmo..',
  'ommmmmmmmmo..',
  'oooooooooooo.',
  '.....nn......',
  '.....nn......',
  '.....nn......',
  '.....nn......',
  '.....nn......',
  '.....nn......',
  '.....nn......',
  '.....nn......',
  '.....nn......',
  '.....nn......',
  '.....nn......',
  '.....nn......',
  '.....nn......',
  '....onno.....',
];
const farmer: Grid = [
  '....oooo.....',
  '...oYYYYo....',
  '.ooooooooooo.',
  '...ossss.....',
  '...osossm....',
  '...ossss.m...',
  '....nnno.m...',
  '..orrbbrro.m.',
  '.orrbbbbrrom.',
  '.osrbbbbrsom.',
  '.osobbbbosomm',
  '...obbbbo..m.',
  '...obbbbo..m.',
  '...obbobbo.m.',
  '...obbobbo.m.',
  '...obboobbom.',
  '...obbo.bbom.',
  '...obbo.obbm.',
  '...obbo.obbo.',
  '..onno..onno.',
  '..nnnn..nnnn.',
];

// ---------------------------------------------------------------- flyer
// A second goat, launched and spinning end over end. Drawn facing right,
// then mirrored so it flies at the runner; the second frame is it upside down.
const flung: Grid = [
  '................ooo......',
  '...............ohhho.....',
  '..............ohooho.....',
  '..............oo.ohho....',
  '.............oooowwwwo...',
  '..oo........oeeewwyowwwo.',
  '.owo.........ooowwwwwwwwo',
  '.oo.oooooooooooowwwwwwweo',
  '...owwwwwwwwwwwowwwwooooo',
  '..owwwwwwwwwwwwoeeopp....',
  '..oewwwwwwwwwwwwoeo.pp...',
  '..oewwwwwwwwwwwwoo...p...',
  '...oeewwwwwwwweeo........',
  '..wwoeeeeeeeeeeeoww......',
  '.wwo...ee....ee...oww....',
  'wwo.....ee..ee.....oww...',
  'oo.......oooo.......oo...',
];
const mirror = (g: Grid): Grid => g.map((r) => r.split('').reverse().join(''));
const flungL = mirror(flung);
const flungFlip: Grid = [...flungL].reverse();

// ---------------------------------------------------------------- decor
const puff: Grid = [
  '.........wwww.............',
  '.......wwwwwwww...wwww....',
  '...ww.wwwwwwwwwwwwwwwwww..',
  '..wwwwwwwwwwwwwwwwwwwwwww.',
  '.wwwwwwwwwwwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwwwwwwwwwwwwu',
  '.uwwwwwwwwwwwwwwwwwwwwwuu.',
  '..uuuuwwwwwwwwwwwwwuuuu...',
  '......uuuuuuuuuuuuu.......',
];
const puffSmall: Grid = [
  '.....www.......',
  '...wwwwwww.ww..',
  '.wwwwwwwwwwwww.',
  'wwwwwwwwwwwwwwu',
  '.uuwwwwwwwwwuu.',
  '...uuuuuuuuu...',
];
const puffTall: Grid = [
  '.......www.........',
  '.....wwwwwww.......',
  '..ww.wwwwwwww.ww...',
  '.wwwwwwwwwwwwwwwww.',
  'wwwwwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwwwwwu',
  '.uwwwwwwwwwwwwwwuu.',
  '...uuuuuuuuuuuuu...',
];

// ---------------------------------------------------------------- export
export const goat: SkinDef = {
  id: 'goat',
  name: 'Goat Mode',
  tagline: 'Headbutt first. Ask questions never.',
  palette: {
    o: '#2b2a33', // outline, hooves, pupils
    w: '#f6f3ea', // goat
    e: '#c8c2b4', // goat shade
    h: '#8a7358', // horns
    y: '#f2c230', // goat eye
    p: '#f07a9a', // tongue
    r: '#d8363a', // red
    b: '#3d6fb6', // blue
    s: '#f2c49a', // skin
    Y: '#ebcb5e', // hay
    H: '#c49a36', // hay shade
    n: '#8a5a36', // wood
    m: '#a3adb8', // metal
    c: '#f47b2a', // cone orange
    u: '#cfe0f0', // cloud shade
  },
  runner: {
    run: [runA, runB],
    jump: leap,
    duck: [crouchA, crouchB],
    dead: ragdoll,
    idle: [stand, wag],
  },
  small: [[gnome], [gasCan], [cone]],
  large: [[haystack], [mailbox], [farmer]],
  flyer: [flungL, flungFlip],
  decor: { sprites: [puff, puffSmall, puffTall], y: [6, 30], speed: 0.15, every: [60, 180] },
  sky: { top: '#5fb4f0', bottom: '#c8ecff' },
  celestial: { kind: 'sun', x: 0.2, y: 18, r: 9, color: '#fff4a8', accent: '#ffe066' },
  layers: [
    { kind: 'hills', color: '#8fd46a', accent: '#a8e27e', height: 24, speed: 0.1 },
    { kind: 'houses', color: '#8aa6c8', accent: '#fff1a0', height: 18, speed: 0.25, glow: true },
    { kind: 'fence', color: '#a8744a', accent: '#8a5a36', height: 8, speed: 0.5 },
  ],
  ground: { style: 'grass', color: '#7cc55a', line: '#4e9d3c', detail: '#5fae48' },
  night: {
    mode: 'tint',
    sky: { top: '#0f1a3a', bottom: '#3a4f86' },
    tint: '#1d2a50',
    amount: 0.45,
    glow: ['y'],
    stars: '#ffffff',
    celestial: { kind: 'moon', x: 0.8, y: 20, r: 7, color: '#f4f1dc', accent: '#d8d4c0' },
    weather: { kind: 'fireflies', color: '#fff27a', density: 0.3 },
    ink: '#f4f1dc',
  },
  ink: '#23405e',
  sound: 'bleat',
  gameOver: 'BAAAAAAH!',
  ui: { bg: '#eaf6ff', fg: '#1f3550', accent: '#ef6a8a' },
};
