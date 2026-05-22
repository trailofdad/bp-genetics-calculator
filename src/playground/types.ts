import type { ParentGenotype } from 'bp-genetics'

export interface PlaygroundNode {
  id: string
  parent1: ParentGenotype
  parent1Name: string
  parent2: ParentGenotype
  parent2Name: string
  /** Each entry = one offspring genotype the user chose to extend into a new pairing */
  childEdges: PlaygroundEdge[]
  /** User-supplied aliases keyed by genotypeKey(outcome.genotype). null removes an alias. */
  offspringAliases?: Record<string, string>
}

export interface PlaygroundEdge {
  id: string
  /** The offspring genotype — becomes the first parent of the child node */
  offspringGenotype: ParentGenotype
  offspringLabel: string
  offspringProbability: number
  childNodeId: string
}

export interface PlaygroundProject {
  id: string
  name: string
  rootNodeId: string
  /** Flat map of all nodes so we can update any node without deep cloning */
  nodes: Record<string, PlaygroundNode>
  savedAt: string
}
