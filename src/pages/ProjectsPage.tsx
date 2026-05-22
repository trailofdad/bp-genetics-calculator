import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { formatProbability } from 'bp-genetics'
import { ProjectsView } from '../projects/ProjectsView'
import { useAppContext } from '../context/AppContext'
import { GenotypePreview } from '../components/GenotypePreview'
import { formatDate } from '../utils/formatDate'
import type { SavedOffspring } from '../hooks/useSavedOffspring'
import type { BreedingProject } from '../projects/types'
import {
  buildProjectFromPairing,
  buildProjectFromSavedOffspring,
} from '../projects/utils/projectBuilders'

export function ProjectsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const {
    animals,
    saveAnimal,
    saveProject,
    loadProject,
    projects,
    removeProject,
    pairings,
    savedOffspring,
    saveProjectGoal,
    projectGoals,
    pairingIdToProjectId,
    toggleGoalAchieved,
    removeProjectGoal,
  } = useAppContext()

  const goalKeys = useMemo(
    () => new Set(projectGoals.map((g) => g.genotypeKey)),
    [projectGoals]
  )

  // Goals grouped by project id
  const goalsByProject = useMemo(() => {
    const map = new Map<string, typeof projectGoals>()
    for (const goal of projectGoals) {
      if (!goal.pairingId) continue
      const projectId = pairingIdToProjectId.get(goal.pairingId)
      if (!projectId) continue
      const existing = map.get(projectId) ?? []
      map.set(projectId, [...existing, goal])
    }
    return map
  }, [projectGoals, pairingIdToProjectId])

  const locationProject = (
    location.state as { project?: BreedingProject } | null
  )?.project
  const [project, setProject] = useState<BreedingProject | null>(
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

  function openProject(nextProject: BreedingProject) {
    saveProject(nextProject)
    setProject(nextProject)
  }

  // TODO (DB migration): replace loadProject with a DB query
  function openExistingProject(id: string) {
    const full = loadProject(id)
    if (full) setProject(full)
  }

  if (!project) {
    return (
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              Projects
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
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

        {/* Tab bar */}
        <div className="flex gap-1.5">
          {(['projects', 'pairings'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg border px-3.5 py-1.5 text-xs font-medium capitalize transition-colors ${
                tab === t
                  ? 'border-indigo-500/30 bg-indigo-500/15 text-indigo-700 dark:text-indigo-300'
                  : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {t === 'projects' ? '🌿 Projects' : '⇄ Pairings'}
            </button>
          ))}
        </div>

        {/* Projects tab */}
        {tab === 'projects' && (
          projects.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-12 text-center">
              <span className="text-4xl">🌿</span>
              <p className="text-sm text-muted-foreground">No saved projects yet.</p>
              <p className="text-xs text-muted-foreground/60">
                Switch to Pairings to open a saved pairing as a project.
              </p>
              <button
                onClick={() => setTab('pairings')}
                className="mt-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-500"
              >
                Browse Pairings
              </button>
            </div>
          ) : (
          <div className="flex flex-col gap-2">
              {projects.map((p) => {
                const goals = goalsByProject.get(p.id) ?? []
                const activeGoals = goals.filter((g) => !g.achieved)
                const achievedGoals = goals.filter((g) => g.achieved)
                return (
                  <div
                    key={p.id}
                    className="overflow-hidden rounded-2xl border border-border bg-card"
                  >
                    {/* Project header */}
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {p.name}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground/60">
                          {formatDate(p.savedAt)}
                          {goals.length > 0 && (
                            <span className="ml-2 text-emerald-600 dark:text-emerald-500/70">
                              {activeGoals.length} active · {achievedGoals.length} achieved
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          onClick={() => openExistingProject(p.id)}
                          className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-400 transition-colors hover:bg-indigo-500/20"
                        >
                          Open
                        </button>
                        <button
                          onClick={() => setConfirmDelete(p.id)}
                          className="rounded-lg border border-border bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-rose-500/25 hover:bg-rose-500/15 hover:text-rose-600 dark:hover:text-rose-400"
                          title="Delete"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Goals */}
                    {goals.length > 0 && (
                      <div className="border-t border-border divide-y divide-border">
                        {[...activeGoals, ...achievedGoals].map((goal) => (
                          <div
                            key={goal.id}
                            className={`flex items-center gap-3 px-4 py-2 ${goal.achieved ? 'opacity-50' : ''}`}
                          >
                            <span className="text-[10px] text-muted-foreground/50">◉</span>
                            <div className="min-w-0 flex-1">
                              <p className={`truncate text-xs font-medium ${goal.achieved ? 'text-muted-foreground line-through' : 'text-foreground/80'}`}>
                                {goal.label}
                              </p>
                              {goal.probability !== undefined && !goal.achieved && (
                                <p className="text-[10px] tabular-nums text-muted-foreground/60">
                                  {Math.round(goal.probability * 100)}%
                                </p>
                              )}
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              <button
                                onClick={() => toggleGoalAchieved(goal.id)}
                                title={goal.achieved ? 'Reopen' : 'Mark achieved'}
                                className={`rounded-md border px-2 py-0.5 text-[10px] font-medium transition-colors ${
                                  goal.achieved
                                    ? 'border-border bg-muted/30 text-muted-foreground hover:text-foreground'
                                    : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20'
                                }`}
                              >
                                {goal.achieved ? 'Reopen' : '✓'}
                              </button>
                              <button
                                onClick={() => removeProjectGoal(goal.id)}
                                title="Remove goal"
                                className="rounded-md border border-border bg-muted/20 px-2 py-0.5 text-[10px] text-muted-foreground transition-colors hover:border-rose-500/25 hover:bg-rose-500/15 hover:text-rose-600 dark:hover:text-rose-400"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        )}

        {/* Pairings tab */}
        {tab === 'pairings' && (
          pairings.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-12 text-center">
              <span className="text-4xl">⇄</span>
              <p className="text-sm text-muted-foreground">No pairings saved yet.</p>
              <p className="text-xs text-muted-foreground/60">
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
                    className="rounded-2xl border border-border bg-card p-5"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-sm font-semibold text-foreground">
                            {pairing.name}
                          </h2>
                          {offspring.length > 0 && (
                            <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                              ★ {offspring.length}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {parent1Name} × {parent2Name}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          openProject(buildProjectFromPairing(pairing, animals))
                        }
                        className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
                      >
                        Open in Projects
                      </button>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-xl border border-border bg-muted/30 p-3">
                        <p className="mb-1 text-[11px] font-medium text-muted-foreground">
                          {parent1Name}
                        </p>
                        <GenotypePreview genotype={pairing.parent1} />
                      </div>
                      <div className="rounded-xl border border-border bg-muted/30 p-3">
                        <p className="mb-1 text-[11px] font-medium text-muted-foreground">
                          {parent2Name}
                        </p>
                        <GenotypePreview genotype={pairing.parent2} />
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-border bg-muted/20 p-3">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div>
                          <h3 className="text-xs font-semibold tracking-wide text-foreground/80 uppercase">
                            Saved Offspring
                          </h3>
                          <p className="text-[11px] text-muted-foreground/60">
                            Flag outcomes in the calculator to reuse them here.
                          </p>
                        </div>
                      </div>

                      {offspring.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No saved offspring
                        </p>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {offspring.map((entry) => (
                            <div
                              key={entry.id}
                              className="flex flex-col gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm text-foreground">
                                  {entry.label}
                                </p>
                                <p className="text-xs text-muted-foreground">
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
                                → Projects
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
          )
        )}

        {/* Delete confirm modal */}
        {confirmDelete !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-2xl">
              <h3 className="text-sm font-semibold text-foreground">
                Delete Project?
              </h3>
              <p className="text-xs text-muted-foreground">
                This will permanently remove{' '}
                <span className="font-medium text-foreground">
                  {projects.find((p) => p.id === confirmDelete)?.name}
                </span>{' '}
                from your saved projects.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="rounded-lg border border-border bg-muted/30 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
    <ProjectsView
      project={project}
      savedAnimals={animals}
      saveAnimal={saveAnimal}
      onBack={() => setProject(null)}
      onSave={saveProject}
      onSaveGoal={saveProjectGoal}
      goalKeys={goalKeys}
    />
  )
}
