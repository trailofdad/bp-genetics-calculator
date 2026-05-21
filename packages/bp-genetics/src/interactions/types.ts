import type { CopyCount } from '../types';

/** A single condition that must be true for a rule to fire. */
export interface InteractionCondition {
  geneId: string;
  /** The minimum number of copies the animal must carry. */
  minCopies: Exclude<CopyCount, 0>;
}

/**
 * What happens when an interaction rule fires.
 *
 * - `rename`       — Replace the entire generated label with a fixed string.
 * - `append_label` — Append a short suffix to the existing label.
 * - `add_note`     — Add an informational note (surfaced to the consumer).
 * - `lethal`       — Mark the outcome as carrying a lethal combination.
 */
export type InteractionEffect =
  | { type: 'rename'; label: string }
  | { type: 'append_label'; suffix: string }
  | { type: 'add_note'; message: string }
  | { type: 'lethal' };

/**
 * A declarative rule describing a genetic interaction.
 *
 * A rule fires when ALL conditions in `requires` are satisfied by the offspring genotype.
 * Multiple effects can be listed; they are applied in order.
 *
 * @example
 * // BEL compound het: het for both Lesser and Butter
 * const rule: InteractionRule = {
 *   id: 'bel_lesser_butter',
 *   name: 'BEL (Lesser × Butter)',
 *   description: 'Compound het — visually appears as Blue-Eyed Leucistic.',
 *   requires: [
 *     { geneId: 'lesser', minCopies: 1 },
 *     { geneId: 'butter', minCopies: 1 },
 *   ],
 *   effects: [
 *     { type: 'append_label', suffix: ' [BEL]' },
 *     { type: 'add_note', message: 'Compound het for BEL complex — visually appears as Blue-Eyed Leucistic.' },
 *   ],
 * };
 */
export interface InteractionRule {
  /** Unique kebab-case identifier. */
  id: string;
  /** Human-readable name shown in the UI. */
  name: string;
  /** Optional longer description for documentation. */
  description?: string;
  /** All conditions must be satisfied for this rule to fire. */
  requires: InteractionCondition[];
  /** Effects applied in order when the rule fires. */
  effects: InteractionEffect[];
}
