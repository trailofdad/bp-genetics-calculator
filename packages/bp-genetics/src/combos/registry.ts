import type { CopyCount } from '../types';
import type { ComboName } from './types';

/**
 * A registry of combo names, indexed by gene ID for fast candidate lookup.
 *
 * The lookup strategy mirrors `InteractionRegistry`:
 * 1. Build an index: geneId → ComboName[] (combos that require that gene).
 * 2. On query, collect candidate combos from the genes present in the genotype.
 * 3. Filter candidates by checking all conditions.
 * 4. Sort by specificity (descending number of requirements) so the most
 *    descriptive combo name comes first.
 *
 * @example
 * import { ComboRegistry, COMBO_NAMES } from 'bp-genetics';
 *
 * const registry = new ComboRegistry(COMBO_NAMES);
 * const matches = registry.findMatching({ pastel: 1, spider: 1, clown: 2 });
 * // → [{ id: 'bumblebee_clown', name: 'Bumblebee Clown', … }, { id: 'bumblebee', … }]
 */
export class ComboRegistry {
  /** geneId → combos that require at least that gene */
  private readonly byGene: Map<string, ComboName[]> = new Map();

  constructor(private readonly combos: ComboName[]) {
    for (const combo of combos) {
      for (const cond of combo.requires) {
        const existing = this.byGene.get(cond.geneId) ?? [];
        existing.push(combo);
        this.byGene.set(cond.geneId, existing);
      }
    }
  }

  /** All combos registered in this instance. */
  getAll(): ComboName[] {
    return this.combos;
  }

  /**
   * Return every combo whose conditions are fully satisfied by the given genotype.
   * Results are sorted most-specific first (most requirements → fewest requirements).
   *
   * Time complexity: O(genes_in_genotype × avg_combos_per_gene × conditions_per_combo)
   * In practice this is effectively O(1) for any realistic genotype.
   */
  findMatching(genotype: Record<string, CopyCount>): ComboName[] {
    const candidates = new Set<ComboName>();

    for (const geneId of Object.keys(genotype)) {
      if ((genotype[geneId] ?? 0) === 0) continue;
      for (const combo of this.byGene.get(geneId) ?? []) {
        candidates.add(combo);
      }
    }

    const matched = [...candidates].filter(combo =>
      combo.requires.every(cond => (genotype[cond.geneId] ?? 0) >= cond.minCopies)
    );

    // Sort most-specific (most conditions) first
    matched.sort((a, b) => b.requires.length - a.requires.length);
    return matched;
  }
}
