import { PixelBuffer } from '../core/pixbuf.ts';
import { pack, unpack, mix, toHex, luminance } from '../core/color.ts';

// Turns any picture into a sprite that fits a role's box. Pure functions over
// RGBA arrays, so they run in Node as well as the browser.
//
// Three cases:
//  - pixel art exported at k× (every k×k block one colour) is shrunk back to 1×;
//  - pixel art that already fits the box is copied pixel for pixel;
//  - anything else is box-filtered down, clustered to a small palette and outlined.

export interface RGBAImage {
  w: number;
  h: number;
  data: Uint8ClampedArray;
}

export interface PixelateOptions {
  maxW: number;
  maxH: number;
  /** A 1px dark outline, inside the box. 'auto' outlines scaled pictures only. */
  outline?: boolean | 'auto';
  /** Flood-fill the border colour to transparent (for pictures on a plain background). */
  removeBg?: boolean;
  /** Palette size for scaled pictures (the outline adds one more). */
  colors?: number;
  /** Horizontal stretch relative to the aspect-correct width. */
  stretch?: number;
  /** Copy small pictures pixel for pixel when they already fit. Default true. */
  exact?: boolean;
}

export interface PixelateResult {
  buf: PixelBuffer;
  /** True when the source was treated as pixel art and copied without resampling. */
  exact: boolean;
  /** The block size detected in upscaled pixel art (1 if none). */
  block: number;
  outlined: boolean;
}

export const MAX_COLORS = 15;

export function isOpaque(img: RGBAImage): boolean {
  for (let i = 3; i < img.data.length; i += 4) if (img.data[i] < 250) return false;
  return true;
}

/** Makes the background transparent by flood-filling inward from the border. */
export function removeBackground(img: RGBAImage, tol = 44): RGBAImage {
  const { w, h } = img;
  const d = new Uint8ClampedArray(img.data);
  // The most common border colour (4-bit buckets) is the background.
  const buckets = new Map<number, { n: number; r: number; g: number; b: number }>();
  const border: number[] = [];
  for (let x = 0; x < w; x++) border.push(x, (h - 1) * w + x);
  for (let y = 1; y < h - 1; y++) border.push(y * w, y * w + w - 1);
  for (const p of border) {
    const i = p * 4;
    if (d[i + 3] < 128) continue;
    const key = ((d[i] >> 4) << 8) | ((d[i + 1] >> 4) << 4) | (d[i + 2] >> 4);
    const bk = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    bk.n++; bk.r += d[i]; bk.g += d[i + 1]; bk.b += d[i + 2];
    buckets.set(key, bk);
  }
  let best: { n: number; r: number; g: number; b: number } | null = null;
  for (const bk of buckets.values()) if (!best || bk.n > best.n) best = bk;
  if (!best) return { w, h, data: d };
  const br = best.r / best.n, bg = best.g / best.n, bb = best.b / best.n;
  const near = (p: number) => {
    const i = p * 4;
    if (d[i + 3] < 128) return true;
    const dr = d[i] - br, dg = d[i + 1] - bg, db = d[i + 2] - bb;
    return dr * dr + dg * dg + db * db < tol * tol;
  };
  const seen = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let head = 0, tail = 0;
  for (const p of border) if (!seen[p] && near(p)) { seen[p] = 1; queue[tail++] = p; }
  while (head < tail) {
    const p = queue[head++];
    d[p * 4 + 3] = 0;
    const x = p % w, y = (p / w) | 0;
    const next = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1];
    for (const q of next) if (q >= 0 && !seen[q] && near(q)) { seen[q] = 1; queue[tail++] = q; }
  }
  return { w, h, data: d };
}

/** Size of the uniform blocks in upscaled pixel art, or 1. */
export function blockSize(img: RGBAImage): number {
  const { w, h, data } = img;
  const same = (a: number, b: number) =>
    Math.abs(data[a] - data[b]) <= 6 && Math.abs(data[a + 1] - data[b + 1]) <= 6 &&
    Math.abs(data[a + 2] - data[b + 2]) <= 6 && Math.abs(data[a + 3] - data[b + 3]) <= 6;
  const maxK = Math.min(64, Math.floor(Math.min(w, h) / 2));
  outer: for (let k = maxK; k >= 2; k--) {
    if (w % k || h % k) continue;
    for (let by = 0; by < h; by += k) for (let bx = 0; bx < w; bx += k) {
      const ref = (by * w + bx) * 4;
      for (let y = by; y < by + k; y++) for (let x = bx; x < bx + k; x++) if (!same((y * w + x) * 4, ref)) continue outer;
    }
    return k;
  }
  return 1;
}

function shrink(img: RGBAImage, k: number): RGBAImage {
  const w = img.w / k, h = img.h / k;
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const s = (y * k * img.w + x * k) * 4, t = (y * w + x) * 4;
    data[t] = img.data[s]; data[t + 1] = img.data[s + 1]; data[t + 2] = img.data[s + 2]; data[t + 3] = img.data[s + 3];
  }
  return { w, h, data };
}

function alphaBounds(img: RGBAImage, min: number): { x0: number; y0: number; x1: number; y1: number } | null {
  let x0 = img.w, y0 = img.h, x1 = -1, y1 = -1;
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    if (img.data[(y * img.w + x) * 4 + 3] <= min) continue;
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  return x1 < 0 ? null : { x0, y0, x1, y1 };
}

type RGB3 = [number, number, number];

/** Small k-means palette. Returns one centre per cluster and each point's cluster. */
export function kmeans(points: RGB3[], k: number, iters = 8): { centers: RGB3[]; assign: Int32Array } {
  k = Math.max(1, Math.min(k, points.length));
  const sorted = [...points].sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]));
  const centers = Array.from({ length: k }, (_, i) => [...sorted[Math.floor(((i + 0.5) / k) * sorted.length)]] as RGB3);
  const assign = new Int32Array(points.length);
  for (let it = 0; it < iters; it++) {
    for (let i = 0; i < points.length; i++) {
      let best = 0, bd = Infinity;
      for (let j = 0; j < k; j++) {
        const d = (points[i][0] - centers[j][0]) ** 2 + (points[i][1] - centers[j][1]) ** 2 + (points[i][2] - centers[j][2]) ** 2;
        if (d < bd) { bd = d; best = j; }
      }
      assign[i] = best;
    }
    const sum = centers.map(() => [0, 0, 0, 0]);
    for (let i = 0; i < points.length; i++) { const s = sum[assign[i]]; s[0] += points[i][0]; s[1] += points[i][1]; s[2] += points[i][2]; s[3]++; }
    sum.forEach((s, j) => { if (s[3]) centers[j] = [s[0] / s[3], s[1] / s[3], s[2] / s[3]]; });
  }
  return { centers, assign };
}

function addOutline(b: PixelBuffer, color: number): void {
  const solid = b.clone();
  for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) {
    if (solid.opaque(x, y)) continue;
    if (solid.opaque(x - 1, y) || solid.opaque(x + 1, y) || solid.opaque(x, y - 1) || solid.opaque(x, y + 1)) b.set(x, y, color);
  }
}

function darkest(hexes: string[]): string {
  return hexes.reduce((a, b) => (luminance(a) < luminance(b) ? a : b), hexes[0] ?? '#333333');
}

/** Caps a buffer at MAX_COLORS distinct colours. */
export function limitColors(b: PixelBuffer, max = MAX_COLORS): PixelBuffer {
  const uniq = new Set<number>();
  for (const p of b.px) if (p >>> 24) uniq.add(p);
  if (uniq.size <= max) return b;
  const pts: RGB3[] = [];
  const idx: number[] = [];
  for (let i = 0; i < b.px.length; i++) {
    const p = b.px[i];
    if (!(p >>> 24)) continue;
    const { r, g, b: bb } = unpack(p);
    pts.push([r, g, bb]);
    idx.push(i);
  }
  const { centers, assign } = kmeans(pts, max);
  const packed = centers.map(([r, g, bb]) => pack(toHex({ r, g, b: bb })));
  const out = new PixelBuffer(b.w, b.h);
  idx.forEach((i, n) => (out.px[i] = packed[assign[n]]));
  return out;
}

export function pixelate(src: RGBAImage, o: PixelateOptions): PixelateResult {
  let img = o.removeBg ? removeBackground(src) : src;
  const block = blockSize(img);
  if (block > 1) img = shrink(img, block);
  const bb = alphaBounds(img, 110);
  if (!bb) return { buf: new PixelBuffer(1, 1), exact: false, block, outlined: false };
  const bw = bb.x1 - bb.x0 + 1, bh = bb.y1 - bb.y0 + 1;
  const stretch = o.stretch ?? 1;

  // Already pixel art that fits: copy exactly.
  if (o.exact !== false && bw <= o.maxW && bh <= o.maxH && stretch === 1) {
    let out = new PixelBuffer(bw, bh);
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
      const i = ((bb.y0 + y) * img.w + bb.x0 + x) * 4;
      if (img.data[i + 3] > 110) out.set(x, y, pack(toHex({ r: img.data[i], g: img.data[i + 1], b: img.data[i + 2] })));
    }
    const wantOutline = o.outline === true && bw + 2 <= o.maxW && bh + 2 <= o.maxH;
    out = limitColors(out, wantOutline ? MAX_COLORS - 1 : MAX_COLORS);
    if (wantOutline) {
      const hexes: string[] = [];
      for (const p of out.px) if (p >>> 24) { const c = unpack(p); hexes.push(toHex(c)); }
      const framed = new PixelBuffer(bw + 2, bh + 2);
      framed.blit(out, 1, 1);
      addOutline(framed, pack(mix(darkest(hexes), '#000000', 0.55)));
      out = framed;
    }
    return { buf: out, exact: true, block, outlined: wantOutline };
  }

  // Otherwise scale down with a box filter.
  const outline = o.outline !== false;
  const pad = outline ? 2 : 0;
  const innerW = o.maxW - pad, innerH = o.maxH - pad;
  const s = Math.min(innerW / bw, innerH / bh);
  const sx = Math.min(innerW / bw, s * stretch);
  const tw = Math.max(1, Math.round(bw * sx)), th = Math.max(1, Math.round(bh * s));
  const pts: RGB3[] = [];
  const idx = new Int32Array(tw * th).fill(-1);
  for (let ty = 0; ty < th; ty++) for (let tx = 0; tx < tw; tx++) {
    const fx0 = bb.x0 + (tx / tw) * bw, fx1 = bb.x0 + ((tx + 1) / tw) * bw;
    const fy0 = bb.y0 + (ty / th) * bh, fy1 = bb.y0 + ((ty + 1) / th) * bh;
    let r = 0, g = 0, b = 0, a = 0, n = 0;
    for (let y = Math.floor(fy0); y < Math.ceil(fy1); y++) for (let x = Math.floor(fx0); x < Math.ceil(fx1); x++) {
      const i = (y * img.w + x) * 4;
      const al = img.data[i + 3];
      r += img.data[i] * al; g += img.data[i + 1] * al; b += img.data[i + 2] * al; a += al; n++;
    }
    if (n && a / (n * 255) > 0.42) {
      idx[ty * tw + tx] = pts.length;
      pts.push([r / a, g / a, b / a]);
    }
  }
  const out = new PixelBuffer(tw + pad, th + pad);
  if (!pts.length) return { buf: out, exact: false, block, outlined: false };
  const k = Math.min(o.colors ?? 8, outline ? MAX_COLORS - 1 : MAX_COLORS);
  const { centers, assign } = kmeans(pts, k);
  const hexes = centers.map(([r, g, b]) => toHex({ r, g, b }));
  const packed = hexes.map((c) => pack(c));
  const off = outline ? 1 : 0;
  for (let ty = 0; ty < th; ty++) for (let tx = 0; tx < tw; tx++) {
    const i = idx[ty * tw + tx];
    if (i >= 0) out.set(tx + off, ty + off, packed[assign[i]]);
  }
  if (outline) addOutline(out, pack(mix(darkest(hexes), '#000000', 0.55)));
  return { buf: out, exact: false, block, outlined: outline };
}

// ---------------------------------------------------------------- transforms

export function flipH(b: PixelBuffer): PixelBuffer {
  const o = new PixelBuffer(b.w, b.h);
  o.blit(b, 0, 0, true, false);
  return o;
}

export function resampleNearest(b: PixelBuffer, w: number, h: number): PixelBuffer {
  const o = new PixelBuffer(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    o.px[y * w + x] = b.px[Math.min(b.h - 1, Math.floor(((y + 0.5) / h) * b.h)) * b.w + Math.min(b.w - 1, Math.floor(((x + 0.5) / w) * b.w))];
  }
  return o;
}

// ---------------------------------------------------------------- compact text form
//
// "WxH:PALETTE:PIXELS" — palette is up to 15 six-digit hex colours run
// together, pixels are one hex digit each (0 = transparent, n = palette n-1).
// A 28x23 runner is ~700 characters that deflate to a couple of hundred bytes.

export function encodePixels(b: PixelBuffer): string {
  const safe = limitColors(b);
  const pal: number[] = [];
  const index = new Map<number, number>();
  let pixels = '';
  for (const p of safe.px) {
    if (!(p >>> 24)) { pixels += '0'; continue; }
    let i = index.get(p);
    if (i === undefined) {
      i = pal.length;
      pal.push(p);
      index.set(p, i);
    }
    pixels += (i + 1).toString(16);
  }
  const palette = pal.map((p) => toHex(unpack(p)).slice(1)).join('');
  return `${safe.w}x${safe.h}:${palette}:${pixels}`;
}

export function decodePixels(s: string, maxW = 64, maxH = 64): PixelBuffer | null {
  const m = /^(\d{1,2})x(\d{1,2}):((?:[0-9a-f]{6}){0,15}):([0-9a-f]+)$/i.exec(s);
  if (!m) return null;
  const w = Number(m[1]), h = Number(m[2]);
  const pixels = m[4];
  if (!w || !h || pixels.length !== w * h) return null;
  const pal = (m[3].match(/.{6}/g) ?? []).map((c) => pack(`#${c}`));
  const full = new PixelBuffer(w, h);
  for (let i = 0; i < pixels.length; i++) {
    const n = parseInt(pixels[i], 16);
    if (n > 0 && n <= pal.length) full.px[i] = pal[n - 1];
  }
  if (w <= maxW && h <= maxH) return full;
  // Oversized input (hand-edited link): keep the bottom-centre of the picture.
  const out = new PixelBuffer(Math.min(w, maxW), Math.min(h, maxH));
  out.blit(full, -Math.floor((w - out.w) / 2), -(h - out.h));
  return out;
}
