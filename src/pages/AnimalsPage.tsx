import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { ParentSelector } from '../components/ParentSelector';
import { ImportModal } from '../components/ImportModal';
import { GenotypePreview } from '../components/GenotypePreview';
import { formatDate } from '../utils/formatDate';
import type { SavedAnimal } from '../hooks/useSavedAnimals';
import type { ParentGenotype } from 'bp-genetics';

interface AnimalModalState {
  mode: 'add' | 'edit';
  animal?: SavedAnimal;
  name: string;
  genotype: ParentGenotype;
}

export function AnimalsPage() {
  const { animals, saveAnimal, updateAnimal, removeAnimal } = useAppContext();
  const navigate = useNavigate();
  const [modal, setModal] = useState<AnimalModalState | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (modal !== null) {
      setTimeout(() => nameInputRef.current?.focus(), 50);
    }
  }, [modal]);

  function openAdd() {
    setModal({ mode: 'add', name: '', genotype: {} });
  }

  function openEdit(animal: SavedAnimal) {
    setModal({ mode: 'edit', animal, name: animal.name, genotype: { ...animal.genotype } });
  }

  function handleSave() {
    if (!modal) return;
    if (modal.mode === 'add') {
      saveAnimal(modal.name, modal.genotype);
    } else if (modal.animal) {
      updateAnimal(modal.animal.id, modal.name, modal.genotype);
    }
    setModal(null);
  }

  function handleDelete(id: string) {
    removeAnimal(id);
    setConfirmDelete(null);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white tracking-tight">Animals</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage your saved ball pythons</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <span>📥</span>
            <span>Import</span>
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <span>+</span>
            <span>Add Animal</span>
          </button>
        </div>
      </div>

      {/* Table / empty state */}
      {animals.length === 0 ? (
        <div className="bg-[#161b27] rounded-2xl border border-white/5 p-12 flex flex-col items-center gap-3 text-center">
          <span className="text-4xl">🐍</span>
          <p className="text-sm text-slate-400">No animals saved yet.</p>
          <p className="text-xs text-slate-600">Add your first snake to track its genetics.</p>
          <button
            onClick={openAdd}
            className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl transition-colors"
          >
            Add Animal
          </button>
        </div>
      ) : (
        <div className="bg-[#161b27] rounded-2xl border border-white/5 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide hidden sm:table-cell">Genetics</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide hidden md:table-cell">Saved</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {animals.map(animal => (
                <tr key={animal.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-200">{animal.name}</span>
                    <div className="sm:hidden mt-0.5">
                      <GenotypePreview genotype={animal.genotype} />
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <GenotypePreview genotype={animal.genotype} />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">
                    {formatDate(animal.savedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 justify-end">
                      <button
                        onClick={() => navigate('/calculator', { state: { loadAnimal: animal, slot: 'parent1' } })}
                        className="px-2.5 py-1 bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 rounded-lg text-xs text-slate-400 hover:text-slate-200 transition-colors"
                        title="Load as Sire in Calculator"
                      >
                        → Sire
                      </button>
                      <button
                        onClick={() => navigate('/calculator', { state: { loadAnimal: animal, slot: 'parent2' } })}
                        className="px-2.5 py-1 bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 rounded-lg text-xs text-slate-400 hover:text-slate-200 transition-colors"
                        title="Load as Dam in Calculator"
                      >
                        → Dam
                      </button>
                      <button
                        onClick={() => openEdit(animal)}
                        className="px-2.5 py-1 bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 rounded-lg text-xs text-slate-400 hover:text-slate-200 transition-colors"
                        title="Edit"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => setConfirmDelete(animal.id)}
                        className="px-2.5 py-1 bg-white/[0.04] hover:bg-rose-500/15 border border-white/5 hover:border-rose-500/25 rounded-lg text-xs text-slate-600 hover:text-rose-400 transition-colors"
                        title="Delete"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit modal */}
      {modal !== null && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center px-4 py-10 overflow-y-auto">
          <div className="bg-[#1c2333] border border-white/10 rounded-2xl w-full max-w-xl flex flex-col gap-5 shadow-2xl my-auto">
            <div className="px-6 pt-6 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                {modal.mode === 'add' ? 'Add Animal' : 'Edit Animal'}
              </h3>
              <button
                onClick={() => setModal(null)}
                className="text-slate-500 hover:text-slate-200 transition-colors text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="px-6 flex flex-col gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-slate-400">Nickname</span>
                <input
                  ref={nameInputRef}
                  type="text"
                  placeholder="e.g. Suki, Ghost, Big Boy…"
                  value={modal.name}
                  onChange={e => setModal(m => m && { ...m, name: e.target.value })}
                  onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setModal(null); }}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-colors"
                />
              </label>
            </div>

            <div className="px-6">
              <p className="text-xs font-medium text-slate-400 mb-2">Genetics</p>
              <div className="bg-[#161b27] rounded-xl border border-white/5 p-4">
                <ParentSelector
                  parentLabel="Edit Animal Genetics"
                  parentSex=""
                  genotype={modal.genotype}
                  onChange={g => setModal(m => m && { ...m, genotype: g })}
                />
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-2 justify-end">
              <button
                onClick={() => setModal(null)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 rounded-lg text-sm transition-colors border border-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {modal.mode === 'add' ? 'Add Animal' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete dialog */}
      {confirmDelete !== null && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
          <div className="bg-[#1c2333] border border-white/10 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4 shadow-2xl">
            <h3 className="text-sm font-semibold text-white">Delete Animal?</h3>
            <p className="text-xs text-slate-400">
              This will permanently remove{' '}
              <span className="text-slate-200 font-medium">
                {animals.find(a => a.id === confirmDelete)?.name}
              </span>{' '}
              from your saved animals.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 rounded-lg text-sm transition-colors border border-white/5"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import modal */}
      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSaveAnimal={saveAnimal}
      />
    </div>
  );
}
