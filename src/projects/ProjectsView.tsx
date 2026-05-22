import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  BackgroundVariant,
  MarkerType,
} from '@xyflow/react'
import dagre from '@dagrejs/dagre'
import '@xyflow/react/dist/style.css'

import type { OffspringOutcome, ParentGenotype } from 'bp-genetics'
import { calculateOffspring } from 'bp-genetics'
import type { BreedingProject } from './types'
import type { SavedAnimal } from '../hooks/useSavedAnimals'
import { useProjectsState } from './useProjectsState'
import { PairingNode, type PairingNodeData } from './nodes/PairingNode'
import { BranchEdge } from './edges/BranchEdge'
import { PairOffspringDialog } from './dialogs/PairOffspringDialog'
import { genotypeKey } from './utils/compactLabel'

const NODE_WIDTH = 288
const NODE_HEIGHT = 360

const nodeTypes = { pairingNode: PairingNode }
const edgeTypes = { branchEdge: BranchEdge }

function buildGraph(
  project: BreedingProject,
  onPairOffspring: (nodeId: string, outcome: OffspringOutcome) => void,
  onRenameOutcome: (
    nodeId: string,
    genotypeKey: string,
    alias: string | null
  ) => void,
  onFlagOutcome: (nodeId: string, genotypeKey: string) => void,
  onAddGoal: (nodeId: string, outcome: OffspringOutcome) => void,
  goalKeys: Set<string>
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({
    rankdir: 'TB',
    nodesep: 60,
    ranksep: 100,
    marginx: 40,
    marginy: 40,
  })

  Object.keys(project.nodes).forEach((id) => {
    g.setNode(id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  })

  Object.values(project.nodes).forEach((node) => {
    node.childEdges.forEach((edge) => {
      g.setEdge(node.id, edge.childNodeId)
    })
  })

  dagre.layout(g)

  const rfNodes: Node[] = Object.values(project.nodes).map((node) => {
    const pos = g.node(node.id)
    const data: PairingNodeData = {
      node,
      isRoot: node.id === project.rootNodeId,
      onPairOffspring: (outcome) => onPairOffspring(node.id, outcome),
      onRenameOutcome: (gKey, alias) => onRenameOutcome(node.id, gKey, alias),
      onFlagOutcome: (gKey) => onFlagOutcome(node.id, gKey),
      onAddGoal: (outcome) => onAddGoal(node.id, outcome),
      goalKeys,
    }
    return {
      id: node.id,
      type: 'pairingNode',
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
      data: data as unknown as Record<string, unknown>,
    }
  })

  const rfEdges: Edge[] = Object.values(project.nodes).flatMap((node) =>
    node.childEdges.map((edge) => ({
      id: edge.id,
      source: node.id,
      target: edge.childNodeId,
      type: 'branchEdge',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: 'rgb(99 102 241 / 0.6)',
      },
      data: {
        label: edge.offspringLabel,
        probability: edge.offspringProbability,
      } as unknown as Record<string, unknown>,
    }))
  )

  return { nodes: rfNodes, edges: rfEdges }
}

interface Props {
  project: BreedingProject
  savedAnimals: SavedAnimal[]
  saveAnimal: (name: string, genotype: ParentGenotype) => void
  onBack: () => void
  onSave: (project: BreedingProject) => void
  onSaveGoal: (outcome: OffspringOutcome, pairingId?: string, pairingName?: string) => void
  goalKeys: Set<string>
}

export function ProjectsView({
  project: initialProject,
  savedAnimals,
  saveAnimal,
  onBack,
  onSave,
  onSaveGoal,
  goalKeys,
}: Props) {
  const { project, addChildPairing, renameOutcome, toggleFlagOutcome } =
    useProjectsState(initialProject)

  const [pendingPair, setPendingPair] = useState<{
    nodeId: string
    outcome: OffspringOutcome
  } | null>(null)

  const handlePairOffspring = useCallback(
    (nodeId: string, outcome: OffspringOutcome) => {
      setPendingPair({ nodeId, outcome })
    },
    []
  )

  const handleRenameOutcome = useCallback(
    (nodeId: string, gKey: string, alias: string | null) => {
      renameOutcome(nodeId, gKey, alias)
    },
    [renameOutcome]
  )

  const handleFlagOutcome = useCallback(
    (nodeId: string, gKey: string) => {
      toggleFlagOutcome(nodeId, gKey)
    },
    [toggleFlagOutcome]
  )

  const handleAddGoal = useCallback(
    (nodeId: string, outcome: OffspringOutcome) => {
      const node = project.nodes[nodeId]
      if (!node) return
      onSaveGoal(outcome, node.pairingId, `${node.parent1Name} × ${node.parent2Name}`)
    },
    [project.nodes, onSaveGoal]
  )

  const { nodes: layoutNodes, edges: layoutEdges } = buildGraph(
    project,
    handlePairOffspring,
    handleRenameOutcome,
    handleFlagOutcome,
    handleAddGoal,
    goalKeys
  )
  const [nodes, setNodes, onNodesChange] = useNodesState(layoutNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutEdges)

  useEffect(() => {
    const { nodes: ln, edges: le } = buildGraph(
      project,
      handlePairOffspring,
      handleRenameOutcome,
      handleFlagOutcome,
      handleAddGoal,
      goalKeys
    )
    setNodes(ln)
    setEdges(le)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, goalKeys])

  // Auto-save on every project change after the initial render.
  // Uses a ref for onSave so stale closure is never an issue.
  // TODO (DB migration): replace onSave with a DB mutation call here
  const onSaveRef = useRef(onSave)
  useEffect(() => { onSaveRef.current = onSave })
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    onSaveRef.current(project)
  }, [project])

  const flaggedOffspring = useMemo<(OffspringOutcome & { sourceLabel: string })[]>(() => {
    const seen = new Set<string>()
    const results: (OffspringOutcome & { sourceLabel: string })[] = []

    for (const node of Object.values(project.nodes)) {
      const keys = new Set(node.flaggedOutcomeKeys ?? [])
      if (keys.size === 0) continue
      const sourceLabel = `${node.parent1Name} × ${node.parent2Name}`
      for (const o of calculateOffspring(node.parent1, node.parent2)) {
        const key = genotypeKey(o.genotype)
        if (keys.has(key) && !seen.has(key)) {
          seen.add(key)
          results.push({ ...o, sourceLabel })
        }
      }
    }

    return results
  }, [project.nodes])

  function handleDialogConfirm(
    pairedWith: ParentGenotype,
    pairedWithName: string
  ) {
    if (!pendingPair) return
    addChildPairing(
      pendingPair.nodeId,
      pendingPair.outcome,
      pairedWith,
      pairedWithName
    )
    setPendingPair(null)
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[#0d1117]">
      <div className="z-10 flex shrink-0 items-center justify-between border-b border-white/5 bg-[#0d1117] px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/5 px-3 py-1.5 text-xs text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200"
          >
            ← Projects
          </button>
          <div>
            <p className="text-sm leading-none font-semibold text-white">
              {project.name}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-600">
              Projects
            </p>
          </div>
        </div>
        <p className="text-[10px] text-slate-600">Auto-saved</p>
      </div>

      <div className="relative flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1}
            color="rgba(255,255,255,0.05)"
          />
          <Controls className="!rounded-xl !border-white/10 !bg-[#161b27] !shadow-xl [&>button]:!border-white/5 [&>button]:!bg-[#161b27] [&>button]:!text-slate-400 [&>button:hover]:!bg-white/10" />
          <MiniMap
            nodeColor="#1e2a3d"
            maskColor="rgba(0,0,0,0.6)"
            className="!rounded-xl !border !border-white/10 !bg-[#0d1117]"
          />
        </ReactFlow>

        <div className="pointer-events-none absolute top-3 right-3 flex flex-col gap-1 rounded-xl border border-white/5 bg-[#161b27]/90 px-3 py-2 text-[10px] text-slate-500 backdrop-blur-sm">
          <span className="text-[11px] font-semibold text-slate-400">
            How to use
          </span>
          <span>
            Hover an offspring row → click{' '}
            <span className="font-mono text-slate-300">◎</span> to set a goal,{' '}
            <span className="font-mono text-slate-300">+</span> to branch
          </span>
          <span>
            Starred outcomes stay pinned at the top of each node
          </span>
          <span>
            Already-branched outcomes show{' '}
            <span className="font-mono text-indigo-300">↗</span>
          </span>
          <span>Drag nodes · scroll to zoom</span>
        </div>
      </div>

      <PairOffspringDialog
        key={
          pendingPair
            ? `${pendingPair.nodeId}|${pendingPair.outcome.label}`
            : 'closed'
        }
        open={!!pendingPair}
        offspring={pendingPair?.outcome ?? null}
        flaggedOffspring={flaggedOffspring}
        savedAnimals={savedAnimals}
        onSaveAnimal={saveAnimal}
        onConfirm={handleDialogConfirm}
        onClose={() => setPendingPair(null)}
      />
    </div>
  )
}
