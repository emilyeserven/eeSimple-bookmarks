---
name: vitest-node-environment
description: >-
  Decide which Vitest environment a client test file in eeSimple Bookmarks runs under — the
  default jsdom, or the much faster `node` environment via a per-file
  `// @vitest-environment node` pragma. Use when adding a new client test file, when asked
  "should this test use the node environment", "make this test faster", "why is the suite slow",
  or when a test fails with "ReferenceError: Element/window/document is not defined". Covers the
  decision rule, the pragma placement, the setup.ts guard, and the verification step.
---

# Vitest environment: `node` vs jsdom for client tests

The client Vitest config (`packages/client/vite.config.ts`) partitions test files into **three
projects** at config load, by scanning each file's source:

- **`node-fast`** — files whose first line is the `// @vitest-environment node` pragma (and that
  use no isolation-dependent `vi.*` API). Node environment, `isolate: false` (persistent workers).
- **`dom-fast`** — the remaining mock-free files. jsdom, `isolate: false`.
- **`mocked`** — any file calling `vi.mock`/`doMock`/`unmock`/`hoisted`/`stubGlobal`/`stubEnv`/
  `setSystemTime`. jsdom by default (a per-file pragma still wins), full per-file isolation —
  these APIs mutate worker-global state that Vitest only resets under isolation.

**Pure test files still opt out of jsdom** with the per-file pragma as the **very first line**:

```ts
// @vitest-environment node
```

The pragma remains the per-file source of truth for the *environment*; the projects split only
adds the isolation dimension on top (there is still no config-level env glob mapping — Vitest 4
removed `environmentMatchGlobs`). Two consequences worth knowing when authoring a test:

- **A mock-free file rides the fast non-isolated path; adding `vi.mock` (or a global stub) moves
  it to the isolated `mocked` project.** Prefer dependency-free pure tests where possible.
- The partition is computed at config load — in **watch mode**, adding a `vi.mock` call to a
  previously mock-free file isn't reclassified until the vitest process restarts (`vitest run`
  and CI always cold-load the config).

This skill picks the *environment*; once you know it's a client test, the **`test-structure`** skill
covers *how to build it* (`renderWithRouter` + `vi.mock`, the fake-db harness, MSW for stories), and
**`what-not-to-test`** covers *whether* to write it at all.

## The decision rule

**Default to `node` for a `.test.ts` file; stay on jsdom the moment anything below applies.**

Needs **jsdom** (do NOT add the pragma) when the test — or anything it imports — uses:

- `render` / `renderHook` / anything from `@testing-library/react` (most `.test.tsx` files are in
  this bucket, since they typically render — but a `.test.tsx` file that only exercises pure
  helpers/data/dispatch tables co-located with a component, with no `render`/`renderHook` call, can
  still qualify for `node`; verify per the rule below rather than assuming from the extension)
- `localStorage` / `sessionStorage` (including zustand `persist` stores)
- `navigator` (e.g. `userAgent` in `lib/bugReport`)
- `window` / `document` / DOM events / timers that dispatch DOM events
- toast libraries (`sonner`), routers mounted into the DOM, MSW in browser mode
- a transitive import that itself touches `window`/`document` (e.g. `leaflet` reads `window` at
  module load — see `components/bookmarkDetailSections` below)

Safe for **node** (add the pragma): pure functions over data — parsers, formatters, predicates,
tree builders, zod schemas, reducers. Nearly everything in `packages/client/src/lib/*.test.ts`
qualifies; these plus the pure store/component-logic tests are already tagged. This includes some
pure `.test.tsx` files with no rendering: `components/bookmarkCardOverlays`,
`components/header/toolbarActions`, `components/useSidebarPins`.

Known jsdom-only `.test.ts`/`.test.tsx` files (precedent — they look pure but aren't):
`lib/bugReport` (navigator), `lib/shareNotifications` (localStorage), `lib/useListSelection` +
`lib/useListingPagination` + `hooks/useExpandedSet` + `hooks/useFieldAutoSave` +
`hooks/useOfflineToast` + `hooks/useServerUnreachableToast` + `components/useBookmarkImageEditForm`
+ `components/useBookmarkIsbn` (renderHook), `stores/uiStore.viewMode` (persisted store),
`components/bookmarkDetailSections` (transitively imports `leaflet`, which reads `window` at
module load).

## The shared setup stays guarded

`src/test-utils/setup.ts` runs for **both** environments, and re-executes per test file even in
the non-isolated projects. Its jsdom stubs (Radix pointer-capture, `scrollTo`, `matchMedia`,
`ResizeObserver`) are wrapped in `if (typeof window !== "undefined")` so node-environment files
don't crash on `Element`. Keep any new DOM stub **inside that guard**; the
`@testing-library/jest-dom/vitest` import at the top is environment-safe and stays outside it.

The top of that guard is also the **fresh-world reset** the non-isolated projects depend on: it
empties `document.body`, clears `localStorage`/`sessionStorage`, re-registers RTL's
`afterEach(cleanup)` (the auto-registration only fires on first module evaluation per worker), and
resets the module-singleton zustand stores (`test-utils/resetStores.ts`). A new module-level
singleton that tests mutate belongs in `resetStores.ts` — the symptom of a missing reset is a test
that passes alone but fails in the full run.

## Verify, don't guess

The classification is empirical, not static: after adding (or doubting) a pragma, run just that
file —

```bash
pnpm --filter=@eesimple/client exec vitest run <file>
```

- `ReferenceError: Element is not defined` at `setup.ts` (or any `window`/`document`/`navigator`
  ReferenceError in the test) → the file needs jsdom; **remove the pragma**. Never stub DOM
  globals by hand just to keep a file on node.
- Passing under node is the whole requirement — no assertion may be weakened to get there.

When a previously-pure file gains a DOM dependency, delete its pragma in the same change.
