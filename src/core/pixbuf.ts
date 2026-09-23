import { pack, type Packed } from './color.ts';

/**
 * A tiny RGBA raster. No blending: a pixel is either opaque or transparent,
 * which keeps every generated asset honest pixel art. Gradients and glows are
 * made with ordered dithering instead of alpha.
 */
export class PixelBuffer {
  readonly w: number;
  readonly h: number;
  readonly data: Uint8ClampedArray<ArrayBuffer>;
  readonly px: Uint32Array;

  constructor(w: number, h: number) {
    this.w = Math.max(1, Math.floor(w));
    this.h = Math.max(1, Math.floor(h));
    this.data = new Uint8ClampedArray(new ArrayBuffer(this.w * this.h * 4));
    this.px = new Uint32Array(this.data.buffer);
  }

  set(x: number, y: number, c: Packed): void {
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.px[y * this.w + x] = c;
  }

  get(x: number, y: number): Packed {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.px[y * this.w + x];
  }

  opaque(x: number, y: number): boolean {
    return (this.get(x, y) >>> 24) > 0;
  }

  fill(c: Packed): void {
    this.px.fill(c);
  }

  rect(x: number, y: number, w: number, h: number, c: Packed): void {
    const x0 = Math.max(0, Math.floor(x));
    const y0 = Math.max(0, Math.floor(y));
    const x1 = Math.min(this.w, Math.floor(x + w));
    const y1 = Math.min(this.h, Math.floor(y + h));
    for (let yy = y0; yy < y1; yy++) this.px.fill(c, yy * this.w + x0, yy * this.w + x1);
  }

  /** Vertical run from y0 to y1 inclusive. */
  vline(x: number, y0: number, y1: number, c: Packed): void {
    if (y1 < y0) [y0, y1] = [y1, y0];
    for (let y = Math.floor(y0); y <= y1; y++) this.set(x, y, c);
  }

  hline(x0: number, x1: number, y: number, c: Packed): void {
    if (x1 < x0) [x0, x1] = [x1, x0];
    for (let x = Math.floor(x0); x <= x1; x++) this.set(x, y, c);
  }

  /** Horizontally wrapping set, for seamless tiles. */
  setWrap(x: number, y: number, c: Packed): void {
    this.set(((Math.floor(x) % this.w) + this.w) % this.w, y, c);
  }

  vlineWrap(x: number, y0: number, y1: number, c: Packed): void {
    const xx = ((Math.floor(x) % this.w) + this.w) % this.w;
    this.vline(xx, y0, y1, c);
  }

  rectWrap(x: number, y: number, w: number, h: number, c: Packed): void {
    for (let i = 0; i < w; i++) this.vlineWrap(x + i, y, y + h - 1, c);
  }

  disc(cx: number, cy: number, r: number, c: Packed, wrap = false): void {
    for (let y = Math.floor(cy - r); y <= cy + r; y++) {
      for (let x = Math.floor(cx - r); x <= cx + r; x++) {
        const dx = x - cx + 0.5, dy = y - cy + 0.5;
        if (dx * dx + dy * dy <= r * r) wrap ? this.setWrap(x, y, c) : this.set(x, y, c);
      }
    }
  }

  line(x0: number, y0: number, x1: number, y1: number, c: Packed, wrap = false): void {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
    const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      wrap ? this.setWrap(x0, y0, c) : this.set(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }

  /** Copy opaque pixels of src onto this buffer. */
  blit(src: PixelBuffer, dx: number, dy: number, flipX = false, flipY = false): void {
    dx = Math.round(dx); dy = Math.round(dy);
    for (let y = 0; y < src.h; y++) {
      const ty = dy + y;
      if (ty < 0 || ty >= this.h) continue;
      const sy = flipY ? src.h - 1 - y : y;
      for (let x = 0; x < src.w; x++) {
        const tx = dx + x;
        if (tx < 0 || tx >= this.w) continue;
        const c = src.px[sy * src.w + (flipX ? src.w - 1 - x : x)];
        if (c >>> 24) this.px[ty * this.w + tx] = c;
      }
    }
  }

  clone(): PixelBuffer {
    const b = new PixelBuffer(this.w, this.h);
    b.px.set(this.px);
    return b;
  }

  /** Replace every opaque pixel via fn(packed) → packed. */
  map(fn: (c: Packed) => Packed): PixelBuffer {
    const b = new PixelBuffer(this.w, this.h);
    for (let i = 0; i < this.px.length; i++) {
      const c = this.px[i];
      b.px[i] = c >>> 24 ? fn(c) : 0;
    }
    return b;
  }

  static solid(w: number, h: number, color: string): PixelBuffer {
    const b = new PixelBuffer(w, h);
    b.fill(pack(color));
    return b;
  }
}
