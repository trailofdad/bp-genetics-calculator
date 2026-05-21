export type { ComboCondition, ComboName } from './types';
export { COMBO_NAMES } from './data';
export { ComboRegistry } from './registry';

import { COMBO_NAMES } from './data';
import { ComboRegistry } from './registry';

/** Default combo registry pre-loaded with all built-in combo names. */
export const defaultComboRegistry = new ComboRegistry(COMBO_NAMES);
