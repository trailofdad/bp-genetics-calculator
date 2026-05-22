import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { loadFromStorage, persistToStorage } from '../lib/storage'
import type {
  BreedingProject,
  ProjectNode,
  ProjectRow,
  ProjectNodeRow,
  ProjectEdgeRow,
  ProjectNodeFlagRow,
  ProjectNodeAliasRow,
} from './types'

// ---------------------------------------------------------------------------
// localStorage keys — each maps to a future DB table.
// TODO (DB migration): replace loadFromStorage/persistToStorage calls with
// DB queries/mutations.
// ---------------------------------------------------------------------------
const KEYS = {
  projects: 'pg-projects',
  nodes: 'pg-nodes',
  edges: 'pg-edges',
  flags: 'pg-node-flags',
  aliases: 'pg-node-aliases',
} as const

// ---------------------------------------------------------------------------
// Decompose: BreedingProject → flat rows
// TODO (DB migration): replace with INSERT/UPDATE per table
// ---------------------------------------------------------------------------
function decomposeProject(project: BreedingProject): {
  projectRow: ProjectRow
  nodeRows: ProjectNodeRow[]
  edgeRows: ProjectEdgeRow[]
  flagRows: ProjectNodeFlagRow[]
  aliasRows: ProjectNodeAliasRow[]
} {
  const nodeRows: ProjectNodeRow[] = []
  const edgeRows: ProjectEdgeRow[] = []
  const flagRows: ProjectNodeFlagRow[] = []
  const aliasRows: ProjectNodeAliasRow[] = []

  for (const node of Object.values(project.nodes)) {
    nodeRows.push({
      id: node.id,
      projectId: project.id,
      pairingId: node.pairingId,
      parent1: node.parent1,
      parent1Name: node.parent1Name,
      parent2: node.parent2,
      parent2Name: node.parent2Name,
    })

    for (const edge of node.childEdges) {
      edgeRows.push({
        id: edge.id,
        projectId: project.id,
        parentNodeId: node.id,
        childNodeId: edge.childNodeId,
        offspringGenotype: edge.offspringGenotype,
        offspringLabel: edge.offspringLabel,
        offspringProbability: edge.offspringProbability,
      })
    }

    for (const key of node.flaggedOutcomeKeys ?? []) {
      flagRows.push({ nodeId: node.id, genotypeKey: key })
    }

    for (const [genotypeKey, alias] of Object.entries(
      node.offspringAliases ?? {}
    )) {
      aliasRows.push({ nodeId: node.id, genotypeKey, alias })
    }
  }

  return {
    projectRow: {
      id: project.id,
      name: project.name,
      rootNodeId: project.rootNodeId,
      savedAt: project.savedAt,
    },
    nodeRows,
    edgeRows,
    flagRows,
    aliasRows,
  }
}

// ---------------------------------------------------------------------------
// Compose: flat rows → BreedingProject
// TODO (DB migration): replace with a JOIN query across all 5 tables
// ---------------------------------------------------------------------------
function composeProject(
  projectRow: ProjectRow,
  allNodes: ProjectNodeRow[],
  allEdges: ProjectEdgeRow[],
  allFlags: ProjectNodeFlagRow[],
  allAliases: ProjectNodeAliasRow[]
): BreedingProject {
  const projectNodes = allNodes.filter((n) => n.projectId === projectRow.id)
  const projectEdges = allEdges.filter((e) => e.projectId === projectRow.id)
  const nodes: Record<string, ProjectNode> = {}

  for (const nodeRow of projectNodes) {
    const nodeEdges = projectEdges.filter((e) => e.parentNodeId === nodeRow.id)
    const nodeFlags = allFlags.filter((f) => f.nodeId === nodeRow.id)
    const nodeAliases = allAliases.filter((a) => a.nodeId === nodeRow.id)

    nodes[nodeRow.id] = {
      id: nodeRow.id,
      pairingId: nodeRow.pairingId,
      parent1: nodeRow.parent1,
      parent1Name: nodeRow.parent1Name,
      parent2: nodeRow.parent2,
      parent2Name: nodeRow.parent2Name,
      childEdges: nodeEdges.map((e) => ({
        id: e.id,
        offspringGenotype: e.offspringGenotype,
        offspringLabel: e.offspringLabel,
        offspringProbability: e.offspringProbability,
        childNodeId: e.childNodeId,
      })),
      flaggedOutcomeKeys:
        nodeFlags.length > 0 ? nodeFlags.map((f) => f.genotypeKey) : undefined,
      offspringAliases:
        nodeAliases.length > 0
          ? Object.fromEntries(nodeAliases.map((a) => [a.genotypeKey, a.alias]))
          : undefined,
    }
  }

  return {
    id: projectRow.id,
    name: projectRow.name,
    rootNodeId: projectRow.rootNodeId,
    nodes,
    savedAt: projectRow.savedAt,
  }
}

interface StorageState {
  projects: ProjectRow[]
  nodes: ProjectNodeRow[]
  edges: ProjectEdgeRow[]
  flags: ProjectNodeFlagRow[]
  aliases: ProjectNodeAliasRow[]
}

function loadInitialState(): StorageState {
  return {
    projects: loadFromStorage<ProjectRow>(KEYS.projects),
    nodes: loadFromStorage<ProjectNodeRow>(KEYS.nodes),
    edges: loadFromStorage<ProjectEdgeRow>(KEYS.edges),
    flags: loadFromStorage<ProjectNodeFlagRow>(KEYS.flags),
    aliases: loadFromStorage<ProjectNodeAliasRow>(KEYS.aliases),
  }
}

// ---------------------------------------------------------------------------
// TODO (DB migration): replace useState + persistToStorage calls with DB mutations
export function useProjectsStorage() {
  const [state, setState] = useState<StorageState>(loadInitialState)

  // Stable ref keeps loadProject from going stale without adding state to deps
  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state })

  /** Upsert a full project across all 5 tables.
   * TODO (DB migration): replace with upsert transactions per table. */
  const saveProject = useCallback((project: BreedingProject) => {
    const { projectRow, nodeRows, edgeRows, flagRows, aliasRows } =
      decomposeProject(project)

    setState((prev) => {
      const projectNodeIds = new Set(nodeRows.map((n) => n.id))
      const nextProjects = [projectRow, ...prev.projects.filter((p) => p.id !== project.id)]
      const nextNodes = [...nodeRows, ...prev.nodes.filter((n) => n.projectId !== project.id)]
      const nextEdges = [...edgeRows, ...prev.edges.filter((e) => e.projectId !== project.id)]
      const nextFlags = [...flagRows, ...prev.flags.filter((f) => !projectNodeIds.has(f.nodeId))]
      const nextAliases = [...aliasRows, ...prev.aliases.filter((a) => !projectNodeIds.has(a.nodeId))]

      persistToStorage(KEYS.projects, nextProjects)
      persistToStorage(KEYS.nodes, nextNodes)
      persistToStorage(KEYS.edges, nextEdges)
      persistToStorage(KEYS.flags, nextFlags)
      persistToStorage(KEYS.aliases, nextAliases)

      return { projects: nextProjects, nodes: nextNodes, edges: nextEdges, flags: nextFlags, aliases: nextAliases }
    })
  }, [])

  /** Delete a project and all its related rows.
   * TODO (DB migration): replace with ON DELETE CASCADE or explicit cascade. */
  const removeProject = useCallback((id: string) => {
    setState((prev) => {
      const projectNodeIds = new Set(
        prev.nodes.filter((n) => n.projectId === id).map((n) => n.id)
      )
      const nextProjects = prev.projects.filter((p) => p.id !== id)
      const nextNodes = prev.nodes.filter((n) => n.projectId !== id)
      const nextEdges = prev.edges.filter((e) => e.projectId !== id)
      const nextFlags = prev.flags.filter((f) => !projectNodeIds.has(f.nodeId))
      const nextAliases = prev.aliases.filter((a) => !projectNodeIds.has(a.nodeId))

      persistToStorage(KEYS.projects, nextProjects)
      persistToStorage(KEYS.nodes, nextNodes)
      persistToStorage(KEYS.edges, nextEdges)
      persistToStorage(KEYS.flags, nextFlags)
      persistToStorage(KEYS.aliases, nextAliases)

      return { projects: nextProjects, nodes: nextNodes, edges: nextEdges, flags: nextFlags, aliases: nextAliases }
    })
  }, [])

  /** Compose a full BreedingProject from flat rows by ID.
   * TODO (DB migration): replace with a JOIN query across all 5 tables. */
  const loadProject = useCallback((id: string): BreedingProject | null => {
    const projectRow = stateRef.current.projects.find((p) => p.id === id)
    if (!projectRow) return null
    const { nodes, edges, flags, aliases } = stateRef.current
    return composeProject(projectRow, nodes, edges, flags, aliases)
  }, [])

  return {
    /** Flat project metadata rows — use for listing. */
    projects: state.projects,
    /** pairingId → projectId mapping derived from project nodes. */
    pairingIdToProjectId: useMemo(() => {
      const map = new Map<string, string>()
      for (const node of state.nodes) {
        if (node.pairingId) map.set(node.pairingId, node.projectId)
      }
      return map
    }, [state.nodes]),
    saveProject,
    removeProject,
    loadProject,
  }
}
