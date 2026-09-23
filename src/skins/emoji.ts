import { PixelBuffer } from '../core/pixbuf.ts';
import { pack, mix, toHex, luminance } from '../core/color.ts';

// Turns any emoji into outlined pixel art: render big, find its bounds,
// box-filter down to the target size, cluster the colours, add an outline.

const cache = new Map<string, PixelBuffer>();

export interface EmojiOpts {
  flip?: boolean;
  /** Horizontal stretch relative to the aspect-correct width (duck frames use > 1). */
  stretch?: number;
}

export function rasterEmoji(emoji: string, maxW: number, maxH: number, opts: EmojiOpts = {}): PixelBuffer {
  const key = `${emoji}|${maxW}|${maxH}|${opts.flip ? 1 : 0}|${opts.stretch ?? 1}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const S = 176;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const g = c.getContext('2d', { willReadFrequently: true })!;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = '128px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Twemoji Mozilla",sans-serif';
  g.fillText(emoji || '?', S / 2, S / 2 + 6);
  const src = g.getImageData(0, 0, S, S).data;

  let x0 = S, y0 = S, x1 = -1, y1 = -1;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    if (src[(y * S + x) * 4 + 3] > 40) {
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  if (x1 < 0) {
    const b = new PixelBuffer(Math.min(maxW, 8), Math.min(maxH, 8));
    b.fill(pack('#888888'));
    cache.set(key, b);
    return b;
  }
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
  const innerW = maxW - 2, innerH = maxH - 2;
  let s = Math.min(innerW / bw, innerH / bh);
  const sx = Math.min(innerW / bw, s * (opts.stretch ?? 1));
  const sy = s;
  const tw = Math.max(1, Math.round(bw * sx)), th = Math.max(1, Math.round(bh * sy));

  // Box-filter each target pixel from its source footprint.
  const rgb: [number, number, number][] = [];
  const idx = new Int32Array(tw * th).fill(-1);
  for (let ty = 0; ty < th; ty++) {
    for (let tx = 0; tx < tw; tx++) {
      const fx0 = x0 + (tx / tw) * bw, fx1 = x0 + ((tx + 1) / tw) * bw;
      const fy0 = y0 + (ty / th) * bh, fy1 = y0 + ((ty + 1) / th) * bh;
      let r = 0, gg = 0, b = 0, a = 0, n = 0;
      for (let y = Math.floor(fy0); y < Math.ceil(fy1); y++) for (let x = Math.floor(fx0); x < Math.ceil(fx1); x++) {
        const i = (y * S + x) * 4;
        const al = src[i + 3];
        r += src[i] * al; gg += src[i + 1] * al; b += src[i + 2] * al; a += al; n++;
      }
      if (n && a / (n * 255) > 0.42) {
        idx[ty * tw + tx] = rgb.length;
        rgb.push([r / a, gg / a, b / a]);
      }
    }
  }

  // k-means down to a handful of colours for a pixel-art palette.
  const k = Math.min(6, rgb.length);
  const centers = Array.from({ length: k }, (_, i) => [...rgb[Math.floor((i / k) * rgb.length)]] as [number, number, number]);
  const assign = new Int32Array(rgb.length);
  for (let iter = 0; iter < 8; iter++) {
    for (let i = 0; i < rgb.length; i++) {
      let best = 0, bd = Infinity;
      for (let j = 0; j < k; j++) {
        const d = (rgb[i][0] - centers[j][0]) ** 2 + (rgb[i][1] - centers[j][1]) ** 2 + (rgb[i][2] - centers[j][2]) ** 2;
        if (d < bd) { bd = d; best = j; }
      }
      assign[i] = best;
    }
    const sum = centers.map(() => [0, 0, 0, 0]);
    for (let i = 0; i < rgb.length; i++) { const s4 = sum[assign[i]]; s4[0] += rgb[i][0]; s4[1] += rgb[i][1]; s4[2] += rgb[i][2]; s4[3]++; }
    sum.forEach((s4, j) => { if (s4[3]) centers[j] = [s4[0] / s4[3], s4[1] / s4[3], s4[2] / s4[3]]; });
  }
  const hexes = centers.map(([r, gg, b]) => toHex({ r, g: gg, b }));
  const darkest = hexes.reduce((a, b) => (luminance(a) < luminance(b) ? a : b), hexes[0] ?? '#333333');
  const outline = pack(mix(darkest, '#000000', 0.55));

  const out = new PixelBuffer(tw + 2, th + 2);
  for (let ty = 0; ty < th; ty++) for (let tx = 0; tx < tw; tx++) {
    const i = idx[ty * tw + tx];
    if (i < 0) continue;
    const dx = opts.flip ? tw - 1 - tx : tx;
    out.set(dx + 1, ty + 1, pack(hexes[assign[i]]));
  }
  const solid = out.clone();
  for (let y = 0; y < out.h; y++) for (let x = 0; x < out.w; x++) {
    if (solid.opaque(x, y)) continue;
    if (solid.opaque(x - 1, y) || solid.opaque(x + 1, y) || solid.opaque(x, y - 1) || solid.opaque(x, y + 1)) out.set(x, y, outline);
  }
  cache.set(key, out);
  void s;
  return out;
}

/** Pads a buffer into a taller canvas at a vertical offset (for bobbing frames). */
export function padTo(b: PixelBuffer, w: number, h: number, dy: number, dx = 0): PixelBuffer {
  const o = new PixelBuffer(w, h);
  o.blit(b, dx, dy);
  return o;
}

export function flipV(b: PixelBuffer): PixelBuffer {
  const o = new PixelBuffer(b.w, b.h);
  o.blit(b, 0, 0, false, true);
  return o;
}

export function stackV(b: PixelBuffer, times: number): PixelBuffer {
  const o = new PixelBuffer(b.w, b.h * times - (times - 1));
  for (let i = 0; i < times; i++) o.blit(b, 0, i * (b.h - 1));
  return o;
}

/** Emoji segmentation that keeps flags, skin tones and ZWJ sequences whole. */
export function firstGrapheme(s: string): string {
  const Seg = (Intl as unknown as { Segmenter?: new (l?: string, o?: { granularity: string }) => { segment(s: string): Iterable<{ segment: string }> } }).Segmenter;
  if (Seg) for (const part of new Seg(undefined, { granularity: 'grapheme' }).segment(s.trim())) return part.segment;
  return Array.from(s.trim())[0] ?? '';
}
