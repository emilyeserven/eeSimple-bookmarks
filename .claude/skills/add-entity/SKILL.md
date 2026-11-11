---
name: add-entity
description: >-
  Add a new entity end to end in this app — a shared type module in `@app/types`, a Drizzle table
  (plus the `migrate.ts` pre-create a new table needs), a service with slug generation, a Fastify
  route module registered in `app.ts`, a middleware fake-db test, the client API module + TanStack
  Query hook, a component + file route, a sidebar entry, and the test factory / MSW handler / story /
  test. Use when asked to "add a new entity/table/resource/content type", "add CRUD for X", "scaffold
  X like items", or "give X its own page". Mirrors the starter's one example entity, `items`. Also
  the map for maintaining an entity — renaming, adding a field, or removing it (each step below is a
  sync point; the sibling skills it links cover field-level detail).
---

# Add an entity

The starter ships exactly one example entity, **`items`** (`id, name, slug, description, createdAt,
updatedAt`), wired through every layer. A new entity copies that surface file by file. Below,
`widgets` / `Widget` stands for your new entity — replace it throughout.

Build order is **types → middleware → client** (`pnpm build` and `pnpm typecheck` build `@app/types`
first), so keep the shared types compiling before moving on.

## Checklist

### 1. Shared types — `packages/types/src/widgets.ts`

Copy `packages/types/src/items.ts`: the wire shape (`Widget`, dates as ISO strings), `CreateWidgetInput`,
and `UpdateWidgetInput = Partial<CreateWidgetInput>`. Then re-export it from
`packages/types/src/index.ts` **with a `.js` extension** — `export * from "./widgets.js";` — the
package emits native ESM, so an extensionless specifier builds locally but breaks consumers.
`index.ts` only re-exports; never declare types there.

### 2. Schema — `packages/middleware/src/db/schema.ts` (+ `migrate.ts`)

Add the `pgTable` beside `items`: `uuid` id with `defaultRandom()`, `name`, a `slug` with `.notNull().unique()`
if the entity is addressed by slug, and `withTimezone` `createdAt`/`updatedAt`.

**Also pre-create the table in `packages/middleware/src/db/migrate.ts` — required, not optional.**
Against a populated database `drizzle-kit push` treats a new table as a "truncate?" prompt; in the
non-TTY production deploy it bails while exiting 0, silently skipping the table (and any other additive
change in that run), and every query then 500s with `relation … does not exist`. Add an idempotent
`CREATE TABLE IF NOT EXISTS` step mirroring the schema, with **no `REFERENCES` to a push-created table**
(declare FK columns as plain `uuid`; push adds the constraint). The full rules and a worked example are
in the **`db-schema-change`** skill. Then `pnpm push:dev`.

### 3. Service — `packages/middleware/src/services/widgets.ts`

Copy `services/items.ts`. It gives the canonical shape:

- a `toWidget(row)` mapper (Date → ISO string, `?? null` for nullable columns) — the only place a row
  becomes the wire type;
- `list/get/create/update/delete` functions;
- slugs via `uniqueSlug(name, takenSlugs, "widget")` from `packages/middleware/src/utils/slug.ts` —
  pass the entity kind as the fallback so a name with no Latin characters doesn't slug to `"item"`;
  re-slug on rename, excluding the row's own slug;
- failures are **thrown** `AppError` subclasses from `utils/errors.ts` —
  `NotFoundError("Widget")`, `DuplicateNameError("widget", name)` — never error bodies built in the
  route (see **`api-errors`**).

### 4. Routes — `packages/middleware/src/routes/widgets.ts`

Copy `routes/items.ts`: module-level `as const` JSON-schema consts (response schema, `idParams`, one
shared body-properties object spread into `createBody`/`updateBody`, both `additionalProperties:
false`), `const tags = ["widgets"]`, and request generics typed with the `@app/types` inputs. Then in
`packages/middleware/src/app.ts`:

- `import { widgetRoutes } from "@/routes/widgets";` and `await app.register(widgetRoutes);` — an
  unregistered module just 404s;
- add `{ name: "widgets", description: "…" }` to the swagger `openapi.tags` array.

**Every field must be in the body schema** or AJV's `removeAdditional` silently strips it — the
**`add-endpoint`** skill covers this trap and the status-code conventions.

### 5. Middleware test — `packages/middleware/src/tests/widgets.test.ts`

Copy `tests/items.test.ts`: register the table with `createFakeDb` from `tests/testDbHelpers.ts`,
`mock.module("@/db", …)` **before** dynamically importing the service, and cover slug derivation,
duplicate-name 409, rename re-slug, and not-found. See **`test-structure`** for the harness and
**`what-not-to-test`** for what to skip. Run `pnpm --filter=@app/middleware test`.

### 6. Client API — `packages/client/src/lib/api/widgets.ts`

```ts
export const widgetsApi = createCrudApi<Widget, CreateWidgetInput, UpdateWidgetInput>("widgets");
```

The endpoint string is the route path after `/api/`.

### 7. Client hook — `packages/client/src/hooks/useWidgets.ts`

Copy `hooks/useItems.ts`: exported `WIDGETS_QUERY_KEY`, `useWidgets()`, one `useWidgetsInvalidation()`
helper, and `useCreate/Update/DeleteWidget` with toasts. **Decide the invalidation graph** — if any
other entity's response embeds widget data, its key must be invalidated too. See
**`client-data-hooks`**.

### 8. Route + colocated component

Follow the **`tanstack-routes`** skill for naming and colocation. Mirroring Items:

- `packages/client/src/routes/widgets/index.tsx`, copying `routes/items/index.tsx`:
  `createFileRoute("/widgets/")({ component: WidgetsManager })`.
- `packages/client/src/routes/widgets/-components/WidgetsManager.tsx`, modeled on
  `routes/items/-components/ItemsManager.tsx` (TanStack Form + zod create form, per-field auto-save on
  blur with `notifyFieldSaved` — no Save button; see **`toast-notifications`**). It lives in the
  route's `-components` folder because only this route uses it; promote it per the colocation rules if
  another route starts importing it. If it grows past fallow's complexity cap, split it per
  **`decompose-over-cap`**.
- Regenerate the route tree: `pnpm --filter=@app/client routeTree` (the Vite plugin also does it during
  `dev`/`build`). Never hand-edit `routeTree.gen.ts`.

### 9. Sidebar — `packages/client/src/components/AppSidebar.tsx`

Add a `{ to: "/widgets", label: "Widgets", icon: <LucideIcon> }` entry to `NAV_ITEMS`.

### 10. Factory, MSW handler, story, test

- **Factory** — add `makeWidget(overrides)` to `packages/client/src/test-utils/factories.ts` beside
  `makeItem`. Tests, stories and mocks build objects only through it — never inline literals that
  re-list every field (they drift silently when the type changes).
- **MSW handlers** — add `sampleWidgets` and GET/POST/PATCH/DELETE `/api/widgets` handlers to
  `apiHandlers` in `packages/client/src/test-utils/story-mocks.ts`. MSW is story-only; unit tests stub
  `fetch`.
- **Story** — `routes/widgets/-components/WidgetsManager.stories.tsx`, copying `ItemsManager.stories.tsx` (Default +
  Empty via `parameters.msw.handlers`). See **`storybook-story`**.
- **Test** — `routes/widgets/-components/WidgetsManager.test.tsx`, copying `ItemsManager.test.tsx`
  (`vi.stubGlobal("fetch", …)` + `renderWithRouter` from `test-utils/router.tsx`, asserting on the real
  notification store). A pure `.test.ts` with no DOM gets the `// @vitest-environment node` pragma —
  see **`vitest-node-environment`**.

## Removing or renaming an entity

Walk the same ten steps in reverse. Dropping the table needs a guarded `DROP TABLE IF EXISTS` step in
`migrate.ts` (push never drops data itself); a rename of a table/column is likewise a `migrate.ts`
step, not a schema-only edit. Then run `pnpm fallow` to catch leftover exports.

## Verify

Run the **`verify`** skill, or at minimum:

```
pnpm typecheck
pnpm test
pnpm lint:fix            # always from the repo root
pnpm push:dev            # twice — the second run must be a no-op
```

Then `pnpm dev`, open `/widgets` from the sidebar, create / edit / delete a row, and check the
`widgets` group at `/docs`.
