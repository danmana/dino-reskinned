import { renderSky, addStars, GROUND_LIFT, GROUND_TILE_W, TILE_W } from '../render/art.ts';
import { toCanvas } from '../render/renderer.ts';
import type { SkinArt, SpriteArt } from '../render/compile.ts';
import { GROUND_Y, FLYER_LANES } from '../game/constants.ts';

const TW = 84;
const TH = 44;
const TOP = 44; // world row shown at the top of the thumbnail

/** A still frame of the skin: runner mid-stride, an obstacle, the horizon. */
export function thumbnail(art: SkinArt, into?: HTMLCanvasElement): HTMLCanvasElement {
  const c = into ?? document.createElement('canvas');
  c.width = TW;
  c.height = TH;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  const v = art.day;
  const sky = renderSky(TW, v.sky.top, v.sky.bottom);
  if (v.stars) addStars(sky, v.stars, 3);
  ctx.drawImage(toCanvas(sky), 0, -TOP);
  if (v.celestial) {
    const b = v.celestial.buf;
    ctx.drawImage(toCanvas(b), Math.round(TW * 0.8 - b.w / 2), Math.round(v.celestial.y - TOP + 8 - b.h / 2));
  }
  const scroll = 173;
  for (const l of v.layers) {
    const off = Math.floor(scroll * l.speed) % TILE_W;
    ctx.drawImage(toCanvas(l.buf), -off, l.baseline - l.buf.h - TOP);
  }
  ctx.drawImage(toCanvas(v.ground), -(scroll % GROUND_TILE_W), GROUND_Y - GROUND_LIFT - TOP);
  const put = (s: SpriteArt, x: number, footY: number) => ctx.drawImage(toCanvas(s.buf), x, footY - s.baseline - TOP);
  put(v.runner.run[0], 6, GROUND_Y);
  const lg = v.large[0]?.[0];
  if (lg) put(lg, 44, GROUND_Y);
  const sm = v.small[0]?.[0];
  if (sm) put(sm, 64, GROUND_Y);
  const fl = v.flyer[0];
  if (fl) put(fl, 60, GROUND_Y - FLYER_LANES[2] - 2);
  return c;
}

/** One sprite centred on a small patch of its own sky, for designer chips. */
export function spriteChip(s: SpriteArt | undefined, bg: string, size = 28): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);
  if (s) {
    const x = Math.round((size - s.w) / 2);
    const y = Math.round((size - s.baseline) / 2 + Math.max(0, (s.baseline - size) / 2));
    ctx.drawImage(toCanvas(s.buf), x, Math.min(y, size - s.baseline));
  }
  return c;
}
