import { useMemo, useState, useRef, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { calculateOffspring, formatProbability } from 'bp-genetics';
import type { OffspringOutcome } from 'bp-genetics';
import type { PlaygroundNode } from '../types';
import { Badge } from '@/components/ui/badge';
import { buildCompactLabel, genotypeKey } from '../utils/compactLabel';

export interface PairingNodeData {
  node: PlaygroundNode;
  onPairOffspring: (outcome: OffspringOutcome) => void;
  onRenameOutcome: (genotypeKey: string, alias: string | null) => void;
  isRoot: boolean;
}

function probabilityBadgeClass(prob: number) {
  if (prob >= 0.5)   return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  if (prob >= 0.25)  return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
  if (prob >= 0.125) return 'bg-violet-500/20 text-violet-300 border-violet-500/30';
  return 'bg-white/5 text-slate-400 border-white/10';
}

const MAX_SHOWN = 8;

function OutcomeLabel({
  label,
  alias,
  gKey,
  onRename,
}: {
  label: string;
  alias: string | undefined;
  gKey: string;
  onRename: (gKey: string, alias: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function startEdit() {
    setDraft(alias ?? label);
    setEditing(true);
  }

  function commit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== label) {
      onRename(gKey, trimmed);
    } else if (!trimmed) {
      onRename(gKey, null); // clear alias
    }
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className="flex-1 min-w-0 bg-white/10 border border-indigo-500/40 rounded px-1.5 py-px text-[11px] text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
      />
    );
  }

  return (
    <span className="flex items-center gap-1 min-w-0 group/label">
      <span className="text-[11px] text-slate-300 truncate leading-snug">
        {alias ?? label}
        {alias && (
          <span className="ml-1 text-[9px] text-indigo-400/60 font-normal">✎</span>
        )}
      </span>
      <button
        onClick={startEdit}
        title="Rename this outcome"
        className="shrink-0 opacity-0 group-hover/label:opacity-100 text-slate-600 hover:text-indigo-400 transition-all text-[10px] leading-none"
      >
        ✎
      </button>
    </span>
  );
}

export function PairingNode({ data }: { data: PairingNodeData }) {
  const { node, onPairOffspring, onRenameOutcome, isRoot } = data;
  const [showAll, setShowAll] = useState(false);

  const outcomes = useMemo(
    () => calculateOffspring(node.parent1, node.parent2),
    [node.parent1, node.parent2],
  );

  const visible = showAll ? outcomes : outcomes.slice(0, MAX_SHOWN);
  const hiddenCount = outcomes.length - MAX_SHOWN;

  const pairedChildGenotypes = new Set(
    node.childEdges.map(e => JSON.stringify(e.offspringGenotype)),
  );

  return (
    <div className="bg-[#161b27] border border-white/10 rounded-2xl shadow-2xl w-72 overflow-hidden">
      {/* Target handle — everything except root can receive edges */}
      {!isRoot && <Handle type="target" position={Position.Top} className="!bg-indigo-400 !border-indigo-500 !w-2.5 !h-2.5" />}

      {/* Header: parents */}
      <div className="px-4 pt-3 pb-2 border-b border-white/5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-slate-200 leading-snug">
            {node.parent1Name}
          </span>
          <span className="text-slate-600 text-xs">×</span>
          <span className="text-xs font-semibold text-slate-200 leading-snug">
            {node.parent2Name}
          </span>
        </div>
        <p className="text-[10px] text-slate-600 mt-0.5">{outcomes.length} offspring outcomes</p>
      </div>

      {/* Offspring list */}
      <div className="px-3 py-2 flex flex-col gap-1">
        {visible.map((outcome, i) => {
          const alreadyPaired = pairedChildGenotypes.has(JSON.stringify(outcome.genotype));
          const gKey = genotypeKey(outcome.genotype);
          const alias = node.offspringAliases?.[gKey];
          const compactLabel = buildCompactLabel(outcome.genotype);
          const showProbability = outcome.probability < 1;

          return (
            <div
              key={i}
              className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 bg-white/[0.03] border border-white/5 group"
            >
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                {showProbability && (
                  <Badge
                    className={`text-[10px] px-1.5 py-px border font-medium shrink-0 ${probabilityBadgeClass(outcome.probability)}`}
                  >
                    {formatProbability(outcome.probability)}
                  </Badge>
                )}
                <OutcomeLabel
                  label={compactLabel}
                  alias={alias}
                  gKey={gKey}
                  onRename={onRenameOutcome}
                />
                <div className="flex items-center gap-0.5 shrink-0">
                  {outcome.hasLethal && <span className="text-rose-400/70 text-[10px]">☠</span>}
                  {outcome.hasRisk && !outcome.hasLethal && <span className="text-orange-400/70 text-[10px]">⚠</span>}
                </div>
              </div>
              {!outcome.hasLethal && (
                <button
                  onClick={() => onPairOffspring(outcome)}
                  title={alreadyPaired ? 'Already paired — add another' : 'Pair this offspring'}
                  className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors
                    ${alreadyPaired
                      ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/50'
                      : 'bg-white/5 text-slate-500 border border-white/10 hover:bg-indigo-500/20 hover:text-indigo-300 hover:border-indigo-500/30 opacity-0 group-hover:opacity-100'
                    }`}
                >
                  {alreadyPaired ? '↗' : '+'}
                </button>
              )}
            </div>
          );
        })}

        {!showAll && hiddenCount > 0 && (
          <button
            onClick={() => setShowAll(true)}
            className="text-[11px] text-slate-600 hover:text-slate-400 transition-colors py-1 text-center"
          >
            +{hiddenCount} more outcomes
          </button>
        )}
        {showAll && outcomes.length > MAX_SHOWN && (
          <button
            onClick={() => setShowAll(false)}
            className="text-[11px] text-slate-600 hover:text-slate-400 transition-colors py-1 text-center"
          >
            Show less
          </button>
        )}
      </div>

      {/* Source handle — child edges attach here */}
      <Handle type="source" position={Position.Bottom} className="!bg-indigo-400 !border-indigo-500 !w-2.5 !h-2.5" />
    </div>
  );
}

