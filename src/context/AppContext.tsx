import { createContext, useContext, type ReactNode } from 'react';
import { useSavedAnimals } from '../hooks/useSavedAnimals';
import { useSavedPairings } from '../hooks/useSavedPairings';
import { usePlaygroundProjects } from '../playground/usePlaygroundProjects';
import type { SavedAnimal } from '../hooks/useSavedAnimals';
import type { SavedPairing } from '../hooks/useSavedPairings';
import type { ParentGenotype } from 'bp-genetics';

interface AppContextValue {
  animals: SavedAnimal[];
  saveAnimal: (name: string, genotype: ParentGenotype) => void;
  updateAnimal: (id: string, name: string, genotype: ParentGenotype) => void;
  removeAnimal: (id: string) => void;

  pairings: SavedPairing[];
  savePairing: (
    name: string,
    parent1: ParentGenotype,
    parent2: ParentGenotype,
    parent1AnimalId?: string,
    parent2AnimalId?: string,
  ) => void;
  updatePairing: (
    id: string,
    name: string,
    parent1: ParentGenotype,
    parent2: ParentGenotype,
    parent1AnimalId?: string,
    parent2AnimalId?: string,
  ) => void;
  removePairing: (id: string) => void;
  updatePairingNotes: (id: string, notes: string) => void;

  saveProject: ReturnType<typeof usePlaygroundProjects>['saveProject'];
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { animals, saveAnimal, updateAnimal, removeAnimal } = useSavedAnimals();
  const { pairings, save, update, updateNotes, remove } = useSavedPairings();
  const { saveProject } = usePlaygroundProjects();

  return (
    <AppContext.Provider value={{
      animals,
      saveAnimal,
      updateAnimal,
      removeAnimal,
      pairings,
      savePairing: save,
      updatePairing: update,
      removePairing: remove,
      updatePairingNotes: updateNotes,
      saveProject,
    }}>
      {children}
    </AppContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
