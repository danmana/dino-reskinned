import { PixelBuffer } from '../core/pixbuf.ts';
import { pack, unpack, toHex, invert, mix } from '../core/color.ts';
import { hashString } from '../core/rng.ts';
import { renderCelestial, renderGround, renderLayer, renderSpriteLayer } from './art.ts';
import type { CelestialDef, DecorDef, GenLayer, Grid, NightDef, SkinDef, WeatherDef } from '../skins/types.ts';

export interface SpriteArt {
  buf: PixelBuffer;
  w: number;
  h: number;
  /** Rows from the sprite's top to just below its group's lowest pixel. Draw at footY - baseline. */
  baseline: number;
  mask: Uint8Array;
}

export interface LayerArt {
  buf: PixelBuffer;
  /** Row of the layer's bottom edge. */
  baseline: number;
  speed: number;
}

export interface VariantArt {
  runner: { run: SpriteArt[]; jump: SpriteArt; duck: SpriteArt[]; dead: SpriteArt; idle: SpriteArt[] };
  small: SpriteArt[][];
  large: SpriteArt[][];
  flyer: SpriteArt[];
  decor: SpriteArt[];
  layers: LayerArt[];
  ground: PixelBuffer;
  sky: { top: string; bottom: string };
  stars?: string;
  celestial?: { buf: PixelBuffer; x: number; y: number };
  weather?: WeatherDef;
  aurora?: [string, string];
  ink: string;
}

export interface SkinArt {
  id: string;
  name: string;
  tagline: string;
  custom: boolean;
  day: VariantArt;
  night: VariantArt;
  decor?: Omit<DecorDef, 'sprites'>;
  reflection: boolean;
  sound: SkinDef['sound'];
  gameOver: string;
  ui: SkinDef['ui'];
  /** Palette-free swatches used for thumbnails and the designer. */
  colors: { sky: string; ground: string; ink: string };
}

/** Raw pixel buffers for every sprite role, before grouping and alignment. */
export interface SpriteBuffers {
  run: PixelBuffer[];
  jump: PixelBuffer;
  duck: PixelBuffer[];
  dead: PixelBuffer;
  idle: PixelBuffer[];
  small: PixelBuffer[][];
  large: PixelBuffer[][];
  flyer: PixelBuffer[];
  decor: PixelBuffer[];
}

export type ColorFn = (c: string) => string;

export interface GridIssue {
  where: string;
  message: string;
}

// ---------------------------------------------------------------- grids

export function gridToBuffer(grid: Grid, palette: Record<string, string>, where = '', issues?: GridIssue[]): PixelBuffer {
  const h = grid.length;
  const w = Math.max(1, ...grid.map((r) => r.length));
  const b = new PixelBuffer(w, h);
  const packed = new Map<string, number>();
  for (let y = 0; y < h; y++) {
    const row = grid[y];
    if (row.length !== w) issues?.push({ where, message: `row ${y} is ${row.length} wide, expected ${w}` });
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') continue;
      let c = packed.get(ch);
      if (c === undefined) {
        const hex = palette[ch];
        if (!hex) issues?.push({ where, message: `unknown palette key '${ch}' at row ${y}` });
        c = pack(hex ?? '#ff00ff');
        packed.set(ch, c);
      }
      b.set(x, y, c);
    }
  }
  return b;
}

export function gridsToBuffers(def: SkinDef, palette: Record<string, string>, issues?: GridIssue[]): SpriteBuffers {
  const g = (grid: Grid, where: string) => gridToBuffer(grid, palette, where, issues);
  const r = def.runner;
  return {
    run: r.run.map((f, i) => g(f, `runner.run[${i}]`)),
    jump: g(r.jump, 'runner.jump'),
    duck: r.duck.map((f, i) => g(f, `runner.duck[${i}]`)),
    dead: g(r.dead, 'runner.dead'),
    idle: (r.idle?.length ? r.idle : [r.jump]).map((f, i) => g(f, `runner.idle[${i}]`)),
    small: def.small.map((v, i) => v.map((f, j) => g(f, `small[${i}][${j}]`))),
    large: def.large.map((v, i) => v.map((f, j) => g(f, `large[${i}][${j}]`))),
    flyer: def.flyer.map((f, i) => g(f, `flyer[${i}]`)),
    decor: (def.decor?.sprites ?? []).map((f, i) => g(f, `decor[${i}]`)),
  };
}

// ---------------------------------------------------------------- alignment

function bottomGap(b: PixelBuffer): number {
  for (let y = b.h - 1; y >= 0; y--) for (let x = 0; x < b.w; x++) if (b.opaque(x, y)) return b.h - 1 - y;
  return b.h;
}

function maskOf(b: PixelBuffer): Uint8Array {
  const m = new Uint8Array(b.w * b.h);
  for (let i = 0; i < m.length; i++) m[i] = b.px[i] >>> 24 ? 1 : 0;
  return m;
}

/** Bottom-anchors a group of frames so their shared lowest pixel lines up. */
export function group(bufs: PixelBuffer[]): SpriteArt[] {
  const gap = Math.min(...bufs.map(bottomGap));
  return bufs.map((buf) => ({ buf, w: buf.w, h: buf.h, baseline: buf.h - (Number.isFinite(gap) ? gap : 0), mask: maskOf(buf) }));
}

/** Opaque bounds of a sprite in its own coordinates. */
export function bounds(b: PixelBuffer): { x0: number; y0: number; x1: number; y1: number } | null {
  let x0 = b.w, y0 = b.h, x1 = -1, y1 = -1;
  for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) {
    if (!b.opaque(x, y)) continue;
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  return x1 < 0 ? null : { x0, y0, x1, y1 };
}

// ---------------------------------------------------------------- night

export function nightFn(n: NightDef): ColorFn {
  if (n.mode === 'invert') return invert;
  return (c) => mix(c, n.tint, n.amount);
}

export function mapBuffer(b: PixelBuffer, fn: ColorFn): PixelBuffer {
  const cache = new Map<number, number>();
  return b.map((p) => {
    let o = cache.get(p);
    if (o === undefined) {
      const { r, g, b: bb } = unpack(p);
      o = pack(fn(toHex({ r, g, b: bb })));
      cache.set(p, o);
    }
    return o;
  });
}

export function mapSpriteBuffers(s: SpriteBuffers, fn: ColorFn): SpriteBuffers {
  const m = (b: PixelBuffer) => mapBuffer(b, fn);
  return {
    run: s.run.map(m), jump: m(s.jump), duck: s.duck.map(m), dead: m(s.dead), idle: s.idle.map(m),
    small: s.small.map((v) => v.map(m)), large: s.large.map((v) => v.map(m)),
    flyer: s.flyer.map(m), decor: s.decor.map(m),
  };
}

// ---------------------------------------------------------------- compile

export interface CompileOptions {
  /** Supplies sprites directly (custom skins) instead of reading grids from def. */
  sprites?: (night: boolean, fn: ColorFn) => SpriteBuffers;
  custom?: boolean;
  issues?: GridIssue[];
}

export function compileSkin(def: SkinDef, opts: CompileOptions = {}): SkinArt {
  const night = def.night;
  const fn = nightFn(night);
  const glow = new Set(night.mode === 'tint' ? night.glow ?? [] : []);
  const nightPalette: Record<string, string> = {};
  for (const [k, v] of Object.entries(def.palette)) nightPalette[k] = glow.has(k) ? v : fn(v);

  const daySprites = opts.sprites ? opts.sprites(false, (c) => c) : gridsToBuffers(def, def.palette, opts.issues);
  const nightSprites = opts.sprites ? opts.sprites(true, fn) : gridsToBuffers(def, nightPalette);

  const seed = hashString(def.id);
  const build = (isNight: boolean): VariantArt => {
    const s = isNight ? nightSprites : daySprites;
    const pal = isNight ? nightPalette : def.palette;
    const col = isNight ? fn : (c: string) => c;
    const standing = group([...s.run, s.jump, s.dead, ...s.idle]);
    const n = s.run.length;
    const layers: LayerArt[] = def.layers.map((l, i) => {
      if (l.kind === 'sprites') {
        const bufs = l.sprites.map((g, j) => gridToBuffer(g, pal, `layers[${i}].sprites[${j}]`, isNight ? undefined : opts.issues));
        return { buf: renderSpriteLayer(bufs, l.gap, l.seed ?? seed + i), baseline: l.baseline ?? 78, speed: l.speed };
      }
      const g: GenLayer = { ...l, color: col(l.color), accent: l.accent && (l.glow ? l.accent : col(l.accent)), seed: l.seed ?? seed + i };
      return { buf: renderLayer(g), baseline: l.baseline ?? 78, speed: l.speed };
    });
    const ground = renderGround({ ...def.ground, color: col(def.ground.color), line: col(def.ground.line), detail: col(def.ground.detail) }, seed);

    let sky = def.sky;
    let stars: string | undefined = def.stars;
    let celestial: CelestialDef | undefined = def.celestial;
    let weather: WeatherDef | undefined = def.weather;
    let aurora: [string, string] | undefined;
    let ink = def.ink;
    if (isNight) {
      if (night.mode === 'invert') {
        sky = { top: invert(def.sky.top), bottom: invert(def.sky.bottom) };
        stars = mix(invert(def.sky.top), '#ffffff', 0.55);
        celestial = { kind: 'crescent', x: 0.72, y: 20, r: 5, color: mix(invert(def.sky.top), '#ffffff', 0.8) };
        weather = weather && { ...weather, color: invert(weather.color), color2: weather.color2 && invert(weather.color2) };
        ink = invert(def.ink);
      } else {
        sky = night.sky;
        stars = night.stars ?? (def.stars && fn(def.stars));
        celestial = night.celestial === null ? undefined : night.celestial ?? (celestial && { ...celestial, color: fn(celestial.color), accent: celestial.accent && fn(celestial.accent) });
        weather = night.weather === null ? undefined : night.weather ?? (weather && { ...weather, color: fn(weather.color), color2: weather.color2 && fn(weather.color2) });
        aurora = night.aurora;
        ink = night.ink ?? fn(def.ink);
      }
    }
    return {
      runner: {
        run: standing.slice(0, n),
        jump: standing[n],
        dead: standing[n + 1],
        idle: standing.slice(n + 2),
        duck: group(s.duck),
      },
      small: s.small.map(group),
      large: s.large.map(group),
      flyer: group(s.flyer),
      decor: s.decor.map((b) => group([b])[0]),
      layers,
      ground,
      sky,
      stars,
      celestial: celestial && { buf: renderCelestial(celestial), x: celestial.x, y: celestial.y },
      weather,
      aurora,
      ink,
    };
  };

  const day = build(false);
  const nightArt = build(true);
  return {
    id: def.id,
    name: def.name,
    tagline: def.tagline,
    custom: !!opts.custom,
    day,
    night: nightArt,
    decor: def.decor && { y: def.decor.y, speed: def.decor.speed, every: def.decor.every },
    reflection: !!def.reflection,
    sound: def.sound,
    gameOver: def.gameOver,
    ui: def.ui,
    colors: { sky: def.sky.bottom, ground: def.ground.color, ink: def.ink },
  };
}
