import type { Grid, SkinDef } from './types.ts';

// The seabed. A red crab scuttles sideways past urchins, clams and a rusty
// anchor while sharks cruise overhead. Night is the abyss: everything sinks
// into navy and only the bioluminescent bits keep glowing.

// ---------------------------------------------------------------- crab
// Front view, scuttling sideways to the right. 24 x 20. The body bobs up a
// pixel on the second run frame while the legs tuck in.

const claws = [
  '.hh.h..............h.hh.',
  'hrr.rh............hr.rrh',
  'rrr.rr..ww....ww..rr.rrr',
  'rrrrrr..wk....wk..rrrrrr',
  'orrrro...r....r...orrrro',
  '.orro....r....r....orro.',
  '..or.....r....r.....ro..',
];
const shell = [
  '..or...hhhhhhhhhh...ro..',
  '...or.hrrrrrrrrrrh.ro...',
  '....ohrrrrrrrrrrrrho....',
  '...orrrrrrrrrrrrrrrro...',
  '..orrrrrrorrrrorrrrrro..',
  '..orrrrrrroooorrrrrrro..',
];
const legsSpread = [
  '.r.oorrrrrrrrrrrrrroo.r.',
  'r.r..oooooooooooooo..r.r',
  'r..r..r..........r..r..r',
  'r..r...r........r...r..r',
];
const legsTucked = [
  '...oorrrrrrrrrrrrrroo...',
  '..r..oooooooooooooo..r..',
  '.r..r.r..........r.r..r.',
  '.r.r..r..........r..r.r.',
  '.r.r...r........r...r.r.',
];
const e = '........................';

const run0: Grid = [e, e, e, ...claws, ...shell, ...legsSpread];
const run1: Grid = [e, e, ...claws, ...shell, ...legsTucked];
const stand: Grid = run0;
const blink: Grid = [e, e, e, claws[0], claws[1], 'rrr.rr..rr....rr..rr.rrr', 'rrrrrr..oo....oo..rrrrrr', ...claws.slice(4), ...shell, ...legsSpread];

const jump: Grid = [
  '.hh.h..............h.hh.',
  'hrr.rh............hr.rrh',
  'rrr.rr............rr.rrr',
  'rrrrrr............rrrrrr',
  'orrrro..ww....ww..orrrro',
  '.orro...wk....wk...orro.',
  '..or.....r....r.....ro..',
  '..or.....r....r.....ro..',
  '...or....r....r....ro...',
  '...or..hhhhhhhhhh..ro...',
  '....orhrrrrrrrrrrhro....',
  '....ohrrrrrrrrrrrrho....',
  '...orrrrrrrrrrrrrrrro...',
  '..orrrrrrrrkkrrrrrrrro..',
  '..orrrrrrrrkkrrrrrrrro..',
  '...oorrrrrrrrrrrrrroo...',
  '....r.oooooooooooo.r....',
  '...r..r.r......r.r..r...',
  '...r..r.r......r.r..r...',
  '...r...r........r...r...',
];

// Flipped on its back: pale underside up, legs kicking, X eyes, frown.
const dead: Grid = [
  e, e, e, e, e, e,
  '...r..r.r......r.r..r...',
  '..r..r..r......r..r..r..',
  '..r..r.r........r.r..r..',
  '...r.r.r........r.r.r...',
  '....r.r.r......r.r.r....',
  '.....hhhhhhhhhhhhhh.....',
  '...ohhhhhhhhhhhhhhhho...',
  '..orrrrrrrrrrrrrrrrrro..',
  '..orkrkrrrrrrrrrrkrkro..',
  'hr.orkrrrroooorrrrkro.rh',
  'rrrokrkrrorrrrorrkrkrorr',
  'orrorrrrrrrrrrrrrrrrorro',
  '.oo..oorrrrrrrrrrroo..oo',
  '.......oooooooooo.......',
];

// Flattened: eyes folded down onto the shell, claws out low.
const duckTop = [
  '..hh......ww....ww.....hh.',
  '.hrrh..oohkhhhhhhkhoo.hrrh',
  'hrr.rhohrrrrrrrrrrrrhohr.r',
  'orrrrorrrrrrrrrrrrrrrrorrr',
  '.orrroorrrrorrrrorrrroorro',
  '..oo..orrrrroooorrrrro.oo.',
];
const duckA: Grid = [
  '..........................',
  ...duckTop,
  '....r..oooooooooooooo..r..',
  '...r.r..r..........r..r.r.',
  '..r..r...r........r...r..r',
];
const duckB: Grid = [
  ...duckTop,
  '......oooooooooooooo......',
  '....r.r.r..........r.r.r..',
  '...r..r.r..........r..r.r.',
  '...r.r..r..........r..r.r.',
];

// ---------------------------------------------------------------- obstacles

const urchinA: Grid = [
  '.....l.....',
  '..l..p..l..',
  '...l.p.l...',
  'l..lpppl..l',
  '.l.pppppl..',
  '..pplppppl.',
  'lpppppppppl',
  '..ppppppp..',
  '.lpdpppdpl.',
  'l.ddddddd.l',
];
const urchinB: Grid = [
  '....l......',
  '.l...p...l.',
  '..l..p..l..',
  '...lpppl...',
  'll.pppppl.l',
  '..pplpppp..',
  '.lpppppppll',
  'l.ppppppp..',
  '..pdpppdp..',
  '.lddddddd.l',
];

const clamShut: Grid = [
  '...........',
  '...........',
  '...........',
  '...........',
  '...ddddd...',
  '.ddbbbbbdd.',
  'dbbgbbbgbbd',
  'dlldlldllld',
  'dgbbgbbgbbd',
  '.dgbbgbbgd.',
  '..ddddddd..',
];
const clamOpen: Grid = [
  '...ddddd...',
  '.ddbbbbbdd.',
  'dbbgbbbgbbd',
  '.ddddddddd.',
  '..ppppppp..',
  '.lppwwbppl.',
  'llpwwwbbpll',
  'dllpbbbplld',
  'dgbbgbbgbbd',
  '.dgbbgbbgd.',
  '..ddddddd..',
];

const starRock: Grid = [
  '....y......',
  '...yyy.....',
  '...yhy.....',
  'yyyyyyyyyy.',
  '.yyhyyhyy..',
  '..yyyyyy...',
  '..yyy.yyy..',
  '.yy....yy..',
  '.dbgggggbd.',
  'dbggggggggd',
  'dgggggggggd',
  '.ddddddddd.',
];

const coralA: Grid = [
  '.l......l....',
  '.c...l..c..l.',
  '.cc..c..c..c.',
  '..c..c.cc.cc.',
  '..cc.c.c..c..',
  '...ccccc.cc..',
  '....ccc.cc...',
  '.l..ccccc....',
  '.c..ccc......',
  '.cc.cc.......',
  '..cccc.......',
  '...ccc.......',
  '....cc.......',
  '....ccp......',
  '....ccp......',
  '....ccp......',
  '...cccp......',
  '...ccpp......',
  '..cccpp......',
  '.pcccpppp....',
  'pppppppppp...',
];
const coralB: Grid = [
  '..l.....l....',
  '..c..l...c.l.',
  '.cc..c...cc..',
  '.c...c..cc.c.',
  '.cc..c..c.cc.',
  '..ccccc.ccc..',
  '....ccc.cc...',
  '.l..ccccc....',
  '.c..ccc......',
  '.cc.cc.......',
  '..cccc.......',
  '...ccc.......',
  '....cc.......',
  '....ccp......',
  '....ccp......',
  '....ccp......',
  '...cccp......',
  '...ccpp......',
  '..cccpp......',
  '.pcccpppp....',
  'pppppppppp...',
];

const anchor: Grid = [
  '.....uuuu.....',
  '....uo..ou....',
  '....u....u....',
  '....uo..ou....',
  '.....uuuu.....',
  '......uo......',
  '.uhhhhuohhhhu.',
  '.ouuuuuuuuuuo.',
  '......uo......',
  '......uo......',
  '......uo......',
  '......uo......',
  '......uo......',
  '......uo......',
  '......uo......',
  '.h....uo....h.',
  'hu....uo....uh',
  'uuo...uo...ouu',
  '.uu...uo...uu.',
  '..uu..uo..uu..',
  '..ouuuuouuuo..',
  '....oouuoo....',
  '......oo......',
];

// A broken column; a seaweed strand sways from the break and winds down it.
const pillarShaft = [
  '..bbgdggdgd..',
  '..bbgdggdgd..',
  '..bbgdggdgd..',
  '..bbvvggdgd..',
  '..bbgdvvdgd..',
  '..bbgdggvvd..',
  '..bbgdggdgv..',
  '..bbgdggdgd..',
  '..bbgdggdgd..',
  '..bbgdggdgd..',
  '.bbbbbbbbgdd.',
  'bgggggggggddd',
  'ddddddddddddd',
];
const pillarA: Grid = [
  '..v..........',
  '...v.........',
  '...v.........',
  '..v..........',
  '..vb.........',
  '..bvbb.......',
  '..bbvgbb.....',
  '..bbgdgbbb...',
  '..bbgdggdbd..',
  ...pillarShaft,
];
const pillarB: Grid = [
  '....v........',
  '....v........',
  '...v.........',
  '..v..........',
  '..vb.........',
  '..bvbb.......',
  '..bbvgbb.....',
  '..bbgdgbbb...',
  '..bbgdggdbd..',
  ...pillarShaft,
];

// ---------------------------------------------------------------- shark
// Swims left. 26 x 14; the tail beats and the pectoral fin rows.

const sharkUp: Grid = [
  '..........d...............',
  '.........dd...............',
  '........dgd...............',
  '.......dggd...........dd..',
  '....dddgggdddd.......dgd..',
  '..ddgggggggggggdd...dggd..',
  '.dgggggggggggggggdddggd...',
  'dgwkggdgdgdggggggggggd....',
  'dggggdgdgdggggggggggggd...',
  '.dbbwbbbbbbbbbggggddddgd..',
  '..ddbbbbbbbbbbgdd.....dgd.',
  '....ddddddgggdd........dd.',
  '...........dggd...........',
  '............dd............',
];
const sharkDown: Grid = [
  '..........d...............',
  '.........dd...............',
  '........dgd...............',
  '.......dggd...............',
  '....dddgggdddd............',
  '..ddgggggggggggdd......dd.',
  '.dgggggggggggggggdd...dgd.',
  'dgwkggdgdgdggggggggddggd..',
  'dggggdgdgdggggggggggggd...',
  '.dbbwbbbbbbbbbggggddddgd..',
  '..ddbbbbbbbbbbgdd....dggd.',
  '....dddddgggdd........dggd',
  '........dggd...........dd.',
  '.........dd...............',
];

// ---------------------------------------------------------------- decor

const fishSchool: Grid = [
  '.............gg.g...........',
  '............ggggg...........',
  '.....gg.g.....gg.g..........',
  '....ggggg...................',
  '.....gg.g.........gg.g......',
  '.................ggggg......',
  '..........gg.g....gg.g......',
  '.........ggggg..............',
  '..........gg.g..............',
];
const jelly: Grid = [
  '...jjjjj...',
  '..jwwjjjj..',
  '.jwjjjjjjj.',
  '.jjjjjjjjj.',
  'jjljljljljj',
  '.j.l.j.l.j.',
  '.j..l.j..j.',
  '..j.l..j.j.',
  '..j..l.j..j',
  '.j...l..j.j',
  '.j..l...j..',
  '..j.l..j...',
];

export const deepsea: SkinDef = {
  id: 'deepsea',
  name: 'Deep Sea',
  tagline: 'Scuttle the seabed. Mind the sharks.',
  palette: {
    o: '#7c1d12', // crab shadow
    r: '#d9452a', // crab red
    h: '#ff8a4a', // crab highlight
    w: '#f4fbff', // eyes, pearl, belly glint
    k: '#0d1420', // pupils
    g: '#7f97a8', // shark, stone, clam shell
    d: '#34495e', // slate outline
    b: '#cfdde6', // pale belly, stone light
    p: '#7b3fa0', // urchin, coral shade
    l: '#c592e6', // lilac spines, clam mantle
    y: '#f5b83d', // starfish
    c: '#ee7a96', // coral pink
    u: '#b0602e', // rust
    j: '#ff8fd8', // jellyfish
    v: '#5aa35f', // seaweed
  },
  runner: {
    run: [run0, run1],
    jump,
    duck: [duckA, duckB],
    dead,
    idle: [stand, blink],
  },
  small: [[urchinA, urchinB], [clamShut, clamOpen], [starRock]],
  large: [[coralA, coralB], [anchor], [pillarA, pillarB]],
  flyer: [sharkUp, sharkDown],
  decor: { sprites: [fishSchool, jelly], y: [6, 34], speed: 0.12, every: [80, 220] },
  sky: { top: '#3a8fa0', bottom: '#14365f' },
  celestial: { kind: 'sun', x: 0.3, y: 2, r: 9, color: '#9fe0e0', accent: '#6cc4cc' },
  layers: [
    { kind: 'coral', color: '#28607a', accent: '#b8708f', height: 20, speed: 0.2, glow: true },
    { kind: 'kelp', color: '#1f5c4e', accent: '#3f8c5e', height: 26, speed: 0.45 },
  ],
  ground: { style: 'seabed', color: '#a8986f', line: '#cdbd8e', detail: '#efe4c6' },
  weather: { kind: 'bubbles', color: '#bff3ff', color2: '#7fd6e8', density: 0.35 },
  night: {
    mode: 'tint',
    sky: { top: '#0b2140', bottom: '#030a1c' },
    tint: '#061233',
    amount: 0.38,
    glow: ['w', 'j'],
    celestial: null,
    weather: { kind: 'fireflies', color: '#5ff2ff', color2: '#b8fff6', density: 0.45 },
    ink: '#8ff3ff',
  },
  ink: '#e8fbff',
  sound: 'bubble',
  gameOver: 'GLUB GLUB',
  ui: { bg: '#0b2238', fg: '#d8f6fa', accent: '#ff8a4a' },
};
