// Headless autoplay benchmark: runs the real engine with the bot and reports
// how far it gets.   node scripts/botbench.ts [skin-id] [runs] [maxFrames]
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { compileSkin } from '../src/render/compile.ts';
import { Game } from '../src/game/engine.ts';
import { Bot } from '../src/game/bot.ts';
import { rng } from '../src/core/rng.ts';
import type { SkinDef } from '../src/skins/types.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const id = process.argv[2] ?? 'original';
const runs = Number(process.argv[3] ?? 10);
const maxFrames = Number(process.argv[4] ?? 60 * 60 * 4);
const mod = await import(pathToFileURL(`${root}/src/skins/${id}.ts`).href);
const def = Object.values(mod).find((v: any) => v?.runner) as SkinDef;
const art = compileSkin(def);

const scores: number[] = [];
let totalMs = 0;
for (let i = 0; i < runs; i++) {
  const g = new Game(art);
  g.rand = rng(1000 + i);
  g.worldW = 300;
  const bot = new Bot();
  const t0 = performance.now();
  for (let f = 0; f < maxFrames; f++) {
    g.step(bot.decide(g));
    g.events.length = 0;
    if (g.state === 'over') break;
  }
  totalMs += performance.now() - t0;
  scores.push(g.score);
  const why = g.state === 'over' ? `crashed at speed ${g.speed.toFixed(2)}` : 'survived';
  const near = g.obstacles.filter((o) => o.x < 90).map((o) => `${o.kind}x${o.size}@${o.x.toFixed(0)}${o.kind === "flyer" ? ` lane${o.lane}` : ""}`).join(",") + ` runner ry=${g.runner.ry.toFixed(1)} air=${g.runner.air} duck=${g.runner.ducking} drop=${g.runner.speedDrop}`;
  console.log(`run ${i}: score ${g.score} (${why}) ${g.state === 'over' ? `near: ${near}` : ''}`);
}
console.log(`median ${scores.sort((a, b) => a - b)[Math.floor(scores.length / 2)]}, avg ms/run ${(totalMs / runs).toFixed(0)}`);
