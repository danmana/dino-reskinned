import type { Grid, SkinDef } from './types.ts';

// Sugar Rush: a gingerbread man legging it through candy land. The world is
// pastel, so every sprite carries a dark plum-brown outline to stay crisp on
// the pink-and-cream sky. At night ("midnight snack") the cherries, sugar
// crystals and sprinkles keep glowing.

// ------------------------------------------------------------ gingerbread man
// 22x23. The head never moves between frames; arms swing beside it, so only
// its top rows can be shared. Run frame B sits 1 px higher than A (a bob).
const blank = '......................';
const face = [
  '........oooo..........',
  '......oohhggoo........',
  '.....ohhggggggo.......',
  '.....ohggoggogo.......',
  '.....ogggoggogo.......',
  '.....oggwgggwgo.......',
  '.....ogggwwwggo.......',
  '......ooggggoo........',
];
const crown = face.slice(0, 5);
// Both arms swung down, legs planted: standing, blinking and bitten.
const restingBody = [
  '.......oggggo.........',
  '.....oohgggggoo.......',
  '....ogghgrrggggo......',
  '...oggghggggggggo.....',
  '.oowgoohgggggoogwoo...',
  'oggwo.ohgmmggo.owggo..',
  'oggo..ohgggggo..oggo..',
  '.oo...oggggggo...oo...',
  '......oggooggo........',
  '.....oggo..oggo.......',
  '.....oggo..oggo.......',
  '.....owwo..owwo.......',
  '....ogggo..ogggo......',
  '.....ooo....ooo.......',
];

const runA: Grid = [
  blank,
  ...crown,
  '.....oggwgggwgo..oo...',
  '.....ogggwwwggo.oggo..',
  '......ooggggoo.owggo..',
  '.......oggggooogwoo...',
  '.....oohggggggggo.....',
  '....ogghgrrggggo......',
  '...oggghgggggoo.......',
  '.oowgoohgggggo........',
  'oggwo.ohgmmggo........',
  'oggo..ohgggggo........',
  '.oo...oggggggo........',
  '......oggooggo........',
  '.....oggo..oggo.......',
  '....owwo....owwo......',
  '...oggo......oggo.....',
  '..ogggo......ogggo....',
  '...ooo........ooo.....',
];
const runB: Grid = [
  ...crown,
  '.oo..oggwgggwgo.......',
  'oggo.ogggwwwggo.......',
  'oggwo.ooggggoo........',
  '.oowgoooggggo.........',
  '...oggghgggggoo.......',
  '....ogghgrrggggo......',
  '.....oohggggggggo.....',
  '......ohgggggoogwoo...',
  '......ohgmmggo.owggo..',
  '......ohgggggo..oggo..',
  '......oggggggo...oo...',
  '......oggooggo........',
  '......oggo.oggo.......',
  '......oggo.owwo.......',
  '......owwoogggo.......',
  '......oggo.ooo........',
  '......ogggo...........',
  '.......ooo............',
];
// Arms up, legs dangling.
const jump: Grid = [
  ...crown,
  '.oo..oggwgggwgo..oo...',
  'oggo.ogggwwwggo.oggo..',
  'oggwo.ooggggoo.owggo..',
  '.oowgoooggggooogwoo...',
  '...oggghggggggggo.....',
  '....ogghgrrggggo......',
  '.....oohgggggoo.......',
  '......ohgggggo........',
  '......ohgmmggo........',
  '......ohgggggo........',
  '......oggggggo........',
  '......oggooggo........',
  '.....oggo..oggo.......',
  '.....owwo..owwo.......',
  '....oggo....oggo......',
  '....ooo......ooo......',
  blank,
  blank,
];
const stand: Grid = [blank, ...face, ...restingBody];
const blink: Grid = [blank, ...face.slice(0, 3), '.....ohgggggggo.......', ...face.slice(4), ...restingBody];
// Someone took a bite out of his head. Crumbs still in the air.
const dead: Grid = [
  '.................g....',
  '........oo.....g......',
  '......ooho............',
  '.....ohhgho...g..g....',
  '.....ohggghoo.........',
  '.....oggoggohoo.......',
  '.....oggoggoggo.......',
  '.....oggggggggo.......',
  '......oogoogoo........',
  ...restingBody,
];

// Belly slide, head up, feet kicking in the air.
const slideBody = [
  '..oggggghhhhhhhooggggoo...',
  '..ogggggggrrggmmggggggo...',
  '..ogggggggggggggggggggo...',
  '...oooooooooooooooooo.....',
];
const duckA: Grid = [
  '.....oooo........oooo.....',
  '.....oggo......oohhggoo...',
  '.oo..owwo.....ohhggggggo..',
  'oggo.oggo.....ohggoggogo..',
  'owwo.oggo.....ogggoggogo..',
  '.oggooggo.....oggwgggwgo..',
  '..oggoggooooooogggwwwggo..',
  ...slideBody,
];
const duckB: Grid = [
  '.oo..............oooo.....',
  'owwo...........oohhggoo...',
  'oggo.oooo.....ohhggggggo..',
  '.oggooggo.....ohggoggogo..',
  '..oggowwo.....ogggoggogo..',
  '...oggggo.....oggwgggwgo..',
  '...oggggoooooogggwwwggo...',
  ...slideBody,
];

// ------------------------------------------------------------ small sweets
const gumdrop: Grid = [
  '....ooo....',
  '...owwro...',
  '..owrsrdo..',
  '..orrrrdo..',
  '.orsrrrrdo.',
  '.orrrrsrdo.',
  '.orrsrrrdo.',
  'orrrrrrsrdo',
  'orsrrrrrrdo',
  'oddrrrrrddo',
  '.ooooooooo.',
];
const cupcake: Grid = [
  '.......o...',
  '......o....',
  '....ooo....',
  '...oeweo...',
  '...oeeeo...',
  '..ooooooo..',
  '.oppwppppo.',
  '.okkppwpko.',
  'oppwppppppo',
  'okkkppkkkko',
  'oppppwppppo',
  'ooooooooooo',
  '.omnmnmnmo.',
  '.omnmnmnmo.',
  '..omnmnmo..',
  '..ooooooo..',
];
const sweet: Grid = [
  'oo.......oo',
  'opo.ooo.opo',
  'opkoyywyokp',
  'opoyyryyopo',
  'oporyyyropo',
  'opoyyyryopo',
  'opkoyryokpo',
  'opo.ooo.opo',
  'oo.......oo',
];

// ------------------------------------------------------------ large sweets
const caneStripes = ['......orrwo', '......orwwo', '......owwro', '......owrro'];
const cane: Grid = [
  '...ooooo...',
  '..orrwwro..',
  '.owrrwwrro.',
  'owwro.orrwo',
  'orrwo.owwro',
  'owrro.orrwo',
  '.ooo..owwro',
  ...caneStripes,
  ...caneStripes,
  ...caneStripes,
  ...caneStripes,
  ...caneStripes.slice(0, 2),
];
// Two swirl phases: the lollipop spins.
const stick = Array(11).fill('.....owo.....');
const lollipop: Grid = [
  '.....ooo.....',
  '...oowwpoo...',
  '..owwwwwwpo..',
  '.owppppwwwpo.',
  '.opppwppwwpo.',
  'owppwwwppwppo',
  'oppwwpppwwppo',
  'oppwppwwwppwo',
  '.opwwppwpppo.',
  '.opwwwppppwo.',
  '..opwwwwwwo..',
  '...oopwwoo...',
  '.....ooo.....',
  ...stick,
];
const lollipop2: Grid = [
  '.....ooo.....',
  '...ooppwoo...',
  '..oppppppwo..',
  '.opwwwwpppwo.',
  '.owwwpwwppwo.',
  'opwwpppwwpwwo',
  'owwppwwwppwwo',
  'owwpwwpppwwpo',
  '.owppwwpwwwo.',
  '.owpppwwwwpo.',
  '..owppppppo..',
  '...oowppoo...',
  '.....ooo.....',
  ...stick,
];
// Lemon, blackcurrant, strawberry and pistachio, slightly wonky.
const macarons: Grid = [
  '...ooooooooo..',
  '..owyyyyyyyyo.',
  '.oyyyyyyyyyyyo',
  '.owwwwwwwwwwwo',
  '.ohhhhhhhhhhho',
  '..ooooooooooo.',
  '.owbbbbbbbbo..',
  'obbbbbbbbbbbo.',
  'owwwwwwwwwwwo.',
  'olllllllllllo.',
  '.ooooooooooo..',
  '..owppppppppo.',
  '.opppppppppppo',
  '.owwwwwwwwwwwo',
  '.okkkkkkkkkkko',
  '..ooooooooooo.',
  '.owmmmmmmmmo..',
  'ommmmmmmmmmmo.',
  'owwwwwwwwwwwo.',
  'onnnnnnnnnnno.',
  '.ooooooooooo..',
];

// ------------------------------------------------------------ flying donut
// Faces left; the wing trails behind. Sprinkles e/s glow at night.
const donutBottom = [
  '..oogggggggoo..........',
  '....oooooooo...........',
];
const donutUp: Grid = [
  '...............ooo.....',
  '.............oowwo.....',
  '............owwwpo.....',
  '...........owwwpwo.....',
  '..........owwwpwpo.....',
  '.........owwwpwpo......',
  '........owwwwpoo.......',
  '.....ooooooooo.........',
  '...ooppwppppoo.........',
  '..opepppsppbppo........',
  '.opmpppoooopppko.......',
  '.opppso....ospko.......',
  'oggppgoooooopgmo.......',
  'ogggpggggggpghgo.......',
  '.oggggggggggggo........',
  ...donutBottom,
];
const donutDown: Grid = [
  ...Array(7).fill('.......................'),
  '.....oooooo............',
  '...ooppwppppoo.........',
  '..opepppsppboooooo.....',
  '.opmpppoooopowwwwwoo...',
  '.opppso....osowwwwwwoo.',
  'oggppgoooooopgopwwpwwwo',
  'ogggpggggggpghgopwpwppo',
  '.oggggggggggggo.oopoo..',
  ...donutBottom,
];

// ------------------------------------------------------------ cotton candy
const cloud: Grid = [
  '..........ccc.............',
  '......cccpppcc....ccc.....',
  '....ccppppppppc..cppcc....',
  '..ccpppcppppppppcpppppc...',
  '.cpppppppppppppppppppppc..',
  'cppppppppppppppppppppppppc',
  'cpppkpppppppppkpppppppkppc',
  '.kppppkkkppppppkkkpppppkk.',
  '...kkkk...kkkkk...kkkk....',
];
const cloudSmall: Grid = [
  '.....ccc........',
  '...ccpppc.ccc...',
  '.ccppppppcpppc..',
  'cpppppppppppppc.',
  'cppkppppppppkppc',
  '.kppkkkppppkkk..',
  '...kk...kkk.....',
];

export const sugar: SkinDef = {
  id: 'sugar',
  name: 'Sugar Rush',
  tagline: 'Run, run, as fast as you can.',
  palette: {
    o: '#4a2032', // outline
    g: '#c77a3c', // gingerbread, donut dough
    h: '#e8a462', // gingerbread highlight, crumbs
    w: '#fff8f0', // icing
    r: '#ef3f5a', // gumdrop, cane stripes
    d: '#b52446', // gumdrop shade
    p: '#ff9cc6', // frosting, cotton candy
    k: '#e0609a', // deep pink
    m: '#5fd6b4', // mint
    n: '#2f9e84', // dark mint
    y: '#ffd84d', // lemon
    b: '#b3a4ff', // lilac
    l: '#7f6ee0', // dark lilac
    c: '#ffe6f2', // cotton-candy highlight
    e: '#ff2d55', // cherry (glows)
    s: '#fff7a0', // sugar crystals, sprinkles (glow)
  },
  runner: {
    run: [runA, runB],
    jump,
    duck: [duckA, duckB],
    dead,
    idle: [stand, blink],
  },
  small: [[gumdrop], [cupcake], [sweet]],
  large: [[cane], [lollipop, lollipop2], [macarons]],
  flyer: [donutUp, donutDown],
  decor: { sprites: [cloud, cloudSmall], y: [6, 34], speed: 0.15, every: [70, 200] },
  sky: { top: '#ffc2dc', bottom: '#fff3de' },
  celestial: { kind: 'sun', x: 0.8, y: 20, r: 8, color: '#ffe070', accent: '#fff0a8' },
  layers: [
    { kind: 'candy', color: '#f5c0dc', accent: '#fff4fa', height: 34, speed: 0.1 },
    { kind: 'hills', color: '#a8e6cf', accent: '#d2f5e5', height: 16, speed: 0.25 },
  ],
  ground: { style: 'frosting', color: '#8b4a3c', line: '#ff94c2', detail: '#fff3a8' },
  weather: { kind: 'sparkles', color: '#ffffff', color2: '#ffe36e', density: 0.35 },
  night: {
    mode: 'tint',
    sky: { top: '#1a0b2e', bottom: '#4a1d5e' },
    tint: '#2b1142',
    amount: 0.5,
    glow: ['e', 's'],
    stars: '#ffe9a8',
    celestial: { kind: 'moon', x: 0.8, y: 18, r: 7, color: '#fff0c8', accent: '#f0d8a8' },
    weather: { kind: 'sparkles', color: '#fff4b0', color2: '#ff9cd0', density: 0.5 },
    ink: '#ffd9ec',
  },
  ink: '#7a2a5a',
  sound: 'sweet',
  gameOver: 'OH, CRUMBS!',
  ui: { bg: '#fff0f6', fg: '#5a1f45', accent: '#ff5fa2' },
};
