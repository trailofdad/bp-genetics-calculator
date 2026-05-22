import { useCallback, useState } from 'react'
import type { OffspringOutcome, ParentGenotype } from 'bp-genetics'
import { genotypeKey } from '../playground/utils/compactLabel'
import { loadFromStorage, persistToStorage } from '../lib/storage'

export interface SavedOffspring {
  id: string
  pairingId: string
  genotype: ParentGenotype
  genotypeKey: string
  label: string
  probability: number
  savedAt: string
}

const STORAGE_KEY = 'saved-offspring'

export function useSavedOffspring() {
  const [savedOffspring, setSavedOffspring] = useState<SavedOffspring[]>(() =>
    loadFromStorage<SavedOffspring>(STORAGE_KEY)
  )

  const save = useCallback(
    (pairingId: string, outcome: OffspringOutcome): string => {
      const outcomeKey = genotypeKey(outcome.genotype)
      const existing = savedOffspring.find(
        (entry) =>
          entry.pairingId === pairingId && entry.genotypeKey === outcomeKey
      )
      if (existing) return existing.id

      const entry: SavedOffspring = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        pairingId,
        genotype: { ...outcome.genotype } as ParentGenotype,
        genotypeKey: outcomeKey,
        label: outcome.label,
        probability: outcome.probability,
        savedAt: new Date().toISOString(),
      }

      setSavedOffspring((prev) => {
        const next = [entry, ...prev]
        persistToStorage(STORAGE_KEY, next)
        return next
      })

      return entry.id
    },
    [savedOffspring]
  )

  const remove = useCallback((id: string) => {
    setSavedOffspring((prev) => {
      const next = prev.filter((entry) => entry.id !== id)
      persistToStorage(STORAGE_KEY, next)
      return next
    })
  }, [])

  const removeByPairing = useCallback((pairingId: string) => {
    setSavedOffspring((prev) => {
      const next = prev.filter((entry) => entry.pairingId !== pairingId)
      persistToStorage(STORAGE_KEY, next)
      return next
    })
  }, [])

  return { savedOffspring, save, remove, removeByPairing }
}
