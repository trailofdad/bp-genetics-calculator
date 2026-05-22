import { useState, useMemo } from 'react'
import type { OffspringOutcome, ParentGenotype } from 'bp-genetics'
import { GENES } from 'bp-genetics'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ParentSelector } from '../../components/ParentSelector'
import type { SavedAnimal } from '../../hooks/useSavedAnimals'

interface Props {
  open: boolean
  offspring: OffspringOutcome | null
  savedAnimals: SavedAnimal[]
  onSaveAnimal: (name: string, genotype: ParentGenotype) => void
  onConfirm: (pairedWith: ParentGenotype, pairedWithName: string) => void
  onClose: () => void
}

type TabId = 'animals' | 'custom'

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
  savedAnimals,
  onSaveAnimal,
  onConfirm,
  onClose,
}: Props) {
  const defaultTab: TabId = savedAnimals.length > 0 ? 'animals' : 'custom'

  const [tab, setTab] = useState<TabId>(defaultTab)
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null)
  const [customGenotype, setCustomGenotype] = useState<ParentGenotype>({})
  const [customName, setCustomName] = useState('')

  const selectedAnimal = useMemo(
    () => savedAnimals.find((a) => a.id === selectedAnimalId) ?? null,
    [savedAnimals, selectedAnimalId]
  )

  function handleConfirm() {
    if (!offspring) return
    if (tab === 'animals' && selectedAnimal) {
      onConfirm(selectedAnimal.genotype, selectedAnimal.name)
    } else if (tab === 'custom') {
      const name = customName.trim()
      onSaveAnimal(name, customGenotype)
      onConfirm(customGenotype, name)
    }
  }

  const canConfirm =
    tab === 'animals' ? !!selectedAnimal : customName.trim() !== ''

  const tabs: { id: TabId; label: string }[] = [
    ...(savedAnimals.length > 0
      ? [{ id: 'animals' as TabId, label: '🐍 Saved Animals' }]
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
        className="max-w-md gap-0 overflow-hidden border border-white/10 bg-[#1c2333] p-0 text-slate-200 ring-0"
      >
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle className="text-sm leading-snug font-semibold text-white">
            Pair offspring
            <span className="ml-1.5 font-normal text-indigo-300">
              "{offspring?.label}"
            </span>
          </DialogTitle>
          <p className="mt-0.5 text-[11px] text-slate-500">
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
                  ? 'border-indigo-500/30 bg-indigo-500/20 text-indigo-300'
                  : 'border-white/5 bg-white/3 text-slate-500 hover:bg-white/6 hover:text-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex flex-col gap-3 px-5 pt-3 pb-5">
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
                        : 'border-white/5 bg-white/3 hover:bg-white/6'
                    }`}
                  >
                    <p className="text-xs font-medium text-slate-200">
                      {a.name}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-500">
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
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 transition-colors placeholder:text-slate-600 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none"
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
          <div className="flex items-center justify-end gap-2 border-t border-white/5 pt-1">
            <button
              onClick={onClose}
              className="rounded-xl border border-white/5 bg-white/5 px-4 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!canConfirm}
              className="rounded-xl border border-transparent bg-indigo-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-500 disabled:pointer-events-none disabled:opacity-40"
            >
              Add Branch
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
