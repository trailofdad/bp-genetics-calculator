import { useMemo, useState } from 'react'
import { AlertTriangle, Dna, Info, Star, Target } from 'lucide-react'
import type { OffspringOutcome } from 'bp-genetics'
import { formatProbability } from 'bp-genetics'
import { GENES, geneById } from 'bp-genetics'
import { genotypeKey } from '../projects/utils/compactLabel'
import { Tooltip } from './ui/tooltip'

interface Props {
  outcomes: OffspringOutcome[]
  onSaveOffspring?: (outcome: OffspringOutcome) => void
  savedOutcomeIds?: Set<string>
  savedOutcomeKeys?: Set<string>
  onToggleGoal?: (outcome: OffspringOutcome) => void
  goalOutcomeKeys?: Set<string>
}

type SortKey = 'probability' | 'label' | 'traits'

function cardAccent(prob: number): { border: string; bar: string } {
  if (prob >= 0.5)
    return { border: 'border-emerald-500/20', bar: 'bg-emerald-500' }
  if (prob >= 0.25)
    return { border: 'border-indigo-500/20', bar: 'bg-indigo-500' }
  if (prob >= 0.125)
    return { border: 'border-violet-500/20', bar: 'bg-violet-500' }
  return { border: 'border-border', bar: 'bg-slate-600' }
}

function GeneTag({ geneId, copies }: { geneId: string; copies: 0 | 1 | 2 }) {
  const gene = geneById(geneId)
  if (!gene || copies === 0) return null

  const isVisual = copies === 2
  const isCodominant = gene.type === 'codominant'

  let cls = 'bg-amber-500/15 text-amber-300 border border-amber-500/20'
  let label = `Het ${gene.name}`

  if (isVisual && isCodominant) {
    cls = 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/20'
    label = gene.superName ?? `Super ${gene.name}`
  } else if (isVisual) {
    cls = 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
    label = gene.name
  } else if (isCodominant) {
    cls = 'bg-sky-500/15 text-sky-300 border border-sky-500/20'
    label = gene.name
  }

  return (
    <span
      className={`inline-block rounded px-2 py-px text-[11px] font-medium ${cls}`}
    >
      {label}
    </span>
  )
}

export function ResultsDisplay({
  outcomes,
  onSaveOffspring,
  savedOutcomeIds,
  savedOutcomeKeys,
  onToggleGoal,
  goalOutcomeKeys,
}: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('probability')
  const [showLethal, setShowLethal] = useState(true)

  const savedKeys = savedOutcomeKeys ?? savedOutcomeIds

  const totalGenes = useMemo(
    () => [...new Set(outcomes.flatMap((o) => Object.keys(o.genotype)))],
    [outcomes]
  )

  const sorted = useMemo(() => {
    const list = showLethal ? outcomes : outcomes.filter((o) => !o.hasLethal)
    if (sortKey === 'label')
      return [...list].sort((a, b) => a.label.localeCompare(b.label))
    if (sortKey === 'traits') {
      return [...list].sort((a, b) => {
        const countA = Object.values(a.genotype).filter((c) => c > 0).length
        const countB = Object.values(b.genotype).filter((c) => c > 0).length
        return countB - countA || b.probability - a.probability
      })
    }
    return [...list].sort((a, b) => b.probability - a.probability)
  }, [outcomes, sortKey, showLethal])

  const totalProb = sorted.reduce((s, o) => s + o.probability, 0)

  if (outcomes.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground/40">
        <Dna className="mx-auto mb-3 h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
        <p className="text-sm">
          Select genes above to see offspring probabilities
        </p>
      </div>
    )
  }

  const hasLethalOutcomes = outcomes.some((o) => o.hasLethal)
  const normalOutcome = sorted.find((o) => o.label === 'Normal')

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
          <span className="text-sm font-semibold text-foreground/80">
            {sorted.length}
          </span>
          unique outcomes
          {normalOutcome && (
            <span className="text-muted-foreground/40">
              · {formatProbability(normalOutcome.probability)} normal
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasLethalOutcomes && (
            <label className="flex cursor-pointer items-center gap-1.5 text-xs text-rose-400/80 select-none">
              <input
                type="checkbox"
                checked={showLethal}
                onChange={(e) => setShowLethal(e.target.checked)}
                className="accent-rose-500"
              />
              Show lethals
            </label>
          )}
          <div className="flex gap-1">
            {(['probability', 'traits', 'label'] as SortKey[]).map((k) => (
              <button
                key={k}
                onClick={() => setSortKey(k)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  sortKey === k
                    ? 'border border-indigo-500/30 bg-indigo-500/20 text-indigo-300'
                    : 'border border-border bg-muted/50 text-muted-foreground/60 hover:bg-muted hover:text-foreground/80'
                }`}
              >
                {k === 'probability'
                  ? 'By %'
                  : k === 'traits'
                    ? 'By traits'
                    : 'A–Z'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        {sorted.map((outcome) => {
          const { border, bar } = cardAccent(outcome.probability)
          const pct = outcome.probability / totalProb
          const gKey = genotypeKey(outcome.genotype)
          const isSaved = savedKeys?.has(gKey) ?? false
          const isGoal = goalOutcomeKeys?.has(gKey) ?? false

          return (
            <div
              key={gKey}
              className={`relative overflow-hidden rounded-xl border bg-muted/30 px-4 py-3 ${border} ${
                outcome.hasLethal ? 'opacity-50' : ''
              }`}
            >
              <div
                className={`absolute top-0 bottom-0 left-0 ${bar} opacity-10`}
                style={{ width: `${pct * 100}%` }}
              />
              <div className="relative flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1.5">
                  {outcome.comboNames.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {outcome.comboNames.map((name) => (
                        <span
                          key={name}
                          className="inline-block rounded-md border border-emerald-500/25 bg-emerald-500/15 px-2 py-px text-[11px] font-semibold text-emerald-300"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-sm leading-snug font-medium text-foreground">
                    {outcome.label}
                    {outcome.hasLethal && (
                      <span className="ml-2 text-[11px] font-normal text-rose-400/80">
                        <AlertTriangle className="mr-0.5 inline h-3 w-3" strokeWidth={1.75} />
                        lethal
                      </span>
                    )}
                    {outcome.hasRisk && !outcome.hasLethal && (
                      <span className="ml-2 text-[11px] font-normal text-orange-400/80">
                        <AlertTriangle className="mr-0.5 inline h-3 w-3" strokeWidth={1.75} />
                        risky
                      </span>
                    )}
                  </p>
                  {totalGenes.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(outcome.genotype)
                        .filter(([, c]) => c > 0)
                        .map(([geneId, copies]) => (
                          <GeneTag
                            key={geneId}
                            geneId={geneId}
                            copies={copies as 0 | 1 | 2}
                          />
                        ))}
                      {Object.values(outcome.genotype).every((c) => c === 0) && (
                        <span className="text-xs text-muted-foreground/40">
                          No visible morphs
                        </span>
                      )}
                    </div>
                  )}
                  {outcome.notes.length > 0 && (
                    <ul className="mt-0.5 flex flex-col gap-0.5">
                      {outcome.notes.map((note, ni) => (
                        <li
                          key={ni}
                          className="flex items-start gap-1 text-[11px] text-indigo-400/80"
                        >
                          <Info className="mt-px h-3 w-3 shrink-0" strokeWidth={1.75} />
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {outcome.risks.length > 0 && (
                    <ul className="mt-0.5 flex flex-col gap-0.5">
                      {outcome.risks.map((risk, ri) => (
                        <li
                          key={ri}
                          className="flex items-start gap-1 text-[11px] text-orange-400/70"
                        >
                          <AlertTriangle className="mt-px h-3 w-3 shrink-0" strokeWidth={1.75} />
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-base font-semibold text-foreground/80 tabular-nums">
                    {formatProbability(outcome.probability)}
                  </span>
                  {onToggleGoal && (
                    <Tooltip
                      content={isGoal ? 'Remove standalone goal' : 'Save as standalone goal — not linked to any project'}
                      side="top"
                    >
                      <button
                        onClick={() => onToggleGoal(outcome)}
                        className={`flex h-7 w-7 items-center justify-center rounded-full border text-sm transition-colors ${
                          isGoal
                            ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                            : 'border-border bg-muted/50 text-muted-foreground/60 hover:border-emerald-500/25 hover:bg-emerald-500/10 hover:text-emerald-300'
                        }`}
                      >
                        <Target className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </button>
                    </Tooltip>
                  )}
                  {onSaveOffspring && (
                    <button
                      onClick={() => onSaveOffspring(outcome)}
                      title={
                        isSaved ? 'Remove saved offspring' : 'Save offspring'
                      }
                      className={`flex h-7 w-7 items-center justify-center rounded-full border text-sm transition-colors ${
                        isSaved
                          ? 'border-amber-500/30 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
                          : 'border-border bg-muted/50 text-muted-foreground/60 hover:border-amber-500/25 hover:bg-amber-500/10 hover:text-amber-300'
                      }`}
                    >
                      {isSaved ? (
                        <Star className="h-3.5 w-3.5 fill-current" strokeWidth={1.75} />
                      ) : (
                        <Star className="h-3.5 w-3.5" strokeWidth={1.75} />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {totalGenes.length > 0 && (
        <div className="mt-1 rounded-xl border border-border bg-muted/20 p-3">
          <p className="mb-2 text-[10px] font-semibold tracking-widest text-muted-foreground/40 uppercase">
            Gene Key
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {totalGenes.map((geneId) => {
              const gene = GENES.find((g) => g.id === geneId)
              if (!gene) return null
              return (
                <span key={geneId} className="text-[11px] text-muted-foreground/60">
                  <span className="font-semibold text-muted-foreground">
                    {gene.shortName}
                  </span>{' '}
                  = {gene.name}
                  {gene.type === 'codominant' && gene.superName && (
                    <span className="text-muted-foreground/40">
                      {' '}
                      · super: {gene.superName}
                    </span>
                  )}
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
