import { GROUND_Y, H } from '../game/constants.ts';
import { mix } from '../core/color.ts';
import { bayer } from '../core/dither.ts';
import type { WeatherDef } from '../skins/types.ts';

interface P {
  x: number;
  y: number;
  vx: number;
  vy: number;
  s: number; // per-particle seed 0..1
  life: number;
}

const COUNT: Record<string, number> = {
  snow: 80, rain: 90, bubbles: 30, embers: 45, dust: 36, petals: 36, fireflies: 26,
  sparkles: 22, ash: 45, leaves: 26, fog: 0, meteors: 3, confetti: 50,
};

/** Particle weather in world space. Particles scroll with the world at a parallax factor. */
export class Weather {
  readonly def: WeatherDef;
  private parts: P[] = [];
  private t = 0;
  private fog: HTMLCanvasElement | null = null;
  private fogX = [0, 0];
  private readonly colors: string[];

  constructor(def: WeatherDef, W: number) {
    this.def = def;
    const c2 = def.color2 ?? mix(def.color, '#ffffff', 0.35);
    this.colors = def.kind === 'confetti'
      ? [def.color, c2, mix(def.color, '#ffe066', 0.6), mix(c2, '#5ad1ff', 0.6)]
      : [def.color, c2];
    const n = Math.round((COUNT[def.kind] ?? 30) * Math.max(0.05, Math.min(1, def.density)) * (W / 320));
    for (let i = 0; i < n; i++) this.parts.push(this.spawn(W, true));
  }

  private spawn(W: number, anywhere: boolean): P {
    const s = Math.random();
    const k = this.def.kind;
    const p: P = { x: Math.random() * (W + 20), y: 0, vx: 0, vy: 0, s, life: 1 };
    switch (k) {
      case 'bubbles':
      case 'embers':
        p.y = anywhere ? Math.random() * GROUND_Y : GROUND_Y + Math.random() * 8;
        p.vy = -(0.25 + s * 0.45);
        break;
      case 'dust':
        p.y = GROUND_Y - Math.random() * 26;
        p.vx = -(0.6 + s * 1.2);
        break;
      case 'fireflies':
      case 'sparkles':
        p.y = Math.random() * (k === 'sparkles' ? GROUND_Y - 6 : GROUND_Y);
        break;
      case 'meteors':
        p.x = W * (0.3 + Math.random() * 0.9);
        p.y = Math.random() * 20;
        p.life = anywhere ? -Math.random() * 400 : -120 - Math.random() * 500;
        break;
      default:
        p.y = anywhere ? Math.random() * GROUND_Y : -4 - Math.random() * 20;
        p.vy = k === 'rain' ? 3 + s * 1.2 : k === 'ash' ? 0.15 + s * 0.2 : 0.22 + s * 0.35;
    }
    return p;
  }

  /** Fog sits behind the sprites so it never hides an obstacle. */
  get behind(): boolean {
    return this.def.kind === 'fog';
  }

  update(speed: number, W: number): void {
    this.t++;
    const k = this.def.kind;
    const world = speed;
    if (k === 'fog') {
      this.fogX[0] += world * 0.35 + 0.08;
      this.fogX[1] += world * 0.6 + 0.15;
      return;
    }
    for (let i = 0; i < this.parts.length; i++) {
      const p = this.parts[i];
      switch (k) {
        case 'snow':
          p.x -= world * 0.55 + 0.15 + Math.sin(this.t * 0.03 + p.s * 20) * 0.25;
          p.y += p.vy;
          break;
        case 'ash':
          p.x -= world * 0.5 + 0.1 + Math.sin(this.t * 0.02 + p.s * 20) * 0.15;
          p.y += p.vy;
          break;
        case 'rain':
          p.x -= world * 0.6 + 1.1;
          p.y += p.vy;
          break;
        case 'petals':
        case 'leaves':
          p.x -= world * 0.55 + 0.3 + Math.sin(this.t * 0.05 + p.s * 30) * 0.5;
          p.y += p.vy;
          break;
        case 'confetti':
          p.x -= world * 0.5 + Math.sin(this.t * 0.07 + p.s * 30) * 0.4;
          p.y += p.vy;
          break;
        case 'bubbles':
          p.x -= world * 0.35 + Math.sin(this.t * 0.08 + p.s * 30) * 0.3;
          p.y += p.vy;
          break;
        case 'embers':
          p.x -= world * 0.55 + Math.sin(this.t * 0.06 + p.s * 30) * 0.35;
          p.y += p.vy;
          break;
        case 'dust':
          p.x += p.vx - world * 1.1;
          p.y += Math.sin(this.t * 0.1 + p.s * 10) * 0.15;
          break;
        case 'fireflies':
          p.x -= world * 0.3 + Math.sin(this.t * 0.013 + p.s * 40) * 0.25;
          p.y += Math.cos(this.t * 0.017 + p.s * 40) * 0.2;
          break;
        case 'sparkles':
          p.x -= world * 0.2;
          break;
        case 'meteors':
          p.life += 1;
          if (p.life > 0) { p.x -= 3.2; p.y += 1.4; }
          if (p.life > 40) Object.assign(p, this.spawn(W, false));
          continue;
      }
      if (p.x < -6) p.x += W + 12;
      if (p.x > W + 8) p.x -= W + 12;
      if (p.y > GROUND_Y + 3 || p.y < -8) {
        const q = this.spawn(W, false);
        q.x = Math.random() * (W + 12);
        Object.assign(p, q);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, W: number): void {
    const k = this.def.kind;
    const [c1, c2] = this.colors;
    if (k === 'fog') return this.drawFog(ctx, W);
    for (const p of this.parts) {
      const x = Math.round(p.x), y = Math.round(p.y);
      switch (k) {
        case 'rain':
          ctx.fillStyle = c1;
          ctx.fillRect(x, y, 1, 1);
          ctx.fillRect(x - 1, y - 2, 1, 2);
          if (y >= GROUND_Y - 1) { ctx.fillStyle = c2; ctx.fillRect(x - 2, GROUND_Y - 1, 1, 1); ctx.fillRect(x + 1, GROUND_Y - 1, 1, 1); }
          break;
        case 'bubbles': {
          ctx.fillStyle = c1;
          if (p.s > 0.6) {
            ctx.fillRect(x, y - 1, 2, 1); ctx.fillRect(x, y + 2, 2, 1);
            ctx.fillRect(x - 1, y, 1, 2); ctx.fillRect(x + 2, y, 1, 2);
            ctx.fillStyle = c2; ctx.fillRect(x, y, 1, 1);
          } else ctx.fillRect(x, y, 1, 1);
          break;
        }
        case 'embers':
          ctx.fillStyle = (this.t + Math.floor(p.s * 40)) % 12 < 6 ? c1 : c2;
          ctx.fillRect(x, y, 1, 1);
          if (p.s > 0.8) ctx.fillRect(x, y + 1, 1, 1);
          break;
        case 'petals':
        case 'leaves':
        case 'confetti': {
          ctx.fillStyle = k === 'confetti' ? this.colors[Math.floor(p.s * 4) % 4] : p.s > 0.5 ? c1 : c2;
          const flip = (this.t + Math.floor(p.s * 50)) % 20 < 10;
          ctx.fillRect(x, y, flip ? 2 : 1, flip ? 1 : 2);
          break;
        }
        case 'fireflies': {
          const on = Math.sin(this.t * 0.05 + p.s * 60);
          if (on < 0) break;
          ctx.fillStyle = on > 0.6 ? c2 : c1;
          ctx.fillRect(x, y, 1, 1);
          if (on > 0.85) { ctx.fillStyle = c1; ctx.fillRect(x - 1, y, 1, 1); ctx.fillRect(x + 1, y, 1, 1); ctx.fillRect(x, y - 1, 1, 1); ctx.fillRect(x, y + 1, 1, 1); }
          break;
        }
        case 'sparkles': {
          const ph = (this.t * 0.04 + p.s * 17) % 3;
          if (ph > 1) break;
          ctx.fillStyle = c1;
          ctx.fillRect(x, y, 1, 1);
          if (ph > 0.3 && ph < 0.7) {
            ctx.fillStyle = c2;
            ctx.fillRect(x - 1, y, 1, 1); ctx.fillRect(x + 1, y, 1, 1);
            ctx.fillRect(x, y - 1, 1, 1); ctx.fillRect(x, y + 1, 1, 1);
          }
          break;
        }
        case 'meteors':
          if (p.life <= 0) break;
          ctx.fillStyle = c1;
          ctx.fillRect(x, y, 2, 1);
          ctx.fillStyle = c2;
          for (let i = 1; i < 7; i++) if (i < 4 || i % 2) ctx.fillRect(x + i * 2, y - Math.round(i * 0.9), 1, 1);
          break;
        case 'dust':
          ctx.fillStyle = p.s > 0.5 ? c1 : c2;
          ctx.fillRect(x, y, p.s > 0.85 ? 2 : 1, 1);
          break;
        default:
          ctx.fillStyle = p.s > 0.7 ? c2 : c1;
          ctx.fillRect(x, y, 1, 1);
          if (k === 'snow' && p.s > 0.85) ctx.fillRect(x + 1, y, 1, 1);
      }
    }
  }

  private drawFog(ctx: CanvasRenderingContext2D, W: number): void {
    if (!this.fog) {
      const TW = 256, TH = 14;
      const c = document.createElement('canvas');
      c.width = TW; c.height = TH;
      const g = c.getContext('2d')!;
      const img = g.createImageData(TW, TH);
      const col = this.def.color.replace('#', '');
      const r = parseInt(col.slice(0, 2), 16), gg = parseInt(col.slice(2, 4), 16), b = parseInt(col.slice(4, 6), 16);
      for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) {
        const band = 0.5 + 0.5 * Math.sin((x / TW) * Math.PI * 2 * 3 + Math.sin((x / TW) * Math.PI * 2) * 2);
        const vy = 1 - Math.abs(y - TH / 2) / (TH / 2);
        const d = vy * (0.12 + band * 0.26) * Math.min(1, this.def.density * 1.2);
        if (d > bayer(x, y)) { const i = (y * TW + x) * 4; img.data[i] = r; img.data[i + 1] = gg; img.data[i + 2] = b; img.data[i + 3] = 255; }
      }
      g.putImageData(img, 0, 0);
      this.fog = c;
    }
    const f = this.fog;
    const rows = [GROUND_Y - 18, GROUND_Y - 9];
    rows.forEach((y, i) => {
      const off = Math.floor(this.fogX[i] * (i ? 1 : 0.7)) % f.width;
      for (let x = -off; x < W; x += f.width) ctx.drawImage(f, x, y);
    });
    void H;
  }
}
