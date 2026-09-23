import { PixelBuffer } from '../core/pixbuf.ts';
import { contrast, hsl, lighten, luminance, mix } from '../core/color.ts';
import { compileSkin, gridsToBuffers, mapSpriteBuffers, type ColorFn, type SkinArt, type SpriteBuffers } from '../render/compile.ts';
import { flipV, padTo, rasterEmoji, stackV } from './emoji.ts';
import { decodePixels, flipH, resampleNearest } from './pixelate.ts';
import { LIMITS, type CelestialKind, type GenLayer, type GroundStyle, type LayerDef, type LayerKind, type SkinDef, type SoundPreset, type WeatherDef, type WeatherKind } from './types.ts';

// A custom skin is a short recipe: who plays each role (a preset's sprite or
// any emoji), six colours, and a few world choices. It is small enough to
// live in a share link.

export type Role = 'runner' | 'small' | 'large' | 'flyer' | 'decor';
export const ROLES: Role[] = ['runner', 'small', 'large', 'flyer', 'decor'];

/**
 * `image` and `duck` hold pixelated pictures in the compact "WxH:palette:pixels"
 * form from pixelate.ts, so a custom skin with uploads still fits in a link.
 */
export type CastSource =
  | { preset: string }
  | { emoji: string; flip?: boolean }
  | { image: string; flip?: boolean; duck?: string }
  | { none: true };

/** Exact sprite boxes for uploaded pictures: the game's size limits for each role. */
export const ROLE_BOX: Record<Role | 'duck', { w: number; h: number }> = {
  runner: LIMITS.runner,
  duck: LIMITS.duck,
  small: LIMITS.small,
  large: LIMITS.large,
  flyer: LIMITS.flyer,
  decor: LIMITS.decor,
};

export interface CustomSkin {
  v: 1;
  id: string;
  name: string;
  cast: Record<Role, CastSource>;
  colors: { skyTop: string; skyBottom: string; far: string; near: string; ground: string; ink: string };
  /** Repaint preset sprites in shades of the ink colour, so mixed casts match. */
  inkCast: boolean;
  far: LayerKind | 'none';
  near: LayerKind | 'none';
  ground: GroundStyle;
  weather: WeatherKind | 'none';
  celestial: CelestialKind | 'none';
  sound: SoundPreset;
}

export const LAYER_CHOICES: LayerKind[] = ['hills', 'mountains', 'mesas', 'dunes', 'city', 'forest', 'castle', 'pagodas', 'houses', 'kelp', 'coral', 'graves', 'candy', 'craters', 'icebergs', 'ruins', 'rocks', 'fence'];
export const GROUND_CHOICES: GroundStyle[] = ['line', 'sand', 'grass', 'road', 'wet', 'rails', 'snow', 'ice', 'rock', 'cobble', 'moon', 'seabed', 'sidewalk', 'frosting'];
export const WEATHER_CHOICES: (WeatherKind | 'none')[] = ['none', 'snow', 'rain', 'bubbles', 'embers', 'dust', 'petals', 'leaves', 'fireflies', 'sparkles', 'confetti', 'ash', 'fog', 'meteors'];
export const CELESTIAL_CHOICES: (CelestialKind | 'none')[] = ['none', 'sun', 'moon', 'crescent', 'earth', 'planet', 'ringed', 'synthsun'];
export const SOUND_CHOICES: SoundPreset[] = ['chip', 'twang', 'neon', 'bubble', 'bleat', 'roar', 'chime', 'blip', 'spooky', 'sweet', 'honk'];

const GLOWY: LayerKind[] = ['city', 'houses', 'castle', 'pagodas'];

const WEATHER_COLORS: Record<WeatherKind, [string, string]> = {
  snow: ['#ffffff', '#dfe9f5'], rain: ['#bcd7ff', '#8fb6e8'], bubbles: ['#d8f4ff', '#ffffff'], embers: ['#ffb347', '#ff5a1f'],
  dust: ['#e9d3a8', '#c9a878'], petals: ['#ffc2d6', '#ff8fb3'], leaves: ['#e0892b', '#b5541c'], fireflies: ['#fff27a', '#ffffff'],
  sparkles: ['#ffffff', '#fff3a8'], confetti: ['#ff5a8a', '#5ad1ff'], ash: ['#a8a29a', '#7d766e'], fog: ['#dfe3ea', '#ffffff'], meteors: ['#ffffff', '#ffd98a'],
};

export function newId(): string {
  return `my-${Math.random().toString(36).slice(2, 8)}`;
}

/** A recipe that reproduces a preset as closely as the recipe allows. */
export function fromPreset(def: SkinDef): CustomSkin {
  const gen = def.layers.filter((l): l is GenLayer => l.kind !== 'sprites');
  const far = gen[0];
  const near = gen.length > 1 ? gen[gen.length - 1] : undefined;
  return {
    v: 1,
    id: newId(),
    name: `My ${def.name}`,
    cast: { runner: { preset: def.id }, small: { preset: def.id }, large: { preset: def.id }, flyer: { preset: def.id }, decor: def.decor ? { preset: def.id } : { none: true } },
    colors: {
      skyTop: def.sky.top,
      skyBottom: def.sky.bottom,
      far: far?.color ?? mix(def.sky.bottom, def.ink, 0.25),
      near: near?.color ?? mix(def.sky.bottom, def.ink, 0.45),
      ground: def.ground.color,
      ink: def.ink,
    },
    inkCast: false,
    far: far?.kind ?? 'none',
    near: near?.kind ?? 'none',
    ground: def.ground.style,
    weather: def.weather?.kind ?? 'none',
    celestial: def.celestial?.kind ?? 'none',
    sound: def.sound,
  };
}

function inkFn(ink: string, bg: string): ColorFn {
  return (c) => {
    const l = luminance(c);
    if (l > 0.55) return mix(ink, bg, 0.78);
    if (l > 0.18) return mix(ink, bg, 0.38);
    return ink;
  };
}

function presetBuffers(presets: Map<string, SkinDef>, id: string): SpriteBuffers {
  const def = presets.get(id) ?? presets.values().next().value!;
  return gridsToBuffers(def, def.palette);
}

function emojiBuffers(e: string, flip: boolean, role: Role): Partial<SpriteBuffers> {
  switch (role) {
    case 'runner': {
      const base = rasterEmoji(e, 26, 22, { flip });
      const tall = (dy: number) => padTo(base, base.w, base.h + 1, dy);
      const duck = rasterEmoji(e, 30, 12, { flip, stretch: 1.35 });
      return { run: [tall(1), tall(0)], jump: tall(1), dead: padTo(flipV(base), base.w, base.h + 1, 1), idle: [tall(1)], duck: [duck, duck] };
    }
    case 'small':
      return { small: [[rasterEmoji(e, 11, 17, { flip })]] };
    case 'large':
      return { large: [[stackV(rasterEmoji(e, 15, 13, { flip }), 2)]] };
    case 'flyer': {
      const base = rasterEmoji(e, 24, 17, { flip });
      return { flyer: [padTo(base, base.w, base.h + 1, 1), padTo(base, base.w, base.h + 1, 0)] };
    }
    case 'decor':
      return { decor: [rasterEmoji(e, 30, 14, { flip })] };
  }
}

function imageBuffers(src: { image: string; flip?: boolean; duck?: string }, role: Role): Partial<SpriteBuffers> {
  const box = ROLE_BOX[role];
  const raw = decodePixels(src.image, box.w, box.h) ?? new PixelBuffer(1, 1);
  const base = src.flip ? flipH(raw) : raw;
  // Frames bob by a pixel when there is headroom inside the box.
  const bob = base.h < box.h ? 1 : 0;
  const frame = (dy: number) => padTo(base, base.w, base.h + bob, dy);
  switch (role) {
    case 'runner': {
      const drawn = src.duck ? decodePixels(src.duck, ROLE_BOX.duck.w, ROLE_BOX.duck.h) : null;
      const duck = drawn
        ? (src.flip ? flipH(drawn) : drawn)
        : resampleNearest(base, Math.min(ROLE_BOX.duck.w, Math.round(base.w * 1.25)), Math.min(ROLE_BOX.duck.h - 1, Math.max(4, Math.round(base.h * 0.5))));
      return { run: [frame(bob), frame(0)], jump: frame(bob), dead: padTo(flipV(base), base.w, base.h + bob, bob), idle: [frame(bob)], duck: [duck, duck] };
    }
    case 'small':
      return { small: [[base]] };
    case 'large':
      return { large: [[base]] };
    case 'flyer':
      return { flyer: [frame(bob), frame(0)] };
    case 'decor':
      return { decor: [base] };
  }
}

function castBuffers(c: CustomSkin, presets: Map<string, SkinDef>): SpriteBuffers {
  const out: SpriteBuffers = { run: [], jump: new PixelBuffer(1, 1), duck: [], dead: new PixelBuffer(1, 1), idle: [], small: [], large: [], flyer: [], decor: [] };
  const recolor = c.inkCast ? inkFn(c.colors.ink, c.colors.skyBottom) : null;
  for (const role of ROLES) {
    const src = c.cast[role];
    let part: Partial<SpriteBuffers>;
    if ('none' in src) continue;
    if ('emoji' in src) part = emojiBuffers(src.emoji, !!src.flip, role);
    else if ('image' in src) part = imageBuffers(src, role);
    else {
      const all = presetBuffers(presets, src.preset);
      const pick: Record<Role, (keyof SpriteBuffers)[]> = { runner: ['run', 'jump', 'duck', 'dead', 'idle'], small: ['small'], large: ['large'], flyer: ['flyer'], decor: ['decor'] };
      const mapped = recolor ? mapSpriteBuffers(all, recolor) : all;
      part = {};
      for (const k of pick[role]) (part as Record<string, unknown>)[k] = mapped[k];
    }
    Object.assign(out, part);
  }
  if (!out.small.length) out.small = [[new PixelBuffer(1, 1)]];
  if (!out.large.length) out.large = [[new PixelBuffer(1, 1)]];
  if (!out.flyer.length) out.flyer = [new PixelBuffer(1, 1), new PixelBuffer(1, 1)];
  return out;
}

export function customDef(c: CustomSkin): SkinDef {
  const { skyTop, skyBottom, far, near, ground, ink } = c.colors;
  const dark = luminance(skyBottom) < 0.25;
  const layers: LayerDef[] = [];
  if (c.far !== 'none') layers.push({ kind: c.far, color: far, accent: GLOWY.includes(c.far) ? mix(far, '#ffe9a8', 0.75) : lighten(far, dark ? 0.2 : 0.3), height: 40, speed: 0.12, glow: GLOWY.includes(c.far) });
  if (c.near !== 'none') layers.push({ kind: c.near, color: near, accent: GLOWY.includes(c.near) ? mix(near, '#ffe9a8', 0.7) : lighten(near, dark ? 0.2 : 0.28), height: 24, speed: 0.34, glow: GLOWY.includes(c.near) });
  const weather: WeatherDef | undefined = c.weather === 'none' ? undefined : { kind: c.weather, color: WEATHER_COLORS[c.weather][0], color2: WEATHER_COLORS[c.weather][1], density: 0.6 };
  const celestialColor = c.celestial === 'sun' ? '#fff1b8' : c.celestial === 'synthsun' ? '#ffd23f' : c.celestial === 'earth' ? '#3f7fd6' : '#efeadb';
  const celestialAccent = c.celestial === 'sun' ? mix('#fff1b8', skyBottom, 0.4) : c.celestial === 'synthsun' ? '#ff3c8e' : c.celestial === 'earth' ? '#4fae5a' : '#cfc8b0';
  const uiBg = mix(skyBottom, dark ? '#000000' : '#ffffff', 0.25);
  const uiFg = contrast(ink, uiBg) >= 4.5 ? ink : luminance(uiBg) > 0.4 ? '#1d1d1f' : '#f4f4f6';
  return {
    id: c.id,
    name: c.name.trim() || 'Untitled skin',
    tagline: 'Made in the skin designer.',
    palette: {},
    runner: { run: [[], []], jump: [], duck: [[], []], dead: [] },
    small: [],
    large: [],
    flyer: [],
    decor: 'none' in c.cast.decor ? undefined : { sprites: [], y: [6, 30], speed: 0.15, every: [70, 200] },
    sky: { top: skyTop, bottom: skyBottom },
    stars: c.celestial === 'earth' || c.celestial === 'ringed' ? mix(skyTop, '#ffffff', 0.7) : undefined,
    celestial: c.celestial === 'none' ? undefined : { kind: c.celestial, x: 0.78, y: 22, r: c.celestial === 'synthsun' ? 12 : 7, color: celestialColor, accent: celestialAccent },
    layers,
    ground: { style: c.ground, color: ground, line: mix(ground, ink, 0.5), detail: mix(ground, ink, 0.3) },
    weather,
    night: {
      mode: 'tint',
      sky: { top: mix(skyTop, '#03061a', 0.82), bottom: mix(skyBottom, '#0b1236', 0.78) },
      tint: '#0d1440',
      amount: 0.5,
      stars: '#e6ebff',
      celestial: { kind: 'crescent', x: 0.78, y: 20, r: 6, color: '#ece8d6' },
      ink: '#e6ebff',
    },
    ink,
    sound: c.sound,
    gameOver: 'GAME OVER',
    ui: { bg: uiBg, fg: uiFg, accent: mix(ink, far, 0.3) },
  };
}

export function buildCustomArt(c: CustomSkin, presets: Map<string, SkinDef>): SkinArt {
  const day = castBuffers(c, presets);
  return compileSkin(customDef(c), {
    custom: true,
    sprites: (night, fn) => (night ? mapSpriteBuffers(day, fn) : day),
  });
}

// ---------------------------------------------------------------- randomise

const RUNNERS = ['🐸', '🦆', '🐧', '🦖', '🐈', '🐕', '🦄', '🐢', '🦀', '🐙', '🦊', '🐼', '🐔', '🐇', '🦩', '🐌', '🤖', '👻', '🦕', '🦔'];
const OBST = ['🌵', '🍄', '🗿', '⛄', '🧁', '🌮', '🍕', '🥑', '🧊', '🌲', '📦', '🧱', '🪨', '🎃', '🗼'];
const FLY = ['🦅', '🦇', '🐝', '🛸', '🚀', '🐉', '🎈', '🪼', '🐟', '🦈'];
const SKY = ['☁️', '⭐', '🌈', '🪐', '🎈'];

const pickOf = <T,>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)];

export function randomColors(): CustomSkin['colors'] {
  const h = Math.random() * 360;
  const night = Math.random() < 0.3;
  const spread = 20 + Math.random() * 40;
  if (night) {
    return {
      skyTop: hsl(h, 0.55, 0.08), skyBottom: hsl(h + spread, 0.5, 0.2),
      far: hsl(h + spread * 1.5, 0.35, 0.26), near: hsl(h + spread * 2, 0.35, 0.16),
      ground: hsl(h + 180, 0.2, 0.12), ink: hsl(h + 180, 0.7, 0.82),
    };
  }
  return {
    skyTop: hsl(h, 0.55, 0.72), skyBottom: hsl(h + spread, 0.6, 0.9),
    far: hsl(h + spread * 1.6, 0.3, 0.72), near: hsl(h + spread * 2.2, 0.35, 0.55),
    ground: hsl(h + spread * 3, 0.3, 0.62), ink: hsl(h + 200, 0.45, 0.22),
  };
}

export function randomize(c: CustomSkin, presetIds: string[]): CustomSkin {
  const src = (list: string[]): CastSource => (Math.random() < 0.55 ? { emoji: pickOf(list), flip: list === RUNNERS } : { preset: pickOf(presetIds) });
  return {
    ...c,
    cast: {
      runner: src(RUNNERS),
      small: src(OBST),
      large: src(OBST),
      flyer: src(FLY),
      decor: Math.random() < 0.2 ? { none: true } : src(SKY),
    },
    colors: randomColors(),
    inkCast: Math.random() < 0.35,
    far: pickOf(LAYER_CHOICES.filter((k) => k !== 'fence')),
    near: Math.random() < 0.25 ? 'none' : pickOf(LAYER_CHOICES),
    ground: pickOf(GROUND_CHOICES),
    weather: Math.random() < 0.3 ? 'none' : pickOf(WEATHER_CHOICES),
    celestial: pickOf(CELESTIAL_CHOICES),
    sound: pickOf(SOUND_CHOICES),
  };
}

// ---------------------------------------------------------------- sharing

const b64url = (bytes: Uint8Array) => {
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromB64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (ch) => ch.charCodeAt(0));

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

/** Share-link payload: "z" + deflated JSON when the browser can compress, else plain JSON. */
export async function encodeSkin(c: CustomSkin): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(c));
  if (typeof CompressionStream === 'undefined') return b64url(json);
  return 'z' + b64url(await pipe(json, new CompressionStream('deflate-raw')));
}

export async function decodeSkin(s: string): Promise<CustomSkin | null> {
  try {
    const bytes = s.startsWith('z') ? await pipe(fromB64url(s.slice(1)), new DecompressionStream('deflate-raw')) : fromB64url(s);
    const c = JSON.parse(new TextDecoder().decode(bytes)) as CustomSkin;
    if (c?.v !== 1 || !c.cast || !c.colors) return null;
    c.name = String(c.name ?? '').slice(0, 22);
    return c;
  } catch {
    return null;
  }
}
