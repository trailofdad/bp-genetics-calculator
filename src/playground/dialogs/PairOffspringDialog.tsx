import { useState, useMemo } from 'react';
import type { OffspringOutcome, ParentGenotype } from 'bp-genetics';
import { GENES } from 'bp-genetics';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ParentSelector } from '../../components/ParentSelector';
import type { SavedPairing } from '../../hooks/useSavedPairings';
import type { SavedAnimal } from '../../hooks/useSavedAnimals';

interface Props {
  open: boolean;
  offspring: OffspringOutcome | null;
  savedPairings: SavedPairing[];
  savedAnimals: SavedAnimal[];
  onConfirm: (pairedWith: ParentGenotype, pairedWithName: string) => void;
  onClose: () => void;
}

type TabId = 'saved' | 'animals' | 'custom';

function genotypePreview(genotype: ParentGenotype): string {
  const parts = Object.entries(genotype)
    .filter(([, c]) => c > 0)
    .map(([id, copies]) => {
      const gene = GENES.find(g => g.id === id);
      if (!gene) return id;
      const label = gene.name.length > 8 ? gene.shortName : gene.name;
      return copies === 1 ? `Het ${label}` : label;
    });
  return parts.length ? parts.join(', ') : 'Normal';
}

export function PairOffspringDialog({ open, offspring, savedPairings, savedAnimals, onConfirm, onClose }: Props) {
  // Default tab: animals if any, else saved pairings if any, else custom
  const defaultTab: TabId =
    savedAnimals.length > 0 ? 'animals' :
    savedPairings.length > 0 ? 'saved' : 'custom';

  const [tab, setTab] = useState<TabId>(defaultTab);
  const [selectedPairingId, setSelectedPairingId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<'parent1' | 'parent2'>('parent2');
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);
  const [customGenotype, setCustomGenotype] = useState<ParentGenotype>({});
  const [customName, setCustomName] = useState('');

  const selectedPairing = useMemo(
    () => savedPairings.find(p => p.id === selectedPairingId) ?? null,
    [savedPairings, selectedPairingId],
  );

  const selectedAnimal = useMemo(
    () => savedAnimals.find(a => a.id === selectedAnimalId) ?? null,
    [savedAnimals, selectedAnimalId],
  );

  function handleConfirm() {
    if (!offspring) return;
    if (tab === 'saved' && selectedPairing) {
      const mate = selectedSlot === 'parent1' ? selectedPairing.parent1 : selectedPairing.parent2;
      const mateName = `${selectedPairing.name} (${selectedSlot === 'parent1' ? 'Sire' : 'Dam'})`;
      onConfirm(mate, mateName);
    } else if (tab === 'animals' && selectedAnimal) {
      onConfirm(selectedAnimal.genotype, selectedAnimal.name);
    } else if (tab === 'custom') {
      const name = customName.trim() || genotypePreview(customGenotype) || 'Unknown';
      onConfirm(customGenotype, name);
    }
  }

  const canConfirm =
    tab === 'saved' ? !!selectedPairing :
    tab === 'animals' ? !!selectedAnimal :
    true;

  const tabs: { id: TabId; label: string }[] = [
    ...(savedAnimals.length > 0 ? [{ id: 'animals' as TabId, label: '🐍 Saved Animals' }] : []),
    ...(savedPairings.length > 0 ? [{ id: 'saved' as TabId, label: '⇄ Saved Pairings' }] : []),
    { id: 'custom', label: '✎ Custom' },
  ];

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent
        showCloseButton={false}
        className="bg-[#1c2333] border border-white/10 ring-0 text-slate-200 max-w-md p-0 gap-0 overflow-hidden"
      >
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle className="text-sm font-semibold text-white leading-snug">
            Pair offspring
            <span className="ml-1.5 text-indigo-300 font-normal">"{offspring?.label}"</span>
          </DialogTitle>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Choose a mate to branch the breeding tree.
          </p>
        </DialogHeader>

        {/* Tab bar */}
        <div className="flex gap-1 px-5 pt-4">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                tab === t.id
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                  : 'bg-white/[0.03] text-slate-500 border-white/5 hover:bg-white/[0.06] hover:text-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="px-5 pt-3 pb-5 flex flex-col gap-3">

          {/* Saved Animals */}
          {tab === 'animals' && (
            <ScrollArea className="h-52">
              <div className="flex flex-col gap-1.5 pr-2">
                {savedAnimals.map(a => (
                  <button
                    key={a.id}
                    onClick={() => setSelectedAnimalId(a.id)}
                    className={`text-left rounded-xl px-3 py-2.5 border transition-colors ${
                      selectedAnimalId === a.id
                        ? 'bg-indigo-500/15 border-indigo-500/40'
                        : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06]'
                    }`}
                  >
                    <p className="text-xs font-medium text-slate-200">{a.name}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{genotypePreview(a.genotype)}</p>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Saved Pairings */}
          {tab === 'saved' && (
            <>
              <ScrollArea className="h-40">
                <div className="flex flex-col gap-1.5 pr-2">
                  {savedPairings.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPairingId(p.id)}
                      className={`text-left rounded-xl px-3 py-2.5 border transition-colors ${
                        selectedPairingId === p.id
                          ? 'bg-indigo-500/15 border-indigo-500/40'
                          : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06]'
                      }`}
                    >
                      <p className="text-xs font-medium text-slate-200">{p.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        P1: {genotypePreview(p.parent1)} · P2: {genotypePreview(p.parent2)}
                      </p>
                    </button>
                  ))}
                </div>
              </ScrollArea>

              {selectedPairing && (
                <div className="p-3 bg-white/[0.03] rounded-xl border border-white/5">
                  <p className="text-[10px] text-slate-500 mb-2">
                    Which parent from <span className="text-slate-300">{selectedPairing.name}</span>?
                  </p>
                  <div className="flex gap-2">
                    {(['parent1', 'parent2'] as const).map(slot => (
                      <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`flex-1 rounded-lg px-2 py-2 text-[11px] border transition-colors text-left ${
                          selectedSlot === slot
                            ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        <span className="font-semibold block">{slot === 'parent1' ? '♂ Sire' : '♀ Dam'}</span>
                        <span className="text-[10px] opacity-70 block mt-0.5 truncate">
                          {genotypePreview(selectedPairing[slot])}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Custom */}
          {tab === 'custom' && (
            <>
              <input
                type="text"
                placeholder="Animal name (optional)…"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-colors"
              />
              <ScrollArea className="h-44">
                <div className="pr-2">
                  <ParentSelector
                    parentLabel="Mate"
                    parentSex="♂/♀"
                    genotype={customGenotype}
                    onChange={setCustomGenotype}
                  />
                </div>
              </ScrollArea>
            </>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 bg-white/5 hover:bg-white/10 border border-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!canConfirm}
              className="px-4 py-2 rounded-xl text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 border border-transparent transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              Add Branch
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

