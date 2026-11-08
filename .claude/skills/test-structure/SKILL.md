---
name: test-structure
description: >-
  Decide how to structure a test in this app — pick the right one of the three coexisting mocking
  worlds and follow its harness recipe. Use when writing a new test and asking "how do I mock the db
  / a hook / an API here", "should this be a fake-db test or a component test", "why does my service
  test not see my query", "how do I mock `@/db`", "how do I mock the toasts", "when do I use MSW",
  or "how do the fake db / renderWithRouter / MSW pieces fit together". Covers the decision rule and
  both harness recipes (the middleware in-memory fake `db`, and the client `renderWithRouter` +
  stubbed `fetch` / `vi.mock`), the toast-mocking seam, and MSW as a story-only tool. Pairs with the
  `vitest-node-environment` skill (what env a new test runs under) and `what-not-to-test` (whether
  to write one at all) so the three form one story.
---

# Test structure

The repo has **three coexisting test/mock worlds**. They don't overlap — reaching into the wrong one
is the common failure mode this skill prevents:

1. **Middleware service tests** run under the `node:test` runner against a hand-rolled **in-memory
   fake `db`** that swaps out the real Drizzle client. No live Postgres, no HTTP.
2. **Client component tests** run under Vitest and mount the component with `renderWithRouter`, then
   cut it off from the network — either by stubbing `fetch` (the real data hooks run against canned
   responses) or by `vi.mock`-ing the hook module. No real server.
3. **Stories** mock at the **network** boundary with **MSW** handlers from `test-utils/story-mocks.ts`.
   MSW is a **story-only** tool here — it never appears in a `.test.*` file.

This skill picks *which* world a given test belongs to and how to wire it. Two sibling skills own the
adjacent decisions: the **`vitest-node-environment`** skill picks *what env* a client test runs under
(`node` vs jsdom, and which of the three Vitest projects it lands in), and the **`what-not-to-test`**
skill decides *whether* the test should exist at all.

## The decision

- **Testing middleware service logic** (a `services/*.ts` function's branching, dedup, slug
  generation, not-found / duplicate errors) → a **fake-db test** under `node:test`
  (`packages/middleware/src/tests/testDbHelpers.ts`). Reference: `tests/items.test.ts`.
- **Testing the HTTP/error contract** without a database (status codes, the error envelope, schema
  validation 400s) → build a tiny Fastify app in the test with just the pieces under test and use
  `app.inject`. Reference: `tests/errorHandler.test.ts` (wires only `errorHandler` + throwing routes).
- **Testing pure middleware helpers** → a plain `node:test` file, no fake. Reference: `tests/slug.test.ts`.
- **Testing client component behavior** (what renders, what a blur/change fires, which toast is
  recorded) → **`renderWithRouter`** under jsdom, with `fetch` stubbed or the hook module mocked.
  Fixtures come from the `make*` factories. Reference: `components/ItemsManager.test.tsx`.
- **Testing a pure client helper** (parser/formatter/predicate/reducer) → a `.test.ts` with the
  line-1 `// @vitest-environment node` pragma. Reference: `lib/apiError.test.ts`.
- **Feeding a story realistic data** → **MSW `apiHandlers`** from `test-utils/story-mocks.ts`, wired
  through Storybook. Never in a test.

**When each is wrong:**

- Don't reach for **MSW in a test** — MSW's `setupWorker`/`setupServer` is not installed in the
  Vitest setup at all. Tests stub `fetch` or mock modules; stories use MSW.
- Don't **render a component to test a pure helper**. Extract it and unit-test it directly — that
  also moves the test onto the faster node project.
- Don't try to test a route against a **live server + database**. Routes are thin; the logic lives in
  the service, and the service is what the fake-db test exercises. Route-level concerns (validation,
  error shape) are covered with `app.inject` on a minimal app.

## Middleware: the fake-db harness

`createFakeDb(tables)` (`packages/middleware/src/tests/testDbHelpers.ts`) takes an array of
`{ table, rows }` fixtures registered by Drizzle **table-object identity**, closes over the row
arrays **by reference**, and mutates them in place. It walks real Drizzle condition objects back into
row filters, resolving each `Column` to the **TS property key** (rows use `createdAt`, not
`created_at`).

**Supports:** `select(cols?).from(table)`, `.where(...)` for `eq` / `and(...)` / `isNull` /
`inArray`, `.orderBy(asc|desc)`, `.limit(n)`, `insert(table).values(...)` with `.returning()` /
`.onConflictDoNothing()` (dedups on `slug`, and is chainable to `.returning()`),
`update(table).set(...).where(...)` (+ `.returning()`), `delete(table).where(...)` (+ `.returning()`),
`transaction(cb)` (the `tx` is the same fake — no real rollback), and a placeholder `$count(...)`.
Auto-generates `id` (`fake-id-N`) when a row doesn't supply one; reset with `resetFakeIds()`.

**Does NOT support:** ``execute(sql`…`)`` (**throws by default** — override it, see below), `or` /
`ne` / `gt` / `lt` / `like` (not parsed — they collapse or drop), joins, real FK cascade,
`onConflictDoUpdate`, aggregation/grouping.

### The mock-before-import ordering

ES module imports are cached process-wide, so **`mock.module("@/db", …)` must run before the service
module is first imported**. Every fake-db test file follows this order: static imports of `node:test`,
schema tables, and the harness → build the fake → install the mock → **then** `await import` the
service. From `tests/items.test.ts`:

```ts
import { mock, test } from "node:test";
import { items } from "@/db/schema";
import { createFakeDb, resetFakeIds } from "@/tests/testDbHelpers";

// Mutable, never-reassigned fixture array — the fake `db` closes over it by reference.
const itemRows: Record<string, unknown>[] = [];

function resetRows(rows: Record<string, unknown>[] = []): void {
  resetFakeIds();
  itemRows.length = 0;      // mutate in place; reassigning would detach the fake
  itemRows.push(...rows);
}

const db = createFakeDb([{ table: items, rows: itemRows }]);

mock.module("@/db", { namedExports: { db } });   // BEFORE the dynamic import

const { createItem, deleteItem, getItem, updateItem } = await import("@/services/items");
```

Call `resetRows(...)` at the top of each `test(...)` so tests don't share state. The middleware
`test` script passes `--experimental-test-module-mocks`, which `mock.module` requires.

**Partial mock** for a transitively-imported module you only want to tweak: `namedExports` replaces a
module wholesale, so re-import the real one and spread it, overriding just the one export:

```ts
const real = await import("@/services/someService");
mock.module("@/services/someService", {
  namedExports: { ...real, someExport: async () => ({ /* canned */ }) },
});
```

### The select-then-branch contract (why the fake depends on it)

A service that upserts must do it as **SELECT → branch in JS → separate UPDATE/INSERT**, never a
DB-level `onConflictDoUpdate` — because the fake has no atomic upsert. Shape:

```ts
const [existing] = await db.select().from(table).where(eq(table.key, key));
if (existing) {
  const [row] = await db.update(table).set({ value, updatedAt: new Date() })
    .where(eq(table.key, key)).returning();
  return toRecord(row);
}
const [row] = await db.insert(table).values({ key, value }).returning();
return toRecord(row);
```

Each of read / branch / write is a primitive the fake supports, so the real conflict-resolution logic
runs in JS where the test can drive it. `services/items.ts`'s duplicate-name check (select, then throw
a 409 `duplicateName` `AppError`, then insert) is the same idea.

### When the fake can't parse a query

Three escape hatches, preferred order:

1. **Restructure the service into select-then-branch** so it only emits supported primitives.
   Preferred: it makes the *service* more testable rather than teaching the fake new tricks.
2. **Override `db.execute`** for a service that must run one raw ``sql`…` `` statement. Assign the
   override **before** `mock.module` / the service import, and use the exported
   `extractParams(query)` to read the template's interpolated values in order (table references
   render as identifiers, not params):

   ```ts
   db.execute = async (query: unknown): Promise<{ rows: unknown[] }> => {
     const [deletedId, targetId] = extractParams(query);
     const survivors = rows.filter(/* replicate the SQL's semantics in JS */);
     rows.length = 0; rows.push(...survivors);
     return { rows: [] };
   };
   ```

3. **Extend `testDbHelpers.ts`** with the missing primitive — only when several services need it,
   and keep the additions condition-honest (a no-op `.where` would let wrong queries pass).

## Client: renderWithRouter + a network cut-off

`renderWithRouter(ui, { paths? })` (`packages/client/src/test-utils/router.tsx`) mounts `ui` at the
index route of a minimal in-memory TanStack Router inside a fresh `QueryClient` (`retry: false` for
queries and mutations). It's **async** — always `await` it (the mount is wrapped in `act` to flush
the router's settle). Pass `paths` for every route a rendered `<Link>` targets.

The query cache is **empty**, so any real data hook that runs will hit `fetch`. Cut it off one of two
ways:

**A. Stub `fetch` and let the real hooks run** (the reference — `components/ItemsManager.test.tsx`).
This exercises the real `hooks/useItems.ts` + `lib/api/items.ts` path, and you assert on the request
the component made:

```ts
function stubApi(items = [makeItem()]) {
  const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    if (method === "GET") return Response.json(items);
    if (method === "PATCH") return Response.json(items[0]);
    return new Response(null, { status: 204 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
afterEach(() => { vi.unstubAllGlobals(); });

it("auto-saves the description on blur", async () => {
  const fetchMock = stubApi();
  await renderWithRouter(<ItemsManager />);
  const textarea = await screen.findByLabelText("Description");
  fireEvent.change(textarea, { target: { value: "New text" } });
  fireEvent.blur(textarea);
  await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
    "/api/items/item-1", expect.objectContaining({ method: "PATCH" })));
});
```

**B. `vi.mock` the hook module** when the hook's network behavior is irrelevant and you want canned
`data` / a synchronous `mutate`. Mock **every** export the component imports from that module —
the list hook *and* each mutation — or the unmocked one runs for real against an unstubbed `fetch`:

```ts
vi.mock("@/hooks/useItems", () => ({
  useItems: () => ({ data: [makeItem()], isLoading: false }),
  useCreateItem: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateItem: () => ({ mutate: (vars, opts) => opts?.onSuccess?.(makeItem({ id: vars.id, ...vars.input })) }),
  useDeleteItem: () => ({ mutate: vi.fn() }),
}));
```

Match the mock path to the component's own import form (`@/hooks/…` vs a relative path).

Both `vi.stubGlobal` and `vi.mock` move the file into the isolated `mocked` Vitest project (see the
**`vitest-node-environment`** skill). That's fine when needed — but where the test can stay mock-free
(e.g. a presentational component given props, like `components/ui/data-table.test.tsx`), it rides
the faster non-isolated project. A plain `vi.fn()` callback prop does **not** count as a mock.

**Fixtures come from `make*` factories** (`test-utils/factories.ts` — `makeItem`). Never re-list a
shared entity's fields inline: an inline literal silently drifts when the type gains/loses a field
and only surfaces as a typecheck failure. When you add a shared entity type, add its factory in the
same change. (A factory self-test is itself not worth writing — see **`what-not-to-test`**.)

### Asserting toasts: one seam

- **Prefer mock-free:** assert on the real `notificationStore` — every toast is recorded there.
  `ItemsManager.test.tsx` checks
  `useNotificationStore.getState().notifications[0]?.message` equals `"Updated Description"`. The
  store is reset between files by `test-utils/resetStores.ts`.
- **If you must spy**, mock only through the shared seam `test-utils/toastSpies.ts`, which stands in
  for `lib/notifications` (the middle layer):

  ```ts
  import { notifyError, notifySuccess, resetToastSpies } from "../test-utils/toastSpies";
  vi.mock("../lib/notifications", async () => await import("../test-utils/toastSpies"));
  beforeEach(() => { resetToastSpies(); });
  ```

  Reference: `lib/autoSave.test.ts`. **Never** `vi.mock` `lib/autoSave` (its real field wording —
  "Updated <label>" / "Couldn't save <label>: <cause>" — should stay under test) or `sonner`
  directly. The only exception is the test of the sonner layer itself, `lib/notifications.test.ts`.

**Environment.** Most `.test.tsx` files render, so they stay on jsdom. A test with no
`render`/`renderHook` and no DOM globals can take the line-1 `// @vitest-environment node` pragma —
the **`vitest-node-environment`** skill owns that call. The shared `test-utils/setup.ts` runs for
both envs; its jsdom stubs and fresh-world reset are guarded by `if (typeof window !== "undefined")`.

**Opening Radix menus under jsdom.** The setup stubs let Radix portals mount, but jsdom won't deliver
the pointer-driven open. Open with a keyboard event, then click the revealed item:
`fireEvent.keyDown(trigger, { key: "ArrowDown" })` for a Select (`role="option"`),
`fireEvent.keyDown(trigger, { key: " " })` for a DropdownMenu (`role="menuitem"`).

## Stories: MSW handlers

Stories mock at the **network** boundary. `test-utils/story-mocks.ts` exports `apiHandlers` (MSW
handlers for the `/api/items` routes the data-driven stories read) plus `sampleItems` built from the
same `make*` factories. MSW is wired globally in `packages/client/.storybook/preview.tsx`
(`initialize({ onUnhandledRequest: "bypass" })` + `mswLoader`), alongside the `withQueryClient` /
`withRouter` / `withI18n` decorators — the Storybook analogues of the test harness, so the real data
hooks run against MSW in a story.

A story opts in via a parameter, and overrides per-story by putting its handler **first** and
spreading the defaults after it (from `components/ItemsManager.stories.tsx`):

```tsx
import { apiHandlers } from "../test-utils/story-mocks";
const meta = { component: ItemsManager, parameters: { msw: { handlers: apiHandlers } } };
// per-story override:
export const Empty: Story = {
  parameters: { msw: { handlers: [http.get("/api/items", () => HttpResponse.json([])), ...apiHandlers] } },
};
```

When you add an endpoint a story reads, add its default handler to `apiHandlers`.

**Story-only, guaranteed:** `msw` / `http` / `HttpResponse` are imported only in `.stories.tsx` files
and `story-mocks.ts` itself; there is no `from "msw"` in any `.test.*` file. Keep the two apart. See
the **`storybook-story`** skill for the story file conventions.

## See also

- **`vitest-node-environment`** — which env (`node` vs jsdom) and which Vitest project a client test
  lands in; the fresh-world reset rules for the non-isolated projects.
- **`what-not-to-test`** — whether a test should exist at all.
- **`toast-notifications`** — the toast/auto-save wording the seam above asserts.
- **`add-entity`** / **`add-endpoint`** — scaffolds whose test steps follow these recipes (a
  `make<X>` factory, a fake-db service test).
