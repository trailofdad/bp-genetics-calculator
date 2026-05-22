import { useState, useCallback } from 'react'
import type { ParentGenotype } from 'bp-genetics'

export interface SavedPairing {
  id: string
  name: string
  parent1: ParentGenotype
  parent2: ParentGenotype
  parent1AnimalId?: string
  parent2AnimalId?: string
  notes?: string
  savedAt: string
}

const STORAGE_KEY = 'saved-pairings'

function load(): SavedPairing[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SavedPairing[]) : []
  } catch {
    return []
  }
}

function persist(pairings: SavedPairing[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pairings))
  } catch {
    // ignore
  }
}

export function useSavedPairings() {
  const [pairings, setPairings] = useState<SavedPairing[]>(load)

  const save = useCallback(
    (
      name: string,
      parent1: ParentGenotype,
      parent2: ParentGenotype,
      parent1AnimalId?: string,
      parent2AnimalId?: string
    ) => {
      const entry: SavedPairing = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: name.trim() || 'Untitled Pairing',
        parent1,
        parent2,
        parent1AnimalId,
        parent2AnimalId,
        savedAt: new Date().toISOString(),
      }
      setPairings((prev) => {
        const next = [entry, ...prev]
        persist(next)
        return next
      })
    },
    []
  )

  const update = useCallback(
    (
      id: string,
      name: string,
      parent1: ParentGenotype,
      parent2: ParentGenotype,
      parent1AnimalId?: string,
      parent2AnimalId?: string
    ) => {
      setPairings((prev) => {
        const next = prev.map((p) =>
          p.id === id
            ? {
                ...p,
                name: name.trim() || 'Untitled Pairing',
                parent1,
                parent2,
                parent1AnimalId,
                parent2AnimalId,
              }
            : p
        )
        persist(next)
        return next
      })
    },
    []
  )

  const updateNotes = useCallback((id: string, notes: string) => {
    setPairings((prev) => {
      const next = prev.map((p) =>
        p.id === id ? { ...p, notes: notes.trim() || undefined } : p
      )
      persist(next)
      return next
    })
  }, [])

  const remove = useCallback((id: string) => {
    setPairings((prev) => {
      const next = prev.filter((p) => p.id !== id)
      persist(next)
      return next
    })
  }, [])

  return { pairings, save, update, updateNotes, remove }
}
