---
name: overnight-cleanup
description: >-
  Autonomous overnight codebase health sweep for this repo. Runs fallow dead-code removal, test
  coverage for under-tested high-risk code (plus hardening existing tests to run faster and less
  flaky without weakening them), duplicate consolidation, complexity reduction, large-file splitting,
  Storybook story coverage, and skill maintenance in a fixed phase order, committing after each
  successful phase and looping until the fallow health score reaches 8.0 or stops improving, then
  opening a PR for the sweep — plus a separate branch/PR off the latest main for each item too risky
  to bundle — subscribing to each, and doing at least one proactive round of CI follow-up before
  going event-driven. Use when asked to "run an overnight cleanup", "bring fallow health up
  overnight", "add tests where coverage is poor", "make the test suite faster", "de-flake the tests",
  "clean up the codebase while I sleep", or "run a multi-phase fallow cleanup loop".
---

# Overnight cleanup

An autonomous, multi-phase health sweep that runs until fallow's health score reaches **8.0 / 10** or
no further gains are possible. Commit after every phase that produces a change. Never break passing
tests.

**Phase order** (respect it within every loop iteration):

1. Dead code
2. Test coverage & test health
3. Duplicates
4. Complexity
5. Large files / high-import files
6. Storybook story coverage
7. Skill maintenance

Dead code goes first so you never test code you're about to delete. Tests come **before** the
refactoring phases (3–5) so those refactors land on a regression net.

---

## 0. Pre-flight

Record baselines in working memory **and** a scratch run-log file (in the session scratchpad) so they
survive a crash or context reset.

```bash
pnpm exec fallow health --hotspots --targets --file-scores --format json --quiet 2>/dev/null || true
pnpm exec fallow dead-code --format json --quiet 2>/dev/null || true
pnpm exec fallow dupes --format json --quiet 2>/dev/null || true
```

| Metric | JSON location | Target |
|---|---|---|
| Health score | `.health_score` (`fallow health`) | ≥ 8.0 |
| Dead-code issues | `.total_issues` (`fallow dead-code`) | ≤ the committed baseline in `.fallow/dead-code-baseline.json`, trending to 0 |
| Duplication % | `.stats.duplication_percentage` (`fallow dupes`) | below `DUP_BUDGET` in `.github/workflows/fallow-audit.yml` |
| Complexity findings | `findings[]` over the `.fallowrc.jsonc` caps (`maxCyclomatic: 30`, `maxCognitive: 25`) | 0 |
| Untested high-risk files | risk targets with no matching test file (Phase 2.1) | trending down |

fallow reports no coverage percentage and no coverage provider is configured — "untested high-risk"
is a deliberate heuristic.

At startup also inspect `git log --oneline` and the run-log to **resume** safely: don't redo phases
already committed this run.

## Safety rules (every phase)

1. **Never hand-edit generated files** — `packages/client/src/routeTree.gen.ts`, `pnpm-lock.yaml`.
2. **Never edit `.claude/skills/fallow/`** — it is vendored (see Phase 7).
3. **Don't prune `packages/client/src/components/ui/**` exports** — `.fallowrc.jsonc` turns
   `unused-exports` off there on purpose (shadcn primitives).
4. **Don't modify `.fallow/dead-code-baseline.json`** unless asked — it's the CI regression gate.
   Lowering the live count below it is fine; refreshing it is an owner decision.
5. **Verify before every commit**, from the repo root:
   ```bash
   pnpm lint:fix
   pnpm typecheck
   pnpm test
   ```
   If a phase can't be made green quickly, **revert that phase's diff** and move on — never commit
   red, never stall the run.
6. **One commit per phase per iteration**, Conventional Commits (`refactor:`, `test:`, `docs:`,
   `chore:`, `perf:`). Stage deliberately (`git add -p`); never stage unrelated drift.
7. **fallow CLI hygiene:** pass `--format json --quiet 2>/dev/null || true`; never run `fallow watch`
   (interactive); `fallow fix` needs `--yes` in a non-TTY and always gets a `--dry-run` first.

---

## Phase 1 — Dead code

```bash
pnpm exec fallow dead-code --format json --quiet 2>/dev/null || true
pnpm exec fallow dead-code --trace <file>:<ExportName> --format json --quiet 2>/dev/null || true
pnpm exec fallow fix --dry-run --yes --format json --quiet 2>/dev/null || true
pnpm exec fallow fix --yes --format json --quiet 2>/dev/null || true
```

Trace before removing. After the auto-fix, remove leftovers by hand (delete export-less unused files;
drop just the export when the file has other consumers). A `@deprecated` export with zero references
gets deleted, not kept. Verify, then `refactor: remove dead code (Phase 1)`.

## Phase 2 — Test coverage and test health

**Check the `what-not-to-test` skill first** so you don't rebuild a test that was deliberately never
written. Use the `test-structure` skill for harness recipes.

### 2.1 Map source → tests (each package has its own runner — never cross them)

- **client** — Vitest + Testing Library, co-located `*.test.ts(x)`, harness in
  `packages/client/src/test-utils/`. `pnpm --filter=@app/client test`.
- **middleware** — Node test runner, `packages/middleware/src/tests/**/*.test.ts` (in-memory fake-db
  helpers in `tests/testDbHelpers.ts`). `pnpm --filter=@app/middleware test`.
- **types** — Node test runner, co-located `packages/types/src/**/*.test.ts`.
  `pnpm --filter=@app/types test`.

```bash
git ls-files 'packages/*/src/**/*.ts' 'packages/*/src/**/*.tsx' | grep -vE '\.(test|stories|gen)\.tsx?$'
git ls-files 'packages/*/src/**/*.test.ts' 'packages/*/src/**/*.test.tsx'
```

### 2.2 Prioritize by risk, not count

Untested **and** in `refactoring_targets[]` (high churn) or complexity `findings[]` comes first — that
is exactly what Phases 3–5 will touch. Shared pure logic in `@app/types`, client `lib/`, and middleware
`services/` / `utils/` is cheap and high-leverage. Pure functions before components.

### 2.3 Write behavior tests

Assert observable output for representative **and** edge inputs (empty, boundary, default arm) — not
snapshots of internals. Cover each branch of branchy logic. A new pure client `.test.ts` takes the
`// @vitest-environment node` pragma (see `vitest-node-environment`). Prefer mock-free tests; mock
toasts only via `test-utils/toastSpies.ts`; a new module singleton a test mutates gets reset in
`test-utils/resetStores.ts`. Use the factories in `test-utils/factories.ts`, not inline full objects.
Commit: `test: add coverage for under-tested <area> (Phase 2)`.

### 2.4 Make existing tests faster and less flaky (once per run)

**Guardrail:** only changes that keep asserting the exact same behavior. Never delete, `.skip`, or
`.only` a test, loosen an assertion, raise a `waitFor` timeout, or add `retry` to the Vitest config.
If a test can't be fixed without weakening it, leave it and report it.

- Find slow tests from durations: `pnpm --filter=@app/client exec vitest run --reporter=verbose`.
- Look for structural flake causes instead of re-running the suite: real timers / arbitrary sleeps
  (→ `vi.useFakeTimers()` + `vi.advanceTimersByTimeAsync`, restored in `finally`); `Date.now()` /
  `Math.random()` (→ `vi.setSystemTime`); broad `waitFor` (→ narrow to one observable); leaked state
  (→ reset stores, `vi.clearAllMocks()`, `vi.unstubAllGlobals()`).
- Confirm by re-running **only the suspect file** ~3 times.
- Confirm the test count didn't drop. Commit: `test: speed up and de-flake existing tests (Phase 2)`.

## Phase 3 — Duplicates

```bash
pnpm exec fallow dupes --format json --quiet 2>/dev/null || true
pnpm exec fallow dupes --trace dup:<fingerprint> --format json --quiet 2>/dev/null || true
```

Work `clone_groups[]` by `token_count`, largest first; read the source at every instance before
abstracting. Respect `.fallowrc.jsonc` → `duplicates.ignore` (route registration under
`packages/middleware/src/routes/**` and tests are intentionally excluded). Extract to the right layer:
client `lib/` (pure), `components/` (parametrized JSX), `hooks/` (shared query options), middleware
`utils/`, or `@app/types` (logic shared by client and server). Lift non-trivial inline components into
their own co-located files so future copies become detectable. Confirm the percentage is under the
CI budget. Commit: `refactor: consolidate duplicate code (Phase 3)`.

## Phase 4 — Complexity

```bash
pnpm exec fallow health --hotspots --targets --format json --quiet 2>/dev/null || true
pnpm exec fallow health --complexity --complexity-breakdown --format json --quiet 2>/dev/null || true
```

Apply the **`decompose-over-cap`** skill's pattern table — it carries fallow's scoring facts
(per-function scoring, +1 per hook call, JSX prop count) and the matching fixes. Also extract
complicated or nested conditionals into the most readable structure: a named predicate, a named
constant, a lookup `Record`, or an early-return guard. **Pair every extracted conditional with a test
in the same commit.** No `// fallow-ignore-next-line complexity` unless genuinely irreducible. Confirm
zero findings over the caps. Commit: `refactor: reduce complexity hotspots (Phase 4)`.

## Phase 5 — Large files and high-import files

```bash
pnpm exec fallow health --file-scores --targets --format json --quiet 2>/dev/null || true
```

Targets: `loc > 400`, or a file near/over the ESLint `import/max-dependencies` cap of 20. Split on a
real seam (sub-components → co-located files; utilities → `lib/`; route files stay thin coordinators;
services split on entity lines) — never on a line count. Keep the public import surface stable or
update every caller. Commit: `refactor: split large files (Phase 5)`.

## Phase 6 — Storybook story coverage

Every component should have a co-located `<Component>.stories.tsx` (CSF3, `@storybook/react-vite`,
title `Components/<Name>` or `UI/<Name>`). See the **`storybook-story`** skill for the template,
providers, and MSW handlers.

```bash
git ls-files 'packages/client/src/components/**/*.tsx' | grep -vE '\.(stories|test)\.tsx$'
git ls-files 'packages/client/src/components/**/*.stories.tsx'
```

Be aggressive: add a story (plus variant stories for distinct states) for every uncovered component;
skip only a component that genuinely can't render in isolation, and record why. Verify with
`pnpm --filter=@app/client build-storybook` in addition to the usual suite. Commit:
`docs: add Storybook stories for undocumented components (Phase 6)`.

## Phase 7 — Skill maintenance

Review `git log --stat -n 30` (or since the last run) against `.claude/skills/`. For each skill: are
its paths, names, commands, and patterns still accurate? Is the pattern still present? Has it
converged with another skill? **Update** drifted skills, **add** one for a newly recurring multi-file
workflow (same frontmatter shape: `name` + a `description` with concrete trigger phrases), **remove**
a skill whose pattern is gone (when unsure, keep it and note it). `.claude/skills/fallow/` is vendored —
never hand-edit it; run `pnpm fallow:check-skill` and, on drift, `pnpm fallow:sync-skill`. Commit:
`docs: reconcile repo skills with recent commits (Phase 7)`.

---

## Loop control

After phases 1–7, re-read `.health_score`:

| Score | Decision |
|---|---|
| ≥ 8.0 | **Stop** — go to final verification. |
| < 8.0 and improved | Loop again. |
| Same as previous iteration | **Stop** — the remaining delta needs design decisions. |

Phases 2, 6, 7 don't move the score but still run each iteration (2.4 once per run). Cap at ~6
iterations; if a finding hasn't moved after ~2 attempts, skip it and note it. Append each iteration to
the run-log: score before/after, dead-code count, duplication %, tests added, phases with commits.

## Robustness for unattended runs

- **Push after every iteration** (`git push -u origin <branch>`, retrying with backoff on network
  errors) — the container is ephemeral, unpushed commits die with it.
- **Never leave the tree dirty or red** at a phase boundary; revert and continue instead.
- **Treat a mid-run test failure as a possible flake**: re-run it once before believing it.
- **Be install-averse**: if a phase wants a package that isn't installed, take the zero-dependency path
  or skip-and-note.
- **Always produce the final report**, even on an early stop.

## Final verification

```bash
pnpm exec fallow health --format json --quiet 2>/dev/null || true
pnpm exec fallow dead-code --format json --quiet 2>/dev/null || true
pnpm exec fallow dupes --format json --quiet 2>/dev/null || true
pnpm lint:fix && pnpm typecheck && pnpm test
pnpm --filter=@app/client build-storybook
```

Report: health achieved; dead-code count vs baseline; duplication %; tests added (and high-risk code
still untested, with paths); tests sped up / de-flaked (and any left as-is, with why); stories added;
skill changes; commits made; remaining violations with `file:line` and what each needs. If 8.0 wasn't
reached, list the blocking findings with their metric values.

---

## Open a PR and watch CI (end of work)

Only after the loop exits, verification is green, and the branch is pushed.

### Risky items get their own branch and PR

The sweep PR holds the **mechanical** changes. Anything with real blast radius — a large-file or
large-function split, a complex-component decomposition, a half-finished feature — goes on its **own
branch cut off the latest `main`** (`git fetch origin main && git checkout -b <topic> origin/main`),
one item per branch: make the focused change, pin it with a test, verify green (abandon and note it if
it won't go green), push, open its own PR, subscribe. Re-cut off the latest `main` for each item so the
merged-result typecheck (the pre-push hook, `scripts/prepush-merged-typecheck.mjs`) sees a fresh base.
List every split-out PR in the final report.

### Open the PR

Use the GitHub tools to open (or, if one exists for the branch, **update**) the PR against `main`:

- **Title starts with a Conventional Commits prefix** — the `pr-title` workflow
  (`.github/workflows/pr-title.yml`) lints it independently of the commits, e.g.
  `refactor: overnight codebase health sweep`. If the PR closes an issue, include `(#<n>)`.
- **Body** mirrors the final report: per-phase changes, before/after health, dead-code and
  duplication numbers, tests and stories added, skill changes.

### Subscribe and follow up

Subscribe to each PR's activity right after creating it. **Do at least one proactive round before
going idle**: check each PR's CI status once and fix anything already visible (title lint, a lint or
type failure, a conflict) — webhooks don't deliver CI *success* or merge-conflict transitions, so this
first check is how you catch them. Then stay **event-driven** (no `sleep` polling): on a CI failure,
reproduce locally, fix, and push to the same branch; on an ambiguous review comment, ask the human
rather than guess. Continue until each PR is merged or closed; if a scheduled check-in tool is
available, use one to re-verify mergeability later.

End the run with the PR URL(s) and a note that the session is watching them.
