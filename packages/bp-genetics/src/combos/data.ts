import type { ComboName } from './types';

/**
 * Canonical list of well-known ball python gene combinations and their common trade names.
 *
 * To add a new combo, append an entry following the existing pattern.
 * Requirements:
 *   - `id` must be unique (kebab-case)
 *   - `requires` lists every gene needed (minCopies: 1 = visual codominant / het recessive, 2 = super codominant / visual recessive)
 *   - Combos involving BEL complex interactions are intentionally excluded here;
 *     those are handled by the interaction rule system.
 *
 * Matching is subset-based: an outcome with additional genes beyond the requirements
 * still matches, allowing "Banana Bumblebee" to match both "Bumblebee" and "Banana Bumblebee".
 */
export const COMBO_NAMES: ComboName[] = [

  // ── Two-gene codominant combos ──────────────────────────────────────────────

  {
    id: 'pewter',
    name: 'Pewter',
    requires: [
      { geneId: 'cinnamon', minCopies: 1 },
      { geneId: 'pastel', minCopies: 1 },
    ],
  },
  {
    id: 'bumblebee',
    name: 'Bumblebee',
    requires: [
      { geneId: 'pastel', minCopies: 1 },
      { geneId: 'spider', minCopies: 1 },
    ],
  },
  {
    id: 'killer_bee',
    name: 'Killer Bee',
    requires: [
      { geneId: 'pastel', minCopies: 2 }, // Super Pastel
      { geneId: 'spider', minCopies: 1 },
    ],
  },
  {
    id: 'spinner',
    name: 'Spinner',
    requires: [
      { geneId: 'pastel', minCopies: 1 },
      { geneId: 'pinstripe', minCopies: 1 },
    ],
  },
  {
    id: 'black_bee',
    name: 'Black Bee',
    requires: [
      { geneId: 'black_pastel', minCopies: 1 },
      { geneId: 'spider', minCopies: 1 },
    ],
  },
  {
    id: 'honey_bee',
    name: 'Honey Bee',
    requires: [
      { geneId: 'butter', minCopies: 1 },
      { geneId: 'spider', minCopies: 1 },
    ],
  },
  {
    id: 'bees_knees',
    name: "Bee's Knees",
    requires: [
      { geneId: 'yellow_belly', minCopies: 1 },
      { geneId: 'spider', minCopies: 1 },
    ],
  },
  {
    id: 'highway',
    name: 'Highway',
    requires: [
      { geneId: 'pastel', minCopies: 1 },
      { geneId: 'yellow_belly', minCopies: 1 },
    ],
  },
  {
    id: 'freeway',
    name: 'Freeway',
    requires: [
      { geneId: 'pastel', minCopies: 2 }, // Super Pastel
      { geneId: 'yellow_belly', minCopies: 1 },
    ],
  },
  {
    id: 'ivory',
    name: 'Ivory',
    requires: [
      { geneId: 'yellow_belly', minCopies: 2 }, // Super Yellow Belly
    ],
  },
  {
    id: 'paradigm',
    name: 'Paradigm',
    requires: [
      { geneId: 'enchi', minCopies: 1 },
      { geneId: 'mojave', minCopies: 1 },
    ],
  },
  {
    id: 'mystic_potion',
    name: 'Mystic Potion',
    requires: [
      { geneId: 'mystic', minCopies: 1 },
      { geneId: 'mojave', minCopies: 1 },
    ],
  },
  {
    id: 'ghi_mojave',
    name: 'GHI Mojave',
    requires: [
      { geneId: 'ghi', minCopies: 1 },
      { geneId: 'mojave', minCopies: 1 },
    ],
  },
  {
    id: 'ghi_mystic',
    name: 'GHI Mystic',
    requires: [
      { geneId: 'ghi', minCopies: 1 },
      { geneId: 'mystic', minCopies: 1 },
    ],
  },
  {
    id: 'cinnabun',
    name: 'Cinnabun',
    requires: [
      { geneId: 'cinnamon', minCopies: 1 },
      { geneId: 'coral_glow', minCopies: 1 },
    ],
  },
  {
    id: 'panda_pied',
    name: 'Panda Pied',
    requires: [
      { geneId: 'black_pastel', minCopies: 1 },
      { geneId: 'piebald', minCopies: 2 },
    ],
  },
  {
    id: 'stormtrooper',
    name: 'Stormtrooper',
    requires: [
      { geneId: 'cinnamon', minCopies: 1 },
      { geneId: 'piebald', minCopies: 2 },
    ],
  },

  // ── Codominant + visual recessive combos ───────────────────────────────────

  {
    id: 'pastel_clown',
    name: 'Pastel Clown',
    requires: [
      { geneId: 'pastel', minCopies: 1 },
      { geneId: 'clown', minCopies: 2 },
    ],
  },
  {
    id: 'banana_clown',
    name: 'Banana Clown',
    requires: [
      { geneId: 'banana', minCopies: 1 },
      { geneId: 'clown', minCopies: 2 },
    ],
  },
  {
    id: 'cinnamon_clown',
    name: 'Cinnamon Clown',
    requires: [
      { geneId: 'cinnamon', minCopies: 1 },
      { geneId: 'clown', minCopies: 2 },
    ],
  },
  {
    id: 'black_pastel_clown',
    name: 'Black Pastel Clown',
    requires: [
      { geneId: 'black_pastel', minCopies: 1 },
      { geneId: 'clown', minCopies: 2 },
    ],
  },
  {
    id: 'enchi_clown',
    name: 'Enchi Clown',
    requires: [
      { geneId: 'enchi', minCopies: 1 },
      { geneId: 'clown', minCopies: 2 },
    ],
  },
  {
    id: 'mojave_clown',
    name: 'Mojave Clown',
    requires: [
      { geneId: 'mojave', minCopies: 1 },
      { geneId: 'clown', minCopies: 2 },
    ],
  },
  {
    id: 'spider_clown',
    name: 'Spider Clown',
    requires: [
      { geneId: 'spider', minCopies: 1 },
      { geneId: 'clown', minCopies: 2 },
    ],
  },
  {
    id: 'od_clown',
    name: 'OD Clown',
    requires: [
      { geneId: 'orange_dream', minCopies: 1 },
      { geneId: 'clown', minCopies: 2 },
    ],
  },
  {
    id: 'yb_clown',
    name: 'YB Clown',
    requires: [
      { geneId: 'yellow_belly', minCopies: 1 },
      { geneId: 'clown', minCopies: 2 },
    ],
  },
  {
    id: 'coral_glow_clown',
    name: 'Coral Glow Clown',
    requires: [
      { geneId: 'coral_glow', minCopies: 1 },
      { geneId: 'clown', minCopies: 2 },
    ],
  },
  {
    id: 'pastel_piebald',
    name: 'Pastel Piebald',
    requires: [
      { geneId: 'pastel', minCopies: 1 },
      { geneId: 'piebald', minCopies: 2 },
    ],
  },
  {
    id: 'enchi_piebald',
    name: 'Enchi Piebald',
    requires: [
      { geneId: 'enchi', minCopies: 1 },
      { geneId: 'piebald', minCopies: 2 },
    ],
  },
  {
    id: 'pastel_albino',
    name: 'Pastel Albino',
    requires: [
      { geneId: 'pastel', minCopies: 1 },
      { geneId: 'albino', minCopies: 2 },
    ],
  },
  {
    id: 'coral_glow_albino',
    name: 'Coral Glow Albino',
    requires: [
      { geneId: 'coral_glow', minCopies: 1 },
      { geneId: 'albino', minCopies: 2 },
    ],
  },
  {
    id: 'banana_piebald',
    name: 'Banana Piebald',
    requires: [
      { geneId: 'banana', minCopies: 1 },
      { geneId: 'piebald', minCopies: 2 },
    ],
  },
  {
    id: 'pastel_axanthic_vpi',
    name: 'Pastel Axanthic',
    requires: [
      { geneId: 'pastel', minCopies: 1 },
      { geneId: 'axanthic_vpi', minCopies: 2 },
    ],
  },
  {
    id: 'pastel_hypo',
    name: 'Pastel Hypo',
    requires: [
      { geneId: 'pastel', minCopies: 1 },
      { geneId: 'hypo', minCopies: 2 },
    ],
  },
  {
    id: 'od_piebald',
    name: 'OD Piebald',
    requires: [
      { geneId: 'orange_dream', minCopies: 1 },
      { geneId: 'piebald', minCopies: 2 },
    ],
  },

  // ── Three-gene combos ──────────────────────────────────────────────────────

  {
    id: 'bumblebee_clown',
    name: 'Bumblebee Clown',
    requires: [
      { geneId: 'pastel', minCopies: 1 },
      { geneId: 'spider', minCopies: 1 },
      { geneId: 'clown', minCopies: 2 },
    ],
  },
  {
    id: 'banana_bumblebee',
    name: 'Banana Bumblebee',
    requires: [
      { geneId: 'banana', minCopies: 1 },
      { geneId: 'pastel', minCopies: 1 },
      { geneId: 'spider', minCopies: 1 },
    ],
  },
  {
    id: 'banana_pewter',
    name: 'Banana Pewter',
    requires: [
      { geneId: 'banana', minCopies: 1 },
      { geneId: 'cinnamon', minCopies: 1 },
      { geneId: 'pastel', minCopies: 1 },
    ],
  },
  {
    id: 'banana_spinner',
    name: 'Banana Spinner',
    requires: [
      { geneId: 'banana', minCopies: 1 },
      { geneId: 'pastel', minCopies: 1 },
      { geneId: 'pinstripe', minCopies: 1 },
    ],
  },
  {
    id: 'candy_clown',
    name: 'Candy Clown',
    requires: [
      { geneId: 'candy', minCopies: 2 },
      { geneId: 'clown', minCopies: 2 },
    ],
  },
  {
    id: 'ultramel_clown',
    name: 'Ultramel Clown',
    requires: [
      { geneId: 'ultramel', minCopies: 2 },
      { geneId: 'clown', minCopies: 2 },
    ],
  },
];
