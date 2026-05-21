import type { CopyCount, MatchedInteraction } from '../types';
import type { InteractionRule, InteractionEffect } from './types';

/**
 * A registry of interaction rules, indexed by gene ID for fast candidate lookup.
 *
 * @example
 * import { InteractionRegistry, INTERACTION_RULES } from 'bp-genetics';
 *
 * // Use the default rules
 * const registry = new InteractionRegistry(INTERACTION_RULES);
 *
 * // Add your own rules
 * const extended = new InteractionRegistry([...INTERACTION_RULES, myRule]);
 */
export class InteractionRegistry {
  /** Index: geneId → rules that mention that gene in their requires array. */
  private readonly byGene: Map<string, InteractionRule[]> = new Map();

  constructor(private readonly rules: InteractionRule[]) {
    for (const rule of rules) {
      for (const cond of rule.requires) {
        const existing = this.byGene.get(cond.geneId) ?? [];
        existing.push(rule);
        this.byGene.set(cond.geneId, existing);
      }
    }
  }

  /** All rules registered in this instance. */
  getAll(): InteractionRule[] {
    return this.rules;
  }

  /**
   * Return every rule whose conditions are fully satisfied by the given genotype.
   * Uses the gene index to skip rules that cannot possibly match (fast path).
   */
  findMatching(genotype: Record<string, CopyCount>): InteractionRule[] {
    const candidates = new Set<InteractionRule>();

    for (const geneId of Object.keys(genotype)) {
      for (const rule of this.byGene.get(geneId) ?? []) {
        candidates.add(rule);
      }
    }

    return [...candidates].filter(rule =>
      rule.requires.every(cond => (genotype[cond.geneId] ?? 0) >= cond.minCopies)
    );
  }

  /**
   * Apply all matching interaction rules to a label and return the enriched result.
   * Effects are applied in declaration order within each rule, rules in registry order.
   */
  applyToLabel(
    genotype: Record<string, CopyCount>,
    baseLabel: string,
    baseHasLethal: boolean
  ): {
    label: string;
    hasLethal: boolean;
    interactions: MatchedInteraction[];
    notes: string[];
  } {
    const matchedRules = this.findMatching(genotype);
    let label = baseLabel;
    let hasLethal = baseHasLethal;
    const interactions: MatchedInteraction[] = [];
    const notes: string[] = [];

    for (const rule of matchedRules) {
      interactions.push({ ruleId: rule.id, ruleName: rule.name });
      for (const effect of rule.effects) {
        applyEffect(effect, {
          getLabel: () => label,
          setLabel: (l: string) => { label = l; },
          addNote: (n: string) => notes.push(n),
          setLethal: () => { hasLethal = true; },
        });
      }
    }

    return { label, hasLethal, interactions, notes };
  }
}

interface EffectContext {
  getLabel(): string;
  setLabel(label: string): void;
  addNote(note: string): void;
  setLethal(): void;
}

function applyEffect(effect: InteractionEffect, ctx: EffectContext): void {
  switch (effect.type) {
    case 'rename':
      ctx.setLabel(effect.label);
      break;
    case 'append_label':
      ctx.setLabel(ctx.getLabel() + effect.suffix);
      break;
    case 'add_note':
      ctx.addNote(effect.message);
      break;
    case 'lethal':
      ctx.setLethal();
      break;
  }
}
