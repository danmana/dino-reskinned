import './style.css';
import { PRESETS } from './skins/index.ts';
import { compileSkin, type SkinArt } from './render/compile.ts';
import { Renderer, SkinView } from './render/renderer.ts';
import { Game, type Input } from './game/engine.ts';
import { Bot } from './game/bot.ts';
import { Audio } from './game/audio.ts';
import { H, MAX_W, MIN_W, STEP_MS } from './game/constants.ts';
import { textSvg } from './core/font.ts';
import { contrast } from './core/color.ts';
import { thumbnail } from './ui/thumbs.ts';
import { Designer } from './ui/designer.ts';
import { buildCustomArt, decodeSkin, encodeSkin, fromPreset, newId, type CustomSkin } from './skins/custom.ts';

// ---------------------------------------------------------------- storage

const store = {
  get<T>(k: string, fallback: T): T {
    try {
      const v = localStorage.getItem(k);
      return v === null ? fallback : (JSON.parse(v) as T);
    } catch {
      return fallback;
    }
  },
  set(k: string, v: unknown): void {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {
      /* private mode or storage full: the game still works, it just forgets */
    }
  },
};

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

// ---------------------------------------------------------------- skins

const presetMap = new Map(PRESETS.map((p) => [p.id, p]));
let customs: CustomSkin[] = store.get<CustomSkin[]>('dino.custom', []).filter((c) => c?.v === 1);
const arts = new Map<string, SkinArt>();

interface Entry {
  id: string;
  name: string;
}

const entries = (): Entry[] => [
  ...PRESETS.map((p) => ({ id: p.id, name: p.name })),
  ...customs.map((c) => ({ id: c.id, name: c.name.trim() || 'Untitled skin' })),
];

function art(id: string): SkinArt {
  let a = arts.get(id);
  if (!a) {
    const p = presetMap.get(id);
    const c = customs.find((x) => x.id === id);
    a = p ? compileSkin(p) : c ? buildCustomArt(c, presetMap) : art('original');
    arts.set(id, a);
  }
  return a;
}

// Shared links carry a whole custom skin in the hash.
let imported: CustomSkin | null = null;
{
  const m = location.hash.match(/skin=([A-Za-z0-9_-]+)/);
  if (m) {
    const c = await decodeSkin(m[1]);
    if (c) {
      if (!customs.some((x) => x.id === c.id)) customs.push(c);
      store.set('dino.custom', customs);
      imported = c;
    }
    history.replaceState(null, '', location.pathname + location.search);
  }
}

let currentId = imported?.id ?? store.get('dino.skin', 'original');
if (!entries().some((e) => e.id === currentId)) currentId = 'original';

// ---------------------------------------------------------------- game

const canvas = $<HTMLCanvasElement>('game');
const stage = $('stage');
const renderer = new Renderer(canvas);
const game = new Game(art(currentId));
game.hi = store.get('dino.hi', 0);
const bot = new Bot();
const audio = new Audio();
audio.muted = store.get('dino.muted', false);
let autoplay = store.get('dino.autoplay', false);
let view = new SkinView(game.art, renderer.W);
let prevView: SkinView | null = null;
let switchT = 1;
let nightMix = 0;
let designing = false;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

const human = {
  jump: false,
  down: false,
  jumpPressed: false,
  downPressed: false,
  consume(): Input {
    const i = { jump: this.jump, jumpPressed: this.jumpPressed, down: this.down, downPressed: this.downPressed };
    this.jumpPressed = false;
    this.downPressed = false;
    return i;
  },
};

function tick(): void {
  const inp = autoplay || designing ? bot.decide(game) : human.consume();
  game.step(inp);
  for (const ev of game.events) {
    if (ev === 'jump') audio.play('jump', game.art.sound);
    else if (ev === 'score') audio.play('score', game.art.sound);
    else if (ev === 'land') renderer.puff(game.art.day.ink);
    else if (ev === 'crash') {
      audio.play('crash', game.art.sound);
      store.set('dino.hi', game.hi);
    }
  }
  game.events.length = 0;
  const speed = game.state === 'running' ? game.speed : 0;
  view.update(speed, renderer.W, nightMix);
  prevView?.update(speed, renderer.W, nightMix);
  const target = game.night ? 1 : 0;
  if (nightMix !== target) nightMix = target > nightMix ? Math.min(1, nightMix + 1 / 50) : Math.max(0, nightMix - 1 / 50);
  if (switchT < 1) {
    switchT = Math.min(1, switchT + 1 / 26);
    if (switchT >= 1) prevView = null;
  }
}

let last = performance.now();
let acc = 0;
function frame(now: number): void {
  acc += Math.min(100, now - last);
  last = now;
  let steps = 0;
  while (acc >= STEP_MS && steps < 6) {
    tick();
    acc -= STEP_MS;
    steps++;
  }
  if (steps === 6) acc = 0;
  const e = switchT * switchT * (3 - 2 * switchT);
  renderer.frame(game, view, prevView, e, nightMix, game.state === 'running' ? game.speed : 0);
  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------- layout

function layout(): void {
  const cssW = stage.clientWidth;
  if (!cssW) return;
  const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
  const mobileSheet = designing && window.innerWidth <= 760;
  const maxH = Math.min(300, window.innerHeight * (mobileSheet ? 0.28 : 0.46));
  const targetH = Math.max(96, Math.min(maxH, cssW / (cssW < 640 ? 2.2 : 3.1)));
  let s = Math.max(1, Math.round((targetH * dpr) / H));
  while (s > 1 && Math.floor((cssW * dpr) / s) < MIN_W) s--;
  const W = Math.max(MIN_W, Math.min(MAX_W, Math.floor((cssW * dpr) / s)));
  const w = Math.min(cssW, (W * s) / dpr);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${(w * H) / W}px`;
  if (W !== renderer.W) {
    renderer.resize(W);
    game.worldW = W;
    view = new SkinView(view.art, W);
    prevView = null;
  }
}
new ResizeObserver(layout).observe(stage);
window.addEventListener('resize', layout);

// ---------------------------------------------------------------- theme + now playing

const root = document.documentElement;
const meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;

function theme(a: SkinArt): void {
  const { bg, fg, accent } = a.ui;
  root.style.setProperty('--bg', bg);
  root.style.setProperty('--fg', fg);
  root.style.setProperty('--accent', accent);
  root.style.setProperty('--on-accent', contrast(accent, '#ffffff') > contrast(accent, '#111111') ? '#ffffff' : '#111111');
  meta.content = bg;
}

function nowPlaying(a: SkinArt): void {
  const name = $('skinName');
  name.innerHTML = textSvg(a.name.toUpperCase());
  name.setAttribute('aria-label', a.name);
  $('skinTag').textContent = a.tagline;
  $('edit').hidden = !a.custom || designing;
  $('make').hidden = designing;
  for (const t of rail.querySelectorAll<HTMLElement>('.tile[data-id]')) t.setAttribute('aria-current', String(t.dataset.id === a.id));
}

function applySkin(a: SkinArt, animate: boolean): void {
  const old = view;
  prevView = animate && !reduced.matches ? old : null;
  view = new SkinView(a, renderer.W);
  if (!animate) view.decor = old.decor.map((d) => ({ ...d }));
  switchT = prevView ? 0 : 1;
  game.art = a;
  theme(a);
  nowPlaying(a);
}

function setSkin(id: string, animate = true): void {
  if (id === game.art.id && !designing) return;
  currentId = id;
  store.set('dino.skin', id);
  const a = art(id);
  applySkin(a, animate);
  audio.play('switch', a.sound);
}

function stepSkin(dir: number): void {
  const list = entries();
  const i = list.findIndex((e) => e.id === currentId);
  setSkin(list[(i + dir + list.length) % list.length].id);
  (rail.querySelector(`[data-id="${CSS.escape(currentId)}"]`) as HTMLElement | null)?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduced.matches ? 'auto' : 'smooth' });
}

// ---------------------------------------------------------------- rail

const rail = $('rail');
let thumbQueue: (() => void)[] = [];
const idle = (fn: () => void) => ('requestIdleCallback' in window ? requestIdleCallback(() => fn(), { timeout: 400 }) : setTimeout(fn, 30));
function pumpThumbs(): void {
  const job = thumbQueue.shift();
  if (!job) return;
  job();
  idle(pumpThumbs);
}

function buildRail(): void {
  rail.replaceChildren();
  thumbQueue = [];
  entries().forEach((e, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tile';
    b.dataset.id = e.id;
    b.setAttribute('aria-current', String(e.id === currentId));
    b.setAttribute('aria-label', `${e.name}${i < 10 ? `, key ${(i + 1) % 10}` : ''}`);
    const cv = document.createElement('canvas');
    cv.width = 84;
    cv.height = 44;
    const lab = document.createElement('span');
    lab.className = 'label';
    lab.innerHTML = `<b></b><span class="num" aria-hidden="true">${i < 10 ? (i + 1) % 10 : ''}</span>`;
    lab.querySelector('b')!.textContent = e.name;
    b.append(cv, lab);
    b.addEventListener('click', () => setSkin(e.id));
    rail.append(b);
    thumbQueue.push(() => thumbnail(art(e.id), cv));
  });
  const add = document.createElement('button');
  add.type = 'button';
  add.className = 'tile add';
  add.innerHTML = '<svg viewBox="0 0 7 7" aria-hidden="true" shape-rendering="crispEdges"><path d="M3 0h1v3h3v1H4v3H3V4H0V3h3z" fill="currentColor"/></svg><span>New skin</span>';
  add.addEventListener('click', () => openDesigner());
  rail.append(add);
  idle(pumpThumbs);
}

// ---------------------------------------------------------------- designer

let autoplayBefore = false;
let beforeId = currentId;

const designer = new Designer($('designer'), {
  presets: PRESETS,
  presetArt: art,
  preview(c) {
    applySkin(buildCustomArt(c, presetMap), false);
  },
  save(c) {
    const clean = { ...c, name: c.name.trim() || 'Untitled skin' };
    const i = customs.findIndex((x) => x.id === clean.id);
    if (i >= 0) customs[i] = clean;
    else customs.push(clean);
    store.set('dino.custom', customs);
    arts.set(clean.id, buildCustomArt(clean, presetMap));
    closeDesigner();
    buildRail();
    setSkin(clean.id, false);
    toast(`Saved ${clean.name}. It's in your skins now.`);
  },
  remove(id) {
    customs = customs.filter((x) => x.id !== id);
    store.set('dino.custom', customs);
    arts.delete(id);
    if (beforeId === id) beforeId = 'original';
    closeDesigner();
    buildRail();
    setSkin(beforeId, false);
    toast('Skin deleted.');
  },
  close() {
    closeDesigner();
    setSkin(beforeId, false);
  },
  async shareUrl(c) {
    return `${location.origin}${location.pathname}#skin=${await encodeSkin({ ...c, name: c.name.trim() || 'Untitled skin' })}`;
  },
  currentArt: () => game.art,
  toast,
});

function openDesigner(existing?: CustomSkin): void {
  if (designing) return;
  beforeId = currentId;
  const cur = customs.find((c) => c.id === currentId);
  const draft: CustomSkin = existing
    ? structuredClone(existing)
    : cur
      ? { ...structuredClone(cur), id: newId(), name: `${cur.name} copy`.slice(0, 22) }
      : fromPreset(presetMap.get(currentId) ?? PRESETS[0]);
  designing = true;
  autoplayBefore = autoplay;
  document.body.classList.add('designing');
  designer.open(draft, !!existing);
  applySkin(buildCustomArt(draft, presetMap), true);
  layout();
  if (window.innerWidth <= 760) window.scrollTo({ top: 0 });
}

function closeDesigner(): void {
  designing = false;
  designer.hide();
  document.body.classList.remove('designing');
  autoplay = autoplayBefore;
  syncAutoplay();
  layout();
}

$('make').addEventListener('click', () => openDesigner());
$('edit').addEventListener('click', () => {
  const c = customs.find((x) => x.id === currentId);
  if (c) openDesigner(c);
});

// ---------------------------------------------------------------- toggles

const autoplayBox = $<HTMLInputElement>('autoplay');
const soundBtn = $('sound');

function syncAutoplay(): void {
  autoplayBox.checked = autoplay;
}
function setAutoplay(on: boolean, note?: string): void {
  autoplay = on;
  store.set('dino.autoplay', on);
  syncAutoplay();
  if (note) toast(note);
}
autoplayBox.addEventListener('change', () => setAutoplay(autoplayBox.checked));

function syncSound(): void {
  soundBtn.setAttribute('aria-pressed', String(!audio.muted));
}
soundBtn.addEventListener('click', () => {
  audio.unlock();
  audio.muted = !audio.muted;
  store.set('dino.muted', audio.muted);
  syncSound();
});

// ---------------------------------------------------------------- input

function takeOver(): void {
  if (autoplay) setAutoplay(false, 'Autoplay off. You have the controls.');
}
function pressJump(): void {
  if (!human.jump) human.jumpPressed = true;
  human.jump = true;
  takeOver();
}
function pressDown(): void {
  if (!human.down) human.downPressed = true;
  human.down = true;
  takeOver();
}
const releaseJump = () => (human.jump = false);
const releaseDown = () => (human.down = false);

const JUMP = new Set(['Space', 'ArrowUp', 'KeyW']);
const DUCK = new Set(['ArrowDown', 'KeyS']);

window.addEventListener('keydown', (e) => {
  audio.unlock();
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target instanceof Element ? e.target : document.body;
  if (e.key === 'Escape' && designing) {
    designer.isOpen && $('designer').querySelector<HTMLButtonElement>('.d-head .btn')?.click();
    return;
  }
  if (designing || t.closest('input, textarea, select, [contenteditable]')) return;
  if (e.code === 'Space' && t.closest('button, a, summary')) return; // keep Space for focused controls
  if (JUMP.has(e.code)) {
    e.preventDefault();
    if (!e.repeat) pressJump();
  } else if (DUCK.has(e.code)) {
    e.preventDefault();
    pressDown();
  } else if (e.code === 'ArrowLeft' || e.code === 'BracketLeft') {
    e.preventDefault();
    stepSkin(-1);
  } else if (e.code === 'ArrowRight' || e.code === 'BracketRight') {
    e.preventDefault();
    stepSkin(1);
  } else if (e.code === 'KeyA') setAutoplay(!autoplay, autoplay ? undefined : 'Autoplay on. Press A or any jump key to take over.');
  else if (e.code === 'KeyM') soundBtn.click();
  else if (/^Digit\d$/.test(e.code)) {
    const n = Number(e.code.slice(5));
    const target = entries()[n === 0 ? 9 : n - 1];
    if (target) setSkin(target.id);
  }
});

window.addEventListener('keyup', (e) => {
  if (JUMP.has(e.code)) releaseJump();
  if (DUCK.has(e.code)) releaseDown();
});

window.addEventListener('blur', () => {
  releaseJump();
  releaseDown();
});

// Pointer clicks shouldn't leave focus on buttons, or Space would press them instead of jumping.
document.addEventListener('click', (e) => {
  if (e.detail > 0 && (e.target as HTMLElement).closest('.page button, .page label')) (document.activeElement as HTMLElement | null)?.blur();
});

let swipeY = 0;
canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  audio.unlock();
  if (e.pointerType === 'touch') {
    game.touchLanes = true;
    renderer.touchHint = true;
  }
  if (designing) return;
  canvas.setPointerCapture(e.pointerId);
  swipeY = e.clientY;
  pressJump();
});
canvas.addEventListener('pointermove', (e) => {
  if (canvas.hasPointerCapture(e.pointerId) && e.clientY - swipeY > 22) pressDown();
});
const endCanvas = () => {
  releaseJump();
  releaseDown();
};
canvas.addEventListener('pointerup', endCanvas);
canvas.addEventListener('pointercancel', endCanvas);
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

function pad(id: string, down: () => void, up: () => void): void {
  const el = $(id);
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    audio.unlock();
    game.touchLanes = e.pointerType === 'touch' || game.touchLanes;
    renderer.touchHint = true;
    el.setPointerCapture(e.pointerId);
    el.classList.add('held');
    if (!designing) down();
  });
  const end = () => {
    el.classList.remove('held');
    up();
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('contextmenu', (e) => e.preventDefault());
}
pad('padJump', pressJump, releaseJump);
pad('padDuck', pressDown, releaseDown);

$('prev').addEventListener('click', () => stepSkin(-1));
$('next').addEventListener('click', () => stepSkin(1));

// ---------------------------------------------------------------- toast

let toastTimer = 0;
function toast(msg: string): void {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => el.classList.remove('show'), 2600);
}

// ---------------------------------------------------------------- boot

$('wordmark').innerHTML = textSvg('DINO') + textSvg('RESKINNED');
renderer.touchHint = matchMedia('(pointer: coarse)').matches;
game.touchLanes = renderer.touchHint;
syncAutoplay();
syncSound();
layout();
buildRail();
applySkin(game.art, false);
if (imported) toast(`Added ${imported.name} from a shared link.`);
requestAnimationFrame((t) => {
  last = t;
  frame(t);
});

// Debug handle for automated checks.
(window as unknown as { __dino: unknown }).__dino = {
  game, setSkin, entries,
  get autoplay() { return autoplay; },
  shareLink: async (id: string) => {
    const c = customs.find((x) => x.id === id);
    return c ? `${location.origin}${location.pathname}#skin=${await encodeSkin(c)}` : null;
  },
};
