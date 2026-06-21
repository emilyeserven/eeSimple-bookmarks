---
name: add-entity
description: >-
  Scaffold a new slug-routed entity end to end in eeSimple Bookmarks — add a new table / taxonomy /
  content type with detail and edit pages, a service with slug generation, CRUD routes, shared
  types, the client route quartet, a manager component, and right-panel registration. Use when
  asked to "add a new entity/table/taxonomy/content type", "give X detail and edit pages",
  "make X slug-routed", or "register a panel content type". Mirrors how categories, websites,
  custom-properties, autofill, media-types, youtube-channels, tags, and property-groups were each
  built.
---

# Add a slug-routed entity

Every browsable entity in this repo touches the same surface in the same order. Build them by
copying an existing, complete entity rather than from scratch. **Reference entity:
`media-types`** (or `youtube-channels`) — the most recent, fully-formed examples of the whole
pattern, including the route quartet and panel registration.

Work back-to-front: middleware → types → client. Build order is types → middleware → client, so
keep the shared types compiling first.

## Checklist

### 1. Middleware — schema (`packages/middleware/src/db/schema.ts`)
- Add the table. Include a `slug text` column (and a UNIQUE constraint where slugs must be unique).
- Export the inferred row type (e.g. `export type MediaTypeRow = typeof mediaTypes.$inferSelect`).
- **Gotcha:** if the table will already have rows in production and you add a UNIQUE or NOT NULL
  column, `drizzle-kit push` can't apply it non-interactively. Add an idempotent step to
  `src/db/migrate.ts` first — see CLAUDE.md → "Database schema changes" and the worked examples
  already in `migrate.ts`.

### 2. Middleware — service (`packages/middleware/src/services/<entity>.ts`)
Copy `services/mediaTypes.ts`. It provides the canonical shape:
- `list*`, `get*`, `get*BySlug`, `create*`, `update*`, `delete*`.
- Import slug helpers from `@/utils/slug` — **do not re-implement**:
  `slugify(name)` and `uniqueSlug(name, await takenSlugs())` (pass the id to exclude on update).
- **For `takenSlugs`**, use `takenSlugsOf()` from `@/utils/taxonomySlugs` — **do not copy
  the query inline**. The one-liner form used by every slug-routed service is:
  ```ts
  import { takenSlugsOf } from "@/utils/taxonomySlugs";
  const takenSlugs = (excludeId?: string) =>
    takenSlugsOf(myTable, myTable.slug, myTable.id, excludeId);
  ```
  Copying the inline `select slug … where id != excludeId` block from `mediaTypes.ts` adds to
  the fallow duplication budget (already near its ceiling) and caused a CI failure when a fourth
  service duplicated it.
- A `backfill*Slugs()` / `ensure*()` boot helper for existing rows.

### 3. Middleware — routes (`packages/middleware/src/routes/<entity>.ts`)
Copy `routes/mediaTypes.ts`; register the plugin in `src/app.ts` alongside the others.

### 4. Middleware — boot step (`packages/middleware/src/index.ts`)
If you added a `backfill*`/`ensure*` helper, call it in the boot block **after** `app.listen()`
(the listen-before-boot ordering is intentional — see CLAUDE.md → Deployment).

### 5. Shared types (`packages/types/src/index.ts`)
Add the row + `Create*Input` / `Update*Input` types. **Intra-package imports/re-exports need
explicit `.js` extensions** (ESM) — e.g. `export * from "./conditions.js"`.

### 6. Client — data hook (`packages/client/src/hooks/use<Entity>.ts`)
Copy `hooks/useMediaTypes.ts`: `use<Entities>`, `useCreate*`, `useUpdate*`, `useDelete*`
(TanStack Query, with `onSuccess` invalidation).

**Only add `use<Entity>BySlug`** if the breadcrumb system will actually resolve this entity's
name from a slug. Check `TAXONOMY_DESCRIPTORS` in `packages/client/src/routes/-appHeader.tsx` —
if you're registering the entity there (step below), you'll need the hook. If the entity doesn't
appear in breadcrumbs (e.g. it's only used as a relation or filter facet), skip the slug lookup
hook; an unused export adds dead-code overhead that the fallow audit flags.

### 7. Client — route quartet (`packages/client/src/routes/`)
File-based routing. Copy the five `taxonomies.media-types.*` files, renaming:
- `<area>.<entity>.tsx` — layout with `<Outlet/>`
- `<area>.<entity>.index.tsx` — searchable listing
- `<area>.<entity>.$<entity>Slug.tsx` — detail layout
- `<area>.<entity>.$<entity>Slug.index.tsx` — detail view
- `<area>.<entity>.$<entity>Slug.edit.tsx` — edit page

`routeTree.gen.ts` is generated — do not hand-edit. Run
`pnpm --filter=@eesimple/client routeTree` (or let the Vite plugin regenerate it on `dev`/`build`).

### 8. Client — manager component (`packages/client/src/components/<Entity>Manager.tsx`)
Copy `MediaTypeManager.tsx`. Export a **`<Entity>Card`** (read-only view) and **`<Entity>Row`**
(inline editor). These are the components both the pages **and** the right panel reuse — never make
a panel-only variant (right-panel parity rule in CLAUDE.md). Do not wrap internals in `Card`; let
the parent own the card chrome.

### 9. Panel registration (`packages/client/src/components/panel/contentTypes.tsx`)
- Add the type string to the `DrawerContentType` union **and** `DRAWER_CONTENT_TYPES` array in
  `packages/client/src/lib/drawerSearch.ts`.
- Add a `use<Entity>List` adapter, a `View` (reusing `<Entity>Card`), and an `Edit` (reusing
  `<Entity>Row`), then append an entry to `PANEL_CONTENT_TYPES` with `type`, `label`, `singular`,
  a `lucide-react` `icon`, `useList`, `View`, `Edit`.

## Verify

```
pnpm --filter=@eesimple/client routeTree   # regenerate route tree (or rely on dev/build)
pnpm typecheck
pnpm test
pnpm lint:fix                              # always from repo root
pnpm exec fallow dupes --format json --quiet   # duplication must stay ≤ 6.25%
```

If the fallow duplication check exceeds the budget, look for a shared utility rather than
copying code — the most common culprit is the `takenSlugs` query (use `takenSlugsOf()`; see
step 2) or the condition multi-select component (use `EntityMultiSelectCondition`; see
`add-condition-type` skill).

Then check manually that the entity:
- has working list / detail / edit pages at its slug routes, and
- appears in the right panel's type tiles and is browsable/editable there with the same Card/Row.
