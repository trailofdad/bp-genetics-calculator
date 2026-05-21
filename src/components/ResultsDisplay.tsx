import { useMemo, useState } from 'react';
import type { OffspringOutcome } from 'bp-genetics';
import { formatProbability } from 'bp-genetics';
import { GENES, geneById } from 'bp-genetics';

interface Props {
  outcomes: OffspringOutcome[];
}

type SortKey = 'probability' | 'label';

const PROBABILITY_COLORS: { min: number; bg: string; bar: string }[] = [
  { min: 0.5,  bg: 'bg-emerald-50 border-emerald-200',  bar: 'bg-emerald-400' },
  { min: 0.25, bg: 'bg-blue-50 border-blue-200',         bar: 'bg-blue-400' },
  { min: 0.125,bg: 'bg-violet-50 border-violet-200',     bar: 'bg-violet-400' },
  { min: 0,    bg: 'bg-slate-50 border-slate-200',       bar: 'bg-slate-300' },
];

function getColors(prob: number) {
  return PROBABILITY_COLORS.find(c => prob >= c.min) ?? PROBABILITY_COLORS[PROBABILITY_COLORS.length - 1];
}

function GeneTag({ geneId, copies }: { geneId: string; copies: 0 | 1 | 2 }) {
  const gene = geneById(geneId);
  if (!gene || copies === 0) return null;
  const isVisual = copies === 2;
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
        isVisual
          ? 'bg-emerald-100 text-emerald-800'
          : 'bg-amber-100 text-amber-800'
      }`}
    >
      {isVisual
        ? gene.type === 'codominant'
          ? (gene.superName ?? `Super ${gene.name}`)
          : gene.name
        : `Het ${gene.name}`}
    </span>
  );
}

export function ResultsDisplay({ outcomes }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('probability');
  const [showLethal, setShowLethal] = useState(true);

  const totalGenes = useMemo(
    () => [...new Set(outcomes.flatMap(o => Object.keys(o.genotype)))],
    [outcomes]
  );

  const sorted = useMemo(() => {
    const list = showLethal ? outcomes : outcomes.filter(o => !o.hasLethal);
    if (sortKey === 'label') {
      return [...list].sort((a, b) => a.label.localeCompare(b.label));
    }
    return [...list].sort((a, b) => b.probability - a.probability);
  }, [outcomes, sortKey, showLethal]);

  const totalProb = sorted.reduce((s, o) => s + o.probability, 0);

  if (outcomes.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p className="text-4xl mb-3">🐍</p>
        <p className="text-sm">Add genes to both parents and click <strong>Calculate</strong></p>
      </div>
    );
  }

  const hasLethalOutcomes = outcomes.some(o => o.hasLethal);
  const uniqueCount = sorted.length;
  const normalOutcome = sorted.find(o => o.label === 'Normal');

  return (
    <div className="flex flex-col gap-4">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-800">{uniqueCount}</span> unique outcomes
          {normalOutcome && (
            <span className="text-slate-400">
              · {formatProbability(normalOutcome.probability)} normal
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {hasLethalOutcomes && (
            <label className="flex items-center gap-1.5 text-xs text-amber-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showLethal}
                onChange={e => setShowLethal(e.target.checked)}
                className="accent-amber-500"
              />
              Show lethal supers
            </label>
          )}
          <div className="flex gap-1">
            {(['probability', 'label'] as SortKey[]).map(k => (
              <button
                key={k}
                onClick={() => setSortKey(k)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  sortKey === k
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {k === 'probability' ? 'By %' : 'A–Z'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Outcome cards */}
      <div className="flex flex-col gap-2">
        {sorted.map((outcome, i) => {
          const { bg, bar } = getColors(outcome.probability);
          const pct = outcome.probability / totalProb;
          return (
            <div
              key={i}
              className={`relative rounded-xl border px-4 py-3 overflow-hidden ${bg} ${
                outcome.hasLethal ? 'opacity-60' : ''
              }`}
            >
              {/* Probability bar */}
              <div
                className={`absolute left-0 top-0 bottom-0 ${bar} opacity-20`}
                style={{ width: `${pct * 100}%` }}
              />
              <div className="relative flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1.5">
                  <p className="text-sm font-semibold text-slate-800 leading-snug">
                    {outcome.label}
                    {outcome.hasLethal && (
                      <span className="ml-2 text-xs text-amber-600 font-normal">⚠ lethal super</span>
                    )}
                  </p>
                  {totalGenes.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(outcome.genotype)
                        .filter(([, c]) => c > 0)
                        .map(([geneId, copies]) => (
                          <GeneTag key={geneId} geneId={geneId} copies={copies as 0 | 1 | 2} />
                        ))}
                      {Object.values(outcome.genotype).every(c => c === 0) && (
                        <span className="text-xs text-slate-400">No visible morphs</span>
                      )}
                    </div>
                  )}
                  {outcome.notes.length > 0 && (
                    <ul className="mt-0.5 flex flex-col gap-0.5">
                      {outcome.notes.map((note, ni) => (
                        <li key={ni} className="text-xs text-indigo-700 flex items-start gap-1">
                          <span className="mt-px shrink-0">ℹ</span>
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <span className="shrink-0 text-lg font-bold text-slate-700 tabular-nums">
                  {formatProbability(outcome.probability)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Gene key */}
      {totalGenes.length > 0 && (
        <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Gene Key</p>
          <div className="flex flex-wrap gap-2">
            {totalGenes.map(geneId => {
              const gene = GENES.find(g => g.id === geneId);
              if (!gene) return null;
              return (
                <span key={geneId} className="text-xs text-slate-600">
                  <span className="font-semibold">{gene.shortName}</span> = {gene.name}
                  {gene.type === 'codominant' && gene.superName && (
                    <span className="text-slate-400"> (super: {gene.superName})</span>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
