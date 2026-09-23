// Dev-only: turns a demo capture (.rec/demo from demo-capture.ts) into video
// frames. Each output frame is the page screenshot for its segment with the
// exact game frame laid over the canvas, plus a cursor, click rings and step
// captions. Frames are POSTed to scripts/record-server.ts for ffmpeg.
//   node scripts/record-server.ts .rec/demo-out & npx vite → /demo-compose.html?go
import type { Segment } from './demo-capture.ts';

const SERVER = 'http://127.0.0.1:5318';
const SRC = '/.rec/demo';
const VW = 1920;
const VH = 1080;
const FADE = 9;

interface Meta {
  frames: number;
  segs: Segment[];
  viewport: [number, number];
}

const img = async (url: string) => {
  const el = new Image();
  el.src = url;
  await el.decode();
  return el;
};
const pad = (n: number, w: number) => String(n).padStart(w, '0');
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

// Classic arrow pointer, drawn as pixels so it matches the game.
const ARROW = [
  'X...........',
  'XX..........',
  'XoX.........',
  'XooX........',
  'XoooX.......',
  'XooooX......',
  'XoooooX.....',
  'XooooooX....',
  'XoooooooX...',
  'XooooooooX..',
  'XoooooooooX.',
  'XooooooXXXXX',
  'XoooXooX....',
  'XooX.XooX...',
  'XoX..XooX...',
  'XX....XooX..',
  'X.....XooX..',
  '.......XX...',
];

function drawArrow(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ARROW.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (ch === '.') continue;
      ctx.fillStyle = ch === 'X' ? '#161616' : '#ffffff';
      ctx.fillRect(Math.round(x + i * s), Math.round(y + j * s), Math.ceil(s), Math.ceil(s));
    }
  });
}

function caption(ctx: CanvasRenderingContext2D, step: string | undefined, text: string, t: number): void {
  if (!text) return;
  const a = Math.min(1, t / 10);
  const lift = (1 - ease(a)) * 18;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.font = '600 38px "Pixelify Sans"';
  const tw = ctx.measureText(text).width;
  const badge = step ? 58 : 0;
  const w = tw + 56 + badge;
  const h = 78;
  const x = 44, y = VH - 44 - h + lift;
  const b = 5;
  ctx.fillStyle = 'rgba(22, 20, 20, 0.9)';
  ctx.fillRect(x + b, y, w - 2 * b, h);
  ctx.fillRect(x, y + b, w, h - 2 * b);
  if (step) {
    ctx.fillStyle = '#d8403a';
    ctx.fillRect(x + 22, y + 17, 44, 44);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 32px "Pixelify Sans"';
    ctx.textAlign = 'center';
    ctx.fillText(step, x + 44, y + 51);
    ctx.textAlign = 'left';
  }
  ctx.font = '600 38px "Pixelify Sans"';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, x + 28 + badge, y + 52);
  ctx.restore();
}

async function compose(): Promise<void> {
  const log = (m: string) => (document.getElementById('log')!.textContent += m + '\n');
  await document.fonts.load('600 38px "Pixelify Sans"');
  const meta: Meta = await (await fetch(`${SRC}/meta.json`)).json();
  const S = VW / meta.viewport[0];
  const out = document.getElementById('v') as HTMLCanvasElement;
  out.width = VW;
  out.height = VH;
  const ctx = out.getContext('2d')!;
  const shots = new Map<number, HTMLImageElement>();
  const shot = async (n: number) => {
    let s = shots.get(n);
    if (!s) shots.set(n, (s = await img(`${SRC}/shots/${pad(n, 3)}.png`)));
    return s;
  };

  // Clicks happen a couple of frames after the cursor arrives, near the end of a segment.
  const clicks: { at: number; x: number; y: number }[] = [];
  const moveOf = (seg: Segment) => {
    const n = seg.to - seg.from;
    return seg.cursor.click ? Math.max(8, n - 10) : Math.min(n, 48);
  };
  for (const seg of meta.segs) if (seg.cursor.click) clicks.push({ at: seg.from + moveOf(seg) + 2, x: seg.cursor.x1, y: seg.cursor.y1 });

  const last = meta.segs[meta.segs.length - 1];
  const inflight = new Set<Promise<unknown>>();
  let prevShot: HTMLImageElement | null = null;
  let prevCaption = '';
  let captionT = 0;
  for (let si = 0; si < meta.segs.length; si++) {
    const seg = meta.segs[si];
    const cur = await shot(seg.shot);
    const changed = si > 0 && meta.segs[si - 1].shot !== seg.shot;
    const n = seg.to - seg.from;
    const M = moveOf(seg);
    for (let k = 0; k < n; k++) {
      const f = seg.from + k;
      ctx.imageSmoothingEnabled = true;
      if (changed && prevShot && k < FADE) {
        ctx.globalAlpha = 1;
        ctx.drawImage(prevShot, 0, 0, VW, VH);
        ctx.globalAlpha = (k + 1) / (FADE + 1);
        ctx.drawImage(cur, 0, 0, VW, VH);
        ctx.globalAlpha = 1;
      } else ctx.drawImage(cur, 0, 0, VW, VH);

      const frame = await img(`${SRC}/frames/${pad(f, 5)}.png`);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(frame, Math.round(seg.rect.x * S), Math.round(seg.rect.y * S), Math.round(seg.rect.w * S), Math.round(seg.rect.h * S));

      // Captions: the last segment ends on the address.
      let step = seg.step, text = seg.caption ?? '';
      if (seg === last && k > 130) { step = undefined; text = 'Make yours at dino-reskinned.vercel.app'; }
      const key = `${step}|${text}`;
      if (key !== prevCaption) { prevCaption = key; captionT = 0; }
      caption(ctx, step, text, captionT++);

      for (const c of clicks) {
        const age = f - c.at;
        if (age < 0 || age > 16) continue;
        const r = 8 + age * 2.4;
        ctx.save();
        ctx.globalAlpha = 1 - age / 16;
        ctx.strokeStyle = '#d8403a';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(c.x * S, c.y * S, r * S * 0.9, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      const t = M > 0 ? ease(Math.min(1, k / M)) : 1;
      const cx = seg.cursor.x0 + (seg.cursor.x1 - seg.cursor.x0) * t;
      const cy = seg.cursor.y0 + (seg.cursor.y1 - seg.cursor.y0) * t;
      const pressed = clicks.some((c) => f - c.at >= -2 && f - c.at < 5);
      drawArrow(ctx, cx * S, cy * S, pressed ? 2.6 : 3);

      const blob = await new Promise<Blob>((res) => out.toBlob((b) => res(b!), 'image/png'));
      const p = fetch(`${SERVER}/frame/${f}`, { method: 'POST', body: blob }).finally(() => inflight.delete(p));
      inflight.add(p);
      if (inflight.size > 6) await Promise.race(inflight);
    }
    prevShot = cur;
    log(`segment ${si + 1}/${meta.segs.length}`);
  }
  await Promise.all(inflight);
  await fetch(`${SERVER}/done`, { method: 'POST', body: JSON.stringify({ frames: meta.frames }) });
  log('done');
}

if (new URLSearchParams(location.search).has('go')) void compose().catch((e) => (document.getElementById('log')!.textContent += String(e)));
