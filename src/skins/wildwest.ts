import type { Grid, SkinDef } from './types.ts';

// Wild West: a cowboy on a galloping chestnut under a big low sun.

// ---------------------------------------------------------------- runner
// Rider and horse share rows 0-10; the body (11-16) carries the rider's leg.
const rider = [
  '............ooo.............',
  '...........onnno............',
  '.........ooooooooo..........',
  '............nsos....oo......',
  '............nssss..ohho.....',
  '.............sss..oohhhoo...',
  '...........rrrrr.oohhohhhoo.',
  '..........rnnnbbbbohhhhhhHHo',
  '...........nnnnbbbsohhhoooHo',
  '...........nnkn..ohhhhho.o..',
  '..........ttbbbt.ohhhhhho...',
];
// Body with the tail streaming out behind (galloping).
const body = [
  '...oooooooottbbbbhhhhhhho...',
  '.ooo..ohHHhhhhhbbbhhhhhhho..',
  'oo...ohHhhhhhhhbbhhhhhhhho..',
  'o....ohhhhhhhhhbbhhhhhhhho..',
  '......ohhhhhhhooohhhhhhho...',
  '.......ohhhhhhhhhhhhhhho....',
];
// Body with the tail hanging (standing still).
const bodyStill = [
  '......ooooottbbbbhhhhhhho...',
  '.....oohHHhhhhhbbbhhhhhhho..',
  '....oohHhhhhhhhbbhhhhhhhho..',
  '....oohhhhhhhhhbbhhhhhhhho..',
  '....o.ohhhhhhhooohhhhhhho...',
  '....o..ohhhhhhhhhhhhhhho....',
];
const bodyFlick = [
  '......ooooottbbbbhhhhhhho...',
  '....ooohHHhhhhhbbbhhhhhhho..',
  '...o.ohHhhhhhhhbbhhhhhhhho..',
  '..o..ohhhhhhhhhbbhhhhhhhho..',
  '..o...ohhhhhhhooohhhhhhho...',
  '...o...ohhhhhhhhhhhhhhho....',
];
// Legs: extended (near legs reach), gathered (legs bunched under), tucked, standing.
const legsOut = [
  '.......hhh.nn.......nnhhh...',
  '......hhh...nn......nn.hhh..',
  '.....hhh.....nn....nn...hhh.',
  '....hhh......nn....nn....hh.',
  '...hh........nn...nn.....hh.',
  '..hh.........nn...nn.....oo.',
  '.oo..........oo...oo........',
];
const legsIn = [
  '.......hhh.nn......nn.hhh...',
  '........hhh.nn.....nn..hhh..',
  '.........hhh.nn...nn....hh..',
  '..........hh..nn.nn....hh...',
  '...........hh..nnn....hh....',
  '...........oo...oo...oo.....',
  '............................',
];
const legsTucked = [
  '...hhhhh..nn........nnhhhh..',
  '.hhh.......nn......nn...hhh.',
  'oo..........oo.....oo...hh..',
  '......................oo....',
  '............................',
  '............................',
  '............................',
];
const legsStand = [
  '....o..hhhnn.......nnhhh....',
  '....oo.hhhnn.......nn.hh....',
  '........hh.nn......nn.hh....',
  '........hh.nn......nn.hh....',
  '.......hh.nn.......nn.hh....',
  '.......hh.nn.......nn.hh....',
  '.......oo.oo.......oo.oo....',
];
const legsStandFlick = [
  '.......hhhnn.......nnhhh....',
  '.......hhhnn.......nn.hh....',
  '........hh.nn......nn.hh....',
  '........hh.nn......nn.hh....',
  '.......hh.nn.......nn.hh....',
  '.......hh.nn.......nn.hh....',
  '.......oo.oo.......oo.oo....',
];
const gallopA: Grid = [...rider, ...body, ...legsOut];
const gallopB: Grid = [...rider, ...body, ...legsIn];
const leap: Grid = [...rider, ...body, ...legsTucked];
const stand: Grid = [...rider, ...bodyStill, ...legsStand];
const flick: Grid = [...rider, ...bodyFlick, ...legsStandFlick];

// Thrown: the rider flips through the air, hat sailing off, while the horse
// sits down hard, dazed, tongue out, seeing stars.
const thrown: Grid = [
  '.................ooo........',
  '................onnno.......',
  '..............ooooooooo.....',
  '...oo..oo...................',
  '....bb.bb...................',
  '.....bbb..............k.....',
  '..b..nkn..b......k.......k..',
  '...bbnnnbb..................',
  '.....rrr..........oo........',
  '.....sss.........ohho.......',
  '....ssoss.......oohhhoo.....',
  '.....nnn.......oohhhhhhoo...',
  '...............ohhhohhhHHo..',
  '..............ohhhhhoooHHo..',
  '.............ohhhhho.oorro..',
  '............ohhhhhho...rr...',
  '..........ootthhhhho........',
  '........oohtttHhhhho........',
  '......oohHhhhhhhhhhho.......',
  '....oohHhhhhhhhhhhhhho......',
  '...ohhhhhhhhhhhhhhhhho......',
  '..ohhhhhhhhhhhhhhnhhhho.....',
  '.ohhhhhhhhhhhhhhonn.hh......',
  'oooooooooooooooo.oo.oo......',
];

// Belly to the dirt: the horse stretches flat out, the rider lies along its
// neck and the hat is pulled down low.
const lowTop = [
  '..................ooo.........',
  '................ooooooo..oo...',
  '...........bbbnnnnrsss..ohho..',
  '.........tbbbbnnnbbbbsohhohho.',
  '..oo.oooohhhhhhhhhhhhhhhhhHHo.',
  '.o.ohHHhhhhhhhhhhhhhhhhooooHo.',
  'o..ohhhhhhhhhhhhhhhhhhho......',
  '...ohhhhhhhhhhhhhhhhhho.......',
  '....ohhhhhhhhhhhhhhhho........',
];
const lowA: Grid = [
  ...lowTop,
  '....hhh..nn......nn.hhh.......',
  '..hhh...nn........nn..hhh.....',
  'oo.....oo..........oo...oo....',
];
const lowB: Grid = [
  ...lowTop,
  '.....hhh..nn....nn..hhh.......',
  '....hhh.....nn.nn....hhh......',
  '...oo.......oooo......oo......',
];
// ---------------------------------------------------------------- small
// Tumbleweed: one square tangle turned a quarter each frame; odd frames sit a
// row higher so it hops as it rolls.
const weed = [
  '...HHHnn..',
  '.nHn...tHH',
  '.Hn.tHH.nH',
  'H.Hn..H.tH',
  'H.n.tn.H.H',
  'Ht.H.n.n.H',
  'Hn.H..nH.H',
  '.H..HHt.nH',
  '.HHt...nH.',
  '...nnHHH..',
];
const rotL = (g: Grid): Grid => g[0].split('').map((_, x) => g.map((row) => row[row.length - 1 - x]).join(''));
const gap = '.'.repeat(weed.length);
const weedFrames: Grid[] = [weed, rotL(weed), rotL(rotL(weed)), rotL(rotL(rotL(weed)))].map((g, i) =>
  i % 2 ? [...g, gap] : [gap, ...g],
);

const barrel: Grid = [
  '..ooooo..',
  '.oHHhnho.',
  '.ooooooo.',
  'oHHhnhhno',
  'oHHhnhhno',
  'oHHhnhhno',
  'ooooooooo',
  'oHHhnhhno',
  'oHHhnhhno',
  '.ooooooo.',
  '.oHHhnho.',
  '..ooooo..',
];

const skullRock: Grid = [
  'w.........w',
  'wt.......tw',
  '.wt.....tw.',
  '.wwtwwwtww.',
  '..wwwwwwt..',
  '..oowwoot..',
  '..owwwwot..',
  '...wwwwt...',
  '...wwwwt...',
  '...wowot...',
  '....wwt....',
  '...ottttHo.',
  '.otttHHHHHo',
  'oHHHHHHHnno',
];

// ---------------------------------------------------------------- large
const saguaro: Grid = [
  '.....GGG.....',
  '....GgllG....',
  '....GgllG....',
  '....GgllG....',
  '....GglgG....',
  '....GglgG.GG.',
  '.GG.GglgGGglG',
  'GglGGglgGGglG',
  'GglGGglgGGglG',
  'GglGGglgGGglG',
  'GglGGglgGgglG',
  'GglGGglggglG.',
  'GgllgglgGGG..',
  '.GggggglG....',
  '..GGGglgG....',
  '....GglgG....',
  '....GglgG....',
  '....GglgG....',
  '....GglgG....',
  '....GglgG....',
  '....GglgG....',
  '....GglgG....',
  '....GglgG....',
  '....GglgG....',
  '...GGglgGG...',
];

const wanted: Grid = [
  '.ooooooooooo.',
  '.owwwwnwwwwo.',
  '.orrrrrrrrwo.',
  '.owwwwwwwwwo.',
  '.owwwnnnwwwo.',
  '.owwnnnnnwwo.',
  '.owwwsssswwo.',
  '.owwwsosswwo.',
  '.owwwoooowwo.',
  '.owwwwwwwwwo.',
  '.owkkwkkwkwo.',
  '.owwwwwwwwo..',
  '.ooooohooooo.',
  '.....hn......',
  '.....hn......',
  '.....hn......',
  '.....hn......',
  '.....hn......',
  '.....hn......',
  '.....hn......',
  '.....hn......',
  '.....hn......',
  '.....hn......',
  '....ohno.....',
];

const signpost: Grid = [
  '.....on......',
  'oHHHHHHHHHo..',
  'HoHoHHoHoHHo.',
  'oHHHHHHHHHo..',
  '.....hn......',
  '..oHHHHHHHHHo',
  '.oHHoHHoHoHHH',
  '..oHHHHHHHHHo',
  '.....hn......',
  '.....hn......',
  '.oHHHHHHHHo..',
  'oHoHHoHoHHHo.',
  '.oHHHHHHHHo..',
  '.....hn......',
  '.....hn......',
  '.....hn......',
  '.....hn......',
  '.....hn......',
  '.....hn......',
  '.....hn......',
  '.....hn......',
  '.....hn......',
  '.....hn......',
  '....ohno.....',
];

// ---------------------------------------------------------------- flyer
// A bald eagle, flying left. Body rows 9-12 are shared.
const eagleBody = [
  'kkwowwwnnnnnnnnnnnnoow..',
  '.kkwwwnnnnnnnnnnnnnnwwww',
  '....wwnnnnnnnnnnnnnwwww.',
  '......onnnnnnnnnnoww....',
];
const eagleUp: Grid = [
  '..........o.o.o.o.......',
  '.........onononon.......',
  '.........onnnnnnno......',
  '........onnhhhhnno......',
  '........onhhhhhnno......',
  '.......onhhhhhhno.......',
  '.......onhhhhhno........',
  '..wwo..onhhhhno.........',
  '.kwwwwoonhhhnno.........',
  ...eagleBody,
  '........kk...kk.........',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
];
const eagleDown: Grid = [
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '..wwo...................',
  '.kwwwwo.................',
  eagleBody[0],
  eagleBody[1],
  '....wwnnhhhhhhhnnnnwwww.',
  '......onhhhhhhhhnnoww...',
  '.......onhhhhhhhhno.....',
  '.........onhhhhhhno.....',
  '..........onhhhhhno.....',
  '...........onnnnnno.....',
  '...........nonononn.....',
  '...........o.o.o.o......',
];

// ---------------------------------------------------------------- decor
const wisp: Grid = [
  '.............wwwwwww....................',
  '.......wwwwwwwwwwwwwwwwwww..............',
  '...tttttttwwwwwwwwwwwwwwwwwwwwww........',
  '..............ttttttttttwwwwwwwwwwww....',
  '.........................ttttttttttt....',
];
const wispSmall: Grid = [
  '........wwwwww.........',
  '...wwwwwwwwwwwwwwww....',
  'ttttttttttwwwwwwwwwwww.',
  '.............tttttttt..',
];
const vultures: Grid = [
  '.............nn...nn.',
  '..............nnnnn..',
  '................n....',
  '.....................',
  'oo...oo..............',
  '.ooooo...............',
  '...o.................',
];

// ---------------------------------------------------------------- far sprites
// Distant scenery in one hazy tone so it never reads as an obstacle.
const farCactus: Grid = [
  '..d..',
  '..d.d',
  'd.ddd',
  'ddd..',
  '..d..',
  '..d..',
];
const farCactusTall: Grid = [
  '...d...',
  '..ddd..',
  '..ddd.d',
  'd.ddd.d',
  'd.ddddd',
  'ddddd..',
  '..ddd..',
  '..ddd..',
  '..ddd..',
];
const windmill: Grid = [
  '..d.d.d....',
  '...ddd.....',
  '.ddddddddd.',
  '...ddd..dd.',
  '..d.d.d....',
  '....d......',
  '...ddd.....',
  '...d.d.....',
  '...ddd.....',
  '..d...d....',
  '..ddddd....',
  '..d...d....',
  '.d.....d...',
  '.ddddddd...',
];
const shack: Grid = [
  '...ddddddd..',
  '..ddddddddd.',
  '.ddddddddddd',
  '..dFddddFd..',
  '..dFddddFd..',
  '..ddddnndd..',
  '..ddddnndd..',
];
const campfire: Grid = [
  '...F...',
  '..fFf..',
  '.ffFff.',
  '..fff..',
  'ddnnndd',
];

// ---------------------------------------------------------------- export
export const wildwest: SkinDef = {
  id: 'wildwest',
  name: 'Wild West',
  tagline: 'Saddle up, partner. The desert does not wait.',
  palette: {
    o: '#2a170e', // outline, mane, hooves
    n: '#5a3320', // dark leather, hat, far legs
    h: '#8c4f2a', // chestnut
    H: '#b8733f', // chestnut highlight
    t: '#e0b070', // tan
    r: '#c8352a', // bandana red
    b: '#3e5f8a', // denim
    s: '#f2c08e', // skin
    w: '#fbf0d6', // bone / cream
    g: '#5e8c3a', // cactus
    G: '#3b5f28', // cactus shade
    k: '#f0b43a', // gold
    f: '#ff7b2a', // flame
    F: '#ffe070', // flame core
    l: '#8cb65a', // cactus highlight
    d: '#cf8655', // distant haze
  },
  runner: {
    run: [gallopA, gallopB],
    jump: leap,
    duck: [lowA, lowB],
    dead: thrown,
    idle: [stand, flick],
  },
  small: [weedFrames, [barrel], [skullRock]],
  large: [[saguaro], [wanted], [signpost]],
  flyer: [eagleUp, eagleDown],
  decor: { sprites: [wisp, wispSmall, vultures], y: [6, 34], speed: 0.12, every: [70, 220] },
  sky: { top: '#eb9a5c', bottom: '#fcdca8' },
  celestial: { kind: 'sun', x: 0.7, y: 50, r: 13, color: '#fff3cf', accent: '#fde0a0' },
  layers: [
    { kind: 'mesas', color: '#dd8a66', accent: '#d27d5b', height: 32, speed: 0.06 },
    { kind: 'mesas', color: '#c0603f', accent: '#ad5236', height: 20, speed: 0.14, seed: 41 },
    { kind: 'dunes', color: '#e3a262', accent: '#f0bd7e', height: 10, speed: 0.3 },
    { kind: 'sprites', sprites: [farCactus, windmill, farCactusTall, shack, campfire, farCactus, farCactusTall], speed: 0.45, gap: [24, 90] },
  ],
  ground: { style: 'sand', color: '#e8b574', line: '#b97a45', detail: '#c98f55' },
  weather: { kind: 'dust', color: '#e9c08c', density: 0.3 },
  night: {
    mode: 'tint',
    sky: { top: '#231a3e', bottom: '#7a4a72' },
    tint: '#35264f',
    amount: 0.42,
    glow: ['f', 'F'],
    stars: '#fff3d6',
    celestial: { kind: 'crescent', x: 0.76, y: 22, r: 7, color: '#fff0c8' },
    ink: '#fbdcaa',
  },
  ink: '#5a2e1a',
  sound: 'twang',
  gameOver: 'BITE THE DUST',
  ui: { bg: '#f3dfb6', fg: '#3b2314', accent: '#b5502e' },
};
