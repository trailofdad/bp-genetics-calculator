import { useState, useCallback } from 'react'
import type { ParentGenotype } from 'bp-genetics'
import { loadFromStorage, persistToStorage } from '../lib/storage'

export interface SavedAnimal {
  id: string
  name: string
  genotype: ParentGenotype
  savedAt: string
}

const STORAGE_KEY = 'saved-animals'

export function useSavedAnimals() {
  const [animals, setAnimals] = useState<SavedAnimal[]>(() =>
    loadFromStorage<SavedAnimal>(STORAGE_KEY)
  )

  const saveAnimal = useCallback((name: string, genotype: ParentGenotype) => {
    const entry: SavedAnimal = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim() || 'Untitled Animal',
      genotype,
      savedAt: new Date().toISOString(),
    }
    setAnimals((prev) => {
      const next = [entry, ...prev]
      persistToStorage(STORAGE_KEY, next)
      return next
    })
  }, [])

  const updateAnimal = useCallback(
    (id: string, name: string, genotype: ParentGenotype) => {
      setAnimals((prev) => {
        const next = prev.map((a) =>
          a.id === id
            ? { ...a, name: name.trim() || 'Untitled Animal', genotype }
            : a
        )
        persistToStorage(STORAGE_KEY, next)
        return next
      })
    },
    []
  )

  const removeAnimal = useCallback((id: string) => {
    setAnimals((prev) => {
      const next = prev.filter((a) => a.id !== id)
      persistToStorage(STORAGE_KEY, next)
      return next
    })
  }, [])

  return { animals, saveAnimal, updateAnimal, removeAnimal }
}
