import { createContext, useCallback, useContext, type ReactNode } from 'react'
import type { OffspringOutcome, ParentGenotype } from 'bp-genetics'
import { useSavedAnimals } from '../hooks/useSavedAnimals'
import { useSavedPairings } from '../hooks/useSavedPairings'
import { useSavedOffspring } from '../hooks/useSavedOffspring'
import { usePlaygroundProjects } from '../playground/usePlaygroundProjects'
import type { SavedAnimal } from '../hooks/useSavedAnimals'
import type { SavedPairing } from '../hooks/useSavedPairings'
import type { SavedOffspring } from '../hooks/useSavedOffspring'

interface AppContextValue {
  animals: SavedAnimal[]
  saveAnimal: (name: string, genotype: ParentGenotype) => void
  updateAnimal: (id: string, name: string, genotype: ParentGenotype) => void
  removeAnimal: (id: string) => void

  pairings: SavedPairing[]
  savePairing: (
    name: string,
    parent1: ParentGenotype,
    parent2: ParentGenotype,
    parent1AnimalId?: string,
    parent2AnimalId?: string
  ) => string
  updatePairing: (
    id: string,
    name: string,
    parent1: ParentGenotype,
    parent2: ParentGenotype,
    parent1AnimalId?: string,
    parent2AnimalId?: string
  ) => void
  removePairing: (id: string) => void
  updatePairingNotes: (id: string, notes: string) => void

  savedOffspring: SavedOffspring[]
  saveOffspring: (pairingId: string, outcome: OffspringOutcome) => string
  removeSavedOffspring: (id: string) => void

  projects: ReturnType<typeof usePlaygroundProjects>['projects']
  saveProject: ReturnType<typeof usePlaygroundProjects>['saveProject']
  removeProject: ReturnType<typeof usePlaygroundProjects>['removeProject']
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const { animals, saveAnimal, updateAnimal, removeAnimal } = useSavedAnimals()
  const {
    pairings,
    save,
    update,
    updateNotes,
    remove: removePairingEntry,
  } = useSavedPairings()
  const {
    savedOffspring,
    save: saveOffspring,
    remove: removeSavedOffspring,
    removeByPairing: removeSavedOffspringByPairing,
  } = useSavedOffspring()
  const { projects, saveProject, removeProject } = usePlaygroundProjects()

  const removePairing = useCallback(
    (id: string) => {
      removePairingEntry(id)
      removeSavedOffspringByPairing(id)
    },
    [removePairingEntry, removeSavedOffspringByPairing]
  )

  return (
    <AppContext.Provider
      value={{
        animals,
        saveAnimal,
        updateAnimal,
        removeAnimal,
        pairings,
        savePairing: save,
        updatePairing: update,
        removePairing,
        updatePairingNotes: updateNotes,
        savedOffspring,
        saveOffspring,
        removeSavedOffspring,
        projects,
        saveProject,
        removeProject,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppProvider')
  return ctx
}
