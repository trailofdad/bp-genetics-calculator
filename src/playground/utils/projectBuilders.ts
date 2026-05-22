import type { SavedAnimal } from '../../hooks/useSavedAnimals'
import type { SavedOffspring } from '../../hooks/useSavedOffspring'
import type { SavedPairing } from '../../hooks/useSavedPairings'
import type { PlaygroundProject } from '../types'

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export function buildProjectFromPairing(
  pairing: SavedPairing,
  animals: SavedAnimal[]
): PlaygroundProject {
  const rootNodeId = `${makeId()}-root`
  return {
    id: makeId(),
    name: pairing.name,
    rootNodeId,
    nodes: {
      [rootNodeId]: {
        id: rootNodeId,
        pairingId: pairing.id,
        parent1: pairing.parent1,
        parent1Name:
          animals.find((a) => a.id === pairing.parent1AnimalId)?.name ??
          'Parent 1',
        parent2: pairing.parent2,
        parent2Name:
          animals.find((a) => a.id === pairing.parent2AnimalId)?.name ??
          'Parent 2',
        childEdges: [],
      },
    },
    savedAt: new Date().toISOString(),
  }
}

export function buildProjectFromSavedOffspring(
  pairing: SavedPairing,
  offspring: SavedOffspring,
  animals: SavedAnimal[]
): PlaygroundProject {
  const rootNodeId = `${makeId()}-root`
  const mateName =
    animals.find((a) => a.id === pairing.parent2AnimalId)?.name ?? 'Parent 2'
  return {
    id: makeId(),
    name: `${offspring.label} × ${mateName}`,
    rootNodeId,
    nodes: {
      [rootNodeId]: {
        id: rootNodeId,
        pairingId: pairing.id,
        parent1: offspring.genotype,
        parent1Name: offspring.label,
        parent2: pairing.parent2,
        parent2Name: mateName,
        childEdges: [],
      },
    },
    savedAt: new Date().toISOString(),
  }
}
