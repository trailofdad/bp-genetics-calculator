export { GENES } from './data';
export { GeneRegistry } from './registry';

import { GENES } from './data';
import { GeneRegistry } from './registry';

/** The default registry built from the bundled gene list. */
export const defaultGeneRegistry = new GeneRegistry(GENES);

/** Unique category strings derived from the default gene list. */
export const GENE_CATEGORIES: string[] = defaultGeneRegistry.getCategories();

/** Look up a gene by ID in the default registry. */
export const geneById = (id: string) => defaultGeneRegistry.getById(id);
