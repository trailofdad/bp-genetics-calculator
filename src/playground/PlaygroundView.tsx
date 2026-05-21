import { useCallback, useEffect, useState } from 'react';
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
} from '@xyflow/react';
import dagre from '@dagrejs/dagre';
import '@xyflow/react/dist/style.css';

import type { OffspringOutcome, ParentGenotype } from 'bp-genetics';
import type { PlaygroundProject } from './types';
import type { SavedPairing } from '../hooks/useSavedPairings';
import type { SavedAnimal } from '../hooks/useSavedAnimals';
import { usePlaygroundState } from './usePlaygroundState';
import { PairingNode, type PairingNodeData } from './nodes/PairingNode';
import { BranchEdge } from './edges/BranchEdge';

import { PairOffspringDialog } from './dialogs/PairOffspringDialog';

const NODE_WIDTH = 288; // w-72
const NODE_HEIGHT = 340; // approximate, dagre uses this for spacing

const nodeTypes = { pairingNode: PairingNode };
const edgeTypes = { branchEdge: BranchEdge };

/** Convert the flat node map into React Flow nodes + edges with dagre layout */
function buildGraph(
  project: PlaygroundProject,
  onPairOffspring: (nodeId: string, outcome: OffspringOutcome) => void,
  onRenameOutcome: (nodeId: string, genotypeKey: string, alias: string | null) => void,
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 100, marginx: 40, marginy: 40 });

  // Register all nodes with dagre
  Object.keys(project.nodes).forEach(id => {
    g.setNode(id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  // Register edges with dagre
  Object.values(project.nodes).forEach(node => {
    node.childEdges.forEach(edge => {
      g.setEdge(node.id, edge.childNodeId);
    });
  });

  dagre.layout(g);

  const rfNodes: Node[] = Object.values(project.nodes).map(node => {
    const pos = g.node(node.id);
    const data: PairingNodeData = {
      node,
      isRoot: node.id === project.rootNodeId,
      onPairOffspring: (outcome) => onPairOffspring(node.id, outcome),
      onRenameOutcome: (gKey, alias) => onRenameOutcome(node.id, gKey, alias),
    };
    return {
      id: node.id,
      type: 'pairingNode',
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
      data: data as unknown as Record<string, unknown>,
    };
  });

  const rfEdges: Edge[] = Object.values(project.nodes).flatMap(node =>
    node.childEdges.map(edge => ({
      id: edge.id,
      source: node.id,
      target: edge.childNodeId,
      type: 'branchEdge',
      markerEnd: { type: MarkerType.ArrowClosed, color: 'rgb(99 102 241 / 0.6)' },
      data: {
        label: edge.offspringLabel,
        probability: edge.offspringProbability,
      } as unknown as Record<string, unknown>,
    }))
  );

  return { nodes: rfNodes, edges: rfEdges };
}

interface Props {
  project: PlaygroundProject;
  savedPairings: SavedPairing[];
  savedAnimals: SavedAnimal[];
  onBack: () => void;
  onSave: (project: PlaygroundProject) => void;
}

export function PlaygroundView({ project: initialProject, savedPairings, savedAnimals, onBack, onSave }: Props) {
  const { project, addChildPairing, renameOutcome } = usePlaygroundState(initialProject);

  const [pendingPair, setPendingPair] = useState<{
    nodeId: string;
    outcome: OffspringOutcome;
  } | null>(null);

  const handlePairOffspring = useCallback((nodeId: string, outcome: OffspringOutcome) => {
    setPendingPair({ nodeId, outcome });
  }, []);

  const handleRenameOutcome = useCallback((nodeId: string, gKey: string, alias: string | null) => {
    renameOutcome(nodeId, gKey, alias);
  }, [renameOutcome]);

  const { nodes: layoutNodes, edges: layoutEdges } = buildGraph(project, handlePairOffspring, handleRenameOutcome);
  const [nodes, setNodes, onNodesChange] = useNodesState(layoutNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutEdges);

  // Re-layout whenever the project graph changes
  useEffect(() => {
    const { nodes: ln, edges: le } = buildGraph(project, handlePairOffspring, handleRenameOutcome);
    setNodes(ln);
    setEdges(le);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project]);

  function handleDialogConfirm(pairedWith: ParentGenotype, pairedWithName: string) {
    if (!pendingPair) return;
    addChildPairing(pendingPair.nodeId, pendingPair.outcome, pairedWith, pairedWithName);
    setPendingPair(null);
  }

  return (
    <div className="h-screen flex flex-col bg-[#0d1117]">
      {/* Toolbar */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0d1117] z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            ← Calculator
          </button>
          <div>
            <p className="text-sm font-semibold text-white leading-none">{project.name}</p>
            <p className="text-[10px] text-slate-600 mt-0.5">Breeding Playground</p>
          </div>
        </div>
        <button
          onClick={() => onSave(project)}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors"
        >
          Save Project
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
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
          <Controls className="!bg-[#161b27] !border-white/10 !rounded-xl !shadow-xl [&>button]:!bg-[#161b27] [&>button]:!border-white/5 [&>button]:!text-slate-400 [&>button:hover]:!bg-white/10" />
          <MiniMap
            nodeColor="#1e2a3d"
            maskColor="rgba(0,0,0,0.6)"
            className="!bg-[#0d1117] !border !border-white/10 !rounded-xl"
          />
        </ReactFlow>

        {/* Legend */}
        <div className="absolute bottom-14 left-3 bg-[#161b27]/90 border border-white/5 rounded-xl px-3 py-2 text-[10px] text-slate-500 flex flex-col gap-1 backdrop-blur-sm pointer-events-none">
          <span className="font-semibold text-slate-400 text-[11px]">How to use</span>
          <span>Hover an offspring row → click <span className="text-slate-300 font-mono">+</span> to branch</span>
          <span>Already-branched outcomes show <span className="text-indigo-300 font-mono">↗</span></span>
          <span>Drag nodes · scroll to zoom</span>
        </div>
      </div>

      {/* Pair offspring dialog */}
      <PairOffspringDialog
        key={pendingPair ? `${pendingPair.nodeId}|${pendingPair.outcome.label}` : 'closed'}
        open={!!pendingPair}
        offspring={pendingPair?.outcome ?? null}
        savedPairings={savedPairings}
        savedAnimals={savedAnimals}
        onConfirm={handleDialogConfirm}
        onClose={() => setPendingPair(null)}
      />
    </div>
  );
}
