/**
 * The skin contract.
 *
 * A skin re-draws every element of the original game (runner, two cactus
 * sizes, the flyer, clouds, horizon, night mode) without touching the game
 * loop. Physics, spawn rules and scoring are identical across skins, so a
 * player can switch skins mid-run.
 *
 * World space is measured in art pixels: the world is H = 100 px tall, the
 * ground line sits at GROUND_Y = 78, and the world is 220–480 px wide
 * depending on the screen. Everything is drawn 1:1 in art pixels and scaled
 * up with nearest-neighbour, so a 20 px tall runner is the intended look.
 */

/**
 * A sprite drawn as rows of characters. '.' (or ' ') is transparent; every
 * other character is a key into the skin's `palette`. All rows of a grid
 * should have the same length.
 */
export type Grid = string[];

/** Size limits (art px) enforced by the sheet script. Fairness depends on them. */
export const LIMITS = {
  runner: { w: 28, h: 24 }, // run[0], run[1], jump, dead, idle
  duck: { w: 32, h: 12 }, // must be ≤ 12 tall to pass under the mid flyer lane
  small: { w: 11, h: 18 },
  large: { w: 15, h: 26 },
  flyer: { w: 26, h: 20 },
  decor: { w: 40, h: 16 },
} as const;

export type LayerKind =
  | 'hills' // soft rolling hills
  | 'mountains' // jagged peaks; accent = snow caps
  | 'mesas' // flat-topped buttes with vertical sides; accent = strata stripes
  | 'dunes' // smooth sand dunes; accent = sunlit crest
  | 'city' // skyline of towers; accent = lit windows (use glow for neon)
  | 'forest' // pine trees; accent = snow on branches (optional)
  | 'castle' // crenellated walls and towers; accent = lit windows
  | 'kelp' // tall swaying kelp strands; accent = leaves
  | 'coral' // branching coral reef; accent = coral tips
  | 'houses' // suburban houses with gabled roofs; accent = windows
  | 'graves' // tombstones, crosses and dead trees
  | 'candy' // gumdrop hills and lollipop trees; accent = swirls
  | 'craters' // low rocky lunar ridge with crater rims; accent = rim highlight
  | 'icebergs' // floating ice blocks on a waterline; accent = shadow side
  | 'fence' // wooden fence posts and rails (a near layer)
  | 'rocks' // scattered boulders
  | 'pagodas' // tiered pagoda roofs and torii gates; accent = lanterns
  | 'ruins'; // broken pillars and arches; accent = moss / embers

/** A procedurally generated parallax layer. Tiles seamlessly. */
export interface GenLayer {
  kind: LayerKind;
  /** Main silhouette colour. */
  color: string;
  /** Secondary colour; meaning depends on kind (see LayerKind comments). */
  accent?: string;
  /** Row of the layer's bottom edge. Defaults to GROUND_Y (sits on the horizon). */
  baseline?: number;
  /** Tallest silhouette height in px. */
  height: number;
  /** Parallax factor: 0 = static, 1 = moves with the ground. Far layers ~0.1–0.3. */
  speed: number;
  seed?: number;
  /** Keep `accent` at full brightness in night mode (lit windows, neon, lava). */
  glow?: boolean;
}

/** A parallax layer made of the skin's own sprites, repeated with random gaps. */
export interface SpriteLayer {
  kind: 'sprites';
  sprites: Grid[];
  baseline?: number;
  speed: number;
  /** Min/max px between consecutive sprites. */
  gap: [number, number];
  seed?: number;
}

export type LayerDef = GenLayer | SpriteLayer;

export type GroundStyle =
  | 'line' // the original: one bumpy line and pebbles on the sky colour
  | 'sand' // sand fill, specks and ripple dashes
  | 'grass' // grass tufts over dirt
  | 'road' // asphalt, curb line, dashed lane marks
  | 'rails' // railway sleepers and a rail on dirt
  | 'snow' // soft snow with blue speckle
  | 'rock' // dark rock with cracks
  | 'wet' // glossy wet street; pairs well with reflection: true
  | 'cobble' // cobblestones
  | 'moon' // grey regolith with tiny craters
  | 'frosting' // drippy icing edge with sprinkles
  | 'seabed' // sand with shells and ripples
  | 'sidewalk' // concrete slabs, seams and a curb
  | 'ice'; // glassy ice with cracks and shine

export interface GroundDef {
  style: GroundStyle;
  /** Fill below the line. */
  color: string;
  /** The top edge. */
  line: string;
  /** Texture specks, marks, sprinkles. */
  detail: string;
}

export type CelestialKind = 'sun' | 'moon' | 'crescent' | 'earth' | 'planet' | 'ringed' | 'synthsun';

export interface CelestialDef {
  kind: CelestialKind;
  /** Horizontal position as a fraction of world width (0..1). */
  x: number;
  /** Centre row in px (0 = top). The ground is at 78. */
  y: number;
  /** Radius in px. 4–14 looks right. */
  r: number;
  color: string;
  /** Halo, craters, continents, stripes or rings depending on kind. */
  accent?: string;
}

export type WeatherKind =
  | 'snow'
  | 'rain'
  | 'bubbles'
  | 'embers'
  | 'dust'
  | 'petals'
  | 'fireflies'
  | 'sparkles'
  | 'ash'
  | 'leaves'
  | 'fog'
  | 'meteors'
  | 'confetti';

export interface WeatherDef {
  kind: WeatherKind;
  color: string;
  color2?: string;
  /** 0..1 */
  density: number;
}

/** Background objects drifting slowly across the sky (the original's clouds). */
export interface DecorDef {
  sprites: Grid[];
  /** Vertical band (top rows) the decor spawns in. */
  y: [number, number];
  /** Fraction of game speed. The original clouds move at ~0.15. */
  speed: number;
  /** Min/max px between consecutive decor items. */
  every: [number, number];
}

export type NightDef =
  /** The original's night mode: the whole palette flips. */
  | { mode: 'invert' }
  | {
      mode: 'tint';
      sky: { top: string; bottom: string };
      /** Every non-glow colour is mixed toward this colour… */
      tint: string;
      /** …by this amount (0..1). 0.4–0.6 reads as night without losing shapes. */
      amount: number;
      /** Palette characters that keep full brightness (eyes, lanterns, neon, fire). */
      glow?: string[];
      /** Star colour; omit for no stars. */
      stars?: string;
      /** Replaces the day celestial. null = none at night. */
      celestial?: CelestialDef | null;
      /** Replaces the day weather. null = none at night. */
      weather?: WeatherDef | null;
      /** Northern-lights ribbon colours. */
      aurora?: [string, string];
      /** HUD colour at night. */
      ink?: string;
    };

export type SoundPreset =
  | 'chip' // the original beeps
  | 'twang' // western plucks
  | 'neon' // bright synth
  | 'bubble' // watery bloops
  | 'bleat' // goat noises
  | 'roar' // deep, fiery
  | 'chime' // icy bells
  | 'blip' // spacey sine blips
  | 'spooky' // wobbly theremin
  | 'sweet' // sugary arpeggio
  | 'honk'; // city horns

export interface SkinDef {
  id: string;
  name: string;
  /** One short line shown under the skin name. */
  tagline: string;
  /** char → '#rrggbb'. Shared by every Grid in this skin. */
  palette: Record<string, string>;

  runner: {
    /** Two alternating run frames. The runner faces right. */
    run: [Grid, Grid];
    jump: Grid;
    /** Two alternating duck frames, ≤ 12 px tall. */
    duck: [Grid, Grid];
    dead: Grid;
    /**
     * Shown while waiting for the first jump. idle[0] is the resting pose;
     * any further frames (a blink, a tail flick) play briefly every few seconds.
     * Defaults to [jump].
     */
    idle?: Grid[];
  };
  /** Small obstacle variants (the original's small cacti). Each variant is 1+ frames. */
  small: Grid[][];
  /** Tall obstacle variants (the original's large cacti). */
  large: Grid[][];
  /** Two flap frames. The flyer faces left (it flies toward the runner). */
  flyer: Grid[];
  decor?: DecorDef;

  sky: { top: string; bottom: string };
  /** Star colour in the daytime sky too (space, perpetual-night cities). Omit for none. */
  stars?: string;
  celestial?: CelestialDef;
  /** Far to near. */
  layers: LayerDef[];
  ground: GroundDef;
  weather?: WeatherDef;
  night: NightDef;
  /** Mirror sprites in the ground (wet streets, water, ice). */
  reflection?: boolean;

  /** Score and game-over text colour. Must contrast with the sky. */
  ink: string;
  sound: SoundPreset;
  /** Shown on crash. Uppercase, ≤ 14 characters. */
  gameOver: string;
  /** Page colours around the game. fg on bg must have ≥ 4.5:1 contrast. */
  ui: { bg: string; fg: string; accent: string };
}
