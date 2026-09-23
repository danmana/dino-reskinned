// Renders public/og.png (1200x630): one panorama that sweeps through several
// skins with the same dithered edge the game uses when you switch mid-run.
//   node scripts/og.ts
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PixelBuffer } from '../src/core/pixbuf.ts';
import { pack } from '../src/core/color.ts';
import { bayer } from '../src/core/dither.ts';
import { drawText, textWidth } from '../src/core/font.ts';
import { renderSky, addStars, TILE_W, GROUND_TILE_W, GROUND_LIFT } from '../src/render/art.ts';
import { compileSkin, type SpriteArt, type VariantArt } from '../src/render/compile.ts';
import { GROUND_Y, H, FLYER_LANES } from '../src/game/constants.ts';
import { PRESETS } from '../src/skins/index.ts';
import { writePng } from './png.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const W = 300;
const order = ['original', 'wildwest', 'tokyo', 'deepsea', 'dragons', 'polar'];
const skins = order.map((id) => PRESETS.find((p) => p.id === id)).filter((p) => !!p).map((p) => compileSkin(p!));

function scene(v: VariantArt, bandX: number): PixelBuffer {
  const b = renderSky(W, v.sky.top, v.sky.bottom);
  if (v.stars) addStars(b, v.stars);
  if (v.celestial) b.blit(v.celestial.buf, Math.round(bandX + 26 - v.celestial.buf.w / 2), Math.round(v.celestial.y - v.celestial.buf.h / 2));
  const scroll = 211;
  for (const l of v.layers) {
    const off = Math.floor(scroll * l.speed) % TILE_W;
    for (let x = -off; x < W; x += TILE_W) b.blit(l.buf, x, l.baseline - l.buf.h);
  }
  for (let x = -(scroll % GROUND_TILE_W); x < W; x += GROUND_TILE_W) b.blit(v.ground, x, GROUND_Y - GROUND_LIFT);
  const put = (s: SpriteArt | undefined, x: number, foot: number) => s && b.blit(s.buf, x, foot - s.baseline);
  // The runner mid-jump over a cactus, repeated in every band so the sweep reads as one run.
  put(v.runner.jump, bandX + 8, GROUND_Y - 16);
  put(v.large[0]?.[0], bandX + 22, GROUND_Y);
  put(v.flyer[0], bandX + 34, GROUND_Y - FLYER_LANES[2] - 8);
  return b;
}

const band = W / skins.length;
const scenes = skins.map((a, i) => scene(i % 2 ? a.night : a.day, i * band));
const strip = new PixelBuffer(W, H);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  let i = Math.floor(x / band);
  const within = (x - i * band) / band;
  if (within < 0.08 && i > 0 && bayer(x, y) > within / 0.08) i -= 1;
  strip.px[y * W + x] = scenes[i].px[y * W + x];
}

const K = 4;
const out = new PixelBuffer(1200, 630);
out.fill(pack('#f7f7f7'));
for (let y = 0; y < H * K; y++) for (let x = 0; x < W * K; x++) out.px[y * 1200 + x] = strip.px[Math.floor(y / K) * W + Math.floor(x / K)];

const title = new PixelBuffer(150, 12);
title.fill(pack('#f7f7f7'));
drawText(title, 'DINO', 0, 2, '#535353');
drawText(title, 'RESKINNED', textWidth('DINO') + 6, 2, '#9a9a9a');
const sub = new PixelBuffer(300, 10);
sub.fill(pack('#f7f7f7'));
drawText(sub, 'ELEVEN WORLDS. SWITCH MID-RUN. MAKE YOUR OWN.', 0, 1, '#7a7a7a');
const blitScaled = (src: PixelBuffer, k: number, ox: number, oy: number) => {
  for (let y = 0; y < src.h * k; y++) for (let x = 0; x < src.w * k; x++) {
    const tx = ox + x, ty = oy + y;
    if (tx < 1200 && ty < 630) out.px[ty * 1200 + tx] = src.px[Math.floor(y / k) * src.w + Math.floor(x / k)];
  }
};
blitScaled(title, 8, 56, 420);
blitScaled(sub, 3, 60, 540);
writePng(`${root}/public/og.png`, out);
console.log(`wrote public/og.png with ${skins.length} skins`);
