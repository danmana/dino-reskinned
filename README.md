# Dino, Reskinned

The Chrome offline dinosaur game, rebuilt from scratch in pixel art and dressed in eleven worlds. Switch skins mid-run with the arrow keys, let autoplay drive, or make your own skin in a minute.

**Play:** https://dino-reskinned.vercel.app

## Skins

| # | Skin | Runner | Obstacles | Flyer |
|---|------|--------|-----------|-------|
| 1 | Original | T-rex | cacti | pterodactyl |
| 2 | Wild West | cowboy on a galloping horse | tumbleweeds, barrels, saguaros | eagle |
| 3 | Tokyo Lights | rider on a neon motorbike | cones, barriers, vending machines | drone |
| 4 | Deep Sea | crab | urchins, clams, coral, anchors | shark |
| 5 | Goat Mode | goat, tongue out | gnomes, gas cans, hay bales | a flung goat |
| 6 | Fire & Blood | knight in a red cape | stakes, braziers, barricades | dragon |
| 7 | Polar Night | penguin (belly-slides to duck) | ice shards, snowmen | snowy owl |
| 8 | Moonwalk | astronaut | moon rocks, landers, antennas | UFO |
| 9 | Graveyard Shift | skeleton | tombstones, pumpkins, coffins | bat |
| 10 | Sugar Rush | gingerbread man | gumdrops, cupcakes, candy canes | winged donut |
| 11 | Rush Hour | office worker with coffee | hydrants, bins, mailboxes | pigeon |

Every skin keeps the original game loop: the same physics, spawn rules, gaps, speed curve, night mode every 700 points and score milestones every 100. Only the art, scenery, weather and sounds change, so switching mid-run is fair.

## Controls

| Key | Action |
|-----|--------|
| Space / ↑ / W | Jump (hold for a higher jump) |
| ↓ / S | Duck, or drop fast mid-air |
| ← → or [ ] | Previous / next skin, mid-run |
| 1 – 0 | Pick a skin |
| A | Autoplay on or off (any jump key takes over) |
| M | Sound on or off |

On phones: tap the game to jump, or use the Jump and Duck pads. Like the original, touch play leaves out the mid-height flyer lane.

## Skin designer

Pick who plays each role (any skin's sprite, or any emoji, which gets pixelated and outlined), six colours, far and near scenery, ground, weather, what's in the sky and the sound set. The game keeps playing your skin on autoplay while you edit. Skins are saved in your browser, and **Copy link** puts the whole skin in a URL so anyone can play it.

## How it's built

Vite + TypeScript, no framework, no runtime dependencies.

- `src/game/` — engine (a port of the Chromium runner's rules, halved into art pixels), autoplay bot, WebAudio synth.
- `src/render/` — every procedural asset (dithered skies, 18 parallax layer kinds, 14 ground styles, celestial bodies) renders into a tiny `PixelBuffer`, so the same code runs in the browser and in Node. The canvas renderer composites cached tiles, weather particles and ordered-dither transitions for night mode and skin switches.
- `src/skins/` — each skin is a `SkinDef` (see `types.ts`): sprites as character grids plus scene settings. `custom.ts` turns designer recipes into skins.
- Collisions are pixel-mask based, so any art, including emoji, collides exactly as drawn.

### Scripts

```bash
npm run dev                      # local dev server
npm run build                    # typecheck + production build
node scripts/sheet.ts <skin-id>  # PNG preview of a skin (day, night, sprite sheet) + size/contrast checks
node scripts/botbench.ts <skin-id> [runs]   # headless autoplay benchmark
```

### Adding a skin

1. Copy `src/skins/original.ts`, redraw the grids and set the scene.
2. `node scripts/sheet.ts <id>` until it reports no problems and the PNG looks right.
3. Add it to `PRESETS` in `src/skins/index.ts`.

A fan project. The original game and its dinosaur belong to Google; this is not affiliated with Google.
