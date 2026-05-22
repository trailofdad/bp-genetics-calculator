import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react'
import type { EdgeProps } from '@xyflow/react'
import { formatProbability } from 'bp-genetics'

export interface BranchEdgeData {
  label: string
  probability: number
}

export function BranchEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps & { data?: BranchEdgeData }) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{ stroke: 'rgb(99 102 241 / 0.4)', strokeWidth: 1.5 }}
      />
      {data && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan flex flex-col items-center gap-px rounded-lg border border-indigo-500/20 bg-card px-2 py-0.5"
          >
            <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-300">
              {formatProbability(data.probability)}
            </span>
            <span className="max-w-[100px] truncate text-center text-[9px] text-muted-foreground">
              {data.label}
            </span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
