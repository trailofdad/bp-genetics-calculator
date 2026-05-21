# BP Calculator

A Ball Python genetics calculator — predict offspring morph probabilities from two parent genotypes using Punnett square math.

Built with **React + TypeScript + Vite**, powered by the open-source [`bp-genetics`](./packages/bp-genetics) library.

---

## Features

- Select genes for two parents (recessive & codominant, including supers)
- **Reactive results** — offspring probabilities update instantly as you change genes; no Calculate button needed
- **Recent genes** — last 5 selected genes shown as quick-select chips per parent, persisted across sessions
- **Save pairings** — name and save any parent combination to localStorage; reload or delete from a side panel
- Lethal super combinations are flagged automatically
- BEL complex compound hets and neurological interaction notes surfaced inline
- Fully typed, zero-dependency genetics engine — usable outside this UI

---

## Repository layout

```
bp-calculator/           ← Vite + React front-end app
├── src/
│   ├── App.tsx
│   ├── components/
│   │   ├── ParentSelector.tsx      ← gene picker UI (recent genes, sorted selection)
│   │   ├── ResultsDisplay.tsx      ← offspring outcome cards
│   │   └── SavedPairingsPanel.tsx  ← slide-over panel for saved pairings
│   ├── hooks/
│   │   └── useSavedPairings.ts     ← localStorage CRUD for named pairings
│   └── ...
└── packages/
    └── bp-genetics/             ← open-source genetics library (MIT)
        └── src/
            ├── types.ts
            ├── genes/           ← gene data & registry
            ├── engine/          ← Punnett square engine
            └── interactions/    ← cross-gene interaction rule system
```

This is an [npm workspaces](https://docs.npmjs.com/cli/using-npm/workspaces) monorepo. The app consumes `bp-genetics` via a workspace symlink — no publish step needed for local development.

---

## Getting started

```bash
# Install all workspace dependencies
npm install

# Start the dev server (http://localhost:5173)
npm run dev

# Type-check everything
npm run build
```

---

## The `bp-genetics` library

The genetics engine lives in `packages/bp-genetics` and is independently publishable to npm.

```bash
# Build the library (ESM + CJS + .d.ts)
cd packages/bp-genetics
npm run build
```

See [`packages/bp-genetics/README.md`](./packages/bp-genetics/README.md) for the full API reference.

### Quick example

```typescript
import { calculateOffspring, formatProbability } from 'bp-genetics';

const outcomes = calculateOffspring(
  { albino: 1 },  // Het Albino
  { albino: 2 },  // Visual Albino
);

for (const { label, probability } of outcomes) {
  console.log(`${formatProbability(probability)}  ${label}`);
}
// 50%  Albino
// 50%  100% Het Albino
```

---

## Contributing

Contributions are welcome! See [AGENTS.md](./AGENTS.md) for guidance on common tasks like adding genes, interaction rules, and working with the codebase as an AI agent or automated contributor.

### Common tasks

| Task | Where to change |
|------|----------------|
| Add a new gene | One line in `packages/bp-genetics/src/genes/data.ts` |
| Add a gene interaction | One `InteractionRule` object in `packages/bp-genetics/src/interactions/data.ts` |
| Add a new BEL-complex gene | One entry in `BEL_COMPLEX_GENE_IDS` in `interactions/data.ts` |
| Change UI layout / gene picker | `src/components/ParentSelector.tsx` |
| Change results display | `src/components/ResultsDisplay.tsx` |
| Change save-pairing logic | `src/hooks/useSavedPairings.ts` |
| Change save-pairing UI panel | `src/components/SavedPairingsPanel.tsx` |

---

## License

The `bp-genetics` library is [MIT licensed](./packages/bp-genetics/LICENSE).
The front-end app (`src/`) is private.
