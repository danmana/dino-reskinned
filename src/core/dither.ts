// 8x8 Bayer ordered-dither matrix, normalised to [0, 1).
const B8 = [
  0, 32, 8, 40, 2, 34, 10, 42,
  48, 16, 56, 24, 50, 18, 58, 26,
  12, 44, 4, 36, 14, 46, 6, 38,
  60, 28, 52, 20, 62, 30, 54, 22,
  3, 35, 11, 43, 1, 33, 9, 41,
  51, 19, 59, 27, 49, 17, 57, 25,
  15, 47, 7, 39, 13, 45, 5, 37,
  63, 31, 55, 23, 61, 29, 53, 21,
];

export function bayer(x: number, y: number): number {
  return (B8[((y & 7) << 3) | (x & 7)] + 0.5) / 64;
}

/** True when a pixel should take the "on" colour for coverage t in [0, 1]. */
export function dither(x: number, y: number, t: number): boolean {
  return t > bayer(x, y);
}
