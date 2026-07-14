---
name: entity-favorites
description: Add the "favorite/starring + sidebar flyout" system to an entity in eeSimple Bookmarks — a per-entity `isFavorite` flag with a star toggle on the header strip, on the listing row, and in the CMD+K palette, whose starred members surface in a hover flyout off that entity's sidebar item. Use when asked to "let me star/favorite X", "add a favorites flyout for X", "surface starred X in the sidebar", "make X favoritable", or when adding a new slug-routed entity (the add-entity skill points here). Every piece is registry-driven and generalized — adding an entity is a handful of small sync points, not new components.
---

# Entity favorites (starring + sidebar flyouts)

Any slug-routed entity (and any custom-taxonomy **term**) can be **starred**. Starring flips a per-row
`isFavorite` flag; the entity's sidebar item grows a hover **flyout** listing its starred members, and
the star toggle appears on the header strip, the listing row, and the CMD+K palette. The plumbing is
**generalized** — there is one favorite hook, one flyout component, one header resolver, and one
palette-field constant. Adding favorites to an entity is a set of small sync points, never a new
component.

## The generic pieces (already built — reuse, don't fork)

- **`hooks/useFavoriteToggle.ts`** — `useFavoriteToggle(kind)` → `{ toggle(item: {id,name,isFavorite}) }`,
  registry-driven off `ENTITY_PALETTE_CONFIGS[kind]` (`updateFn`/`queryKey`/`extraInvalidateKeys`).
  Fires the standard Starred/Unstarred toast. `FAVORITABLE_KINDS` is the set of favoritable
  `EntityRouteKind`s (everything except the three shortcut sub-taxonomies place-type/group-type/
  location-relation). Custom-taxonomy terms are not registry kinds → use
  `useTaxonomyTermFavoriteToggle(taxonomyId)` (`hooks/useTaxonomies.ts`) instead.
- **`components/StarredFlyoutSidebarItem.tsx`** — the ONE sidebar flyout component (subsumes the old
  per-entity `*SidebarItem`s). Driven by a `SidebarFlyoutConfig` (trigger icon/label/rootTo + optional
  fixed `shortcuts` + `starred` links). With neither shortcuts nor starred it degrades to a plain link.
- **`components/useSidebarFlyoutConfigs.tsx`** — builds the `Record<sidebarItemKey, EntityFlyoutData>`
  (starred members + shortcut links) from the loaded lists. This is where a new entity's starred list is
  wired.
- **`components/HeaderFavoriteButton.tsx`** + **`hooks/useHeaderFavoriteContext.ts`** — the header star,
  resolved generically from the route (`matchEntityRoute` + the entity's list cache). No per-entity
  header wiring; any favoritable kind lights up automatically.
- **`lib/entityPaletteRegistry.ts` `starredPaletteField`** — the shared `{type:"boolean", key:"isFavorite",…}`
  palette field. `EntityCommandGroup` renders it automatically.
- **`components/StandardListingCard.tsx` `FavoriteToggleButton`** — the hover star for flat listing rows
  (via the single `renderExtra` slot); **`components/TaxonomyTreeRow.tsx`** exposes the
  `isFavorite`/`onToggleFavorite` node-callback slot pair for tree entities.

## Recipe — add favorites to a new entity

1. **DB** (`db-schema-change` skill): add `isFavorite: boolean("is_favorite").notNull().default(false)`
   to the table in `schema.ts` **and** an idempotent `migrate.ts` pre-step
   `ALTER TABLE "<t>" ADD COLUMN IF NOT EXISTS "is_favorite" boolean NOT NULL DEFAULT false` (a NOT NULL
   column even with a DEFAULT trips push's non-TTY prompt on a populated table — the pre-step keeps
   push's diff empty).
2. **Types**: add `isFavorite?: boolean` to the read interface **and** the `Update*Input` (never the
   `Create*Input`). If the update input is `type Update = Partial<Create>`, convert it to
   `interface Update extends Partial<Create> { isFavorite?: boolean }` so it stays update-only.
3. **Service**: add `isFavorite: row.isFavorite` to the `to*` mapper; add the column to any explicit
   `.select({…})` list; add `isFavorite` to the update patch (Pick+`if`, or `Partial<$inferInsert>`+`if`,
   or the entity's idiom).
4. **Route**: add `isFavorite: { type: "boolean" }` to the `additionalProperties:false` update body
   `properties`. If the update body aliases `createXBody.properties`, switch it to a spread so
   `isFavorite` stays update-only.
5. **CMD+K**: append `starredPaletteField` to the descriptor's palette `fields` (`entities/<entity>.tsx`).
6. **Listing toggle**: flat rows — `const favorite = useFavoriteToggle(kind)` + a `renderExtra` with
   `<FavoriteToggleButton isFavorite={Boolean(e.isFavorite)} name={e.name} onToggle={() => favorite.toggle({id:e.id,name:e.name,isFavorite:Boolean(e.isFavorite)})}/>` (combine via a fragment if
   `renderExtra` is already used). Tree entities — pass `isFavorite`/`onToggleFavorite` to
   `TaxonomyTreeList`. Templates: `CategoryPreviewRow.tsx` (flat), `TagTreeList.tsx` (tree).
7. **Sidebar flyout**: add the entity's key to `buildSidebarFlyoutData` in `useSidebarFlyoutConfigs.tsx`
   — `starred(list, name, icon, count?)` for its starred members (and any fixed `shortcuts`). The
   renderer links each starred member to `${item.to}/${slug}`. If the entity's list isn't already loaded
   in the sidebar data, add its `use*()` query to `useSidebarFlyoutConfigs`.

The header star needs **no** per-entity change once the kind is in `FAVORITABLE_KINDS` and its palette
config exists.

## Term-level favorites (Custom Taxonomies + Genres & Moods)

Both store entries in the shared `taxonomy_terms` table, so **one** `isFavorite` column serves both,
surfaced through `services/taxonomyTerms.ts` **and** `services/genreMoods.ts` (two mappers, two update
patches, two update route bodies). The sidebar reads all starred terms via one endpoint
`GET /api/taxonomy-terms/favorites` (`listFavoriteTaxonomyTerms`) → `useFavoriteTaxonomyTerms()`, grouped
by `taxonomyId` in `useSidebarFlyoutConfigs`. The custom-term listing toggle uses
`useTaxonomyTermFavoriteToggle(taxonomyId)`, not `useFavoriteToggle`.

## Gotchas

- Keep `isFavorite` **update-only** — never in a Create input/body/insert (the Autofill + Import Rules
  route bodies that alias `createRuleBody.properties` are the trap: spread instead).
- `StandardListingCard` has a **single `renderExtra` slot** — fragment-combine when a row already uses it
  (YouTube channels' Sparkles, Relationship Types' HideToggle).
- Generic flyout links are dynamic strings → `<Link to={to as any}>` (the pins/settings-favorites
  pattern); don't attempt typed router params in the generic component.
- The read-interface field is **optional** (`isFavorite?: boolean`) to avoid breaking construction
  sites/factories; the service mapper always sets it at runtime.
