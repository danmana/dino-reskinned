// Dev-only helper for recording UI demos (loaded by main.ts with ?capture).
//
// The real-time loop is paused; each segment advances the game frame by frame
// and posts the game canvas to scripts/record-server.ts, together with a
// timeline that says which page screenshot each frame belongs on, where the
// canvas sits, where the cursor goes and what the caption says.
// src/demo-compose.ts turns that into the finished video.
import { makeNoise, scheduleSfx, type Sfx } from './game/audio.ts';
import { wav } from './core/wav.ts';
import type { SoundPreset } from './skins/types.ts';

const SERVER = 'http://127.0.0.1:5318';

interface DinoHandle {
  hooks: { held: boolean; onEvent: ((ev: string, preset: string) => void) | null };
  step(): void;
  canvas: HTMLCanvasElement;
}

export interface Segment {
  shot: number;
  from: number;
  to: number;
  rect: { x: number; y: number; w: number; h: number };
  cursor: { x0: number; y0: number; x1: number; y1: number; click: boolean };
  caption?: string;
  step?: string;
}

const dino = (window as unknown as { __dino: DinoHandle }).__dino;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const ROLE_LABEL: Record<string, string> = { runner: 'Runner', small: 'Small obstacle', large: 'Tall obstacle', flyer: 'Flyer', decor: 'Sky decoration' };

const cap = {
  frame: 0,
  segs: [] as Segment[],
  events: [] as { frame: number; sfx: Sfx; preset: SoundPreset }[],
  cursor: { x: 900, y: 420 },

  start(): void {
    dino.hooks.held = true;
    dino.hooks.onEvent = (ev, preset) => {
      if (ev === 'jump' || ev === 'score' || ev === 'crash') cap.events.push({ frame: cap.frame, sfx: ev, preset: preset as SoundPreset });
    };
  },

  /** Centre of an element in viewport CSS px. */
  center(el: Element | null): [number, number] | null {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)];
  },

  row(role: string): HTMLElement | null {
    return [...document.querySelectorAll<HTMLElement>('#designer .role-row')].find((r) => r.querySelector('.d-label span')?.textContent === ROLE_LABEL[role]) ?? null;
  },

  /** Scrolls the designer so an element sits near the top of the panel. */
  reveal(el: Element | null, offset = 70): void {
    const panel = document.getElementById('designer')!;
    if (!el) return;
    const top = el.getBoundingClientRect().top - panel.getBoundingClientRect().top + panel.scrollTop - offset;
    panel.scrollTop = Math.max(0, top);
  },

  /** Runs n game frames on top of screenshot `shot`, moving the cursor to `to`. */
  async segment(shot: number, n: number, opts: { to?: [number, number] | null; click?: boolean; caption?: string; step?: string } = {}): Promise<Segment> {
    const r = dino.canvas.getBoundingClientRect();
    const to = opts.to ?? [cap.cursor.x, cap.cursor.y];
    const seg: Segment = {
      shot,
      from: cap.frame,
      to: cap.frame + n,
      rect: { x: r.left, y: r.top, w: r.width, h: r.height },
      cursor: { x0: cap.cursor.x, y0: cap.cursor.y, x1: to[0], y1: to[1], click: !!opts.click },
      caption: opts.caption,
      step: opts.step,
    };
    const inflight = new Set<Promise<unknown>>();
    for (let i = 0; i < n; i++) {
      dino.step();
      const blob = await new Promise<Blob>((res) => dino.canvas.toBlob((b) => res(b!), 'image/png'));
      const p = fetch(`${SERVER}/frame/${cap.frame}`, { method: 'POST', body: blob }).finally(() => inflight.delete(p));
      inflight.add(p);
      if (inflight.size > 8) await Promise.race(inflight);
      cap.frame++;
    }
    await Promise.all(inflight);
    cap.segs.push(seg);
    cap.cursor = { x: to[0], y: to[1] };
    return seg;
  },

  /** Hands a file to an upload input exactly as a file picker would. */
  async upload(input: HTMLInputElement | null, url: string, name: string): Promise<void> {
    if (!input) throw new Error(`no input for ${name}`);
    const blob = await (await fetch(url)).blob();
    const dt = new DataTransfer();
    dt.items.add(new File([blob], name, { type: blob.type || 'image/png' }));
    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await wait(900);
  },

  async finish(): Promise<void> {
    const rate = 44100;
    const seconds = cap.frame / 60 + 0.6;
    const oc = new OfflineAudioContext(2, Math.ceil(rate * seconds), rate);
    const master = oc.createGain();
    master.gain.value = 0.9;
    master.connect(oc.destination);
    const noise = makeNoise(oc);
    for (const e of cap.events) scheduleSfx(oc, master, noise, e.sfx, e.preset, e.frame / 60 + 0.01);
    const buf = await oc.startRendering();
    await fetch(`${SERVER}/audio`, { method: 'POST', body: wav(buf) });
    const meta = { frames: cap.frame, fps: 60, segs: cap.segs, viewport: [innerWidth, innerHeight], dpr: devicePixelRatio };
    await fetch(`${SERVER}/done`, { method: 'POST', body: JSON.stringify(meta) });
  },
};


(window as unknown as { __cap: typeof cap }).__cap = cap;
