import type { CopyCount } from '../types';

/**
 * Perform a single-gene Punnett square cross between two parents.
 *
 * Returns a map of CopyCount → probability (0–1).
 * Each parent contributes two alleles based on their copy count:
 *   0 copies → [normal, normal]
 *   1 copy   → [normal, gene]
 *   2 copies → [gene, gene]
 *
 * @example
 * crossGene(1, 1)
 * // Map { 0 => 0.25, 1 => 0.5, 2 => 0.25 }  (classic 1:2:1 het × het cross)
 */
export function crossGene(p1: CopyCount, p2: CopyCount): Map<CopyCount, number> {
  const a1 = alleles(p1);
  const a2 = alleles(p2);

  const counts = new Map<CopyCount, number>();
  for (const x of a1) {
    for (const y of a2) {
      const copies = (x + y) as CopyCount;
      counts.set(copies, (counts.get(copies) ?? 0) + 0.25);
    }
  }
  return counts;
}

/** Convert a copy count into its two alleles (0 = normal allele, 1 = gene allele). */
function alleles(copies: CopyCount): [number, number] {
  if (copies === 0) return [0, 0];
  if (copies === 1) return [0, 1];
  return [1, 1];
}
