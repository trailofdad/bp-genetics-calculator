import { createContext, useCallback, useContext, type ReactNode } from 'react'
import type { OffspringOutcome, ParentGenotype } from 'bp-genetics'
import { useSavedAnimals } from '../hooks/useSavedAnimals'
import { useSavedPairings } from '../hooks/useSavedPairings'
import { useSavedOffspring } from '../hooks/useSavedOffspring'
import { useProjectGoals } from '../hooks/useProjectGoals'
import { useProjectsStorage } from '../projects/useProjectsStorage'
import type { SavedAnimal, AnimalSex } from '../hooks/useSavedAnimals'
import type { SavedPairing } from '../hooks/useSavedPairings'
import type { SavedOffspring } from '../hooks/useSavedOffspring'
import type { ProjectGoal } from '../hooks/useProjectGoals'

interface AppContextValue {
  animals: SavedAnimal[]
  saveAnimal: (name: string, genotype: ParentGenotype, sex?: AnimalSex) => void
  updateAnimal: (id: string, name: string, genotype: ParentGenotype, sex?: AnimalSex) => void
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

  projectGoals: ProjectGoal[]
  saveProjectGoal: (outcome: OffspringOutcome, pairingId?: string, pairingName?: string) => string
  removeProjectGoal: (id: string) => void
  removeProjectGoalByKey: (genotypeKey: string) => void
  toggleGoalAchieved: (id: string) => void

  projects: ReturnType<typeof useProjectsStorage>['projects']
  pairingIdToProjectId: ReturnType<typeof useProjectsStorage>['pairingIdToProjectId']
  saveProject: ReturnType<typeof useProjectsStorage>['saveProject']
  removeProject: ReturnType<typeof useProjectsStorage>['removeProject']
  loadProject: ReturnType<typeof useProjectsStorage>['loadProject']
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
  const {
    projectGoals,
    save: saveProjectGoal,
    remove: removeProjectGoal,
    removeByKey: removeProjectGoalByKey,
    removeByPairing: removeProjectGoalsByPairing,
    toggleAchieved: toggleGoalAchieved,
  } = useProjectGoals()
  const { projects, pairingIdToProjectId, saveProject, removeProject, loadProject } =
    useProjectsStorage()

  const removePairing = useCallback(
    (id: string) => {
      removePairingEntry(id)
      removeSavedOffspringByPairing(id)
      removeProjectGoalsByPairing(id)
    },
    [removePairingEntry, removeSavedOffspringByPairing, removeProjectGoalsByPairing]
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
        projectGoals,
        saveProjectGoal,
        removeProjectGoal,
        removeProjectGoalByKey,
        toggleGoalAchieved,
        projects,
        pairingIdToProjectId,
        saveProject,
        removeProject,
        loadProject,
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
