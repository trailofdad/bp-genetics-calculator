import type { CopyCount, ParentGenotype, OffspringOutcome } from '../types';
import { crossGene } from './punnett';
import { buildGenotypeLabel } from './labeler';
import { defaultGeneRegistry } from '../genes/index';
import { defaultInteractionRegistry } from '../interactions/index';
import type { GeneRegistry } from '../genes/registry';
import type { InteractionRegistry } from '../interactions/registry';

interface CalculatorOptions {
  /** Gene registry used to resolve display names. Defaults to the bundled registry. */
  geneRegistry?: GeneRegistry;
  /**
   * Interaction registry used to enrich outcomes with cross-gene effects.
   * Pass `null` to disable interactions entirely.
   * Defaults to the bundled interaction registry.
   */
  interactionRegistry?: InteractionRegistry | null;
}

/**
 * Calculate all possible offspring outcomes for two parents.
 *
 * Only genes present at ≥1 copy in at least one parent are included.
 * Duplicate genotypes are merged and their probabilities summed.
 * Results are sorted by probability (highest first).
 *
 * @example
 * const outcomes = calculateOffspring(
 *   { albino: 1 },   // Het Albino parent
 *   { albino: 2 },   // Visual Albino parent
 * );
 * // 50% Albino, 50% 100% Het Albino
 */
export function calculateOffspring(
  parent1: ParentGenotype,
  parent2: ParentGenotype,
  options: CalculatorOptions = {}
): OffspringOutcome[] {
  const geneRegistry = options.geneRegistry ?? defaultGeneRegistry;
  const interactionRegistry =
    options.interactionRegistry === null
      ? null
      : (options.interactionRegistry ?? defaultInteractionRegistry);

  // Gather all gene IDs that are active in either parent
  const geneIds = [
    ...new Set([...Object.keys(parent1), ...Object.keys(parent2)]),
  ].filter(id => (parent1[id] ?? 0) > 0 || (parent2[id] ?? 0) > 0);

  if (geneIds.length === 0) {
    return [
      {
        genotype: {},
        probability: 1,
        label: 'Normal',
        hasLethal: false,
        interactions: [],
        notes: [],
      },
    ];
  }

  // Per-gene Punnett crosses
  const perGeneCrosses = geneIds.map(geneId => {
    const p1 = parent1[geneId] ?? 0;
    const p2 = parent2[geneId] ?? 0;
    const result = crossGene(p1, p2);
    return {
      geneId,
      outcomes: [...result.entries()].map(([copies, prob]) => ({ copies, prob })),
    };
  });

  // Cartesian product across all per-gene crosses
  let combined: { genotype: Record<string, CopyCount>; probability: number }[] = [
    { genotype: {}, probability: 1 },
  ];

  for (const { geneId, outcomes } of perGeneCrosses) {
    const next: typeof combined = [];
    for (const existing of combined) {
      for (const { copies, prob } of outcomes) {
        next.push({
          genotype: { ...existing.genotype, [geneId]: copies },
          probability: existing.probability * prob,
        });
      }
    }
    combined = next;
  }

  // Merge duplicate genotypes
  const mergedMap = new Map<string, OffspringOutcome>();

  for (const { genotype, probability } of combined) {
    const key = genotypeKey(genotype);

    if (mergedMap.has(key)) {
      mergedMap.get(key)!.probability += probability;
      continue;
    }

    const { label: baseLabel, hasLethal: baseHasLethal } = buildGenotypeLabel(
      genotype,
      geneRegistry
    );

    const { label, hasLethal, interactions, notes } = interactionRegistry
      ? interactionRegistry.applyToLabel(genotype, baseLabel, baseHasLethal)
      : { label: baseLabel, hasLethal: baseHasLethal, interactions: [], notes: [] };

    mergedMap.set(key, { genotype, probability, label, hasLethal, interactions, notes });
  }

  return [...mergedMap.values()].sort((a, b) => b.probability - a.probability);
}

/** Format a probability value (0–1) as a human-readable percentage string. */
export function formatProbability(p: number): string {
  const pct = p * 100;
  if (pct >= 1) return `${Math.round(pct)}%`;
  return `${pct.toFixed(2)}%`;
}

/** Stable string key for a genotype — ignores zero-copy entries and sorts by gene ID. */
function genotypeKey(genotype: Record<string, CopyCount>): string {
  return JSON.stringify(
    Object.fromEntries(
      Object.entries(genotype)
        .filter(([, c]) => c > 0)
        .sort(([a], [b]) => a.localeCompare(b))
    )
  );
}
