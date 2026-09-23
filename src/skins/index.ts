import type { SkinDef } from './types.ts';
import { original } from './original.ts';
import { wildwest } from './wildwest.ts';
import { tokyo } from './tokyo.ts';
import { deepsea } from './deepsea.ts';
import { goat } from './goat.ts';
import { dragons } from './dragons.ts';
import { polar } from './polar.ts';
import { moon } from './moon.ts';
import { graveyard } from './graveyard.ts';
import { sugar } from './sugar.ts';
import { rushhour } from './rushhour.ts';

/** Preset order is the rail order and the 1–0 number-key order. */
export const PRESETS: SkinDef[] = [original, wildwest, tokyo, deepsea, goat, dragons, polar, moon, graveyard, sugar, rushhour];
