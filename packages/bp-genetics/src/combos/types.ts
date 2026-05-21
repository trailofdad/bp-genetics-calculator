import type { CopyCount } from '../types';

/**
 * A single requirement for a combo to fire.
 * minCopies: 1 = at least one copy (het or visual codominant)
 *            2 = two copies (visual recessive or super codominant)
 */
export interface ComboCondition {
  geneId: string;
  minCopies: Exclude<CopyCount, 0>;
}

/**
 * A known common-name combination of genes in ball python breeding.
 *
 * A combo fires when the offspring genotype satisfies ALL conditions.
 * Combos are matched as subsets — an outcome with extra genes beyond the
 * requirements still matches (e.g. "Banana Bumblebee Het Clown" will
 * still match "Bumblebee").
 *
 * When multiple combos match, all are reported; the UI can choose to display
 * the most specific (most `requires` entries) first.
 *
 * @example
 * const bumblebee: ComboName = {
 *   id: 'bumblebee',
 *   name: 'Bumblebee',
 *   requires: [
 *     { geneId: 'pastel', minCopies: 1 },
 *     { geneId: 'spider', minCopies: 1 },
 *   ],
 * };
 */
export interface ComboName {
  /** Unique kebab-case identifier. */
  id: string;
  /** Human-readable combo name shown in the UI. */
  name: string;
  /** All conditions must be satisfied for this combo to match. */
  requires: ComboCondition[];
}
