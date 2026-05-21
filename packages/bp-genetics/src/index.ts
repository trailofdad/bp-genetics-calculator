// ─── Core types ───────────────────────────────────────────────────────────────
export type {
  GeneType,
  Gene,
  CopyCount,
  ParentGenotype,
  GeneOutcome,
  OffspringOutcome,
  MatchedInteraction,
} from './types';

// ─── Gene data & registry ─────────────────────────────────────────────────────
export { GENES, GeneRegistry, defaultGeneRegistry, GENE_CATEGORIES, geneById } from './genes/index';

// ─── Interaction rules & registry ─────────────────────────────────────────────
export type { InteractionCondition, InteractionEffect, InteractionRule } from './interactions/types';
export {
  INTERACTION_RULES,
  BEL_COMPLEX_GENE_IDS,
  InteractionRegistry,
  defaultInteractionRegistry,
} from './interactions/index';

// ─── Combo names ──────────────────────────────────────────────────────────────
export type { ComboCondition, ComboName } from './combos/index';
export {
  COMBO_NAMES,
  ComboRegistry,
  defaultComboRegistry,
} from './combos/index';

// ─── Engine ───────────────────────────────────────────────────────────────────
export { crossGene, buildGeneLabel, buildGenotypeLabel } from './engine/index';
export { calculateOffspring, formatProbability } from './engine/index';
