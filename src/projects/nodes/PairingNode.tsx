import { useMemo, useState, useRef, useEffect } from 'react'
import { Handle, Position } from '@xyflow/react'
import { calculateOffspring, formatProbability } from 'bp-genetics'
import type { OffspringOutcome } from 'bp-genetics'
import type { ProjectNode } from '../types'
import { Badge } from '@/components/ui/badge'
import { Tooltip } from '@/components/ui/tooltip'
import { buildCompactLabel, genotypeKey } from '../utils/compactLabel'

export interface PairingNodeData {
  node: ProjectNode
  onPairOffspring: (outcome: OffspringOutcome) => void
  onRenameOutcome: (genotypeKey: string, alias: string | null) => void
  onFlagOutcome: (genotypeKey: string) => void
  onAddGoal: (outcome: OffspringOutcome) => void
  goalKeys: Set<string>
  isRoot: boolean
}

function probabilityBadgeClass(prob: number) {
  if (prob >= 0.5)
    return 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
  if (prob >= 0.25)
    return 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/30'
  if (prob >= 0.125)
    return 'bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-500/30'
  return 'bg-muted text-muted-foreground border-border'
}

const DEFAULT_SHOWN = 8

function OutcomeLabel({
  label,
  alias,
  gKey,
  onRename,
}: {
  label: string
  alias: string | undefined
  gKey: string
  onRename: (gKey: string, alias: string | null) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  function startEdit() {
    setDraft(alias ?? label)
    setEditing(true)
  }

  function commit() {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== label) {
      onRename(gKey, trimmed)
    } else if (!trimmed) {
      onRename(gKey, null)
    }
    setEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commit()
    if (e.key === 'Escape') setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className="min-w-0 flex-1 rounded border border-indigo-500/40 bg-background px-1.5 py-px text-[11px] text-foreground focus:ring-1 focus:ring-indigo-500/50 focus:outline-none"
      />
    )
  }

  return (
    <span className="group/label flex min-w-0 items-center gap-1">
      <span className="truncate text-[11px] leading-snug text-foreground/80">
        {alias ?? label}
        {alias && (
          <span className="ml-1 text-[9px] font-normal text-indigo-500/60 dark:text-indigo-400/60">
            ✎
          </span>
        )}
      </span>
      <button
        onClick={startEdit}
        title="Rename this outcome"
        className="shrink-0 text-[10px] leading-none text-muted-foreground/50 opacity-0 transition-all group-hover/label:opacity-100 hover:text-indigo-600 dark:hover:text-indigo-400"
      >
        ✎
      </button>
    </span>
  )
}

type OutcomeTab = 'all' | 'flagged'

function traitCount(outcome: OffspringOutcome): number {
  return Object.values(outcome.genotype).filter((c) => c > 0).length
}

export function PairingNode({ data }: { data: PairingNodeData }) {
  const { node, onPairOffspring, onRenameOutcome, onFlagOutcome, onAddGoal, goalKeys, isRoot } = data
  const [showAll, setShowAll] = useState(false)
  const [activeTab, setActiveTab] = useState<OutcomeTab>('all')

  const outcomes = useMemo(
    () =>
      calculateOffspring(node.parent1, node.parent2).sort(
        (a, b) => traitCount(b) - traitCount(a)
      ),
    [node.parent1, node.parent2]
  )

  const flaggedKeys = useMemo(
    () => new Set(node.flaggedOutcomeKeys ?? []),
    [node.flaggedOutcomeKeys]
  )

  const { flaggedOutcomes, unflaggedOutcomes } = useMemo(() => {
    const flagged: OffspringOutcome[] = []
    const unflagged: OffspringOutcome[] = []

    outcomes.forEach((outcome) => {
      if (flaggedKeys.has(genotypeKey(outcome.genotype))) {
        flagged.push(outcome)
      } else {
        unflagged.push(outcome)
      }
    })

    return { flaggedOutcomes: flagged, unflaggedOutcomes: unflagged }
  }, [flaggedKeys, outcomes])

  const tabOutcomes = activeTab === 'flagged' ? flaggedOutcomes : unflaggedOutcomes
  const visibleTabOutcomes = showAll
    ? tabOutcomes
    : tabOutcomes.slice(0, DEFAULT_SHOWN)
  const hiddenCount = tabOutcomes.length - visibleTabOutcomes.length

  const pairedChildGenotypes = useMemo(
    () => new Set(node.childEdges.map((edge) => genotypeKey(edge.offspringGenotype))),
    [node.childEdges]
  )

  return (
    <div className="w-72 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
      {!isRoot && (
        <Handle
          type="target"
          position={Position.Top}
          className="h-2.5! w-2.5! border-indigo-500! bg-indigo-400!"
        />
      )}

      <div className="border-b border-border px-4 pt-3 pb-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs leading-snug font-semibold text-foreground">
            {node.parent1Name}
          </span>
          <span className="text-xs text-muted-foreground/50">×</span>
          <span className="text-xs leading-snug font-semibold text-foreground">
            {node.parent2Name}
          </span>
        </div>
        <p className="mt-0.5 text-[10px] text-muted-foreground/60">
          {outcomes.length} offspring outcomes
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border px-3 pt-2 pb-0">
        <button
          onClick={() => { setActiveTab('all'); setShowAll(false) }}
          className={`rounded-t-md px-2.5 py-1 text-[10px] font-medium transition-colors ${
            activeTab === 'all'
              ? 'border border-b-0 border-border bg-card text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          All ({unflaggedOutcomes.length})
        </button>
        <button
          onClick={() => { setActiveTab('flagged'); setShowAll(false) }}
          className={`rounded-t-md px-2.5 py-1 text-[10px] font-medium transition-colors ${
            activeTab === 'flagged'
              ? 'border border-b-0 border-border bg-card text-amber-700 dark:text-amber-300'
              : flaggedOutcomes.length > 0
                ? 'text-amber-600/70 dark:text-amber-500/70 hover:text-amber-700 dark:hover:text-amber-300'
                : 'text-muted-foreground/60 hover:text-muted-foreground'
          }`}
        >
          ★ Flagged ({flaggedOutcomes.length})
        </button>
      </div>

      <div className="flex flex-col gap-1 px-3 py-2">
        {activeTab === 'flagged' && flaggedOutcomes.length === 0 && (
        <p className="py-3 text-center text-[10px] text-muted-foreground/60">
            No flagged offspring yet — use ☆ to flag outcomes.
          </p>
        )}
        {visibleTabOutcomes.map((outcome) => {
          const gKey = genotypeKey(outcome.genotype)
          const alreadyPaired = pairedChildGenotypes.has(gKey)
          const alias = node.offspringAliases?.[gKey]
          const compactLabel = buildCompactLabel(outcome.genotype)
          const showProbability = outcome.probability < 1
          const isFlagged = flaggedKeys.has(gKey)
          const isGoal = goalKeys.has(gKey)

          return (
            <div
              key={gKey}
              className={`group flex items-center justify-between gap-2 rounded-lg border px-2 py-1.5 ${
                activeTab === 'flagged'
                  ? 'border-amber-500/20 bg-amber-500/8'
                  : 'border-border bg-muted/20'
              }`}
            >
              <div className="flex min-w-0 flex-1 items-center gap-1.5">
                {showProbability && (
                  <Badge
                    className={`shrink-0 border px-1.5 py-px text-[10px] font-medium ${probabilityBadgeClass(outcome.probability)}`}
                  >
                    {formatProbability(outcome.probability)}
                  </Badge>
                )}
                <OutcomeLabel
                  label={compactLabel}
                  alias={alias}
                  gKey={gKey}
                  onRename={onRenameOutcome}
                />
                <div className="flex shrink-0 items-center gap-0.5">
                  {outcome.hasLethal && (
                    <span className="text-[10px] text-rose-400/70">☠</span>
                  )}
                  {outcome.hasRisk && !outcome.hasLethal && (
                    <span className="text-[10px] text-orange-400/70">⚠</span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Tooltip
                  content={isGoal ? "Already added to this project's goals" : "Add to this project's goals"}
                  side="top"
                >
                  <button
                    onClick={() => onAddGoal(outcome)}
                    className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] transition-colors ${
                      isGoal
                        ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 cursor-default'
                        : 'border-border bg-muted/30 text-muted-foreground/50 opacity-0 group-hover:opacity-100 hover:border-emerald-500/25 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300'
                    }`}
                  >
                    {isGoal ? '◉' : '◎'}
                  </button>
                </Tooltip>
                <button
                  onClick={() => onFlagOutcome(gKey)}
                  title={isFlagged ? 'Unflag outcome' : 'Flag outcome'}
                  className={`flex h-5 w-5 items-center justify-center rounded-full border text-[11px] transition-colors ${
                    isFlagged
                      ? 'border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25'
                      : 'border-border bg-muted/30 text-muted-foreground/50 hover:border-amber-500/25 hover:bg-amber-500/10 hover:text-amber-700 dark:hover:text-amber-300'
                  }`}
                >
                  {isFlagged ? '★' : '☆'}
                </button>
                {!outcome.hasLethal && (
                  <button
                    onClick={() => onPairOffspring(outcome)}
                    title={
                      alreadyPaired
                        ? 'Already paired — add another'
                        : 'Pair this offspring'
                    }
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                      alreadyPaired
                        ? 'border border-indigo-500/40 bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/50'
                        : 'border border-border bg-muted/30 text-muted-foreground/50 opacity-0 group-hover:opacity-100 hover:border-indigo-500/30 hover:bg-indigo-500/20 hover:text-indigo-700 dark:hover:text-indigo-300'
                    }`}
                  >
                    {alreadyPaired ? '↗' : '+'}
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {!showAll && hiddenCount > 0 && (
          <button
            onClick={() => setShowAll(true)}
            className="py-1 text-center text-[11px] text-muted-foreground/60 transition-colors hover:text-muted-foreground"
          >
            Show {hiddenCount} more
          </button>
        )}
        {showAll && tabOutcomes.length > DEFAULT_SHOWN && (
          <button
            onClick={() => setShowAll(false)}
            className="py-1 text-center text-[11px] text-muted-foreground/60 transition-colors hover:text-muted-foreground"
          >
            Show less
          </button>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="h-2.5! w-2.5! border-indigo-500! bg-indigo-400!"
      />
    </div>
  )
}
