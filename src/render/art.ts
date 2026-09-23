import { PixelBuffer } from '../core/pixbuf.ts';
import { pack, mix, lighten, type Packed } from '../core/color.ts';
import { bayer, dither } from '../core/dither.ts';
import { rng, randInt, type Rand } from '../core/rng.ts';
import { GROUND_Y, H } from '../game/constants.ts';
import type { CelestialDef, GenLayer, GroundDef } from '../skins/types.ts';

export const TILE_W = 512;
export const GROUND_TILE_W = 256;
/** Ground tiles start this many rows above GROUND_Y so tufts and bumps can poke up. */
export const GROUND_LIFT = 3;

const TAU = Math.PI * 2;

// ---------------------------------------------------------------- sky

export function renderSky(w: number, top: string, bottom: string): PixelBuffer {
  const b = new PixelBuffer(w, H);
  if (top.toLowerCase() === bottom.toLowerCase()) {
    b.fill(pack(top));
    return b;
  }
  const L = 7;
  const levels: Packed[] = [];
  for (let i = 0; i < L; i++) levels.push(pack(mix(top, bottom, i / (L - 1))));
  const span = GROUND_Y + 4;
  for (let y = 0; y < H; y++) {
    const t = Math.min(1, y / span);
    const v = t * (L - 1);
    const i = Math.min(L - 2, Math.floor(v));
    const f = v - i;
    for (let x = 0; x < w; x++) b.px[y * w + x] = f > bayer(x, y) ? levels[i + 1] : levels[i];
  }
  return b;
}

export function addStars(sky: PixelBuffer, color: string, seed = 7): void {
  const r = rng(seed);
  const c = pack(color);
  const dim = pack(mix(color, '#000000', 0.45));
  const n = Math.floor((sky.w * GROUND_Y) / 260);
  for (let i = 0; i < n; i++) {
    const x = Math.floor(r() * sky.w);
    const y = Math.floor(Math.pow(r(), 1.4) * (GROUND_Y - 22));
    const big = r() < 0.12;
    sky.set(x, y, big ? c : r() < 0.5 ? c : dim);
    if (big) {
      sky.set(x - 1, y, dim); sky.set(x + 1, y, dim);
      sky.set(x, y - 1, dim); sky.set(x, y + 1, dim);
    }
  }
}

// ---------------------------------------------------------------- aurora

/**
 * Northern-lights curtains: a bright lower edge with rays fading upward.
 * Calls plot(x, y, 0) for the edge colour and plot(x, y, 1) for the upper colour.
 */
export function drawAurora(W: number, t: number, plot: (x: number, y: number, c: 0 | 1) => void): void {
  const tt = t / 60;
  for (let x = 0; x < W; x++) {
    const base = 28 + Math.sin(x * 0.03 + tt * 0.4) * 6 + Math.sin(x * 0.011 - tt * 0.2) * 5;
    const glow = 0.5 + 0.5 * Math.sin(x * 0.017 + tt * 0.3);
    const ray = 0.5 + 0.5 * Math.sin(x * 0.55 + Math.sin(x * 0.045 + tt * 0.8) * 3);
    const I = glow * (0.35 + 0.65 * ray);
    if (I < 0.1) continue;
    const L = 7 + Math.round(12 * glow);
    const yb = Math.round(base);
    for (let k = 0; k < L; k++) {
      const y = yb - k;
      const c = I * (k === 0 ? 1.1 : 0.9 - (k / L) * 0.9);
      if (c > bayer(x, y)) plot(x, y, k < L * 0.35 ? 0 : 1);
    }
  }
}

// ---------------------------------------------------------------- celestial

export function renderCelestial(d: CelestialDef): PixelBuffer {
  const r = Math.max(2, Math.round(d.r));
  const pad = d.kind === 'ringed' ? Math.ceil(r * 0.9) : 4;
  const size = r * 2 + pad * 2 + 1;
  const b = new PixelBuffer(size, size);
  const cx = size / 2, cy = size / 2;
  const col = pack(d.color);
  const acc = pack(d.accent ?? lighten(d.color, 0.35));
  const inDisc = (x: number, y: number, rr = r) => {
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
    return dx * dx + dy * dy <= rr * rr;
  };
  switch (d.kind) {
    case 'sun': {
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= r) b.set(x, y, col);
        else if (dist <= r + 3 && dither(x, y, 0.55 - (dist - r) * 0.16)) b.set(x, y, acc);
      }
      break;
    }
    case 'moon':
    case 'crescent': {
      const rand = rng(3);
      b.disc(cx, cy, r, col);
      if (d.kind === 'crescent') {
        const ox = cx + r * 0.55, oy = cy - r * 0.25;
        for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
          const dx = x + 0.5 - ox, dy = y + 0.5 - oy;
          if (dx * dx + dy * dy <= r * r * 0.92) b.set(x, y, 0);
        }
      } else {
        for (let i = 0; i < 3 + Math.floor(r / 6); i++) {
          const a = rand() * TAU, dd = rand() * r * 0.62;
          const cr = 0.8 + rand() * Math.min(2.2, r * 0.14);
          const px = cx + Math.cos(a) * dd, py = cy + Math.sin(a) * dd;
          for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
            const dx = x + 0.5 - px, dy = y + 0.5 - py;
            if (dx * dx + dy * dy <= cr * cr && inDisc(x, y)) b.set(x, y, acc);
          }
        }
      }
      break;
    }
    case 'earth': {
      const rand = rng(11);
      b.disc(cx, cy, r, col);
      const blobs = 3 + Math.floor(r / 3);
      for (let i = 0; i < blobs; i++) {
        const px = cx + (rand() - 0.5) * r * 1.6, py = cy + (rand() - 0.5) * r * 1.6;
        const br = 1 + rand() * r * 0.26;
        for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
          const dx = x + 0.5 - px, dy = y + 0.5 - py;
          if (dx * dx + dy * dy <= br * br && inDisc(x, y)) b.set(x, y, acc);
        }
      }
      const cloud = pack('#f4f7fb');
      for (let i = 0; i < r * 2; i++) {
        const x = Math.floor(cx - r + rand() * r * 2), y = Math.floor(cy - r + rand() * r * 2);
        if (inDisc(x, y) && inDisc(x + 1, y)) { b.set(x, y, cloud); b.set(x + 1, y, cloud); }
      }
      const shadow = pack(mix(d.color, '#000000', 0.6));
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        if (!inDisc(x, y)) continue;
        const t = (x + 0.5 - cx) / r;
        if (t > 0.25 && dither(x, y, (t - 0.25) * 1.6)) b.set(x, y, shadow);
      }
      break;
    }
    case 'planet': {
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        if (!inDisc(x, y)) continue;
        const band = Math.floor((y - cy + r) / 3) % 2 === 0;
        b.set(x, y, band && dither(x, y, 0.6) ? acc : col);
      }
      break;
    }
    case 'ringed': {
      const ringOuter = r * 1.8, ringInner = r * 1.25;
      const plot = (front: boolean) => {
        for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
          const dx = (x + 0.5 - cx), dy = (y + 0.5 - cy) * 3.2;
          const e = Math.sqrt(dx * dx + dy * dy);
          if (e > ringInner && e < ringOuter && (y + 0.5 >= cy) === front) b.set(x, y, acc);
        }
      };
      plot(false);
      b.disc(cx, cy, r, col);
      plot(true);
      break;
    }
    case 'synthsun': {
      const top = d.color, bottom = d.accent ?? '#ff3c8e';
      for (let y = 0; y < size; y++) {
        const t = (y - (cy - r)) / (2 * r);
        const rel = y - cy;
        const gapEvery = rel > 0 ? Math.max(2, Math.round(5 - rel / (r / 3))) : 99;
        const isGap = rel > 0 && Math.floor(rel) % gapEvery === 0;
        for (let x = 0; x < size; x++) {
          if (!inDisc(x, y) || isGap) continue;
          b.set(x, y, pack(dither(x, y, t) ? bottom : top));
        }
      }
      break;
    }
  }
  return b;
}

// ---------------------------------------------------------------- layers

type Column = (x: number) => number;

function periodic(r: Rand, amps: [number, number][]): Column {
  // Sum of sines with integer frequencies over TILE_W: always seamless.
  const terms = amps.map(([k, a]) => ({ k, a, p: r() * TAU }));
  return (x) => terms.reduce((s, t) => s + t.a * Math.sin((TAU * t.k * x) / TILE_W + t.p), 0);
}

function fillColumns(b: PixelBuffer, h: Column, c: Packed): void {
  for (let x = 0; x < b.w; x++) {
    const top = b.h - Math.max(0, Math.round(h(x)));
    b.vline(x, top, b.h - 1, c);
  }
}

function topEdge(b: PixelBuffer, x: number): number {
  for (let y = 0; y < b.h; y++) if (b.opaque(x, y)) return y;
  return b.h;
}

export function renderLayer(d: GenLayer): PixelBuffer {
  const hgt = Math.max(2, Math.round(d.height));
  const b = new PixelBuffer(TILE_W, hgt + 2);
  const r = rng(d.seed ?? hashKind(d.kind));
  const c = pack(d.color);
  const a = pack(d.accent ?? lighten(d.color, 0.25));
  const bottom = b.h;
  switch (d.kind) {
    case 'hills': {
      const f = periodic(r, [[1, 0.22], [2, 0.14], [5, 0.07], [9, 0.03]]);
      fillColumns(b, (x) => hgt * (0.6 + f(x)), c);
      if (d.accent) for (let x = 0; x < b.w; x++) { const y = topEdge(b, x); if (y < b.h && x % 3 !== 0) b.set(x, y, a); }
      break;
    }
    case 'mountains': {
      const tri = (x: number, p: number, o: number) => 1 - Math.abs((((x + o) / p) % 1) * 2 - 1);
      const o1 = r() * 512, o2 = r() * 512, o3 = r() * 512;
      const hf = (x: number) => hgt * (0.12 + 0.55 * tri(x, 128, o1) + 0.25 * tri(x, 64, o2) + 0.12 * tri(x, 32, o3)) / 1.04;
      fillColumns(b, hf, c);
      if (d.accent) {
        const cap = hgt * 0.68;
        for (let x = 0; x < b.w; x++) {
          const hx = hf(x);
          if (hx < cap) continue;
          const y0 = topEdge(b, x);
          const depth = Math.min(hx - cap, 3 + ((x * 7) % 3));
          for (let y = y0; y < y0 + depth; y++) b.set(x, y, a);
        }
      }
      break;
    }
    case 'mesas': {
      const plateaus: { x0: number; x1: number; h: number }[] = [];
      let x = 0;
      while (x < TILE_W - 40) {
        const w = randInt(r, 28, 90);
        plateaus.push({ x0: x, x1: x + w, h: hgt * [0.45, 0.65, 0.85, 1][randInt(r, 0, 3)] });
        x += w + randInt(r, 14, 60);
      }
      const talus = 9;
      const hf = (px: number) => {
        let best = hgt * 0.08;
        for (const p of plateaus) {
          for (const shift of [-TILE_W, 0, TILE_W]) {
            const x0 = p.x0 + shift, x1 = p.x1 + shift;
            if (px >= x0 && px <= x1) best = Math.max(best, p.h);
            else {
              const dd = px < x0 ? x0 - px : px - x1;
              if (dd < talus) best = Math.max(best, p.h * 0.38 * (1 - dd / talus));
            }
          }
        }
        return best;
      };
      fillColumns(b, hf, c);
      if (d.accent) {
        for (let px = 0; px < b.w; px++) {
          const hx = hf(px);
          for (let s = 4; s < hx - 2; s += 5) if ((px + s) % 11 !== 0) b.set(px, bottom - 1 - Math.round(s), a);
        }
      }
      break;
    }
    case 'dunes': {
      const f = periodic(r, [[3, 0.2], [5, 0.12], [8, 0.05]]);
      const hf = (x: number) => hgt * (0.55 + f(x));
      fillColumns(b, hf, c);
      if (d.accent) {
        for (let x = 0; x < b.w; x++) {
          const slope = hf(x + 1) - hf(x - 1);
          if (slope > 0.05) { const y = topEdge(b, x); b.set(x, y, a); if (slope > 0.4) b.set(x, y + 1, a); }
        }
      }
      break;
    }
    case 'city': {
      let x = 0;
      while (x < TILE_W) {
        const w = randInt(r, 7, 20);
        const hh = Math.round(hgt * (0.3 + r() * 0.7));
        const top = bottom - hh;
        b.rectWrap(x, top, w, hh, c);
        if (r() < 0.35) { const sw = Math.max(3, Math.floor(w * 0.5)); b.rectWrap(x + Math.floor((w - sw) / 2), top - 3, sw, 3, c); }
        if (r() < 0.3) b.vlineWrap(x + Math.floor(w / 2), top - 3 - randInt(r, 2, 6), top, c);
        if (d.accent) {
          const lit = 0.2 + r() * 0.35;
          for (let wy = top + 2; wy < bottom - 2; wy += 3) {
            for (let wx = x + 1; wx < x + w - 1; wx += 2) if (r() < lit) b.setWrap(wx, wy, a);
          }
          if (r() < 0.18 && hh > 12) {
            const sx = x + (r() < 0.5 ? 0 : w - 1);
            for (let y = top + 3; y < top + 3 + Math.min(10, hh - 6); y++) b.setWrap(sx, y, a);
          }
        }
        x += w + randInt(r, 0, 3);
      }
      break;
    }
    case 'forest': {
      let x = 0;
      while (x < TILE_W) {
        const th = Math.round(hgt * (0.45 + r() * 0.55));
        const top = bottom - th;
        for (let y = 0; y < th - 2; y++) {
          const tier = y % 5;
          const half = Math.floor(y * 0.28) + Math.floor(tier * 0.5);
          for (let dx = -half; dx <= half; dx++) b.setWrap(x + dx, top + y, c);
          if (d.accent && tier === 0 && y > 2) { b.setWrap(x - half, top + y, a); b.setWrap(x - half + 1, top + y, a); }
        }
        b.vlineWrap(x, bottom - 3, bottom - 1, c);
        if (d.accent) b.setWrap(x, top, a);
        x += randInt(r, 4, 10);
      }
      break;
    }
    case 'castle': {
      const wallH = Math.round(hgt * 0.42);
      const wallTop = bottom - wallH;
      b.rect(0, wallTop, TILE_W, wallH, c);
      for (let x = 0; x < TILE_W; x += 4) b.rect(x, wallTop - 2, 2, 2, c);
      let x = randInt(r, 10, 40);
      while (x < TILE_W - 10) {
        const w = randInt(r, 8, 13);
        const th = Math.round(hgt * (0.7 + r() * 0.3)) - 3;
        const top = bottom - th;
        b.rectWrap(x, top, w, th, c);
        if (r() < 0.5) {
          for (let i = 0; i < w; i += 2) b.rectWrap(x + i, top - 2, 1, 2, c);
        } else {
          const roofH = Math.ceil(w * 0.8);
          for (let y = 0; y < roofH; y++) {
            const half = Math.floor((y / roofH) * (w / 2 + 1));
            for (let dx = -half; dx <= half; dx++) b.setWrap(x + Math.floor(w / 2) + dx, top - roofH + y, c);
          }
          b.vlineWrap(x + Math.floor(w / 2), top - roofH - 3, top - roofH, c);
        }
        if (d.accent) for (let wy = top + 3; wy < bottom - wallH - 1; wy += 5) b.rectWrap(x + Math.floor(w / 2), wy, 1, 2, a);
        x += w + randInt(r, 40, 110);
      }
      if (d.accent) for (let x2 = 6; x2 < TILE_W; x2 += randInt(r, 14, 30)) b.rectWrap(x2, wallTop + 3, 1, 2, a);
      break;
    }
    case 'kelp': {
      let x = 0;
      while (x < TILE_W) {
        const kh = Math.round(hgt * (0.4 + r() * 0.6));
        const ph = r() * TAU;
        const wide = r() < 0.4;
        for (let y = 0; y < kh; y++) {
          const sway = Math.round(Math.sin(y * 0.28 + ph) * 1.6 * (y / kh));
          const px = x + sway;
          b.setWrap(px, bottom - 1 - y, c);
          if (wide) b.setWrap(px + 1, bottom - 1 - y, c);
          if (y > 3 && y % 5 === 0) {
            const side = (y / 5) % 2 === 0 ? -1 : 1;
            b.setWrap(px + side, bottom - 2 - y, d.accent ? a : c);
            b.setWrap(px + side * 2, bottom - 3 - y, d.accent ? a : c);
          }
        }
        x += randInt(r, 5, 13);
      }
      break;
    }
    case 'coral': {
      let x = 0;
      const branch = (bx: number, by: number, len: number, dir: number, depth: number) => {
        let px = bx, py = by;
        for (let i = 0; i < len; i++) {
          py -= 1;
          if (r() < 0.35) px += dir;
          b.setWrap(px, py, c);
          b.setWrap(px + 1, py, c);
          if (depth < 2 && i > 1 && r() < 0.18) branch(px, py, Math.floor(len * 0.6), -dir, depth + 1);
        }
        if (d.accent) { b.setWrap(px, py - 1, a); b.setWrap(px + 1, py - 1, a); }
      };
      while (x < TILE_W) {
        const kind = r();
        if (kind < 0.45) {
          const n = randInt(r, 2, 4);
          for (let i = 0; i < n; i++) branch(x + i * 2, bottom, Math.round(hgt * (0.35 + r() * 0.6)), r() < 0.5 ? -1 : 1, 0);
        } else if (kind < 0.8) {
          const rr = randInt(r, 3, Math.max(4, Math.round(hgt * 0.3)));
          for (let y = 0; y <= rr; y++) {
            const half = Math.round(Math.sqrt(rr * rr - y * y) * 1.3);
            for (let dx = -half; dx <= half; dx++) b.setWrap(x + dx, bottom - 1 - y, c);
          }
          if (d.accent) for (let dx = -rr; dx <= rr; dx += 2) b.setWrap(x + dx, bottom - 1 - Math.round(Math.sqrt(Math.max(0, rr * rr - (dx / 1.3) ** 2))), a);
        } else {
          const fh = Math.round(hgt * (0.4 + r() * 0.5));
          for (let y = 0; y < fh; y++) {
            const half = Math.round((y / fh) * fh * 0.35);
            for (let dx = -half; dx <= half; dx++) if ((dx + y) % 2 === 0 || y > fh - 2) b.setWrap(x + dx, bottom - fh + y, c);
          }
          b.vlineWrap(x, bottom - 3, bottom - 1, c);
        }
        x += randInt(r, 8, 22);
      }
      break;
    }
    case 'houses': {
      let x = randInt(r, 0, 8);
      while (x < TILE_W - 4) {
        if (r() < 0.3) {
          const tr = randInt(r, 3, 5);
          b.disc(x + tr, bottom - 3 - tr, tr, c, true);
          b.vlineWrap(x + tr, bottom - 3, bottom - 1, c);
          x += tr * 2 + randInt(r, 2, 6);
          continue;
        }
        const w = randInt(r, 13, 21);
        const bh = Math.round(hgt * (0.35 + r() * 0.2));
        const roofH = Math.ceil(w / 2.2);
        const top = bottom - bh;
        b.rectWrap(x, top, w, bh, c);
        for (let y = 0; y < roofH; y++) {
          const half = Math.round((y / roofH) * (w / 2 + 1));
          for (let dx = -half; dx <= half; dx++) b.setWrap(x + Math.floor(w / 2) + dx, top - roofH + y, c);
        }
        if (r() < 0.6) b.rectWrap(x + w - 5, top - roofH + 1, 2, roofH - 1, c);
        if (d.accent) {
          b.rectWrap(x + 2, top + 2, 2, 2, a);
          b.rectWrap(x + w - 4, top + 2, 2, 2, a);
          if (bh > 8) b.rectWrap(x + Math.floor(w / 2) - 1, bottom - 4, 2, 4, a);
        }
        x += w + randInt(r, 4, 16);
      }
      break;
    }
    case 'graves': {
      let x = randInt(r, 0, 10);
      while (x < TILE_W - 6) {
        const kind = r();
        if (kind < 0.45) {
          const w = randInt(r, 4, 6), hh = Math.min(hgt, randInt(r, 5, 8));
          b.rectWrap(x, bottom - hh + 1, w, hh - 1, c);
          b.rectWrap(x + 1, bottom - hh, w - 2, 1, c);
          x += w + randInt(r, 3, 9);
        } else if (kind < 0.7) {
          const hh = Math.min(hgt, randInt(r, 6, 9));
          b.vlineWrap(x + 1, bottom - hh, bottom - 1, c);
          b.hline(x, x + 2, bottom - hh + 2, c);
          x += 3 + randInt(r, 3, 9);
        } else if (kind < 0.9) {
          const th = Math.round(hgt * (0.6 + r() * 0.4));
          let px = x;
          for (let y = 0; y < th; y++) {
            if (y > th * 0.5 && r() < 0.3) px += r() < 0.5 ? -1 : 1;
            b.setWrap(px, bottom - 1 - y, c);
            if (y < th * 0.4) b.setWrap(px + 1, bottom - 1 - y, c);
            if (y > th * 0.45 && r() < 0.22) {
              const dir = r() < 0.5 ? -1 : 1;
              const len = randInt(r, 2, 5);
              for (let i = 1; i <= len; i++) b.setWrap(px + dir * i, bottom - 1 - y - Math.floor(i / 2), c);
            }
          }
          x += randInt(r, 10, 20);
        } else {
          const w = 5, hh = Math.min(hgt, randInt(r, 9, 12));
          b.rectWrap(x, bottom - hh + 3, w, hh - 3, c);
          for (let y = 0; y < 3; y++) b.rectWrap(x + (y < 1 ? 2 : 1), bottom - hh + y, y < 1 ? 1 : 3, 1, c);
          x += w + randInt(r, 4, 10);
        }
      }
      break;
    }
    case 'candy': {
      const f = periodic(r, [[4, 0.18], [7, 0.08]]);
      const hf = (x: number) => hgt * 0.35 * (0.7 + f(x));
      fillColumns(b, hf, c);
      let x = randInt(r, 0, 12);
      while (x < TILE_W) {
        const kind = r();
        if (kind < 0.55) {
          const sh = Math.round(hgt * (0.45 + r() * 0.45));
          const rr = randInt(r, 3, 5);
          b.vlineWrap(x, bottom - sh + rr, bottom - 1, c);
          for (let y = -rr; y <= rr; y++) for (let dx = -rr; dx <= rr; dx++) {
            if (dx * dx + y * y > rr * rr) continue;
            const ang = Math.atan2(y, dx) + Math.sqrt(dx * dx + y * y) * 0.9;
            const stripe = Math.floor(((ang / TAU) * 4 + 8) % 2) === 0;
            b.setWrap(x + dx, bottom - sh + y, stripe && d.accent ? a : c);
          }
        } else {
          const sh = Math.round(hgt * (0.5 + r() * 0.4));
          for (let y = 0; y < sh; y++) {
            const stripe = Math.floor(y / 2) % 2 === 0 && d.accent;
            b.setWrap(x, bottom - 1 - y, stripe ? a : c);
            b.setWrap(x + 1, bottom - 1 - y, stripe ? a : c);
          }
          const top = bottom - sh;
          for (const [dx, dy] of [[0, -1], [1, -2], [2, -2], [3, -1], [4, 0], [4, 1]]) {
            const stripe = (dx + 5) % 2 === 0 && d.accent;
            b.setWrap(x + dx, top + dy, stripe ? a : c);
            b.setWrap(x + dx, top + dy + 1, stripe ? a : c);
          }
        }
        x += randInt(r, 9, 24);
      }
      break;
    }
    case 'craters': {
      const f = periodic(r, [[3, 0.12], [7, 0.08], [13, 0.05], [23, 0.03]]);
      fillColumns(b, (x) => hgt * (0.45 + f(x)), c);
      let x = randInt(r, 0, 20);
      while (x < TILE_W) {
        const w = randInt(r, 8, 22);
        const rim = randInt(r, 2, 4);
        for (let i = 0; i <= w; i++) {
          const t = i / w;
          const lift = Math.round(Math.sin(t * Math.PI) < 0.35 ? rim * (1 - Math.abs(t - (t < 0.5 ? 0.12 : 0.88)) * 5) : -1);
          const px = x + i;
          const y0 = topEdge(b, ((px % TILE_W) + TILE_W) % TILE_W);
          if (lift > 0) {
            for (let y = y0 - lift; y < y0; y++) b.setWrap(px, y, c);
            if (d.accent) b.setWrap(px, y0 - lift, a);
          }
        }
        x += w + randInt(r, 10, 40);
      }
      break;
    }
    case 'icebergs': {
      const waterline = bottom - 2;
      b.rect(0, waterline, TILE_W, 2, c);
      let x = randInt(r, 0, 20);
      while (x < TILE_W) {
        const w = randInt(r, 10, 34);
        const bh = Math.round(hgt * (0.25 + r() * 0.75));
        const peak = r() < 0.5;
        for (let i = 0; i < w; i++) {
          const t = i / (w - 1);
          const edge = Math.min(t, 1 - t) * 2;
          let hh = peak ? bh * Math.min(1, edge * 1.4) : bh * Math.min(1, edge * 4);
          hh = Math.round(hh - (i * 13 % 3 === 0 ? 1 : 0));
          const px = x + i;
          b.vlineWrap(px, waterline - hh, waterline - 1, t > 0.55 && d.accent ? a : c);
        }
        x += w + randInt(r, 14, 60);
      }
      break;
    }
    case 'fence': {
      const railA = bottom - Math.round(hgt * 0.35);
      const railB = bottom - Math.round(hgt * 0.75);
      for (let x = 0; x < TILE_W; x++) {
        b.set(x, railA, d.accent ? a : c);
        b.set(x, railB, d.accent ? a : c);
      }
      for (let x = 0; x < TILE_W; x += 16) {
        b.rect(x, bottom - hgt, 2, hgt, c);
        b.set(x, bottom - hgt - 1, c);
      }
      break;
    }
    case 'rocks': {
      let x = randInt(r, 0, 10);
      while (x < TILE_W) {
        const rw = randInt(r, 3, Math.max(4, Math.round(hgt * 0.9)));
        const rh = Math.max(2, Math.round(rw * (0.4 + r() * 0.35)));
        for (let y = 0; y < rh; y++) {
          const t = y / rh;
          const half = Math.round(rw * Math.sqrt(1 - (1 - t) * (1 - t)) * 0.5 + 0.5);
          for (let dx = -half; dx <= half; dx++) {
            const hi = d.accent && y < 2 + rh * 0.2 && dx < 0;
            b.setWrap(x + dx, bottom - rh + y, hi ? a : c);
          }
        }
        x += rw + randInt(r, 8, 40);
      }
      break;
    }
    case 'pagodas': {
      let x = randInt(r, 10, 40);
      while (x < TILE_W - 20) {
        if (r() < 0.35) {
          const gh = Math.round(hgt * 0.55), gw = randInt(r, 11, 15);
          b.rectWrap(x + 2, bottom - gh, 1, gh, c);
          b.rectWrap(x + gw - 3, bottom - gh, 1, gh, c);
          b.rectWrap(x, bottom - gh - 2, gw, 2, c);
          b.setWrap(x - 1, bottom - gh - 3, c); b.setWrap(x + gw, bottom - gh - 3, c);
          b.rectWrap(x + 1, bottom - gh + 2, gw - 2, 1, c);
          x += gw + randInt(r, 20, 50);
          continue;
        }
        const tiers = randInt(r, 3, 5);
        const baseW = randInt(r, 14, 20);
        let y = bottom;
        const tierH = Math.max(3, Math.floor((hgt * (0.7 + r() * 0.3)) / tiers) - 1);
        for (let t = 0; t < tiers; t++) {
          const bw = Math.max(4, baseW - t * 3);
          const cx = x + Math.floor(baseW / 2);
          b.rectWrap(cx - Math.floor(bw / 2) + 1, y - tierH, bw - 2, tierH, c);
          const rw = bw + 4;
          b.rectWrap(cx - Math.floor(rw / 2), y - tierH - 1, rw, 2, c);
          b.setWrap(cx - Math.floor(rw / 2) - 1, y - tierH - 2, c);
          b.setWrap(cx + Math.ceil(rw / 2), y - tierH - 2, c);
          if (d.accent && t < tiers - 1) b.setWrap(cx - Math.floor(rw / 2), y - tierH + 1, a);
          if (d.accent && t < tiers - 1) b.setWrap(cx + Math.ceil(rw / 2) - 1, y - tierH + 1, a);
          y -= tierH + 1;
        }
        b.vlineWrap(x + Math.floor(baseW / 2), y - 4, y, c);
        x += baseW + randInt(r, 30, 80);
      }
      break;
    }
    case 'ruins': {
      let x = randInt(r, 0, 20);
      while (x < TILE_W - 8) {
        const kind = r();
        if (kind < 0.55) {
          const w = randInt(r, 3, 5), ph = Math.round(hgt * (0.35 + r() * 0.65));
          for (let i = 0; i < w; i++) b.vlineWrap(x + i, bottom - ph + ((i * 5 + ph) % 3), bottom - 1, c);
          b.rectWrap(x - 1, bottom - 2, w + 2, 2, c);
          if (d.accent && r() < 0.6) b.setWrap(x + 1, bottom - ph + 3, a);
          x += w + randInt(r, 6, 20);
        } else if (kind < 0.8) {
          const w = randInt(r, 12, 18), ah = Math.round(hgt * (0.55 + r() * 0.35));
          b.rectWrap(x, bottom - ah, 3, ah, c);
          b.rectWrap(x + w - 3, bottom - ah, 3, ah, c);
          for (let i = 0; i < w; i++) {
            const t = i / (w - 1);
            const arc = Math.round(Math.sin(t * Math.PI) * 4);
            b.vlineWrap(x + i, bottom - ah - 2, bottom - ah + 3 - arc, c);
          }
          x += w + randInt(r, 10, 30);
        } else {
          for (let i = 0; i < 6; i++) b.setWrap(x + randInt(r, 0, 8), bottom - 1 - randInt(r, 0, 1), c);
          b.rectWrap(x + 2, bottom - 2, 4, 2, c);
          if (d.accent) b.setWrap(x + 3, bottom - 3, a);
          x += randInt(r, 10, 24);
        }
      }
      break;
    }
  }
  return b;
}

function hashKind(k: string): number {
  let h = 0;
  for (let i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) >>> 0;
  return h;
}

/** Repeat sprites across a seamless tile. */
export function renderSpriteLayer(sprites: PixelBuffer[], gap: [number, number], seed: number): PixelBuffer {
  const hgt = Math.max(1, ...sprites.map((s) => s.h));
  const b = new PixelBuffer(TILE_W, hgt);
  if (!sprites.length) return b;
  const r = rng(seed);
  let x = randInt(r, 0, gap[0]);
  while (x < TILE_W - 2) {
    const s = sprites[Math.floor(r() * sprites.length)];
    b.blit(s, x, hgt - s.h);
    if (x + s.w > TILE_W) b.blit(s, x - TILE_W, hgt - s.h);
    x += s.w + randInt(r, gap[0], gap[1]);
  }
  return b;
}

// ---------------------------------------------------------------- ground

export function renderGround(d: GroundDef, seed = 5): PixelBuffer {
  const W = GROUND_TILE_W;
  const gh = H - GROUND_Y + GROUND_LIFT;
  const b = new PixelBuffer(W, gh);
  const r = rng(seed);
  const L = GROUND_LIFT; // row index of the ground line inside the tile
  const fill = pack(d.color), line = pack(d.line), det = pack(d.detail);
  const dark = pack(mix(d.color, '#000000', 0.18));
  const light = pack(mix(d.color, '#ffffff', 0.18));
  const body = () => b.rect(0, L, W, gh - L, fill);

  switch (d.style) {
    case 'line': {
      body();
      // The original horizon: a line with occasional one-pixel bumps.
      let x = 0;
      while (x < W) {
        const bump = r() < 0.3 ? (r() < 0.5 ? -1 : 1) : 0;
        const seg = bump ? randInt(r, 4, 9) : randInt(r, 14, 48);
        for (let i = 0; i < seg && x + i < W; i++) {
          const edge = i === 0 || i === seg - 1;
          b.set(x + i, L + (edge || !bump ? 0 : bump), line);
        }
        x += seg;
      }
      for (let i = 0; i < 26; i++) {
        const px = randInt(r, 0, W - 3), py = L + randInt(r, 3, gh - L - 3);
        const len = r() < 0.3 ? 2 : 1;
        for (let k = 0; k < len; k++) b.set(px + k, py, det);
      }
      break;
    }
    case 'sand':
    case 'seabed': {
      body();
      b.hline(0, W - 1, L, line);
      for (let x = 0; x < W; x++) if (dither(x, L + 1, 0.5)) b.set(x, L + 1, line);
      for (let i = 0; i < 70; i++) b.set(randInt(r, 0, W - 1), L + randInt(r, 3, gh - L - 1), det);
      for (let i = 0; i < 12; i++) {
        const px = randInt(r, 0, W - 6), py = L + randInt(r, 4, gh - L - 2);
        b.hline(px, px + randInt(r, 2, 4), py, dark);
      }
      if (d.style === 'seabed') {
        for (let i = 0; i < 7; i++) {
          const px = randInt(r, 2, W - 4), py = L + randInt(r, 4, gh - L - 3);
          b.set(px, py, det); b.set(px + 1, py, det); b.set(px - 1, py + 1, det); b.set(px + 2, py + 1, det);
          b.hline(px - 1, px + 2, py + 1, det);
        }
      }
      break;
    }
    case 'grass': {
      body();
      b.rect(0, L, W, 2, line);
      for (let x = 0; x < W; x++) {
        const t = r();
        if (t < 0.45) b.set(x, L - 1, line);
        if (t < 0.12) b.set(x, L - 2, line);
      }
      for (let i = 0; i < 40; i++) b.set(randInt(r, 0, W - 1), L + randInt(r, 4, gh - L - 1), det);
      for (let i = 0; i < 14; i++) {
        const px = randInt(r, 0, W - 3), py = L + randInt(r, 5, gh - L - 2);
        b.rect(px, py, 2, 1, dark);
      }
      break;
    }
    case 'road':
    case 'wet': {
      body();
      b.rect(0, L, W, 1, line);
      b.rect(0, L + 1, W, 1, dark);
      const midY = L + Math.floor((gh - L) * 0.55);
      for (let x = 0; x < W; x += 32) b.rect(x, midY, 14, 1, det);
      if (d.style === 'wet') {
        for (let i = 0; i < 24; i++) {
          const px = randInt(r, 0, W - 8), py = L + randInt(r, 3, gh - L - 1);
          b.hline(px, px + randInt(r, 2, 7), py, light);
        }
      } else {
        for (let i = 0; i < 40; i++) b.set(randInt(r, 0, W - 1), L + randInt(r, 3, gh - L - 1), light);
      }
      break;
    }
    case 'rails': {
      body();
      for (let x = 2; x < W; x += 8) b.rect(x, L + 3, 5, 2, det);
      b.rect(0, L + 2, W, 1, line);
      b.rect(0, L, W, 1, dark);
      for (let i = 0; i < 40; i++) b.set(randInt(r, 0, W - 1), L + randInt(r, 6, gh - L - 1), dark);
      break;
    }
    case 'snow': {
      body();
      const f = periodic(r, [[8, 0.7], [19, 0.4]]);
      for (let x = 0; x < W; x++) {
        const bump = Math.round(f(x * 2));
        b.vline(x, L - Math.max(0, bump), L, fill);
        b.set(x, L - Math.max(0, bump), line);
      }
      for (let i = 0; i < 50; i++) b.set(randInt(r, 0, W - 1), L + randInt(r, 2, gh - L - 1), det);
      break;
    }
    case 'rock': {
      body();
      b.rect(0, L, W, 1, line);
      for (let i = 0; i < 18; i++) {
        let px = randInt(r, 0, W - 1), py = L + randInt(r, 2, gh - L - 4);
        for (let k = 0; k < randInt(r, 3, 7); k++) {
          b.set(px, py, dark);
          px += 1; py += r() < 0.5 ? 1 : 0;
        }
      }
      for (let i = 0; i < 30; i++) b.set(randInt(r, 0, W - 1), L + randInt(r, 2, gh - L - 1), det);
      break;
    }
    case 'cobble': {
      body();
      b.rect(0, L, W, 1, line);
      for (let row = 0; row * 4 + L + 1 < gh; row++) {
        const y = L + 1 + row * 4;
        const off = row % 2 ? 3 : 0;
        for (let x = off; x < W + 6; x += 6) {
          b.hline(x, x + 4, y + 3, dark);
          b.vline(x + 5, y, y + 3, dark);
          if (r() < 0.5) b.set(x + 1, y + 1, light);
        }
      }
      break;
    }
    case 'moon': {
      body();
      b.rect(0, L, W, 1, line);
      for (let i = 0; i < 16; i++) {
        const px = randInt(r, 2, W - 8), py = L + randInt(r, 3, gh - L - 4);
        const w = randInt(r, 3, 6);
        b.hline(px, px + w, py, dark);
        b.hline(px + 1, px + w - 1, py + 1, light);
      }
      for (let i = 0; i < 50; i++) b.set(randInt(r, 0, W - 1), L + randInt(r, 2, gh - L - 1), det);
      break;
    }
    case 'frosting': {
      b.rect(0, L + 4, W, gh - L - 4, fill);
      b.rect(0, L, W, 4, line);
      for (let x = 0; x < W; x += randInt(r, 3, 7)) {
        const drip = randInt(r, 1, 4);
        b.rect(x, L + 4, 2, drip, line);
      }
      const sprinkle = [det, light, dark];
      for (let i = 0; i < 40; i++) {
        const px = randInt(r, 0, W - 2), py = L + randInt(r, 7, gh - L - 2);
        const c = sprinkle[i % 3];
        if (r() < 0.5) b.hline(px, px + 1, py, c); else b.vline(px, py, py + 1, c);
      }
      for (let i = 0; i < 18; i++) b.set(randInt(r, 0, W - 1), L + randInt(r, 0, 2), det);
      break;
    }
    case 'sidewalk': {
      body();
      b.rect(0, L, W, 1, line);
      const curb = L + Math.floor((gh - L) * 0.62);
      b.rect(0, curb, W, 1, line);
      b.rect(0, curb + 1, W, gh - curb - 1, dark);
      for (let x = 0; x < W; x += 16) b.vline(x, L + 1, curb - 1, det);
      for (let i = 0; i < 20; i++) b.set(randInt(r, 0, W - 1), L + randInt(r, 2, curb - L - 1), det);
      for (let x = 0; x < W; x += 32) b.rect(x + 6, curb + 4, 12, 1, light);
      break;
    }
    case 'ice': {
      body();
      b.rect(0, L, W, 1, line);
      for (let i = 0; i < 10; i++) {
        let px = randInt(r, 0, W - 1), py = L + 1;
        const len = randInt(r, 4, 10);
        for (let k = 0; k < len; k++) {
          b.set(px, py, det);
          py += 1; px += r() < 0.5 ? -1 : 1;
          if (py >= gh) break;
        }
      }
      for (let i = 0; i < 14; i++) {
        const px = randInt(r, 0, W - 6), py = L + randInt(r, 2, gh - L - 1);
        b.hline(px, px + randInt(r, 1, 4), py, light);
      }
      break;
    }
  }
  return b;
}
