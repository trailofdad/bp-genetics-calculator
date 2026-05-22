import { useState, useMemo, useCallback, type ReactNode } from 'react';
import { GENES, GENE_CATEGORIES, COMBO_NAMES } from 'bp-genetics';
import type { CopyCount, ParentGenotype } from 'bp-genetics';

const RECENT_MAX = 5;

function storageKey(parentLabel: string) {
  return `recent-genes:${parentLabel}`;
}

function loadRecent(parentLabel: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey(parentLabel));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveRecent(parentLabel: string, ids: string[]) {
  try {
    localStorage.setItem(storageKey(parentLabel), JSON.stringify(ids));
  } catch {
    // ignore
  }
}

function useRecentGenes(parentLabel: string) {
  const [recentIds, setRecentIds] = useState<string[]>(() => loadRecent(parentLabel));

  const pushRecent = useCallback((geneId: string) => {
    setRecentIds(prev => {
      const next = [geneId, ...prev.filter(id => id !== geneId)].slice(0, RECENT_MAX);
      saveRecent(parentLabel, next);
      return next;
    });
  }, [parentLabel]);

  return { recentIds, pushRecent };
}

interface Props {
  parentLabel: string;
  parentSex: string;
  genotype: ParentGenotype;
  onChange: (g: ParentGenotype) => void;
  headerAction?: ReactNode;
}

const COPY_VALUES: CopyCount[] = [0, 1, 2];

function copyOptionLabel(value: CopyCount, geneType: string): { label: string; short: string } {
  if (value === 0) return { label: 'None', short: '✕' };
  if (geneType === 'codominant') {
    return value === 1
      ? { label: 'Single / Visual', short: 'Vis' }
      : { label: 'Super',           short: 'Sup' };
  }
  if (geneType === 'dominant') {
    return value === 1
      ? { label: 'Visual',          short: 'Vis' }
      : { label: 'Homozygous',      short: 'Hom' };
  }
  return value === 1
    ? { label: 'Het',    short: 'Het' }
    : { label: 'Visual', short: 'Vis' };
}

/** Pastel chip style by gene type */
function geneTypeChip(type: string, lethal?: boolean) {
  if (lethal) return 'bg-rose-500/15 text-rose-300 border border-rose-500/20';
  if (type === 'codominant') return 'bg-sky-500/15 text-sky-300 border border-sky-500/20';
  if (type === 'dominant') return 'bg-teal-500/15 text-teal-300 border border-teal-500/20';
  return 'bg-violet-500/15 text-violet-300 border border-violet-500/20';
}

/** Chip style for active-gene chips, matching the badge colour scheme */
function copyChip(copies: CopyCount, type: string, lethalSuper?: boolean) {
  if (type === 'codominant') {
    if (lethalSuper && copies === 2) return 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
    return 'bg-sky-500/15 text-sky-300 border border-sky-500/25';
  }
  // recessive
  if (copies === 1) return 'bg-amber-500/15 text-amber-300 border border-amber-500/20';
  return 'bg-violet-500/15 text-violet-300 border border-violet-500/25';
}

export function ParentSelector({ parentLabel, parentSex, genotype, onChange, headerAction }: Props) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const { recentIds, pushRecent } = useRecentGenes(parentLabel);

  /** Unified alphabetical list of genes and combos, active/applied items sorted first */
  const listItems = useMemo(() => {
    const q = search.toLowerCase();

    type GeneItem  = { kind: 'gene';  gene: typeof GENES[number] };
    type ComboItem = { kind: 'combo'; combo: typeof COMBO_NAMES[number] };
    type Item = GeneItem | ComboItem;

    const items: Item[] = [];

    if (activeCategory !== 'Combos') {
      for (const gene of GENES) {
        const matchSearch = q === '' || gene.name.toLowerCase().includes(q) || gene.shortName.toLowerCase().includes(q) || (gene.aliases?.some(a => a.toLowerCase().includes(q)) ?? false);
        const matchCat    = activeCategory === null || gene.category === activeCategory;
        if (matchSearch && matchCat) items.push({ kind: 'gene', gene });
      }
    }

    if (activeCategory === null || activeCategory === 'Combos') {
      for (const combo of COMBO_NAMES) {
        if (q === '' || combo.name.toLowerCase().includes(q)) {
          items.push({ kind: 'combo', combo });
        }
      }
    }

    items.sort((a, b) => {
      const nameA = a.kind === 'gene' ? a.gene.name : a.combo.name;
      const nameB = b.kind === 'gene' ? b.gene.name : b.combo.name;
      const activeA = a.kind === 'gene'
        ? (genotype[a.gene.id] ?? 0) > 0 ? 0 : 1
        : a.combo.requires.every(c => (genotype[c.geneId] ?? 0) >= c.minCopies) ? 0 : 1;
      const activeB = b.kind === 'gene'
        ? (genotype[b.gene.id] ?? 0) > 0 ? 0 : 1
        : b.combo.requires.every(c => (genotype[c.geneId] ?? 0) >= c.minCopies) ? 0 : 1;
      if (activeA !== activeB) return activeA - activeB;
      return nameA.localeCompare(nameB);
    });

    return items;
  }, [search, activeCategory, genotype]);

  const activeGenes = Object.entries(genotype).filter(([, c]) => c > 0);

  function setGene(geneId: string, copies: CopyCount) {
    const next = { ...genotype };
    if (copies === 0) {
      delete next[geneId];
    } else {
      next[geneId] = copies;
      pushRecent(geneId);
    }
    onChange(next);
  }

  function applyCombo(comboId: string) {
    const combo = COMBO_NAMES.find(c => c.id === comboId);
    if (!combo) return;
    const next = { ...genotype };
    for (const cond of combo.requires) {
      // Only upgrade — never reduce an existing higher value
      const current = next[cond.geneId] ?? 0;
      if (cond.minCopies > current) {
        next[cond.geneId] = cond.minCopies;
        pushRecent(cond.geneId);
      }
    }
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-white tracking-tight">{parentLabel}</h2>
        <span className="text-slate-600 text-sm">{parentSex}</span>
        <div className="ml-auto flex items-center gap-2">
          {headerAction}
          {activeGenes.length > 0 && (
            <span className="text-xs text-slate-500">{activeGenes.length} selected</span>
          )}
        </div>
      </div>

      {/* Active genes chips */}
      <div className={`flex flex-wrap gap-1.5 min-h-[42px] px-3 py-2 rounded-xl border transition-colors ${
        activeGenes.length > 0
          ? 'bg-white/[0.03] border-white/8'
          : 'bg-transparent border-white/5'
      }`}>
        {activeGenes.length === 0 && (
          <span className="text-xs text-slate-600 self-center">No genes selected</span>
        )}
        {activeGenes.map(([geneId, copies]) => {
          const gene = GENES.find(g => g.id === geneId)!;
          return (
            <span
              key={geneId}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${copyChip(copies as CopyCount, gene.type, gene.lethalSuper)}`}
            >
              {gene.type === 'recessive' && copies === 1 && (
                <span className="opacity-60">het</span>
              )}
              {gene.name}
              <button
                onClick={() => setGene(geneId, 0)}
                className="ml-0.5 opacity-50 hover:opacity-100 transition-opacity"
                aria-label={`Remove ${gene.name}`}
              >
                ×
              </button>
            </span>
          );
        })}
      </div>

      {/* Recent genes — always rendered to prevent layout shift */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-medium text-slate-600 uppercase tracking-wider">Recent</span>
        <div className="flex flex-wrap gap-1.5 min-h-[26px]">
          {recentIds.map(id => {
            const gene = GENES.find(g => g.id === id);
            if (!gene) return null;
            const already = (genotype[id] ?? 0) > 0;
            const colorClass = already
              ? 'bg-white/5 text-slate-600 border-white/5 cursor-default'
              : gene.lethalSuper
                ? 'bg-rose-500/10 text-rose-300/70 border-rose-500/20 hover:bg-rose-500/20 hover:text-rose-200 cursor-pointer'
                : gene.type === 'codominant'
                  ? 'bg-sky-500/10 text-sky-300/70 border-sky-500/20 hover:bg-sky-500/20 hover:text-sky-200 cursor-pointer'
                  : 'bg-violet-500/10 text-violet-300/70 border-violet-500/20 hover:bg-violet-500/20 hover:text-violet-200 cursor-pointer';
            return (
              <button
                key={id}
                onClick={() => { if (!already) setGene(id, 1); }}
                disabled={already}
                title={already ? `${gene.name} already selected` : `Add ${gene.name} as Het`}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${colorClass}`}
              >
                {gene.name.length > 6 ? gene.shortName : gene.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search genes…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full px-3 py-2 bg-white/5 border border-white/8 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-colors"
      />

      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
            activeCategory === null
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              : 'bg-white/5 text-slate-500 border border-white/5 hover:text-slate-300 hover:bg-white/10'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveCategory(activeCategory === 'Combos' ? null : 'Combos')}
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
            activeCategory === 'Combos'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'bg-white/5 text-slate-500 border border-white/5 hover:text-slate-300 hover:bg-white/10'
          }`}
        >
          Combos
        </button>
        {GENE_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'bg-white/5 text-slate-500 border border-white/5 hover:text-slate-300 hover:bg-white/10'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Gene + combo list */}
      <div className="flex flex-col gap-0.5 max-h-72 overflow-y-auto -mr-1 pr-1">
        {listItems.map(item => {
          if (item.kind === 'combo') {
            const { combo } = item;
            const isApplied = combo.requires.every(
              cond => (genotype[cond.geneId] ?? 0) >= cond.minCopies
            );
            const constituents = combo.requires
              .map(cond => {
                const g = GENES.find(g => g.id === cond.geneId);
                if (!g) return cond.geneId;
                return cond.minCopies === 2
                  ? g.type === 'recessive' ? g.name : (g.superName ?? `Super ${g.name}`)
                  : g.name;
              })
              .join(' + ');
            return (
              <div
                key={`combo:${combo.id}`}
                className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                  isApplied ? 'bg-emerald-500/5 border border-emerald-500/10' : 'hover:bg-white/5'
                }`}
              >
                <div className="flex flex-col min-w-0 mr-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-slate-200 truncate">{combo.name}</span>
                    <span className="shrink-0 px-1.5 py-px rounded text-[10px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
                      combo
                    </span>
                    {isApplied && (
                      <span className="shrink-0 text-[10px] text-emerald-400/70">✓ applied</span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 truncate">{constituents}</span>
                </div>
                <button
                  onClick={() => applyCombo(combo.id)}
                  disabled={isApplied}
                  className={`shrink-0 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    isApplied
                      ? 'bg-emerald-500/10 text-emerald-500/50 cursor-default'
                      : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/25 hover:text-emerald-200'
                  }`}
                >
                  {isApplied ? '✓' : 'Apply'}
                </button>
              </div>
            );
          }

          const { gene } = item;
          const copies = genotype[gene.id] ?? 0;

          const tooltipText = (() => {
            if (gene.type === 'recessive') return '1 copy = carrier (het) · 2 copies = visual';
            if (gene.type === 'dominant') return gene.lethalSuper
              ? '1 copy = visual · 2 copies = lethal'
              : '1 copy = visual · 2 copies = visually identical';
            // codominant
            const superLabel = gene.superName ?? `Super ${gene.name}`;
            return `1 copy = visual · 2 copies = ${superLabel}`;
          })();

          return (
            <div
              key={`gene:${gene.id}`}
              className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition-colors group"
            >
              <div className="flex flex-col min-w-0 mr-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-medium text-slate-200 truncate">{gene.name}</span>
                  {/* Gene type badge with hover tooltip */}
                  <span className="relative inline-flex items-center gap-1 shrink-0 group/badge">
                    <span className={`px-1.5 py-px rounded text-[10px] font-medium cursor-default ${geneTypeChip(gene.type, gene.lethalSuper)}`}>
                      {gene.lethalSuper ? 'Lethal' : gene.type === 'codominant' ? 'Codominant' : gene.type === 'dominant' ? 'Dominant' : 'Recessive'}
                    </span>
                    <span className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-slate-700 text-slate-400 cursor-default">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-2.5 h-2.5">
                        <path fillRule="evenodd" d="M15 8A7 7 0 1 1 1 8a7 7 0 0 1 14 0ZM9 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM6.75 8a.75.75 0 0 0 0 1.5h.75v1.75a.75.75 0 0 0 1.5 0v-2.5A.75.75 0 0 0 8.25 8h-1.5Z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <span className="pointer-events-none absolute left-0 top-full mt-1 z-50 w-max max-w-[220px] rounded-md bg-slate-800 border border-white/10 px-2 py-1 text-[11px] text-slate-300 shadow-lg opacity-0 group-hover/badge:opacity-100 transition-opacity">
                      {tooltipText}
                    </span>
                  </span>
                  {gene.riskNote && (
                    <span className="shrink-0 px-1.5 py-px rounded text-[10px] font-medium bg-orange-500/15 text-orange-300 border border-orange-500/20">
                      risky
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {/* Het / Vis / Sup buttons (exclude 0 = clear) */}
                {COPY_VALUES.filter(v => v !== 0).map(val => {
                  const { label, short } = copyOptionLabel(val, gene.type);
                  return (
                    <button
                      key={val}
                      onClick={() => setGene(gene.id, val)}
                      title={label}
                      className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                        copies === val
                          ? val === 1
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-white/[0.04] text-slate-600 hover:bg-white/10 hover:text-slate-400'
                      }`}
                    >
                      {short}
                    </button>
                  );
                })}
                {/* Clear button — always reserves space, only visible when gene is selected */}
                <button
                  onClick={() => setGene(gene.id, 0)}
                  title="Remove"
                  disabled={copies === 0}
                  className={`ml-1 px-1.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    copies > 0
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:text-red-300'
                      : 'invisible'
                  }`}
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
        {listItems.length === 0 && (
          <p className="text-sm text-slate-600 text-center py-6">No matches found.</p>
        )}
      </div>
    </div>
  );
}
