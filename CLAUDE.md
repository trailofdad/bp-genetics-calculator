# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install all workspace dependencies (run from root)
npm install

# Dev server (http://localhost:5173)
npm run dev

# Type-check + build app
npm run build

# Lint
npm run lint

# Format
npm run format
npm run format:check

# Library only — must rebuild before app will pick up source changes
cd packages/bp-genetics
npm run build        # ESM + CJS + .d.ts via tsup
npm run typecheck    # tsc --noEmit
```

There is no automated test suite. Manual validation: `npm run build` (TypeScript), `npm run lint`, then `npm run dev` and spot-check in the browser.

## Architecture

This is an **npm workspaces monorepo**. The root is the `bp-calculator` Vite/React app; `packages/bp-genetics` is an independently publishable MIT-licensed genetics engine. The app imports `bp-genetics` via a workspace symlink resolving to `packages/bp-genetics/dist/` — **source changes to the library require `npm run build` inside `packages/bp-genetics/` before the app will see them**.

### `bp-genetics` library (`packages/bp-genetics/src/`)

Pure, zero-dependency TypeScript. Four subsystems:

- **`genes/`** — `data.ts` is the canonical gene registry (one object per morph). `registry.ts` wraps it in a `GeneRegistry` class with O(1) Map lookups.
- **`engine/`** — `punnett.ts` runs independent Punnett squares per gene (`crossGene`). `calculator.ts` orchestrates everything into `calculateOffspring()`, which is the primary public API. `labeler.ts` converts raw genotypes into display strings.
- **`interactions/`** — `data.ts` declares `InteractionRule` objects (BEL complex, neurological flags, lethals). `registry.ts` indexes them by gene for fast matching. All pairwise BEL compound-het rules are auto-generated from `BEL_COMPLEX_GENE_IDS` in `data.ts`.
- **`combos/`** — matches a genotype against well-known trade names (e.g. "Bumblebee"). `data.ts` is the combo list; `registry.ts` matches most-specific first.

`calculateOffspring` is pure — no side effects, no globals.

### Front-end app (`src/`)

React 19 + TypeScript, `react-router-dom` with `HashRouter`, Tailwind CSS v4, shadcn/ui component primitives, `@xyflow/react` for the visual playground.

**Global state** lives in `src/context/AppContext.tsx`, which composes three localStorage-backed hooks (`useSavedAnimals`, `useSavedPairings`, `useProjectsStorage`) and exposes them via React context to all pages. Raw storage reads/writes go through `src/lib/storage.ts` helpers.

**`CalculatorPage.tsx`** is the core feature: parent gene state lives here, `calculateOffspring` runs via `useMemo` on every change (no Calculate button), and results feed into `ResultsDisplay`. Parents can be loaded from saved animals; pairings can be saved by name.

**`src/projects/`** is the visual breeding tree (formerly `playground/`). `ProjectsView.tsx` is the ReactFlow canvas; `useProjectsState.ts` manages per-canvas nodes/edges; `useProjectsStorage.ts` handles save/load. Each `PairingNode` runs `calculateOffspring` independently.

**`src/components/icons/`** — Font Awesome v7 icons are bundled as local woff2 webfonts under `src/assets/Fonts/`. `createFaIcon.tsx` wraps them as React components; `index.tsx` exports named icon components.

Path alias `@/` resolves to `src/`.

## Key data-editing locations

| Task | File |
|------|------|
| Add/remove a gene | `packages/bp-genetics/src/genes/data.ts` — append to `GENES` array |
| Add an interaction rule | `packages/bp-genetics/src/interactions/data.ts` — append to `INTERACTION_RULES` |
| Add a BEL-complex gene | `packages/bp-genetics/src/interactions/data.ts` — add ID to `BEL_COMPLEX_GENE_IDS` |
| Add a trade-name combo | `packages/bp-genetics/src/combos/data.ts` |
| Mark a gene as individually risky | Add `riskNote` field on the `Gene` object in `genes/data.ts` |

Gene IDs and interaction rule IDs must be globally unique. Duplicates cause silent misbehaviour (wrong registry lookups / rules silently ignored).

## Important constraints

- **Do not modify `packages/bp-genetics/src/types.ts` lightly** — it is the public API contract; changes are breaking.
- **Do not modify `packages/bp-genetics/dist/`** — build artifact only.
- **`calculateOffspring` must remain pure** — no side effects or I/O.
- The app resolves `bp-genetics` from `dist/`, not source — rebuild the library after any source changes before testing in the app.

## localStorage keys

| Key | Content |
|-----|---------|
| `saved-animals` | `SavedAnimal[]` — named genotype snapshots |
| `saved-pairings` | `SavedPairing[]` — named parent-pair snapshots |
| `recent-genes:<parentLabel>` | `string[]` — last 5 gene IDs for each parent slot |
| `playground-projects` | Visual breeding tree project data |

## Deployment

Firebase Hosting. `firebase.json` and `.firebaserc` configure the target. `npm run build` then `firebase deploy`.
