import type { Gene } from '../types';

/**
 * A fast, immutable registry of genes backed by a Map for O(1) lookup by ID.
 * Instantiate with a custom gene list to override the defaults.
 *
 * @example
 * import { GeneRegistry, GENES } from 'bp-genetics';
 * const registry = new GeneRegistry([...GENES, myCustomGene]);
 */
export class GeneRegistry {
  private readonly byId: Map<string, Gene>;
  private readonly _categories: string[];

  constructor(private readonly genes: Gene[]) {
    this.byId = new Map(genes.map(g => [g.id, g]));
    this._categories = [...new Set(genes.map(g => g.category))];
  }

  /** All genes in insertion order. */
  getAll(): Gene[] {
    return this.genes;
  }

  /** Look up a gene by its ID. Returns undefined if not found. */
  getById(id: string): Gene | undefined {
    return this.byId.get(id);
  }

  /** All unique category strings, in the order they first appear in the gene list. */
  getCategories(): string[] {
    return this._categories;
  }

  /**
   * Case-insensitive search across name and shortName.
   * Returns all genes whose name or shortName contains the query string.
   */
  search(query: string): Gene[] {
    const q = query.toLowerCase();
    return this.genes.filter(
      g =>
        g.name.toLowerCase().includes(q) ||
        g.shortName.toLowerCase().includes(q)
    );
  }

  /** Filter genes to a specific category. */
  filterByCategory(category: string): Gene[] {
    return this.genes.filter(g => g.category === category);
  }

  /** Total number of genes in this registry. */
  get size(): number {
    return this.genes.length;
  }
}
