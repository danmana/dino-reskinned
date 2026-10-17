import type { Grid, SkinDef } from './types.ts';

// Roadster: the classic white runner world, with the new Roadster in place
// of the dinosaur. Cold-gas thrusters fire under the car on every jump (see
// `jets`), suction fans pull it flat to the road to duck, and it hops over a
// row of parked Teslas like the unveiling demo. The cars are parked across
// the track, so they are seen nose-on. At night the stage lights go down.

/** Copies the non-transparent pixels of `top` onto `base` at (x, y). */
function paint(base: Grid, top: Grid, x: number, y: number): Grid {
  const out = base.map((r) => r.split(''));
  top.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (ch === '.' || !out[y + j] || x + i < 0 || x + i >= out[y + j].length) continue;
      out[y + j][x + i] = ch;
    }
  });
  return out.map((r) => r.join(''));
}
const rows = (n: number, w: number): Grid => Array(n).fill('.'.repeat(w));
const flipV = (g: Grid): Grid => [...g].reverse();

// ------------------------------------------------------------ the roadster
// Drawn from the real side profile, mirrored to face right: a fastback roof
// peaking just behind the middle, a glass wedge that is tallest at the raked
// windscreen, a knife-edge nose at wheel-centre height and a tall cut-off
// tail, with the black lower body rising toward the back. The wheelbase and
// wheel size match the photo; the roof is what the satellites hit.
type Pt = [number, number];
const W = 44;

function inside(poly: Pt[], x: number, y: number): boolean {
  let inPoly = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inPoly = !inPoly;
  }
  return inPoly;
}

// Body outline in px: x from the tail (0) to the nose (44), y down from the roof.
const SHELL: Pt[] = [
  [0.4, 9.6], [0.4, 3.4], [4.1, 2.7], [7.6, 1.8], [11.5, 1.0], [15, 0.4], [19, 0], [23.5, 0], [26.2, 0.5],
  [33.6, 5.0], [37.4, 5.9], [40.8, 7.6], [43.8, 9.6], [43.9, 10.9], [43, 12.4], [39, 12.9], [3, 12.9], [1.2, 11.8],
];
const CANOPY: Pt[] = [[32.6, 5.0], [26, 1.1], [23.5, 0.9], [19, 0.9], [15, 1.3], [11, 1.9], [9, 2.6], [20, 3.8], [30.5, 5.0]];
const SILL = 12.9;
/** The black lower body: below this line, which rises toward the tail. */
const belt = (x: number) => 11.6 - Math.max(0, Math.min(1, (31 - x) / 20)) * 2;

/** The body alone; `squash` < 1 flattens it toward the sill (for the duck). */
function shell(squash = 1, rows = 13): string[][] {
  const g = Array.from({ length: rows }, () => Array(W).fill('.'));
  const sy = (y: number) => SILL - (SILL - y) * squash;
  const shellPts = SHELL.map(([x, y]) => [x, sy(y)] as Pt);
  const canopyPts = CANOPY.map(([x, y]) => [x, sy(y)] as Pt);
  // Upper surfaces (roof, hood, top of the tail) catch the light; the flanks are silver; the lower body is black.
  for (let x = 0; x < W; x++) {
    let top = -1;
    for (let y = 0; y < rows; y++) {
      const cx = x + 0.5, cy = y + 0.5;
      if (!inside(shellPts, cx, cy)) continue;
      if (top < 0) top = y;
      g[y][x] = inside(canopyPts, cx, cy) ? 'G' : cy > sy(belt(cx)) ? 'd' : y - top <= 3 ? 'W' : 'V';
    }
  }
  // Outline every edge pixel.
  const solid = (x: number, y: number) => y >= 0 && y < rows && x >= 0 && x < W && g[y][x] !== '.';
  const edge = g.map((row, y) => row.map((c, x) => c !== '.' && (!solid(x - 1, y) || !solid(x + 1, y) || !solid(x, y - 1) || !solid(x, y + 1))));
  g.forEach((row, y) => row.forEach((_, x) => { if (edge[y][x]) g[y][x] = 'o'; }));
  // A reflection along the top of the canopy.
  g.forEach((row, y) => row.forEach((c, x) => { if (c === 'G' && y > 0 && g[y - 1][x] === 'o') g[y][x] = 'g'; }));
  return g;
}

const REAR_X = 7.5;
const FRONT_X = 36;
const WHEEL_R = 4.6;
const WHEEL_Y = 11.4; // wheel centre, in body rows

/** A black six-spoke aero wheel; `turn` rotates the spokes (radians). */
function wheel(g: string[][], cx: number, cy: number, turn: number, r = WHEEL_R): void {
  for (let y = 0; y < g.length; y++) for (let x = 0; x < W; x++) {
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
    const d = Math.hypot(dx, dy);
    if (d > r) continue;
    if (d > r - 1.2 || d < 0.8) { g[y][x] = 'k'; continue; }
    const a = Math.atan2(dy, dx) - turn;
    const spoke = Math.abs(((a % (Math.PI / 3)) + Math.PI / 3) % (Math.PI / 3) - Math.PI / 6) > Math.PI / 6 - 0.24;
    g[y][x] = spoke ? 'r' : 'N';
  }
}

/** Cuts the wheel arches out of the body: a dark well around each wheel. */
function arches(g: string[][], cy: number, r = WHEEL_R + 0.6): void {
  for (const cx of [REAR_X, FRONT_X]) for (let y = 0; y < g.length; y++) for (let x = 0; x < W; x++) {
    if (g[y][x] !== '.' && Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= r) g[y][x] = 'K';
  }
}

/** The red light bar across the top of the tail: the first two body rows at the back. */
function tailLight(g: string[][]): void {
  const y = g.findIndex((r) => r[0] !== '.');
  for (const dy of [1, 2]) g[y + dy][0] = g[y + dy][1] = 'L';
}

const TOP = 8; // empty rows above the car: room for the hover and the jump
const H = TOP + 16;
const HOVER = 8;

function car(turn: number, drop = 0, lift = 0): Grid {
  const g = Array.from({ length: H }, () => Array(W).fill('.'));
  const y0 = TOP - lift;
  shell().forEach((row, y) => row.forEach((c, x) => { if (c !== '.') g[y0 + y][x] = c; }));
  // Tail light bar, side marker and headlight.
  tailLight(g);
  g[y0 + 6][30] = 'M';
  g[y0 + 10][42] = 'Y';
  g[y0 + 10][41] = 'Y';
  arches(g, y0 + WHEEL_Y);
  wheel(g, REAR_X, y0 + WHEEL_Y + drop, turn);
  wheel(g, FRONT_X, y0 + WHEEL_Y + drop, turn);
  return g.map((r) => r.join(''));
}

const runA = car(0);
const runB = car(Math.PI / 6);
// In the air the suspension drops the wheels a pixel.
const jump = car(0, 1, 1);
// Idle: a short hover on the thrusters every few seconds (the renderer draws the jets).
const hover = car(0, 1, HOVER);
// Upside down, like the ramp stunt, but without the landing. A wisp of smoke rises off the floor pan.
const dead = paint([...rows(TOP, W), ...flipV(car(Math.PI / 6).slice(TOP))], ['.j', 'j.', '.j', 'j.'], 21, TOP - 1);

// Duck: the fans suck the body down over its wheels, which sink into the
// arches; the skirt glows between them.
function duck(phase: number): Grid {
  const squash = 0.72;
  const cut = Math.floor(SILL * (1 - squash));
  const body = shell(squash).slice(cut);
  const n = body.length;
  const g = [...body.map((r) => [...r]), Array(W).fill('.')];
  arches(g, n, WHEEL_R + 0.4);
  wheel(g, REAR_X, n, 0, WHEEL_R - 0.4);
  wheel(g, FRONT_X, n, 0, WHEEL_R - 0.4);
  tailLight(g);
  g[n - 3][42] = 'Y';
  for (let x = 13; x <= 30; x++) g[n][x] = 'f';
  for (let x = 0; x < 2; x++) g[n][15 + phase * 8 + x] = 'v';
  return g.map((r) => r.join(''));
}
const duckA = duck(0);
const duckB = duck(1);

// ------------------------------------------------------------ parked teslas
// Seen nose-on, the way the demo parked them across the Roadster's path.
const model3 = (c: string, hood: string): Grid => [
  '...ooooo...',
  '..oGGGGGo..',
  `${c}oGGGGGGGo${c}`,
  `o${hood.repeat(9)}o`,
  `oy${c.repeat(7)}yo`,
  `o${c.repeat(9)}o`,
  `o${c}${c}kkkkk${c}${c}o`,
  '.kko...okk.',
  '.kk.....kk.',
];
const cybertruck: Grid = [
  '...ooooo...',
  '..oGGGGGo..',
  '.oGGGGGGGo.',
  'ottttttttto',
  'oyyyyyyyyyo',
  'ottttttttto',
  'ottttttttto',
  'kkdddddddkk',
  'kkko...okkk',
  '.kk.....kk.',
];
const cybercab: Grid = [
  '..ooooooo..',
  '.oGGGGGGGo.',
  'oGGGGGGGGGo',
  'oyyyyyyyyyo',
  'oCCCCCCCCCo',
  'oCCCCCCCCCo',
  '.kkCCCCCkk.',
  '.kk.....kk.',
];
// The Semi nose-on: aero cab, amber marker row, one wide windscreen, the
// U-shaped crease on the nose, tall corner headlights, black bumper.
const semi: Grid = [
  '....ooooooo....',
  '..ooWWWWWWWoo..',
  '.oWWWWWWWWWWWo.',
  '.oWWWWWWWWWWWo.',
  '.oWWWWWWWWWWWo.',
  '.oWWWWWWWWWWWo.',
  '.oWMWMWMWMWMWo.',
  'ooGGGGGGGGGGGoo',
  '.oGGGGGGGGGGGo.',
  '.oGGGGGGGGGGGo.',
  '.oGGGGGGGGGGGo.',
  '.osGGGGGGGGGso.',
  '.oWsWWWWWWWsWo.',
  '.oWsWWWWWWWsWo.',
  '.oysWWWWWWWsyo.',
  '.oyWsssssssWyo.',
  '.oyWWWWWWWWWyo.',
  '.oWWWWWWWWWWWo.',
  '.okkkkkkkkkkko.',
  '.okkkkkkkkkkko.',
  '.okkko...okkko.',
  '..kkk.....kkk..',
];
// Optimus: a plain glossy black visor with the blue light strip down one side,
// black yoke and waist, white shell; a human's proportions, at game scale.
const optimus: Grid = [
  '......ooo......',
  '.....okkko.....',
  '.....okkke.....',
  '.....okkke.....',
  '......oke......',
  '...ooookoooo...',
  '.ooWWkkkkkWWoo.',
  'oWWWokWWWkoWWWo',
  'oWWookWWWkooWWo',
  'oWWooWWWWWooWWo',
  'okkooWWWWWookko',
  'okkoookkkoookko',
  'okko.okkko.okko',
  'okkooWWoWWookko',
  'ohhooWWoWWoohho',
  '.oo.oWWoWWo.oo.',
  '....oWWoWWo....',
  '....okkokko....',
  '....oWWoWWo....',
  '....oWkokWo....',
  '....oWkokWo....',
  '....oWWoWWo....',
  '...okkkokkko...',
  '...ooooooooo...',
];

// ------------------------------------------------------------ starlink
// A flat bus between two long solar wings. The glint slides along the cells.
const starlinkA: Grid = [
  '...........oooo...........',
  'oooooooooo.oSSo.oooooooooo',
  'oPPnPPnPPo-oSSo-oPPnPPnPPo',
  'oPPnPPnPPo-oSSo-oPPnPPnPPo',
  'oooooooooo.oSSo.oooooooooo',
  '...........oddo...........',
  '............l.............',
];
const starlinkB: Grid = [
  '...........oooo...........',
  'oooooooooo.oSSo.oooooooooo',
  'oPPnPPqqPo-oSSo-oPPnPPqqPo',
  'oPPnPPqqPo-oSSo-oPPnPPqqPo',
  'oooooooooo.oSSo.oooooooooo',
  '...........oddo...........',
  '..........................',
];

// ------------------------------------------------------------ sky
const blank: Grid = ['.'];
const cloud: Grid = [
  '..........cccccc........',
  '........ccwwwwwwcc......',
  '...cccccwwwwwwwwwwc.....',
  '..cwwwwwwwwwwwwwwwwcc...',
  '.cwwwwwwwwwwwwwwwwwwwc..',
  'cwwwwwwwwwwwwwwwwwwwwwc.',
  'ccccccccccccccccccccccc.',
];
// Starship in its belly flop, heading home: steel on top, black tiles below,
// a rounded nose with small forward flaps and big aft flaps at the tail.
const starship: Grid = [
  '.........K......................KKK...',
  '........KKK....................KKKKK..',
  '......oooooooooooooooooooooooooooooooK',
  '....ooaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaK',
  '..ooaaSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSK',
  'ooaaSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSK',
  '..ooTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTK',
  '....ooTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTK',
  '......oooooooooooooooooooooooooooooooK',
  '........KKK....................KKKKK..',
  '.........K......................KKK...',
];

// ------------------------------------------------------------ the stage
// Background props in two light greys: the curved wall ramp on its truss, and
// Starship stacked on the launch tower.
// The wall ramp from the unveiling: a short toe off the ground, a near-vertical
// wall, then a straight overhang reaching back over the top, held up by a
// lattice tower and a truss along the overhang. Points are measured off a
// photo of it (x, y in photo pixels) and scaled down.
const RAMP_LINE: Pt[] = [
  [650, 505], [700, 482], [725, 445], [738, 390], [742, 330], [737, 270], [720, 220],
  [688, 183], [640, 158], [580, 140], [495, 128],
];
const TRUSS: [Pt, Pt][] = [
  [[712, 165], [712, 505]], [[790, 150], [790, 505]], // tower legs
  [[545, 118], [790, 150]], [[560, 150], [712, 165]], // overhang beam chords
  [[892, 485], [790, 150]], // guy line
];
function ramp(): Grid {
  const k = 0.12;
  const ox = 480;
  const oy = 112;
  const w = 39;
  const h = Math.round((505 - oy) * k) + 1;
  const g = rows(h, w).map((r) => r.split(''));
  const set = (x: number, y: number, ch: string) => {
    if (x >= 0 && y >= 0 && x < w && y < h) g[y][x] = ch;
  };
  const line = ([x0, y0]: Pt, [x1, y1]: Pt, ch: string) => {
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * k * 2);
    for (let i = 0; i <= n; i++) set(Math.round((x0 + ((x1 - x0) * i) / n - ox) * k), Math.round((y0 + ((y1 - y0) * i) / n - oy) * k), ch);
  };
  for (const [p0, p1] of TRUSS) line(p0, p1, 'b');
  // Cross bracing: the tower in five bays, the overhang beam in four.
  for (let i = 0; i < 5; i++) {
    const y0 = 165 + (i * (505 - 165)) / 5, y1 = 165 + ((i + 1) * (505 - 165)) / 5;
    line([712, y0], [790, y1], 'b');
    line([790, y0], [712, y1], 'b');
  }
  for (let i = 0; i < 4; i++) {
    const x0 = 560 + (i * (712 - 560)) / 4, x1 = 560 + ((i + 1) * (712 - 560)) / 4;
    line([x0, 120 + ((x0 - 545) * 32) / 245], [x1, 150 + ((x1 - 560) * 15) / 152], 'b');
  }
  // The ramp itself: a band along RAMP_LINE, thicker at the bottom (it is nearer the camera there).
  const pts = RAMP_LINE.map(([x, y]) => [(x - ox) * k, (y - oy) * k] as Pt);
  const ramp = Array.from({ length: h }, () => Array(w).fill(false));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const px = x + 0.5, py = y + 0.5;
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
      const t = Math.max(0, Math.min(1, ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2)));
      const half = 2.0 + (py / h) * 2.5;
      if (Math.hypot(px - (ax + t * (bx - ax)), py - (ay + t * (by - ay))) <= half) ramp[y][x] = true;
    }
  }
  // Edges in the darker grey; the outer (riding) edge carries the red LED strip.
  const [cx, cy] = [(600 - ox) * k, (330 - oy) * k];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!ramp[y][x]) continue;
    const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !ramp[y + dy]?.[x + dx]);
    if (!edge) { g[y][x] = 'A'; continue; }
    const outer = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !ramp[y + dy]?.[x + dx] && Math.hypot(x + dx - cx, y + dy - cy) > Math.hypot(x - cx, y - cy));
    g[y][x] = outer && y < h * 0.3 ? 'z' : 'b';
  }
  // The deck's thickness: a darker band along the inner (riding) face.
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (g[y][x] !== 'A') continue;
    const innerEdge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => g[y + dy]?.[x + dx] === 'b' && Math.hypot(x + dx - cx, y + dy - cy) < Math.hypot(x - cx, y - cy));
    if (innerEdge) g[y][x] = 'a';
  }
  return g.map((row) => row.join(''));
}
// Starship stacked on its booster beside the launch tower, catch arms out.
function launchTower(): Grid {
  const w = 14;
  const h = 46;
  const g = rows(h, w).map((r) => r.split(''));
  const set = (x: number, y: number, ch: string) => {
    if (x >= 0 && y >= 0 && x < w && y < h) g[y][x] = ch;
  };
  // Ship: nose cone, body, forward and aft flaps.
  const cone = ['.bb.', '.ab.', 'bAAb', 'bAAb'];
  cone.forEach((r, y) => [...r].forEach((c, x) => c !== '.' && set(1 + x, 1 + y, c)));
  for (let y = 5; y < 18; y++) { set(1, y, 'b'); set(2, y, 'A'); set(3, y, 'A'); set(4, y, 'b'); }
  for (const y of [6, 7, 15, 16]) { set(0, y, 'b'); set(5, y, 'b'); }
  // Booster: hot-staging ring, grid fins, body.
  for (let x = 1; x <= 4; x++) set(x, 18, 'b');
  for (let y = 19; y < 42; y++) { set(1, y, 'b'); set(2, y, 'a'); set(3, y, 'a'); set(4, y, 'b'); }
  set(0, 20, 'b'); set(5, 20, 'b');
  // Launch mount.
  for (let x = 0; x <= 6; x++) { set(x, 42, 'b'); set(x, 45, 'b'); }
  for (const x of [0, 6]) for (let y = 43; y < 45; y++) set(x, y, 'b');
  // Tower: two legs, X bracing, top deck, chopstick arms reaching to the ship.
  for (let y = 2; y < h; y++) { set(8, y, 'b'); set(12, y, 'b'); }
  for (let y = 4; y < h - 4; y += 4) for (let i = 0; i <= 4; i++) { set(8 + i, y + i, 'b'); set(12 - i, y + i, 'b'); }
  for (let x = 8; x <= 13; x++) set(x, 2, 'b');
  for (let x = 6; x <= 8; x++) { set(x, 13, 'b'); set(x, 14, 'b'); }
  return g.map((r) => r.join(''));
}

export const roadster: SkinDef = {
  id: 'roadster',
  name: 'Roadster',
  tagline: '0-60 in under a second. Wheels optional.',
  palette: {
    o: '#3d3d3d', // outline
    w: '#fbfbfb', // clouds
    W: '#fbfbfb', // vehicle white: roadster, semi, optimus (floodlit at night)
    s: '#c4c4c4', // shade lines
    V: '#c4c4c4', // the roadster's silver flanks (floodlit at night)
    d: '#6b6b6b', // sills, bumpers, undersides
    G: '#3b3230', // smoked glass
    g: '#5a4a44', // glass highlight band
    k: '#232323', // tyres, optimus joints and helmet
    r: '#8a8a8a', // wheel spokes
    N: '#2b2b2b', // wheel face
    h: '#e0e0e0', // optimus hands
    L: '#e31937', // tail light bar (glows)
    y: '#d8f0ff', // light bars on the parked cars (glow)
    Y: '#6cc4ff', // roadster headlight (glows)
    f: '#7fd4ff', // fan skirt glow
    v: '#3f86b8', // fan skirt dark
    q: '#ffffff', // thruster jet core; solar glint
    i: '#c8d6e2', // jet body (glows)
    I: '#8fa3b5', // jet edge (glows)
    p: '#e3e8ec', // cold-gas smoke
    j: '#b4bec7', // smoke shade
    M: '#f08a24', // side marker
    R: '#c3202c', // red model 3
    B: '#2c4ea8', // blue model 3
    Q: '#e04a55', // red model 3 hood highlight
    U: '#4a6cc8', // blue model 3 hood highlight
    t: '#a9adb1', // cybertruck steel
    C: '#cdb58a', // cybercab champagne
    e: '#3aa7ff', // optimus face ring (glows)
    S: '#c9ced3', // starlink bus, starship steel
    K: '#4a4a4a', // wheel wells
    T: '#7a7a7a', // starship heat shield
    P: '#2b3d63', // solar cells
    n: '#3a5585', // solar cell grid lines
    '-': '#7a7a7a', // booms
    l: '#c25a5a', // starlink beacon (glows)
    c: '#c9c9c9', // cloud edge
    a: '#e2e2e2', // stage props
    A: '#dcdcdc', // the floodlit ramp face, Starship steel (glows)
    b: '#c9c9c9', // stage props: truss, ramp edges
    z: '#e7707d', // the ramp's LED strip (glows)
  },
  runner: {
    run: [runA, runB],
    jump,
    duck: [duckA, duckB],
    dead,
    idle: [runA, hover, hover, hover],
  },
  small: [[model3('R', 'Q')], [model3('B', 'U')], [cybertruck], [cybercab]],
  large: [[semi], [optimus]],
  flyer: [starlinkA, starlinkB],
  decor: { sprites: [cloud, cloud, cloud, cloud, starship], y: [12, 22], speed: 0.15, every: [60, 200] },
  limits: { runner: { w: 44, h: 24 }, duck: { w: 44, h: 12 } },
  jets: { lift: [16, 27], rise: 3, boost: 6, hover: HOVER - 1, jet: ['q', 'i', 'I'], smoke: ['p', 'j'], dust: 'd' },
  sky: { top: '#f7f7f7', bottom: '#f7f7f7' },
  layers: [{ kind: 'sprites', sprites: [ramp(), launchTower()], speed: 0.12, gap: [90, 220] }],
  ground: { style: 'line', color: '#f7f7f7', line: '#535353', detail: '#535353' },
  night: {
    mode: 'tint',
    sky: { top: '#050507', bottom: '#15151c' },
    tint: '#0c0c12',
    amount: 0.42,
    // The stage: vehicles floodlit, jets glowing, the red LED line along the floor.
    glow: ['W', 'V', 'r', 'p', 'L', 'y', 'Y', 'M', 'f', 'e', 'l', 'q', 'i', 'I', 'z', 'A'],
    ground: { style: 'line', color: '#15151c', line: '#c0182c', detail: '#3a3a44' },
    decor: [blank, blank, blank, blank, starship],
    stars: '#c9cbd6',
    celestial: { kind: 'planet', x: 0.8, y: 16, r: 5, color: '#c1440e', accent: '#e07a4a' },
    ink: '#e8e8ee',
  },
  ink: '#535353',
  sound: 'neon',
  gameOver: 'FSD DISENGAGED',
  ui: { bg: '#f7f7f7', fg: '#535353', accent: '#e31937' },
};
