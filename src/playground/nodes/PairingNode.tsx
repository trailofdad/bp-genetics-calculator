import { useMemo, useState, useRef, useEffect } from 'react'
import { Handle, Position } from '@xyflow/react'
import { calculateOffspring, formatProbability } from 'bp-genetics'
import type { OffspringOutcome } from 'bp-genetics'
import type { PlaygroundNode } from '../types'
import { Badge } from '@/components/ui/badge'
import { buildCompactLabel, genotypeKey } from '../utils/compactLabel'

export interface PairingNodeData {
  node: PlaygroundNode
  onPairOffspring: (outcome: OffspringOutcome) => void
  onRenameOutcome: (genotypeKey: string, alias: string | null) => void
  isRoot: boolean
}

function probabilityBadgeClass(prob: number) {
  if (prob >= 0.5)
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
  if (prob >= 0.25)
    return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
  if (prob >= 0.125)
    return 'bg-violet-500/20 text-violet-300 border-violet-500/30'
  return 'bg-white/5 text-slate-400 border-white/10'
}

const MAX_SHOWN = 8

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
      onRename(gKey, null) // clear alias
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
        className="min-w-0 flex-1 rounded border border-indigo-500/40 bg-white/10 px-1.5 py-px text-[11px] text-slate-200 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none"
      />
    )
  }

  return (
    <span className="group/label flex min-w-0 items-center gap-1">
      <span className="truncate text-[11px] leading-snug text-slate-300">
        {alias ?? label}
        {alias && (
          <span className="ml-1 text-[9px] font-normal text-indigo-400/60">
            ✎
          </span>
        )}
      </span>
      <button
        onClick={startEdit}
        title="Rename this outcome"
        className="shrink-0 text-[10px] leading-none text-slate-600 opacity-0 transition-all group-hover/label:opacity-100 hover:text-indigo-400"
      >
        ✎
      </button>
    </span>
  )
}

export function PairingNode({ data }: { data: PairingNodeData }) {
  const { node, onPairOffspring, onRenameOutcome, isRoot } = data
  const [showAll, setShowAll] = useState(false)

  const outcomes = useMemo(
    () => calculateOffspring(node.parent1, node.parent2),
    [node.parent1, node.parent2]
  )

  const visible = showAll ? outcomes : outcomes.slice(0, MAX_SHOWN)
  const hiddenCount = outcomes.length - MAX_SHOWN

  const pairedChildGenotypes = new Set(
    node.childEdges.map((e) => JSON.stringify(e.offspringGenotype))
  )

  return (
    <div className="w-72 overflow-hidden rounded-2xl border border-white/10 bg-[#161b27] shadow-2xl">
      {/* Target handle — everything except root can receive edges */}
      {!isRoot && (
        <Handle
          type="target"
          position={Position.Top}
          className="!h-2.5 !w-2.5 !border-indigo-500 !bg-indigo-400"
        />
      )}

      {/* Header: parents */}
      <div className="border-b border-white/5 px-4 pt-3 pb-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs leading-snug font-semibold text-slate-200">
            {node.parent1Name}
          </span>
          <span className="text-xs text-slate-600">×</span>
          <span className="text-xs leading-snug font-semibold text-slate-200">
            {node.parent2Name}
          </span>
        </div>
        <p className="mt-0.5 text-[10px] text-slate-600">
          {outcomes.length} offspring outcomes
        </p>
      </div>

      {/* Offspring list */}
      <div className="flex flex-col gap-1 px-3 py-2">
        {visible.map((outcome, i) => {
          const alreadyPaired = pairedChildGenotypes.has(
            JSON.stringify(outcome.genotype)
          )
          const gKey = genotypeKey(outcome.genotype)
          const alias = node.offspringAliases?.[gKey]
          const compactLabel = buildCompactLabel(outcome.genotype)
          const showProbability = outcome.probability < 1

          return (
            <div
              key={i}
              className="group flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-white/3 px-2 py-1.5"
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
              {!outcome.hasLethal && (
                <button
                  onClick={() => onPairOffspring(outcome)}
                  title={
                    alreadyPaired
                      ? 'Already paired — add another'
                      : 'Pair this offspring'
                  }
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                    alreadyPaired
                      ? 'border border-indigo-500/40 bg-indigo-500/30 text-indigo-300 hover:bg-indigo-500/50'
                      : 'border border-white/10 bg-white/5 text-slate-500 opacity-0 group-hover:opacity-100 hover:border-indigo-500/30 hover:bg-indigo-500/20 hover:text-indigo-300'
                  }`}
                >
                  {alreadyPaired ? '↗' : '+'}
                </button>
              )}
            </div>
          )
        })}

        {!showAll && hiddenCount > 0 && (
          <button
            onClick={() => setShowAll(true)}
            className="py-1 text-center text-[11px] text-slate-600 transition-colors hover:text-slate-400"
          >
            +{hiddenCount} more outcomes
          </button>
        )}
        {showAll && outcomes.length > MAX_SHOWN && (
          <button
            onClick={() => setShowAll(false)}
            className="py-1 text-center text-[11px] text-slate-600 transition-colors hover:text-slate-400"
          >
            Show less
          </button>
        )}
      </div>

      {/* Source handle — child edges attach here */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2.5 !w-2.5 !border-indigo-500 !bg-indigo-400"
      />
    </div>
  )
}
