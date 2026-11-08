---
name: vitest-node-environment
description: >-
  Decide which Vitest environment (and which of the three Vitest projects) a client test file runs
  under — the default jsdom, or the much faster `node` environment via a per-file
  `// @vitest-environment node` pragma — and keep the non-isolated projects' fresh-world reset
  intact. Use when adding a new client test file, when asked "should this test use the node
  environment", "make this test faster", "why is the suite slow", "why does this test pass alone but
  fail in the full run", or when a test fails with "ReferenceError: Element/window/document is not
  defined". Covers the decision rule, the pragma placement, the three-project partition, the
  setup.ts guard + reset, and the verification step.
---

# Vitest environment: `node` vs jsdom for client tests

The client Vitest config (`packages/client/vite.config.ts`) partitions test files into **three
projects** at config load, by scanning each file's source:

- **`node-fast`** — files containing the `// @vitest-environment node` pragma (and using no
  isolation-dependent `vi.*` API). Node environment, `isolate: false` (persistent workers).
  e.g. `lib/apiError.test.ts`, `lib/errorMessages.test.ts`, `i18n.test.ts`.
- **`dom-fast`** — the remaining mock-free files. jsdom, `isolate: false`.
  e.g. `components/ui/data-table.test.tsx`.
- **`mocked`** — any file calling `vi.mock` / `doMock` / `unmock` / `hoisted` / `stubGlobal` /
  `stubEnv` / `setSystemTime`. jsdom by default (a per-file pragma still wins), full per-file
  isolation — these APIs mutate worker-global state that Vitest only resets under isolation.
  e.g. `components/ItemsManager.test.tsx` (`stubGlobal("fetch")`), and the node-pragma
  `lib/autoSave.test.ts` / `lib/notifications.test.ts` / `lib/pwa.test.ts` (`vi.mock`).

The config throws at load if the partition ever loses a file, and `sequence.groupOrder` runs the
projects node → dom → mocked so environments don't churn the persistent workers.

**Pure test files opt out of jsdom** with the per-file pragma as the **very first line**:

```ts
// @vitest-environment node
```

The pragma is the per-file source of truth for the *environment*; the project split only adds the
isolation dimension on top (there is no config-level env glob mapping — Vitest 4 removed
`environmentMatchGlobs`). Two consequences when authoring a test:

- **A mock-free file rides the fast non-isolated path; adding `vi.mock` (or a global stub) moves it
  to the isolated `mocked` project.** Prefer dependency-free pure tests where possible. A plain
  `vi.fn()` / `vi.spyOn` does not reclassify a file.
- The partition is computed at config load — in **watch mode**, adding a `vi.mock` call to a
  previously mock-free file isn't reclassified until the vitest process restarts (`vitest run` and
  CI always cold-load the config).

This skill picks the *environment*; the **`test-structure`** skill covers *how to build* the test
(fake `db`, `renderWithRouter` + stubbed `fetch` / `vi.mock`, MSW for stories), and
**`what-not-to-test`** covers *whether* to write it at all.

## The decision rule

**Default to `node` for a `.test.ts` file; stay on jsdom the moment anything below applies.**

Needs **jsdom** (do NOT add the pragma) when the test — or anything it imports — uses:

- `render` / `renderHook` / anything from `@testing-library/react` (most `.test.tsx` files — but a
  `.test.tsx` that only exercises pure helpers/data/dispatch tables co-located with a component, with
  no `render`/`renderHook` call, can still qualify for `node`; verify per the rule below rather than
  assuming from the extension)
- `localStorage` / `sessionStorage` — including asserting what a zustand `persist` store wrote
  (`stores/uiStore.ts`, `stores/notificationStore.ts`). Merely *calling* a persisted store's actions
  is fine under node — `lib/notifications.test.ts` does — but asserting the persisted blob is not.
- `navigator`, `window` / `document`, `matchMedia` (e.g. `hooks/use-mobile.ts`), DOM events, timers
  that dispatch DOM events
- routers mounted into the DOM, MSW in browser mode
- a transitive import that itself touches `window`/`document` **at module load** (some map/chart
  libraries do) — the test crashes on import, not on the assertion

Safe for **node** (add the pragma): pure functions over data — parsers, formatters, predicates, tree
builders, zod schemas, reducers, error-code mappers. Nearly everything in
`packages/client/src/lib/*.test.ts` qualifies, and every existing one is already tagged.

## The shared setup stays guarded — and is the fresh-world reset

`src/test-utils/setup.ts` runs for **both** environments, and re-executes **per test file** even in
the non-isolated projects (the module graph and the jsdom window are what persist). Everything
DOM-related lives inside `if (typeof window !== "undefined")` so node files don't crash on `Element`.
Keep any new DOM stub **inside that guard**; the `@testing-library/jest-dom/vitest` and `../i18n`
imports at the top are environment-safe and stay outside it.

The top of that guard is the **fresh-world reset** the `isolate: false` projects depend on. It
restores what a fresh environment used to provide:

1. empties `document.body` and clears `localStorage` / `sessionStorage`;
2. re-registers RTL's `afterEach(cleanup)` explicitly — RTL's auto-registration only fires the first
   time its module is evaluated in a worker, so with a reused module cache it wouldn't recur;
3. calls `resetAllStores()` from `test-utils/resetStores.ts`.

**Rules for new module-level state:**

- A new **zustand store** that tests can mutate goes in `RESETTABLE_STORES` in
  `test-utils/resetStores.ts`, in the same change that creates the store (reset via
  `getInitialState()`).
- A new **non-zustand module singleton** (a captured registration, a "current X" holder, a cache)
  registers a plain reset callback with `registerReset(fn)` in that file. Precedents already there:
  `lib/notificationPage`'s current-page holder and `lib/pwa`'s `__resetPwaForTests`. If the module
  has no way to reset itself, export a small `__resetXForTests()` from it.
- **The symptom of a missing reset** is a test that passes alone but fails (or makes a neighbour
  fail) in the full non-isolated run. Fix the reset; don't move the file to `mocked` to dodge it.
- Never put `isolate: false` on the `mocked` project: the worker-global mock registry plus DOM
  accumulation produce cross-file failures, and it measured *slower* than the isolated baseline.

## Verify, don't guess

The classification is empirical, not static: after adding (or doubting) a pragma, run just that
file —

```bash
pnpm --filter=@app/client exec vitest run src/lib/apiError.test.ts
```

then the whole suite (`pnpm --filter=@app/client test`) to catch cross-file leakage in the
non-isolated projects.

- `ReferenceError: Element is not defined` at `setup.ts` (or any `window`/`document`/`navigator`
  ReferenceError in the test) → the file needs jsdom; **remove the pragma**. Never stub DOM globals by
  hand just to keep a file on node.
- Passing under node is the whole requirement — no assertion may be weakened to get there.

When a previously-pure file gains a DOM dependency, delete its pragma in the same change.
