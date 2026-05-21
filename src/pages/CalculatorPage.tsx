import { useMemo, useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ParentSelector } from '../components/ParentSelector';
import { ResultsDisplay } from '../components/ResultsDisplay';
import { GenotypePreview } from '../components/GenotypePreview';
import { useAppContext } from '../context/AppContext';
import type { ParentGenotype } from 'bp-genetics';
import { calculateOffspring } from 'bp-genetics';
import type { SavedAnimal } from '../hooks/useSavedAnimals';
import type { SavedPairing } from '../hooks/useSavedPairings';

type LocationState = {
  loadAnimal?: SavedAnimal;
  slot?: 'parent1' | 'parent2';
  loadPairing?: Pick<SavedPairing, 'parent1' | 'parent2' | 'parent1AnimalId' | 'parent2AnimalId'>;
} | null;

function initFromState(state: LocationState) {
  const parent1: ParentGenotype = state?.loadPairing?.parent1 ?? (state?.loadAnimal && state?.slot === 'parent1' ? state.loadAnimal.genotype : {});
  const parent2: ParentGenotype = state?.loadPairing?.parent2 ?? (state?.loadAnimal && state?.slot === 'parent2' ? state.loadAnimal.genotype : {});
  const parent1AnimalId = state?.loadPairing?.parent1AnimalId ?? (state?.slot === 'parent1' ? state?.loadAnimal?.id : undefined);
  const parent2AnimalId = state?.loadPairing?.parent2AnimalId ?? (state?.slot === 'parent2' ? state?.loadAnimal?.id : undefined);
  return { parent1, parent2, parent1AnimalId, parent2AnimalId };
}

export function CalculatorPage() {
  const { animals, saveAnimal, savePairing } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();

  const locationState = location.state as LocationState;
  const init = initFromState(locationState);

  const [parent1, setParent1] = useState<ParentGenotype>(init.parent1);
  const [parent2, setParent2] = useState<ParentGenotype>(init.parent2);
  const [parent1AnimalId, setParent1AnimalId] = useState<string | undefined>(init.parent1AnimalId);
  const [parent2AnimalId, setParent2AnimalId] = useState<string | undefined>(init.parent2AnimalId);

  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const saveInputRef = useRef<HTMLInputElement>(null);



  // "Save animal" modal
  const [saveAnimalModal, setSaveAnimalModal] = useState<{
    genotype: ParentGenotype;
    name: string;
  } | null>(null);
  const saveAnimalInputRef = useRef<HTMLInputElement>(null);

  // "Load animal" picker
  const [loadAnimalPicker, setLoadAnimalPicker] = useState<'parent1' | 'parent2' | null>(null);

  // Clear location state so a refresh doesn't re-apply it
  useEffect(() => {
    if (locationState) {
      navigate(location.pathname, { replace: true, state: null });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (saveModalOpen) {
      setTimeout(() => saveInputRef.current?.focus(), 50);
    }
  }, [saveModalOpen]);

  useEffect(() => {
    if (saveAnimalModal !== null) {
      setTimeout(() => saveAnimalInputRef.current?.focus(), 50);
    }
  }, [saveAnimalModal]);

  const outcomes = useMemo(() => calculateOffspring(parent1, parent2), [parent1, parent2]);
  const hasGenes = Object.values(parent1).some(c => c > 0) || Object.values(parent2).some(c => c > 0);

  function handleReset() {
    setParent1({});
    setParent2({});
    setParent1AnimalId(undefined);
    setParent2AnimalId(undefined);
  }

  function handleSaveConfirm() {
    savePairing(saveName, parent1, parent2, parent1AnimalId, parent2AnimalId);
    setSaveModalOpen(false);
  }

  function handleSaveAnimalConfirm() {
    if (!saveAnimalModal) return;
    saveAnimal(saveAnimalModal.name, saveAnimalModal.genotype);
    setSaveAnimalModal(null);
  }

  function handleLoadAnimal(animal: SavedAnimal, slot: 'parent1' | 'parent2') {
    if (slot === 'parent1') {
      setParent1(animal.genotype);
      setParent1AnimalId(animal.id);
    } else {
      setParent2(animal.genotype);
      setParent2AnimalId(animal.id);
    }
    setLoadAnimalPicker(null);
  }

  const parentConfigs = [
    { label: 'Sire', sex: '♂', genotype: parent1, onChange: (g: ParentGenotype) => { setParent1(g); setParent1AnimalId(undefined); }, animalId: parent1AnimalId, slot: 'parent1' as const },
    { label: 'Dam', sex: '♀', genotype: parent2, onChange: (g: ParentGenotype) => { setParent2(g); setParent2AnimalId(undefined); }, animalId: parent2AnimalId, slot: 'parent2' as const },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Parents grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {parentConfigs.map(({ label, sex, genotype, onChange, animalId, slot }) => {
          const linkedAnimal = animals.find(a => a.id === animalId);
          const hasGenesForParent = Object.values(genotype).some(c => c > 0);
          return (
            <div key={label} className="bg-[#161b27] rounded-2xl border border-white/5 p-5 flex flex-col gap-3">
              {/* Linked animal badge */}
              {linkedAnimal && (
                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                  <span className="text-xs text-indigo-300 font-medium">🐍 {linkedAnimal.name}</span>
                  <button
                    onClick={() => { onChange({}); }}
                    className="ml-auto text-indigo-400/60 hover:text-indigo-300 text-xs transition-colors"
                    title="Unlink animal"
                  >
                    ✕
                  </button>
                </div>
              )}

              <ParentSelector
                parentLabel={label}
                parentSex={sex}
                genotype={genotype}
                onChange={onChange}
                headerAction={
                  animals.length > 0 ? (
                    <button
                      onClick={() => setLoadAnimalPicker(slot)}
                      className="flex items-center gap-1 px-2 py-1 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-lg text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      <span>📂</span>
                      <span>Load</span>
                    </button>
                  ) : undefined
                }
              />

              <div className="flex items-center gap-2 justify-end">
                {hasGenesForParent && (
                  <button
                    onClick={() => setSaveAnimalModal({ genotype, name: '' })}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-lg text-xs text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <span>🐍</span>
                    <span>Save Animal</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      {hasGenes && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => { setSaveName(''); setSaveModalOpen(true); }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors text-sm tracking-tight"
          >
            Save Pairing
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 font-medium rounded-xl transition-colors text-sm border border-white/5"
          >
            Reset
          </button>
        </div>
      )}

      {/* Results */}
      <div className="bg-[#161b27] rounded-2xl border border-white/5 p-5 min-h-40">
        <h2 className="text-sm font-semibold text-slate-300 mb-4 tracking-tight">Offspring Outcomes</h2>
        <ResultsDisplay outcomes={outcomes} />
      </div>

      <p className="text-center text-xs text-slate-600 pb-4">
        Results assume independent gene assortment. Cross-gene interactions (BEL complex, neurological
        notes) are surfaced inline. For breeding decisions, consult a specialist.
      </p>

      {/* Save Pairing modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
          <div className="bg-[#1c2333] border border-white/10 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4 shadow-2xl">
            <h3 className="text-sm font-semibold text-white">Save Pairing</h3>
            <input
              ref={saveInputRef}
              type="text"
              placeholder="Pairing name…"
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSaveConfirm(); if (e.key === 'Escape') setSaveModalOpen(false); }}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-colors"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setSaveModalOpen(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 rounded-lg text-sm transition-colors border border-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConfirm}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Animal modal */}
      {saveAnimalModal !== null && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
          <div className="bg-[#1c2333] border border-white/10 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4 shadow-2xl">
            <div>
              <h3 className="text-sm font-semibold text-white">Save Animal</h3>
              <p className="text-xs text-slate-500 mt-1">Give this animal a name to find it easily later.</p>
            </div>
            <input
              ref={saveAnimalInputRef}
              type="text"
              placeholder="Animal name…"
              value={saveAnimalModal.name}
              onChange={e => setSaveAnimalModal(m => m && { ...m, name: e.target.value })}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSaveAnimalConfirm();
                if (e.key === 'Escape') setSaveAnimalModal(null);
              }}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-colors"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setSaveAnimalModal(null)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 rounded-lg text-sm transition-colors border border-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAnimalConfirm}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Animal picker */}
      {loadAnimalPicker !== null && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
          <div className="bg-[#1c2333] border border-white/10 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                Load Animal as {loadAnimalPicker === 'parent1' ? 'Sire' : 'Dam'}
              </h3>
              <button
                onClick={() => setLoadAnimalPicker(null)}
                className="text-slate-500 hover:text-slate-200 transition-colors text-lg leading-none"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
              {animals.map(animal => (
                <button
                  key={animal.id}
                  onClick={() => handleLoadAnimal(animal, loadAnimalPicker)}
                  className="flex items-center gap-3 px-3 py-2.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-indigo-500/25 rounded-xl text-left transition-colors"
                >
                  <span className="text-lg">🐍</span>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-medium text-slate-200 truncate">{animal.name}</span>
                    <GenotypePreview genotype={animal.genotype} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
