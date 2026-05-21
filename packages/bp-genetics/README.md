# bp-genetics

> Ball Python genetics calculator — Punnett square engine, gene data, and interaction rules.

A zero-dependency TypeScript library for computing offspring probabilities from two ball python parents. Models recessive and codominant genes (including lethal supers) using independent Punnett square crosses, with a declarative interaction rule system for cross-gene effects like the BEL complex.

## Installation

```bash
npm install bp-genetics
```

## Usage

```typescript
import { calculateOffspring, formatProbability } from 'bp-genetics';

const parent1 = { albino: 1, clown: 0 };   // Het Albino
const parent2 = { albino: 1, clown: 1 };   // Het Albino, Het Clown

const outcomes = calculateOffspring(parent1, parent2);

for (const { label, probability, notes } of outcomes) {
  console.log(`${formatProbability(probability)}  ${label}`);
  for (const note of notes) console.log(`  ℹ ${note}`);
}
// 25%  Albino
// 25%  100% Het Albino, 100% Het Clown
// ...
```

## API

### `calculateOffspring(parent1, parent2, options?)`

Returns a sorted array of `OffspringOutcome` objects (highest probability first).

| Parameter | Type                 | Description                              |
|-----------|----------------------|------------------------------------------|
| `parent1` | `ParentGenotype`     | Map of gene ID → copy count (0, 1, or 2) |
| `parent2` | `ParentGenotype`     | Map of gene ID → copy count (0, 1, or 2) |
| `options` | `CalculatorOptions`  | Optional — custom registries (see below) |

#### `CopyCount`
- `0` — Normal (no copies)
- `1` — Heterozygous / single-gene visual (codominant)
- `2` — Homozygous (visual recessive or super codominant)

#### `OffspringOutcome`
```typescript
interface OffspringOutcome {
  genotype: Record<string, CopyCount>;
  probability: number;             // 0–1
  label: string;                   // e.g. "Pastel [BEL]"
  hasLethal: boolean;              // true if a lethal super combination is present
  interactions: MatchedInteraction[];  // rules that fired on this outcome
  notes: string[];                 // informational messages from interactions
}
```

#### `CalculatorOptions`
```typescript
interface CalculatorOptions {
  geneRegistry?: GeneRegistry;              // override the built-in gene list
  interactionRegistry?: InteractionRegistry | null;  // null disables interactions
}
```

---

### `formatProbability(p)`

Formats a 0–1 probability as a human-readable percentage string (e.g. `"25%"`, `"6.25%"`).

---

### Gene data

```typescript
import { GENES, GENE_CATEGORIES, geneById } from 'bp-genetics';
```

- **`GENES`** — Full list of `Gene` objects.
- **`GENE_CATEGORIES`** — Unique list of category strings.
- **`geneById(id)`** — Look up a gene by its string ID.

---

### Interaction rules

```typescript
import { INTERACTION_RULES, BEL_COMPLEX_GENE_IDS } from 'bp-genetics';
```

- **`INTERACTION_RULES`** — All built-in `InteractionRule` objects (BEL complex pairs + neurological notes).
- **`BEL_COMPLEX_GENE_IDS`** — The list of gene IDs that participate in the BEL complex.

Each `InteractionRule` is a plain data object with a list of `requires` conditions and `effects` applied when all conditions are met. See [`src/interactions/types.ts`](./src/interactions/types.ts) for the full type definitions.

To disable interaction processing entirely:

```typescript
const outcomes = calculateOffspring(p1, p2, { interactionRegistry: null });
```

---

## Contributing

See [`AGENTS.md`](../../AGENTS.md) at the repo root for full contributor guidance, including how to add genes, interaction rules, and BEL-complex genes.

## License

MIT
