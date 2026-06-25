---
name: overnight-cleanup
description: >-
  Autonomous overnight codebase health sweep for eeSimple Bookmarks. Runs fallow dead-code removal,
  test coverage for under-tested high-risk code (plus hardening existing tests to run faster and less
  flaky without weakening them), duplicate consolidation, complexity reduction
  (extracting complicated/nested conditionals into readable structures), large-file splitting,
  Storybook story coverage for undocumented components, and skill maintenance in a fixed phase order,
  committing after each successful phase and looping until the fallow health score reaches 8.0 or
  higher, then opening a PR for the sweep — plus a separate branch/PR off the latest main for each
  item too risky to bundle — subscribing to each, and doing at least one proactive round of CI
  follow-up before going event-driven so CI can be handled automatically. Use
  when asked to "run an overnight cleanup", "bring fallow health up overnight", "add tests where
  coverage is poor", "make the test suite faster", "de-flake the tests", "clean up the codebase while
  I sleep", or "run a multi-phase fallow cleanup loop".
---

# Overnight cleanup

This skill drives an autonomous, multi-phase codebase health sweep. It runs until fallow's
composite health score reaches **8.0 / 10** or no further gains can be made. Commit after every
phase that produces a change. Never break passing tests.

Phase order (always respect this sequence within each loop iteration):

1. Dead code
2. Test coverage & test health (add tests to under-tested, high-risk code — a safety net before
   refactoring — and make existing tests faster / less flaky without weakening them)
3. Duplicates
4. Complexity (extract complicated/nested conditionals; pair each extraction with a test)
5. Large files / high-import files
6. Storybook story coverage (add stories for any component that lacks one)
7. Skill maintenance (review recent commits; add/remove repo skills as needed)

Dead code comes first so you never write tests for code you are about to delete. Test coverage comes
**before** the refactoring phases (Duplicates, Complexity, Large files) so those refactors land on a
regression net.

---

## 0. Pre-flight stock-taking

Run these before starting any phase. Record the baseline numbers in working memory **and** append
them to a scratch run-log file (e.g. `/tmp/overnight-run.md`) so they survive a crash or context
reset; compare against them at the end of every loop iteration.

```bash
# Full health snapshot — the overall score lives at .health_score in the JSON
pnpm exec fallow health --hotspots --targets --file-scores --format json --quiet 2>/dev/null || true

# Dead-code count — compare against the intentional 31-export baseline
pnpm exec fallow dead-code --format json --quiet 2>/dev/null || true

# Duplication percentage — threshold is 6.0% (from .fallowrc.jsonc)
pnpm exec fallow dupes --format json --quiet 2>/dev/null || true

# Full composite report (dead-code + duplication + health in one pass)
pnpm fallow --format json --quiet 2>/dev/null || true
```

Key values to record:

| Metric | Location in JSON | Target |
|---|---|---|
| Health score | `.health_score` (top-level, `fallow health` output) | ≥ 8.0 |
| Dead-code issues | `.total_issues` (`fallow dead-code` output) | ≤ 31 (baseline) |
| Duplication % | `.stats.duplication_percentage` (`fallow dupes` output) | < 6.0 % |
| Complexity findings | `.findings[]` where `kind` contains `"complexity"` | 0 above caps |
| Untested high-risk files | cross-ref `.refactoring_targets[]` / complexity `.findings[]` against the test-file map (Phase 2.1) | trending down |

There is no coverage percentage in fallow's output and no coverage tooling configured by default —
the "untested high-risk" metric is a heuristic (risk targets that have no corresponding test file),
not a precise percentage. That is intentional; see Phase 2.

---

## Safety rules (read before every phase)

1. **Never touch `packages/client/src/routeTree.gen.ts`** — it is generated; fallow's
   `ignorePatterns` already excludes it, but do not hand-edit it under any circumstances.
2. **Never remove exports from `packages/client/src/components/ui/**`** — the shadcn/ui override
   in `.fallowrc.jsonc` silences `unused-export` there intentionally. The baseline has exactly
   31 unused exports from this directory. Do not remove them, do not add `fallow-ignore` comments
   to them, and do not treat them as cleanup targets.
3. **Verify before every commit** — always run the full suite in this order:
   ```bash
   pnpm lint:fix       # always from repo root, never from inside a package
   pnpm typecheck
   pnpm test
   ```
   If any step fails, fix the failure before committing. Do not commit a broken state. If a phase's
   change cannot be made green quickly, **revert that phase's diff** (`git restore` / `git stash`)
   and move on rather than committing red or stalling the whole run.
4. **Prefer small, targeted commits** — one commit per phase per loop iteration. Use conventional
   commit format (`refactor: …`, `perf: …`, `test: …`, `chore: …`).
5. **Do not run `fallow watch`** — it is interactive and never exits.
6. **Always `--dry-run` before `fix`** — preview every auto-fix before applying it.
7. **Always pass `--format json --quiet 2>/dev/null || true`** to every fallow command.
8. **`fallow fix --yes` is required** — the environment is non-TTY; omitting `--yes` exits with
   code 2.
9. **Do not modify `.fallow/dead-code-baseline.json`** unless explicitly asked. It tracks the
   intentional 31-export baseline for CI.

---

## Phase 1 — Dead code

### 1.1 Inspect the current dead-code report

```bash
pnpm exec fallow dead-code --format json --quiet 2>/dev/null || true
```

Parse the JSON. Focus only on `unused_exports` and `unused_files`. Ignore anything in
`packages/client/src/components/ui/**` — those are shadcn/ui primitives covered by the config
override.

The intentional baseline is **31 unused exports**, all in `packages/client/src/components/ui/**`.
Any unused export or file **outside** that directory is a real cleanup target.

To confirm which exports are safe to remove before touching them:

```bash
pnpm exec fallow dead-code --trace <relative-file-path>:<ExportName> --format json --quiet 2>/dev/null || true
```

If the trace shows no callers and the file is not under `packages/client/src/components/ui/`,
the export is a real candidate.

### 1.2 Auto-fix: preview, then apply

```bash
# Preview what fallow fix will remove
pnpm exec fallow fix --dry-run --yes --format json --quiet 2>/dev/null || true

# Apply — verify the dry-run output looks correct first
pnpm exec fallow fix --yes --format json --quiet 2>/dev/null || true
```

### 1.3 Check for manual work

After the auto-fix, re-run:

```bash
pnpm exec fallow dead-code --format json --quiet 2>/dev/null || true
```

If any unused files or exports remain outside `packages/client/src/components/ui/**`, remove
them manually. Unused files with no exports can be deleted outright. Unused exports in files
that still have other consumers: remove just the export declaration.

### 1.4 Verify and commit

```bash
pnpm lint:fix
pnpm typecheck
pnpm test
```

If all pass:

```bash
git add -p   # stage only dead-code removals; never stage unrelated drift
git commit -m "refactor: remove dead code (Phase 1)"
```

### 1.5 Confirm baseline is intact

```bash
pnpm exec fallow dead-code --format json --quiet 2>/dev/null || true
```

`total_issues` must equal exactly 31 (the shadcn baseline) or fewer — never more.
If it is greater than 31, you have introduced new dead code; fix before proceeding.

---

## Phase 2 — Test coverage and test health

Dead code is gone; now add tests to the riskiest **under-tested** code *before* the refactoring
phases, so Duplicates / Complexity / Large-files land on a regression net. Adding coverage is also a
standing goal in its own right. Don't chase a coverage percentage — target the code most likely to
break silently. This phase has a **second, behavior-preserving goal**: make the tests that already
exist faster and less flaky (2.7) — without ever weakening the safety net they provide.

### 2.1 Map source files to their tests

Each package has its **own** test runner — never cross them:

- **client** (`packages/client`): **Vitest** + Testing Library (`vitest run`, jsdom). Tests are
  `*.test.ts` / `*.test.tsx`, co-located beside the source or under `src/`. Shared harness lives in
  `packages/client/src/test-utils/` (`setup.ts`). Run `pnpm --filter=@eesimple/client test`.
- **middleware** (`packages/middleware`): **Node test runner** (`node --test --import tsx`). Tests
  live in `packages/middleware/src/tests/**/*.test.ts`. Run `pnpm --filter=@eesimple/middleware test`.
- **types** (`packages/types`): currently has **no test runner and no tests** — yet it owns the
  shared `evaluateConditions` predicate both client and middleware depend on. See 2.4.

Build the untested-source map:

```bash
# client — source (excluding tests/stories) vs. existing tests
git ls-files 'packages/client/src/**/*.ts' 'packages/client/src/**/*.tsx' | grep -vE '\.(test|stories)\.tsx?$'
git ls-files 'packages/client/src/**/*.test.ts' 'packages/client/src/**/*.test.tsx'

# middleware — source vs. existing tests
git ls-files 'packages/middleware/src/**/*.ts' | grep -vE '\.test\.ts$'
git ls-files 'packages/middleware/src/tests/**/*.test.ts'
```

A source file is "covered" when a test exercises its behavior — usually a co-located `Foo.test.tsx`
(client) or a `tests/<area>.test.ts` that imports it (middleware). Treat a source file with no
corresponding test as a coverage gap.

### 2.2 Prioritize by risk, not by count

Cross-reference the untested-source list with the risk signals captured in pre-flight and pick the
highest-leverage gaps first:

- **`refactoring_targets[]`** (composite complexity + coupling + churn): untested **and** high-churn
  is the top priority — it changes often and nothing guards it.
- **complexity `findings[]`**: branchy logic with no test is the single highest-value test to add —
  it is exactly the code Phase 4 will refactor, so the test you write here is the net for that.
- **Shared predicates / pure derivations** are cheap to test and high-leverage:
  - `packages/types/src/conditions.ts` — `evaluateConditions` (see 2.4).
  - `packages/client/src/lib/*` — e.g. `bookmarkSearch.ts` (`bookmarkMatchesSearch`),
    `cardDisplayRules.ts` (`resolveCardDisplay`), `bookmarkFormat.ts`, `tagTree.ts`,
    `autofillRulesFilter.ts`.
  - `packages/middleware/src/services/*` — counts, tree builders, hydration, condition evaluation.
- **Prefer pure functions / utilities / services first** (no DOM or HTTP harness needed); component
  tests second.

### 2.3 Write the tests (match the package's runner)

- Use the runner that belongs to the package — **never** introduce Vitest into middleware or
  `node:test` into client.
- Mirror a neighboring test for imports and harness. Client component tests reuse
  `src/test-utils/`; middleware service/route tests follow `packages/middleware/src/tests/`.
- Write **behavior** tests: assert observable output for representative *and* edge inputs (empty,
  boundary, fallback/default arm) — not change-detector snapshots of internals.
- For pure branchy logic, cover each condition arm plus the default path. This is the same logic
  Phase 4 may extract, so thorough branch coverage here pays off twice.

### 2.4 The types package has no test harness

`@eesimple/types` ships `evaluateConditions` — per CLAUDE.md the single most important shared
function in the repo (server and client **must** call the same one) — with **zero tests**. To test
it you must also stand up a runner: add a `test` script to `packages/types/package.json` and a
minimal Vitest (or `node:test` + `tsx`) config mirroring middleware, and confirm root `pnpm test`
(`pnpm run -r test`) picks it up. This is a deliberate multi-file change — do it in its **own**
commit, only if verification stays green. If standing up the harness is out of scope for the run,
**record `evaluateConditions` as an untested high-risk gap in the final report** rather than skipping
it silently.

### 2.5 Verify and commit

```bash
pnpm lint:fix
pnpm typecheck
pnpm test
```

If all pass:

```bash
git add -p   # stage the new tests (+ any harness wiring); never unrelated drift
git commit -m "test: add coverage for under-tested <area> (Phase 2)"
```

### 2.6 Optional — measure coverage only if tooling is present

Coverage instrumentation is **not** configured by default. If `@vitest/coverage-v8` is already
installed, you may run `pnpm --filter=@eesimple/client exec vitest run --coverage` for a precise
client map to refine targeting. Do **not** add the coverage dependency or block on a network install
just to measure — the file-presence + risk heuristic in 2.1–2.2 is sufficient for prioritization,
and the remote environment may block installs.

### 2.7 Make existing tests faster and less flaky

Beyond adding coverage, harden the tests already in the suite so they run faster and stop flaking.
This is a **standing, behavior-preserving** goal — it must **never weaken the safety net**.

**Guardrail (non-negotiable).** This step only makes a test *more reliable or faster while asserting
the exact same behavior*. Do **not** delete a test, mark it `.skip` / `it.only`, relax or loosen an
assertion, bump a `waitFor` timeout to paper over a race, or add a retry to hide a flake — those
trade the regression net away, which is the opposite of why Phase 2 exists. If a test cannot be
de-flaked without weakening what it asserts, **leave it and record it in the final report** rather
than touching it.

**Find the slow tests (cheap — read durations, don't re-run repeatedly).** Vitest already prints
per-file and per-test durations:

```bash
pnpm --filter=@eesimple/client exec vitest run --reporter=verbose 2>/dev/null || true
```

The middleware's `node --test` runner reports per-test durations too. Target the few slowest files
(the large mock-heavy ones — e.g. `BookmarkForm.test.tsx`), not the whole suite.

**Find the flaky tests (static signals first, bounded re-run second).** Don't repeat the full suite
to hunt flakes — it burns the overnight budget. Look for the structural causes instead:

- **Real timers / arbitrary waits** — `setTimeout`, `await new Promise(r => setTimeout(r, …))`, or a
  raw `sleep` inside a test is a race waiting to happen. Replace it with fake timers
  (`vi.useFakeTimers()` + `vi.advanceTimersByTimeAsync(…)`, restored in a `try/finally` with
  `vi.useRealTimers()`), mirroring `packages/client/src/components/HomepageContentSettings.test.tsx`.
  There are **none** in the suite today — keep it that way.
- **Non-deterministic inputs** — a test that calls `new Date()` / `Date.now()` / `Math.random()` (or
  asserts on output that does) drifts with wall-clock / locale. Pin it with `vi.setSystemTime(…)` or
  the shared factory's fixed `NOW` (`packages/client/src/test-utils/factories.ts`). The live
  `new Date().toISOString()` in `packages/client/src/stores/notificationStore.test.ts` is the kind of
  input to pin.
- **Broad `waitFor` / `findBy*`** — one that wraps a synchronous assertion, or polls on several
  things at once, is slow and racy. Narrow it to the single observable you actually wait on; **do not
  raise the timeout.**
- **Shared mutable state / order dependence** — a test that passes alone but fails in suite usually
  leaks state. Ensure `beforeEach` / `afterEach` reset stores, clear mocks (`vi.clearAllMocks()`),
  and unstub globals (`vi.unstubAllGlobals()`). References: `RightPanel.test.tsx`,
  `BookmarkImageField.test.tsx`.
- **Bounded confirmation only** — to confirm a fix (or a suspicion), re-run *just the suspect file* a
  few times, never the whole suite:

  ```bash
  pnpm --filter=@eesimple/client exec vitest run <suspect-file> 2>/dev/null || true   # repeat ~3×
  ```

**Speed levers (all behavior-preserving).**

- Replace an inline fixture builder with the shared factories (`makeBookmark` / `makeCategory` /
  `makeCustomProperty`) — this trims per-test setup *and* removes type-skew risk. The inline
  `youtubeWebsite()` fixture in `BookmarkForm.test.tsx` is the kind to migrate.
- Hoist a **truly static** fixture out of `beforeEach` so it is built once — only when no test ever
  mutates it (never share mutable state to save time).
- Prefer fake timers over a real-time debounce wait.
- **Do not** add a `retry`, `pool`, or relaxed-timeout setting to the Vitest config to make the suite
  "pass" — that masks flakes instead of fixing them. The config (`packages/client/vite.config.ts`)
  intentionally has no `retry`; keep it so.

**Verify and commit.** Run the full suite and confirm it still passes **and the test count did not
drop** (nothing was silently removed or skipped):

```bash
pnpm lint:fix
pnpm typecheck
pnpm test
```

If all pass, commit the test hardening on its own:

```bash
git add -p   # stage only the test changes
git commit -m "test: speed up and de-flake existing tests (Phase 2)"
```

**Scope and budget.** This is opportunistic and bounded — fix the few highest-value slow/flaky tests,
not the whole suite. If a test hasn't improved after ~2 attempts, note it in the final report and
move on. Like coverage, stories, and skill maintenance, it does **not** move the fallow health score,
so run it **once per run** rather than every loop iteration — unless the tests you *added* in 2.1–2.5
this iteration introduced new slowness or flakiness, in which case clean those up before committing
them.

---

## Phase 3 — Duplicates

### 3.1 Inspect the duplication report

```bash
pnpm exec fallow dupes --format json --quiet 2>/dev/null || true
```

The config budget is **6.0 %** (`"threshold": 6.0` in `.fallowrc.jsonc`). The `ignore` list
already excludes `routeTree.gen.ts`, `packages/middleware/src/routes/**`, `*.test.ts`, and
`*.test.tsx`. Do not refactor any of those files for duplication.

Focus on the `clone_groups` array. Each group has:
- `fingerprint` — stable ID for tracing
- `instances[]` — files and line ranges that are copies of each other
- `token_count` — how large the clone is (higher = more savings)

Work the largest `token_count` groups first.

### 3.2 Trace a clone group before refactoring

```bash
pnpm exec fallow dupes --trace dup:<fingerprint> --format json --quiet 2>/dev/null || true
```

The trace returns exact file/line ranges of each instance and a `suggested_name` for an extracted
function. Read the actual source at those locations before writing any abstraction.

### 3.3 Manual refactoring strategy

Auto-fix is not available for duplicates — all consolidation is manual.

**Shared utility function.** When two or more files contain the same logic with no component
markup: extract to a shared file in the appropriate layer.
- Pure client utilities → `packages/client/src/lib/`
- Shared type-level helpers → `packages/types/src/`
- Middleware utilities → `packages/middleware/src/utils/`

**Shared React component.** When two or more files render the same JSX structure with minor prop
variation: extract a parametrized component into `packages/client/src/components/`. Do not create
panel-only variants — the panel and main app share components.

**Extract one-off / inline components into their own files to surface *future* duplication.** A
sub-component defined inline as `const Foo = () => …` inside a parent is invisible to fallow's clone
detector — when the same shape is later pasted into another file, nothing flags it and it quietly
becomes a copy-paste source. When you touch a file that buries a non-trivial component inline, lift
it into its own co-located `Foo.tsx` (named, file-level export) even if it has a single caller today.
That single change makes the next copy detectable here in Phase 3 and earns the component a Storybook
story in Phase 6. (Trivial 2–3 line presentational fragments can stay inline; extract once it has
real structure, props, or branching.)

**Shared hook.** When the same TanStack Query call + options appears in multiple hooks: extract a
base query or shared `queryOptions` object and call it from each hook.

**Do not consolidate route boilerplate in `packages/middleware/src/routes/**`** — the config
already excludes that directory, and the repetition is intentional Fastify registration structure.

### 3.4 Verify and commit

```bash
pnpm lint:fix
pnpm typecheck
pnpm test
```

If all pass:

```bash
git add -p
git commit -m "refactor: consolidate duplicate code (Phase 3)"
```

### 3.5 Confirm budget is respected

```bash
pnpm exec fallow dupes --format json --quiet 2>/dev/null || true
```

`stats.duplication_percentage` must be below 6.0 %. If it remains at or above 6.0 %, the CI
gate will fail — continue reducing before moving to phase 4.

---

## Phase 4 — Complexity

### 4.1 Identify complexity hotspots

```bash
pnpm exec fallow health --hotspots --targets --file-scores --format json --quiet 2>/dev/null || true
```

The caps from `.fallowrc.jsonc` are `maxCyclomatic: 30` and `maxCognitive: 25`. Any finding with
cyclomatic > 30 or cognitive > 25 is a hard violation. Work the highest-priority `--targets`
entries first.

For a per-decision-point breakdown to understand exactly what to split:

```bash
pnpm exec fallow health --complexity --complexity-breakdown --format json --quiet 2>/dev/null || true
```

The `contributions[]` array in each finding lists every branch, loop, boolean operator, and case
with its source line and cyclomatic/cognitive weight.

### 4.2 Refactoring patterns

**Extract complicated or nested conditionals into the most readable structure.** A deeply nested or
multi-clause conditional is both a complexity-score driver and a readability sink. Don't leave it
inline — lift it into whichever of these reads clearest for the case:
- a **named predicate / helper function** (`isEligibleForX(bookmark)`) when it's a boolean test —
  the name documents intent and removes the inline cognitive load;
- a **named constant** for a magic threshold or a compound boolean assembled once
  (`const isArchivable = … ; if (isArchivable) …`);
- a **lookup dict / `Record` / `Map`** when an `if/else` chain or `switch` maps an input value to a
  result — replace the branch ladder with a table keyed by the input;
- an **early-return guard** to flatten `if / else if / else` nesting.

Small, single-use utility helpers are welcome here — a one-off `formatX` / `isY` in the same file
that names a confusing expression earns its keep even with a single caller. Readability is the goal,
not reuse.

**Pair every extracted conditional with a test.** If the complicated/nested conditional you pull out
is **not already covered by a test**, write one in the **same commit** as the extraction, using the
runner for that package (see Phase 2). The test pins the behavior you just moved, so the refactor is
provably behavior-preserving. If branchy logic is hard to test in isolation, that's a signal the
extraction boundary is wrong — fix the seam, don't skip the test.

**Extract sub-functions.** Move a deeply nested block or a long arm of a `switch`/`if`-chain
into a named helper function in the same file (or shared lib if it generalises). Prefer named
helpers over anonymous lambdas — they name intent and lower cognitive score.

**Split switch arms.** Extract each complex case arm into its own function. The dispatcher stays
simple; handlers hold the logic.

**Decompose React components.** A component with high cognitive complexity usually renders too
many conditions inline. Extract sub-components for each conditional region; keep the parent as a
coordinator that passes props. Put each extracted sub-component in its **own** co-located file
(`ComponentName.tsx`), not an inline `const` in the parent — a file-level component is what lets the
duplicate detector (Phase 3) catch the next copy and what earns it a Storybook story (Phase 6).
For these, **the score is driven by JSX prop count, not just branching** — a coordinator can score
60+ with `cyclomatic: 1` purely from the number of props spelled across its JSX, so extracting the
inline conditionals alone may barely move it. The lever is the **spread-coordinator**: give each
extracted child a *narrower* prop interface and have the parent delegate by spreading its props bag
(`<Child {...props} />`) — a wider object is assignable to a narrower prop type via spread, so the
parent's JSX collapses to a flat list of one-attribute children. `BookmarkRevealedFields` (cognitive
62 → <25, with the inline-extraction-only step stuck at 61) is the reference.

**Spread the hooks, not just the handlers — fallow scores each function independently.** Nested
function bodies are **not** rolled into the parent (unlike SonarJS cognitive complexity), so pulling
handlers/conditions into lambdas or sub-functions of the *same* component **does not lower its
score** when the cost is **hook-density**: fallow adds **+1 cognitive per hook call** (`useState` /
`useRef` / `useEffect` / every custom hook), plus +1 per `??` / `&&` / ternary (`?.` is
cyclomatic-only). A form that calls ~25 hooks is already over `maxCognitive` before any branching.
Run `pnpm exec fallow health --complexity-breakdown` to confirm the contributions. For an over-cap
component/hook, **distribute the `useState`/`useRef`/`useEffect` into cohesive sub-hooks**, move a
controller's state + handlers into a `use*Controller` hook, and lift `??` chains + heavy
self-contained logic into module-level (unit-testable) helpers — leaving a thin JSX shell. Reference:
`BookmarkForm` → `useBookmarkFormController` + `useBookmarkFormUiState` / `useSourceDefaultFlags` +
`bookmarkSubmit.ts` (see CLAUDE.md → **Large-form / over-cap decomposition**).

**Do not add `// fallow-ignore-next-line complexity`** unless you have confirmed the complexity
is unavoidable (e.g. an exhaustive type-narrowing switch that cannot be split without losing type
safety). Suppression is a last resort, not a shortcut.

### 4.3 Verify and commit

```bash
pnpm lint:fix
pnpm typecheck
pnpm test
```

If all pass (the commit may include both the refactor and the tests that pin it):

```bash
git add -p
git commit -m "refactor: reduce complexity hotspots (Phase 4)"
```

### 4.4 Confirm zero hard violations

```bash
pnpm exec fallow health --format json --quiet 2>/dev/null || true
```

Scan `findings[]` for any entry with cyclomatic > 30 or cognitive > 25. There should be none.
If any remain, continue phase 4 before moving to phase 5.

---

## Phase 5 — Large files and high-import files

### 5.1 Identify large files

```bash
pnpm exec fallow health --file-scores --format json --quiet 2>/dev/null || true
```

The `file_scores[]` array includes each file's `loc` (lines of code), `imports` (import
statement count), and `score`.

**Thresholds to treat as targets:**
- `loc > 400` — the file is doing too much; look for a natural split line.
- `imports > 20` — the file coordinates too many concerns; each concern is a candidate to move.

Cross-reference with refactoring targets:

```bash
pnpm exec fallow health --targets --format json --quiet 2>/dev/null || true
```

`refactoring_targets[]` ranks files by a composite score (complexity + coupling + churn + dead
code). Prioritise files that appear in both lists.

### 5.2 How to split a large file

Read the file and identify its concerns. A file doing more than one thing has a natural seam;
split on that seam, not on an arbitrary line count.

**Component file (`*.tsx` in `packages/client/src/`):**
- Exports one large component + several sub-components or helpers → move sub-components to a
  co-located file or into `packages/client/src/components/`.
- Exports one component + a large set of utility functions → move utilities to
  `packages/client/src/lib/<feature>.ts`.
- Keep the public export surface stable — update all callers if import paths change.

**Hook file (`use*.ts` in `packages/client/src/hooks/`):**
- Multiple entities or mixed query/mutation/local-state concerns → split along entity lines or
  the query/mutation boundary.

**Route file (`packages/client/src/routes/*.tsx`):**
- Route files should be thin coordinators (fetch data, pass to component). If a route exceeds
  ~150 lines, extract rendering work into a named component in
  `packages/client/src/components/`.

**Middleware service file (`packages/middleware/src/services/*.ts`):**
- Exceeds ~300 lines and mixes unrelated entity operations → split on entity boundaries.

**Do not split a file just to hit a line count.** Split only when there is a genuine separation
of concerns.

### 5.3 After splitting

Update all import paths in consuming files. Then:

```bash
pnpm lint:fix
pnpm typecheck
pnpm test
```

If all pass:

```bash
git add -p
git commit -m "refactor: split large files (Phase 5)"
```

---

## Phase 6 — Storybook story coverage

Every component should be documented with a Storybook story. This phase finds components that lack
one and writes it. **Be aggressive: trend toward documenting everything.** A component without a
story is the default cleanup target — only skip one when there is a concrete reason it cannot be
rendered in isolation (see 6.4), and record that reason rather than silently passing over it.

Stories live next to their component as `<Component>.stories.tsx` and follow the CSF3 +
`@storybook/react-vite` convention already used across the repo (see `RangeSlider.stories.tsx`,
`BookmarkCard.stories.tsx`). Storybook config is `packages/client/.storybook/main.ts` /
`preview.tsx`. Components extracted into their own files in Phases 3–5 are prime new targets here.

### 6.1 Find components missing a story

List every component and subtract the ones that already have a co-located `*.stories.tsx`:

```bash
# Components (exclude existing stories) …
git ls-files 'packages/client/src/components/**/*.tsx' | grep -v '\.stories\.tsx$'
# … vs. components that already have a story
git ls-files 'packages/client/src/components/**/*.stories.tsx'
```

A component file `Foo.tsx` is covered when `Foo.stories.tsx` sits beside it. Every uncovered
`*.tsx` that exports a React component is a target. Work through them; don't stop at the first few.
Include `components/ui/**` primitives — most already have stories, but any new one without is fair
game. Skip pure non-component modules (a `*.tsx` that only re-exports or holds types/constants and
renders no component).

### 6.2 Write a story for each uncovered component

Mirror the existing convention exactly:

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Foo } from "./Foo";

const meta = {
  title: "Components/Foo",
  component: Foo,
  args: {
    /* minimal realistic props */
  },
} satisfies Meta<typeof Foo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
```

Guidelines:

- **Title:** `Components/<Name>` for `components/*`, `UI/<Name>` for `components/ui/*` — match what
  sibling stories already use in that directory.
- **Props:** supply the minimal set of realistic `args` (or a `render` fn, as `RangeSlider` does for
  stateful components) so the component renders meaningfully, not blank.
- **Add variant stories** when a component has clearly distinct visual states (empty / populated /
  error, primary / secondary, open / closed). One `Default` is the floor, not the goal — aggressive
  documentation means covering the states a reviewer would want to eyeball.
- **Providers:** if the component needs Router/Query/Form context, reuse the decorator/wrapper
  pattern an existing story for a similar component already uses (e.g. `BookmarkForm.stories.tsx`)
  rather than inventing a new harness.

### 6.3 Verify and commit

Stories are typechecked and built by Storybook. Run the suite, then build Storybook to catch story
errors the unit tests miss:

```bash
pnpm lint:fix
pnpm typecheck
pnpm test
pnpm --filter=@eesimple/client build-storybook
```

If all pass:

```bash
git add 'packages/client/src/**/*.stories.tsx'
git commit -m "docs: add Storybook stories for undocumented components (Phase 6)"
```

### 6.4 When to skip a component

Only skip — and note the reason in the final report — when a component genuinely cannot be rendered
in isolation: it is an abstract render-prop/context-only helper with no visual output, or it hard
-requires live network/runtime state no decorator can stub. "It has a lot of props" is not a reason
to skip; supply representative args. Default to writing the story.

---

## Phase 7 — Skill maintenance

The repo's own skills (`.claude/skills/`) document the codebase's patterns. As the code evolves,
those skills drift out of sync — a pattern gets renamed, a new repeatable workflow emerges, or a
documented pattern is removed entirely. This phase keeps the skill set honest by grounding it in
what has actually changed.

### 7.1 Review recent commits

Read the commits landed since the last overnight run (or, if unsure, the last ~30) to understand
what changed in the codebase:

```bash
git log --oneline -n 30
git log --stat -n 30
```

Pay attention to: new entities/components/patterns being introduced, existing patterns being
renamed or relocated, files or whole concepts being deleted, and any change that touched several
files in the same shaped way (a sign of a repeatable workflow worth a skill).

### 7.2 Evaluate the existing skills against the commits

List the current skills and, for each, judge whether recent commits have made it stale, wrong, or
redundant:

```bash
ls .claude/skills/
```

For each skill, ask:
- **Still accurate?** Do the file paths, component names, and patterns it references still exist
  as described? If a commit renamed or moved something the skill points at, update the skill.
- **Still needed?** If recent commits removed the pattern the skill documents, the skill is dead —
  remove it.
- **Now redundant?** If two skills have converged on the same workflow, consolidate them.

`.claude/skills/fallow/` is the one exception — it's **vendored** from the `fallow` npm package, not
hand-maintained. Don't hand-edit it; instead run `pnpm fallow:check-skill`, and if it reports drift
(e.g. after a `fallow` bump), re-sync with `pnpm fallow:sync-skill` and commit the result.

### 7.3 Add, update, or remove skills as needed

- **Add** a new skill when recent commits reveal a repeatable, multi-file workflow that isn't yet
  documented (mirror the structure and frontmatter of an existing skill — `name`, `description`
  with concrete trigger phrases, then the body).
- **Update** a skill whose referenced paths/names/patterns have drifted from the current code.
- **Remove** a skill whose pattern no longer exists in the codebase.

Treat additions and removals as legitimate outcomes of this phase — do not preserve a stale skill
just because it exists, and do not skip documenting a clearly-recurring new pattern. When in doubt
about whether to remove a skill (e.g. the pattern is rare but still valid), leave it and note it in
the final report rather than deleting it.

### 7.4 Verify and commit

Skill files are Markdown and have no test/typecheck impact, but still run the suite if you changed
any non-skill file in this phase. Commit skill changes on their own:

```bash
git add .claude/skills/
git commit -m "docs: reconcile repo skills with recent commits (Phase 7)"
```

Use `docs:` for skill content changes; if you only deleted a skill, `chore:` is also acceptable.

---

## Loop control

After completing phases 1–7, check whether the health target has been reached. Phases 2, 6, and 7
(test coverage, story coverage, skill maintenance) don't directly move the fallow health score —
but still run them every iteration: Phase 2 is the safety net the refactoring phases depend on, and
6/7 are standing coverage/documentation goals.

```bash
pnpm exec fallow health --format json --quiet 2>/dev/null || true
```

Extract `.health_score` from the JSON output.

| Score | Decision |
|---|---|
| ≥ 8.0 | **Stop.** Target reached. Proceed to Verify. |
| 7.0 – 7.9 | Continue the loop. Meaningful gains still available. |
| < 7.0 | Continue the loop. Significant work remains. |
| Same as previous iteration | **Stop.** No further automated gains are possible. |

If the score is unchanged from the previous iteration (no phase produced any diff), stop the
loop and report the final state. Do not attempt a third consecutive iteration that produces the
same score — the remaining delta likely requires design decisions, not mechanical cleanup.

### Progress tracking (maintain in working memory *and* the run-log file)

Before each new loop iteration, note (and append to the scratch run-log from Pre-flight):

```
Iteration N:
  Health score before: X.X
  Dead-code issues: N (baseline 31)
  Duplication %: N.N %
  Tests added this iteration: N (areas: …)
  Phases with commits: [list phases that produced commits]
  Health score after: X.X
```

---

## Robustness for long unattended runs

This skill runs for hours with no human watching, in an **ephemeral** container that is reclaimed on
inactivity. Build the run so a crash, a reclaim, or a flaky step costs at most one phase — not the
whole night.

- **Checkpoint by pushing, not just committing.** Commit-per-phase already checkpoints locally, but
  the container is disposable — **push the branch after every iteration** (`git push -u origin
  <branch>`, with the session's retry/backoff on network errors), not only at the very end. Unpushed
  commits die with the container.
- **Cap the work.** Set a hard ceiling of ~6 loop iterations and stop early on the "same score"
  rule. Never loop a single phase forever: if a complexity/duplication finding hasn't moved after
  ~2 attempts, skip it, note it in the final report, and move on.
- **Resume safely.** At startup, inspect `git log --oneline` on the branch and the scratch run-log to
  see which phases already committed this run; don't redo completed work or double-commit.
- **Never leave the tree dirty or red.** If a phase can't be made green quickly, `git restore` /
  `git stash` that phase's diff and continue — a clean tree at every phase boundary is what makes a
  crash recoverable.
- **Treat test flakes as flakes during verification.** When a test fails mid-run, re-run it once
  before believing it; if it only fails intermittently, note the flaky test and move on rather than
  "fixing" unrelated code to chase it. (Proactively *hardening* a flaky test — fake timers, pinned
  dates, state isolation — is the deliberate Phase 2.7 activity, done from a green tree; this bullet
  is only about not letting a flake derail the rest of the run.)
- **Be install-averse.** The network policy may block installs. If a phase wants a package that
  isn't present (e.g. a coverage provider, a new test runner for `@eesimple/types`), prefer the
  zero-dependency path or skip-and-note rather than failing the run on a blocked install.
- **One PR for the sweep — but split risky items into their own PRs.** Open exactly one PR for the
  mechanical sweep (the safe phases) at the end. **Anything too risky to fold into that sweep** — a
  large-file or large-function split, a complex-component decomposition, a half-applied feature to
  finish, or any change with real blast radius — gets its **own branch cut off the latest `main`** and
  its **own PR**, one item per branch (see **Risky items get their own branch and PR** below). Don't
  bundle a risky refactor into the sweep PR, and don't pile several unrelated risky changes onto one
  branch. If a PR already exists for a branch, **update** it (`mcp__github__update_pull_request`)
  instead of creating a duplicate.
- **Always produce the final report**, even on an early/budget stop — list health achieved, tests
  added, remaining gaps (with `file:line`), and what each would need. A precise hand-off is the
  deliverable when the loop can't reach 8.0 unattended.

---

## Final verification

Once the loop exits, run the full suite one final time:

```bash
# Full fallow analysis
pnpm fallow --format json --quiet 2>/dev/null || true

# Health score (confirm ≥ 8.0 or report actual)
pnpm exec fallow health --format json --quiet 2>/dev/null || true

# Dead-code count (confirm ≤ 31)
pnpm exec fallow dead-code --format json --quiet 2>/dev/null || true

# Duplication % (confirm < 6.0 %)
pnpm exec fallow dupes --format json --quiet 2>/dev/null || true

# Full quality suite
pnpm lint:fix
pnpm typecheck
pnpm test
```

Report these final numbers:
- Health score achieved
- Dead-code issues remaining (vs. 31 baseline)
- Final duplication percentage
- Tests added (count + areas), and any high-risk code still untested (with file paths — e.g. note
  `evaluateConditions` if its harness wasn't stood up)
- Existing tests sped up / de-flaked (count + areas), and any slow or flaky tests deliberately left
  as-is (with the reason they couldn't be hardened without weakening them)
- Total commits made (one per phase per iteration)
- Any remaining violations that could not be fixed automatically (with file:line references)

If the health score did not reach 8.0, summarise why: list the specific findings (with file
paths and metric values) blocking the score and explain what manual refactoring each would
require. This gives the human a precise next-steps list for a follow-up session.

---

## Open a PR and watch CI (end of work)

This skill runs unattended overnight, so the human is not at the keyboard to open a PR or babysit
CI. Once the loop has exited and final verification is green, **close out the run by opening a pull
request and subscribing to its activity** so CI failures and review comments get handled
automatically while the human sleeps.

Do this only at the very end — after all phases are done, all per-phase commits are made, and the
branch is pushed. Do not open a PR mid-loop.

### Risky items get their own branch and PR

The end-of-run PR covers the **mechanical sweep**. Any change too risky to bundle there — a
large-function or large-file split, a complex-component decomposition, finishing a half-applied
feature, or anything with real blast radius — is handled **one at a time, each on its own branch and
its own PR**, never folded into the sweep:

1. Cut the branch off the **latest `main`** — `git fetch origin main && git checkout -b <topic-branch>
   origin/main` — **not** off the sweep branch, so each risky PR is independent and reviewable on its
   own.
2. Make the single focused change, add a test that pins the behavior (Phase 2 rules apply), and verify
   green (`pnpm lint:fix && pnpm typecheck && pnpm test`). If it can't be made green quickly, abandon
   that branch and note it — don't leave a half-done risky change.
3. Commit, push, open a PR with a Conventional-Commits title scoped to that **one** item, and
   subscribe to it (see below).
4. Repeat for the next risky item, **re-cutting off the latest `main`** each time (earlier risky PRs —
   or unrelated changes — may have merged in the meantime; a stale base is how the merged-result
   typecheck goes red).

Keeping them separate means each is reviewable on its own and a risky change can be reverted in
isolation without losing the rest of the night's work. List every risky item you split out — with its
PR — in the final report.

### Push the work

Push the development branch with upstream tracking (retry with backoff on network errors, per the
session's git instructions):

```bash
git push -u origin <branch-name>
```

### Open the PR

Create the PR against the default branch using the GitHub MCP tools (`mcp__github__create_pull_request`).
If a PR already exists for this branch, update it instead of opening a second one.
Requirements that CI enforces — get them right the first time so `lint-title` passes:

- **Title must start with a Conventional Commits prefix** (`refactor:`, `docs:`, `test:`, `chore:`,
  `perf:`, etc.) — the `pr-title` workflow lints it independently of the commit messages. Pick the
  prefix that matches the bulk of the work (usually `refactor:` for a cleanup sweep, e.g.
  `refactor: overnight codebase health sweep`).
- **If the PR closes an issue, include the issue number** in the title (e.g. `(#123)`) — `lint-title`
  requires it for any PR with a closing-issue link.
- **Body:** summarise the run — per-phase changes, the before/after health score, dead-code and
  duplication numbers, the tests added (and any high-risk code left untested), the Storybook stories
  added, and any skill changes. Mirror the final report above so a reviewer can scan the outcome.

### Subscribe so CI can be handled automatically

Immediately after the PR is created, subscribe to its activity so this session wakes on CI results
and review comments:

```
mcp__github__subscribe_pr_activity   # pass the new PR's number
```

**Always do at least one round of follow-up before ending the turn.** Don't open (and subscribe to)
the PR(s) and immediately go idle. Do one proactive pass first: check each PR's CI status at least
once (`mcp__github__pull_request_read` with `method: "get_status"`), and act on anything actionable
from that first round — a `lint-title` miss, an obvious lint/type failure, a flagged conflict — rather
than waiting on a webhook for what you can already see. (Webhooks don't deliver CI *success* or
merge-conflict transitions, so the first manual check is also how you catch a PR that's already
mergeable or already red.) Only after that first round is clear do you settle into event-driven mode.

Then keep the session **event-driven** — do not poll with `sleep` in a loop. Further PR events arrive
as `<github-webhook-activity>` messages that wake the session. When a CI failure arrives, diagnose and
push a fix on the same branch (re-running the relevant verification locally first); when a review
comment is ambiguous, ask the human via `AskUserQuestion` rather than guessing. Keep handling events
until the PR is **merged or closed**, then stop. (CI success / merge-conflict transitions are not
delivered as events — if `send_later` is available, schedule a check-in ~an hour out to re-verify
mergeability, then re-arm or stop once merged.)

Report the PR URL and that the session is now watching it as the final line of the run.
