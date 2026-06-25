---
name: tab-to-filtered-page
description: >-
  Consolidate a per-entity scoped tab into one central, deeplinkable filtered page in eeSimple
  Bookmarks — replace a taxonomy tab that renders an inline entity-scoped list (one "page" per
  category/website/tag/…) with a tab that navigates to a single shared page (e.g. Settings → X)
  showing all items pre-filtered to the entity you came from, with a clearable filter chip and the
  whole filter state in the URL. Use when asked to "make the X tab go to a Settings/central page
  filtered to the entity", "stop having a per-category/per-taxonomy X page", "consolidate the
  per-entity X tabs into one page", "replace a scoped tab with a link to the global X list
  pre-filtered", or "make a filtered list a deeplink". The inverse of `scope-autofill` /
  `display-rules-tab`. Mirrors the Autofill Rules → Settings → Autofill consolidation.
---

# Consolidate a scoped tab into one filtered page

Some entities (Categories, Tags, Websites, Media Types, YouTube Channels, Custom Properties) carry a
tab that renders an **inline, entity-scoped slice** of a global list — e.g. each category had an
Autofill tab at `…/categories/<slug>/autofill` showing only that category's rules. That's one
near-identical "page" per entity. This skill collapses them into **one** central page that shows the
whole list **pre-filtered** to the entity you came from, with a **clearable** chip, and with the
filter state held in **URL query params** so the view is a shareable, reload-safe deeplink.

This is the inverse of the `scope-autofill` / `display-rules-tab` skills (which *add* per-entity
scoped tabs). Reach for those to add the underlying scope filtering; reach for *this* one to
consolidate existing scoped tabs into a single page.

> **Status note.** The per-entity **Autofill Rules** and **Display Rules** tabs were moved **back to
> inline** (they now render `AutofillRulesList` / `CardDisplayRulesList` directly on the entity's
> view/edit pages via the workbench descriptor — see `scope-autofill` / `display-rules-tab`). The
> central `/autofill` and `/card-display-rules` pages and their scope deeplinks (`lib/autofillScope.ts`,
> `lib/cardDisplayScope.ts`) **remain** as the global filtered view. So this skill is no longer what
> governs those two tabs; keep it as the general technique for consolidating *other* scoped tabs into a
> deeplinkable page.

## Prerequisite

The shared list component must already accept **entity-scope filter props** (e.g.
`AutofillRulesList`'s `categoryId` / `propertyId` / `websiteId` / `tagId` / `mediaTypeId` /
`channelId`). If it doesn't, add them first — see `scope-autofill` / `display-rules-tab`.

## Steps (reference: the Autofill consolidation)

1. **URL-search module** — `lib/<feature>Scope.ts`. Define a `ScopeType` union of the entity kinds,
   a flat `…ListSearch` interface (`scope?`, `scopeSlug?`, plus the page's other filters like
   `category?` / `q?`), and a `validate…ListSearch(raw)` that drops unknown scopes, ignores an orphan
   `scopeSlug`, omits "all"/empty sentinels, and trims strings. **Carry the entity `slug`, not its
   id** — the slug is already in the route `params`, so the redirect (step 4) needs no data fetch.
   Mirror `lib/bookmarkSearch.ts`. Unit-test it (`lib/<feature>Scope.test.ts`).

2. **Lift the shared list's filter state to be controlled.** Move the in-page filter state
   (`useState` category dropdown, `useRegisterHeaderSearch()` + `useUiStore(headerSearchQuery)`
   search) **out** of the list into controlled props (`query`, `categoryFilter`,
   `onCategoryFilterChange`). Keep all the predicates/memos. Now the *route* owns the state — leave
   **view prefs** (table/grid, column count) in `uiStore`; only **filters** go in the URL. Update the
   other caller(s) of the list (e.g. the top-level `/autofill` page still feeds it from the global
   header search + local state — unchanged behavior).

3. **Central page** — add `validateSearch` to it (`routes/settings.<feature>.tsx`), read with
   `Route.useSearch()`, write with `navigate({ search: prev => ({…}), replace: true })`. A
   scope-resolver hook (`hooks/use<Feature>Scope.ts`) turns `scope` + `scopeSlug` into the matching
   list prop (`{ categoryId }`, `{ websiteId }`, …) **and** a chip label (reuse the entity list /
   `use*BySlug` hooks). Render: a **clearable scope chip** ("Filtered to <type>: <name>" with an ✕
   that clears `scope`+`scopeSlug` but keeps the other filters), a URL-bound search `<Input>`, and the
   shared list spread with `{...listProps}` + the controlled filter props.

4. **Redirect the per-entity tab routes.** Rewrite each `…<slug>._view.<tab>.tsx` /
   `…<slug>.edit.<tab>.tsx` as a `beforeLoad` redirect carrying the slug:
   ```ts
   export const Route = createFileRoute("/categories/$categorySlug/_view/autofill")({
     beforeLoad: ({ params }) => {
       throw redirect({ to: "/settings/autofill",
         search: { scope: "category", scopeSlug: params.categorySlug } });
     },
   });
   ```
   **Leave the `viewNav`/`editNav` "…" entries and `VIEW_TO_EDIT` maps untouched** — the tab link
   still points at these routes; it now redirects. Route **paths are unchanged**, so
   `routeTree.gen.ts` doesn't change (regenerate anyway: `pnpm --filter=@eesimple/client routeTree`).

5. **Remove the tab from the workbench descriptors** (`components/workbench/<entity>.tsx`): delete the
   `{ key: "<tab>", … }` object + the inline `*…View` helper + the now-unused list import. This drops
   the inline scoped view from the **right panel** too (intended — there's no per-entity page
   anymore). **Keep** any auxiliary panel that also lives in the **General** view (e.g.
   `EntityAutofillSources` / `SourceAutofillDefaults`) — only the scoped *list* goes away.

6. **Preserve "create pre-filled for this entity."** If a create flow derived its scope from the
   route path (`useParams({ strict: false })`), teach that hook to **also** read the search params
   (`useParams …slug ?? (search.scope === "<kind>" ? search.scopeSlug : undefined)`) so creating from
   the filtered page still pre-targets the entity. Reference: `hooks/useAutofillScopeDefaults.ts`.

## Gotchas

- **Carry the slug, not the id** — it's already in `params`, so `beforeLoad` stays synchronous.
- The central filter is a **clearable chip**, not a hard scope — the page must still reach *all* items.
- **Filters → URL; view prefs → `uiStore`.** Don't move table/grid/column prefs into the URL.
- Use `navigate({ …, replace: true })` for filter writes so typing search doesn't spam history.
- A `scope` present but its entity still resolving leaves the list prop `undefined` (briefly shows
  all) — fine since the lists are usually warm; show `label ?? scopeSlug` in the chip meanwhile.
- The main-pane keeps the tab (as a redirecting link) while the panel loses it; that asymmetry is
  intentional and does not violate workbench parity (parity is about *view/edit bodies*, not nav).

## Reference implementation (Autofill → Settings → Autofill)

> **Note:** Settings → Autofill has since evolved from a single `scope`/`scopeSlug` + clearable chip to
> an independent dropdown **per facet** (category / website / tag / media type / channel / property),
> combining via AND. `lib/autofillScope.ts` now holds per-facet slug params; `hooks/useAutofillScope.ts`
> exposes `useAutofillFacets`/`resolveAutofillFacets` (combined `listProps` + a `noCategory` flag);
> `components/AutofillRulesFilterBar.tsx` renders the dropdowns. The single-scope + chip pattern below is
> still the right starting point for a new consolidation — reach for multi-facet only when the page
> genuinely needs several simultaneous filters.

- `lib/autofillScope.ts` (+ `.test.ts`) — `AutofillListSearch` (per-facet slug params),
  `validateAutofillListSearch` (with legacy `scope`/`scopeSlug` migration).
- `components/AutofillRulesList.tsx` — presentation-only list driven by the resolved facet id props.
- `components/AutofillRulesFilterBar.tsx` — the text search + per-facet dropdowns (`FacetSelect`).
- `routes/autofill.index.tsx` — top-level list, unchanged behavior via header search + local state.
- `hooks/useAutofillScope.ts` — per-facet slugs → combined list props (`useAutofillFacets`).
- `routes/settings.autofill.tsx` — `validateSearch`, filter bar, URL-bound facets, resolved list.
- `hooks/useAutofillScopeDefaults.ts` — also reads the per-facet search slugs (create prefill).
- The 12 redirect routes: `categories.$categorySlug.{_view,edit}.autofill.tsx`,
  `tags.$tagSlug.{_view,edit}.autofill.tsx`,
  `taxonomies.{websites.$websiteSlug,media-types.$mediaTypeSlug,youtube-channels.$channelSlug}.{_view,edit}.autofill.tsx`,
  `custom-properties.$propertySlug.{_view,edit}.autofill.tsx`.
- The 6 workbench descriptors: `components/workbench/{category,tag,website,mediaType,youtubeChannel,property}.tsx`.

## Reference implementation (Card Display Rules → Settings → Card Display Rules)

A second, **simpler** application of this pattern (see the `display-rules-tab` skill). The shared list
(`components/CardDisplayRulesList.tsx`) **already** accepted the scope props (`categoryId`/`propertyId`/
`websiteId`/`tagId`/`mediaTypeId`/`channelId`), resolved website→domain & property→valueKind itself,
and self-seeded scoped creation — so there was **no in-page filter state to lift** and **no category /
text filter to carry**. The URL search is therefore just `{ scope?, scopeSlug? }` (no `category`/`q`),
and step 6 (create-prefill hook) is unneeded (the list seeds from its own props).

- `lib/cardDisplayScope.ts` (+ `.test.ts`) — `CardDisplayScopeType`, `CardDisplayListSearch`,
  `validateCardDisplayListSearch`.
- `hooks/useCardDisplayScope.ts` (+ `.test.ts`) — `resolveCardDisplayScope` (pure) + hook →
  `{ active, label, listProps }`, `CARD_DISPLAY_SCOPE_LABELS`.
- `routes/settings.card-display-rules.tsx` — `validateSearch`; unscoped → the drag-sortable
  `CardDisplayRulesSettings`; scoped → clearable chip + `CardDisplayRulesList {...listProps}`.
- The 12 redirect routes: `categories.$categorySlug.{_view,edit}.display-rules.tsx`,
  `tags.$tagSlug.{_view,edit}.display-rules.tsx`,
  `taxonomies.{websites.$websiteSlug,media-types.$mediaTypeSlug,youtube-channels.$channelSlug}.{_view,edit}.display-rules.tsx`,
  `custom-properties.$propertySlug.{_view,edit}.display-rules.tsx`.
- The 6 workbench descriptors: `components/workbench/{category,tag,website,mediaType,youtubeChannel,property}.tsx`.

## Verify

```
pnpm --filter=@eesimple/client routeTree   # paths unchanged; confirm clean
pnpm build
pnpm typecheck
pnpm test
pnpm lint:fix                              # always from repo root
```

Then `pnpm dev`: an entity's tab (e.g. `/categories/<slug>/autofill`) redirects to the central page
pre-filtered to it; the chip reads "Filtered to <type>: <name>" and clears to all items; the search
(`?q`) and category (`?category`) round-trip through the URL so reloading/copy-pasting reproduces the
view; "create new" from the filtered page still pre-targets the entity; the right drawer no longer
shows that tab; the top-level list still works unscoped.
