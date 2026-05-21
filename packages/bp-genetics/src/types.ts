export type GeneType = 'recessive' | 'codominant' | 'dominant';

export interface Gene {
  id: string;
  name: string;
  shortName: string;
  type: GeneType;
  /** Alternative names or common abbreviations (used for search). */
  aliases?: string[];
  /** Display name when homozygous codominant (super form). Undefined for recessive/dominant genes. */
  superName?: string;
  /**
   * True when the homozygous form is lethal (e.g. Spider, Champagne, Woma).
   * Applicable to codominant and dominant genes.
   */
  lethalSuper?: boolean;
  /**
   * If set, this gene is considered individually risky when present.
   * The value is a short human-readable note shown in the UI and surfaced on offspring outcomes.
   */
  riskNote?: string;
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
  /** True when any gene or interaction in this outcome is flagged as risky. */
  hasRisk: boolean;
  /** Aggregated risk messages from genes and interaction rules. */
  risks: string[];
  /** Interaction rules that matched this outcome. */
  interactions: MatchedInteraction[];
  /** Aggregated informational notes from matched interactions. */
  notes: string[];
  /** Common trade names that match this outcome's genotype (e.g. ["Bumblebee"]). Most specific first. */
  comboNames: string[];
}
