import { useMemo, useState } from 'react'
import type React from 'react'
import {
  CheckIcon,
  ChevronDownIcon,
  DnaIcon,
  ArrowsLeftRightIcon,
  CodeForkIcon,
  BullseyeIcon,
  PencilIcon,
  XmarkIcon,
  ArrowRightIcon,
  PlusIcon,
  ArrowUpFromBracketIcon,
  ArrowRotateLeftIcon,
  ArrowUpRightFromSquareIcon,
  FaSnakeIcon,
} from '../components/icons/index'
import { useNavigate } from 'react-router-dom'
import { geneById, formatProbability } from 'bp-genetics'
import { useAppContext } from '../context/AppContext'
import { GenotypePreview } from '../components/GenotypePreview'
import { formatDate } from '../utils/formatDate'

export function DashboardPage() {
  const {
    animals,
    pairings,
    projects,
    projectGoals,
    removeProjectGoal,
    toggleGoalAchieved,
    pairingIdToProjectId,
  } = useAppContext()
  const navigate = useNavigate()

  // Top genes by animal count
  const traitStats = useMemo(() => {
    if (animals.length === 0) return []
    const counts = new Map<string, { name: string; visual: number; het: number }>()
    for (const animal of animals) {
      for (const [geneId, copies] of Object.entries(animal.genotype)) {
        if (copies === 0) continue
        const gene = geneById(geneId)
        const entry = counts.get(geneId) ?? { name: gene?.name ?? geneId, visual: 0, het: 0 }
        if (copies === 2) entry.visual++
        else entry.het++
        counts.set(geneId, entry)
      }
    }
    return [...counts.entries()]
      .map(([id, data]) => ({ id, ...data, total: data.visual + data.het }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)
  }, [animals])

  // Collection-level summary
  const collectionSummary = useMemo(() => {
    const uniqueGenes = new Set<string>()
    let visualCount = 0
    let hetOnlyCount = 0
    let normalCount = 0
    let totalWeight = 0
    for (const animal of animals) {
      const entries = Object.entries(animal.genotype).filter(([, c]) => c > 0)
      const hasVisual = entries.some(([, c]) => c === 2)
      const hasHet = entries.some(([, c]) => c === 1)
      entries.forEach(([geneId, c]) => {
        uniqueGenes.add(geneId)
        totalWeight += c
      })
      if (hasVisual) visualCount++
      else if (hasHet) hetOnlyCount++
      else normalCount++
    }
    return {
      uniqueGenes: uniqueGenes.size,
      visualCount,
      hetOnlyCount,
      normalCount,
      avgTraits: animals.length > 0 ? (totalWeight / animals.length).toFixed(1) : '0',
    }
  }, [animals])

  // Map goals to their projects (via pairingId)
  const projectsWithGoals = useMemo(
    () =>
      projects.map((project) => ({
        project,
        goals: projectGoals.filter(
          (g) => g.pairingId && pairingIdToProjectId.get(g.pairingId) === project.id
        ),
      })),
    [projects, projectGoals, pairingIdToProjectId]
  )

  // Goals not linked to any project
  const unlinkedGoals = useMemo(
    () =>
      projectGoals.filter(
        (g) => !g.pairingId || !pairingIdToProjectId.has(g.pairingId)
      ),
    [projectGoals, pairingIdToProjectId]
  )

  const activeGoals = projectGoals.filter((g) => !g.achieved)
  const achievedGoals = projectGoals.filter((g) => g.achieved)
  const showGoalsSection =
    projectGoals.length > 0 || projects.length > 0

  return (
    <div className="flex flex-col gap-8">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          Icon={FaSnakeIcon}
          label="Animals"
          value={animals.length}
          to="/animals"
          navigate={navigate}
        />
        <StatCard
          Icon={ArrowsLeftRightIcon}
          label="Pairings"
          value={pairings.length}
          to="/pairings"
          navigate={navigate}
        />
        <StatCard
          Icon={CodeForkIcon}
          label="Projects"
          value={projects.length}
          to="/projects"
          navigate={navigate}
        />
        <StatCard
          Icon={BullseyeIcon}
          label={achievedGoals.length > 0 ? `Goals · ${achievedGoals.length} achieved` : 'Goals'}
          value={activeGoals.length}
          to="/calculator"
          navigate={navigate}
          accent={activeGoals.length > 0 ? 'emerald' : undefined}
        />
      </div>

      {/* Analytics — only shown when collection has animals */}
      {animals.length > 0 && (
        <CollapsibleSection
          title="Analytics"
          subtitle={`Top genes across your ${animals.length} animal${animals.length !== 1 ? 's' : ''}`}
          storageKey="analytics"
        >
          <div className="grid gap-4 lg:grid-cols-2">
          {/* Trait Breakdown */}
          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold tracking-tight text-foreground/80">
                  Trait Breakdown
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground/60">
                  Top genes across your {animals.length} animal{animals.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => navigate('/animals')}
                className="inline-flex items-center gap-1 text-xs text-indigo-400 transition-colors hover:text-indigo-300"
              >
                <ArrowRightIcon className="h-3.5 w-3.5" />
                Manage →
              </button>
            </div>
            {traitStats.length === 0 ? (
              <p className="text-xs text-muted-foreground/40">
                No gene data saved — edit your animals to add morphs.
              </p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {traitStats.map(({ id, name, visual, het, total }) => {
                  const maxTotal = traitStats[0].total
                  const visualPct = (visual / maxTotal) * 100
                  const hetPct = (het / maxTotal) * 100
                  return (
                    <div key={id} className="flex items-center gap-3">
                      <span className="w-28 shrink-0 truncate text-[11px] text-muted-foreground">
                        {name}
                      </span>
                      <div className="relative flex h-3.5 flex-1 overflow-hidden rounded-sm bg-muted/50">
                        {visual > 0 && (
                          <div
                            className="h-full bg-emerald-500/65 transition-all"
                            style={{ width: `${visualPct}%` }}
                            title={`${visual} visual`}
                          />
                        )}
                        {het > 0 && (
                          <div
                            className="h-full bg-indigo-500/45 transition-all"
                            style={{ width: `${hetPct}%` }}
                            title={`${het} het`}
                          />
                        )}
                      </div>
                      <span className="w-6 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground/60">
                        {total}
                      </span>
                    </div>
                  )
                })}
                <div className="mt-0.5 flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground/40">
                    <span className="inline-block h-2 w-3 rounded-sm bg-emerald-500/65" />
                    Visual
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground/40">
                    <span className="inline-block h-2 w-3 rounded-sm bg-indigo-500/45" />
                    Het
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Collection Overview */}
          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-foreground/80">
                Collection Overview
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground/60">
                Aggregate stats across your saved animals
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MiniStat
                value={collectionSummary.uniqueGenes}
                label="Unique genes"
                color="text-violet-400"
              />
              <MiniStat
                value={collectionSummary.visualCount}
                label="Visual animals"
                color="text-emerald-400"
              />
              <MiniStat
                value={collectionSummary.hetOnlyCount}
                label="Het carriers"
                color="text-indigo-400"
              />
              <MiniStat
                value={collectionSummary.avgTraits}
                label="Avg traits / animal"
                color="text-amber-400"
              />
            </div>
            {/* Stacked composition bar */}
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-medium tracking-widest text-muted-foreground/40 uppercase">
                Composition
              </p>
              <div className="flex h-3 overflow-hidden rounded-full bg-muted/50">
                {collectionSummary.visualCount > 0 && (
                  <div
                    className="h-full bg-emerald-500/60"
                    style={{
                      width: `${(collectionSummary.visualCount / animals.length) * 100}%`,
                    }}
                  />
                )}
                {collectionSummary.hetOnlyCount > 0 && (
                  <div
                    className="h-full bg-indigo-500/50"
                    style={{
                      width: `${(collectionSummary.hetOnlyCount / animals.length) * 100}%`,
                    }}
                  />
                )}
                {collectionSummary.normalCount > 0 && (
                  <div
                    className="h-full bg-muted-foreground/40"
                    style={{
                      width: `${(collectionSummary.normalCount / animals.length) * 100}%`,
                    }}
                  />
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                {collectionSummary.visualCount > 0 && (
                  <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground/40">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500/60" />
                    {collectionSummary.visualCount} visual
                  </span>
                )}
                {collectionSummary.hetOnlyCount > 0 && (
                  <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground/40">
                    <span className="inline-block h-2 w-2 rounded-full bg-indigo-500/50" />
                    {collectionSummary.hetOnlyCount} het
                  </span>
                )}
                {collectionSummary.normalCount > 0 && (
                  <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground/40">
                    <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground/40" />
                    {collectionSummary.normalCount} normal
                  </span>
                )}
              </div>
            </div>
          </div>
          </div>
        </CollapsibleSection>
      )}

      {/* Projects & Goals */}
      {showGoalsSection && (
        <CollapsibleSection
          title="Projects & Goals"
          subtitle={`${activeGoals.length} active goal${activeGoals.length !== 1 ? 's' : ''}${achievedGoals.length > 0 ? ` · ${achievedGoals.length} achieved` : ''}`}
          storageKey="goals"
          action={
            <button
              onClick={() => navigate('/calculator')}
              className="inline-flex items-center gap-1 text-xs text-indigo-400 transition-colors hover:text-indigo-300"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              New goal →
            </button>
          }
        >
          <div className="flex flex-col gap-2">
            {/* Per-project goal groups */}
            {projectsWithGoals.map(({ project, goals }) => {
              const projectActive = goals.filter((g) => !g.achieved)
              const projectAchieved = goals.filter((g) => g.achieved)
              return (
                <div
                  key={project.id}
                  className="overflow-hidden rounded-2xl border border-border bg-card"
                >
                  {/* Project header */}
                  <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                    <CodeForkIcon className="h-4 w-4 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {project.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground/40">
                        {formatDate(project.savedAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {goals.length > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                          <BullseyeIcon className="h-3 w-3" />
                          <span>{goals.length}</span>
                        </span>
                      )}
                      <button
                        onClick={() => navigate('/projects', { state: { project } })}
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground/80"
                      >
                        <ArrowUpRightFromSquareIcon className="h-3.5 w-3.5" />
                        Open
                      </button>
                    </div>
                  </div>

                  {/* Goals for this project */}
                  {goals.length > 0 ? (
                    <div className="divide-y divide-border">
                      {[...projectActive, ...projectAchieved].map((goal) => (
                        <GoalRow
                          key={goal.id}
                          goal={goal}
                          onToggle={() => toggleGoalAchieved(goal.id)}
                          onRemove={() => removeProjectGoal(goal.id)}
                          onLoadPairing={
                            goal.pairingId
                              ? () =>
                                  navigate('/calculator', {
                                    state: { loadPairing: { id: goal.pairingId } },
                                  })
                              : undefined
                          }
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="px-4 py-3 text-xs text-muted-foreground/40">
                      No goals linked to this project yet — flag outcomes in the Calculator.
                    </p>
                  )}
                </div>
              )
            })}

            {/* Unlinked goals (no project) */}
            {unlinkedGoals.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-border bg-card">
                {projects.length > 0 && (
                  <div className="border-b border-border px-4 py-2.5">
                    <p className="text-xs font-medium text-muted-foreground/60">Standalone Goals</p>
                  </div>
                )}
                <div className="divide-y divide-border">
                  {unlinkedGoals.map((goal) => (
                    <GoalRow
                      key={goal.id}
                      goal={goal}
                      onToggle={() => toggleGoalAchieved(goal.id)}
                      onRemove={() => removeProjectGoal(goal.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty state — projects but no goals yet */}
            {projects.length > 0 && projectGoals.length === 0 && (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-card px-6 py-8 text-center">
                <BullseyeIcon className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No goals set yet</p>
                <p className="text-xs text-muted-foreground/40">
                  Open the Calculator, run a cross, and use the goal button on any outcome.
                </p>
                <button
                  onClick={() => navigate('/calculator')}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-indigo-500"
                >
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                  Go to Calculator
                </button>
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* Your Animals */}
      <CollapsibleSection
        title="Your Animals"
        storageKey="animals"
        action={
          <button
            onClick={() => navigate('/animals')}
            className="inline-flex items-center gap-1 text-xs text-indigo-400 transition-colors hover:text-indigo-300"
          >
            {animals.length > 6 ? `View all ${animals.length} →` : (
              <>
                <ArrowRightIcon className="h-3.5 w-3.5" />
                Manage →
              </>
            )}
          </button>
        }
      >
        {animals.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-8 text-center">
            <FaSnakeIcon className="h-8 w-8 text-muted-foreground" variant="thin" />
            <p className="text-sm text-muted-foreground">No animals saved yet.</p>
            <p className="text-xs text-muted-foreground/40">
              Head to the Animals page to add your first snake.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/animals')}
                className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-indigo-500"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                Add Animal
              </button>
              <button
                onClick={() => navigate('/animals', { state: { openImport: true } })}
                className="mt-1 inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/50 px-4 py-2 text-xs font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
              >
                <ArrowUpFromBracketIcon className="h-3.5 w-3.5" />
                Import Animals
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {animals.slice(0, 6).map((animal) => (
              <div
                key={animal.id}
                className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm leading-tight font-medium text-foreground">
                    {animal.name}
                  </span>
                  <span className="shrink-0 text-[10px] text-muted-foreground/40">
                    {formatDate(animal.savedAt)}
                  </span>
                </div>
                <GenotypePreview genotype={animal.genotype} />
                <div className="mt-1 flex items-center gap-2">
                  <button
                    onClick={() =>
                      navigate('/calculator', {
                        state: { loadAnimal: animal, slot: 'parent1' },
                      })
                    }
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-center text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <ArrowRightIcon className="h-3.5 w-3.5" />
                    Load as Sire
                  </button>
                  <button
                    onClick={() =>
                      navigate('/calculator', {
                        state: { loadAnimal: animal, slot: 'parent2' },
                      })
                    }
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-center text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <ArrowRightIcon className="h-3.5 w-3.5" />
                    Load as Dam
                  </button>
                  <button
                    onClick={() => navigate('/animals')}
                    className="rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    title="Edit"
                  >
                    <PencilIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>

      {/* Recent Pairings */}
      {pairings.length > 0 && (
        <CollapsibleSection
          title="Recent Pairings"
          storageKey="pairings"
          action={
            <button
              onClick={() => navigate('/pairings')}
              className="text-xs text-indigo-400 transition-colors hover:text-indigo-300"
            >
              View all →
            </button>
          }
        >
          <div className="divide-y divide-border rounded-2xl border border-border bg-card">
            {pairings.slice(0, 5).map((p) => {
              const a1 = animals.find((a) => a.id === p.parent1AnimalId)
              const a2 = animals.find((a) => a.id === p.parent2AnimalId)
              return (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {p.name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground/60">
                      {a1 ? a1.name : 'Sire'} × {a2 ? a2.name : 'Dam'}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] text-muted-foreground/40">
                    {formatDate(p.savedAt)}
                  </span>
                  <button
                    onClick={() =>
                      navigate('/calculator', { state: { loadPairing: p } })
                    }
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1.5 text-xs font-medium text-indigo-400 transition-colors hover:bg-indigo-500/20"
                  >
                    <ArrowRightIcon className="h-3.5 w-3.5" />
                    Load
                  </button>
                </div>
              )
            })}
          </div>
        </CollapsibleSection>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function useCollapsed(key: string, defaultValue = false) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const stored = localStorage.getItem(`dashboard-collapsed-${key}`)
      return stored !== null ? stored === 'true' : defaultValue
    } catch {
      return defaultValue
    }
  })

  function toggle() {
    setCollapsed((c) => {
      const next = !c
      try {
        localStorage.setItem(`dashboard-collapsed-${key}`, String(next))
      } catch (e) {
        void e
      }
      return next
    })
  }

  return [collapsed, toggle] as const
}

function CollapsibleSection({
  title,
  subtitle,
  action,
  children,
  storageKey,
  defaultCollapsed = false,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
  storageKey: string
  defaultCollapsed?: boolean
}) {
  const [collapsed, toggle] = useCollapsed(storageKey, defaultCollapsed)

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <button
          onClick={toggle}
          className="group flex items-center gap-2 text-left"
        >
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground/80">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-xs text-muted-foreground/60">{subtitle}</p>
            )}
          </div>
          <ChevronDownIcon
            className={`h-3.5 w-3.5 text-muted-foreground/40 transition-transform duration-200 ${
              collapsed ? '-rotate-90' : ''
            }`}
          />
        </button>
        {action}
      </div>
      {!collapsed && children}
    </section>
  )
}

function GoalRow({
  goal,
  onToggle,
  onRemove,
  onLoadPairing,
}: {
  goal: import('../hooks/useProjectGoals').ProjectGoal
  onToggle: () => void
  onRemove: () => void
  onLoadPairing?: () => void
}) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 transition-colors ${
        goal.achieved ? 'opacity-50' : ''
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={`text-sm font-medium ${
              goal.achieved ? 'text-muted-foreground/60 line-through' : 'text-foreground'
            }`}
          >
            {goal.label}
          </p>
          {goal.achieved && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
              <CheckIcon className="h-3 w-3" />
              <span>Achieved</span>
            </span>
          )}
          {goal.probability !== undefined && !goal.achieved && (
            <span className="text-[11px] text-muted-foreground/40 tabular-nums">
              {formatProbability(goal.probability)}
            </span>
          )}
        </div>
        {goal.pairingName && (
          <p className="mt-0.5 text-[11px] text-muted-foreground/40">from {goal.pairingName}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          onClick={onToggle}
          title={goal.achieved ? 'Reopen goal' : 'Mark as achieved'}
          className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
            goal.achieved
              ? 'border-border bg-muted/40 text-muted-foreground/60 hover:bg-muted hover:text-foreground/80'
              : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
          }`}
        >
          {goal.achieved ? (
            <span className="inline-flex items-center gap-1">
              <ArrowRotateLeftIcon className="h-3.5 w-3.5" />
              Reopen
            </span>
          ) : (
            <CheckIcon className="h-3.5 w-3.5" />
          )}
        </button>
        {onLoadPairing && (
          <button
            onClick={onLoadPairing}
            title="Open pairing in Calculator"
            className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-400 transition-colors hover:bg-indigo-500/20"
          >
            <DnaIcon className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={onRemove}
          title="Remove goal"
          className="rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground/40 transition-colors hover:border-rose-500/25 hover:bg-rose-500/15 hover:text-rose-400"
        >
          <XmarkIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

function MiniStat({
  value,
  label,
  color,
}: {
  value: number | string
  label: string
  color: string
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl border border-border bg-muted/30 px-3 py-2.5">
      <p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p>
      <p className="text-[11px] text-muted-foreground/60">{label}</p>
    </div>
  )
}

function StatCard({
  Icon,
  label,
  value,
  to,
  navigate,
  accent,
}: {
  Icon: React.ComponentType<{ className?: string }>
  label: string
  value: number | null
  to: string
  navigate: (path: string) => void
  accent?: 'emerald'
}) {
  return (
    <button
      onClick={() => navigate(to)}
      className={`flex flex-col gap-1.5 rounded-2xl border px-4 py-3 text-left transition-colors ${
        accent === 'emerald'
          ? 'border-emerald-500/15 bg-emerald-500/5 hover:border-emerald-500/25'
          : 'border-border bg-card hover:border-border'
      }`}
    >
      <div className="flex items-center gap-2">
        <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${accent === 'emerald' ? 'bg-emerald-500/15' : 'bg-muted'}`}>
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <p className="text-lg font-bold leading-none text-foreground">
          {value !== null ? value : '→'}
        </p>
      </div>
      <p className="text-xs text-muted-foreground/60">{label}</p>
    </button>
  )
}
