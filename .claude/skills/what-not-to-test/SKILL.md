---
name: what-not-to-test
description: >-
  Record which tests eeSimple Bookmarks deliberately does NOT write (or has removed) and why — so a
  contributor or an automated sweep doesn't rebuild them. Use when asked "should I write a test for
  this", "is there a test I'm missing here", "why was the X test removed", "add coverage for this
  file", or when a coverage/overnight sweep is about to add tests. Also covers the removed-tests
  ledger and the slow-but-intentionally-kept tests, so a "make the suite faster" pass doesn't delete
  the wrong thing. Mirrors the `vitest-node-environment` decision rule (what env a *new* test uses)
  from the other side — what has no test at all.
---

# What not to test

Every test file costs the CI `test` job time, and most of that cost is **environment setup, not
assertions**. `pnpm test` runs ~147 s total (client Vitest ~124 s, middleware ~22 s, types ~1 s).
Of the client's ~124 s, roughly **~86 s is jsdom setup** (~1 s per jsdom component file across ~86
files); the actual per-test execution is only ~37 s. So the marginal cost of a test file is
dominated by its **environment**, and a file that asserts nothing new is nearly pure overhead.

Two rules follow, and this skill records both:

1. **Every new pure `.test.ts` file must carry the line-1 `// @vitest-environment node` pragma** —
   see the **`vitest-node-environment`** skill for the decision rule. That is where the speed comes
   from.
2. **Do not write the categories of test below** — they add cost and false-failure surface without
   adding a real regression net.

## What we deliberately don't test (and why)

**Re-export barrels.** A `lib/` module that only re-exports another package is tested at the
**owning** package, never at the barrel. `packages/client/src/lib/urlCleanup.ts` is a 16-line
re-export of `@eesimple/types` — its tests live in `packages/types/src/urlCleanup.test.ts`. **Before
writing a test for any `lib/` module, open it and check whether it's a re-export.** If it is, the
test belongs to the source package.

**Functions owned by another package.** The client must **never** re-test a `@eesimple/types`
function. Precedent: a client `lib/youtube.test.ts` re-testing `youtubeEmbedUrl` was removed because
`packages/types/src/youtube.test.ts` already owns it. A duplicate test doubles the maintenance and
the runtime while guarding nothing new — assert the function once, in the package that exports it.

**Type-level shapes.** No `expectTypeOf` / `assertType` tests. `pnpm typecheck` in CI (plus the
pre-push merged-typecheck hook — see CLAUDE.md → Git hooks) is the gate for type correctness. The
exhaustive `Record<CustomPropertyType, …>` / `satisfies` patterns catalogued in CLAUDE.md exist
**precisely so drift fails `tsc`**, not a runtime test — adding a type-assertion test on top is
redundant.

**Factory defaults.** The `make*()` builders in `packages/client/src/test-utils/factories.ts`
(`makeBookmark` / `makeCategory` / `makeCustomProperty` / …) get **no self-tests**. They are
fixtures, not product code; the shared types plus `pnpm typecheck` keep their shape honest. A test
that asserts a factory returns its own defaults is a change-detector with zero signal.

**Static registry text in render tests.** Do **not** assert that registry-derived labels render —
e.g. that the `OEMBED_PROVIDERS` chips or a `SETTINGS_PAGES` label appear as literal strings. A copy
edit or a new registry entry shouldn't redden a test. Render tests must assert **behavior** — state
changes, callbacks firing, conditional branches taken — **never the mere presence of a static
string**.

**Third-party library behavior.** Don't test that Radix opens a popover on click, that TanStack
Router navigates, that TanStack Query caches, or that Tailwind applies a class. That's the library's
job to test; assert **your** logic around it.

## Removed-tests ledger (do not rebuild these)

These files were removed on purpose. If a coverage pass "notices a gap" here, the gap is intentional
— the coverage moved, it wasn't lost.

- **`packages/client/src/lib/youtube.test.ts`** — removed 2026-07. Pure duplicate of
  `packages/types/src/youtube.test.ts` (`youtubeEmbedUrl`); the client must not re-test a types
  function.
- **`packages/client/src/lib/urlCleanup.test.ts`** — removed 2026-07. Tested the re-export barrel
  (`lib/urlCleanup.ts`). Its two **unique** scenarios — multi-`paramRules` path selection, and
  rules-present-but-none-match → all params stripped — were **relocated** into
  `packages/types/src/urlCleanup.test.ts`, not dropped.

## Slow-but-KEPT ledger (do not re-flag, delete, or `.skip` these)

These are the suite's slowest tests, but each earns its runtime. A "make the suite faster" pass must
**leave them** — the speed lever is the node-env pragma and not writing the categories above, not
trimming real coverage.

- **`packages/middleware/src/tests/imports.test.ts`** (16 lines, ~2.8 s) and
  **`packages/middleware/src/tests/people.test.ts`** (26 lines, ~3.6 s) — slow only because each
  `await buildApp()` boots Fastify. They guard **SSRF rejection** and **querystring schema
  validation** (400-before-DB), i.e. security/validation guards. Keep.
- **`packages/client/src/components/LocationLevelGroupsSettings.test.tsx`** (~800 ms, 1 test) and
  **`packages/client/src/components/LocationPinStyleSettings.test.tsx`** (~460 ms, 1 test) — the
  worst time-per-test in the suite, but they assert real behavior in the **churn-heavy locations
  subsystem** (see the `locations-map` skill). Keep.
- **`packages/client/src/components/ConnectorsSettings.test.tsx`** — kept for its **Active/Inactive
  badge** assertion (real behavior derived from connector state) and its editable key-field checks.
  Its brittle static-provider-label spot-checks (`Vimeo`/`TikTok`/`YouTube`/… from the
  `OEMBED_PROVIDERS` registry) were **removed 2026-07** per the static-registry-string rule above —
  don't reintroduce them. If you touch it, tighten toward behavior, never toward static copy.

## Guardrails

**Never delete a test, mark it `.skip`, or loosen an assertion to make the suite faster or greener.**
That trades away the regression net, which is the opposite of the goal. This mirrors the
`overnight-cleanup` skill's Phase 2.7 test-hardening guardrails: speed comes from the
`// @vitest-environment node` pragma and from **not writing** the categories above — not from
weakening the net. If a slow test can't be sped up without weakening what it asserts, **leave it and
note it**, don't touch it.

When you're about to add a test, run this filter first: is the module a re-export barrel? Is the
function owned by another package? Is this a type-level assertion? A factory self-test? A static
registry string? Third-party behavior? If yes to any — **don't write it**, and if a sweep already
did, it's a removal candidate, recorded here.

## Audit outcome — the jsdom→node speed lever is exhausted (2026-07)

A full pass over every jsdom client test file was already done. **Do not re-run it as a build-time
play** — the conclusion is recorded here so the analysis isn't repeated:

- **No more clean node-env migrations exist.** Of the client jsdom files, all but a handful call
  `render`/`renderHook`/`renderWithRouter` (they legitimately need a DOM); the rest need a DOM global
  (`localStorage` in `stores/uiStore.viewMode.test.ts` / `lib/shareNotifications.test.ts`, `window`
  in `lib/bugReport.test.ts`, leaflet-at-import in `components/bookmarkDetailSections.test.tsx`). The
  pure files that *could* move already carry the `// @vitest-environment node` pragma.
- **The remaining "pure logic behind a render" candidates are deferred, not ignored.** A couple of
  files assert pure derivations through a rendered component — `bookmarkDetailSections` (section
  id/order) and `PlaceTypesCard` (which place types belong to no level group). Converting them to
  node unit tests requires **extracting the predicate out of the component source**, a product
  refactor whose regression risk outweighs the ~1 s/file saved (that saving is far under the
  container's ~10 s run-to-run timing noise). **Fold these in opportunistically the next time that
  source is touched** — don't do a source refactor purely for test speed.
- **Bottom line:** test-suite speed now comes from *not writing* the categories above and from the
  node pragma on genuinely-pure new files — not from churning the existing rendering tests.
