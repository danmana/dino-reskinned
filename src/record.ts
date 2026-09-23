// Offline showcase recorder (dev only, not part of the site build).
// Drives the real engine, bot and renderer one tick per video frame, frames
// the game in a 1920x1080 layout and POSTs PNG frames plus an offline render
// of the game's own sounds to scripts/record-server.ts.
//
//   node scripts/record-server.ts & npx vite   → open /record.html?go
import { PRESETS } from './skins/index.ts';
import { compileSkin, gridToBuffer, type SkinArt } from './render/compile.ts';
import { Renderer, SkinView, toCanvas } from './render/renderer.ts';
import { Game } from './game/engine.ts';
import { Bot } from './game/bot.ts';
import { rng } from './core/rng.ts';
import { bayer } from './core/dither.ts';
import { textBuffer, textWidth } from './core/font.ts';
import { mix } from './core/color.ts';
import { H } from './game/constants.ts';
import { buildCustomArt, type CustomSkin } from './skins/custom.ts';
import { makeNoise, scheduleSfx, type Sfx } from './game/audio.ts';
import type { SoundPreset } from './skins/types.ts';

const FPS = 60;
const VW = 1920;
const VH = 1080;
const W = 320;
const K = VW / W; // 6 video px per art px
const GAME_Y = 180;
const SERVER = 'http://127.0.0.1:5318';
const PREWARM = 2700; // 45 s of play first, so flyers are in the mix and the pace is up
const SWITCH_FRAMES = 26;
const M = 96; // side margin

const presetMap = new Map(PRESETS.map((p) => [p.id, p]));
const arts = new Map<string, SkinArt>();
const art = (id: string) => {
  let a = arts.get(id);
  if (!a) arts.set(id, (a = compileSkin(presetMap.get(id)!)));
  return a;
};

const frog: CustomSkin = {
  v: 1,
  id: 'my-frog-hop',
  name: 'Frog Hop',
  cast: { runner: { emoji: '🐸' }, small: { emoji: '🍄' }, large: { emoji: '🌵' }, flyer: { emoji: '🐝' }, decor: { emoji: '☁️' } },
  colors: { skyTop: '#8ecdf7', skyBottom: '#e3f5ff', far: '#b3dcae', near: '#5d9f5f', ground: '#7fbe5f', ink: '#1f3d26' },
  inkCast: false,
  far: 'hills',
  near: 'forest',
  ground: 'grass',
  weather: 'petals',
  celestial: 'sun',
  sound: 'sweet',
};

interface Seg {
  art: SkinArt;
  frames: number;
  night?: boolean;
  /** Night falls this many frames into the segment. */
  nightFrom?: number;
  title: string;
  tagline: string;
  counter?: string;
}

function storyboard(): Seg[] {
  const n = PRESETS.length;
  const segs: Seg[] = PRESETS.map((p, i) => ({
    art: art(p.id),
    frames: i === 0 ? 200 : 150,
    title: p.name,
    tagline: p.tagline,
    counter: `${String(i + 1).padStart(2, '0')}/${n}`,
  }));
  segs[0].nightFrom = 100;
  const polar = segs.find((s) => s.art.id === 'polar');
  if (polar) polar.night = true;
  segs.push({ art: buildCustomArt(frog, presetMap), frames: 170, title: 'Make your own', tagline: 'Any emoji or sprite, six colours and a world. About a minute.' });
  segs.push({ art: art('original'), frames: 170, title: 'dino-reskinned.vercel.app', tagline: 'Eleven worlds. Switch mid-run. Make your own.' });
  return segs;
}

// ---------------------------------------------------------------- drawing helpers

const glyphs = new Map<string, HTMLCanvasElement>();
function bitmap(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, scale: number, color: string): void {
  const key = `${s}|${color}`;
  let c = glyphs.get(key);
  if (!c) glyphs.set(key, (c = toCanvas(textBuffer(s, color))));
  ctx.drawImage(c, x, y, c.width * scale, c.height * scale);
}

const KEY = [
  '.###########.',
  '#...........#',
  '#.....#.....#',
  '#.....##....#',
  '#.#########.#',
  '#.....##....#',
  '#.....#.....#',
  '#...........#',
  '.###########.',
];
const keyCache = new Map<string, HTMLCanvasElement>();
function keycap(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, fg: string, face: string, down: boolean): void {
  const k = `${fg}|${face}`;
  let c = keyCache.get(k);
  if (!c) {
    const rows = KEY.map((r) => r.replace(/\./g, 'f'));
    rows[0] = '.' + rows[0].slice(1, -1) + '.';
    rows[8] = '.' + rows[8].slice(1, -1) + '.';
    keyCache.set(k, (c = toCanvas(gridToBuffer(rows, { '#': fg, f: face }))));
  }
  // Unpressed keys stand on a solid base; pressed ones sink onto it.
  const depth = s * 2;
  if (!down) {
    ctx.fillStyle = fg;
    ctx.fillRect(x + s, y + 9 * s, 11 * s, depth);
    ctx.fillRect(x, y + 8 * s, s, depth);
    ctx.fillRect(x + 12 * s, y + 8 * s, s, depth);
  }
  ctx.drawImage(c, x, y + (down ? depth : 0), c.width * s, c.height * s);
}

interface Theme {
  bg: string;
  fg: string;
  muted: string;
  face: string;
}
const themeOf = (a: SkinArt): Theme => ({ bg: a.ui.bg, fg: a.ui.fg, muted: mix(a.ui.fg, a.ui.bg, 0.38), face: mix(a.ui.bg, a.ui.fg, 0.08) });

function drawFrame(ctx: CanvasRenderingContext2D, game: HTMLCanvasElement, seg: Seg, t: Theme, keyDown: boolean): void {
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, VW, VH);
  bitmap(ctx, 'DINO', M, 62, 6, t.fg);
  bitmap(ctx, 'RESKINNED', M + textWidth('DINO') * 6 + 30, 62 + 21, 3, t.muted);
  const hint = 'SWITCH SKINS MID-RUN';
  const hintW = textWidth(hint) * 3;
  bitmap(ctx, hint, VW - M - hintW, 74, 3, t.muted);
  keycap(ctx, VW - M - hintW - 26 - 13 * 5, 50, 5, t.fg, t.face, keyDown);
  ctx.drawImage(game, 0, GAME_Y, VW, H * K);
  bitmap(ctx, seg.title.toUpperCase(), M, 836, 10, t.fg);
  ctx.font = '500 40px "Pixelify Sans"';
  ctx.fillStyle = t.muted;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(seg.tagline, M, 990);
  if (seg.counter) bitmap(ctx, seg.counter, VW - M - textWidth(seg.counter) * 6, 850, 6, t.muted);
}

// ---------------------------------------------------------------- simulation

function newGame(first: SkinArt, seed: number): { game: Game; bot: Bot } {
  const game = new Game(first);
  game.rand = rng(seed);
  game.worldW = W;
  const bot = new Bot();
  for (let i = 0; i < PREWARM; i++) {
    game.step(bot.decide(game));
    game.events.length = 0;
  }
  return { game, bot };
}

/** Same seed, same inputs, same skins → same run. Returns false if the bot would crash. */
function survives(segs: Seg[], seed: number): boolean {
  const { game, bot } = newGame(segs[0].art, seed);
  if (game.state !== 'running') return false;
  for (const seg of segs) {
    game.art = seg.art;
    for (let j = 0; j < seg.frames; j++) {
      game.step(bot.decide(game));
      game.events.length = 0;
      if (game.state !== 'running') return false;
    }
  }
  return true;
}

// ---------------------------------------------------------------- audio

function wav(buf: AudioBuffer): Blob {
  const ch = buf.numberOfChannels, len = buf.length, rate = buf.sampleRate;
  const out = new DataView(new ArrayBuffer(44 + len * ch * 2));
  const str = (o: number, s: string) => [...s].forEach((c, i) => out.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF'); out.setUint32(4, 36 + len * ch * 2, true); str(8, 'WAVE');
  str(12, 'fmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, ch, true);
  out.setUint32(24, rate, true); out.setUint32(28, rate * ch * 2, true); out.setUint16(32, ch * 2, true); out.setUint16(34, 16, true);
  str(36, 'data'); out.setUint32(40, len * ch * 2, true);
  const data = Array.from({ length: ch }, (_, c) => buf.getChannelData(c));
  let o = 44;
  for (let i = 0; i < len; i++) for (let c = 0; c < ch; c++) {
    const v = Math.max(-1, Math.min(1, data[c][i]));
    out.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7fff, true);
    o += 2;
  }
  return new Blob([out.buffer], { type: 'audio/wav' });
}

async function renderAudio(events: { t: number; sfx: Sfx; preset: SoundPreset }[], seconds: number): Promise<Blob> {
  const rate = 44100;
  const oc = new OfflineAudioContext(2, Math.ceil(rate * seconds), rate);
  const master = oc.createGain();
  master.gain.value = 0.9;
  master.connect(oc.destination);
  const noise = makeNoise(oc);
  for (const e of events) scheduleSfx(oc, master, noise, e.sfx, e.preset, e.t + 0.01);
  return wav(await oc.startRendering());
}

// ---------------------------------------------------------------- record

const rec = { frame: 0, total: 0, status: 'idle', seed: 0 };
(window as unknown as { __rec: typeof rec }).__rec = rec;
const log = (m: string) => {
  document.getElementById('log')!.textContent += m + '\n';
  void fetch(`${SERVER}/log`, { method: 'POST', body: m }).catch(() => {});
};

async function record(): Promise<void> {
  await document.fonts.load('500 40px "Pixelify Sans"');
  const segs = storyboard();
  rec.total = segs.reduce((s, x) => s + x.frames, 0);
  let seed = 1;
  while (!survives(segs, seed)) seed++;
  rec.seed = seed;
  log(`seed ${seed}, ${rec.total} frames (${(rec.total / FPS).toFixed(1)} s)`);

  const gameCanvas = document.createElement('canvas');
  const renderer = new Renderer(gameCanvas);
  renderer.resize(W);
  const { game, bot } = newGame(segs[0].art, seed);

  const out = document.getElementById('v') as HTMLCanvasElement;
  out.width = VW;
  out.height = VH;
  const octx = out.getContext('2d')!;
  const [vb, vbctx] = (() => { const c = document.createElement('canvas'); c.width = VW; c.height = VH; return [c, c.getContext('2d')!] as const; })();
  const mask = document.createElement('canvas');
  mask.width = W;
  mask.height = VH / K;
  const mctx = mask.getContext('2d')!;
  const mdata = mctx.createImageData(W, VH / K);
  const mpx = new Uint32Array(mdata.data.buffer);
  const thr = new Uint8Array(W * (VH / K));
  for (let y = 0; y < VH / K; y++) for (let x = 0; x < W; x++) thr[y * W + x] = Math.floor(((1 - x / W) * 0.78 + bayer(x, y - GAME_Y / K) * 0.22) * 255);

  const events: { t: number; sfx: Sfx; preset: SoundPreset }[] = [];
  const inflight = new Set<Promise<unknown>>();
  let view = new SkinView(segs[0].art, W);
  let prev: SkinView | null = null;
  let prevSeg: Seg | null = null;
  let switchT = 1;
  let night = segs[0].night ? 1 : 0;
  let prevNight = 0;
  let keyDown = 0;
  let f = 0;
  rec.status = 'recording';

  for (let si = 0; si < segs.length; si++) {
    const seg = segs[si];
    if (si > 0) {
      prev = view;
      prevSeg = segs[si - 1];
      prevNight = night;
      view = new SkinView(seg.art, W);
      view.decor = prev.decor.map((d) => ({ ...d }));
      game.art = seg.art;
      night = seg.night ? 1 : 0;
      switchT = 0;
      keyDown = 12;
      events.push({ t: f / FPS, sfx: 'switch', preset: seg.art.sound });
    }
    for (let j = 0; j < seg.frames; j++, f++) {
      if (seg.nightFrom !== undefined && j >= seg.nightFrom) night = Math.min(1, night + 1 / 50);
      game.step(bot.decide(game));
      for (const ev of game.events) {
        if (ev === 'jump' || ev === 'score' || ev === 'crash') events.push({ t: f / FPS, sfx: ev, preset: game.art.sound });
        else if (ev === 'land') renderer.puff(game.art.day.ink);
      }
      game.events.length = 0;
      view.update(game.speed, W, night);
      prev?.update(game.speed, W, prevNight);
      const e = switchT * switchT * (3 - 2 * switchT);
      renderer.frame(game, view, prev, e, night, game.speed, prevNight);

      const pressed = keyDown > 0;
      if (prev && prevSeg && switchT < 1) {
        drawFrame(octx, gameCanvas, prevSeg, themeOf(prevSeg.art), pressed);
        drawFrame(vbctx, gameCanvas, seg, themeOf(seg.art), pressed);
        const cut = Math.round(e * 255);
        for (let i = 0; i < mpx.length; i++) mpx[i] = thr[i] < cut ? 0xff000000 : 0;
        mctx.putImageData(mdata, 0, 0);
        vbctx.globalCompositeOperation = 'destination-in';
        vbctx.imageSmoothingEnabled = false;
        vbctx.drawImage(mask, 0, 0, VW, VH);
        vbctx.globalCompositeOperation = 'source-over';
        octx.drawImage(vb, 0, 0);
      } else drawFrame(octx, gameCanvas, seg, themeOf(seg.art), pressed);

      if (switchT < 1) {
        switchT = Math.min(1, switchT + 1 / SWITCH_FRAMES);
        if (switchT >= 1) prev = null;
      }
      if (keyDown > 0) keyDown--;

      const blob = await new Promise<Blob>((res) => out.toBlob((b) => res(b!), 'image/png'));
      const n = f;
      const p = fetch(`${SERVER}/frame/${n}`, { method: 'POST', body: blob }).finally(() => inflight.delete(p));
      inflight.add(p);
      if (inflight.size >= 6) await Promise.race(inflight);
      rec.frame = f + 1;
      if (game.state !== 'running') log(`warning: game state ${game.state} at frame ${f}`);
    }
  }
  await Promise.all(inflight);
  log('rendering audio');
  const audio = await renderAudio(events, rec.total / FPS + 0.6);
  await fetch(`${SERVER}/audio`, { method: 'POST', body: audio });
  await fetch(`${SERVER}/done`, { method: 'POST', body: JSON.stringify({ frames: rec.total, fps: FPS, seed, sounds: events.length }) });
  rec.status = 'done';
  log(`done: ${rec.total} frames, ${events.length} sounds`);
}

if (new URLSearchParams(location.search).has('go')) void record().catch((e) => { rec.status = `error: ${e}`; log(String(e)); });
