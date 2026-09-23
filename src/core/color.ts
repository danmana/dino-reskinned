// Colors travel as '#rrggbb' strings in skin definitions and as packed
// little-endian ABGR u32 values inside PixelBuffers (the layout a Uint32Array
// view over ImageData bytes expects).

export type Packed = number;

export interface RGB { r: number; g: number; b: number }

export function parseHex(c: string): RGB {
  let s = c.trim().replace('#', '');
  if (s.length === 3) s = s.split('').map((ch) => ch + ch).join('');
  const n = parseInt(s.slice(0, 6), 16);
  if (Number.isNaN(n)) return { r: 255, g: 0, b: 255 };
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function toHex({ r, g, b }: RGB): string {
  const h = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

export function pack(c: string, alpha = 255): Packed {
  const { r, g, b } = parseHex(c);
  return ((alpha << 24) | (b << 16) | (g << 8) | r) >>> 0;
}

export function unpack(p: Packed): RGB & { a: number } {
  return { r: p & 255, g: (p >>> 8) & 255, b: (p >>> 16) & 255, a: (p >>> 24) & 255 };
}

export function mix(a: string, b: string, t: number): string {
  const x = parseHex(a);
  const y = parseHex(b);
  return toHex({ r: x.r + (y.r - x.r) * t, g: x.g + (y.g - x.g) * t, b: x.b + (y.b - x.b) * t });
}

/** Relative luminance, 0..1. */
export function luminance(c: string): number {
  const { r, g, b } = parseHex(c);
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export function lighten(c: string, t: number): string {
  return t >= 0 ? mix(c, '#ffffff', t) : mix(c, '#000000', -t);
}

export function invert(c: string): string {
  const { r, g, b } = parseHex(c);
  return toHex({ r: 255 - r, g: 255 - g, b: 255 - b });
}

export function hsl(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return toHex({ r: f(0) * 255, g: f(8) * 255, b: f(4) * 255 });
}

export function toHsl(c: string): { h: number; s: number; l: number } {
  const { r, g, b } = parseHex(c);
  const R = r / 255, G = g / 255, B = b / 255;
  const max = Math.max(R, G, B), min = Math.min(R, G, B);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === R) h = (G - B) / d + (G < B ? 6 : 0);
  else if (max === G) h = (B - R) / d + 2;
  else h = (R - G) / d + 4;
  return { h: h * 60, s, l };
}
