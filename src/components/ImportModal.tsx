import { useRef, useState, useCallback } from 'react';
import { GENES } from 'bp-genetics';
import type { ParentGenotype } from 'bp-genetics';
import { importCSV } from '../utils/csvImport';
import type { ImportedAnimal } from '../utils/csvImport';

interface Props {
  open: boolean;
  onClose: () => void;
  onLoadParent?: (genotype: ParentGenotype, slot: 'parent1' | 'parent2') => void;
  onSaveAnimal: (name: string, genotype: ParentGenotype) => void;
}

// ─── Small helpers ─────────────────────────────────────────────────────────────

const SEX_LABEL: Record<string, string> = { M: '♂', F: '♀', Unknown: '?' };

function GeneChip({ geneId, copies }: { geneId: string; copies: 1 | 2 }) {
  const gene = GENES.find(g => g.id === geneId);
  const label = gene ? gene.name : geneId;
  const isRec = gene?.type === 'recessive';
  const isHet = copies === 1;

  const color = isHet
    ? isRec
      ? 'bg-violet-900/40 text-violet-300 border-violet-700/30'
      : 'bg-sky-900/40 text-sky-300 border-sky-700/30'
    : isRec
      ? 'bg-violet-700/50 text-violet-200 border-violet-500/40'
      : 'bg-sky-700/50 text-sky-200 border-sky-500/40';

  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] border ${color}`}>
      {label}
      {isHet && <span className="opacity-60 text-[9px]">het</span>}
    </span>
  );
}

function AnimalCard({
  animal,
  onLoad1,
  onLoad2,
  onSave,
}: {
  animal: ImportedAnimal;
  onLoad1?: () => void;
  onLoad2?: () => void;
  onSave: () => void;
}) {
  const activeGenes = Object.entries(animal.genotype).filter(([, c]) => c > 0);

  return (
    <div className="bg-[#1a2035] border border-white/5 rounded-xl p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">{animal.name}</span>
            <span className="text-xs text-slate-500">{SEX_LABEL[animal.sex]}</span>
            {animal.dob && (
              <span className="text-[10px] text-slate-600 font-mono">{animal.dob}</span>
            )}
          </div>
          <div className="text-[10px] text-slate-600 mt-0.5">{animal.sourceId}</div>
        </div>
      </div>

      {/* Raw traits */}
      <p className="text-[10px] text-slate-500 leading-relaxed">{animal.rawTraits}</p>

      {/* Gene chips */}
      {activeGenes.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {activeGenes.map(([id, copies]) => (
            <GeneChip key={id} geneId={id} copies={copies as 1 | 2} />
          ))}
        </div>
      )}

      {/* Unrecognized tokens */}
      {animal.unrecognized.length > 0 && (
        <div className="flex flex-wrap gap-1 items-center">
          <span className="text-[10px] text-amber-500/70">Unrecognized:</span>
          {animal.unrecognized.map((u, i) => (
            <span
              key={i}
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-amber-900/20 text-amber-400 border border-amber-700/20"
            >
              {u}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        {onLoad1 && (
          <button
            onClick={onLoad1}
            className="flex-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-xs text-slate-300 hover:text-white transition-colors"
          >
            → Sire
          </button>
        )}
        {onLoad2 && (
          <button
            onClick={onLoad2}
            className="flex-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-xs text-slate-300 hover:text-white transition-colors"
          >
            → Dam
          </button>
        )}
        <button
          onClick={onSave}
          className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/20 rounded-lg text-xs text-indigo-300 hover:text-indigo-200 transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
}

// ─── Main modal ────────────────────────────────────────────────────────────────

export function ImportModal({ open, onClose, onLoadParent, onSaveAnimal }: Props) {
  const [csv, setCsv] = useState('');
  const [animals, setAnimals] = useState<ImportedAnimal[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [formatLabel, setFormatLabel] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  const parse = useCallback((text: string) => {
    setCsv(text);
    if (!text.trim()) {
      setAnimals([]);
      setErrorMsg(null);
      setFormatLabel(null);
      return;
    }
    const result = importCSV(text);
    if ('error' in result) {
      setErrorMsg(result.error);
      setAnimals([]);
      setFormatLabel(null);
    } else {
      setErrorMsg(null);
      setAnimals(result.animals);
      setFormatLabel(
        result.format === 'cltch' ? 'CLTCH Export' : 'MorphMarket Export',
      );
    }
  }, []);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => parse(ev.target?.result as string ?? '');
    reader.readAsText(file);
    e.target.value = '';
  }

  function handleSave(animal: ImportedAnimal) {
    onSaveAnimal(animal.name, animal.genotype);
    setSavedIds(prev => new Set([...prev, animal.sourceId]));
  }

  function handleLoad(animal: ImportedAnimal, slot: 'parent1' | 'parent2') {
    onLoadParent?.(animal.genotype, slot);
    onClose();
  }

  function handleClose() {
    setCsv('');
    setAnimals([]);
    setErrorMsg(null);
    setFormatLabel(null);
    setSavedIds(new Set());
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4">
      <div className="bg-[#161b27] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-white">Import from CLTCH / MorphMarket</h2>
            {formatLabel && (
              <span className="text-[10px] text-emerald-400 mt-0.5 block">
                Detected: {formatLabel}
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-slate-500 hover:text-slate-200 transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Input area */}
        <div className="px-6 py-4 border-b border-white/5 flex-shrink-0 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Paste CSV or</span>
            <button
              onClick={() => fileRef.current?.click()}
              className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Upload file
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFile}
            />
          </div>
          <textarea
            value={csv}
            onChange={e => parse(e.target.value)}
            placeholder={`Paste CLTCH or MorphMarket CSV here…\n\nCLTCH format starts with: Animal_Id,Sex,Morphs,…\nMorphMarket format starts with: Category,Animal_ID,Title,Traits,…`}
            rows={4}
            className="w-full px-3 py-2 bg-[#0d1117] border border-white/10 rounded-lg text-xs text-slate-300 placeholder:text-slate-600 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-none"
          />
          {errorMsg && (
            <p className="text-xs text-red-400">{errorMsg}</p>
          )}
        </div>

        {/* Results */}
        <div className="overflow-y-auto flex-1 px-6 py-4 flex flex-col gap-3">
          {animals.length === 0 && !errorMsg && (
            <p className="text-xs text-slate-600 text-center py-8">
              Paste or upload a CSV to see animals here.
            </p>
          )}
          {animals.map(animal => (
            <AnimalCard
              key={animal.sourceId}
              animal={animal}
              onLoad1={onLoadParent ? () => handleLoad(animal, 'parent1') : undefined}
              onLoad2={onLoadParent ? () => handleLoad(animal, 'parent2') : undefined}
              onSave={() => handleSave(animal)}
            />
          ))}
        </div>

        {/* Footer */}
        {animals.length > 0 && (
          <div className="px-6 py-3 border-t border-white/5 flex-shrink-0 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {animals.length} animal{animals.length !== 1 ? 's' : ''} found
              {savedIds.size > 0 && ` · ${savedIds.size} saved`}
            </span>
            <button
              onClick={() => {
                animals.forEach(a => {
                  if (!savedIds.has(a.sourceId)) onSaveAnimal(a.name, a.genotype);
                });
                setSavedIds(new Set(animals.map(a => a.sourceId)));
              }}
              className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/20 rounded-lg text-xs text-indigo-300 hover:text-indigo-200 transition-colors"
            >
              Save all
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
