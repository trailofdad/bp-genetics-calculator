import { GENES, geneById } from 'bp-genetics'
import type { ParentGenotype } from 'bp-genetics'

// ─── Gene name lookup ──────────────────────────────────────────────────────────

/** Normalize a gene name/alias for lookup: lowercase, hyphens→space, strip parens */
function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/-/g, ' ')
    .replace(/[()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Entries sorted longest-first so multi-word genes match before their prefixes */
type LookupEntry = { words: string[]; geneId: string }
/** Combo aliases: one name expands to multiple gene IDs (e.g. "Grail" = Lavender Albino + Clown) */
const COMBO_ALIASES: Record<string, string[]> = {
  grail: ['lavender_albino', 'clown'],
}
let _lookup: LookupEntry[] | null = null

function buildLookup(): LookupEntry[] {
  const map = new Map<string, string>()

  // From gene names (e.g. "Axanthic (VPI)" → "axanthic vpi" → axanthic_vpi)
  for (const g of GENES) {
    map.set(norm(g.name), g.id)
  }

  // From short names (e.g. "OD", "YB", "GS", "BP")
  for (const g of GENES) {
    const k = norm(g.shortName)
    if (k && !map.has(k)) map.set(k, g.id)
  }

  // From Gene.aliases field (e.g. G-Stripe, G Stripe for genetic_stripe)
  for (const g of GENES) {
    for (const alias of g.aliases ?? []) {
      const k = norm(alias)
      if (k && !map.has(k)) map.set(k, g.id)
    }
  }

  // Explicit CLTCH/MorphMarket aliases (written differently from our canonical names)
  const ALIASES: [string, string][] = [
    // Axanthic line variants — CLTCH writes "VPI Axanthic" instead of "Axanthic (VPI)"
    ['vpi axanthic', 'axanthic_vpi'],
    ['tsk axanthic', 'axanthic_tsk'],
    ['mj axanthic', 'axanthic_mj'],
    ['srp axanthic', 'axanthic_srp'],
    ['jolliff axanthic', 'axanthic_jolliff'],
    ['gcr axanthic', 'axanthic_gcr'],
    // Common shorthand / spelling variants
    ['redstripe', 'red_stripe'],
    ['g stripe', 'genetic_stripe'],
    ['gstripe', 'genetic_stripe'],
    ['lavender', 'lavender_albino'],
    ['lav', 'lavender_albino'],
    ['caramel', 'caramel_albino'],
    ['orange dream', 'orange_dream'],
    ['od', 'orange_dream'],
    ['yellow belly', 'yellow_belly'],
    ['yb', 'yellow_belly'],
    ['desert ghost', 'desert_ghost'],
    ['dg', 'desert_ghost'],
    ['black pastel', 'black_pastel'],
    ['bp', 'black_pastel'],
    ['hidden gene woma', 'hidden_gene_woma'],
    ['hgw', 'hidden_gene_woma'],
    ['gravel', 'gravel'],
    ['lesser platinum', 'lesser'],
    ['phantom', 'phantom'],
  ]
  for (const [alias, id] of ALIASES) {
    if (!map.has(alias)) map.set(alias, id)
  }

  const entries: LookupEntry[] = []
  for (const [normalizedName, id] of map) {
    entries.push({ words: normalizedName.split(' '), geneId: id })
  }
  // Sort longest first for greedy matching
  entries.sort((a, b) => b.words.length - a.words.length)
  return entries
}

function getLookup(): LookupEntry[] {
  if (!_lookup) _lookup = buildLookup()
  return _lookup
}

/** Modifier keywords that signal a new context — we stop consuming het-genes at these */
const MODIFIER_KEYWORDS = new Set([
  'het',
  'dbl',
  'triple',
  'quad',
  'super',
  'pos',
])

/**
 * Try to match a gene starting at `words[startIdx]`.
 * Returns [wordCount, geneId] on success or [0, null] on failure.
 */
function tryMatchGene(
  words: string[],
  startIdx: number
): [number, string | null] {
  const lookup = getLookup()
  for (const entry of lookup) {
    const len = entry.words.length
    if (startIdx + len > words.length) continue
    // Words are already norm()'d at call site since we pre-normalize the full string
    const candidate = words.slice(startIdx, startIdx + len).join(' ')
    if (entry.words.join(' ') === candidate) {
      return [len, entry.geneId]
    }
  }
  return [0, null]
}

/**
 * Try to match a combo alias (one name → multiple gene IDs) at words[startIdx].
 * Returns [wordCount, geneIds[]] or [0, null].
 */
function tryMatchCombo(
  words: string[],
  startIdx: number
): [number, string[] | null] {
  for (const [alias, ids] of Object.entries(COMBO_ALIASES)) {
    const aliasWords = alias.split(' ')
    const len = aliasWords.length
    if (startIdx + len > words.length) continue
    const candidate = words.slice(startIdx, startIdx + len).join(' ')
    if (aliasWords.join(' ') === candidate) {
      return [len, ids]
    }
  }
  return [0, null]
}

function setGene(genotype: ParentGenotype, geneId: string, copies: 1 | 2) {
  const current = genotype[geneId] ?? 0
  // Don't downgrade an already-set value
  if (copies > current) genotype[geneId] = copies
}

// ─── Public API ────────────────────────────────────────────────────────────────

export interface MorphParseResult {
  genotype: ParentGenotype
  /** Tokens we couldn't match to any known gene */
  unrecognized: string[]
  /**
   * Gene names flagged as "pos het" in the source string.
   * These are NOT added to the genotype — het status is unconfirmed.
   * Each entry is the display name of the gene (or raw token if unrecognized).
   */
  possibleHets: string[]
}

/**
 * Parse a CLTCH/MorphMarket traits string into a `ParentGenotype`.
 *
 * Handles: Het / Dbl Het / Triple Het / Quad Het / Super / Pos Het (skipped).
 * Codominant genes without a prefix = 1 copy; recessive without prefix = 2 copies (visual).
 */
export function parseMorphString(traits: string): MorphParseResult {
  const genotype: ParentGenotype = {}
  const unrecognized: string[] = []
  const possibleHets: string[] = []

  // Normalize the full string before splitting so hyphenated names (e.g. "G-Stripe")
  // are treated as multi-word tokens matching their lookup entries ("g stripe").
  const words = norm(traits).split(' ').filter(Boolean)
  let i = 0

  while (i < words.length) {
    const w = words[i] // already lowercased by norm()

    // ── "Pos Het <gene>" — possible het, not confirmed; collect separately ──
    if (w === 'pos') {
      i++ // consume "pos"
      if (i < words.length && words[i] === 'het') i++ // consume "het"
      const [consumed, geneId] = tryMatchGene(words, i)
      if (consumed > 0 && geneId) {
        const gene = geneById(geneId)
        possibleHets.push(gene?.name ?? words.slice(i, i + consumed).join(' '))
        i += consumed
      } else {
        // Gene not in registry — still a pos het, just record the raw token
        possibleHets.push(words[i] ?? '')
        i += 1
      }
      continue
    }

    // ── Het count prefix: "Het", "Dbl Het", "Triple Het", "Quad Het" ──
    let hetCount = 0
    if (w === 'dbl') {
      hetCount = 2
      i++
      if (i < words.length && words[i] === 'het') i++
    } else if (w === 'triple') {
      hetCount = 3
      i++
      if (i < words.length && words[i] === 'het') i++
    } else if (w === 'quad') {
      hetCount = 4
      i++
      if (i < words.length && words[i] === 'het') i++
    } else if (w === 'het') {
      hetCount = 1
      i++
    }

    if (hetCount > 0) {
      let consumed = 0
      while (i < words.length && consumed < hetCount) {
        // Stop if we hit another modifier
        if (MODIFIER_KEYWORDS.has(words[i])) break
        // Check combo aliases first (e.g. "Het Grail" → het lavender_albino + het clown = 2 genes, counts as 1)
        const [cwc, comboIds] = tryMatchCombo(words, i)
        if (cwc > 0 && comboIds) {
          for (const id of comboIds) setGene(genotype, id, 1)
          i += cwc
          consumed++
          continue
        }
        const [wc, geneId] = tryMatchGene(words, i)
        if (wc > 0 && geneId) {
          setGene(genotype, geneId, 1)
          i += wc
          consumed++
        } else {
          unrecognized.push(words[i])
          i++
        }
      }
      continue
    }

    // ── "Super <gene>" ──
    if (w === 'super') {
      i++
      if (i >= words.length) break
      const [wc, geneId] = tryMatchGene(words, i)
      if (wc > 0 && geneId) {
        setGene(genotype, geneId, 2)
        i += wc
      } else {
        unrecognized.push(`super ${words[i]}`)
        i++
      }
      continue
    }

    // ── Visual gene / combo (no prefix) ──
    const [cwc, comboIds] = tryMatchCombo(words, i)
    if (cwc > 0 && comboIds) {
      for (const id of comboIds) {
        const gene = geneById(id)
        const copies: 1 | 2 = gene?.type === 'recessive' ? 2 : 1
        setGene(genotype, id, copies)
      }
      i += cwc
      continue
    }
    const [wc, geneId] = tryMatchGene(words, i)
    if (wc > 0 && geneId) {
      const gene = geneById(geneId)
      const copies: 1 | 2 = gene?.type === 'recessive' ? 2 : 1
      setGene(genotype, geneId, copies)
      i += wc
    } else {
      unrecognized.push(words[i])
      i++
    }
  }

  return { genotype, unrecognized, possibleHets }
}
