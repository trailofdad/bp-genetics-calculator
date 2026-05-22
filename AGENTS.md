# AGENTS.md

Guidance for AI agents and automated contributors working on this repository.

---

## Repository overview

This is an npm workspaces monorepo with two packages:

| Package | Path | Description |
|---------|------|-------------|
| `bp-calculator` | `/` (root) | React + TypeScript + Vite front-end app |
| `bp-genetics` | `packages/bp-genetics/` | Open-source genetics engine (MIT) |

The app consumes `bp-genetics` via a workspace symlink — no publish step is needed locally.

---

## Setup

```bash
npm install          # installs all workspace dependencies
npm run dev          # starts the Vite dev server
npm run build        # type-checks and builds the app
npm run lint         # runs ESLint across the whole repo
```

To build only the library:

```bash
cd packages/bp-genetics
npm run build        # produces dist/ (ESM + CJS + .d.ts)
npm run typecheck    # tsc --noEmit on the library
```

---

## Architecture

### `bp-genetics` library

```
packages/bp-genetics/src/
  types.ts                  ← shared TypeScript types (Gene, OffspringOutcome, etc.)
  genes/
    data.ts                 ← canonical GENES array — edit here to add/remove genes
    registry.ts             ← GeneRegistry class (O(1) Map-based lookup)
    index.ts                ← default registry + re-exports
  engine/
    punnett.ts              ← pure crossGene() — independent Punnett square per gene
    labeler.ts              ← buildGenotypeLabel() — converts genotype → display string
    calculator.ts           ← calculateOffspring() orchestrator + formatProbability()
  interactions/
    types.ts                ← InteractionRule, InteractionCondition, InteractionEffect
    data.ts                 ← built-in rules (BEL complex, neurological notes)
    registry.ts             ← InteractionRegistry — indexes rules by gene for fast lookup
    index.ts                ← default registry + re-exports
  combos/
    types.ts                ← ComboCondition, ComboName types
    data.ts                 ← COMBO_NAMES array of well-known trade name combos (e.g. "Bumblebee")
    registry.ts             ← ComboRegistry — matches a genotype against all combo conditions
    index.ts                ← default registry + re-exports
  index.ts                  ← public API barrel (fully backward compatible)
```

### Front-end app

```
src/
  App.tsx                        ← router shell; wraps the whole app in HashRouter + AppProvider
  main.tsx                       ← entry point
  context/
    AppContext.tsx                ← global state provider: exposes animals, pairings, playground projects
  pages/
    DashboardPage.tsx            ← overview / home
    AnimalsPage.tsx              ← saved-animals CRUD (add, edit, delete, CSV import)
    PairingsPage.tsx             ← saved-pairings list with load/delete/notes
    CalculatorPage.tsx           ← gene cross calculator: holds parent state + reactive calculation
    PlaygroundPage.tsx           ← visual breeding tree (ReactFlow canvas)
    HelpPage.tsx                 ← documentation / reference
  components/
    Layout.tsx                   ← nav sidebar + page container
    ParentSelector.tsx           ← gene picker UI for each parent (recent genes, sorted list)
    ResultsDisplay.tsx           ← offspring outcome cards with notes
    GenotypePreview.tsx          ← compact read-only genotype chip display
    ImportModal.tsx              ← CSV import modal (used in AnimalsPage)
    ui/                          ← base UI components (badge, button, card, dialog, scroll-area, tabs)
  hooks/
    useSavedAnimals.ts           ← CRUD hook for localStorage-backed saved animals
    useSavedPairings.ts          ← CRUD hook for localStorage-backed saved pairings
  playground/
    PlaygroundView.tsx           ← ReactFlow canvas for the visual breeding tree
    usePlaygroundState.ts        ← per-canvas node/edge state
    usePlaygroundProjects.ts     ← project save/load (localStorage)
    dialogs/
      PairOffspringDialog.tsx    ← pick an offspring to breed further within the canvas
    edges/
      BranchEdge.tsx             ← custom ReactFlow edge renderer
    nodes/
      PairingNode.tsx            ← custom ReactFlow node renderer
    types.ts                     ← playground-specific types
    utils/
      compactLabel.ts            ← shorten outcome labels for canvas display
  utils/
    csvImport.ts                 ← parse exported CSVs into SavedAnimal[]
    formatDate.ts                ← date formatting helpers
    morphParser.ts               ← parse free-text morph strings into ParentGenotype
  lib/
    utils.ts                     ← cn() class-name helper (tailwind-merge + clsx)
  assets/                        ← static assets (hero image, favicon)
```

#### Key front-end behaviours

| Behaviour | Where |
|-----------|-------|
| **Reactive calculation** | `CalculatorPage.tsx` — `calculateOffspring` runs via `useMemo` on every parent change; no Calculate button. |
| **Recent genes** | `ParentSelector.tsx` — `useRecentGenes` hook, last 5 selected gene IDs per parent, persisted in `localStorage` under `recent-genes:<parentLabel>`. Clicking a recent chip adds the gene as Het if not already selected. Chips are colour-coded by gene type (violet = recessive, sky = codominant, rose = lethal). |
| **Selected-first sorting** | `ParentSelector.tsx` — genes with copies > 0 are sorted to the top of the filtered list so copy-count buttons are immediately reachable. |
| **Save pairing** | `CalculatorPage.tsx` + `useSavedPairings` hook (via `AppContext`) — saves a named pairing snapshot to `localStorage` under key `saved-pairings`. `PairingsPage` renders the list with load/delete/notes editing. |
| **Save animal** | `CalculatorPage.tsx` + `AnimalsPage.tsx` + `useSavedAnimals` hook (via `AppContext`) — saves a named genotype to `localStorage` under key `saved-animals`. Animals can be loaded into either parent slot in `CalculatorPage`. |
| **Global state** | `AppContext.tsx` — bridges `useSavedAnimals`, `useSavedPairings`, and `usePlaygroundProjects` into a single React context consumed by all pages. |
| **CSV import** | `AnimalsPage.tsx` + `ImportModal.tsx` + `utils/csvImport.ts` — parses a structured CSV (name, morphs columns) into `SavedAnimal[]` objects. |
| **Visual playground** | `PlaygroundPage.tsx` + `playground/` — ReactFlow canvas where users build a visual breeding tree; each pairing node runs `calculateOffspring` and lets users select offspring to pair further. |

---

## Common contribution tasks

### Add a new gene

Edit `packages/bp-genetics/src/genes/data.ts` and append a `Gene` object to the `GENES` array:

```typescript
{
  id: 'my_gene',          // snake_case, unique
  name: 'My Gene',        // human-readable display name
  shortName: 'MyGn',      // abbreviation used in compact contexts (recent-gene chips for names > 6 chars)
  type: 'recessive',      // 'recessive' | 'codominant' | 'dominant'
  category: 'Recessive',  // groups genes in the UI picker
  // For codominant genes, also add:
  // superName: 'Super My Gene',
  // lethalSuper: true,   // only if homozygous form is lethal
  // For dominant genes, lethalSuper applies if homozygous is lethal (e.g. Spider).
}
```

No other changes are required — the registry and UI pick up new genes automatically.

---

### Add a gene interaction rule

Edit `packages/bp-genetics/src/interactions/data.ts` and append an `InteractionRule` to the `INTERACTION_RULES` array:

```typescript
{
  id: 'my_rule',                  // unique kebab-case ID
  name: 'My Interaction',
  description: 'Optional longer description for docs.',
  requires: [
    { geneId: 'gene_a', minCopies: 1 },
    { geneId: 'gene_b', minCopies: 1 },
  ],
  effects: [
    { type: 'append_label', suffix: ' [TAG]' },
    { type: 'add_note', message: 'Informational note surfaced to the user.' },
  ],
}
```

Available effect types:

| Effect | Description |
|--------|-------------|
| `rename` | Replace the whole label with a fixed string |
| `append_label` | Append a suffix to the existing label |
| `add_note` | Add an informational note shown below the result |
| `lethal` | Flag this outcome as carrying a lethal combination |
| `risky` | Flag this outcome as carrying a risky combination. Optional `message` is added to `risks[]` |

### Mark a gene as individually risky

Set `riskNote` on the gene in `packages/bp-genetics/src/genes/data.ts`:

```typescript
{
  id: 'my_gene',
  name: 'My Gene',
  // ...
  riskNote: 'Short note explaining the risk — shown in gene list and on offspring outcome cards.',
}
```

The note is automatically surfaced in the UI:
- A **"risky"** orange badge appears next to the gene in the parent picker
- Every offspring outcome containing that gene shows the note in an orange `⚠` list

---



Add the gene ID to `BEL_COMPLEX_GENE_IDS` in `packages/bp-genetics/src/interactions/data.ts`:

```typescript
export const BEL_COMPLEX_GENE_IDS: readonly string[] = [
  'butter',
  // ... existing entries ...
  'my_new_bel_gene',  // ← add here
] as const;
```

All pairwise BEL compound-het rules are auto-generated from this list — no further changes needed.

---

## Key types

```typescript
// A parent's gene copy counts
interface ParentGenotype {
  [geneId: string]: CopyCount;   // 0 = none, 1 = het, 2 = visual/super
}

// A single offspring result
interface OffspringOutcome {
  genotype: Record<string, CopyCount>;
  probability: number;           // 0–1
  label: string;                 // e.g. "Pastel Clown [BEL]"
  hasLethal: boolean;            // true if any gene in this outcome has a lethal super combination
  hasRisk: boolean;              // true if any gene or interaction is individually flagged as risky
  risks: string[];               // aggregated risk messages from genes + interaction rules
  interactions: MatchedInteraction[];
  notes: string[];               // informational notes from matched interaction rules
  comboNames: string[];          // well-known trade names matching this genotype (most specific first)
}
```

---

## localStorage keys

The app uses `localStorage` for client-side persistence. No server or auth is involved.

| Key | Type | Owner | Description |
|-----|------|-------|-------------|
| `recent-genes:<parentLabel>` | `string[]` (gene IDs) | `useRecentGenes` in `ParentSelector.tsx` | Last 5 gene IDs selected for a given parent (e.g. `recent-genes:Parent 1`). Updated on every non-zero `setGene` call. |
| `saved-animals` | `SavedAnimal[]` (JSON) | `useSavedAnimals` in `hooks/useSavedAnimals.ts` | Array of named `{ id, name, genotype, savedAt }` animal snapshots. Newest first. |
| `saved-pairings` | `SavedPairing[]` (JSON) | `useSavedPairings` in `hooks/useSavedPairings.ts` | Array of named `{ id, name, parent1, parent2, parent1AnimalId?, parent2AnimalId?, notes?, savedAt }` pairing snapshots. Newest first. |

---

## Important constraints

- **Do not modify `packages/bp-genetics/src/types.ts` lightly** — it is the public API contract. Changes here are breaking.
- **`calculateOffspring` must remain pure** — no side effects, no I/O. Options are passed in, not read from globals.
- **Gene IDs must be unique** — duplicates in `genes/data.ts` will silently produce incorrect registry lookups.
- **Interaction rule IDs must be unique** — duplicates are silently ignored by the registry.
- **Always run `npm run build` from the repo root** before assuming changes are correct — the TypeScript compiler catches most mistakes.
- **Changes to `packages/bp-genetics/src/` require rebuilding the library first.** The app resolves `bp-genetics` from `dist/`, not source. Run `npm run build` inside `packages/bp-genetics/` before rebuilding the app, otherwise source changes will have no effect at runtime.
- **Do not modify `dist/`** — these are build artifacts. Always regenerate from source.

---

## Testing

There is no automated test suite yet. To validate changes manually:

1. `npm run build` from the root — confirms TypeScript is valid across both packages.
2. `npm run lint` — confirms no ESLint violations.
3. `npm run dev` — spot-check in the browser. Try a cross involving the changed gene/interaction.

When adding a test suite, place unit tests in `packages/bp-genetics/src/__tests__/` and use the pure engine functions (`crossGene`, `calculateOffspring`) as the primary test surface.
