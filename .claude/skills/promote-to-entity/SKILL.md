---
name: promote-to-entity
description: >-
  Promote an existing settings-only CRUD entity to a full slug-routed entity with view/edit pages,
  sidebar entry, and breadcrumbs. Use when asked to "promote X to an entity", "give X
  its own pages", "promote settings feature to full entity", or "add detail/edit pages to existing
  X". The entity already has a DB table, routes, service, shared types, and client hooks — this
  skill documents only what is NEW compared to a greenfield entity (see add-entity for the baseline).
---

# Promote a settings-only entity to a full entity

Use this skill when the entity **already exists** in the middleware (DB table, routes, service) and
client (types, hooks, manager component, settings page) but has no slug, no detail/edit pages, and no
sidebar entry.

**Reference implementation: Saved Filters** (`saved_filters` table → `/saved-filters` routes).
Compare against **Autofill Rules** and **Property Groups** for the full client pattern.

The key distinction from `add-entity`: **don't recreate what already exists — extend it.**

---

## Build order: middleware → types → client

### 1. DB schema — add `slug` column (`packages/middleware/src/db/schema.ts`)

Add `slug: text("slug")` (nullable) and a `unique("…_slug_unique").on(table.slug)` constraint to
the existing table definition.

The nullable column is push-safe (no prompt). The unique constraint on an existing table triggers
the `pgSuggestions` prompt in non-TTY deploys — handle it in migrate.ts (step 2).

```ts
export const myEntities = pgTable("my_entities", {
  // …existing columns…
  slug: text("slug"),                    // ADD — nullable so existing rows are safe
}, table => [
  // …existing constraints…
  unique("my_entities_slug_unique").on(table.slug),  // ADD
]);
```

### 2. Migration — unique constraint (`packages/middleware/src/db/migrate.ts`)

Add **two** idempotent steps to the `migrations` array (each `db.execute()` must be exactly one
SQL statement — drizzle's extended-protocol runs only the first statement of a multi-statement
string):

```ts
{
  name: "add my_entities.slug column + unique constraint",
  run: async (db) => {
    await db.execute(sql`
      ALTER TABLE IF EXISTS "my_entities" ADD COLUMN IF NOT EXISTS "slug" text
    `);
    await db.execute(sql`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'my_entities_slug_unique'
        ) THEN
          ALTER TABLE IF EXISTS "my_entities"
            ADD CONSTRAINT "my_entities_slug_unique" UNIQUE ("slug");
        END IF;
      END $$
    `);
  },
},
```

### 3. Shared types — add `slug` (`packages/types/src/index.ts`)

Add `slug: string | null` to the interface. Nullable because existing rows start null until the
boot backfill runs.

### 4. Middleware service — slug support (`packages/middleware/src/services/<entity>.ts`)

Four changes to the existing service:

1. **`toEntity()` mapper** — add `slug: row.slug`.
2. **`takenSlugs` helper** — add using `takenSlugsOf` (do not copy the query inline):
   ```ts
   import { takenSlugsOf } from "@/utils/taxonomySlugs";
   const takenSlugs = (excludeId?: string) =>
     takenSlugsOf(myEntities, myEntities.slug, myEntities.id, excludeId);
   ```
3. **`createEntity()`** — generate slug: `slug: uniqueSlug(input.name, await takenSlugs())`.
4. **`updateEntity()`** — regenerate slug when name changes:
   ```ts
   if (input.name !== undefined) {
     updates.name = input.name;
     updates.slug = uniqueSlug(input.name, await takenSlugs(id));
   }
   ```

Additionally add:

- **`getEntityBySlug(slug: string)`** — for server-side lookup (the client resolves by slug from
  the cached list, but a REST endpoint may still want this).
- **`backfillEntitySlugs()`** — a one-time step that finds pre-existing rows with null slugs and
  assigns them (the create path already writes the slug). Call from the boot block, then prune it once
  it has applied in production (see the `db-schema-change` skill's "Pruning spent steps"):
  ```ts
  export async function backfillEntitySlugs() {
    const rows = await db.select().from(myEntities).where(isNull(myEntities.slug));
    if (rows.length === 0) return;
    const taken = await takenSlugs();
    for (const row of rows) {
      const slug = uniqueSlug(row.name, taken);
      taken.add(slug);
      await db.update(myEntities).set({ slug }).where(eq(myEntities.id, row.id));
    }
  }
  ```
- **`bulkDeleteEntities(ids: string[])`** — if the entity needs bulk select/delete:
  ```ts
  export function bulkDeleteMyEntities(ids: string[]) {
    return bulkDeleteEntities(db, myEntities, ids);
  }
  ```

### 5. Middleware routes — bulk delete (`packages/middleware/src/routes/<entity>.ts`)

If adding bulk delete, register the route at the top of the plugin:

```ts
registerBulkDelete(app, "/api/my-entities", "my-entities", bulkDeleteMyEntities);
```

### 6. Boot step (`packages/middleware/src/index.ts`)

After `app.listen()`, add the backfill call in the boot block (it's a temporary step — prune it once
it has run in production):

```ts
await backfillEntitySlugs();
```

---

### 7. Client hooks (`packages/client/src/hooks/use<Entity>.ts`)

Add to the existing hooks file:

- **`useEntityBySlug(slug)`** — resolves from the cached list (no new REST endpoint needed):
  ```ts
  export function useEntityBySlug(slug: string) {
    const query = useEntities();
    return { ...query, entity: (query.data ?? []).find(f => f.slug === slug) };
  }
  ```
  The returned key name must match what the workbench descriptor and `-appHeaderData.ts` destructure.

- **`useBulkDeleteEntities()`** — if needed:
  ```ts
  export function useBulkDeleteEntities() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (ids: string[]) => entitiesApi.bulkDelete(ids) as Promise<BulkDeleteResult[]>,
      onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ENTITIES_KEY }); },
      onError: (err: Error) => { notifyError(describeError(err, "Failed to delete …")); },
    });
  }
  ```
  `createCrudApi` already includes a `bulkDelete` method so `entitiesApi.bulkDelete` works without
  changes to the API layer.

### 8. View body component (`packages/client/src/components/workbench/<entity>.tsx`)

Create a `<Entity>GeneralView({ entity })` component rendering a `dl` grid (mirror
`PropertyGroupGeneralView`). This becomes the `general` field's **`view`** renderer in step 10. Typical
rows:
- Description (if set)
- Entity-specific summary (e.g. `summarizeBookmarkSearch(filter.filters)`)
- Boolean status badge
- Slug (monospace `<code>`)
- Created at (formatted date)

### 9. Edit form (`packages/client/src/components/<Entity>GeneralForm.tsx`)

Auto-save form — **no Save button**. Mirror `CategoryGeneralForm` exactly:
- `name`: TextField, save **on blur** → PATCH → navigate to new slug on success
- `description`: TextareaField, save **on blur**
- Boolean toggles: save **on change**
- Read-only "captured" fields (e.g. the filter blob): show as summary text, not an editable input

Key wiring:
```ts
import { useFieldAutoSave } from "@/hooks/useFieldAutoSave";
import { notifyFieldSaved, notifyFieldSaveError } from "@/lib/autoSave";

const autoSave = useFieldAutoSave({
  schema: entitySchema,
  update: useUpdateEntity(),
  getId: () => entity.id,
});
```

For name → slug navigation on blur:
```ts
autoSave.saveField("name", value, {
  onSuccess: (updated) => {
    if (updated.slug && updated.slug !== entity.slug) {
      void navigate({ to: "/my-entities/$entitySlug", params: { entitySlug: updated.slug } });
    }
  },
});
```

### 10. Workbench descriptor (`packages/client/src/components/workbench/<entity>.tsx`)

The descriptor is **layout-driven** (CLAUDE.md → "Entity page layouts"; see the `tabbed-pages` skill): a
field registry + a `defaultLayout`, **not** opaque `view`/`edit` panes. For a one-tab settings entity:

```tsx
type MyEntityFieldKey = "general";

const myEntityFields = {
  general: {
    key: "general",
    label: i18n.t("General"),
    view: ({ entity }) => <EntityGeneralView entity={entity} />,   // the step-8 dl
    edit: ({ entity }) => <EntityGeneralForm entity={entity} />,   // the step-9 auto-save form
  },
} satisfies Record<MyEntityFieldKey, WorkbenchField<MyEntity>>;

const MY_ENTITY_DEFAULT_LAYOUT: EntityLayout = {
  tabs: [{ key: "general", label: i18n.t("General"),
    sections: [{ key: "general", fields: ["general"] satisfies MyEntityFieldKey[] }] }],
};

export const entityWorkbench: EntityWorkbench<MyEntity> = {
  useBySlug: (slug) => {
    const { entity, isLoading } = useEntityBySlug(slug);
    return { entity, isLoading };
  },
  useById: (id) => { /* find by id in the cached list */ },
  name: e => e.name,
  useDelete: () => {
    const mut = useDeleteEntity();
    return { isPending: mut.isPending, error: mut.isError ? mut.error.message : null,
      run: (id, onDeleted) => mut.mutate(id, { onSuccess: onDeleted }) };
  },
  notFound: i18n.t("Entity not found."),
  navAriaLabel: i18n.t("Entity sections"),
  getSlug: e => e.slug,
  // listingPath: "/my-entities",   // set → a General-tab "Danger zone" Delete; omit for config entities
  layoutKind: "saved-filter",       // the entity's LAYOUTABLE_ENTITY_KINDS value (add to the tuple if new)
  fields: myEntityFields,
  defaultLayout: MY_ENTITY_DEFAULT_LAYOUT,
  tabs: [{ key: "general", label: i18n.t("General") }],  // thin: key/label/group? only, no panes
};
```

A single-field/single-tab entity drops the rail automatically. For extra tabs, add fields + a
`defaultLayout` tab each (view-only tab = a field with only `view`; group two tabs with `group` on the
thin `tabs` array). If the `layoutKind` is new, add it to `LAYOUTABLE_ENTITY_KINDS` in
`packages/types/src/entityLayouts.ts`.

### 11. Route files (`packages/client/src/routes/`)

An info-only entity's set — copy from any existing info-only entity (e.g. `autofill.*` or
`import-rules.*`). Both Info and Edit are single `?tab=` routes; there is **no `_view.*` subtree and no
per-tab `edit.<tab>.tsx` file** (the tabs derive from the descriptor):

| File | Purpose |
|---|---|
| `<area>.tsx` | Root layout — `<Outlet/>` |
| `<area>.index.tsx` | Listing — renders the manager/listing component |
| `<area>.$entitySlug.tsx` | Entity layout — `<Outlet/>` |
| `<area>.$entitySlug.index.tsx` | `beforeLoad` redirect → `…/info` |
| `<area>.$entitySlug.info.tsx` | `EntityInfoView` (vertical `?tab=` rail, header prop, `validateInfoTabSearch`) |
| `<area>.$entitySlug.edit.tsx` | Pathless `Outlet` layout |
| `<area>.$entitySlug.edit.index.tsx` | `EntityEditView` (horizontal `?tab=` strip, `validateEditTabSearch`, header) |
| `<area>.$entitySlug.edit.$.tsx` | Splat `beforeLoad` redirect: old `…/edit/<seg>` → `…/edit?tab=<seg>` |

(A **listing** entity instead uses the `_hub` route set — see the `tabbed-pages` / `add-entity`
skills.)

After creating/modifying route files, regenerate:
```
pnpm --filter=@eesimple/client routeTree
```

### 12. Upgrade the existing manager/listing component

The existing manager (e.g. `SavedFiltersManager.tsx`) stays the same component — the settings page
continues to import it. Add navigation: wrap each item's name in a `<Link>` when `entity.slug`
exists. Keep all existing controls (toggles, delete button). Don't move the component; keep the
settings page import intact.

### 13. Sidebar entry (`packages/client/src/components/app-sidebar.tsx`)

Add to `customizationItems` (or the appropriate items array):
```ts
{ key: "my-entities", title: "My Entities", to: "/my-entities", icon: SomeIcon }
```

Import the icon from `lucide-react`. Choose one not already used by another sidebar entry.

### 14. Breadcrumbs

Two edits — both are required:

**`packages/client/src/routes/-appHeader.tsx`**:
- Add `"my-entities": "My Entities"` to `LABEL_OVERRIDES` (only if the label differs from a
  title-cased slug — e.g. `"saved-filters"` title-cases to "Saved-Filters", which is wrong).
- Add to `TAXONOMY_DESCRIPTORS`:
  ```ts
  { prefix: "/my-entities", listLabel: "My Entities", singular: "My Entity", slugIndex: 1 }
  ```

**`packages/client/src/routes/-appHeaderData.ts`**:
- Import `useEntityBySlug` from its hooks file.
- Call it inside `useTaxonomyCrumbData` (the `slugFor` call uses the same prefix and slug index):
  ```ts
  const { entity } = useEntityBySlug(slugFor(pathname, pathParts, "/my-entities", 1));
  ```
- Add `"/my-entities": entity?.name` to the `taxonomyNames` return map.

The `slugFor` index must match `slugIndex` in `TAXONOMY_DESCRIPTORS`.

### 15. Settings page — no change needed

The existing settings page (e.g. `routes/settings.saved-filters.tsx`) continues to render the
same `<EntityManager />` component. No redirect, no replacement — both `/settings/my-entities`
and `/my-entities` remain valid entry points.

---

## Key differences from `add-entity`

| `add-entity` | `promote-to-entity` |
|---|---|
| Creates new DB table, service, routes, types, hooks from scratch | Extends existing table/service/routes/types/hooks |
| Slug column is part of the initial schema | Slug column is added; unique constraint needs `migrate.ts` |
| No backfill needed (no existing rows) | `backfill*Slugs()` boot step required for existing rows |
| Settings page is new (if any) | Settings page already exists; keep it, add navigation only |
| Manager component is new | Existing manager; add slug-based navigation links |

## What the edit tab should cover

If the entity's primary "create" flow lives elsewhere (e.g. filters are captured from the
bookmarks page, not typed here), the edit tab exposes **only** the metadata fields (name,
description, toggles). The "captured" blob is shown read-only (e.g. `summarizeBookmarkSearch`
summary). Don't add a UI for editing the complex payload on the edit tab — that belongs at the
capture site.

## Verification checklist

1. `pnpm push:dev` — confirms migration adds the slug column + unique constraint without prompts
2. Restart dev server — `backfill*Slugs()` runs and assigns slugs to existing rows
3. `/my-entities` listing — renders; each item name links to its detail page
4. `/my-entities/my-slug` → redirects to `…/info`; the Info page shows entity fields, slug, dates
5. Edit tab: change name, blur → toast "Name saved"; URL updates to new slug
6. Toggles on edit tab → toast fires immediately
7. Sidebar → Customization → "My Entities" link navigates correctly
8. Breadcrumb on detail page: `My Entities (link) → Entity Name`
9. `pnpm typecheck` — passes
10. `pnpm lint:fix` — clean
