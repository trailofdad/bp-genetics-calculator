import { useState, useCallback } from 'react'
import { ArrowRight, X } from 'lucide-react'
import { GENES } from 'bp-genetics'
import type { ParentGenotype } from 'bp-genetics'
import { importCSV } from '../utils/csvImport'
import type { ImportedAnimal } from '../utils/csvImport'

interface Props {
  open: boolean
  onClose: () => void
  onLoadParent?: (genotype: ParentGenotype, slot: 'parent1' | 'parent2') => void
  onSaveAnimal: (name: string, genotype: ParentGenotype) => void
}

// ─── Small helpers ─────────────────────────────────────────────────────────────

const SEX_LABEL: Record<string, string> = { M: '♂', F: '♀', Unknown: '?' }

function GeneChip({ geneId, copies }: { geneId: string; copies: 1 | 2 }) {
  const gene = GENES.find((g) => g.id === geneId)
  const label = gene ? gene.name : geneId
  const isRec = gene?.type === 'recessive'
  const isHet = copies === 1

  const color = isHet
    ? isRec
      ? 'bg-violet-900/40 text-violet-300 border-violet-700/30'
      : 'bg-sky-900/40 text-sky-300 border-sky-700/30'
    : isRec
      ? 'bg-violet-700/50 text-violet-200 border-violet-500/40'
      : 'bg-sky-700/50 text-sky-200 border-sky-500/40'

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[10px] ${color}`}
    >
      {label}
      {isHet && <span className="text-[9px] opacity-60">het</span>}
    </span>
  )
}

function AnimalCard({
  animal,
  onLoad1,
  onLoad2,
  onSave,
}: {
  animal: ImportedAnimal
  onLoad1?: () => void
  onLoad2?: () => void
  onSave: () => void
}) {
  const activeGenes = Object.entries(animal.genotype).filter(([, c]) => c > 0)

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              {animal.name}
            </span>
            <span className="text-xs text-muted-foreground/60">
              {SEX_LABEL[animal.sex]}
            </span>
            {animal.dob && (
              <span className="font-mono text-[10px] text-muted-foreground/40">
                {animal.dob}
              </span>
            )}
          </div>
          <div className="mt-0.5 text-[10px] text-muted-foreground/40">
            {animal.sourceId}
          </div>
        </div>
      </div>

      {/* Raw traits */}
      <p className="text-[10px] leading-relaxed text-muted-foreground/60">
        {animal.rawTraits}
      </p>

      {/* Gene chips */}
      {activeGenes.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {activeGenes.map(([id, copies]) => (
            <GeneChip key={id} geneId={id} copies={copies as 1 | 2} />
          ))}
        </div>
      )}

      {/* Possible hets (pos het — unconfirmed) */}
      {animal.possibleHets.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[10px] text-yellow-500/70">
            Pos het (unconfirmed):
          </span>
          {animal.possibleHets.map((name, i) => (
            <span
              key={i}
              className="inline-flex items-center rounded border border-yellow-700/20 bg-yellow-900/20 px-1.5 py-0.5 text-[10px] text-yellow-400"
            >
              {name}
            </span>
          ))}
          <span className="ml-0.5 text-[10px] text-yellow-600/60">
            · not saved to genotype
          </span>
        </div>
      )}

      {/* Unrecognized tokens */}
      {animal.unrecognized.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[10px] text-amber-500/70">Unrecognized:</span>
          {animal.unrecognized.map((u, i) => (
            <span
              key={i}
              className="inline-flex items-center rounded border border-amber-700/20 bg-amber-900/20 px-1.5 py-0.5 text-[10px] text-amber-400"
            >
              {u}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        {onLoad1 && (
          <button
            onClick={onLoad1}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span>Sire</span>
          </button>
        )}
        {onLoad2 && (
          <button
            onClick={onLoad2}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span>Dam</span>
          </button>
        )}
        <button
          onClick={onSave}
          className="rounded-lg border border-indigo-500/20 bg-indigo-600/30 px-3 py-1.5 text-xs text-indigo-300 transition-colors hover:bg-indigo-600/50 hover:text-indigo-200"
        >
          Save
        </button>
      </div>
    </div>
  )
}

// ─── Main modal ────────────────────────────────────────────────────────────────

export function ImportModal({
  open,
  onClose,
  onLoadParent,
  onSaveAnimal,
}: Props) {
  const [csv, setCsv] = useState('')
  const [animals, setAnimals] = useState<ImportedAnimal[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [formatLabel, setFormatLabel] = useState<string | null>(null)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())

  const parse = useCallback((text: string) => {
    setCsv(text)
    if (!text.trim()) {
      setAnimals([])
      setErrorMsg(null)
      setFormatLabel(null)
      return
    }
    const result = importCSV(text)
    if ('error' in result) {
      setErrorMsg(result.error)
      setAnimals([])
      setFormatLabel(null)
    } else {
      setErrorMsg(null)
      setAnimals(result.animals)
      setFormatLabel(
        result.format === 'cltch' ? 'CLTCH Export' : 'MorphMarket Export'
      )
    }
  }, [])

  function handleSave(animal: ImportedAnimal) {
    onSaveAnimal(animal.name, animal.genotype)
    setSavedIds((prev) => new Set([...prev, animal.sourceId]))
  }

  function handleLoad(animal: ImportedAnimal, slot: 'parent1' | 'parent2') {
    onLoadParent?.(animal.genotype, slot)
    onClose()
  }

  function handleClose() {
    setCsv('')
    setAnimals([])
    setErrorMsg(null)
    setFormatLabel(null)
    setSavedIds(new Set())
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Import from CLTCH / MorphMarket
            </h2>
            {formatLabel && (
              <span className="mt-0.5 block text-[10px] text-emerald-400">
                Detected: {formatLabel}
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-muted-foreground/60 transition-colors hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* Input area */}
        <div className="flex flex-shrink-0 flex-col gap-3 border-b border-border px-6 py-4">
          <textarea
            value={csv}
            onChange={(e) => parse(e.target.value)}
            placeholder={`Paste CLTCH or MorphMarket CSV here…\n\nCLTCH format starts with: Animal_Id,Sex,Morphs,…\nMorphMarket format starts with: Category,Animal_ID,Title,Traits,…`}
            rows={4}
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs text-foreground/80 placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none"
          />
          {errorMsg && <p className="text-xs text-red-400">{errorMsg}</p>}
        </div>

        {/* Results */}
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-6 py-4">
          {animals.length === 0 && !errorMsg && (
            <p className="py-8 text-center text-xs text-muted-foreground/40">
              Paste a CSV above to see animals here.
            </p>
          )}
          {animals.map((animal) => (
            <AnimalCard
              key={animal.sourceId}
              animal={animal}
              onLoad1={
                onLoadParent ? () => handleLoad(animal, 'parent1') : undefined
              }
              onLoad2={
                onLoadParent ? () => handleLoad(animal, 'parent2') : undefined
              }
              onSave={() => handleSave(animal)}
            />
          ))}
        </div>

        {/* Footer */}
        {animals.length > 0 && (
          <div className="flex flex-shrink-0 items-center justify-between border-t border-border px-6 py-3">
            <span className="text-xs text-muted-foreground/60">
              {animals.length} animal{animals.length !== 1 ? 's' : ''} found
              {savedIds.size > 0 && ` · ${savedIds.size} saved`}
            </span>
            <button
              onClick={() => {
                animals.forEach((a) => {
                  if (!savedIds.has(a.sourceId))
                    onSaveAnimal(a.name, a.genotype)
                })
                handleClose()
              }}
              className="rounded-lg border border-indigo-500/20 bg-indigo-600/30 px-3 py-1.5 text-xs text-indigo-300 transition-colors hover:bg-indigo-600/50 hover:text-indigo-200"
            >
              Save all
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
