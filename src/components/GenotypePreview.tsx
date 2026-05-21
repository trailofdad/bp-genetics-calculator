import { GENES } from 'bp-genetics';
import type { ParentGenotype } from 'bp-genetics';

function geneBadgeClass(type: string, lethalSuper?: boolean, copies?: number): string {
  if (lethalSuper && copies === 2) {
    return 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
  }
  if (type === 'codominant') {
    return 'bg-sky-500/15 text-sky-300 border border-sky-500/25';
  }
  // recessive
  return 'bg-violet-500/15 text-violet-300 border border-violet-500/25';
}

export function GenotypePreview({ genotype }: { genotype: ParentGenotype }) {
  const active = Object.entries(genotype).filter(([, c]) => c > 0);
  if (active.length === 0) return <span className="text-slate-500 text-xs italic">Normal</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {active.map(([id, copies]) => {
        const gene = GENES.find(g => g.id === id);
        const isCodom = gene?.type === 'codominant';
        const baseName = gene?.name ?? id;
        const label = isCodom
          ? (copies === 2 ? (gene?.superName ?? `Super ${baseName}`) : baseName)
          : copies === 1 ? `het ${baseName}` : baseName;
        const badgeClass = geneBadgeClass(gene?.type ?? 'recessive', gene?.lethalSuper, copies);
        return (
          <span
            key={id}
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium leading-none ${badgeClass}`}
          >
            {label}
          </span>
        );
      })}
    </span>
  );
}
