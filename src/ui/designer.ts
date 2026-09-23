import type { SkinDef } from '../skins/types.ts';
import type { SkinArt, SpriteArt } from '../render/compile.ts';
import {
  CELESTIAL_CHOICES, GROUND_CHOICES, LAYER_CHOICES, ROLES, SOUND_CHOICES, WEATHER_CHOICES,
  randomColors, randomize, type CastSource, type CustomSkin, type Role,
} from '../skins/custom.ts';
import { firstGrapheme } from '../skins/emoji.ts';
import { spriteChip } from './thumbs.ts';

export interface DesignerHost {
  presets: SkinDef[];
  presetArt(id: string): SkinArt;
  preview(c: CustomSkin): void;
  save(c: CustomSkin): void;
  remove(id: string): void;
  close(): void;
  shareUrl(c: CustomSkin): string;
  toast(msg: string): void;
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
      const inputId = `emoji-${role}`;
      const emojiIn = h('input', {
        id: inputId, class: `emoji-in${isEmoji ? ' active' : ''}`, value: isEmoji ? src.emoji : '', placeholder: 'Emoji',
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
      sec.append(h('div', { class: 'd-row' },
        h('div', { class: 'd-label' }, h('span', {}, info.label), h('small', {}, info.hint)),
        chips,
        h('div', { class: 'emoji-row' }, emojiIn, flip),
        suggest,
      ));
    }
    return sec;
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
    const url = this.host.shareUrl(this.draft);
    try {
      await navigator.clipboard.writeText(url);
      this.host.toast('Link copied. Anyone who opens it gets this skin.');
    } catch {
      window.prompt('Copy this link:', url);
    }
  }
}
