---
name: overnight-cleanup
description: >-
  Autonomous overnight codebase health sweep for eeSimple Bookmarks. Runs fallow dead-code removal,
  duplicate consolidation, complexity reduction, and large-file splitting in a fixed phase order,
  committing after each successful phase, and looping until the fallow health score reaches 8.0 or
  higher. Use when asked to "run an overnight cleanup", "bring fallow health up overnight",
  "clean up the codebase while I sleep", or "run a multi-phase fallow cleanup loop".
---

# Overnight cleanup

This skill drives an autonomous, multi-phase codebase health sweep. It runs until fallow's
composite health score reaches **8.0 / 10** or no further gains can be made. Commit after every
phase that produces a change. Never break passing tests.

Phase order (always respect this sequence within each loop iteration):

1. Dead code
2. Duplicates
3. Complexity
4. Large files / high-import files
5. Skill maintenance (review recent commits; add/remove repo skills as needed)

---

## 0. Pre-flight stock-taking

Run these before starting any phase. Record the baseline numbers in working memory; compare
against them at the end of every loop iteration.

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
   If any step fails, fix the failure before committing. Do not commit a broken state.
4. **Prefer small, targeted commits** — one commit per phase per loop iteration. Use conventional
   commit format (`refactor: …`, `perf: …`, `chore: …`).
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

## Phase 2 — Duplicates

### 2.1 Inspect the duplication report

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

### 2.2 Trace a clone group before refactoring

```bash
pnpm exec fallow dupes --trace dup:<fingerprint> --format json --quiet 2>/dev/null || true
```

The trace returns exact file/line ranges of each instance and a `suggested_name` for an extracted
function. Read the actual source at those locations before writing any abstraction.

### 2.3 Manual refactoring strategy

Auto-fix is not available for duplicates — all consolidation is manual.

**Shared utility function.** When two or more files contain the same logic with no component
markup: extract to a shared file in the appropriate layer.
- Pure client utilities → `packages/client/src/lib/`
- Shared type-level helpers → `packages/types/src/`
- Middleware utilities → `packages/middleware/src/utils/`

**Shared React component.** When two or more files render the same JSX structure with minor prop
variation: extract a parametrized component into `packages/client/src/components/`. Do not create
panel-only variants — the panel and main app share components.

**Shared hook.** When the same TanStack Query call + options appears in multiple hooks: extract a
base query or shared `queryOptions` object and call it from each hook.

**Do not consolidate route boilerplate in `packages/middleware/src/routes/**`** — the config
already excludes that directory, and the repetition is intentional Fastify registration structure.

### 2.4 Verify and commit

```bash
pnpm lint:fix
pnpm typecheck
pnpm test
```

If all pass:

```bash
git add -p
git commit -m "refactor: consolidate duplicate code (Phase 2)"
```

### 2.5 Confirm budget is respected

```bash
pnpm exec fallow dupes --format json --quiet 2>/dev/null || true
```

`stats.duplication_percentage` must be below 6.0 %. If it remains at or above 6.0 %, the CI
gate will fail — continue reducing before moving to phase 3.

---

## Phase 3 — Complexity

### 3.1 Identify complexity hotspots

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

### 3.2 Refactoring patterns

**Extract sub-functions.** Move a deeply nested block or a long arm of a `switch`/`if`-chain
into a named helper function in the same file (or shared lib if it generalises). Prefer named
helpers over anonymous lambdas — they name intent and lower cognitive score.

**Split switch arms.** Extract each complex case arm into its own function. The dispatcher stays
simple; handlers hold the logic.

**Simplify early returns.** Replace deeply nested `if/else if/else` with early-return guards.
Flattens the cognitive nesting score significantly.

**Decompose React components.** A component with high cognitive complexity usually renders too
many conditions inline. Extract sub-components for each conditional region; keep the parent as a
coordinator that passes props.

**Do not add `// fallow-ignore-next-line complexity`** unless you have confirmed the complexity
is unavoidable (e.g. an exhaustive type-narrowing switch that cannot be split without losing type
safety). Suppression is a last resort, not a shortcut.

### 3.3 Verify and commit

```bash
pnpm lint:fix
pnpm typecheck
pnpm test
```

If all pass:

```bash
git add -p
git commit -m "refactor: reduce complexity hotspots (Phase 3)"
```

### 3.4 Confirm zero hard violations

```bash
pnpm exec fallow health --format json --quiet 2>/dev/null || true
```

Scan `findings[]` for any entry with cyclomatic > 30 or cognitive > 25. There should be none.
If any remain, continue phase 3 before moving to phase 4.

---

## Phase 4 — Large files and high-import files

### 4.1 Identify large files

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

### 4.2 How to split a large file

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

### 4.3 After splitting

Update all import paths in consuming files. Then:

```bash
pnpm lint:fix
pnpm typecheck
pnpm test
```

If all pass:

```bash
git add -p
git commit -m "refactor: split large files (Phase 4)"
```

---

## Phase 5 — Skill maintenance

The repo's own skills (`.claude/skills/`) document the codebase's patterns. As the code evolves,
those skills drift out of sync — a pattern gets renamed, a new repeatable workflow emerges, or a
documented pattern is removed entirely. This phase keeps the skill set honest by grounding it in
what has actually changed.

### 5.1 Review recent commits

Read the commits landed since the last overnight run (or, if unsure, the last ~30) to understand
what changed in the codebase:

```bash
git log --oneline -n 30
git log --stat -n 30
```

Pay attention to: new entities/components/patterns being introduced, existing patterns being
renamed or relocated, files or whole concepts being deleted, and any change that touched several
files in the same shaped way (a sign of a repeatable workflow worth a skill).

### 5.2 Evaluate the existing skills against the commits

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

### 5.3 Add, update, or remove skills as needed

- **Add** a new skill when recent commits reveal a repeatable, multi-file workflow that isn't yet
  documented (mirror the structure and frontmatter of an existing skill — `name`, `description`
  with concrete trigger phrases, then the body).
- **Update** a skill whose referenced paths/names/patterns have drifted from the current code.
- **Remove** a skill whose pattern no longer exists in the codebase.

Treat additions and removals as legitimate outcomes of this phase — do not preserve a stale skill
just because it exists, and do not skip documenting a clearly-recurring new pattern. When in doubt
about whether to remove a skill (e.g. the pattern is rare but still valid), leave it and note it in
the final report rather than deleting it.

### 5.4 Verify and commit

Skill files are Markdown and have no test/typecheck impact, but still run the suite if you changed
any non-skill file in this phase. Commit skill changes on their own:

```bash
git add .claude/skills/
git commit -m "docs: reconcile repo skills with recent commits (Phase 5)"
```

Use `docs:` for skill content changes; if you only deleted a skill, `chore:` is also acceptable.

---

## Loop control

After completing phases 1–5, check whether the health target has been reached (Phase 5 is
skill-maintenance and does not affect the health score, but still run it each iteration):

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

### Progress tracking (maintain in working memory)

Before each new loop iteration, note:

```
Iteration N:
  Health score before: X.X
  Dead-code issues: N (baseline 31)
  Duplication %: N.N %
  Phases with commits: [list phases that produced commits]
  Health score after: X.X
```

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
- Total commits made (one per phase per iteration)
- Any remaining violations that could not be fixed automatically (with file:line references)

If the health score did not reach 8.0, summarise why: list the specific findings (with file
paths and metric values) blocking the score and explain what manual refactoring each would
require. This gives the human a precise next-steps list for a follow-up session.
