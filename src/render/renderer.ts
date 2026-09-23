import { PixelBuffer } from '../core/pixbuf.ts';
import { bayer } from '../core/dither.ts';
import { GLYPH_ADV, GLYPH_H, GLYPH_W, textWidth } from '../core/font.ts';
import { textBuffer } from '../core/font.ts';
import { mix } from '../core/color.ts';
import { GROUND_Y, H, RUNNER_X } from '../game/constants.ts';
import { placeObstacle, runnerSprite, type Game } from '../game/engine.ts';
import { addStars, drawAurora, GROUND_LIFT, GROUND_TILE_W, renderSky, TILE_W } from './art.ts';
import { gridToBuffer, type SkinArt, type SpriteArt, type VariantArt } from './compile.ts';
import { Weather } from './weather.ts';

const canvasCache = new WeakMap<PixelBuffer, HTMLCanvasElement>();

export function toCanvas(b: PixelBuffer): HTMLCanvasElement {
  let c = canvasCache.get(b);
  if (!c) {
    c = document.createElement('canvas');
    c.width = b.w;
    c.height = b.h;
    c.getContext('2d')!.putImageData(new ImageData(b.data, b.w, b.h), 0, 0);
    canvasCache.set(b, c);
  }
  return c;
}

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return [c, ctx];
}

const RESTART: string[] = [
  '...#####...',
  '..#.....#.#',
  '.#.......##',
  '#.......###',
  '#..........',
  '#.........#',
  '#.........#',
  '.#.......#.',
  '..#.....#..',
  '...#####...',
];

interface Decor {
  x: number;
  y: number;
  i: number;
}

/** Per-skin visual state that lives outside the game rules: drifting decor and weather. */
export class SkinView {
  readonly art: SkinArt;
  decor: Decor[] = [];
  weather: { day: Weather | null; night: Weather | null };
  private nextDecor = 0;

  constructor(art: SkinArt, W: number) {
    this.art = art;
    this.weather = {
      day: art.day.weather ? new Weather(art.day.weather, W) : null,
      night: art.night.weather ? new Weather(art.night.weather, W) : null,
    };
    if (art.decor) {
      let x = 20 + Math.random() * 40;
      while (x < W) {
        this.decor.push(this.makeDecor(x));
        x += art.decor.every[0] + Math.random() * (art.decor.every[1] - art.decor.every[0]) + 20;
      }
      this.nextDecor = x - W;
    }
  }

  private makeDecor(x: number): Decor {
    const d = this.art.decor!;
    return { x, y: Math.round(d.y[0] + Math.random() * (d.y[1] - d.y[0])), i: Math.floor(Math.random() * 64) };
  }

  update(speed: number, W: number, night: number): void {
    const d = this.art.decor;
    if (d) {
      const v = speed * d.speed + (speed > 0 ? 0 : 0);
      for (const it of this.decor) it.x -= v;
      this.decor = this.decor.filter((it) => it.x > -48);
      this.nextDecor -= v;
      if (this.nextDecor <= 0) {
        this.decor.push(this.makeDecor(W + 4));
        this.nextDecor = d.every[0] + Math.random() * (d.every[1] - d.every[0]) + 24;
      }
    }
    if (night < 1) this.weather.day?.update(speed, W);
    if (night > 0) this.weather.night?.update(speed, W);
  }
}

interface Puff {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

export class Renderer {
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  W = 320;
  private skyCache = new Map<string, HTMLCanvasElement>();
  private glyphCache = new Map<string, HTMLCanvasElement>();
  private pool: [HTMLCanvasElement, CanvasRenderingContext2D][] = [];
  private mask!: [HTMLCanvasElement, CanvasRenderingContext2D];
  private maskData!: ImageData;
  private maskPx!: Uint32Array;
  private thrDissolve!: Uint8Array;
  private thrSweep!: Uint8Array;
  private restart = new Map<string, HTMLCanvasElement>();
  private puffs: Puff[] = [];
  touchHint = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.resize(320);
  }

  resize(W: number): void {
    this.W = W;
    this.canvas.width = W;
    this.canvas.height = H;
    this.ctx.imageSmoothingEnabled = false;
    this.pool = Array.from({ length: 5 }, () => makeCanvas(W, H));
    this.mask = makeCanvas(W, H);
    this.maskData = this.mask[1].createImageData(W, H);
    this.maskPx = new Uint32Array(this.maskData.data.buffer);
    this.thrDissolve = new Uint8Array(W * H);
    this.thrSweep = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const b = bayer(x, y);
      this.thrDissolve[y * W + x] = Math.floor(b * 255);
      this.thrSweep[y * W + x] = Math.floor(((1 - x / W) * 0.78 + b * 0.22) * 255);
    }
    this.skyCache.clear();
  }

  /** Landing dust. */
  puff(color: string): void {
    for (let i = 0; i < 5; i++) {
      this.puffs.push({ x: RUNNER_X + 4 + Math.random() * 10, y: GROUND_Y - 1, vx: -0.6 - Math.random() * 1.2, vy: -0.2 - Math.random() * 0.4, life: 14 + Math.random() * 8 });
    }
    void color;
  }

  frame(game: Game, view: SkinView, prev: SkinView | null, switchP: number, night: number, speed: number): void {
    for (const p of this.puffs) { p.x += p.vx - speed * 0.3; p.y += p.vy; p.vy += 0.03; p.life--; }
    this.puffs = this.puffs.filter((p) => p.life > 0);

    if (prev && switchP < 1) {
      const [a, actx] = this.pool[0];
      const [b, bctx] = this.pool[1];
      this.variantScene(actx, game, prev, night);
      this.variantScene(bctx, game, view, night);
      this.composite(this.ctx, a, b, this.thrSweep, switchP);
    } else {
      this.variantScene(this.ctx, game, view, night);
    }
  }

  private variantScene(ctx: CanvasRenderingContext2D, game: Game, view: SkinView, night: number): void {
    if (night <= 0) return this.scene(ctx, game, view, false);
    if (night >= 1) return this.scene(ctx, game, view, true);
    const [d, dctx] = this.pool[2];
    const [n, nctx] = this.pool[3];
    this.scene(dctx, game, view, false);
    this.scene(nctx, game, view, true);
    this.composite(ctx, d, n, this.thrDissolve, night);
  }

  private composite(out: CanvasRenderingContext2D, a: HTMLCanvasElement, b: HTMLCanvasElement, thr: Uint8Array, p: number): void {
    const cut = Math.round(p * 255);
    const px = this.maskPx;
    for (let i = 0; i < px.length; i++) px[i] = thr[i] < cut ? 0xff000000 : 0;
    this.mask[1].putImageData(this.maskData, 0, 0);
    const [t, tctx] = this.pool[4];
    tctx.globalCompositeOperation = 'copy';
    tctx.drawImage(b, 0, 0);
    tctx.globalCompositeOperation = 'destination-in';
    tctx.drawImage(this.mask[0], 0, 0);
    tctx.globalCompositeOperation = 'source-over';
    out.globalCompositeOperation = 'copy';
    out.drawImage(a, 0, 0);
    out.globalCompositeOperation = 'source-over';
    out.drawImage(t, 0, 0);
  }

  private sky(art: SkinArt, v: VariantArt, night: boolean): HTMLCanvasElement {
    const key = `${art.id}|${night}|${this.W}|${v.sky.top}|${v.sky.bottom}`;
    let c = this.skyCache.get(key);
    if (!c) {
      const b = renderSky(this.W, v.sky.top, v.sky.bottom);
      if (v.stars) addStars(b, v.stars, 7);
      c = toCanvas(b);
      this.skyCache.set(key, c);
    }
    return c;
  }

  private scene(ctx: CanvasRenderingContext2D, game: Game, view: SkinView, night: boolean): void {
    const art = view.art;
    const v = night ? art.night : art.day;
    const W = this.W;
    const t = game.tick;
    ctx.globalCompositeOperation = 'copy';
    ctx.drawImage(this.sky(art, v, night), 0, 0);
    ctx.globalCompositeOperation = 'source-over';

    if (v.aurora) this.aurora(ctx, v.aurora, t);
    if (v.stars) this.twinkle(ctx, v.stars, t);
    if (v.celestial) {
      const c = v.celestial;
      ctx.drawImage(toCanvas(c.buf), Math.round(c.x * W - c.buf.w / 2), Math.round(c.y - c.buf.h / 2));
    }
    if (v.decor.length) {
      for (const d of view.decor) {
        const s = v.decor[d.i % v.decor.length];
        ctx.drawImage(toCanvas(s.buf), Math.round(d.x), d.y);
      }
    }
    const scroll = game.distance;
    for (const l of v.layers) this.tile(ctx, toCanvas(l.buf), Math.floor(scroll * l.speed), l.baseline - l.buf.h, TILE_W);
    this.tile(ctx, toCanvas(v.ground), Math.floor(scroll), GROUND_Y - GROUND_LIFT, GROUND_TILE_W);

    const runner = runnerSprite(game, art, v);
    const ry = Math.round(GROUND_Y - game.runner.ry) - runner.baseline;
    const obstacles = game.obstacles.flatMap((o) => placeObstacle(o, art).map((p) => ({ ...p, s: this.variantSprite(p.s, art, v) })));

    if (art.reflection) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, GROUND_Y + 1, W, H - GROUND_Y);
      ctx.clip();
      ctx.globalAlpha = 0.3;
      ctx.setTransform(1, 0, 0, -1, 0, GROUND_Y * 2 + 1);
      const near = v.layers[v.layers.length - 1];
      if (near) this.tile(ctx, toCanvas(near.buf), Math.floor(scroll * near.speed), near.baseline - near.buf.h, TILE_W);
      for (const p of obstacles) ctx.drawImage(toCanvas(p.s.buf), p.x, p.y);
      ctx.drawImage(toCanvas(runner.buf), RUNNER_X, ry);
      ctx.restore();
    }

    const weather = night ? view.weather.night : view.weather.day;
    if (weather?.behind) weather.draw(ctx, W);

    for (const p of obstacles) ctx.drawImage(toCanvas(p.s.buf), p.x, p.y);
    ctx.drawImage(toCanvas(runner.buf), RUNNER_X, ry);

    if (this.puffs.length) {
      ctx.fillStyle = mix(v.ink, v.sky.bottom, 0.45);
      for (const p of this.puffs) if (p.life > 6 || (p.life + Math.round(p.x)) % 2) ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
    }

    if (weather && !weather.behind) weather.draw(ctx, W);

    this.hud(ctx, game, art, v);
  }

  /** Night variants share masks with day; map a day sprite to its night twin. */
  private variantSprite(s: SpriteArt, art: SkinArt, v: VariantArt): SpriteArt {
    if (v === art.day) return s;
    const find = (dl: SpriteArt[][], nl: SpriteArt[][]) => {
      for (let i = 0; i < dl.length; i++) {
        const j = dl[i].indexOf(s);
        if (j >= 0) return nl[i][j];
      }
      return null;
    };
    const fi = art.day.flyer.indexOf(s);
    if (fi >= 0) return v.flyer[fi];
    return find(art.day.small, v.small) ?? find(art.day.large, v.large) ?? s;
  }

  private tile(ctx: CanvasRenderingContext2D, c: HTMLCanvasElement, offset: number, y: number, tw: number): void {
    const off = ((offset % tw) + tw) % tw;
    for (let x = -off; x < this.W; x += tw) ctx.drawImage(c, x, y);
  }

  private aurora(ctx: CanvasRenderingContext2D, colors: [string, string], t: number): void {
    const pts: [number[], number[]] = [[], []];
    drawAurora(this.W, t, (x, y, c) => pts[c].push(x, y));
    for (const c of [1, 0] as const) {
      ctx.fillStyle = colors[c];
      const p = pts[c];
      for (let i = 0; i < p.length; i += 2) ctx.fillRect(p[i], p[i + 1], 1, 1);
    }
  }

  private twinkle(ctx: CanvasRenderingContext2D, color: string, t: number): void {
    ctx.fillStyle = color;
    for (let i = 0; i < 10; i++) {
      const x = (i * 97 + 31) % this.W, y = (i * 53 + 7) % 50;
      const ph = (t + i * 23) % 90;
      if (ph < 12) {
        ctx.fillRect(x, y, 1, 1);
        if (ph > 3 && ph < 9) { ctx.fillRect(x - 1, y, 1, 1); ctx.fillRect(x + 1, y, 1, 1); ctx.fillRect(x, y - 1, 1, 1); ctx.fillRect(x, y + 1, 1, 1); }
      }
    }
  }

  private text(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, color: string, outline?: string): void {
    if (outline) for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) this.text(ctx, s, x + dx, y + dy, outline);
    for (const ch of s) {
      if (ch !== ' ') {
        const key = `${ch}|${color}`;
        let g = this.glyphCache.get(key);
        if (!g) {
          g = toCanvas(textBuffer(ch, color));
          this.glyphCache.set(key, g);
        }
        ctx.drawImage(g, x, y);
      }
      x += GLYPH_ADV;
    }
  }

  private hud(ctx: CanvasRenderingContext2D, game: Game, art: SkinArt, v: VariantArt): void {
    const W = this.W;
    const ink = v.ink;
    const pad = (n: number) => String(Math.min(99999, n)).padStart(5, '0');
    const cur = game.flash > 0 && game.state === 'running' ? (Math.floor(game.flash / 8) % 2 ? '' : pad(game.flashScore)) : pad(game.score);
    const hi = game.hi > 0 ? `HI ${pad(game.hi)}` : '';
    const right = W - 5;
    const halo = v.sky.top;
    if (cur && game.state !== 'ready') this.text(ctx, cur, right - textWidth(pad(0)), 4, ink, halo);
    if (hi) this.text(ctx, hi, right - textWidth(pad(0)) - textWidth(hi) - 10, 4, mix(ink, v.sky.top, 0.35), halo);

    if (game.state === 'over') {
      const msg = art.gameOver;
      const tw = textWidth(msg, 2);
      let x = Math.round((W - tw) / 2);
      for (const ch of msg) {
        if (ch !== ' ') this.text(ctx, ch, x, 26, ink, v.sky.top);
        x += GLYPH_W + 2;
      }
      const key = ink;
      let r = this.restart.get(key);
      if (!r) {
        r = toCanvas(gridToBuffer(RESTART, { '#': ink }));
        this.restart.set(key, r);
      }
      ctx.drawImage(r, Math.round(W / 2 - 5), 40);
    } else if (game.state === 'ready' && Math.floor(game.tick / 40) % 4 !== 3) {
      const msg = this.touchHint ? 'TAP TO RUN' : 'PRESS SPACE TO RUN';
      this.text(ctx, msg, Math.round((W - textWidth(msg)) / 2), 30, mix(ink, v.sky.bottom, 0.15));
    }
    void GLYPH_H;
  }
}
