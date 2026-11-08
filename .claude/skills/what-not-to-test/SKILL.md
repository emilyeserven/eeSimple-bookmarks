---
name: what-not-to-test
description: >-
  Record which tests this app deliberately does NOT write (or removes) and why — so a contributor or
  an automated sweep doesn't build them. Use when asked "should I write a test for this", "is there a
  test I'm missing here", "add coverage for this file", "make the suite faster", or when a
  coverage/overnight sweep is about to add or delete tests. Covers the no-test categories (re-export
  barrels, other-package functions, type-level shapes, factory defaults, static registry text,
  third-party behavior), the guardrails against weakening tests for speed, and how to keep a ledger
  of removed / slow-but-kept tests. Mirrors the `vitest-node-environment` decision rule (what env a
  *new* test uses) from the other side — what has no test at all.
---

# What not to test

Every test file costs CI time, and most of that cost is **environment setup and module-graph
evaluation, not assertions**. The client Vitest config (`packages/client/vite.config.ts`) splits
tests into three projects: mock-free files run with `isolate: false` in persistent workers, and only
files using `vi.mock`-family / global-stub APIs pay full per-file isolation (see the
**`vitest-node-environment`** skill). So the marginal cost of a test file is dominated by **which
project it lands in**, and by whether it should exist at all.

Three rules follow:

1. **Every new pure `.test.ts` file carries the line-1 `// @vitest-environment node` pragma** — see
   the **`vitest-node-environment`** skill for the decision rule.
2. **Prefer mock-free tests.** A file that calls `vi.mock` / `doMock` / `unmock` / `hoisted` /
   `stubGlobal` / `stubEnv` / `setSystemTime` is auto-classified into the isolated `mocked` project;
   a mock-free file rides the fast path. Don't weaken a test to avoid a mock — but when a pure-helper
   extraction or dependency injection makes the mock unnecessary, that's also a suite-speed win.
   (Asserting toasts via the real `notificationStore` instead of spies is the common case — see the
   **`test-structure`** skill.)
3. **Do not write the categories of test below** — they add cost and false-failure surface without
   adding a real regression net.

Once you've decided a test *should* exist, the **`test-structure`** skill covers how to build it.

## What we deliberately don't test (and why)

**Re-export barrels.** A module that only re-exports another package (e.g. a client `lib/` shim
over `@app/types`, or `packages/types/src/index.ts` itself) is tested at the **owning** module, never
at the barrel. **Before writing a test for any `lib/` module, open it and check whether it's a
re-export.** If it is, the test belongs to the source.

**Functions owned by another package.** The client must **never** re-test an `@app/types` function;
the middleware must not re-test one either. Assert a function once, in the package that exports it —
`packages/types` has its own `node --test` runner (`pnpm --filter=@app/types test`, run by CI's
`test-server` job) for exactly this. A duplicate test doubles maintenance and runtime while guarding
nothing new.

**Type-level shapes.** No `expectTypeOf` / `assertType` tests. `pnpm typecheck` in CI (plus the
pre-push merged-typecheck hook, `scripts/prepush-merged-typecheck.mjs`) is the gate for type
correctness. Exhaustive `Record<Union, …>` / `satisfies` patterns exist **precisely so drift fails
`tsc`**, not a runtime test — a type-assertion test on top is redundant.

**Factory defaults.** The `make*()` builders in `packages/client/src/test-utils/factories.ts`
(`makeItem`, …) get **no self-tests**. They are fixtures, not product code; the shared types plus
`pnpm typecheck` keep their shape honest. A test that asserts a factory returns its own defaults is a
change-detector with zero signal.

**Static registry / copy text in render tests.** Do **not** assert that registry-derived labels or
static copy render as literal strings (a list of provider names, a nav label table, a heading). A
copy edit or a new registry entry shouldn't redden a test. Render tests assert **behavior** — state
changes, callbacks/requests firing, conditional branches taken — **never the mere presence of a
static string**. (Asserting that *data you fed in* renders, like `ItemsManager.test.tsx` finding the
stubbed item's name, is behavior: it proves the fetch → render path.)

**Third-party library behavior.** Don't test that Radix opens a popover on click, that TanStack
Router navigates, that TanStack Query caches, or that Tailwind applies a class. That's the library's
job; assert **your** logic around it. The shadcn primitives under `components/ui/` are vendored and
get stories, not tests — `components/ui/data-table.test.tsx` exists only because `DataTable` carries
the app's own sorting/tree logic.

**Thin routes.** A Fastify route that only validates and delegates to a service needs no test of its
own — the service is tested against the fake `db`, and the shared error/validation contract is
tested once in `packages/middleware/src/tests/errorHandler.test.ts`. Test a route only when it has
real branching or a security/validation guard worth pinning.

## Ledgers: removed tests and slow-but-kept tests

As the suite grows, keep two short ledgers **in this skill** so later sweeps don't undo decisions:

- **Removed-tests ledger** — each deliberately deleted test file, the date, and where its coverage
  went (e.g. "client `lib/foo.test.ts` removed — duplicate of `packages/types/src/foo.test.ts`; its
  one unique scenario relocated there, not dropped"). If a coverage pass "notices a gap" listed here,
  the gap is intentional.
- **Slow-but-KEPT ledger** — the slowest tests that earn their runtime (typically ones that boot a
  full Fastify app to guard SSRF rejection or schema validation, or assert behavior in a churn-heavy
  subsystem). A "make the suite faster" pass must leave them.

Both ledgers are currently empty in this starter. Add an entry in the same change that removes or
explicitly keeps a test.

## Guardrails

**Never delete a test, mark it `.skip`, or loosen an assertion to make the suite faster or greener.**
That trades away the regression net, which is the opposite of the goal. Speed comes from the
`// @vitest-environment node` pragma, from keeping tests mock-free, and from **not writing** the
categories above. If a slow test can't be sped up without weakening what it asserts, **leave it and
note it** in the slow-but-kept ledger. (The **`overnight-cleanup`** skill's test-hardening phase
follows the same rule.)

When you're about to add a test, run this filter first: is the module a re-export barrel? Is the
function owned by another package? Is this a type-level assertion? A factory self-test? Static copy
or registry text? Third-party behavior? A thin delegate route? If yes to any — **don't write it**, and
if a sweep already did, it's a removal candidate to record in the ledger.

## Lessons carried over

- **Don't churn rendering tests for speed.** A jsdom file that renders legitimately needs a DOM;
  converting "pure logic asserted through a render" into a node unit test means extracting the
  predicate from the component — do that opportunistically the next time the source is touched, not
  as a refactor purely for test speed (the saving is usually below run-to-run timing noise).
- **Don't revert the isolation split.** The `isolate: false` fast path relies on the fresh-world
  reset at the top of `test-utils/setup.ts` (DOM/storage clear, explicit RTL cleanup,
  `resetStores.ts`). Don't flip the config back to blanket isolation, and don't put `isolate: false`
  on the `mocked` project — that naive flip produced many cross-file failures *and* ran slower.
