# Reference: moved from CLAUDE.md

These sections were moved verbatim out of the root `CLAUDE.md` when it was slimmed to an index. Mentions of "CLAUDE.md → <section>" elsewhere (code comments, other skills) refer to the sections below.

## Favorite (starring) & sidebar flyouts

Every slug-routed entity (and every custom-taxonomy **term**) can be **starred** via a per-row
`isFavorite: boolean("is_favorite").notNull().default(false)` column. Starring surfaces a star toggle on
the entity's **header strip**, its **listing row**, and the **CMD+K palette**, and its starred members
appear in a hover **flyout** off that entity's sidebar item. The whole system is **generalized** — one
hook, one flyout component, one header resolver, one palette-field constant — so adding favorites to an
entity is a handful of sync points, not new components. **See the `entity-favorites` skill for the
recipe.** The load-bearing pieces:

- **`hooks/useFavoriteToggle.ts`** — `useFavoriteToggle(kind)` → `{ toggle(item) }`, registry-driven off
  `ENTITY_PALETTE_CONFIGS[kind]` (`updateFn`/`queryKey`/`extraInvalidateKeys`) with the standard
  Starred/Unstarred toast. `FAVORITABLE_KINDS` (in `lib/favoriteEntityConfig.ts`) is the
  favoritable-kind set (all except the shortcut
  sub-taxonomies place-type/group-type/location-relation). Custom-taxonomy **terms** aren't registry
  kinds → `useTaxonomyTermFavoriteToggle(taxonomyId)` (`hooks/useTaxonomies.ts`).
- **`components/StarredFlyoutSidebarItem.tsx`** — the single sidebar flyout (subsumed the old per-entity
  `Categories/Tags/Groups/Languages/Locations SidebarItem`s). A `SidebarFlyoutConfig` carries the trigger
  + optional fixed `shortcuts` (sub-taxonomy links like Group Types) + `starred` links; with neither it
  degrades to a plain link. Every taxonomy/customization sidebar item + every custom taxonomy
  (`taxonomy:${id}`) now renders through it via `ExpandableLinkSection.renderItem`.
- **`components/useSidebarFlyoutConfigs.tsx`** — builds the `Record<sidebarItemKey, EntityFlyoutData>`
  from the loaded lists (filter `isFavorite` → map to flyout entries linked to `${item.to}/${slug}`).
  Adding an entity's starred list is one entry in `buildSidebarFlyoutData`.
- **`components/HeaderFavoriteButton.tsx`** + **`hooks/useHeaderFavoriteContext.ts`** — the header star,
  resolved generically from the route (`matchEntityRoute` + the entity's list-query cache); any
  favoritable kind lights up with **no** per-entity header wiring (replaced the old 2-branch
  `resolveFavoriteContext`).
- **`lib/starredPaletteField.ts` `starredPaletteField`** — the shared palette field appended to each
  descriptor's `fields`; `EntityCommandGroup` renders it automatically.
- **Listing toggles:** flat rows use `FavoriteToggleButton` (`StandardListingCard`) via `renderExtra`
  (fragment-combine if occupied); tree entities use the `isFavorite`/`onToggleFavorite` slot pair on
  `TaxonomyTreeRow`. Templates: `CategoryPreviewRow.tsx` (flat), `TagTreeList.tsx` (tree).

**Term-level favorites** (Custom Taxonomies + Genres & Moods): one `taxonomy_terms.isFavorite` column,
surfaced through **both** `services/taxonomyTerms.ts` and `services/genreMoods.ts`; the sidebar reads all
starred terms via `GET /api/taxonomy-terms/favorites` (`listFavoriteTaxonomyTerms` →
`useFavoriteTaxonomyTerms()`), grouped by `taxonomyId`. Terms light **all three** starring
surfaces: the listing-row toggle (`TaxonomyTermTreeList` via `useTaxonomyTermFavoriteToggle`), the
header star (a `"taxonomy-term"` entry in `FAVORITE_ENTITY_CONFIGS`, resolved by
`useTaxonomyTermPageContext`), and the CMD+K **"Current Term"** group (star / New sub-term / Edit
in `CommandPaletteDefaultView.tsx`). **`isFavorite` is update-only** — never in a
Create input/body/insert (the Autofill/Import-Rules route bodies that alias `createRuleBody.properties`
must spread instead), and the read-interface field is **optional** (the mapper always sets it) to avoid
breaking construction sites.

## Settings page starring

**Every settings sub-page must be favoritable — and registration is now derived, not hand-listed.**
The header star button, the sidebar Settings favorites flyout, and the persisted favorite
(`favorite_settings_pages` table / `FavoriteSettingsPage`) all key off one registry:
`SETTINGS_PAGES` in `packages/client/src/lib/settingsPages.ts` (`{ path, label, icon }`, resolved by
exact pathname via `findSettingsPage()`). A page not in this list silently gets no star button —
`useSettingsFavorite` and `HeaderSettingsFavoriteButton` only render once `findSettingsPage(pathname)`
returns a match (wired through `ctx.settingsPage` in `routes/-appHeaderToolbar.ts` →
`settingsFavoriteAction` in `components/header/toolbarEntityActions.tsx`). The registry **derives**
from the two nav data modules, so favoritability comes for free:
- A **new tab inside a tabbed settings section** (Display/Automations/Locations/Advanced): add it to
  the section's nav array in `lib/settingsNav.ts` with a `lucide-react` `icon` distinct from its
  siblings — the label derives as `"Section: Tab"`. Section index/parent paths are intentionally
  never registered (they redirect to their first tab and can't be the live pathname).
- A **management/customization listing page** (Categories, Tags, Websites, People, Saved Filters, …):
  its sidebar entry in `lib/sidebarNavItems.ts` *is* the registration (`SIDEBAR_LABEL_OVERRIDES` in
  `settingsPages.ts` covers a label that must differ from the sidebar title, e.g. newsletters).
- Only a page on **neither surface** (e.g. `/settings/extension`, `/taxonomies/place-types`) goes in
  the hand-listed `STANDALONE_PAGES` remainder in `settingsPages.ts`.
A `/settings/*` alias that merely mirrors a canonical page **redirects**
(mirroring `settings.saved-filters.tsx`) instead of rendering a second live copy.
`settingsPages.test.ts` asserts the derivation (every sidebar item / settings tab resolves) — extend
it only for standalone pages — **and walks the route tree**, failing if any live (non-redirect)
`/settings/**` or `/taxonomies/**` leaf doesn't resolve via `findSettingsPage`, so a new page can no
longer ship silently unstarrable. The CMD+K palette's Pages/Taxonomies/Settings nav groups derive from
the same modules (`CommandPaletteNavGroups.tsx`), so they also pick the page up automatically.
