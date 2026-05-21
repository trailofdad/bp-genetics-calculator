export type { InteractionCondition, InteractionEffect, InteractionRule } from './types';
export { INTERACTION_RULES, BEL_COMPLEX_GENE_IDS } from './data';
export { InteractionRegistry } from './registry';

import { INTERACTION_RULES } from './data';
import { InteractionRegistry } from './registry';

/** The default registry built from all bundled interaction rules. */
export const defaultInteractionRegistry = new InteractionRegistry(INTERACTION_RULES);
