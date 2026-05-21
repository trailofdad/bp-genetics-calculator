import { useState } from 'react';
import { GENES } from 'bp-genetics';
import type { ParentGenotype } from 'bp-genetics';
import type { SavedPairing } from '../hooks/useSavedPairings';
import type { SavedAnimal } from '../hooks/useSavedAnimals';

interface Props {
  open: boolean;
  onClose: () => void;
  pairings: SavedPairing[];
  animals: SavedAnimal[];
  onLoad: (pairing: SavedPairing) => void;
  onLoadAnimal: (animal: SavedAnimal, slot: 'parent1' | 'parent2') => void;
  onDelete: (id: string) => void;
  onDeleteAnimal: (id: string) => void;
  onOpenPlayground: (pairing: SavedPairing) => void;
}

type TabId = 'pairings' | 'animals';

function GenotypePreview({ genotype }: { genotype: ParentGenotype }) {
  const active = Object.entries(genotype).filter(([, c]) => c > 0);
  if (active.length === 0) return <span className="text-slate-600 text-xs">Normal</span>;
  return (
    <span className="text-xs text-slate-400">
      {active
        .map(([id, copies]) => {
          const gene = GENES.find(g => g.id === id);
          const baseName = gene ? (gene.name.length > 8 ? gene.shortName : gene.name) : id;
          if (gene?.type === 'codominant') return baseName;
          return copies === 1 ? `het ${baseName}` : baseName;
        })
        .join(', ')}
    </span>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function SavedPairingsPanel({
  open, onClose, pairings, animals,
  onLoad, onLoadAnimal, onDelete, onDeleteAnimal, onOpenPlayground,
}: Props) {
  const [tab, setTab] = useState<TabId>('pairings');
  const totalCount = pairings.length + animals.length;

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/40 z-30 transition-opacity" onClick={onClose} />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-80 bg-[#161b27] border-l border-white/5 z-40 flex flex-col shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white tracking-tight">Saved</h2>
            {totalCount > 0 && (
              <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-medium px-1.5 py-px rounded-full">
                {totalCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-200 transition-colors text-lg leading-none"
            aria-label="Close panel"
          >
            ✕
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 px-4 pt-3 pb-1">
          {([
            { id: 'pairings' as TabId, label: '⇄ Pairings', count: pairings.length },
            { id: 'animals' as TabId, label: '🐍 Animals', count: animals.length },
          ]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                tab === t.id
                  ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/25'
                  : 'bg-white/[0.03] text-slate-500 border-white/5 hover:text-slate-300 hover:bg-white/[0.06]'
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`text-[10px] px-1 rounded-full ${tab === t.id ? 'bg-indigo-500/30 text-indigo-300' : 'bg-white/10 text-slate-500'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-2">

          {/* Pairings tab */}
          {tab === 'pairings' && (
            pairings.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-600 gap-2">
                <p className="text-2xl">⇄</p>
                <p className="text-xs">No saved pairings yet.<br />Use "Save Pairing" on the calculator.</p>
              </div>
            ) : (
              pairings.map(pairing => (
                <div key={pairing.id} className="bg-white/[0.03] border border-white/5 rounded-xl p-3 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-slate-200 leading-tight">{pairing.name}</span>
                    <button
                      onClick={() => onDelete(pairing.id)}
                      className="text-slate-600 hover:text-rose-400 transition-colors text-xs shrink-0 mt-0.5"
                      aria-label={`Delete ${pairing.name}`}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[10px] text-slate-600 w-14 shrink-0">Sire ♂</span>
                      <GenotypePreview genotype={pairing.parent1} />
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[10px] text-slate-600 w-14 shrink-0">Dam ♀</span>
                      <GenotypePreview genotype={pairing.parent2} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-600">{formatDate(pairing.savedAt)}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onOpenPlayground(pairing)}
                        className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-medium transition-colors"
                        title="Open in Playground"
                      >
                        🌿
                      </button>
                      <button
                        onClick={() => { onLoad(pairing); onClose(); }}
                        className="px-2.5 py-1 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/25 rounded-lg text-xs font-medium transition-colors"
                      >
                        Load
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )
          )}

          {/* Animals tab */}
          {tab === 'animals' && (
            animals.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-600 gap-2">
                <p className="text-2xl">🐍</p>
                <p className="text-xs">No saved animals yet.<br />Use "Save Animal" on a parent card.</p>
              </div>
            ) : (
              animals.map(animal => (
                <div key={animal.id} className="bg-white/[0.03] border border-white/5 rounded-xl p-3 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-slate-200 leading-tight">{animal.name}</span>
                    <button
                      onClick={() => onDeleteAnimal(animal.id)}
                      className="text-slate-600 hover:text-rose-400 transition-colors text-xs shrink-0 mt-0.5"
                      aria-label={`Delete ${animal.name}`}
                    >
                      ✕
                    </button>
                  </div>
                  <GenotypePreview genotype={animal.genotype} />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-600">{formatDate(animal.savedAt)}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => { onLoadAnimal(animal, 'parent1'); onClose(); }}
                        className="px-2 py-1 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/5 rounded-lg text-xs transition-colors"
                        title="Load as Sire"
                      >
                        → Sire
                      </button>
                      <button
                        onClick={() => { onLoadAnimal(animal, 'parent2'); onClose(); }}
                        className="px-2 py-1 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/5 rounded-lg text-xs transition-colors"
                        title="Load as Dam"
                      >
                        → Dam
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )
          )}

        </div>
      </div>
    </>
  );
}
