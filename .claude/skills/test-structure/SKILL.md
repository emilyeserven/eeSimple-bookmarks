---
name: test-structure
description: >-
  Decide how to structure a test in eeSimple Bookmarks — pick the right one of the three coexisting
  mocking worlds and follow its harness recipe. Use when writing a new test and asking "how do I mock
  the db / a hook / an API here", "should this be a fake-db test or a component test", "why does my
  service test not see my query", "why do I get `No QueryClient set`", "how do I mock `@/db`", "when
  do I use MSW", or "how do the fake db / renderWithRouter / MSW pieces fit together". Covers the
  decision rule and both harness recipes (the middleware in-memory fake `db`, and the client
  `renderWithRouter` + `vi.mock`), with MSW documented as a story-only tool. Pairs with the
  `vitest-node-environment` skill (what env a new test runs under) and `what-not-to-test` (whether to
  write one at all) so the three form one story.
---

# Test structure

The repo has **three coexisting test/mock worlds**. They don't overlap — reaching into the wrong one
is the common failure mode this skill prevents:

1. **Middleware service tests** run under the `node:test` runner against a hand-rolled **in-memory
   fake `db`** that swaps out the real Drizzle client. No live Postgres, no HTTP.
2. **Client component tests** run under Vitest and mount the component with `renderWithRouter`, then
   `vi.mock` every data hook it touches. No network, no real query cache.
3. **Stories** mock at the **network** boundary with **MSW** handlers from `test-utils/story-mocks.ts`.
   MSW is a **story-only** tool here — it never appears in a `.test.*` file.

This skill picks *which* world a given test belongs to and how to wire it. Two sibling skills own the
adjacent decisions: the **`vitest-node-environment`** skill picks *what env* a client test runs under
(`node` vs jsdom), and the **`what-not-to-test`** skill decides *whether* the test should exist at
all. Read those for their questions; read this one for structure.

## The decision

- **Testing middleware service logic** (a `services/*.ts` function's branching, dedup, precedence,
  slug generation, cache invalidation) → a **fake-db test** under `node:test`. Then pick the harness
  variant by the service's query shape (see below): the **condition-parsing** fake
  (`testDbHelpers.ts`) for single-table CRUD that filters with `eq`/`and`/`isNull`, or the
  **fixture-per-table** fake (`testUtils/fakeDb.ts`) for a service that joins/orders/groups and does
  the real work in JS after the query.
- **Testing client component behavior** (what renders, what a blur/change fires, which toast shows)
  → **`renderWithRouter` + `vi.mock`** under jsdom. Fixtures come from the `make*` factories.
- **Feeding a story realistic data** → **MSW `apiHandlers`** from `test-utils/story-mocks.ts`, wired
  through Storybook. Never in a test.

**When each is wrong:**

- Don't reach for **MSW in a test** — client tests mock at the *hook* boundary (`vi.mock`), not the
  network boundary. MSW's `setupWorker`/`setupServer` is not installed in the Vitest setup at all.
- Don't **render a component to test a pure helper**. A parser/formatter/predicate/reducer co-located
  with a component is a pure `.test.ts` (usually with the `// @vitest-environment node` pragma) — see
  the **`vitest-node-environment`** skill.
- Don't try to test a **route/HTTP layer** against a live server. Routes are thin; the logic lives in
  the service, and the service is what the fake-db test exercises.

## Middleware: the fake-db harness

Two different in-memory fakes both export a function named `createFakeDb` — **disambiguate them by
file path**, they have different signatures and mechanics.

### Harness 1 — the condition-parsing fake (`tests/testDbHelpers.ts`, the default)

`createFakeDb(tables)` (`packages/middleware/src/tests/testDbHelpers.ts`) takes an array of
`{ table, rows }` fixtures registered by Drizzle **table-object identity**, closes over the row arrays
**by reference**, and mutates them in place. It walks real Drizzle condition objects back into row
filters. This is the harness the "select-then-branch" contract exists for; `cardDisplayRules.test.ts`
was the original precedent.

**Supports:** `select(cols?).from(table)`, `.where(...)` for `eq` / `and(...)` / `isNull`,
`.orderBy(asc|desc)`, `.limit(n)`, `insert(table).values(...)` with `.returning()` /
`.onConflictDoNothing()` (dedups on `slug`), `update(table).set(...).where(...)`,
`delete(table).where(...)`, `transaction(cb)` (the `tx` is the same fake — no real rollback), and a
placeholder `$count(...)`. Auto-generates `id` (`fake-id-N`) when a row doesn't supply one; reset with
`resetFakeIds()`.

**Does NOT support:** ``execute(sql`…`)`` (**throws by default** — override it, see below), any
operator beyond eq/and/isNull (`inArray`, `or`, `ne`, `gt`/`lt`, `like` are not parsed — they collapse
or drop), joins, real FK cascade, `onConflictDoUpdate`, aggregation/grouping.

### The mock-before-import ordering (both harnesses)

ES module imports are cached process-wide, so **`mock.module("@/db", …)` must run before the service
module is first imported**. Every fake-db test file follows this order: static imports of `node:test`,
schema tables, and the harness → build the fake → install the mock → **then** `await import` the
service. From `tests/categories.test.ts`:

```ts
import { mock, test } from "node:test";
import { bookmarks, categories, entityNames, taxonomyAssignments } from "@/db/schema";
import { createFakeDb, resetFakeIds } from "@/tests/testDbHelpers";

const categoryRows: Record<string, unknown>[] = [];   // fixtures the fake closes over by reference
// …
const db = createFakeDb([{ table: categories, rows: categoryRows }, /* … */]);

mock.module("@/db", { namedExports: { db } });        // BEFORE the dynamic import

const { createCategory, deleteCategory } = await import("@/services/categories");
```

**Partial mock** for a transitively-imported module you only want to tweak: `namedExports` replaces a
module wholesale, so re-import the real one and spread it, overriding just the one export
(`categories.test.ts` does this to `@/services/appSettings`'s `getAutomationSettings`):

```ts
const realAppSettings = await import("@/services/appSettings");
mock.module("@/services/appSettings", {
  namedExports: { ...realAppSettings, getAutomationSettings: async () => ({ /* … */ }) },
});
```

### The select-then-branch contract (why the fake depends on it)

A service that upserts must do it as **SELECT → branch in JS → separate UPDATE/INSERT**, never a
DB-level `onConflictDoUpdate` — because the condition-parsing fake has no atomic upsert. This is
exactly what CLAUDE.md means when it says a service "is select-then-branch so it stays testable
against the in-memory fake db." Reference: `services/entityLayouts.ts` `upsertEntityLayout`:

```ts
const [existing] = await db.select().from(entityLayouts).where(eq(entityLayouts.entityKind, kind));
if (existing) {
  const [row] = await db.update(entityLayouts).set({ layout, updatedAt: new Date() })
    .where(eq(entityLayouts.entityKind, kind)).returning();
  return toRecord(row);
}
const [row] = await db.insert(entityLayouts).values({ entityKind: kind, layout, /* … */ }).returning();
return toRecord(row);
```

Each of read / branch / write is a primitive the fake supports, so the real conflict-resolution logic
runs in JS where the test can drive it. `services/categories.ts` (`ensureDefaultCategory`,
`deleteCategory`'s orphan reassignment) follows the same shape.

### When the fake can't parse a query

Three escape hatches, preferred order:

1. **Restructure the service into select-then-branch** so it only emits supported primitives — the
   `entityLayouts` / `cardDisplayRules` precedent. Preferred: it makes the *service* more testable
   rather than teaching the fake new tricks.
2. **Override `db.execute`** for a service that must run one raw ``sql`…` `` statement. Assign the
   override **before** `mock.module`, and use the exported `extractParams(query)` to read the
   template's interpolated values in order (table references render as identifiers, not params).
   From `tests/languageUsageLevels.test.ts`:

   ```ts
   db.execute = async (query: unknown): Promise<{ rows: unknown[] }> => {
     const [deletedId, targetId] = extractParams(query);
     const survivors = usageRows.filter(/* replicate the SQL's semantics in JS */);
     usageRows.length = 0; usageRows.push(...survivors);
     return { rows: [] };
   };
   ```

3. **Switch to Harness 2** (below) when the service joins/orders/groups and does its real work in JS
   after the query.

### Harness 2 — the fixture-per-table fake (`tests/testUtils/fakeDb.ts`)

`createFakeDb()` → `FakeDbHandle` (`packages/middleware/src/tests/testUtils/fakeDb.ts`). It **ignores
conditions entirely** — `.where`/`.leftJoin`/`.innerJoin`/`.orderBy`/`.limit`/`.onConflictDo*` are
no-ops that return the same node. You register the rows a `select().from(table)` should resolve to via
`setRows(table, rows)`, and assert on the recorded `inserted` / `deleted` call logs. Same
mock-before-import rule. Use it for services that join/aggregate and then group/dedup/precedence in
JS (e.g. `bookmarkHydration`, `homepageSections`) — the fake exercises that JS without reimplementing
`inArray`/`orderBy`/join semantics.

Representative fake-db test files: `tests/categories.test.ts`, `tests/entityLayouts.test.ts`,
`tests/languageUsageLevels.test.ts` (Harness 1); `tests/bookmarkHydration.test.ts`,
`tests/homepageSections.test.ts` (Harness 2).

## Client: renderWithRouter + vi.mock

`renderWithRouter(ui, { paths? })` (`packages/client/src/test-utils/router.tsx`) mounts `ui` at the
index route of a minimal in-memory TanStack Router inside a **bare, unseeded** `QueryClient`
(`retry: false`). It's **async** — always `await` it. Pass `paths` for every route a rendered
`<Link>` targets.

The standard recipe (`components/CategoryGeneralForm.test.tsx`): `vi.mock` the entity's hook module to
return canned `data` / a synchronous `mutate`, `vi.mock` `../lib/autoSave` to spy on the field toasts,
build fixtures with `make*`, then `await renderWithRouter` and drive the DOM:

```ts
import { makeCategory } from "../test-utils/factories";
import { renderWithRouter } from "../test-utils/router";

vi.mock("../hooks/useCategories", () => ({
  useUpdateCategory: () => ({ mutate: (vars, opts) => { updateMutate(vars, opts); opts?.onSuccess?.(makeCategory({ id: vars.id, ...vars.input })); } }),
}));
vi.mock("../lib/autoSave", () => ({ notifyFieldSaved: (l) => notifyFieldSaved(l), notifyFieldSaveError: (l, c) => notifyFieldSaveError(l, c) }));
// …
await renderWithRouter(<CategoryGeneralForm category={makeCategory({ id: "cat-1" })} />);
```

**The `No QueryClient set` gotcha.** `renderWithRouter` provides a `QueryClient` but never seeds it,
so a real data hook that runs (because you *didn't* mock it) calls `useQueryClient()` and — despite
the provider being present — the real fetch path throws `Error: No QueryClient set, use
QueryClientProvider to set one` at render. **Mock every hook module the component touches.** A hook
module usually needs both the list hook and the mutation: `vi.mock("../hooks/useXs", () => ({ useXs:
() => ({ data: [] }), useCreateX: () => ({ mutateAsync: vi.fn() }) }))`. This is the same gotcha the
**`add-entity`** skill flags for `BookmarkForm.test.tsx`. Both the relative (`../hooks/…`) and alias
(`@/hooks/…`) mock-path forms are used across the suite — match the component's own import.

**Fixtures come from `make*` factories** (`test-utils/factories.ts`) — `makeCategory`, `makeBookmark`,
`makeCustomProperty`, etc. Never re-list a shared entity's fields inline: an inline literal silently
drifts when the type gains/loses a field and only surfaces as a CI typecheck failure. That factory
rule is the same one CLAUDE.md's "Shared test factories" convention states; see the **`what-not-to-test`**
skill for why a factory self-test is itself not worth writing.

**Environment.** Most `.test.tsx` files render, so they stay on jsdom. A `.test.tsx` that exercises
only pure component-logic with no `render`/`renderHook` can take the line-1 `// @vitest-environment
node` pragma — the **`vitest-node-environment`** skill owns that call and lists the three current pure
`.test.tsx` files. The shared `test-utils/setup.ts` runs for both envs; its jsdom stubs are guarded by
`if (typeof window !== "undefined")`.

## Stories: MSW handlers

Stories mock at the **network** boundary. `test-utils/story-mocks.ts` exports `apiHandlers` (MSW
handlers covering every `/api/*` route the data-driven stories read) plus `sample*` fixtures built
from the same `make*` factories. MSW is wired globally in `packages/client/.storybook/preview.tsx`
(`initialize({ onUnhandledRequest: "bypass" })` + `mswLoader`), alongside the `withQueryClient` /
`withRouter` / `withI18n` decorators — the Storybook analogues of the test harness, so the real data
hooks run against MSW in a story.

A story opts in via a parameter, and extends per-story by spreading:

```tsx
import { apiHandlers, sampleBookmark } from "../test-utils/story-mocks";
const meta = { component: BookmarkForm, parameters: { msw: { handlers: apiHandlers } } };
// per-story override:
parameters: { msw: { handlers: [http.get("/api/bookmarks", () => HttpResponse.json([sampleBookmark])), ...apiHandlers] } }
```

**Story-only, guaranteed:** `msw` / `http` / `HttpResponse` are imported only in `.stories.tsx` files
and `story-mocks.ts` itself; there is no `from "msw"` in any `.test.*` file. Tests mock at the hook
boundary, stories at the network boundary — keep the two apart.

## See also

- **`vitest-node-environment`** — which env (`node` vs jsdom) a client test file runs under.
- **`what-not-to-test`** — whether a test should exist at all (re-export barrels, other-package
  functions, factory self-tests, the removed-tests ledger).
- **`add-entity`** — the end-to-end scaffold; step 8 is the `No QueryClient set` gotcha, and its test
  step adds a `make<X>` factory.
