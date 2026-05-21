import type { InteractionRule } from './types';

/**
 * IDs of all genes belonging to the BEL (Blue-Eyed Leucistic) complex.
 * Any animal that is het for two or more of these genes may appear as a BEL.
 * Add new BEL-complex genes here and pairwise rules are generated automatically.
 */
export const BEL_COMPLEX_GENE_IDS: readonly string[] = [
  'butter',
  'exo_lbb',
  'gravel',
  'lesser',
  'mojave',
  'mystic',
  'phantom',
  'russo',
  'special',
  'special_noco',
  'special_tcr',
] as const;

/**
 * Generate one BEL compound-het rule for every unique pair of BEL-complex genes.
 * This is done programmatically so adding a gene to BEL_COMPLEX_GENE_IDS is the
 * only change needed to create all the new pairwise rules.
 */
function buildBelRules(): InteractionRule[] {
  const rules: InteractionRule[] = [];
  const ids = BEL_COMPLEX_GENE_IDS;

  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = ids[i];
      const b = ids[j];
      const aLabel = a.replace(/_/g, ' ');
      const bLabel = b.replace(/_/g, ' ');
      rules.push({
        id: `bel_${a}_${b}`,
        name: `BEL (${aLabel} × ${bLabel})`,
        description:
          `An animal that is het for both ${aLabel} and ${bLabel} is a compound ` +
          `het for the BEL complex and visually appears as a Blue-Eyed Leucistic (BEL).`,
        requires: [
          { geneId: a, minCopies: 1 },
          { geneId: b, minCopies: 1 },
        ],
        effects: [
          { type: 'append_label', suffix: ' [BEL]' },
          {
            type: 'add_note',
            message:
              `Compound het for BEL complex (${aLabel} × ${bLabel}) — ` +
              `visually appears as Blue-Eyed Leucistic.`,
          },
        ],
      });
    }
  }

  return rules;
}

/**
 * Neurological interaction: Spider + Champagne compound het.
 * Both genes carry independent neurological wobble; combining them may intensify symptoms.
 */
const SPIDER_CHAMPAGNE_NOTE: InteractionRule = {
  id: 'neuro_spider_champagne',
  name: 'Spider + Champagne (Neurological)',
  description:
    'Both Spider and Champagne independently cause neurological wobble. ' +
    'Animals carrying both genes may exhibit more pronounced symptoms.',
  requires: [
    { geneId: 'spider', minCopies: 1 },
    { geneId: 'champagne', minCopies: 1 },
  ],
  effects: [
    {
      type: 'add_note',
      message:
        'Carries both Spider and Champagne — both genes independently cause neurological wobble. ' +
        'Consult a specialist before breeding.',
    },
    {
      type: 'risky',
      message: 'Spider + Champagne combination — compounded neurological wobble risk.',
    },
  ],
};

/**
 * Neurological interaction: Spider + Woma compound het.
 */
const SPIDER_WOMA_NOTE: InteractionRule = {
  id: 'neuro_spider_woma',
  name: 'Spider + Woma (Neurological)',
  description:
    'Both Spider and Woma independently cause neurological wobble in some animals. ' +
    'Animals carrying both genes may exhibit compounded symptoms.',
  requires: [
    { geneId: 'spider', minCopies: 1 },
    { geneId: 'woma', minCopies: 1 },
  ],
  effects: [
    {
      type: 'add_note',
      message:
        'Carries both Spider and Woma — both genes are associated with neurological wobble. ' +
        'Consult a specialist before breeding.',
    },
    {
      type: 'risky',
      message: 'Spider + Woma combination — compounded neurological wobble risk.',
    },
  ],
};

/**
 * All built-in interaction rules.
 *
 * To add a new interaction, append an InteractionRule object here.
 * No other code changes are required — the registry indexes rules automatically.
 */
export const INTERACTION_RULES: InteractionRule[] = [
  ...buildBelRules(),
  SPIDER_CHAMPAGNE_NOTE,
  SPIDER_WOMA_NOTE,
];
