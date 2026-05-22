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
 * // → [{ id: 'bumblebee_clown', name: 'Bumblebee Clown', … }]  (exact match only)
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
   * Return combos that are an exact match for the given genotype — the combo's
   * required genes must account for every active gene in the genotype (no extra
   * genes beyond what the combo needs). Results are sorted most-specific first.
   */
  findMatching(genotype: Record<string, CopyCount>): ComboName[] {
    const activeGenes = new Set(
      Object.entries(genotype).filter(([, c]) => c > 0).map(([id]) => id)
    );

    const candidates = new Set<ComboName>();
    for (const geneId of activeGenes) {
      for (const combo of this.byGene.get(geneId) ?? []) {
        candidates.add(combo);
      }
    }

    // Exact match: all combo conditions satisfied AND every active gene is
    // covered by the combo (no leftover genes the combo doesn't account for).
    const exact = [...candidates].filter(combo => {
      const comboGenes = new Set(combo.requires.map(r => r.geneId));
      return (
        combo.requires.every(cond => (genotype[cond.geneId] ?? 0) >= cond.minCopies) &&
        [...activeGenes].every(id => comboGenes.has(id))
      );
    });

    exact.sort((a, b) => b.requires.length - a.requires.length);
    return exact;
  }
}
