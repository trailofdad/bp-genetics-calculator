import { useState, useCallback } from 'react'
import type { ParentGenotype, OffspringOutcome } from 'bp-genetics'
import type { BreedingProject, ProjectNode, ProjectEdge } from './types'
import { buildCompactLabel } from './utils/compactLabel'

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export function useProjectsState(initial: BreedingProject) {
  const [project, setProject] = useState<BreedingProject>(initial)

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

        const childNode: ProjectNode = {
          id: childNodeId,
          parent1: outcome.genotype as ParentGenotype,
          parent1Name: outcome.label,
          parent2: pairedWith,
          parent2Name: pairedWithName,
          childEdges: [],
        }

        const edge: ProjectEdge = {
          id: edgeId,
          offspringGenotype: outcome.genotype as ParentGenotype,
          offspringLabel: buildCompactLabel(outcome.genotype as ParentGenotype),
          offspringProbability: outcome.probability,
          childNodeId,
        }

        const updatedParent: ProjectNode = {
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

  const removeChildPairing = useCallback(
    (parentNodeId: string, edgeId: string) => {
      setProject((prev) => {
        const edge = prev.nodes[parentNodeId]?.childEdges.find(
          (e) => e.id === edgeId
        )
        if (!edge) return prev

        const toRemove = new Set<string>()
        const queue = [edge.childNodeId]
        while (queue.length) {
          const nodeId = queue.shift()!
          toRemove.add(nodeId)
          const node = prev.nodes[nodeId]
          if (node) node.childEdges.forEach((e) => queue.push(e.childNodeId))
        }

        const updatedParent: ProjectNode = {
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

  const toggleFlagOutcome = useCallback((nodeId: string, gKey: string) => {
    setProject((prev) => {
      const node = prev.nodes[nodeId]
      if (!node) return prev

      const nextFlagged = new Set(node.flaggedOutcomeKeys ?? [])
      if (nextFlagged.has(gKey)) {
        nextFlagged.delete(gKey)
      } else {
        nextFlagged.add(gKey)
      }

      return {
        ...prev,
        savedAt: new Date().toISOString(),
        nodes: {
          ...prev.nodes,
          [nodeId]: {
            ...node,
            flaggedOutcomeKeys:
              nextFlagged.size > 0 ? [...nextFlagged] : undefined,
          },
        },
      }
    })
  }, [])

  return {
    project,
    setProject,
    addChildPairing,
    removeChildPairing,
    renameOutcome,
    toggleFlagOutcome,
  }
}
