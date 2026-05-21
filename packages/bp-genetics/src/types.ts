export type GeneType = 'recessive' | 'codominant';

export interface Gene {
  id: string;
  name: string;
  shortName: string;
  type: GeneType;
  /** Display name when homozygous codominant (super form). Undefined for recessive genes. */
  superName?: string;
  /** True when the homozygous form is lethal (e.g. Spider, Champagne, Woma). */
  lethalSuper?: boolean;
  category: string;
}

/**
 * How many copies of a gene an animal carries.
 * - 0 = Normal (no copies)
 * - 1 = Heterozygous / single-gene visual (codominant)
 * - 2 = Homozygous (visual recessive, or "super" codominant)
 */
export type CopyCount = 0 | 1 | 2;

/** A parent's full set of gene copy counts. */
export interface ParentGenotype {
  [geneId: string]: CopyCount;
}

/** A single gene outcome from an individual Punnett cross. */
export interface GeneOutcome {
  geneId: string;
  copies: CopyCount;
  probability: number;
}

/** An interaction rule that fired on an offspring outcome. */
export interface MatchedInteraction {
  ruleId: string;
  ruleName: string;
}

/**
 * A fully resolved offspring outcome with combined probability and
 * any interaction effects applied.
 */
export interface OffspringOutcome {
  /** Map of geneId → copies for this offspring type. */
  genotype: Record<string, CopyCount>;
  /** Combined probability across all genes (0–1). */
  probability: number;
  /** Human-readable label, e.g. "100% Het Albino, Pastel [BEL]". */
  label: string;
  /** True when any gene in this outcome produces a lethal super combination. */
  hasLethal: boolean;
  /** Interaction rules that matched this outcome. */
  interactions: MatchedInteraction[];
  /** Aggregated informational notes from matched interactions. */
  notes: string[];
}
