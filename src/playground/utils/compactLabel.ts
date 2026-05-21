import { GENES } from 'bp-genetics';
import type { CopyCount } from 'bp-genetics';

/** Stable string key for a genotype — ignores zero-copy entries and sorts by gene ID. */
export function genotypeKey(genotype: Record<string, CopyCount>): string {
  return JSON.stringify(
    Object.fromEntries(
      Object.entries(genotype)
        .filter(([, c]) => c > 0)
        .sort(([a], [b]) => a.localeCompare(b)),
    ),
  );
}

/**
 * Build a compact human-readable label from a genotype for use in the playground node cards.
 * - Uses `shortName` for all genes (abbreviation-friendly)
 * - Omits "100%" prefix from het recessives (just "Het X")
 * - Super codominant form is rendered as "Sup {shortName}"
 */
export function buildCompactLabel(genotype: Record<string, CopyCount>): string {
  const parts: string[] = [];

  for (const [geneId, copies] of Object.entries(genotype)) {
    if (copies === 0) continue;
    const gene = GENES.find(g => g.id === geneId);
    if (!gene) continue;

    const sn = gene.shortName;

    if (gene.type === 'recessive') {
      parts.push(copies === 2 ? sn : `Het ${sn}`);
    } else {
      // Codominant
      parts.push(copies === 2 ? `Sup ${sn}` : sn);
    }
  }

  return parts.length > 0 ? parts.join(', ') : 'Normal';
}
