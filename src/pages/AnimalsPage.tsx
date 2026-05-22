import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { ParentSelector } from '../components/ParentSelector'
import { ImportModal } from '../components/ImportModal'
import { GenotypePreview } from '../components/GenotypePreview'
import { formatDate } from '../utils/formatDate'
import type { SavedAnimal } from '../hooks/useSavedAnimals'
import type { ParentGenotype } from 'bp-genetics'

interface AnimalModalState {
  mode: 'add' | 'edit'
  animal?: SavedAnimal
  name: string
  genotype: ParentGenotype
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
    setModal({ mode: 'add', name: '', genotype: {} })
  }

  function openEdit(animal: SavedAnimal) {
    setModal({
      mode: 'edit',
      animal,
      name: animal.name,
      genotype: { ...animal.genotype },
    })
  }

  function handleSave() {
    if (!modal) return
    if (modal.mode === 'add') {
      saveAnimal(modal.name, modal.genotype)
    } else if (modal.animal) {
      updateAnimal(modal.animal.id, modal.name, modal.genotype)
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
          <h1 className="text-lg font-semibold tracking-tight text-white">
            Animals
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Manage your saved ball pythons
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/5 px-3 py-1.5 text-xs text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200"
          >
            <span>📥</span>
            <span>Import</span>
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
          >
            <span>+</span>
            <span>Add Animal</span>
          </button>
        </div>
      </div>

      {/* Table / empty state */}
      {animals.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/5 bg-[#161b27] p-12 text-center">
          <span className="text-4xl">🐍</span>
          <p className="text-sm text-slate-400">No animals saved yet.</p>
          <p className="text-xs text-slate-600">
            Add your first snake to track its genetics.
          </p>
          <button
            onClick={openAdd}
            className="mt-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-500"
          >
            Add Animal
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
                  Genetics
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
              {animals.map((animal) => (
                <tr
                  key={animal.id}
                  className="transition-colors hover:bg-white/2"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-200">
                      {animal.name}
                    </span>
                    <div className="mt-0.5 sm:hidden">
                      <GenotypePreview genotype={animal.genotype} />
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <GenotypePreview genotype={animal.genotype} />
                  </td>
                  <td className="hidden px-4 py-3 text-xs text-slate-500 md:table-cell">
                    {formatDate(animal.savedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() =>
                          navigate('/calculator', {
                            state: { loadAnimal: animal, slot: 'parent1' },
                          })
                        }
                        className="rounded-lg border border-white/5 bg-white/4 px-2.5 py-1 text-xs text-slate-400 transition-colors hover:bg-white/8 hover:text-slate-200"
                        title="Load as Sire in Calculator"
                      >
                        → Sire
                      </button>
                      <button
                        onClick={() =>
                          navigate('/calculator', {
                            state: { loadAnimal: animal, slot: 'parent2' },
                          })
                        }
                        className="rounded-lg border border-white/5 bg-white/4 px-2.5 py-1 text-xs text-slate-400 transition-colors hover:bg-white/8 hover:text-slate-200"
                        title="Load as Dam in Calculator"
                      >
                        → Dam
                      </button>
                      <button
                        onClick={() => openEdit(animal)}
                        className="rounded-lg border border-white/5 bg-white/4 px-2.5 py-1 text-xs text-slate-400 transition-colors hover:bg-white/8 hover:text-slate-200"
                        title="Edit"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => setConfirmDelete(animal.id)}
                        className="rounded-lg border border-white/5 bg-white/4 px-2.5 py-1 text-xs text-slate-600 transition-colors hover:border-rose-500/25 hover:bg-rose-500/15 hover:text-rose-400"
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
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-10">
          <div className="my-auto flex w-full max-w-xl flex-col gap-5 rounded-2xl border border-white/10 bg-[#1c2333] shadow-2xl">
            <div className="flex items-center justify-between px-6 pt-6">
              <h3 className="text-sm font-semibold text-white">
                {modal.mode === 'add' ? 'Add Animal' : 'Edit Animal'}
              </h3>
              <button
                onClick={() => setModal(null)}
                className="text-lg leading-none text-slate-500 transition-colors hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3 px-6">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-slate-400">
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
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition-colors placeholder:text-slate-600 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none"
                />
              </label>
            </div>

            <div className="px-6">
              <p className="mb-2 text-xs font-medium text-slate-400">
                Genetics
              </p>
              <div className="rounded-xl border border-white/5 bg-[#161b27] p-4">
                <ParentSelector
                  parentLabel="Edit Animal Genetics"
                  parentSex=""
                  genotype={modal.genotype}
                  onChange={(g) => setModal((m) => m && { ...m, genotype: g })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-6 pb-6">
              <button
                onClick={() => setModal(null)}
                className="rounded-lg border border-white/5 bg-white/5 px-4 py-2 text-sm text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
              >
                {modal.mode === 'add' ? 'Add Animal' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete dialog */}
      {confirmDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-white/10 bg-[#1c2333] p-6 shadow-2xl">
            <h3 className="text-sm font-semibold text-white">Delete Animal?</h3>
            <p className="text-xs text-slate-400">
              This will permanently remove{' '}
              <span className="font-medium text-slate-200">
                {animals.find((a) => a.id === confirmDelete)?.name}
              </span>{' '}
              from your saved animals.
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

      {/* Import modal */}
      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSaveAnimal={saveAnimal}
      />
    </div>
  )
}
