import { parseMorphString } from './morphParser'
import type { ParentGenotype } from 'bp-genetics'

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ImportSex = 'M' | 'F' | 'Unknown'

export interface ImportedAnimal {
  /** Source ID from the CSV (e.g. "202569-05") */
  sourceId: string
  /** Display name / nickname */
  name: string
  sex: ImportSex
  dob: string
  /** Raw traits string from the CSV */
  rawTraits: string
  genotype: ParentGenotype
  /** Tokens we couldn't match to any known gene */
  unrecognized: string[]
  /**
   * Genes flagged as "pos het" — not added to genotype since het status is unconfirmed.
   * Shown as an informational note in the UI.
   */
  possibleHets: string[]
}

// ─── RFC-4180 CSV parser ────────────────────────────────────────────────────────

function parseCSVText(text: string): string[][] {
  const rows: string[][] = []
  let col = ''
  let row: string[] = []
  let inQuote = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const next = text[i + 1]

    if (inQuote) {
      if (ch === '"' && next === '"') {
        col += '"'
        i++
      } else if (ch === '"') {
        inQuote = false
      } else {
        col += ch
      }
    } else {
      if (ch === '"') {
        inQuote = true
      } else if (ch === ',') {
        row.push(col)
        col = ''
      } else if (ch === '\r' && next === '\n') {
        row.push(col)
        col = ''
        rows.push(row)
        row = []
        i++
      } else if (ch === '\n' || ch === '\r') {
        row.push(col)
        col = ''
        rows.push(row)
        row = []
      } else {
        col += ch
      }
    }
  }
  // last column / row
  if (col || row.length > 0) {
    row.push(col)
    if (row.some((c) => c.trim())) rows.push(row)
  }

  return rows
}

// ─── Format detection ──────────────────────────────────────────────────────────

type CSVFormat = 'cltch' | 'morphmarket'

/** Strip trailing asterisks and lowercase — normalizes both CLTCH and MM headers. */
function normalizeHeader(h: string): string {
  return h.trim().replace(/\*+$/, '').trim().toLowerCase()
}

function detectFormat(headers: string[]): CSVFormat | null {
  const h = headers.map(normalizeHeader)
  if (h.includes('animal_id') && h.includes('morphs')) return 'cltch'
  if (h.includes('category') && h.includes('traits')) return 'morphmarket'
  return null
}

// ─── Row mappers ───────────────────────────────────────────────────────────────

function parseSex(raw: string): ImportSex {
  const s = raw.trim().toUpperCase()
  if (s === 'M' || s === 'MALE') return 'M'
  if (s === 'F' || s === 'FEMALE') return 'F'
  return 'Unknown'
}

function makeColtchRow(
  headers: string[],
  cells: string[]
): ImportedAnimal | null {
  const get = (col: string) => cells[headers.indexOf(col)]?.trim() ?? ''

  const sourceId = get('animal_id')
  const rawTraits = get('morphs')
  if (!sourceId && !rawTraits) return null

  const { genotype, unrecognized, possibleHets } = parseMorphString(rawTraits)

  return {
    sourceId,
    name: get('nickname') || sourceId,
    sex: parseSex(get('sex')),
    dob: get('dob'),
    rawTraits,
    genotype,
    unrecognized,
    possibleHets,
  }
}

function makeMorphMarketRow(
  headers: string[],
  cells: string[]
): ImportedAnimal | null {
  const get = (col: string) => cells[headers.indexOf(col)]?.trim() ?? ''

  // Animal_Id* is often blank in MM exports; fall back to the numeric listing ID
  // extracted from the listing URL (Mm_Url**), then to the title.
  const rawId = get('animal_id')
  const mmUrl = get('mm_url')
  const urlId = mmUrl ? (mmUrl.split('/').filter(Boolean).pop() ?? '') : ''
  const title = get('title')
  const sourceId = rawId || urlId || title

  const rawTraits = get('traits')
  if (!sourceId && !rawTraits) return null

  const { genotype, unrecognized, possibleHets } = parseMorphString(rawTraits)

  return {
    sourceId,
    name: title || sourceId,
    sex: parseSex(get('sex')),
    dob: get('dob'),
    rawTraits,
    genotype,
    unrecognized,
    possibleHets,
  }
}

// ─── Public API ────────────────────────────────────────────────────────────────

export interface CSVImportResult {
  format: CSVFormat
  animals: ImportedAnimal[]
  /** Number of rows skipped due to parse errors */
  skipped: number
}

export function importCSV(text: string): CSVImportResult | { error: string } {
  const rows = parseCSVText(text.trim())
  if (rows.length < 2)
    return { error: 'CSV must have a header row and at least one data row.' }

  const rawHeaders = rows[0].map((h) => h.trim())
  const format = detectFormat(rawHeaders)
  if (!format) {
    return {
      error:
        'Unrecognized CSV format. Expected CLTCH export (Animal_Id, Morphs…) or MorphMarket export (Category, Traits…).',
    }
  }

  // Normalize headers: strip trailing asterisks and lowercase so row mappers
  // work uniformly across both CLTCH and MorphMarket column naming conventions.
  const headers = rawHeaders.map(normalizeHeader)

  const animals: ImportedAnimal[] = []
  let skipped = 0

  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r]
    // Pad or trim cells to match header count
    while (cells.length < headers.length) cells.push('')

    const animal =
      format === 'cltch'
        ? makeColtchRow(headers, cells)
        : makeMorphMarketRow(headers, cells)

    if (animal) {
      animals.push(animal)
    } else {
      skipped++
    }
  }

  return { format, animals, skipped }
}
