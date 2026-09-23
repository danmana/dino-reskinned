// Renders a preview PNG for a skin: a day scene, a night scene and a sprite
// sheet, plus a text report of size-limit and contrast problems.
//
//   node scripts/sheet.ts <skin-id> [out.png]
//
// Reads src/skins/<skin-id>.ts and takes its SkinDef export.

import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PixelBuffer } from '../src/core/pixbuf.ts';
import { pack, mix, contrast } from '../src/core/color.ts';
import { drawText } from '../src/core/font.ts';
import { renderSky, addStars, drawAurora, TILE_W, GROUND_TILE_W, GROUND_LIFT } from '../src/render/art.ts';
import { compileSkin, bounds, type GridIssue, type SpriteArt, type VariantArt } from '../src/render/compile.ts';
import { GROUND_Y, H, RUNNER_X, FLYER_LANES } from '../src/game/constants.ts';
import { LIMITS, type SkinDef } from '../src/skins/types.ts';
import { writePng } from './png.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const id = process.argv[2];
if (!id) {
  console.error('usage: node scripts/sheet.ts <skin-id> [out.png]');
  process.exit(1);
}
const out = resolve(process.argv[3] ?? `${root}/.sheets/${id}.png`);
const mod = await import(pathToFileURL(`${root}/src/skins/${id}.ts`).href);
const def: SkinDef | undefined = Object.values(mod).find((v: any) => v && typeof v === 'object' && v.runner) as SkinDef;
if (!def) {
  console.error(`no SkinDef export found in src/skins/${id}.ts`);
  process.exit(1);
}

const issues: GridIssue[] = [];
const art = compileSkin(def, { issues });

// ------------------------------------------------------------ checks
const problems: string[] = issues.map((i) => `${i.where}: ${i.message}`);
const checkSize = (name: string, s: SpriteArt, lim: { w: number; h: number }) => {
  const bb = bounds(s.buf);
  if (!bb) { problems.push(`${name}: empty sprite`); return; }
  const w = bb.x1 - bb.x0 + 1, h = bb.y1 - bb.y0 + 1;
  if (w > lim.w || h > lim.h) problems.push(`${name}: ${w}x${h} exceeds ${lim.w}x${lim.h}`);
};
const d = art.day;
d.runner.run.forEach((s, i) => checkSize(`runner.run[${i}]`, s, LIMITS.runner));
checkSize('runner.jump', d.runner.jump, LIMITS.runner);
checkSize('runner.dead', d.runner.dead, LIMITS.runner);
d.runner.duck.forEach((s, i) => checkSize(`runner.duck[${i}]`, s, LIMITS.duck));
d.small.forEach((v, i) => v.forEach((s, j) => checkSize(`small[${i}][${j}]`, s, LIMITS.small)));
d.large.forEach((v, i) => v.forEach((s, j) => checkSize(`large[${i}][${j}]`, s, LIMITS.large)));
d.flyer.forEach((s, i) => checkSize(`flyer[${i}]`, s, LIMITS.flyer));
d.decor.forEach((s, i) => checkSize(`decor[${i}]`, s, LIMITS.decor));
// Running height must clear the high flyer lane; duck must clear the mid lane.
const standTop = Math.min(...d.runner.run.map((s) => s.baseline - (bounds(s.buf)?.y0 ?? 0)));
const runH = Math.max(...d.runner.run.map((s) => s.baseline - (bounds(s.buf)?.y0 ?? 0)));
const duckH = Math.max(...d.runner.duck.map((s) => s.baseline - (bounds(s.buf)?.y0 ?? 0)));
if (runH > FLYER_LANES[2]) problems.push(`running height ${runH} would hit the high flyer lane (${FLYER_LANES[2]})`);
if (duckH >= FLYER_LANES[1]) problems.push(`duck height ${duckH} would hit the mid flyer lane (${FLYER_LANES[1]})`);
if (def.flyer.length < 2) problems.push('flyer needs 2 frames');
// Frames in one animation group are bottom-aligned together; unequal grid heights make some float.
const sameHeight = (name: string, grids: string[][]) => {
  const hs = [...new Set(grids.map((g) => g.length))];
  if (hs.length > 1) problems.push(`${name}: frames have different grid heights (${hs.join(', ')}); shorter frames will float`);
};
sameHeight('runner run/jump/dead/idle', [...def.runner.run, def.runner.jump, def.runner.dead, ...(def.runner.idle ?? [])]);
sameHeight('runner.duck', def.runner.duck);
sameHeight('flyer', def.flyer);
def.small.forEach((v, i) => sameHeight(`small[${i}]`, v));
def.large.forEach((v, i) => sameHeight(`large[${i}]`, v));
const inkC = Math.min(contrast(def.ink, def.sky.top), contrast(def.ink, def.sky.bottom));
if (inkC < 3) problems.push(`ink ${def.ink} contrast vs sky is ${inkC.toFixed(2)} (want ≥ 3)`);
const inkN = Math.min(contrast(art.night.ink, art.night.sky.top), contrast(art.night.ink, art.night.sky.bottom));
if (inkN < 3) problems.push(`night ink ${art.night.ink} contrast vs night sky is ${inkN.toFixed(2)} (want ≥ 3)`);
const uiC = contrast(def.ui.fg, def.ui.bg);
if (uiC < 4.5) problems.push(`ui fg/bg contrast is ${uiC.toFixed(2)} (want ≥ 4.5)`);
if (def.gameOver.length > 14) problems.push(`gameOver '${def.gameOver}' is longer than 14 characters`);
void standTop;

// ------------------------------------------------------------ scene
function scene(v: VariantArt, W: number, scroll: number): PixelBuffer {
  const b = renderSky(W, v.sky.top, v.sky.bottom);
  if (v.stars) addStars(b, v.stars);
  if (v.aurora) {
    const cols = v.aurora.map((c) => pack(c));
    drawAurora(W, 600, (x, y, c) => b.set(x, y, cols[c]));
  }
  if (v.celestial) b.blit(v.celestial.buf, Math.round(v.celestial.x * W - v.celestial.buf.w / 2), Math.round(v.celestial.y - v.celestial.buf.h / 2));
  v.decor.forEach((s, i) => b.blit(s.buf, 40 + i * 110, 10 + (i % 2) * 12));
  if (v.decor.length === 1) b.blit(v.decor[0].buf, 190, 20);
  for (const l of v.layers) {
    const off = Math.floor(scroll * l.speed) % TILE_W;
    for (let x = -off; x < W; x += TILE_W) b.blit(l.buf, x, l.baseline - l.buf.h);
  }
  const goff = scroll % GROUND_TILE_W;
  for (let x = -goff; x < W; x += GROUND_TILE_W) b.blit(v.ground, x, GROUND_Y - GROUND_LIFT);

  const place = (s: SpriteArt, x: number, footY: number) => {
    b.blit(s.buf, x, footY - s.baseline);
    if (art.reflection) {
      const flipped = new PixelBuffer(s.w, s.h);
      flipped.blit(s.buf, 0, 0, false, true);
      const dim = flipped.map((p) => {
        const c = `#${(p & 255).toString(16).padStart(2, '0')}${((p >>> 8) & 255).toString(16).padStart(2, '0')}${((p >>> 16) & 255).toString(16).padStart(2, '0')}`;
        return pack(mix(c, v.sky.bottom, 0.55));
      });
      // Mirror about the ground line, as the game does; only the part below it shows.
      const y0 = footY - s.baseline;
      for (let y = 0; y < s.h; y++) for (let x2 = 0; x2 < s.w; x2++) {
        const ry = 2 * GROUND_Y - (y0 + y);
        if (ry > GROUND_Y && s.buf.opaque(x2, y) && (x2 + ry) % 2 === 0) b.set(x + x2, ry, dim.get(x2, s.h - 1 - y));
      }
    }
  };
  place(v.runner.run[0], RUNNER_X, GROUND_Y);
  const unit = (arr: SpriteArt[][], vi: number) => arr[vi % arr.length][0];
  place(unit(v.small, 0), 80, GROUND_Y);
  place(unit(v.small, 1), 89, GROUND_Y);
  place(unit(v.large, 0), 128, GROUND_Y);
  place(unit(v.small, 2), 152, GROUND_Y);
  place(unit(v.large, 1), 176, GROUND_Y);
  place(unit(v.large, 2), 189, GROUND_Y);
  place(v.flyer[0], 212, GROUND_Y - FLYER_LANES[1]);
  place(v.flyer[1], 250, GROUND_Y - FLYER_LANES[2]);
  place(v.runner.duck[0], 280, GROUND_Y);
  drawText(b, '00042', W - 34, 4, v.ink);
  return b;
}

function sheet(v: VariantArt): PixelBuffer {
  const rows: { label: string; sprites: SpriteArt[] }[] = [
    { label: 'RUN JUMP DEAD IDLE', sprites: [...v.runner.run, v.runner.jump, v.runner.dead, ...v.runner.idle] },
    { label: 'DUCK', sprites: v.runner.duck },
    { label: 'SMALL', sprites: v.small.flat() },
    { label: 'LARGE', sprites: v.large.flat() },
    { label: 'FLYER', sprites: v.flyer },
    { label: 'DECOR', sprites: v.decor },
  ];
  const pad = 4;
  const W = 320;
  let hgt = pad;
  for (const r of rows) hgt += 9 + Math.max(4, ...r.sprites.map((s) => s.h)) + pad * 2;
  const b = new PixelBuffer(W, hgt);
  b.fill(pack(mix(v.sky.bottom, v.ground.data.length ? v.sky.bottom : '#ffffff', 0)));
  const guide = pack(mix(v.sky.bottom, v.ink, 0.2));
  let y = pad;
  for (const r of rows) {
    drawText(b, r.label, pad, y, v.ink);
    y += 9;
    let x = pad;
    const rh = Math.max(4, ...r.sprites.map((s) => s.h));
    for (const s of r.sprites) {
      if (x + s.w > W - pad) break;
      b.hline(x - 1, x + s.w, y + rh, guide);
      b.blit(s.buf, x, y + rh - s.baseline);
      x += s.w + 6;
    }
    y += rh + pad * 2;
  }
  return b;
}

function upscale(src: PixelBuffer, k: number): PixelBuffer {
  const b = new PixelBuffer(src.w * k, src.h * k);
  for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) b.px[y * b.w + x] = src.px[Math.floor(y / k) * src.w + Math.floor(x / k)];
  return b;
}

const K = 4;
const parts = [upscale(scene(art.day, 320, 137), K), upscale(scene(art.night, 320, 391), K), upscale(sheet(art.day), K)];
const total = new PixelBuffer(320 * K, parts.reduce((s, p) => s + p.h + 8, 0));
total.fill(pack('#202020'));
let yy = 0;
for (const p of parts) { total.blit(p, 0, yy); yy += p.h + 8; }
mkdirSync(dirname(out), { recursive: true });
writePng(out, total);

console.log(`${def.name}: wrote ${out}`);
console.log(`  runner ${runH}px tall running, duck ${duckH}px; ${d.small.length} small, ${d.large.length} large variants`);
if (problems.length) {
  console.log(`  ${problems.length} problem(s):`);
  for (const p of problems) console.log(`   - ${p}`);
} else console.log('  no problems');
void H;
