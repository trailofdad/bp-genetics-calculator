import { Fragment, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatProbability } from 'bp-genetics'
import { useAppContext } from '../context/AppContext'
import { GenotypePreview } from '../components/GenotypePreview'
import { formatDate } from '../utils/formatDate'
import type { SavedPairing } from '../hooks/useSavedPairings'
import type { PlaygroundProject } from '../playground/types'

export function PairingsPage() {
  const {
    pairings,
    removePairing,
    updatePairingNotes,
    animals,
    saveProject,
    savedOffspring,
    removeSavedOffspring,
  } = useAppContext()
  const navigate = useNavigate()
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null)
  const [notesDraft, setNotesDraft] = useState('')
  const [expandedPairings, setExpandedPairings] = useState<string[]>([])

  const savedOffspringByPairing = useMemo(() => {
    return savedOffspring.reduce<Record<string, typeof savedOffspring>>(
      (acc, entry) => {
        acc[entry.pairingId] = [...(acc[entry.pairingId] ?? []), entry]
        return acc
      },
      {}
    )
  }, [savedOffspring])

  function handleDelete(id: string) {
    removePairing(id)
    setConfirmDelete(null)
  }

  function openNotesModal(pairing: SavedPairing) {
    setNotesDraft(pairing.notes ?? '')
    setEditingNotesId(pairing.id)
  }

  function saveNotes() {
    if (editingNotesId) {
      updatePairingNotes(editingNotesId, notesDraft)
    }
    setEditingNotesId(null)
  }

  function toggleSavedOffspring(pairingId: string) {
    setExpandedPairings((prev) =>
      prev.includes(pairingId)
        ? prev.filter((id) => id !== pairingId)
        : [...prev, pairingId]
    )
  }

  function handleOpenPlayground(pairing: SavedPairing) {
    const rootNodeId = `${Date.now()}-root`
    const project: PlaygroundProject = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: pairing.name,
      rootNodeId,
      nodes: {
        [rootNodeId]: {
          id: rootNodeId,
          pairingId: pairing.id,
          parent1: pairing.parent1,
          parent1Name:
            animals.find((a) => a.id === pairing.parent1AnimalId)?.name ??
            'Parent 1',
          parent2: pairing.parent2,
          parent2Name:
            animals.find((a) => a.id === pairing.parent2AnimalId)?.name ??
            'Parent 2',
          childEdges: [],
        },
      },
      savedAt: new Date().toISOString(),
    }
    saveProject(project)
    navigate('/playground', { state: { project } })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-white">
            Pairings
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Your saved breeding pairings
          </p>
        </div>
        <button
          onClick={() => navigate('/calculator')}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
        >
          <span>+</span>
          <span>New Pairing</span>
        </button>
      </div>

      {pairings.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/5 bg-[#161b27] p-12 text-center">
          <span className="text-4xl">⇄</span>
          <p className="text-sm text-slate-400">No pairings saved yet.</p>
          <p className="text-xs text-slate-600">
            Use the Calculator to build and save a pairing.
          </p>
          <button
            onClick={() => navigate('/calculator')}
            className="mt-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-500"
          >
            Go to Calculator
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#161b27]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-slate-500 uppercase">
                  Name
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium tracking-wide text-slate-500 uppercase sm:table-cell">
                  Sire ♂
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium tracking-wide text-slate-500 uppercase sm:table-cell">
                  Dam ♀
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium tracking-wide text-slate-500 uppercase md:table-cell">
                  Saved
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium tracking-wide text-slate-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {pairings.map((pairing) => {
                const animal1 = animals.find((a) => a.id === pairing.parent1AnimalId)
                const animal2 = animals.find((a) => a.id === pairing.parent2AnimalId)
                const offspring = savedOffspringByPairing[pairing.id] ?? []
                const savedCount = offspring.length
                const expanded = expandedPairings.includes(pairing.id)

                return (
                  <Fragment key={pairing.id}>
                    <tr className="transition-colors hover:bg-white/2">
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-slate-200">
                            {pairing.name}
                          </span>
                          {savedCount > 0 && (
                            <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                              ★ {savedCount}
                            </span>
                          )}
                        </div>
                        {pairing.notes && (
                          <p className="mt-0.5 max-w-xs truncate text-[11px] text-slate-500">
                            {pairing.notes}
                          </p>
                        )}
                        <div className="mt-0.5 flex flex-col gap-0.5 text-xs text-slate-500 sm:hidden">
                          <span>
                            {animal1 ? (
                              animal1.name
                            ) : (
                              <GenotypePreview genotype={pairing.parent1} />
                            )}
                          </span>
                          <span>
                            {animal2 ? (
                              animal2.name
                            ) : (
                              <GenotypePreview genotype={pairing.parent2} />
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 sm:table-cell">
                        {animal1 ? (
                          <span className="text-xs font-medium text-indigo-300">
                            {animal1.name}
                          </span>
                        ) : (
                          <GenotypePreview genotype={pairing.parent1} />
                        )}
                      </td>
                      <td className="hidden px-4 py-3 sm:table-cell">
                        {animal2 ? (
                          <span className="text-xs font-medium text-indigo-300">
                            {animal2.name}
                          </span>
                        ) : (
                          <GenotypePreview genotype={pairing.parent2} />
                        )}
                      </td>
                      <td className="hidden px-4 py-3 text-xs text-slate-500 md:table-cell">
                        {formatDate(pairing.savedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          <button
                            onClick={() =>
                              navigate('/calculator', {
                                state: { loadPairing: pairing },
                              })
                            }
                            className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-400 transition-colors hover:bg-indigo-500/20"
                            title="Load in Calculator"
                          >
                            Load
                          </button>
                          <button
                            onClick={() => handleOpenPlayground(pairing)}
                            className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
                            title="Open in Playground"
                          >
                            🌿
                          </button>
                          {savedCount > 0 && (
                            <button
                              onClick={() => toggleSavedOffspring(pairing.id)}
                              className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/20"
                              title="Toggle saved offspring"
                            >
                              {expanded ? 'Hide saved' : 'Saved offspring'}
                            </button>
                          )}
                          <button
                            onClick={() => openNotesModal(pairing)}
                            className={`rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                              pairing.notes
                                ? 'border-amber-500/20 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                                : 'border-white/5 bg-white/4 text-slate-500 hover:bg-white/8 hover:text-slate-300'
                            }`}
                            title={pairing.notes ? 'Edit notes' : 'Add notes'}
                          >
                            📝
                          </button>
                          <button
                            onClick={() => setConfirmDelete(pairing.id)}
                            className="rounded-lg border border-white/5 bg-white/4 px-2.5 py-1 text-xs text-slate-600 transition-colors hover:border-rose-500/25 hover:bg-rose-500/15 hover:text-rose-400"
                            title="Delete"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="bg-[#121826]">
                        <td colSpan={5} className="px-4 py-3">
                          <div className="rounded-xl border border-white/5 bg-[#0d1117] p-3">
                            <div className="mb-3 flex items-center justify-between gap-2">
                              <div>
                                <h3 className="text-xs font-semibold tracking-wide text-slate-300 uppercase">
                                  Saved Offspring
                                </h3>
                                <p className="text-[11px] text-slate-600">
                                  {savedCount} saved for this pairing
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              {offspring.map((entry) => (
                                <div
                                  key={entry.id}
                                  className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/3 px-3 py-2"
                                >
                                  <div className="min-w-0">
                                    <p className="truncate text-sm text-slate-200">
                                      {entry.label}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {formatProbability(entry.probability)}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => removeSavedOffspring(entry.id)}
                                    className="rounded-lg border border-white/5 bg-white/4 px-2.5 py-1 text-xs text-slate-500 transition-colors hover:border-rose-500/25 hover:bg-rose-500/15 hover:text-rose-400"
                                    title="Delete saved offspring"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {editingNotesId !== null &&
        (() => {
          const pairing = pairings.find((p) => p.id === editingNotesId)
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
              <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-white/10 bg-[#1c2333] p-6 shadow-2xl">
                <div>
                  <h3 className="text-sm font-semibold text-white">Notes</h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {pairing?.name}
                  </p>
                </div>
                <textarea
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  placeholder="Add notes about this pairing — dates, observations, offspring counts…"
                  rows={5}
                  autoFocus
                  className="w-full resize-none rounded-xl border border-white/10 bg-[#0d1117] px-3 py-2.5 text-sm leading-relaxed text-slate-200 placeholder:text-slate-600 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditingNotesId(null)}
                    className="rounded-lg border border-white/5 bg-white/5 px-4 py-2 text-sm text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveNotes}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
                  >
                    Save Notes
                  </button>
                </div>
              </div>
            </div>
          )
        })()}

      {confirmDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-white/10 bg-[#1c2333] p-6 shadow-2xl">
            <h3 className="text-sm font-semibold text-white">
              Delete Pairing?
            </h3>
            <p className="text-xs text-slate-400">
              This will permanently remove{' '}
              <span className="font-medium text-slate-200">
                {pairings.find((p) => p.id === confirmDelete)?.name}
              </span>{' '}
              from your saved pairings.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="rounded-lg border border-white/5 bg-white/5 px-4 py-2 text-sm text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
