import { useState, useRef, useEffect } from 'react'
import {
  PencilIcon,
  PlusIcon,
  ArrowDownToBracketIcon,
  XmarkIcon,
  FloppyDiskIcon,
  TrashCanIcon,
  CircleXmarkIcon,
  FaSnakeIcon,
  MarsIcon,
  VenusIcon,
  CopyIcon,
} from '../components/icons/index'
import { geneById } from 'bp-genetics'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { ParentSelector } from '../components/ParentSelector'
import { ImportModal } from '../components/ImportModal'
import { GenotypePreview } from '../components/GenotypePreview'
import { formatDate } from '../utils/formatDate'
import type { SavedAnimal, AnimalSex } from '../hooks/useSavedAnimals'
import type { ParentGenotype } from 'bp-genetics'

interface AnimalModalState {
  mode: 'add' | 'edit'
  animal?: SavedAnimal
  name: string
  sex?: AnimalSex
  genotype: ParentGenotype
  birthYear?: number
  idPrefix: string
  generatedId: string | null
}

function generateAnimalId(
  genotype: ParentGenotype,
  sex: AnimalSex | undefined,
  birthYear: number | undefined,
  prefix: string
): string {
  const parts: string[] = []

  const cleanPrefix = prefix.trim().toUpperCase().replace(/[^A-Z0-9\-\/._]/g, '')
  if (cleanPrefix) parts.push(cleanPrefix)

  let yearSex = ''
  if (birthYear) yearSex += String(birthYear).slice(-2)
  if (sex === 'male') yearSex += 'M'
  else if (sex === 'female') yearSex += 'F'
  if (yearSex) parts.push(yearSex)

  const geneAbbrevs = Object.entries(genotype)
    .filter(([, copies]) => copies > 0)
    .map(([geneId]) => (geneById(geneId)?.shortName ?? geneId).toUpperCase())
    .sort()
  parts.push(...geneAbbrevs)

  return parts.join('-')
}

export function AnimalsPage() {
  const { animals, saveAnimal, updateAnimal, removeAnimal } = useAppContext()
  const navigate = useNavigate()
  const location = useLocation()
  const [modal, setModal] = useState<AnimalModalState | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [importOpen, setImportOpen] = useState(
    !!(location.state as { openImport?: boolean } | null)?.openImport
  )
  const [copied, setCopied] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if ((location.state as { openImport?: boolean } | null)?.openImport) {
      navigate(location.pathname, { replace: true, state: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (modal !== null) {
      setTimeout(() => nameInputRef.current?.focus(), 50)
    }
  }, [modal])

  function openAdd() {
    setModal({ mode: 'add', name: '', sex: undefined, genotype: {}, idPrefix: '', generatedId: null })
  }

  function openEdit(animal: SavedAnimal) {
    setModal({
      mode: 'edit',
      animal,
      name: animal.name,
      sex: animal.sex,
      genotype: { ...animal.genotype },
      birthYear: animal.birthYear,
      idPrefix: '',
      generatedId: null,
    })
  }

  function handleSave() {
    if (!modal) return
    if (modal.mode === 'add') {
      saveAnimal(modal.name, modal.genotype, modal.sex, modal.birthYear)
    } else if (modal.animal) {
      updateAnimal(modal.animal.id, modal.name, modal.genotype, modal.sex, modal.birthYear)
    }
    setModal(null)
  }

  function handleDelete(id: string) {
    removeAnimal(id)
    setConfirmDelete(null)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Animals
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground/60">
            Manage your saved ball pythons
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <span>Import</span>
            <ArrowDownToBracketIcon className="h-4 w-4" />
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
          >
            <span>Add Animal</span>
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Table / empty state */}
      {animals.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-12 text-center">
          <FaSnakeIcon className="h-8 w-8 text-muted-foreground" variant="thin" />
          <p className="text-sm text-muted-foreground">No animals saved yet.</p>
          <p className="text-xs text-muted-foreground/40">
            Add your first snake to track its genetics.
          </p>
          <button
            onClick={openAdd}
            className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-500"
          >
            Add Animal
            <PlusIcon className="h-3.5 w-3.5" />
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
                  Genetics
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
              {animals.map((animal) => (
                <tr
                  key={animal.id}
                  className="transition-colors hover:bg-muted/20"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-foreground">
                        {animal.name}
                      </span>
                      {animal.sex === 'male' && (
                        <MarsIcon className="h-3.5 w-3.5 text-sky-400" />
                      )}
                      {animal.sex === 'female' && (
                        <VenusIcon className="h-3.5 w-3.5 text-rose-400" />
                      )}
                    </div>
                    <div className="mt-0.5 sm:hidden">
                      <GenotypePreview genotype={animal.genotype} />
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <GenotypePreview genotype={animal.genotype} />
                  </td>
                  <td className="hidden px-4 py-3 text-xs text-muted-foreground/60 md:table-cell">
                    {formatDate(animal.savedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {(!animal.sex || animal.sex === 'male') && (
                        <button
                          onClick={() =>
                            navigate('/calculator', {
                              state: { loadAnimal: animal, slot: 'parent1' },
                            })
                          }
                          className="rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          title="Load as Sire in Calculator"
                        >
                          <span className="inline-flex items-center gap-1">
                            <span>Sire</span>
                            <ArrowDownToBracketIcon className="h-3.5 w-3.5" />
                          </span>
                        </button>
                      )}
                      {(!animal.sex || animal.sex === 'female') && (
                        <button
                          onClick={() =>
                            navigate('/calculator', {
                              state: { loadAnimal: animal, slot: 'parent2' },
                            })
                          }
                          className="rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          title="Load as Dam in Calculator"
                        >
                          <span className="inline-flex items-center gap-1">
                            <span>Dam</span>
                            <ArrowDownToBracketIcon className="h-3.5 w-3.5" />
                          </span>
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(animal)}
                        className="rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        title="Edit"
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(animal.id)}
                        className="rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground/40 transition-colors hover:border-rose-500/25 hover:bg-rose-500/15 hover:text-rose-400"
                        title="Delete"
                      >
                        <CircleXmarkIcon className="h-3.5 w-3.5" />
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
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/80 px-4 py-10">
          <div className="my-auto flex w-full max-w-xl flex-col gap-5 rounded-2xl border border-border bg-popover shadow-2xl">
            <div className="flex items-center justify-between px-6 pt-6">
              <h3 className="text-sm font-semibold text-foreground">
                {modal.mode === 'add' ? 'Add Animal' : 'Edit Animal'}
              </h3>
              <button
                onClick={() => setModal(null)}
                className="text-muted-foreground/60 transition-colors hover:text-foreground"
                aria-label="Close"
              >
                <XmarkIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 px-6">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Nickname
                </span>
                <input
                  ref={nameInputRef}
                  type="text"
                  placeholder="e.g. Suki, Ghost, Big Boy…"
                  value={modal.name}
                  onChange={(e) =>
                    setModal((m) => m && { ...m, name: e.target.value })
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave()
                    if (e.key === 'Escape') setModal(null)
                  }}
                  className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground transition-colors placeholder:text-muted-foreground/40 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none"
                />
              </label>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Sex
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setModal((m) =>
                        m && { ...m, sex: m.sex === 'male' ? undefined : 'male' }
                      )
                    }
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                      modal.sex === 'male'
                        ? 'border-sky-500/40 bg-sky-500/15 text-sky-300'
                        : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    Male
                    <MarsIcon className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setModal((m) =>
                        m && { ...m, sex: m.sex === 'female' ? undefined : 'female' }
                      )
                    }
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                      modal.sex === 'female'
                        ? 'border-rose-500/40 bg-rose-500/15 text-rose-300'
                        : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    Female
                    <VenusIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Birth Year
                </span>
                <input
                  type="number"
                  placeholder="e.g. 2024"
                  min={1990}
                  max={new Date().getFullYear() + 1}
                  value={modal.birthYear ?? ''}
                  onChange={(e) => {
                    const val = e.target.value ? parseInt(e.target.value, 10) : undefined
                    setModal((m) => m && { ...m, birthYear: val })
                  }}
                  className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground transition-colors placeholder:text-muted-foreground/40 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none"
                />
              </label>
            </div>

            <div className="px-6">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Genetics
              </p>
              <div className="rounded-xl border border-border bg-card p-4">
                <ParentSelector
                  parentLabel="Edit Animal Genetics"
                  genotype={modal.genotype}
                  onChange={(g) => setModal((m) => m && { ...m, genotype: g })}
                />
              </div>
            </div>

            {/* ID Generator */}
            <div className="px-6">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Generate Animal ID
              </p>
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Prefix (optional)"
                    maxLength={20}
                    value={modal.idPrefix}
                    onChange={(e) =>
                      setModal((m) => m && { ...m, idPrefix: e.target.value, generatedId: null })
                    }
                    className="min-w-0 flex-1 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground transition-colors placeholder:text-muted-foreground/40 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const id = generateAnimalId(modal.genotype, modal.sex, modal.birthYear, modal.idPrefix)
                      setModal((m) => m && { ...m, generatedId: id })
                      setCopied(false)
                    }}
                    className="shrink-0 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-500"
                  >
                    Generate
                  </button>
                </div>
                {modal.generatedId && (
                  <div className="mt-3 flex items-center gap-2">
                    <code className="flex-1 overflow-x-auto rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm font-mono text-foreground">
                      {modal.generatedId}
                    </code>
                    <button
                      type="button"
                      title={copied ? 'Copied!' : 'Copy to clipboard'}
                      onClick={() => {
                        navigator.clipboard.writeText(modal.generatedId!)
                        setCopied(true)
                        setTimeout(() => setCopied(false), 2000)
                      }}
                      className={`shrink-0 rounded-lg border px-2.5 py-2 text-xs transition-colors ${
                        copied
                          ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
                          : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <CopyIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                <p className="mt-2 text-xs text-muted-foreground/50">
                  Uses genetics short names, birth year, and sex to build a readable ID.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 px-6 pb-6">
              <button
                onClick={() => setModal(null)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Cancel
                <XmarkIcon className="h-4 w-4" />
              </button>
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
              >
                {modal.mode === 'add' ? (
                  <>
                    Add Animal
                    <PlusIcon className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Save Changes
                    <FloppyDiskIcon className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete dialog */}
      {confirmDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4">
          <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-border bg-popover p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-foreground">Delete Animal?</h3>
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
                {animals.find((a) => a.id === confirmDelete)?.name}
              </span>{' '}
              from your saved animals.
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
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-500"
              >
                Delete
                <TrashCanIcon className="h-4 w-4" />
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
  )
}
