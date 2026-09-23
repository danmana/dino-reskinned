import type { SkinDef } from '../skins/types.ts';
import type { SkinArt, SpriteArt } from '../render/compile.ts';
import {
  CELESTIAL_CHOICES, GROUND_CHOICES, LAYER_CHOICES, ROLES, ROLE_BOX, SOUND_CHOICES, WEATHER_CHOICES,
  randomColors, randomize, type CastSource, type CustomSkin, type Role,
} from '../skins/custom.ts';
import { firstGrapheme } from '../skins/emoji.ts';
import { decodePixels, encodePixels, isOpaque, pixelate, type PixelateResult, type RGBAImage } from '../skins/pixelate.ts';
import { toCanvas } from '../render/renderer.ts';
import { spriteChip } from './thumbs.ts';

export interface DesignerHost {
  presets: SkinDef[];
  presetArt(id: string): SkinArt;
  preview(c: CustomSkin): void;
  save(c: CustomSkin): void;
  remove(id: string): void;
  close(): void;
  shareUrl(c: CustomSkin): Promise<string>;
  toast(msg: string): void;
  /** The skin currently on screen (the live draft while designing). */
  currentArt(): SkinArt;
}

/** A picture uploaded this session, kept so pixelation options can be re-run. */
interface Upload {
  img: RGBAImage;
  name: string;
  w: number;
  h: number;
  opaque: boolean;
  removeBg: boolean;
  outline: boolean | 'auto';
  result: PixelateResult;
}

type Slot = Role | 'duck';

async function readImage(file: File): Promise<{ img: RGBAImage; w: number; h: number }> {
  const url = URL.createObjectURL(file);
  try {
    const el = new Image();
    el.src = url;
    await el.decode();
    const w = el.naturalWidth || 256, h = el.naturalHeight || 256;
    // Big photos are scaled first; small pixel art stays untouched for exact detection.
    const k = Math.min(1, 1024 / Math.max(w, h));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w * k));
    c.height = Math.max(1, Math.round(h * k));
    const g = c.getContext('2d', { willReadFrequently: true })!;
    g.imageSmoothingEnabled = k < 1;
    g.drawImage(el, 0, 0, c.width, c.height);
    return { img: { w: c.width, h: c.height, data: g.getImageData(0, 0, c.width, c.height).data }, w, h };
  } finally {
    URL.revokeObjectURL(url);
  }
}

type Attrs = Record<string, string | boolean | number | EventListener | undefined>;

function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs = {}, ...kids: (Node | string | null | undefined | false)[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v as EventListener);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, String(v));
  }
  for (const kid of kids) if (kid !== null && kid !== undefined && kid !== false) el.append(kid);
  return el;
}

const ROLE_INFO: Record<Role, { label: string; hint: string; emoji: string[] }> = {
  runner: { label: 'Runner', hint: 'runs to the right', emoji: ['🐸', '🦆', '🐧', '🐈', '🦄', '🤖', '👻', '🦔'] },
  small: { label: 'Small obstacle', hint: 'jump over it', emoji: ['🌵', '🍄', '🪨', '🧁', '📦', '🎃', '🧊'] },
  large: { label: 'Tall obstacle', hint: 'a bigger jump', emoji: ['🌲', '🗿', '⛄', '🧱', '🗼', '🌮', '🍕'] },
  flyer: { label: 'Flyer', hint: 'flies at you', emoji: ['🦅', '🦇', '🐝', '🛸', '🐉', '🎈', '🦈'] },
  decor: { label: 'Sky decoration', hint: 'drifts behind', emoji: ['☁️', '⭐', '🌈', '🪐', '🎈', '🌙'] },
};

const LABELS: Record<string, string> = {
  none: 'None', line: 'Classic line', wet: 'Wet street', synthsun: 'Synth sun', ringed: 'Ringed planet',
  seabed: 'Seabed', sidewalk: 'Sidewalk', frosting: 'Frosting', cobble: 'Cobbles', chip: 'Chiptune',
  twang: 'Twang', neon: 'Neon synth', bubble: 'Bubbles', bleat: 'Bleats', roar: 'Roars', chime: 'Chimes',
  blip: 'Blips', spooky: 'Spooky', sweet: 'Sweet', honk: 'Honks', pagodas: 'Pagodas', icebergs: 'Icebergs',
};
const label = (k: string) => LABELS[k] ?? k[0].toUpperCase() + k.slice(1);

const NAME_A = ['Neon', 'Tiny', 'Cosmic', 'Soggy', 'Turbo', 'Midnight', 'Crispy', 'Grumpy', 'Lucky', 'Fuzzy', 'Electric', 'Sleepy', 'Wobbly', 'Golden'];
const NAME_B = ['Dash', 'Getaway', 'Parade', 'Marathon', 'Commute', 'Escape', 'Stampede', 'Hop', 'Scramble', 'Joyride', 'Rush', 'Detour'];

const COLOR_FIELDS: { key: keyof CustomSkin['colors']; label: string }[] = [
  { key: 'skyTop', label: 'Sky' },
  { key: 'skyBottom', label: 'Horizon' },
  { key: 'far', label: 'Far scenery' },
  { key: 'near', label: 'Near scenery' },
  { key: 'ground', label: 'Ground' },
  { key: 'ink', label: 'Ink and score' },
];

export class Designer {
  private root: HTMLElement;
  private host: DesignerHost;
  private draft!: CustomSkin;
  private existing = false;
  private pending = 0;
  private uploads = new Map<Slot, Upload>();

  constructor(root: HTMLElement, host: DesignerHost) {
    this.root = root;
    this.host = host;
  }

  get isOpen(): boolean {
    return !this.root.hidden;
  }

  open(draft: CustomSkin, existing: boolean): void {
    this.draft = draft;
    this.existing = existing;
    this.uploads.clear();
    this.root.hidden = false;
    this.render();
    this.root.scrollTop = 0;
    (this.root.querySelector('#dName') as HTMLInputElement | null)?.focus({ preventScroll: true });
  }

  hide(): void {
    this.root.hidden = true;
    this.root.replaceChildren();
  }

  private changed(rerender = true): void {
    if (rerender) this.render();
    cancelAnimationFrame(this.pending);
    this.pending = requestAnimationFrame(() => this.host.preview(this.draft));
  }

  private setCast(role: Role, src: CastSource): void {
    this.draft = { ...this.draft, cast: { ...this.draft.cast, [role]: src } };
    this.changed();
  }

  private render(): void {
    const d = this.draft;
    const scroll = this.root.scrollTop;
    const focusId = (document.activeElement as HTMLElement | null)?.id;
    this.root.replaceChildren(
      h('div', { class: 'd-head' },
        h('h2', {}, this.existing ? 'Edit skin' : 'Make a skin'),
        h('button', { type: 'button', class: 'btn', onclick: () => this.host.close() }, 'Close'),
      ),
      h('p', { class: 'd-intro' }, 'Pick a cast, colours and a world. The game behind this panel plays your skin as you go.'),
      h('div', { class: 'd-row field' },
        h('label', { class: 'd-label', for: 'dName' }, 'Name'),
        h('input', {
          id: 'dName', value: d.name, maxlength: 22, autocomplete: 'off', spellcheck: 'false',
          oninput: (e: Event) => { this.draft = { ...this.draft, name: (e.target as HTMLInputElement).value }; this.changed(false); },
        }),
      ),
      this.castSection(),
      this.colorSection(),
      this.worldSection(),
      h('div', { class: 'd-foot' },
        h('button', { type: 'button', class: 'btn', onclick: () => this.surprise() }, 'Surprise me'),
        h('button', { type: 'button', class: 'btn', onclick: () => this.copyLink() }, 'Copy link'),
        this.existing ? h('button', { type: 'button', class: 'btn danger', onclick: () => this.host.remove(d.id) }, 'Delete') : null,
        h('span', { class: 'grow' }),
        h('button', { type: 'button', class: 'btn primary', onclick: () => this.host.save(this.draft) }, 'Save skin'),
      ),
    );
    this.root.scrollTop = scroll;
    if (focusId) (this.root.querySelector(`#${CSS.escape(focusId)}`) as HTMLElement | null)?.focus({ preventScroll: true });
  }

  private castSection(): HTMLElement {
    const sec = h('section', { class: 'd-section' }, h('h3', {}, 'Cast'));
    for (const role of ROLES) {
      const src = this.draft.cast[role];
      const info = ROLE_INFO[role];
      const box = ROLE_BOX[role];
      const chips = h('div', { class: 'chips', role: 'group', 'aria-label': `${info.label} from a skin` });
      if (role === 'decor') {
        chips.append(h('button', {
          type: 'button', class: 'chip', 'aria-pressed': String('none' in src),
          onclick: () => this.setCast(role, { none: true }),
        }, 'None'));
      }
      for (const p of this.host.presets) {
        const art = this.host.presetArt(p.id).day;
        const sprite: SpriteArt | undefined =
          role === 'runner' ? art.runner.run[0] : role === 'small' ? art.small[0]?.[0] : role === 'large' ? art.large[0]?.[0] : role === 'flyer' ? art.flyer[0] : art.decor[0];
        if (!sprite && role === 'decor') continue;
        const on = 'preset' in src && src.preset === p.id;
        chips.append(h('button', {
          type: 'button', class: 'chip sprite', 'aria-pressed': String(on), title: p.name, 'aria-label': `${info.label}: ${p.name}`,
          onclick: () => this.setCast(role, { preset: p.id }),
        }, spriteChip(sprite, p.sky.bottom, role === 'decor' ? 40 : 28)));
      }
      const isEmoji = 'emoji' in src;
      const emojiIn = h('input', {
        id: `emoji-${role}`, class: `emoji-in${isEmoji ? ' active' : ''}`, value: isEmoji ? src.emoji : '', placeholder: 'Emoji',
        'aria-label': `${info.label} as an emoji`, autocomplete: 'off', inputmode: 'text',
        onchange: (e: Event) => {
          const v = firstGrapheme((e.target as HTMLInputElement).value);
          if (v) this.setCast(role, { emoji: v, flip: isEmoji ? src.flip : role === 'runner' });
        },
      });
      const flip = h('label', { class: 'mini' },
        h('input', {
          type: 'checkbox', checked: isEmoji && !!src.flip, disabled: !isEmoji,
          onchange: (e: Event) => { if ('emoji' in src) this.setCast(role, { emoji: src.emoji, flip: (e.target as HTMLInputElement).checked }); },
        }),
        'Mirror',
      );
      const suggest = h('div', { class: 'emoji-suggest', 'aria-label': 'Suggestions' },
        ...info.emoji.map((em) => h('button', {
          type: 'button', title: `Use ${em}`,
          onclick: () => this.setCast(role, { emoji: em, flip: role === 'runner' }),
        }, em)),
      );
      const facing = role === 'runner' ? ', facing right' : role === 'flyer' ? ', facing left' : '';
      const row = h('div', { class: 'd-row role-row' },
        h('div', { class: 'd-label' }, h('span', {}, info.label), h('small', {}, info.hint)),
        chips,
        h('div', { class: 'emoji-row' }, emojiIn, flip),
        suggest,
        h('div', { class: 'upload-row' },
          this.uploadButton(role, 'image' in src ? 'Replace picture' : 'Upload picture', 'image' in src),
          h('button', { type: 'button', class: 'linkish', onclick: () => this.template(role), title: 'The current sprite as a PNG at the exact size, enlarged 8x for easy editing' }, 'Download template'),
        ),
        h('p', { class: 'hint' }, `Best at exactly ${box.w} × ${box.h} px${facing}. Any picture works: it gets pixelated to fit.`),
        'image' in src ? this.imagePanel(role, src) : null,
      );
      this.dropTarget(row, role);
      sec.append(row);
    }
    return sec;
  }

  private uploadButton(slot: Slot, text: string, active = false): HTMLElement {
    const input = h('input', {
      type: 'file', accept: 'image/*', class: 'visually-hidden', 'aria-label': text,
      onchange: (e: Event) => {
        const f = (e.target as HTMLInputElement).files?.[0];
        if (f) void this.upload(slot, f);
      },
    });
    return h('label', { class: `chip upload${active ? ' on' : ''}` }, input, text);
  }

  private dropTarget(el: HTMLElement, slot: Slot): void {
    el.addEventListener('dragover', (e) => { e.preventDefault(); el.classList.add('drop'); });
    el.addEventListener('dragleave', () => el.classList.remove('drop'));
    el.addEventListener('drop', (e) => {
      e.preventDefault();
      el.classList.remove('drop');
      const f = e.dataTransfer?.files?.[0];
      if (f) void this.upload(slot, f);
    });
  }

  private async upload(slot: Slot, file: File): Promise<void> {
    let read: Awaited<ReturnType<typeof readImage>>;
    try {
      read = await readImage(file);
    } catch {
      this.host.toast("That file isn't a picture the browser can open. Try PNG, JPG, GIF or WebP.");
      return;
    }
    const opaque = isOpaque(read.img);
    const up: Upload = { img: read.img, name: file.name, w: read.w, h: read.h, opaque, removeBg: opaque, outline: 'auto', result: null as unknown as PixelateResult };
    this.uploads.set(slot, up);
    if (slot === 'runner') this.uploads.delete('duck');
    this.repixelate(slot, true);
  }

  /** fresh: a new picture replaced the old one, so a runner's old duck pose no longer matches. */
  private repixelate(slot: Slot, fresh = false): void {
    const up = this.uploads.get(slot);
    if (!up) return;
    const box = ROLE_BOX[slot];
    up.result = pixelate(up.img, { maxW: box.w, maxH: box.h, removeBg: up.removeBg, outline: up.outline, colors: 8 });
    const code = encodePixels(up.result.buf);
    if (slot === 'duck') {
      const r = this.draft.cast.runner;
      if ('image' in r) this.setCast('runner', { ...r, duck: code });
      return;
    }
    const prev = this.draft.cast[slot];
    const keep = 'image' in prev && !fresh;
    this.setCast(slot, { image: code, flip: keep ? prev.flip : false, duck: keep ? prev.duck : undefined });
  }

  private preview(code: string, slot: Slot): HTMLCanvasElement {
    const box = ROLE_BOX[slot];
    const buf = decodePixels(code, box.w, box.h);
    const pad = 3;
    const c = document.createElement('canvas');
    c.width = box.w + pad * 2;
    c.height = box.h + pad * 2;
    const g = c.getContext('2d')!;
    g.fillStyle = this.draft.colors.skyBottom;
    g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = this.draft.colors.ground;
    g.fillRect(0, c.height - pad, c.width, pad);
    if (buf) g.drawImage(toCanvas(buf), pad + Math.floor((box.w - buf.w) / 2), pad + box.h - buf.h);
    c.className = 'img-preview';
    c.style.width = `${c.width * 4}px`;
    return c;
  }

  private imagePanel(role: Role, src: { image: string; flip?: boolean; duck?: string }): HTMLElement {
    const up = this.uploads.get(role);
    const buf = decodePixels(src.image);
    const size = buf ? `${buf.w} × ${buf.h} px` : '';
    const how = !up
      ? 'Saved picture. Upload it again to change how it is pixelated.'
      : up.result.exact
        ? up.result.block > 1 ? `Pixel art, shrunk back from ${up.result.block}× and copied exactly.` : 'Pixel art, copied pixel for pixel.'
        : `Pixelated from ${up.w} × ${up.h}, ${up.name}.`;
    const opt = (label: string, checked: boolean, disabled: boolean, on: (v: boolean) => void) =>
      h('label', { class: 'mini' }, h('input', { type: 'checkbox', checked, disabled, onchange: (e: Event) => on((e.target as HTMLInputElement).checked) }), label);
    const panel = h('div', { class: 'img-panel' },
      this.preview(src.image, role),
      h('div', { class: 'img-meta' },
        h('b', {}, size),
        h('p', {}, how),
        h('div', { class: 'img-opts' },
          opt('Remove background', !!up?.removeBg, !up || !up.opaque, (v) => { up!.removeBg = v; this.repixelate(role); }),
          opt('Outline', !!up?.result.outlined, !up, (v) => { up!.outline = v; this.repixelate(role); }),
          opt('Mirror', !!src.flip, false, (v) => this.setCast(role, { ...src, flip: v })),
        ),
      ),
    );
    if (role !== 'runner') return panel;
    const duck = src.duck;
    return h('div', {},
      panel,
      h('div', { class: 'duck-row' },
        duck ? this.preview(duck, 'duck') : null,
        h('div', { class: 'img-meta' },
          h('b', {}, 'Duck pose'),
          h('p', {}, duck ? `${decodePixels(duck)?.w} × ${decodePixels(duck)?.h} px` : `Squashed from the runner. Upload your own at ${ROLE_BOX.duck.w} × ${ROLE_BOX.duck.h} px.`),
          h('div', { class: 'img-opts' },
            this.uploadButton('duck', duck ? 'Replace duck pose' : 'Upload duck pose', !!duck),
            duck ? h('button', { type: 'button', class: 'linkish', onclick: () => { this.uploads.delete('duck'); this.setCast('runner', { ...src, duck: undefined }); } }, 'Use squashed') : null,
          ),
        ),
      ),
    );
  }

  /** Downloads the role's current sprite at its exact box size, enlarged 8x. */
  private template(role: Role): void {
    const v = this.host.currentArt().day;
    const s = role === 'runner' ? v.runner.run[0] : role === 'small' ? v.small[0]?.[0] : role === 'large' ? v.large[0]?.[0] : role === 'flyer' ? v.flyer[0] : v.decor[0];
    const box = ROLE_BOX[role];
    const K = 8;
    const c = document.createElement('canvas');
    c.width = box.w * K;
    c.height = box.h * K;
    const g = c.getContext('2d')!;
    g.imageSmoothingEnabled = false;
    if (s) {
      const x = Math.floor((box.w - s.w) / 2), y = box.h - s.baseline;
      g.drawImage(toCanvas(s.buf), x * K, y * K, s.w * K, s.h * K);
    }
    c.toBlob((b) => {
      if (!b) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = `${role}-${box.w}x${box.h}-at-8x.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }, 'image/png');
  }

  private colorSection(): HTMLElement {
    const d = this.draft;
    const grid = h('div', { class: 'swatches' });
    for (const f of COLOR_FIELDS) {
      const input = h('input', {
        type: 'color', value: d.colors[f.key], 'aria-label': f.label,
        oninput: (e: Event) => {
          const v = (e.target as HTMLInputElement).value;
          this.draft = { ...this.draft, colors: { ...this.draft.colors, [f.key]: v } };
          (e.target as HTMLElement).parentElement!.style.background = v;
          this.changed(false);
        },
      });
      grid.append(h('label', { class: 'swatch-wrap' }, h('span', {}, f.label), h('span', { class: 'swatch', style: `background:${d.colors[f.key]}` }, input)));
    }
    const borrow = h('select', {
      'aria-label': 'Borrow colours from a skin',
      onchange: (e: Event) => {
        const p = this.host.presets.find((x) => x.id === (e.target as HTMLSelectElement).value);
        if (!p) return;
        const gen = p.layers.filter((l) => l.kind !== 'sprites') as { color: string }[];
        this.draft = {
          ...this.draft,
          colors: {
            skyTop: p.sky.top, skyBottom: p.sky.bottom,
            far: gen[0]?.color ?? this.draft.colors.far, near: gen[gen.length - 1]?.color ?? this.draft.colors.near,
            ground: p.ground.color, ink: p.ink,
          },
        };
        this.changed();
      },
    }, h('option', { value: '' }, 'Borrow colours from…'), ...this.host.presets.map((p) => h('option', { value: p.id }, p.name)));
    return h('section', { class: 'd-section' },
      h('h3', {}, 'Colours'),
      grid,
      h('div', { class: 'd-inline' },
        h('button', { type: 'button', class: 'chip', onclick: () => { this.draft = { ...this.draft, colors: randomColors() }; this.changed(); } }, 'Shuffle colours'),
        borrow,
      ),
      h('div', { class: 'd-inline' },
        h('label', { class: 'mini' },
          h('input', { type: 'checkbox', checked: d.inkCast, onchange: (e: Event) => { this.draft = { ...this.draft, inkCast: (e.target as HTMLInputElement).checked }; this.changed(); } }),
          'Paint the skin sprites in the ink colour',
        ),
      ),
    );
  }

  private chipGroup<T extends string>(title: string, options: readonly T[], value: T, set: (v: T) => void): HTMLElement {
    return h('div', { class: 'd-row' },
      h('div', { class: 'd-label' }, h('span', {}, title)),
      h('div', { class: 'chips', role: 'group', 'aria-label': title },
        ...options.map((o) => h('button', { type: 'button', class: 'chip', 'aria-pressed': String(o === value), onclick: () => set(o) }, label(o))),
      ),
    );
  }

  private worldSection(): HTMLElement {
    const d = this.draft;
    const set = (patch: Partial<CustomSkin>) => { this.draft = { ...this.draft, ...patch }; this.changed(); };
    return h('section', { class: 'd-section' },
      h('h3', {}, 'World'),
      this.chipGroup('Far scenery', ['none', ...LAYER_CHOICES] as const, d.far, (v) => set({ far: v })),
      this.chipGroup('Near scenery', ['none', ...LAYER_CHOICES] as const, d.near, (v) => set({ near: v })),
      this.chipGroup('Ground', GROUND_CHOICES, d.ground, (v) => set({ ground: v })),
      this.chipGroup('Weather', WEATHER_CHOICES, d.weather, (v) => set({ weather: v })),
      this.chipGroup('In the sky', CELESTIAL_CHOICES, d.celestial, (v) => set({ celestial: v })),
      this.chipGroup('Sounds', SOUND_CHOICES, d.sound, (v) => set({ sound: v })),
    );
  }

  private surprise(): void {
    const named = !this.draft.name.trim() || this.draft.name.startsWith('My ') || NAME_B.some((n) => this.draft.name.endsWith(n));
    this.draft = randomize(this.draft, this.host.presets.map((p) => p.id));
    if (named) this.draft.name = `${NAME_A[Math.floor(Math.random() * NAME_A.length)]} ${NAME_B[Math.floor(Math.random() * NAME_B.length)]}`;
    this.changed();
  }

  private async copyLink(): Promise<void> {
    const url = await this.host.shareUrl(this.draft);
    try {
      await navigator.clipboard.writeText(url);
      this.host.toast('Link copied. Anyone who opens it gets this skin.');
    } catch {
      window.prompt('Copy this link:', url);
    }
  }
}
