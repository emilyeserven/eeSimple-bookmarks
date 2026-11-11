---
name: client-data-hooks
description: >-
  Wire a client data hook (`packages/client/src/hooks/use<Entity>.ts`) in `@app/client` — the
  per-entity TanStack Query convention: a module-level query-key const, the `createCrudApi(endpoint)`
  API factory, a `useX()` list query (plus an optional `useXBySlug()` cache lookup),
  `useCreate/Update/DeleteX` mutations with toasts, and the **invalidation graph** (each entity
  invalidates itself *plus every query that embeds its data*). Use when asked to "add/copy a data hook
  for X", "why is my list stale after saving X", "what should my mutation invalidate", "wire onSuccess
  invalidation", "add a useXBySlug", "add an extra endpoint to an API module", or when the `add-entity`
  skill's client hook step needs unpacking. Mirrors `hooks/useItems.ts` + `lib/api/items.ts`. Also
  covers maintaining a hook — "add a cross-entity invalidation", "a rename doesn't refresh the other
  list".
---

# Client data hooks

Every entity has an API module `packages/client/src/lib/api/<entity>.ts` and a data-hook file
`packages/client/src/hooks/use<Entity>.ts`. Copy the reference pair — **`lib/api/items.ts`** +
**`hooks/useItems.ts`** — rather than writing from scratch.

The non-mechanical part is the **invalidation graph** (§4): *who invalidates whom, and why*. A hook
whose data is embedded in another entity's response, but which only invalidates its own key, produces
a silent stale-UI bug that copy-from-sibling won't catch. That's the failure mode this skill exists to
prevent.

## 1. The API layer — `createCrudApi`

`createCrudApi<T, C, U>(endpoint)` in `packages/client/src/lib/api/client.ts` returns:

```ts
export const itemsApi = createCrudApi<Item, CreateItemInput, UpdateItemInput>("items");
// → { list, create, update, remove }
```

- `list()` → `GET /api/<endpoint>` (`T[]`), `create(input)` → `POST`, `update(id, input)` → `PATCH
  /api/<endpoint>/:id`, `remove(id)` → `DELETE`.
- **The delete method is `remove`**, not `delete` (reserved word).
- **There is no `get(id)`** — single-entity lookups are done client-side over the cached list (§3).
  Add a method only if the list is too large to hold, and then add the route too.
- Type parameters come from the entity's `@app/types` module — never redeclare the shapes client-side.

Base plumbing in `client.ts`: `request<T>(path, init)` prefixes `/api`, sets
`Content-Type: application/json` **only when a body is present**, throws `ApiError` on a non-`ok`
response (passing through the server's `code`/`detail`/`params`), and returns `undefined` on 204.
`uploadFile(path, file)` is the multipart escape hatch (no content-type, so the browser adds the
boundary).

**Extending an API module** — spread the factory and add methods:

```ts
export const widgetsApi = {
  ...createCrudApi<Widget, CreateWidgetInput, UpdateWidgetInput>("widgets"),
  tree: () => request<WidgetNode[]>("/widgets/tree"),
};
```

**Error text** — caught errors become toast text via `describeError(err)` (`lib/apiError.ts`). See the
**`api-errors`** skill for the envelope and code → phrase mapping; don't re-derive it here.

## 2. Query keys

- **One module-scoped, exported `as const` array per entity**: `export const ITEMS_QUERY_KEY =
  ["items"] as const;`. Reuse it for every read and invalidation — never retype the literal inline.
- The key string is the **kebab-case endpoint name** (`"items"`, `"widget-types"`).
- Nested keys **spread the base** so invalidating the base also invalidates them:
  `[...WIDGETS_QUERY_KEY, "tree"]`, `[...WIDGETS_QUERY_KEY, id, "children"]`.
- There is no central query-key factory; a cross-entity invalidation imports the other hook file's
  exported key const.
- The shared `queryClient` (`lib/queryClient.ts`) defaults to `staleTime: 30_000` and
  `refetchOnWindowFocus: false` — so after a write, **invalidation is the only thing that refreshes**
  another view promptly.

## 3. The hook set

```ts
export function useItems() {
  return useQuery({ queryKey: ITEMS_QUERY_KEY, queryFn: itemsApi.list });
}
```

- **`useXBySlug(slug)`** (add only when something resolves the entity from a URL slug — a detail route
  or header) is a `.find` over the cached list, **not** a network call:
  ```ts
  export function useWidgetBySlug(slug: string) {
    const query = useWidgets();
    return { ...query, widget: query.data?.find(w => w.slug === slug) };
  }
  ```
  An unused export trips the `fallow` dead-code gate, so don't add it speculatively.
- **Mutations** use a `{ id, input }` variable shape for update, and wire invalidation in `onSuccess`.
- **One invalidation helper per hook file** — `useItemsInvalidation()` in `hooks/useItems.ts` is a
  hook-closure returning `() => queryClient.invalidateQueries(...)`. Every mutation calls it, so when a
  dependent appears (§4) there is exactly one place to add it. If create/update/delete legitimately
  need *different* key sets, make that explicit (separate helpers or a parameter) rather than inlining
  ad-hoc lists — divergent inline lists are exactly where an omission hides.

## 4. The invalidation graph

Each mutation invalidates **its own key** plus the keys of every query whose response **embeds** this
entity's data. Decide the dependents by these rules, not by copying a sibling:

- **Is this entity's data embedded in another entity's response?** (e.g. widgets come back with their
  `itemName`, or an item response hydrates its `widget: { id, name, slug }`.) ⇒ invalidate that other
  key on **update, delete, and any bulk op**. Not on create — nothing references a brand-new row yet.
  The symptom of missing this: renaming X doesn't refresh the list that shows X's name.
- **Check the embedded shape before deciding.** If the other entity embeds only `Pick<X, "id" |
  "name" | "slug">`, then an image/description change to X does **not** need to invalidate it — only a
  rename does. Mirror the shared type in `@app/types`, and leave a comment when you deliberately skip a
  key so the asymmetry isn't "fixed" later.
- **Join/assignment writes** (an `[key, ownerType, ownerId]`-style per-owner query) can
  `setQueryData` the owner key from the response and then invalidate the parent list(s) that show
  counts or names.
- **Server-derived aggregates** (counts, trees) live under nested keys of the base — spreading the base
  key means invalidating the base covers them.
- **Self-contained entities** (nothing embeds them) invalidate only themselves — `items` is one today,
  which is why `useItemsInvalidation()` touches only `ITEMS_QUERY_KEY`.

When you add a dependent, keep a short table like this in the PR description (or a comment above the
helper) so the graph stays reviewable:

| Entity (hook) | Own key | Also invalidates | Why |
|---|---|---|---|
| Items (`useItems`) | `items` | — | nothing embeds items yet |

## 5. Toasts

Fire toasts **from the mutation hook**, not the call site, so a bare `.mutate()` can't be silent. Use
`notifySuccess` / `notifyError` from `lib/notifications.ts`, with `describeError(err)` for the error
text. The `useItems.ts` convention:

- **create** → `notifySuccess(`Created "${item.name}"`)` + `onError: notifyError(...)`.
- **delete** → `notifySuccess("Deleted item")` + `onError`.
- **update** → **no toast in the hook** when the UI auto-saves per field: the call site fires a
  field-named `notifyFieldSaved("Description")` / `notifyFieldSaveError(...)` from `lib/autoSave.ts`
  (see `ItemsManager.tsx`), and a generic "saved" toast would double up.

The two-layer notify contract (sonner toast + persistent notification log) and how to test it are
owned by the **`toast-notifications`** skill. In tests, never `vi.mock` `lib/notifications` /
`lib/autoSave` directly — assert on the real store or use `test-utils/toastSpies.ts` (see
**`test-structure`**).

## Verify

```
pnpm --filter=@app/client typecheck
pnpm --filter=@app/client test
```

Then spot-check the graph: for the entity you touched, confirm every mutation's invalidation covers
its own key **and** every key whose response embeds it, on update **and** delete.
