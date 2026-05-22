import { GENES } from 'bp-genetics'
import type { ParentGenotype } from 'bp-genetics'

function geneBadgeClass(
  type: string,
  lethalSuper?: boolean,
  copies?: number
): string {
  if (lethalSuper && copies === 2) {
    return 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30'
  }
  if (type === 'codominant') {
    return 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/25'
  }
  // recessive het
  if (copies === 1) {
    return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25'
  }
  // recessive visual
  return 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/25'
}

export function GenotypePreview({ genotype }: { genotype: ParentGenotype }) {
  const active = Object.entries(genotype).filter(([, c]) => c > 0)
  if (active.length === 0)
    return <span className="text-xs text-muted-foreground italic">Normal</span>
  return (
    <span className="flex flex-wrap gap-1">
      {active.map(([id, copies]) => {
        const gene = GENES.find((g) => g.id === id)
        const isCodom = gene?.type === 'codominant'
        const baseName = gene?.name ?? id
        const label = isCodom
          ? copies === 2
            ? (gene?.superName ?? `Super ${baseName}`)
            : baseName
          : copies === 1
            ? `het ${baseName}`
            : baseName
        const badgeClass = geneBadgeClass(
          gene?.type ?? 'recessive',
          gene?.lethalSuper,
          copies
        )
        return (
          <span
            key={id}
            className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] leading-none font-medium ${badgeClass}`}
          >
            {label}
          </span>
        )
      })}
    </span>
  )
}
