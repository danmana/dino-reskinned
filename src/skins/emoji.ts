import { PixelBuffer } from '../core/pixbuf.ts';
import { flipH, pixelate } from './pixelate.ts';

// Turns any emoji into outlined pixel art: render it big, then run it through
// the same pixelator as uploaded pictures.

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
  const { buf } = pixelate({ w: S, h: S, data: g.getImageData(0, 0, S, S).data }, { maxW, maxH, outline: true, colors: 6, stretch: opts.stretch, exact: false });
  const out = opts.flip ? flipH(buf) : buf;
  cache.set(key, out);
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
