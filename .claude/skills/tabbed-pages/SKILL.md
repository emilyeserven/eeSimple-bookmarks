---
name: tabbed-pages
description: >-
  Author or maintain a slug-routed entity's tabbed View + Edit layout in eeSimple Bookmarks — the
  field-registry + `defaultLayout` descriptor rendered by `EntityInfoView` / `EntityEditView`, plus
  the `?tab=` route files. Use when asked to "give X a tabbed layout", "add/rename/remove/reorder a
  tab on X", "make X's detail/edit pages tabbed like Categories", "split the X page into tabs", or
  "add an autofill/display-rules tab to X". Mirrors how every slug-routed entity (Categories, Custom
  Properties, Websites, Media Types, YouTube Channels, Tags, …) is laid out today.
---

# Author / maintain an entity's tabbed View + Edit layout

> **Read CLAUDE.md → "Entity page layouts" first.** Every slug-routed entity's view/edit UI is
> **layout-driven**: one `EntityWorkbench` descriptor (`components/workbench/<entity>.tsx`) carries a
> **field registry** (`fields`) + a **`defaultLayout`** (a Tab › Section › Field tree), and the two
> shared shells derive their tabs from the resolved layout:
>
> - **View / Info page** — one `…/$slug/info` route rendering `EntityInfoView`, a **vertical** tab rail
>   whose active tab is a **`?tab=<key>` search param** (e.g. `/categories/dev/info?tab=custom-properties`).
>   The rail is derived by `deriveWorkbenchTabs(workbench, layout, "view", entity)` — the view-mode-visible
>   tabs of the resolved layout — and each body is a `WorkbenchRouteTab` (`mode="view"`) →
>   `LayoutDrivenTabBody`.
> - **Edit page** — the same single-route `?tab=` shape: one `…/$slug/edit` route rendering
>   `EntityEditView`, a **horizontal** strip over `TabbedShell`, derived by `deriveWorkbenchTabs(…,
>   "edit", …)`. Consecutive tabs sharing `WorkbenchTab.group` collapse into a trailing "More" dropdown.
>   Old per-segment paths (`…/edit/general`, `…/edit/autofill`) redirect to `…/edit?tab=<tab>` via an
>   `…edit.$.tsx` splat route.
>
> **There are no `_view.*` route files, no per-tab `edit.<tab>.tsx` route files, no `createTabWrapper`,
> no `*Detail` section-body split, and no `requireDirty` per-tab submit forms** — all of that was the
> pre-layout world (#1155/#1156/#1161/#1164/#1165). A tab is a `defaultLayout` tab; a tab's content is
> the registry fields placed in its section. **Settings** (not a slug entity) is the only remaining user
> of the old `TabbedEntityLayout` path-segment shell — don't template a new entity off it.

Almost always the entity already exists and is already tabbed — so this skill is mostly **maintenance**
(add/rename/remove/reorder a tab, add a scoped Autofill/Display-Rules tab). For a brand-new entity the
`add-entity` skill points here for the descriptor + route shape. Copy whichever entity is closest:

- **Custom Properties** (`workbench/property.tsx`) — the richest: a **conditional** Options tab
  (`showIf`), plus scoped Autofill + Display-Rules tabs.
- **Categories** (`workbench/category.tsx`) — asymmetric view/edit fields (`genreMoods` edit-only,
  `autofillSources` view-only), a decomposed General, and a "Rules" **group** (Autofill + Display Rules).
- **Media Types / YouTube Channels** — the leanest: each tab is **one** composite
  field (`general` bundles the whole view+edit General), plus a view-only Hierarchy where applicable.

## The descriptor is the whole surface

`components/workbench/<entity>.tsx` exports one `EntityWorkbench<Entity>` with:

- **`fields`** — an exhaustive `Record<<Entity>FieldKey, WorkbenchField<Entity>>` (`satisfies` it so a
  key without a renderer fails `tsc`). Each `WorkbenchField` is `{ key, label, icon?, view?, edit?,
  showIf? }`. The mode picks `view`/`edit`, so **view/edit parity is by construction**: an `edit`-only
  field is invisible in view (the old edit-only "Display" tab), a `view`-only field is invisible in edit
  (the old view-only "Hierarchy" tab). A composite (a whole General form, a rules list, a conditions
  builder) is **one** field — don't decompose it unless per-field placement is actually wanted (Category
  splits General; Media Type keeps it whole).
- **`defaultLayout`** — the code-defined `EntityLayout`: one tab per section-group, one untitled section
  per tab (the default), fields in render order (`fields: ["a","b"] satisfies <Entity>FieldKey[]`).
- **`layoutKind`** — the entity's `LAYOUTABLE_ENTITY_KINDS` value (`"category"`, …).
- **a thin `tabs` array** — `{ key, label, group? }` only (no `view`/`edit` panes). It survives solely
  to carry the code-only `group` nav metadata, re-attached by tab key in `deriveWorkbenchTabs`. Give the
  same tab `key`s as `defaultLayout` so the grouping lines up.
- the plumbing: `useBySlug` / `useById`, `name`, `isBuiltIn?` / `canDelete?`, `useDelete`, `notFound`,
  `navAriaLabel`, `getSlug?`, and `listingPath?` (set it → the General **edit** tab gets a bottom
  "Danger zone" Delete, a `WorkbenchRouteTab` fixture; omit for config entities like autofill/saved
  filters).

### A field renderer returns a JSX element, never calls hooks directly

`LayoutDrivenTabBody` invokes `render({entity})` as a plain function call, so any hooks must live inside
the **returned component** (its own fiber), not in the arrow:

```tsx
// ✅ hooks live in <MyTab/>, an isolated component
myTab: { key: "myTab", label: i18n.t("My tab"), view: ({ entity }) => <MyTab entity={entity} /> },
// ❌ calling useX() directly in the arrow breaks the Rules of Hooks when the field set changes
```

## Add / rename / remove / reorder a tab (maintenance)

All descriptor-only — **no route file changes**, because the rail/strip derive from the resolved layout:

- **Add a tab**: add its field(s) to `fields`, add a `defaultLayout` tab whose section lists those field
  keys, and add a matching `{ key, label }` (with `group?`) to the thin `tabs` array if it needs the
  "More" grouping. A **view-only** tab = its field has only a `view` renderer; an **edit-only** tab =
  only `edit`. A **conditional** tab = a `showIf` on the field (the tab hides when every field in it is
  hidden — reproduces Custom Properties' Options via `hasPropertyOptions`).
- **Rename a tab**: change the `label` (and the thin-`tabs` `label`). Breadcrumbs need no work
  (`crumbLabel()` title-cases the slug; only oddities go in `LABEL_OVERRIDES`).
- **Reorder tabs / sections / fields**: reorder the arrays in `defaultLayout` (and the thin `tabs`
  array to match, so grouping stays adjacent).
- **Remove a tab**: drop its `defaultLayout` tab + its `fields` entries + its thin-`tabs` entry. A
  `resolveLayout` note: a **stored** layout that still references a removed field key silently drops it,
  and a removed tab a user hadn't customized just disappears — no migration needed.
- **Group tabs into a "More" dropdown**: give consecutive tabs the same `group: i18n.t("Rules")` on the
  thin `tabs` array (Category/Media Type do this for Autofill + Display Rules). `group` is **never**
  persisted in the layout jsonb.

**Tab drift** ("the Info rail and edit strip disagree") means a field's `view`/`edit`/`showIf` is
scoped to one mode by mistake — fix the registry entry, not one shell.

## Route files (unchanged by the layout system)

`packages/client/src/routes/` — the shape depends only on whether the entity is a **listing entity**
(bare `$slug` renders `BookmarkSearchView`) or **info-only**. Both render through `EntityInfoView` /
`EntityEditView` and validate `?tab=`:

- **Info** — `…$slug.info.tsx` (info-only) or `…$slug._hub.info.tsx` (listing): `validateSearch:
  validateInfoTabSearch`, renders `<EntityInfoView workbench={…} slug={slug} infoTo="…/$slug/info"
  params={{ <slug> }} activeTab={tab} header={…} />`. The `header` (info-only) carries the back link,
  name + badges, an **Edit** link, and (usually) a Delete button; a listing entity's `<h1>` lives in the
  `_hub` layout instead, so its info route passes no `header`.
- **Edit** — three files: `…$slug.edit.tsx` (a pathless `Outlet` layout), `…$slug.edit.index.tsx`
  (`validateSearch: validateEditTabSearch`, renders `<EntityEditView … editTo="…/$slug/edit"
  activeTab={tab} header={…} />` with a back-link + title header), and `…$slug.edit.$.tsx` (a splat
  `beforeLoad` that `redirect()`s old `…/edit/<seg>` paths to `…/edit?tab=<seg>` — copy verbatim from an
  existing entity and retarget the path/param).
- **`…$slug.index.tsx`** — a `beforeLoad` redirect to `…/info` (info-only entities).
- **Listing entities** add the `_hub` set (`…$slug._hub.tsx` = `ListingHubLayout`; `._hub.{index,gallery,
  media}.tsx` render the shared `-<entity>Listing.tsx` with an `activeView`; `._hub.info.tsx` = the Info
  page). `edit` sits **outside** `_hub`. See `routes/categories.$categorySlug.*`.

The **Edit** link on the Info page should forward the current `?tab=` so the user lands on the same tab
(`<Link to="…/edit" search={{ tab }} />`); omitting it is fine (`EntityEditView` falls back to the first
edit tab, and silently falls back when a view-only tab like Hierarchy has no edit counterpart).

`validateInfoTabSearch` / `validateEditTabSearch` (aliased) live in `lib/infoTabSearch.ts`.
`routeTree.gen.ts` is generated — run `pnpm --filter=@eesimple/client routeTree` (or rely on the Vite
plugin on `dev`/`build`).

## Entity-scoped Autofill / Display-Rules tabs

These are ordinary registry fields now — a view+edit renderer that renders the scoped list:

```tsx
autofillRules: {
  key: "autofillRules", label: i18n.t("Autofill Rules"),
  view: ({ entity }) => <AutofillRulesList categoryId={entity.id} query="" />,
  edit: ({ entity }) => <AutofillRulesList categoryId={entity.id} query="" />,
},
displayRules: {
  key: "displayRules", label: i18n.t("Display Rules"),
  view: ({ entity }) => <CardDisplayRulesList categoryId={entity.id} />,
  edit: ({ entity }) => <CardDisplayRulesList categoryId={entity.id} />,
},
```

Place each in its own `defaultLayout` tab and give the two thin-`tabs` entries `group: i18n.t("Rules")`
to collapse them into the "More" dropdown. `AutofillRulesList` takes a scope prop (`categoryId` /
`mediaTypeId` / `propertyId` / …); add a new scope prop the same way if needed (filter `scopedRules`,
hide the category filter when scoped, add a scoped empty message). See the `scope-autofill` and
`display-rules-tab` skills.

## Bookmarks are the same registry, off `ENTITY_DESCRIPTORS`

A bookmark is **id-routed**, so it doesn't use the slug-coupled `EntityInfoView`/`EntityEditView`: its
registry (`components/workbench/bookmark.tsx` + `bookmarkViewFields.tsx`) feeds `BookmarkDetailBody`/
`BookmarkDetailTabbed` (via `hooks/useBookmarkViewTabs.ts`, which drops **data-empty** view tabs) and
`BookmarkEditView`. Tab authoring is otherwise identical — `fields` + `BOOKMARK_DEFAULT_LAYOUT`. See
CLAUDE.md → "Content hierarchies → Bookmarks are layout-driven".

## Verify

```
pnpm --filter=@eesimple/client routeTree   # regenerate route tree (or rely on dev/build)
pnpm typecheck
pnpm test                                  # includes the *Layouts.test.tsx tab-order snapshots
pnpm lint:fix                              # always from repo root
```

Then run `pnpm dev` and check that the entity:
- switches Info tabs via the **vertical rail** (active tab = `?tab=`), and Edit tabs via the
  **horizontal strip**; conditional tabs appear/disappear by `showIf`; view-only tabs (Hierarchy) show
  on Info but not Edit,
- has an **Edit** link on Info that preserves the active `?tab=`; an old `…/edit/<tab>` deep link
  redirects to `…/edit?tab=<tab>`; each edit field auto-saves (no Save button; see `toast-notifications`),
- (if added) shows only the autofill/display rules scoped to the entity on those tabs.
