import { useCallback, useState } from 'react'
import type { OffspringOutcome, ParentGenotype } from 'bp-genetics'
import { genotypeKey } from '../projects/utils/compactLabel'
import { loadFromStorage, persistToStorage } from '../lib/storage'

export interface ProjectGoal {
  id: string
  genotype: ParentGenotype
  genotypeKey: string
  label: string
  probability?: number
  achieved: boolean
  pairingId?: string
  pairingName?: string
  savedAt: string
}

const STORAGE_KEY = 'project-goals'

export function useProjectGoals() {
  const [projectGoals, setProjectGoals] = useState<ProjectGoal[]>(() =>
    loadFromStorage<ProjectGoal>(STORAGE_KEY)
  )

  const save = useCallback(
    (outcome: OffspringOutcome, pairingId?: string, pairingName?: string): string => {
      const key = genotypeKey(outcome.genotype)
      const existing = projectGoals.find((g) => g.genotypeKey === key)
      if (existing) return existing.id

      const entry: ProjectGoal = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        genotype: { ...outcome.genotype } as ParentGenotype,
        genotypeKey: key,
        label: outcome.label,
        probability: outcome.probability,
        achieved: false,
        pairingId,
        pairingName,
        savedAt: new Date().toISOString(),
      }

      setProjectGoals((prev) => {
        const next = [entry, ...prev]
        persistToStorage(STORAGE_KEY, next)
        return next
      })

      return entry.id
    },
    [projectGoals]
  )

  const remove = useCallback((id: string) => {
    setProjectGoals((prev) => {
      const next = prev.filter((g) => g.id !== id)
      persistToStorage(STORAGE_KEY, next)
      return next
    })
  }, [])

  const removeByKey = useCallback((key: string) => {
    setProjectGoals((prev) => {
      const next = prev.filter((g) => g.genotypeKey !== key)
      persistToStorage(STORAGE_KEY, next)
      return next
    })
  }, [])

  const removeByPairing = useCallback((pairingId: string) => {
    setProjectGoals((prev) => {
      const next = prev.filter((g) => g.pairingId !== pairingId)
      persistToStorage(STORAGE_KEY, next)
      return next
    })
  }, [])

  const toggleAchieved = useCallback((id: string) => {
    setProjectGoals((prev) => {
      const next = prev.map((g) =>
        g.id === id ? { ...g, achieved: !g.achieved } : g
      )
      persistToStorage(STORAGE_KEY, next)
      return next
    })
  }, [])

  return { projectGoals, save, remove, removeByKey, removeByPairing, toggleAchieved }
}
