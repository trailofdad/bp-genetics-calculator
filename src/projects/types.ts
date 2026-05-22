import type { ParentGenotype } from 'bp-genetics'

// ---------------------------------------------------------------------------
// Flat, DB-friendly row types
// Each interface maps 1:1 to a future database table.
// The in-memory BreedingProject/ProjectNode types below are composed
// from these rows at query time — replace the compose/decompose helpers in
// useProjectsStorage.ts with DB queries when migrating.
// ---------------------------------------------------------------------------

/** projects table */
export interface ProjectRow {
  id: string
  name: string
  rootNodeId: string
  savedAt: string
}

/** nodes table — one row per pairing node */
export interface ProjectNodeRow {
  id: string
  projectId: string // FK → projects.id
  pairingId?: string // FK → saved-pairings.id (optional)
  parent1: ParentGenotype
  parent1Name: string
  parent2: ParentGenotype
  parent2Name: string
}

/** edges table — one row per offspring branch */
export interface ProjectEdgeRow {
  id: string
  projectId: string // FK → projects.id (for fast project-scoped deletes)
  parentNodeId: string // FK → nodes.id
  childNodeId: string // FK → nodes.id
  offspringGenotype: ParentGenotype
  offspringLabel: string
  offspringProbability: number
}

/** node_flags table — flagged outcome keys per node */
export interface ProjectNodeFlagRow {
  nodeId: string // FK → nodes.id
  genotypeKey: string
}

/** node_aliases table — user-renamed outcomes per node */
export interface ProjectNodeAliasRow {
  nodeId: string // FK → nodes.id
  genotypeKey: string
  alias: string
}

// ---------------------------------------------------------------------------
// In-memory composed types (assembled from the rows above)
// These are what the UI and engine work with at runtime.
// ---------------------------------------------------------------------------

export interface ProjectNode {
  id: string
  parent1: ParentGenotype
  parent1Name: string
  parent2: ParentGenotype
  parent2Name: string
  pairingId?: string
  /** Each entry = one offspring genotype the user chose to extend into a new pairing */
  childEdges: ProjectEdge[]
  /** User-supplied aliases keyed by genotypeKey(outcome.genotype). null removes an alias. */
  offspringAliases?: Record<string, string>
  flaggedOutcomeKeys?: string[]
}

export interface ProjectEdge {
  id: string
  /** The offspring genotype — becomes the first parent of the child node */
  offspringGenotype: ParentGenotype
  offspringLabel: string
  offspringProbability: number
  childNodeId: string
}

export interface BreedingProject {
  id: string
  name: string
  rootNodeId: string
  /** Flat map of all nodes so we can update any node without deep cloning */
  nodes: Record<string, ProjectNode>
  savedAt: string
}
