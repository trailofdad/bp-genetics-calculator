import type { Gene, CopyCount } from '../types';
import type { GeneRegistry } from '../genes/registry';

/**
 * Build a human-readable label fragment for one gene at a given copy count.
 * Returns null when copies === 0 (no contribution to the label).
 */
export function buildGeneLabel(gene: Gene, copies: CopyCount): string | null {
  if (copies === 0) return null;

  if (gene.type === 'recessive') {
    return copies === 2 ? gene.name : `100% Het ${gene.name}`;
  }

  if (gene.type === 'dominant') {
    // 2 copies = visually identical to 1 copy (no distinct super form)
    return gene.name;
  }

  // Codominant
  if (copies === 2) {
    return gene.superName ?? `Super ${gene.name}`;
  }
  return gene.name;
}

/**
 * Build the full human-readable label for an offspring genotype.
 * Unknown gene IDs (not in the registry) are silently skipped.
 *
 * @param genotype  Map of geneId → copies for this offspring.
 * @param registry  Gene registry used to look up display names.
 * @returns         Label string, e.g. "100% Het Albino, Pastel", or "Normal" if no genes.
 */
export function buildGenotypeLabel(
  genotype: Record<string, CopyCount>,
  registry: GeneRegistry
): { label: string; hasLethal: boolean } {
  const parts: string[] = [];
  let hasLethal = false;

  for (const [geneId, copies] of Object.entries(genotype)) {
    if (copies === 0) continue;
    const gene = registry.getById(geneId);
    if (!gene) continue;

    const part = buildGeneLabel(gene, copies);
    if (part) parts.push(part);

    if (gene.lethalSuper && copies === 2) hasLethal = true;
  }

  return {
    label: parts.length > 0 ? parts.join(', ') : 'Normal',
    hasLethal,
  };
}
