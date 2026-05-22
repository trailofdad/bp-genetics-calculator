import { useCallback, useState } from 'react'
import type { OffspringOutcome, ParentGenotype } from 'bp-genetics'
import { genotypeKey } from '../playground/utils/compactLabel'

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

function load(): SavedOffspring[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SavedOffspring[]) : []
  } catch {
    return []
  }
}

function persist(savedOffspring: SavedOffspring[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedOffspring))
  } catch {
    // ignore
  }
}

export function useSavedOffspring() {
  const [savedOffspring, setSavedOffspring] = useState<SavedOffspring[]>(load)

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
        persist(next)
        return next
      })

      return entry.id
    },
    [savedOffspring]
  )

  const remove = useCallback((id: string) => {
    setSavedOffspring((prev) => {
      const next = prev.filter((entry) => entry.id !== id)
      persist(next)
      return next
    })
  }, [])

  const removeByPairing = useCallback((pairingId: string) => {
    setSavedOffspring((prev) => {
      const next = prev.filter((entry) => entry.pairingId !== pairingId)
      persist(next)
      return next
    })
  }, [])

  return { savedOffspring, save, remove, removeByPairing }
}
