import type { SoundPreset } from '../skins/types.ts';

export type Sfx = 'jump' | 'score' | 'crash' | 'switch';

type Wave = OscillatorType;

interface Note {
  wave: Wave;
  f0: number;
  f1?: number;
  at?: number;
  dur: number;
  gain?: number;
  vibrato?: [rate: number, depth: number];
  filter?: number;
}

interface Noise {
  noise: true;
  at?: number;
  dur: number;
  gain?: number;
  filter?: number;
  q?: number;
  sweep?: number;
}

type Voice = Note | Noise;

// Each preset maps the four game sounds to tiny synth patches.
const PRESETS: Record<SoundPreset, Record<Sfx, Voice[]>> = {
  chip: {
    jump: [{ wave: 'square', f0: 620, f1: 860, dur: 0.06, gain: 0.07 }],
    score: [{ wave: 'square', f0: 990, dur: 0.07, gain: 0.06 }, { wave: 'square', f0: 1320, at: 0.09, dur: 0.12, gain: 0.06 }],
    crash: [{ wave: 'square', f0: 120, f1: 70, dur: 0.22, gain: 0.08 }],
    switch: [{ wave: 'square', f0: 440, f1: 660, dur: 0.05, gain: 0.04 }],
  },
  twang: {
    jump: [{ wave: 'triangle', f0: 330, f1: 520, dur: 0.12, gain: 0.16 }],
    score: [{ wave: 'triangle', f0: 523, dur: 0.12, gain: 0.14 }, { wave: 'triangle', f0: 784, at: 0.1, dur: 0.22, gain: 0.14, vibrato: [7, 12] }],
    crash: [{ wave: 'triangle', f0: 196, f1: 82, dur: 0.45, gain: 0.18 }, { noise: true, dur: 0.25, gain: 0.08, filter: 900 }],
    switch: [{ wave: 'triangle', f0: 392, f1: 587, dur: 0.1, gain: 0.1 }],
  },
  neon: {
    jump: [{ wave: 'sawtooth', f0: 440, f1: 990, dur: 0.09, gain: 0.05, filter: 2400 }],
    score: [0, 1, 2].map((i) => ({ wave: 'sawtooth' as Wave, f0: [660, 880, 1320][i], at: i * 0.06, dur: 0.08, gain: 0.05, filter: 3000 })),
    crash: [{ wave: 'sawtooth', f0: 220, f1: 40, dur: 0.5, gain: 0.07, filter: 1200 }, { noise: true, dur: 0.18, gain: 0.05, filter: 3000 }],
    switch: [{ wave: 'sawtooth', f0: 880, f1: 1760, dur: 0.07, gain: 0.03, filter: 3000 }],
  },
  bubble: {
    jump: [{ wave: 'sine', f0: 280, f1: 900, dur: 0.1, gain: 0.2 }],
    score: [{ wave: 'sine', f0: 400, f1: 1100, dur: 0.08, gain: 0.18 }, { wave: 'sine', f0: 600, f1: 1500, at: 0.1, dur: 0.1, gain: 0.18 }],
    crash: [{ wave: 'sine', f0: 320, f1: 60, dur: 0.6, gain: 0.22, vibrato: [18, 30] }],
    switch: [{ wave: 'sine', f0: 500, f1: 1200, dur: 0.07, gain: 0.12 }],
  },
  bleat: {
    jump: [{ wave: 'sawtooth', f0: 420, f1: 380, dur: 0.14, gain: 0.05, vibrato: [32, 45], filter: 1800 }],
    score: [{ wave: 'sawtooth', f0: 520, dur: 0.12, gain: 0.05, vibrato: [30, 50], filter: 2000 }, { wave: 'sawtooth', f0: 620, at: 0.14, dur: 0.2, gain: 0.05, vibrato: [30, 60], filter: 2000 }],
    crash: [{ wave: 'sawtooth', f0: 340, f1: 220, dur: 0.7, gain: 0.07, vibrato: [26, 70], filter: 1500 }],
    switch: [{ wave: 'sawtooth', f0: 480, dur: 0.1, gain: 0.04, vibrato: [30, 40], filter: 1800 }],
  },
  roar: {
    jump: [{ noise: true, dur: 0.16, gain: 0.12, filter: 500, q: 1.5, sweep: 2400 }],
    score: [{ wave: 'square', f0: 392, dur: 0.14, gain: 0.05, filter: 1500 }, { wave: 'square', f0: 523, at: 0.12, dur: 0.26, gain: 0.05, filter: 1500 }],
    crash: [{ noise: true, dur: 0.7, gain: 0.2, filter: 380, q: 0.8 }, { wave: 'sawtooth', f0: 90, f1: 45, dur: 0.6, gain: 0.08, filter: 600 }],
    switch: [{ noise: true, dur: 0.12, gain: 0.08, filter: 900, sweep: 3000 }],
  },
  chime: {
    jump: [{ wave: 'sine', f0: 988, f1: 1318, dur: 0.18, gain: 0.12 }, { wave: 'sine', f0: 1976, dur: 0.12, gain: 0.04 }],
    score: [{ wave: 'sine', f0: 1318, dur: 0.3, gain: 0.12 }, { wave: 'sine', f0: 1760, at: 0.12, dur: 0.4, gain: 0.12 }, { wave: 'sine', f0: 3520, at: 0.12, dur: 0.2, gain: 0.03 }],
    crash: [{ wave: 'sine', f0: 196, f1: 180, dur: 0.8, gain: 0.18 }, { wave: 'sine', f0: 208, dur: 0.8, gain: 0.1 }],
    switch: [{ wave: 'sine', f0: 1568, dur: 0.2, gain: 0.08 }],
  },
  blip: {
    jump: [{ wave: 'sine', f0: 880, f1: 1760, dur: 0.07, gain: 0.14 }],
    score: [0, 1, 2].map((i) => ({ wave: 'sine' as Wave, f0: 1200 + i * 300, at: i * 0.07, dur: 0.05, gain: 0.12 })),
    crash: [{ wave: 'sine', f0: 900, f1: 90, dur: 0.6, gain: 0.16 }],
    switch: [{ wave: 'sine', f0: 1400, dur: 0.05, gain: 0.08 }],
  },
  spooky: {
    jump: [{ wave: 'sine', f0: 440, f1: 700, dur: 0.2, gain: 0.14, vibrato: [7, 14] }],
    score: [{ wave: 'sine', f0: 466, dur: 0.25, gain: 0.12, vibrato: [6, 16] }, { wave: 'sine', f0: 659, at: 0.18, dur: 0.35, gain: 0.12, vibrato: [6, 18] }],
    crash: [{ wave: 'sine', f0: 600, f1: 110, dur: 0.9, gain: 0.16, vibrato: [5, 40] }],
    switch: [{ wave: 'sine', f0: 520, f1: 780, dur: 0.18, gain: 0.08, vibrato: [7, 12] }],
  },
  sweet: {
    jump: [{ wave: 'triangle', f0: 784, f1: 1046, dur: 0.08, gain: 0.14 }],
    score: [0, 1, 2].map((i) => ({ wave: 'triangle' as Wave, f0: [1046, 1318, 1568][i], at: i * 0.07, dur: 0.1, gain: 0.13 })),
    crash: [{ wave: 'triangle', f0: 392, f1: 196, dur: 0.18, gain: 0.16 }, { wave: 'triangle', f0: 330, f1: 147, at: 0.2, dur: 0.35, gain: 0.16 }],
    switch: [{ wave: 'triangle', f0: 1318, dur: 0.08, gain: 0.08 }],
  },
  honk: {
    jump: [{ wave: 'square', f0: 1250, dur: 0.05, gain: 0.04 }, { wave: 'square', f0: 1250, at: 0.07, dur: 0.05, gain: 0.04 }],
    score: [{ wave: 'square', f0: 311, dur: 0.12, gain: 0.05, filter: 1400 }, { wave: 'square', f0: 330, dur: 0.12, gain: 0.05, filter: 1400 }, { wave: 'square', f0: 311, at: 0.18, dur: 0.18, gain: 0.05, filter: 1400 }, { wave: 'square', f0: 330, at: 0.18, dur: 0.18, gain: 0.05, filter: 1400 }],
    crash: [{ wave: 'square', f0: 277, dur: 0.5, gain: 0.06, filter: 1200 }, { wave: 'square', f0: 294, dur: 0.5, gain: 0.06, filter: 1200 }, { noise: true, at: 0.05, dur: 0.2, gain: 0.08, filter: 1500 }],
    switch: [{ wave: 'square', f0: 330, dur: 0.07, gain: 0.03, filter: 1400 }],
  },
};

export class Audio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  muted = false;

  /** Must be called from a user gesture. */
  unlock(): void {
    if (!this.ctx) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);
      const len = Math.floor(this.ctx.sampleRate * 1);
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  play(sfx: Sfx, preset: SoundPreset): void {
    if (this.muted || !this.ctx || !this.master || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime + 0.005;
    for (const v of PRESETS[preset]?.[sfx] ?? PRESETS.chip[sfx]) this.voice(v, now);
  }

  private voice(v: Voice, now: number): void {
    const ctx = this.ctx!;
    const t0 = now + (v.at ?? 0);
    const t1 = t0 + v.dur;
    const g = ctx.createGain();
    const peak = v.gain ?? 0.1;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t1);
    let out: AudioNode = g;
    if (v.filter) {
      const f = ctx.createBiquadFilter();
      f.type = 'noise' in v ? 'bandpass' : 'lowpass';
      f.frequency.setValueAtTime(v.filter, t0);
      if ('noise' in v && v.sweep) f.frequency.exponentialRampToValueAtTime(v.sweep, t1);
      if ('noise' in v && v.q) f.Q.value = v.q;
      g.connect(f);
      out = f;
    }
    out.connect(this.master!);
    if ('noise' in v) {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      src.connect(g);
      src.start(t0);
      src.stop(t1 + 0.02);
      return;
    }
    const osc = ctx.createOscillator();
    osc.type = v.wave;
    osc.frequency.setValueAtTime(v.f0, t0);
    if (v.f1) osc.frequency.exponentialRampToValueAtTime(v.f1, t1);
    if (v.vibrato) {
      const lfo = ctx.createOscillator();
      const depth = ctx.createGain();
      lfo.frequency.value = v.vibrato[0];
      depth.gain.value = v.vibrato[1];
      lfo.connect(depth).connect(osc.frequency);
      lfo.start(t0);
      lfo.stop(t1 + 0.02);
    }
    osc.connect(g);
    osc.start(t0);
    osc.stop(t1 + 0.02);
  }
}
