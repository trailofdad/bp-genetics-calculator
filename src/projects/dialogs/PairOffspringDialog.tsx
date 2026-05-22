import { useState, useMemo } from 'react'
import type { OffspringOutcome, ParentGenotype } from 'bp-genetics'
import { GENES, formatProbability } from 'bp-genetics'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ParentSelector } from '../../components/ParentSelector'
import { CodeForkIcon, XmarkIcon } from '../../components/icons/index'
import type { SavedAnimal } from '../../hooks/useSavedAnimals'

interface Props {
  open: boolean
  offspring: OffspringOutcome | null
  flaggedOffspring: (OffspringOutcome & { sourceLabel: string })[]
  savedAnimals: SavedAnimal[]
  onSaveAnimal: (name: string, genotype: ParentGenotype) => void
  onConfirm: (pairedWith: ParentGenotype, pairedWithName: string) => void
  onClose: () => void
}

type TabId = 'animals' | 'flagged' | 'custom'

function genotypePreview(genotype: ParentGenotype): string {
  const parts = Object.entries(genotype)
    .filter(([, c]) => c > 0)
    .map(([id, copies]) => {
      const gene = GENES.find((g) => g.id === id)
      if (!gene) return id
      const label = gene.name.length > 8 ? gene.shortName : gene.name
      return copies === 1 ? `Het ${label}` : label
    })
  return parts.length ? parts.join(', ') : 'Normal'
}

export function PairOffspringDialog({
  open,
  offspring,
  flaggedOffspring,
  savedAnimals,
  onSaveAnimal,
  onConfirm,
  onClose,
}: Props) {
  const defaultTab: TabId =
    savedAnimals.length > 0
      ? 'animals'
      : flaggedOffspring.length > 0
        ? 'flagged'
        : 'custom'

  const [tab, setTab] = useState<TabId>(defaultTab)
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null)
  const [selectedFlaggedKey, setSelectedFlaggedKey] = useState<string | null>(
    flaggedOffspring.length > 0
      ? JSON.stringify(flaggedOffspring[0].genotype)
      : null
  )
  const [customGenotype, setCustomGenotype] = useState<ParentGenotype>({})
  const [customName, setCustomName] = useState('')

  const selectedAnimal = useMemo(
    () => savedAnimals.find((a) => a.id === selectedAnimalId) ?? null,
    [savedAnimals, selectedAnimalId]
  )

  const selectedFlaggedOutcome = useMemo(
    () =>
      selectedFlaggedKey
        ? (flaggedOffspring.find(
            (o) => JSON.stringify(o.genotype) === selectedFlaggedKey
          ) ?? null)
        : null,
    [flaggedOffspring, selectedFlaggedKey]
  )

  function handleConfirm() {
    if (!offspring) return
    if (tab === 'flagged' && selectedFlaggedOutcome) {
      onConfirm(selectedFlaggedOutcome.genotype, selectedFlaggedOutcome.label)
    } else if (tab === 'animals' && selectedAnimal) {
      onConfirm(selectedAnimal.genotype, selectedAnimal.name)
    } else if (tab === 'custom') {
      const name = customName.trim()
      onSaveAnimal(name, customGenotype)
      onConfirm(customGenotype, name)
    }
  }

  const canConfirm =
    tab === 'flagged'
      ? !!selectedFlaggedOutcome
      : tab === 'animals'
        ? !!selectedAnimal
        : customName.trim() !== ''

  const tabs: { id: TabId; label: string }[] = [
    ...(savedAnimals.length > 0
      ? [{ id: 'animals' as TabId, label: '🐍 Saved Animals' }]
      : []),
    ...(flaggedOffspring.length > 0
      ? [{ id: 'flagged' as TabId, label: '★ Flagged' }]
      : []),
    { id: 'custom', label: '✎ New Animal' },
  ]

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose()
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-w-md gap-0 overflow-hidden border border-border bg-card p-0 text-foreground ring-0"
      >
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle className="text-sm leading-snug font-semibold text-foreground">
            Pair offspring
            <span className="ml-1.5 font-normal text-indigo-600 dark:text-indigo-300">
              "{offspring?.label}"
            </span>
          </DialogTitle>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Choose a mate to branch the breeding tree.
          </p>
        </DialogHeader>

        {/* Tab bar */}
        <div className="flex gap-1 px-5 pt-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === t.id
                  ? 'border-indigo-500/30 bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
                  : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex flex-col gap-3 px-5 pt-3 pb-5">
          {/* Flagged Offspring */}
          {tab === 'flagged' && (
            <ScrollArea className="h-52">
              <div className="flex flex-col gap-1.5 pr-2">
                {flaggedOffspring.map((o) => {
                  const key = JSON.stringify(o.genotype)
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedFlaggedKey(key)}
                      className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
                        selectedFlaggedKey === key
                          ? 'border-amber-500/40 bg-amber-500/15'
                          : 'border-border bg-muted/20 hover:bg-muted/40'
                      }`}
                    >
                      <p className="text-xs font-medium text-foreground">
                        {o.label}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {o.probability < 1
                          ? formatProbability(o.probability)
                          : '100%'}
                        <span className="ml-1.5 text-muted-foreground/60">
                          from {o.sourceLabel}
                        </span>
                      </p>
                    </button>
                  )
                })}
              </div>
            </ScrollArea>
          )}

          {/* Saved Animals */}
          {tab === 'animals' && (
            <ScrollArea className="h-52">
              <div className="flex flex-col gap-1.5 pr-2">
                {savedAnimals.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setSelectedAnimalId(a.id)}
                    className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
                      selectedAnimalId === a.id
                        ? 'border-indigo-500/40 bg-indigo-500/15'
                      : 'border-border bg-muted/20 hover:bg-muted/40'
                    }`}
                  >
                    <p className="text-xs font-medium text-foreground">
                      {a.name}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {genotypePreview(a.genotype)}
                    </p>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* New Animal */}
          {tab === 'custom' && (
            <>
              <input
                type="text"
                placeholder="Animal name (required)…"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-foreground transition-colors placeholder:text-muted-foreground/60 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none"
                autoFocus
              />
              <ScrollArea className="h-44">
                <div className="pr-2">
                  <ParentSelector
                    parentLabel="Mate"
                    parentSex="♂/♀"
                    genotype={customGenotype}
                    onChange={setCustomGenotype}
                  />
                </div>
              </ScrollArea>
            </>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2 border-t border-border pt-1">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/30 px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <XmarkIcon className="h-3.5 w-3.5" />
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!canConfirm}
              className="inline-flex items-center gap-1.5 rounded-xl border border-transparent bg-indigo-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-500 disabled:pointer-events-none disabled:opacity-40"
            >
              <CodeForkIcon className="h-3.5 w-3.5" />
              Add Branch
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
