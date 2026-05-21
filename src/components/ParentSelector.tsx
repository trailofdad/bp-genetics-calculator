import { useState, useMemo } from 'react';
import { GENES, GENE_CATEGORIES } from 'bp-genetics';
import type { CopyCount, ParentGenotype } from 'bp-genetics';

interface Props {
  parentLabel: string;
  genotype: ParentGenotype;
  onChange: (g: ParentGenotype) => void;
}

const COPY_OPTIONS: { value: CopyCount; label: string; color: string }[] = [
  { value: 0, label: 'None',         color: 'bg-slate-100 text-slate-500' },
  { value: 1, label: 'Het / Single', color: 'bg-amber-100 text-amber-800' },
  { value: 2, label: 'Visual / Super', color: 'bg-emerald-100 text-emerald-800' },
];

export function ParentSelector({ parentLabel, genotype, onChange }: Props) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredGenes = useMemo(() => {
    return GENES.filter(gene => {
      const matchSearch =
        search === '' ||
        gene.name.toLowerCase().includes(search.toLowerCase()) ||
        gene.shortName.toLowerCase().includes(search.toLowerCase());
      const matchCat = activeCategory === null || gene.category === activeCategory;
      return matchSearch && matchCat;
    });
  }, [search, activeCategory]);

  const activeGenes = Object.entries(genotype).filter(([, c]) => c > 0);

  function setGene(geneId: string, copies: CopyCount) {
    const next = { ...genotype };
    if (copies === 0) {
      delete next[geneId];
    } else {
      next[geneId] = copies;
    }
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-bold text-slate-800">{parentLabel}</h2>

      {/* Active genes chips */}
      {activeGenes.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 min-h-[52px]">
          {activeGenes.map(([geneId, copies]) => {
            const gene = GENES.find(g => g.id === geneId)!;
            const opt = COPY_OPTIONS.find(o => o.value === copies)!;
            return (
              <span
                key={geneId}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium ${opt.color}`}
              >
                {gene.shortName}
                <span className="text-xs opacity-70">({opt.label.split(' ')[0]})</span>
                <button
                  onClick={() => setGene(geneId, 0)}
                  className="ml-1 hover:opacity-70 font-bold"
                  aria-label={`Remove ${gene.name}`}
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        placeholder="Search genes..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />

      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
            activeCategory === null
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All
        </button>
        {GENE_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Gene list */}
      <div className="flex flex-col gap-1 max-h-72 overflow-y-auto pr-1">
        {filteredGenes.map(gene => {
          const copies = genotype[gene.id] ?? 0;
          return (
            <div
              key={gene.id}
              className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-800">{gene.name}</span>
                <span className="text-xs text-slate-400 capitalize">
                  {gene.type === 'codominant' ? 'Co-dominant' : 'Recessive'}
                  {gene.lethalSuper && ' · ⚠ lethal super'}
                  {gene.superName && copies === 0 ? ` → ${gene.superName}` : ''}
                </span>
              </div>
              <div className="flex gap-1">
                {COPY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setGene(gene.id, opt.value)}
                    title={opt.label}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      copies === opt.value
                        ? opt.color + ' ring-2 ring-offset-1 ring-indigo-400'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {opt.value === 0 ? '0' : opt.value === 1 ? 'Het' : 'Vis'}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        {filteredGenes.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-4">No genes match your search.</p>
        )}
      </div>
    </div>
  );
}
