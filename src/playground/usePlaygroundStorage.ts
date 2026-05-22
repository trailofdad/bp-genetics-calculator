import { useState, useCallback, useEffect, useRef } from 'react'
import type {
  PlaygroundProject,
  PlaygroundNode,
  PlaygroundProjectRow,
  PlaygroundNodeRow,
  PlaygroundEdgeRow,
  PlaygroundNodeFlagRow,
  PlaygroundNodeAliasRow,
} from './types'

// ---------------------------------------------------------------------------
// localStorage keys
// Each key maps to one future DB table.
// ---------------------------------------------------------------------------
const KEYS = {
  projects: 'pg-projects',
  nodes: 'pg-nodes',
  edges: 'pg-edges',
  flags: 'pg-node-flags',
  aliases: 'pg-node-aliases',
  // Legacy single-blob key — used only for one-time migration
  legacy: 'playground-projects',
} as const

// ---------------------------------------------------------------------------
// localStorage helpers
// TODO (DB migration): replace loadJson/persistJson with DB SELECT/INSERT calls
// ---------------------------------------------------------------------------
function loadJson<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

function persistJson<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // ignore quota errors
  }
}

// ---------------------------------------------------------------------------
// Decompose: PlaygroundProject → flat rows
// TODO (DB migration): replace with INSERT/UPDATE statements per table
// ---------------------------------------------------------------------------
function decomposeProject(project: PlaygroundProject): {
  projectRow: PlaygroundProjectRow
  nodeRows: PlaygroundNodeRow[]
  edgeRows: PlaygroundEdgeRow[]
  flagRows: PlaygroundNodeFlagRow[]
  aliasRows: PlaygroundNodeAliasRow[]
} {
  const nodeRows: PlaygroundNodeRow[] = []
  const edgeRows: PlaygroundEdgeRow[] = []
  const flagRows: PlaygroundNodeFlagRow[] = []
  const aliasRows: PlaygroundNodeAliasRow[] = []

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
// Compose: flat rows → PlaygroundProject
// TODO (DB migration): replace with JOIN query across all 5 tables
// ---------------------------------------------------------------------------
function composeProject(
  projectRow: PlaygroundProjectRow,
  allNodes: PlaygroundNodeRow[],
  allEdges: PlaygroundEdgeRow[],
  allFlags: PlaygroundNodeFlagRow[],
  allAliases: PlaygroundNodeAliasRow[]
): PlaygroundProject {
  const projectNodes = allNodes.filter((n) => n.projectId === projectRow.id)
  const projectEdges = allEdges.filter((e) => e.projectId === projectRow.id)
  const nodes: Record<string, PlaygroundNode> = {}

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

// ---------------------------------------------------------------------------
// One-time migration from the old single-blob format (playground-projects key)
// TODO (DB migration): remove this once the DB is the source of truth
// ---------------------------------------------------------------------------
interface StorageState {
  projects: PlaygroundProjectRow[]
  nodes: PlaygroundNodeRow[]
  edges: PlaygroundEdgeRow[]
  flags: PlaygroundNodeFlagRow[]
  aliases: PlaygroundNodeAliasRow[]
}

function loadInitialState(): StorageState {
  const projects = loadJson<PlaygroundProjectRow>(KEYS.projects)

  // If new tables already have data, use them as-is
  if (projects.length > 0) {
    return {
      projects,
      nodes: loadJson<PlaygroundNodeRow>(KEYS.nodes),
      edges: loadJson<PlaygroundEdgeRow>(KEYS.edges),
      flags: loadJson<PlaygroundNodeFlagRow>(KEYS.flags),
      aliases: loadJson<PlaygroundNodeAliasRow>(KEYS.aliases),
    }
  }

  // Attempt migration from old format
  const legacy = loadJson<PlaygroundProject>(KEYS.legacy)
  if (legacy.length === 0) {
    return { projects: [], nodes: [], edges: [], flags: [], aliases: [] }
  }

  const allProjects: PlaygroundProjectRow[] = []
  const allNodes: PlaygroundNodeRow[] = []
  const allEdges: PlaygroundEdgeRow[] = []
  const allFlags: PlaygroundNodeFlagRow[] = []
  const allAliases: PlaygroundNodeAliasRow[] = []

  for (const project of legacy) {
    const { projectRow, nodeRows, edgeRows, flagRows, aliasRows } =
      decomposeProject(project)
    allProjects.push(projectRow)
    allNodes.push(...nodeRows)
    allEdges.push(...edgeRows)
    allFlags.push(...flagRows)
    allAliases.push(...aliasRows)
  }

  persistJson(KEYS.projects, allProjects)
  persistJson(KEYS.nodes, allNodes)
  persistJson(KEYS.edges, allEdges)
  persistJson(KEYS.flags, allFlags)
  persistJson(KEYS.aliases, allAliases)

  return {
    projects: allProjects,
    nodes: allNodes,
    edges: allEdges,
    flags: allFlags,
    aliases: allAliases,
  }
}

// ---------------------------------------------------------------------------
// Hook
// TODO (DB migration): replace useState + persistJson calls with DB mutations
// (e.g. useMutation hooks from an ORM/query client)
// ---------------------------------------------------------------------------
export function usePlaygroundStorage() {
  const [state, setState] = useState<StorageState>(loadInitialState)

  // Keep a stable ref so auto-save effects don't need it in their dep arrays
  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state })

  // -------------------------------------------------------------------------
  // saveProject — upsert a full project across all 5 tables
  // TODO (DB migration): replace with upsert transactions per table
  // -------------------------------------------------------------------------
  const saveProject = useCallback((project: PlaygroundProject) => {
    const { projectRow, nodeRows, edgeRows, flagRows, aliasRows } =
      decomposeProject(project)

    setState((prev) => {
      // Remove stale rows for this project, then prepend fresh ones
      const projectNodeIds = new Set(nodeRows.map((n) => n.id))

      const nextProjects = [
        projectRow,
        ...prev.projects.filter((p) => p.id !== project.id),
      ]
      const nextNodes = [
        ...nodeRows,
        ...prev.nodes.filter((n) => n.projectId !== project.id),
      ]
      const nextEdges = [
        ...edgeRows,
        ...prev.edges.filter((e) => e.projectId !== project.id),
      ]
      const nextFlags = [
        ...flagRows,
        ...prev.flags.filter((f) => !projectNodeIds.has(f.nodeId)),
      ]
      const nextAliases = [
        ...aliasRows,
        ...prev.aliases.filter((a) => !projectNodeIds.has(a.nodeId)),
      ]

      persistJson(KEYS.projects, nextProjects)
      persistJson(KEYS.nodes, nextNodes)
      persistJson(KEYS.edges, nextEdges)
      persistJson(KEYS.flags, nextFlags)
      persistJson(KEYS.aliases, nextAliases)

      return {
        projects: nextProjects,
        nodes: nextNodes,
        edges: nextEdges,
        flags: nextFlags,
        aliases: nextAliases,
      }
    })
  }, [])

  // -------------------------------------------------------------------------
  // removeProject — delete a project and all its related rows
  // TODO (DB migration): replace with cascading DELETE (or ON DELETE CASCADE FK)
  // -------------------------------------------------------------------------
  const removeProject = useCallback((id: string) => {
    setState((prev) => {
      const projectNodeIds = new Set(
        prev.nodes.filter((n) => n.projectId === id).map((n) => n.id)
      )

      const nextProjects = prev.projects.filter((p) => p.id !== id)
      const nextNodes = prev.nodes.filter((n) => n.projectId !== id)
      const nextEdges = prev.edges.filter((e) => e.projectId !== id)
      const nextFlags = prev.flags.filter((f) => !projectNodeIds.has(f.nodeId))
      const nextAliases = prev.aliases.filter(
        (a) => !projectNodeIds.has(a.nodeId)
      )

      persistJson(KEYS.projects, nextProjects)
      persistJson(KEYS.nodes, nextNodes)
      persistJson(KEYS.edges, nextEdges)
      persistJson(KEYS.flags, nextFlags)
      persistJson(KEYS.aliases, nextAliases)

      return {
        projects: nextProjects,
        nodes: nextNodes,
        edges: nextEdges,
        flags: nextFlags,
        aliases: nextAliases,
      }
    })
  }, [])

  // -------------------------------------------------------------------------
  // loadProject — compose a full PlaygroundProject from flat rows
  // TODO (DB migration): replace with a JOIN query across all 5 tables
  // -------------------------------------------------------------------------
  const loadProject = useCallback(
    (id: string): PlaygroundProject | null => {
      const projectRow = stateRef.current.projects.find((p) => p.id === id)
      if (!projectRow) return null
      const { nodes, edges, flags, aliases } = stateRef.current
      return composeProject(projectRow, nodes, edges, flags, aliases)
    },
    [] // stateRef is stable
  )

  return {
    /** Flat project metadata rows — use for listing */
    projects: state.projects,
    saveProject,
    removeProject,
    loadProject,
  }
}
