import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { formatProbability } from 'bp-genetics'
import { PlaygroundView } from '../playground/PlaygroundView'
import { useAppContext } from '../context/AppContext'
import { GenotypePreview } from '../components/GenotypePreview'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { formatDate } from '../utils/formatDate'
import type { SavedAnimal } from '../hooks/useSavedAnimals'
import type { SavedPairing } from '../hooks/useSavedPairings'
import type { SavedOffspring } from '../hooks/useSavedOffspring'
import type { PlaygroundProject } from '../playground/types'

function makeProjectId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

function buildProjectFromPairing(
  pairing: SavedPairing,
  animals: SavedAnimal[]
): PlaygroundProject {
  const rootNodeId = `${makeProjectId()}-root`

  return {
    id: makeProjectId(),
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
}

function buildProjectFromSavedOffspring(
  pairing: SavedPairing,
  offspring: SavedOffspring,
  animals: SavedAnimal[]
): PlaygroundProject {
  const rootNodeId = `${makeProjectId()}-root`
  const mateName =
    animals.find((a) => a.id === pairing.parent2AnimalId)?.name ?? 'Parent 2'

  return {
    id: makeProjectId(),
    name: `${offspring.label} × ${mateName}`,
    rootNodeId,
    nodes: {
      [rootNodeId]: {
        id: rootNodeId,
        pairingId: pairing.id,
        parent1: offspring.genotype,
        parent1Name: offspring.label,
        parent2: pairing.parent2,
        parent2Name: mateName,
        childEdges: [],
      },
    },
    savedAt: new Date().toISOString(),
  }
}

export function PlaygroundPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const {
    animals,
    saveAnimal,
    saveProject,
    projects,
    removeProject,
    pairings,
    savedOffspring,
  } = useAppContext()

  const locationProject = (
    location.state as { project?: PlaygroundProject } | null
  )?.project
  const [project, setProject] = useState<PlaygroundProject | null>(
    locationProject ?? null
  )
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [tab, setTab] = useState<'projects' | 'pairings'>('projects')

  const savedOffspringByPairing = useMemo(() => {
    return savedOffspring.reduce<Record<string, SavedOffspring[]>>((acc, entry) => {
      acc[entry.pairingId] = [...(acc[entry.pairingId] ?? []), entry]
      return acc
    }, {})
  }, [savedOffspring])

  function openProject(nextProject: PlaygroundProject) {
    saveProject(nextProject)
    setProject(nextProject)
  }

  if (!project) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white">
              Playground
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Open saved projects or build one from a pairing.
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

        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as 'projects' | 'pairings')}
          className="gap-4"
        >
          <TabsList className="border border-white/5 bg-[#161b27] p-1">
            <TabsTrigger
              value="projects"
              className="data-[state=active]:bg-indigo-500/15 data-[state=active]:text-indigo-300"
            >
              Projects
            </TabsTrigger>
            <TabsTrigger
              value="pairings"
              className="data-[state=active]:bg-indigo-500/15 data-[state=active]:text-indigo-300"
            >
              Pairings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects">
            {projects.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/5 bg-[#161b27] p-12 text-center">
                <span className="text-4xl">🌿</span>
                <p className="text-sm text-slate-400">No saved projects yet.</p>
                <p className="text-xs text-slate-600">
                  Switch to Pairings to open a saved pairing in the playground.
                </p>
                <button
                  onClick={() => setTab('pairings')}
                  className="mt-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-500"
                >
                  Browse Pairings
                </button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#161b27]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-slate-500 uppercase">
                        Project
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
                    {projects.map((p) => (
                      <tr key={p.id} className="transition-colors hover:bg-white/2">
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-200">
                            {p.name}
                          </span>
                          <p className="mt-0.5 text-xs text-slate-600 md:hidden">
                            {formatDate(p.savedAt)}
                          </p>
                        </td>
                        <td className="hidden px-4 py-3 text-xs text-slate-500 md:table-cell">
                          {formatDate(p.savedAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setProject(p)}
                              className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-400 transition-colors hover:bg-indigo-500/20"
                            >
                              Open
                            </button>
                            <button
                              onClick={() => setConfirmDelete(p.id)}
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
          </TabsContent>

          <TabsContent value="pairings">
            {pairings.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/5 bg-[#161b27] p-12 text-center">
                <span className="text-4xl">⇄</span>
                <p className="text-sm text-slate-400">No pairings saved yet.</p>
                <p className="text-xs text-slate-600">
                  Save a pairing in the calculator to use it here.
                </p>
                <button
                  onClick={() => navigate('/calculator')}
                  className="mt-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-500"
                >
                  Go to Calculator
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {pairings.map((pairing) => {
                  const offspring = savedOffspringByPairing[pairing.id] ?? []
                  const parent1Name =
                    animals.find((a) => a.id === pairing.parent1AnimalId)?.name ??
                    'Parent 1'
                  const parent2Name =
                    animals.find((a) => a.id === pairing.parent2AnimalId)?.name ??
                    'Parent 2'

                  return (
                    <div
                      key={pairing.id}
                      className="rounded-2xl border border-white/5 bg-[#161b27] p-5"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-sm font-semibold text-white">
                              {pairing.name}
                            </h2>
                            {offspring.length > 0 && (
                              <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                                ★ {offspring.length}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {parent1Name} × {parent2Name}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            openProject(buildProjectFromPairing(pairing, animals))
                          }
                          className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
                        >
                          Open in Playground
                        </button>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div className="rounded-xl border border-white/5 bg-[#0d1117] p-3">
                          <p className="mb-1 text-[11px] font-medium text-slate-500">
                            {parent1Name}
                          </p>
                          <GenotypePreview genotype={pairing.parent1} />
                        </div>
                        <div className="rounded-xl border border-white/5 bg-[#0d1117] p-3">
                          <p className="mb-1 text-[11px] font-medium text-slate-500">
                            {parent2Name}
                          </p>
                          <GenotypePreview genotype={pairing.parent2} />
                        </div>
                      </div>

                      <div className="mt-4 rounded-xl border border-white/5 bg-[#0d1117] p-3">
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <div>
                            <h3 className="text-xs font-semibold tracking-wide text-slate-300 uppercase">
                              Saved Offspring
                            </h3>
                            <p className="text-[11px] text-slate-600">
                              Flag outcomes in the calculator to reuse them here.
                            </p>
                          </div>
                        </div>

                        {offspring.length === 0 ? (
                          <p className="text-sm text-slate-500">
                            No saved offspring
                          </p>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {offspring.map((entry) => (
                              <div
                                key={entry.id}
                                className="flex flex-col gap-2 rounded-lg border border-white/5 bg-white/3 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
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
                                  onClick={() =>
                                    openProject(
                                      buildProjectFromSavedOffspring(
                                        pairing,
                                        entry,
                                        animals
                                      )
                                    )
                                  }
                                  className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-400 transition-colors hover:bg-indigo-500/20"
                                >
                                  → Playground
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {confirmDelete !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-white/10 bg-[#1c2333] p-6 shadow-2xl">
              <h3 className="text-sm font-semibold text-white">
                Delete Project?
              </h3>
              <p className="text-xs text-slate-400">
                This will permanently remove{' '}
                <span className="font-medium text-slate-200">
                  {projects.find((p) => p.id === confirmDelete)?.name}
                </span>{' '}
                from your saved projects.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="rounded-lg border border-white/5 bg-white/5 px-4 py-2 text-sm text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    removeProject(confirmDelete)
                    setConfirmDelete(null)
                  }}
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

  return (
    <PlaygroundView
      project={project}
      savedAnimals={animals}
      saveAnimal={saveAnimal}
      onBack={() => setProject(null)}
      onSave={(p) => {
        saveProject(p)
        setProject(p)
      }}
    />
  )
}
