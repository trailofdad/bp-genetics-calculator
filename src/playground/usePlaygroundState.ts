import { useState, useCallback } from 'react'
import type { PlaygroundProject, PlaygroundNode, PlaygroundEdge } from './types'
import type { ParentGenotype, OffspringOutcome } from 'bp-genetics'
import { buildCompactLabel } from './utils/compactLabel'

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export function usePlaygroundState(initial: PlaygroundProject) {
  const [project, setProject] = useState<PlaygroundProject>(initial)

  /** Add a new child pairing branching from an offspring of parentNodeId */
  const addChildPairing = useCallback(
    (
      parentNodeId: string,
      outcome: OffspringOutcome,
      pairedWith: ParentGenotype,
      pairedWithName: string
    ) => {
      setProject((prev) => {
        const childNodeId = makeId()
        const edgeId = makeId()

        const childNode: PlaygroundNode = {
          id: childNodeId,
          parent1: outcome.genotype as ParentGenotype,
          parent1Name: outcome.label,
          parent2: pairedWith,
          parent2Name: pairedWithName,
          childEdges: [],
        }

        const edge: PlaygroundEdge = {
          id: edgeId,
          offspringGenotype: outcome.genotype as ParentGenotype,
          offspringLabel: buildCompactLabel(outcome.genotype as ParentGenotype),
          offspringProbability: outcome.probability,
          childNodeId,
        }

        const updatedParent: PlaygroundNode = {
          ...prev.nodes[parentNodeId],
          childEdges: [...prev.nodes[parentNodeId].childEdges, edge],
        }

        return {
          ...prev,
          savedAt: new Date().toISOString(),
          nodes: {
            ...prev.nodes,
            [parentNodeId]: updatedParent,
            [childNodeId]: childNode,
          },
        }
      })
    },
    []
  )

  /** Remove a child pairing (and its entire subtree) */
  const removeChildPairing = useCallback(
    (parentNodeId: string, edgeId: string) => {
      setProject((prev) => {
        const edge = prev.nodes[parentNodeId]?.childEdges.find(
          (e) => e.id === edgeId
        )
        if (!edge) return prev

        // Collect all descendant node IDs to remove
        const toRemove = new Set<string>()
        const queue = [edge.childNodeId]
        while (queue.length) {
          const nodeId = queue.shift()!
          toRemove.add(nodeId)
          const node = prev.nodes[nodeId]
          if (node) node.childEdges.forEach((e) => queue.push(e.childNodeId))
        }

        const updatedParent: PlaygroundNode = {
          ...prev.nodes[parentNodeId],
          childEdges: prev.nodes[parentNodeId].childEdges.filter(
            (e) => e.id !== edgeId
          ),
        }

        const nextNodes = { ...prev.nodes, [parentNodeId]: updatedParent }
        toRemove.forEach((id) => delete nextNodes[id])

        return { ...prev, savedAt: new Date().toISOString(), nodes: nextNodes }
      })
    },
    []
  )

  /** Set or clear a user alias for an offspring genotype within a node */
  const renameOutcome = useCallback(
    (nodeId: string, gKey: string, alias: string | null) => {
      setProject((prev) => {
        const node = prev.nodes[nodeId]
        if (!node) return prev
        const nextAliases = { ...(node.offspringAliases ?? {}) }
        if (alias === null) {
          delete nextAliases[gKey]
        } else {
          nextAliases[gKey] = alias
        }
        return {
          ...prev,
          savedAt: new Date().toISOString(),
          nodes: {
            ...prev.nodes,
            [nodeId]: { ...node, offspringAliases: nextAliases },
          },
        }
      })
    },
    []
  )

  return {
    project,
    setProject,
    addChildPairing,
    removeChildPairing,
    renameOutcome,
  }
}
