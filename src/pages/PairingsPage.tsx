import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { GenotypePreview } from '../components/GenotypePreview';
import { formatDate } from '../utils/formatDate';
import type { SavedPairing } from '../hooks/useSavedPairings';
import type { PlaygroundProject } from '../playground/types';

export function PairingsPage() {
  const { pairings, removePairing, updatePairingNotes, animals, saveProject } = useAppContext();
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');

  function handleDelete(id: string) {
    removePairing(id);
    setConfirmDelete(null);
  }

  function openNotesModal(pairing: SavedPairing) {
    setNotesDraft(pairing.notes ?? '');
    setEditingNotesId(pairing.id);
  }

  function saveNotes() {
    if (editingNotesId) {
      updatePairingNotes(editingNotesId, notesDraft);
    }
    setEditingNotesId(null);
  }

  function handleOpenPlayground(pairing: SavedPairing) {
    const rootNodeId = `${Date.now()}-root`;
    const project: PlaygroundProject = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: pairing.name,
      rootNodeId,
      nodes: {
        [rootNodeId]: {
          id: rootNodeId,
          parent1: pairing.parent1,
          parent1Name: animals.find(a => a.id === pairing.parent1AnimalId)?.name ?? 'Parent 1',
          parent2: pairing.parent2,
          parent2Name: animals.find(a => a.id === pairing.parent2AnimalId)?.name ?? 'Parent 2',
          childEdges: [],
        },
      },
      savedAt: new Date().toISOString(),
    };
    saveProject(project);
    navigate('/playground', { state: { project } });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white tracking-tight">Pairings</h1>
          <p className="text-xs text-slate-500 mt-0.5">Your saved breeding pairings</p>
        </div>
        <button
          onClick={() => navigate('/calculator')}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <span>+</span>
          <span>New Pairing</span>
        </button>
      </div>

      {/* Table / empty state */}
      {pairings.length === 0 ? (
        <div className="bg-[#161b27] rounded-2xl border border-white/5 p-12 flex flex-col items-center gap-3 text-center">
          <span className="text-4xl">⇄</span>
          <p className="text-sm text-slate-400">No pairings saved yet.</p>
          <p className="text-xs text-slate-600">Use the Calculator to build and save a pairing.</p>
          <button
            onClick={() => navigate('/calculator')}
            className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl transition-colors"
          >
            Go to Calculator
          </button>
        </div>
      ) : (
        <div className="bg-[#161b27] rounded-2xl border border-white/5 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide hidden sm:table-cell">Sire ♂</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide hidden sm:table-cell">Dam ♀</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide hidden md:table-cell">Saved</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {pairings.map(pairing => {
                const animal1 = animals.find(a => a.id === pairing.parent1AnimalId);
                const animal2 = animals.find(a => a.id === pairing.parent2AnimalId);
                return (
                  <tr key={pairing.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-200">{pairing.name}</span>
                      {pairing.notes && (
                        <p className="text-[11px] text-slate-500 mt-0.5 max-w-xs truncate">{pairing.notes}</p>
                      )}
                      <div className="sm:hidden mt-0.5 flex flex-col gap-0.5 text-xs text-slate-500">
                        <span>{animal1 ? animal1.name : <GenotypePreview genotype={pairing.parent1} />}</span>
                        <span>{animal2 ? animal2.name : <GenotypePreview genotype={pairing.parent2} />}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {animal1 ? (
                        <span className="text-xs text-indigo-300 font-medium">{animal1.name}</span>
                      ) : (
                        <GenotypePreview genotype={pairing.parent1} />
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {animal2 ? (
                        <span className="text-xs text-indigo-300 font-medium">{animal2.name}</span>
                      ) : (
                        <GenotypePreview genotype={pairing.parent2} />
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">
                      {formatDate(pairing.savedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => navigate('/calculator', { state: { loadPairing: pairing } })}
                          className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-lg text-xs font-medium transition-colors"
                          title="Load in Calculator"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => handleOpenPlayground(pairing)}
                          className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-medium transition-colors"
                          title="Open in Playground"
                        >
                          🌿
                        </button>
                        <button
                          onClick={() => openNotesModal(pairing)}
                          className={`px-2.5 py-1 border rounded-lg text-xs transition-colors ${
                            pairing.notes
                              ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20'
                              : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/5 text-slate-500 hover:text-slate-300'
                          }`}
                          title={pairing.notes ? 'Edit notes' : 'Add notes'}
                        >
                          📝
                        </button>
                        <button
                          onClick={() => setConfirmDelete(pairing.id)}
                          className="px-2.5 py-1 bg-white/[0.04] hover:bg-rose-500/15 border border-white/5 hover:border-rose-500/25 rounded-lg text-xs text-slate-600 hover:text-rose-400 transition-colors"
                          title="Delete"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Notes modal */}
      {editingNotesId !== null && (() => {
        const pairing = pairings.find(p => p.id === editingNotesId);
        return (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
            <div className="bg-[#1c2333] border border-white/10 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4 shadow-2xl">
              <div>
                <h3 className="text-sm font-semibold text-white">Notes</h3>
                <p className="text-xs text-slate-500 mt-0.5">{pairing?.name}</p>
              </div>
              <textarea
                value={notesDraft}
                onChange={e => setNotesDraft(e.target.value)}
                placeholder="Add notes about this pairing — dates, observations, offspring counts…"
                rows={5}
                autoFocus
                className="w-full px-3 py-2.5 bg-[#0d1117] border border-white/10 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-none leading-relaxed"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setEditingNotesId(null)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 rounded-lg text-sm transition-colors border border-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={saveNotes}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Save Notes
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Confirm delete */}
      {confirmDelete !== null && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
          <div className="bg-[#1c2333] border border-white/10 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4 shadow-2xl">
            <h3 className="text-sm font-semibold text-white">Delete Pairing?</h3>
            <p className="text-xs text-slate-400">
              This will permanently remove{' '}
              <span className="text-slate-200 font-medium">
                {pairings.find(p => p.id === confirmDelete)?.name}
              </span>{' '}
              from your saved pairings.
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
    </div>
  );
}
