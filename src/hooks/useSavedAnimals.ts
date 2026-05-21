import { useState, useCallback } from 'react';
import type { ParentGenotype } from 'bp-genetics';

export interface SavedAnimal {
  id: string;
  name: string;
  genotype: ParentGenotype;
  savedAt: string;
}

const STORAGE_KEY = 'saved-animals';

function load(): SavedAnimal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedAnimal[]) : [];
  } catch {
    return [];
  }
}

function persist(animals: SavedAnimal[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(animals));
  } catch {
    // ignore quota errors
  }
}

export function useSavedAnimals() {
  const [animals, setAnimals] = useState<SavedAnimal[]>(load);

  const saveAnimal = useCallback((name: string, genotype: ParentGenotype) => {
    const entry: SavedAnimal = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim() || 'Untitled Animal',
      genotype,
      savedAt: new Date().toISOString(),
    };
    setAnimals(prev => {
      const next = [entry, ...prev];
      persist(next);
      return next;
    });
  }, []);

  const updateAnimal = useCallback((id: string, name: string, genotype: ParentGenotype) => {
    setAnimals(prev => {
      const next = prev.map(a =>
        a.id === id ? { ...a, name: name.trim() || 'Untitled Animal', genotype } : a
      );
      persist(next);
      return next;
    });
  }, []);

  const removeAnimal = useCallback((id: string) => {
    setAnimals(prev => {
      const next = prev.filter(a => a.id !== id);
      persist(next);
      return next;
    });
  }, []);

  return { animals, saveAnimal, updateAnimal, removeAnimal };
}
