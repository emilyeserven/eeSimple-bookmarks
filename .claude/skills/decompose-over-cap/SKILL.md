---
name: decompose-over-cap
description: >-
  Fix a fallow complexity violation in this repo — a component, hook, or function over
  `maxCognitive: 25` or `maxCyclomatic: 30` (`.fallowrc.jsonc`) — by picking the decomposition
  pattern that matches what is actually driving the score. Use when asked to "reduce the complexity
  of X", "fallow says X is too complex/over the cap", "split this huge component/hook/function",
  "the fallow-audit check fails on complexity", "this form has too many hooks", or before adding a
  `// fallow-ignore-next-line complexity`. Covers fallow's scoring rules (per-function scoring,
  +1 per hook call, JSX prop count) and a pattern table: controller/sub-hooks, sub-components,
  pure helpers, exhaustive Record dispatch, spread-coordinator, per-group split, parametrized helper.
---

# Decomposing an over-cap component or hook

The caps live in `.fallowrc.jsonc` → `health`: `maxCyclomatic: 30`, `maxCognitive: 25`.

## How fallow scores (read this before cutting)

- **Each function is scored independently.** Nested function bodies are **not** rolled into the
  parent (unlike SonarJS). Pulling handlers into lambdas or inner functions of the *same*
  component therefore does **not** lower the component's score when the cost is elsewhere.
- **+1 cognitive per hook call** — every `useState`, `useRef`, `useEffect`, `useMemo`, and every
  custom `use*` hook. A form calling ~25 hooks is over the cap before it has a single `if`.
  Over-cap components are usually **hook-dense, not branchy**.
- **+1 per `??`, `&&`, `||`, and ternary.** `?.` only affects *cyclomatic*.
- **JSX prop count counts.** A coordinator can score high with `cyclomatic: 1` purely from the
  number of props spelled out across its JSX; extracting inline conditionals alone may barely
  move it.

**Diagnose before cutting** — get the per-decision contributions:

```bash
pnpm exec fallow health --complexity --complexity-breakdown --format json --quiet 2>/dev/null || true
```

Each finding's `contributions[]` lists every hook call, branch, boolean operator, and case with its
source line and weight. The dominant kind tells you which pattern to use.

## Pattern table

| Dominant contribution | Pattern | How |
|---|---|---|
| `hook-density` (+1 per hook call) | **Controller hook / cohesive sub-hooks** | Move the form instance, state, and every handler into a `use<Thing>Controller` hook (its own file under `packages/client/src/hooks/` or co-located); partition the remaining `useState`/`useRef`/`useEffect`/query calls into cohesive `use*` sub-hooks (e.g. all UI-toggle state in one `use<Thing>UiState`). The component just wires the controller's return into JSX. Many `useState`s collapsing into one sub-hook call is often enough on its own. |
| `ternary` / `logical-*` in **JSX** | **Sub-components** | Lift each conditional region into a named component. Give anything non-trivial its **own co-located file** — an inline `const Foo = () => …` is invisible to fallow's duplicate detector and gets no Storybook story. |
| `ternary` / `??` in **derivation logic** | **Pure module helper + unit test** | Move the computation into `packages/client/src/lib/` (or a co-located `.ts`) and pin it with a test in the same commit. **Check for an existing helper first** — an inline default-values object or fallback chain often duplicates something already written and tested; reusing it removes the whole chain for free. |
| `switch` / `if`-ladder mapping a value → renderer | **Exhaustive `Record` dispatch**, or **one small component per branch** | Prefer `const RENDERERS = {…} satisfies Record<Kind, …>` so a missing branch fails `tsc`. When each branch's props differ enough that a table only adds indirection, write one named component per branch, each doing its **own** guard (`if (mode !== "x") return null`) so each is scored independently. |
| Prop count in a coordinator's JSX | **Spread-coordinator** | Give each child a *narrower* prop interface and have the parent delegate by spreading its props bag (`<Child {...props} />`). A wider object is assignable to a narrower prop type via spread, so the parent's JSX collapses to a flat list of one-attribute children. |
| A giant multi-section render | **Per-group split** | One component per visual/functional group; the coordinator keeps handlers + composition. This nests: if an extracted group is itself over cap, split *its* sections into named components (each with its own guard) rather than one big conditional block. A palette/menu coordinator scoring ~3x the cap typically clears in two passes this way. |
| Repeated near-identical **non-JSX** blocks (e.g. several `mutate` + toast-on-success/error functions) | **Parametrized helper** | Collapse into one function taking the varying bits (field key, label) as params; keep the original names as thin wrappers so the public API is unchanged. |

Repeated near-identical **JSX** blocks (summary lines, footnotes, pagination rows) collapse into one
small parametrized component first — that alone often clears the cap.

## Rules

- **Pair every extracted conditional/derivation with a test in the same commit** if it wasn't already
  covered (see the `test-structure` skill for harness choice and the `vitest-node-environment` skill
  for the `// @vitest-environment node` pragma on pure `.test.ts` files). If the logic is hard to test
  in isolation, the seam is wrong — move the seam, don't skip the test.
- **Behavior-preserving only.** JSX moves verbatim; wording, handlers, and React `key`s
  stay identical. Keep a detailed `key` *inside* the extracted child so remount semantics don't change.
- **Mind the import cap.** Splitting a file can push a coordinator past ESLint's
  `import/max-dependencies` cap of 20 (`eslint.config.js`). Split further rather than exempting it.
- **Verify:**
  ```bash
  pnpm lint:fix          # from the repo root
  pnpm typecheck
  pnpm --filter=@app/client test
  pnpm --filter=@app/client build-storybook   # when the component has stories
  pnpm exec fallow health --complexity --format json --quiet 2>/dev/null || true   # finding gone?
  ```
- `// fallow-ignore-next-line complexity` is a **last resort** for genuinely irreducible code (an
  exhaustive type-narrowing switch that can't be split without losing type safety) — never a shortcut.

See also: the `fallow` skill (CLI reference) and the `overnight-cleanup` skill (Phase 4 runs this
pattern table in a loop).
