import { Fragment, useMemo, useState } from 'react'
import {
  DiagramVennIcon,
  DiagramProjectIcon,
  NotebookIcon,
  PlusIcon,
  StarIcon,
  XmarkIcon,
  ArrowRightIcon,
  EyeSlashIcon,
  FloppyDiskIcon,
  TrashCanIcon,
  CircleXmarkIcon,
  MarsIcon,
  VenusIcon,
} from '../components/icons/index'
import { useNavigate } from 'react-router-dom'
import { formatProbability } from 'bp-genetics'
import { useAppContext } from '../context/AppContext'
import { GenotypePreview } from '../components/GenotypePreview'
import { formatDate } from '../utils/formatDate'
import type { SavedPairing } from '../hooks/useSavedPairings'
import { buildProjectFromPairing } from '../projects/utils/projectBuilders'

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

  function handleOpenProject(pairing: SavedPairing) {
    const project = buildProjectFromPairing(pairing, animals)
    saveProject(project)
    navigate('/projects', { state: { project } })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Pairings
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground/60">
            Your saved breeding pairings
          </p>
        </div>
        <button
          onClick={() => navigate('/calculator')}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-indigo-500"
        >
          <span>New Pairing</span>
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>

      {pairings.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-12 text-center">
          <DiagramVennIcon className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No pairings saved yet.</p>
          <p className="text-xs text-muted-foreground/40">
            Use the Calculator to build and save a pairing.
          </p>
          <button
            onClick={() => navigate('/calculator')}
            className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-indigo-500"
          >
            Go to Calculator
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground/60 uppercase">
                  Name
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground/60 uppercase sm:table-cell">
                  <span className="inline-flex items-center gap-1">Sire <MarsIcon className="h-3 w-3 text-sky-400/80" /></span>
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground/60 uppercase sm:table-cell">
                  <span className="inline-flex items-center gap-1">Dam <VenusIcon className="h-3 w-3 text-rose-400/80" /></span>
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground/60 uppercase md:table-cell">
                  Saved
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium tracking-wide text-muted-foreground/60 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pairings.map((pairing) => {
                const animal1 = animals.find((a) => a.id === pairing.parent1AnimalId)
                const animal2 = animals.find((a) => a.id === pairing.parent2AnimalId)
                const offspring = savedOffspringByPairing[pairing.id] ?? []
                const savedCount = offspring.length
                const expanded = expandedPairings.includes(pairing.id)

                return (
                  <Fragment key={pairing.id}>
                    <tr className="transition-colors hover:bg-muted/20">
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-foreground">
                            {pairing.name}
                          </span>
                          {savedCount > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                              <StarIcon className="h-3 w-3 fill-current" />
                              <span>{savedCount}</span>
                            </span>
                          )}
                        </div>
                        {pairing.notes && (
                          <p className="mt-0.5 max-w-xs truncate text-[11px] text-muted-foreground/60">
                            {pairing.notes}
                          </p>
                        )}
                        <div className="mt-0.5 flex flex-col gap-0.5 text-xs text-muted-foreground/60 sm:hidden">
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
                      <td className="hidden px-4 py-3 text-xs text-muted-foreground/60 md:table-cell">
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
                            className="inline-flex items-center gap-1 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-400 transition-colors hover:bg-indigo-500/20"
                            title="Load in Calculator"
                          >
                            Load
                            <ArrowRightIcon className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenProject(pairing)}
                            className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
                            title="Open in Projects"
                          >
                            <DiagramProjectIcon className="h-3.5 w-3.5" />
                          </button>
                          {savedCount > 0 && (
                            <button
                              onClick={() => toggleSavedOffspring(pairing.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/20"
                              title="Toggle saved offspring"
                            >
                              {expanded ? (
                                <>
                                  Hide saved
                                  <EyeSlashIcon className="h-3.5 w-3.5" />
                                </>
                              ) : (
                                <>
                                  Saved offspring
                                  <StarIcon className="h-3.5 w-3.5" />
                                </>
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => openNotesModal(pairing)}
                            className={`rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                              pairing.notes
                                ? 'border-amber-500/20 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                                : 'border-border bg-muted/40 text-muted-foreground/60 hover:bg-muted hover:text-foreground/80'
                            }`}
                            title={pairing.notes ? 'Edit notes' : 'Add notes'}
                          >
                            <NotebookIcon className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(pairing.id)}
                            className="rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground/40 transition-colors hover:border-rose-500/25 hover:bg-rose-500/15 hover:text-rose-400"
                            title="Delete"
                          >
                            <CircleXmarkIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="bg-card/50">
                        <td colSpan={5} className="px-4 py-3">
                          <div className="rounded-xl border border-border bg-background p-3">
                            <div className="mb-3 flex items-center justify-between gap-2">
                              <div>
                                <h3 className="text-xs font-semibold tracking-wide text-foreground/80 uppercase">
                                  Saved Offspring
                                </h3>
                                <p className="text-[11px] text-muted-foreground/40">
                                  {savedCount} saved for this pairing
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              {offspring.map((entry) => (
                                <div
                                  key={entry.id}
                                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2"
                                >
                                  <div className="min-w-0">
                                    <p className="truncate text-sm text-foreground">
                                      {entry.label}
                                    </p>
                                    <p className="text-xs text-muted-foreground/60">
                                      {formatProbability(entry.probability)}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => removeSavedOffspring(entry.id)}
                                    className="rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground/60 transition-colors hover:border-rose-500/25 hover:bg-rose-500/15 hover:text-rose-400"
                                    title="Delete saved offspring"
                                  >
                                    <CircleXmarkIcon className="h-3.5 w-3.5" />
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4">
              <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-border bg-popover p-6 shadow-2xl">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Notes</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground/60">
                      {pairing?.name}
                    </p>
                  </div>
                  <button
                    onClick={() => setEditingNotesId(null)}
                    className="text-muted-foreground/60 transition-colors hover:text-foreground"
                    aria-label="Close"
                  >
                    <XmarkIcon className="h-4 w-4" />
                  </button>
                </div>
                <textarea
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  placeholder="Add notes about this pairing — dates, observations, offspring counts…"
                  rows={5}
                  autoFocus
                  className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditingNotesId(null)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    Cancel
                    <XmarkIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={saveNotes}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-indigo-500"
                  >
                    Save Notes
                    <FloppyDiskIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )
        })()}

      {confirmDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4">
          <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-border bg-popover p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-foreground">
                Delete Pairing?
              </h3>
              <button
                onClick={() => setConfirmDelete(null)}
                className="text-muted-foreground/60 transition-colors hover:text-foreground"
                aria-label="Close"
              >
                <XmarkIcon className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              This will permanently remove{' '}
              <span className="font-medium text-foreground">
                {pairings.find((p) => p.id === confirmDelete)?.name}
              </span>{' '}
              from your saved pairings.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Cancel
                <XmarkIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-rose-500"
              >
                Delete
                <TrashCanIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
