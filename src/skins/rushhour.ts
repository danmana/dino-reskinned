import type { Grid, SkinDef } from './types.ts';

// Rush Hour: the morning commute, played for laughs. An office worker sprints
// down the sidewalk, late for work, tie flapping and coffee held steady at
// all costs. At night ("working late") the windows and street lamps stay lit.

// ------------------------------------------------------------ office worker
// 24x23, facing right. The coffee hand stays level while the rest of him
// flails; run frame B sits 1 px higher than A (a bob).
const blank = '........................';
// Hair, eye and ear: identical in every upright frame.
const hair = [
  '..........ooooo.........',
  '.........ohhhhhoo.......',
  '........ohhhhhhhho......',
  '........ohhhhkkkko......',
  '........ohhkhkkoko......',
];
const legsTogether = [
  '.........onnnonnno......',
  '.........onnnonnno......',
  '.........onnnonnno......',
  '.........onnnonnno......',
  '........ooooooooooo.....',
  '........oooooooooooo....',
];

const runA: Grid = [
  blank,
  blank,
  ...hair,
  '........ohhkkkkkkoo.....',
  '..ooo....okkkkkhko......',
  '.otttoooo.okkkkko.oooo..',
  '..oottttttttwwo..ogggo..',
  '....oooooowqwwwo.owwo...',
  '.......owwwqwwwwokcco...',
  '......owwqowwwwkkowwo...',
  '.....okkoowwwqwoo.oo....',
  '.....oko.owwwwwo........',
  '.........onnnnno........',
  '........onnnnnnno.......',
  '.......onnno.onnno......',
  '......onnno...onnno.....',
  '.....onnno.....onnno....',
  '....ooooo.......ooooo...',
  '...oooooo.......oooooo..',
];
const runB: Grid = [
  blank,
  ...hair,
  '........ohhkkkkkkoo.....',
  '.........okkkkkhko......',
  '......oooookkkkko.oooo..',
  '..ooottttttttwwo.ogggo..',
  '.otttoooowwqwwwo.owwo...',
  '..ooo...owwqwwwwokcco...',
  '........owwqwwwwkkowwo..',
  '........owqwwwwwoo.oo...',
  '.......okkwwwwwo........',
  '.......okkonnnno........',
  '........onnnnnnno.......',
  '.......onnnonnno........',
  '......onnnoonnno........',
  '.....onnno.onnno........',
  '...ooooooo.onnno........',
  '...........oooooo.......',
  '...........oooooo.......',
];
// Arms flailing, coffee held high: not a drop spilled.
const jump: Grid = [
  '..................oooo..',
  '..................oggo..',
  '..................owwo..',
  '..oo.....ooooo....occo..',
  '.okko...ohhhhhoo.okkwo..',
  '.okko..ohhhhhhhhookko...',
  '..oko..ohhhhkkkkoowo....',
  '..owo..ohhkhkkokoowo....',
  '..owwo.ohhkkkkkkoowo....',
  '...owo..okkkkkhko.owo...',
  '...owwo..okkkkho..owo...',
  '....owwooooowwo..owwo...',
  '..ooootttttttwwoowwo....',
  '.otttoooowwqwwwwwwo.....',
  '.oto...owwqwwwwwoo......',
  '..o....owqwwwwwo........',
  '.......owwwwwwwo........',
  '.......onnnnnnno........',
  '......onnnnnnnnnnoo.....',
  '.....onnnoo.onnnnnno....',
  '....onnno.....oooonno...',
  '...ooooo.......onnnno...',
  '..oooo........ooooo.....',
];
// Waiting at the crossing, then a sip.
const stand: Grid = [
  blank,
  ...hair,
  '........ohhkkkkkkoo.....',
  '.........okkkkkhko......',
  '..........okkkkko.......',
  '.........owwwtwwo.......',
  '........owwqwtwwwo......',
  '........owwqwttwwoooo...',
  '........owwqwttwwogggo..',
  '........okqwwttwkkwwo...',
  '........okkwwwwwkkcco...',
  '.........oowwwwwoowwo...',
  '.........onnnnnnno.oo...',
  ...legsTogether,
];
const sip: Grid = [
  blank,
  ...hair,
  '........ohhkkkkkkoooo...',
  '.........okkkkkkoogggo..',
  '..........okkkkkkowwo...',
  '.........owwwtwwokcco...',
  '........owwqwtwwokwwo...',
  '........owwqwttwoo.oo...',
  '........owwqwttwwo......',
  '........okqwwttwwo......',
  '........okkwwwwwwo......',
  '.........oowwwwwoo......',
  '.........onnnnnnno......',
  ...legsTogether,
];
// Face-plant. The coffee lands where you'd expect.
const dead: Grid = [
  ...Array(7).fill(blank),
  '................oooo....',
  '................owwo....',
  '................occo....',
  '................owwo....',
  '...............oggggo...',
  '................c..c....',
  '.oooo...........c.c.....',
  '.oggo.oooo........c.....',
  '..ono.oggo....oooco.....',
  '..ono..ono...ohhhchhoo..',
  '..onno.ono..ohhhhhhhhho.',
  '...onnoono..ohhhhhhhhho.',
  '....onnnnooooohhhhhhkho.',
  '...onnnnnwwttohhhhhhkho.',
  '...onnnnnwqwttohhhhhhko.',
  '...ooooooooooookkkkkkko.',
];

// Baseball slide, feet first, coffee raised clear of the ground.
const slideBody = [
  '...owwooowwwwwqwwwwwwwwoooooooo.',
  '....owwwwwwwwwwwqwwwwwonnnnnnooo',
  '.....ooowwwwwwwwwwwwwwonnnnnnoo.',
  '.......oooooooooooooooooooooooo.',
];
const duckA: Grid = [
  'oooo....ooooo...................',
  'oggo...ohhhhhoo.................',
  'owwo..ohhhhhhhho..oo............',
  'occo..ohhhhkkkko.otto...........',
  'okko..ohhkhkkoko.otto...........',
  '.owo..ohhkkkkkkoo.otto..........',
  '..owo..okkkkkhko..otto..........',
  '..owwo..okkkkkoooootoooo....oooo',
  ...slideBody,
];
const duckB: Grid = [
  '.oooo...ooooo...................',
  '.oggo..ohhhhhoo.................',
  '.owwo.ohhhhhhhho..oo............',
  '.occo.ohhhhkkkko.otto...........',
  '.okko.ohhkhkkoko..otto..........',
  '..owo.ohhkkkkkkoo..otto.........',
  '..owo..okkkkkhko...otto.........',
  '..owwo..okkkkkooooootooo....oooo',
  ...slideBody,
];

// ------------------------------------------------------------ street clutter
const hydrant: Grid = [
  '....ooo....',
  '...ottto...',
  '..otwttto..',
  '.ooooooooo.',
  '..otwttto..',
  'oootwtttooo',
  'otttwtttllo',
  'oootwtttooo',
  '..otwttto..',
  '..otwttto..',
  '..otwttto..',
  '.ooooooooo.',
  '.ottttttto.',
  'ooooooooooo',
];
const canRibs = '.olglglgo.';
const trash: Grid = [
  '....ooo...',
  '...oo.oo..',
  '.oooooooo.',
  'ollllllllo',
  'oooooooooo',
  canRibs,
  canRibs,
  canRibs,
  '.oooooooo.',
  canRibs,
  canRibs,
  canRibs,
  canRibs,
  '..oooooo..',
];
const cone: Grid = [
  '....oo.....',
  '...oaao....',
  '...oaao....',
  '..owwwwo...',
  '..owwwwo...',
  '..oaaaao...',
  '.oaaaaaao..',
  '.owwwwwwo..',
  '.owwwwwwo..',
  'oaaaaaaaao.',
  'ooooooooooo',
  'oaaaaaaaaao',
  'ooooooooooo',
];
const mailLeg = '.onno...onno.';
const mailbox: Grid = [
  '...ooooooo...',
  '.oobbbbbbboo.',
  'obbbbbbbbbbbo',
  'obooooooooobo',
  'obollllllobbo',
  'obooooooooobo',
  'obbbbbbbbbbbo',
  'obbbwwwwwbbbo',
  'obbbwbbbwbbbo',
  'obbbwwwwwbbbo',
  'obbbbbbbbbbbo',
  'obbbbbbbbbbbo',
  'obbbbbbbbbbbo',
  'obbbbbbbbbbbo',
  'onnnnnnnnnnno',
  'ooooooooooooo',
  mailLeg,
  mailLeg,
  mailLeg,
  mailLeg,
  'oooooo.oooooo',
];
// Today's front page: a headline, a photo, some very small print.
const newsPost = '....oggo....';
const news: Grid = [
  '....oooo....',
  '....oggo....',
  'oooooooooooo',
  'oeeeeeeeeeeo',
  'oeolllllloeo',
  'oeeeeeeeeeeo',
  'oeoooooooeeo',
  'oeowwwwwwoeo',
  'oeowoooowoeo',
  'oeowwwwwwoeo',
  'oeowqqwowoeo',
  'oeowqqwwwoeo',
  'oeowwwwowoeo',
  'oeoooooooeeo',
  'oeeeeeeeeeeo',
  'oeeeeoooeeeo',
  'oeeeeeeeeeeo',
  'oooooooooooo',
  newsPost,
  newsPost,
  newsPost,
  '..oooooooo..',
  '.oggggggggo.',
  '.oooooooooo.',
];
// Someone's online shopping: tape, a FRAGILE stamp and a shipping label.
const boxes: Grid = [
  '..oooooooooo...',
  '..occccllcco...',
  '..occccllcco...',
  '..ohhhhllhho...',
  '..oooooooooo...',
  '.oooooooooooo..',
  '.occcccllccco..',
  '.otttccllccco..',
  '.otttccllccco..',
  '.ohhhhhllhhhho.',
  'ooooooooooooooo',
  'occcccccllcccco',
  'owwwwwccllcccco',
  'owoooowcllcccco',
  'owwwwwccllcccco',
  'owoowwccllcccco',
  'owwwwwccllcccco',
  'ohhhhhhhllhhhho',
  'ooooooooooooooo',
];

// ------------------------------------------------------------ pigeon
// Faces left: orange eye, green neck, wing up then down.
const pigeonUp: Grid = [
  '...........oo.....',
  '..........oggo....',
  '.........ogggo....',
  '..ooo...oggggo....',
  '.oallo.ogoggoo....',
  'oolllooogggogoo...',
  '..oeeeolllllllooo.',
  '..oeeellllllllgggo',
  '...oolllllllloooo.',
  '.....ooollllooo...',
  '........oooo......',
  '..................',
  '..................',
];
const pigeonDown: Grid = [
  '..................',
  '..................',
  '..................',
  '..ooo.............',
  '.oallo............',
  'oolllo..oooooo....',
  '..oeeeoolllllloooo',
  '..oeeellllllllgggo',
  '...oollgggggggoooo',
  '.....oogggggggo...',
  '......ogoggggo....',
  '.......ogogggo....',
  '........oooooo....',
];

// ------------------------------------------------------------ sky
const cloud: Grid = [
  '........wwww..........',
  '.....wwwwwwww..www....',
  '...wwwwwwwwwwwwwwwww..',
  '.wwwwwwwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwwwwwwwww',
  '.qqwwwwwqqqwwwwwwqqqq.',
  '...qqqqq...qqqqqq.....',
];
const cloudSmall: Grid = [
  '....www.......',
  '..wwwwwww.ww..',
  '.wwwwwwwwwwww.',
  'wwwwwwwwwwwwww',
  '.qqqwwwwwqqqq.',
  '....qqqq......',
];
// A banner plane with a helpful reminder.
const plane: Grid = [
  '............xx..........................',
  '...........xxx..........................',
  '.xxxxxxxxxxxxx...qqqqqqqqqqqqqqqqqqqqqqq',
  'xxqxqxqxxxxxxx...qwwwwwwwwwwwwwwwwwwwwwq',
  '.xxxxxxxxxxxxxl..qwtwwwwtwwtttwtttwwtwwq',
  '.....xxxxx....lllqwtwwwtwtwwtwwtwwwwtwwq',
  '......xxx........qwtwwwtttwwtwwttwwwtwwq',
  '.................qwtwwwtwtwwtwwtwwwwwwwq',
  '.................qwtttwtwtwwtwwtttwwtwwq',
  '.................qwwwwwwwwwwwwwwwwwwwwwq',
  '.................qqqqqqqqqqqqqqqqqqqqqqq',
];

// ------------------------------------------------------------ street furniture
// A background layer in muted blue-grey so it never reads as an obstacle.
// Lamp heads and the amber light glow at night.
const lamp: Grid = [
  '...xx...',
  '..xxxx..',
  '.xxxxxx.',
  '.xyyyyx.',
  '.xyyyyx.',
  '.xyyyyx.',
  'xxxxxxxx',
  '..xxxx..',
  '...xx...',
  ...Array(22).fill('...xx...'),
  '..xxxx..',
  '.xxxxxx.',
];
const trafficLight: Grid = [
  '.xxxxx.',
  'xxxxxxx',
  'xxtttxx',
  'xxtttxx',
  'xxxxxxx',
  'xxyyyxx',
  'xxyyyxx',
  'xxxxxxx',
  'xxeeexx',
  'xxeeexx',
  'xxxxxxx',
  '.xxxxx.',
  ...Array(17).fill('...x...'),
  '..xxx..',
  '.xxxxx.',
];
const shelterPanel = '....x....xq.......q.......q.....x';
const busStop: Grid = [
  '..xxxxx..........................',
  '.xxbbbxx.........................',
  '.xbwwwbx.........................',
  '.xbwbwbx.........................',
  '.xbwwwbx.........................',
  '.xxbbbxx.xxxxxxxxxxxxxxxxxxxxxxx.',
  '..xxxxx..xxxxxxxxxxxxxxxxxxxxxxxx',
  shelterPanel,
  shelterPanel,
  shelterPanel,
  shelterPanel,
  shelterPanel,
  '....x....xqxxxxxxxxxxxxxxxq.....x',
  '....x....xq.xx.......xx...q.....x',
  '....x....xq.xx.......xx...q.....x',
  '....x....xq...............q.....x',
  '...xxx...xx...............x.....x',
];
const trunk = '......hh......';
const tree: Grid = [
  '.....cccc.....',
  '...ccacccc....',
  '..cccccacccc..',
  '.ccacccccccac.',
  'ccccccacccccc.',
  'cccacccccccac.',
  '.cccccccaccc..',
  '..ccacccccc...',
  '....cchccc....',
  trunk,
  trunk,
  trunk,
  trunk,
  trunk,
  '.....hhhh.....',
];

export const rushhour: SkinDef = {
  id: 'rushhour',
  name: 'Rush Hour',
  tagline: 'Late again. Coffee: still full.',
  palette: {
    o: '#1d2233', // outline, shoes
    w: '#f5f7fb', // shirt, cup, paper
    q: '#b9c4dc', // shirt shade, cloud shade, glass
    t: '#d93a30', // tie, hydrant
    k: '#f2c29c', // skin
    h: '#5a3620', // hair, cardboard shade, bark
    c: '#c8914f', // coffee, cup sleeve, cardboard
    n: '#34406a', // trousers
    b: '#2f64c8', // mailbox blue
    g: '#7c8794', // metal, pigeon wing
    l: '#b8c1cb', // light metal, pigeon
    a: '#ff7a1f', // traffic cone, autumn
    y: '#ffd23a', // lamp light (glows)
    e: '#46a37e', // newsstand, pigeon neck
    x: '#6f819a', // background street furniture
  },
  runner: {
    run: [runA, runB],
    jump,
    duck: [duckA, duckB],
    dead,
    idle: [stand, sip],
  },
  small: [[hydrant], [trash], [cone]],
  large: [[mailbox], [news], [boxes]],
  flyer: [pigeonUp, pigeonDown],
  decor: { sprites: [cloud, cloudSmall, plane], y: [4, 30], speed: 0.15, every: [60, 180] },
  sky: { top: '#8fc8f0', bottom: '#fff0bf' },
  celestial: { kind: 'sun', x: 0.82, y: 18, r: 7, color: '#ffe27a', accent: '#fff4c2' },
  layers: [
    { kind: 'city', color: '#b3c6db', accent: '#fff4cc', height: 46, speed: 0.08, glow: true },
    { kind: 'city', color: '#8ea3bd', accent: '#fdf3d6', height: 30, speed: 0.18, glow: true },
    { kind: 'sprites', sprites: [lamp, trafficLight, busStop, tree, lamp, tree], speed: 0.4, gap: [24, 80] },
  ],
  ground: { style: 'sidewalk', color: '#d3cdc4', line: '#9a948b', detail: '#b3ada4' },
  weather: { kind: 'leaves', color: '#e8892a', color2: '#c9532a', density: 0.25 },
  night: {
    mode: 'tint',
    sky: { top: '#0b1030', bottom: '#2a3160' },
    tint: '#141a3a',
    amount: 0.5,
    glow: ['y'],
    stars: '#dfe6ff',
    celestial: { kind: 'crescent', x: 0.78, y: 18, r: 6, color: '#f4efd2' },
    ink: '#ffe9a0',
  },
  ink: '#1d2a4a',
  sound: 'honk',
  gameOver: "YOU'RE FIRED",
  ui: { bg: '#e8eef5', fg: '#1d2a4a', accent: '#d93a30' },
};
