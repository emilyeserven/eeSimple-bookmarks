---
name: tabbed-pages
description: >-
  Convert a slug-routed entity's single detail/edit pages into the tabbed View + Edit layout used by
  Categories and Settings, optionally adding an entity-scoped Autofill Rules tab. Use when asked to
  "give X a tabbed layout", "make X's detail/edit pages tabbed like Categories/Settings", "split the X
  page into tabs", or "add an autofill tab to X". Mirrors how Custom Properties / Websites / Media
  Types / YouTube Channels / Categories / Tags / Property Groups view and edit pages were tabbed.
  Also covers maintaining tabs — "add/rename/remove a tab on X", "reorder X's tabs".
---

# Convert detail/edit pages to a tabbed layout

> **Read first — the tab bodies come from a shared `EntityWorkbench` descriptor.** Every slug-routed
> entity's tabs (view + edit bodies, titles, descriptions) live in one
> `components/workbench/<entity>.tsx` descriptor (typed by `workbench/types.ts`). Since the routing
> refactor there are **two surfaces**, both deriving from that one descriptor:
>
> - **View / Info page** — a **single** `…/$slug/info` route rendering `components/workbench/EntityInfoView.tsx`,
>   a **vertical** tab rail whose active tab is a **`?tab=<key>` search param** (e.g.
>   `/categories/dev/info?tab=tiered-tags`). The rail is *derived* from `workbench.tabs` (those with a
>   `view` pane, honoring `showIf`); each body is a `WorkbenchRouteTab` (`mode="view"`). **There are no
>   `_view.tsx` / `_view.<tab>.tsx` route files** — that whole pathless subtree and the `viewNav` array
>   are gone. A view-only tab (e.g. Hierarchy) is just a `view`-only `WorkbenchTab` in the descriptor.
> - **Edit pages** — the horizontal `TabbedEntityLayout` + real path-segment
>   `…/$slug/edit/<tab>` route files, each a one-line `WorkbenchRouteTab` (`mode="edit"`).
>
> The per-entity `createTabWrapper` / `<Entity>TabWrapper` pattern below is **superseded** for new
> tabbed entities — only `BookmarkEditTabWrapper` still uses it. Prefer a descriptor; the wrapper
> approach is documented for historical context.

Settings and the entity **edit** pages render a **horizontal scrolling tab strip** above an
`<Outlet/>`; each edit tab is its own file-based route. The **View/Info** page instead renders a
**vertical** rail beside the active tab body, selected by `?tab=`. This skill restructures an entity
that currently has one long detail page and one long edit form into that shape. The edit shell is
`TabbedShell` — a horizontal, horizontally-scrollable tab strip (`navStripClass`) on **every** surface
(full-width edit page and phone); the old wide-screen vertical-sidebar mode was
removed in #578. Copy whichever entity is closest:

- **Custom Properties** — the most complete (read-only View *and* Edit, a **conditional** tab, plus a
  scoped Autofill tab).
- **Websites** — multiple non-trivial tabs (General / Shortened Links / Param Rules).
- **Media Types / YouTube Channels / Property Groups** — the leanest General-only edit forms (a
  single tab inside the full shell).
- **Tags** — the leanest View side, and the example of when to **skip** the per-entity wrapper.

## Shared primitives (already exist — reuse them)

In `packages/client/src/components/`:

- **`workbench/EntityInfoView`** — the **View/Info** page shell. Renders a **vertical** tab rail
  (derived from `workbench.tabs` with a `view` pane, honoring `showIf`) beside the active tab's
  `WorkbenchRouteTab` body. Driven by the `?tab=` search param (`lib/infoTabSearch.ts` →
  `validateInfoTabSearch`); falls back to the first tab when absent/invalid; drops the rail for a
  single-tab entity. You give it the `workbench`, the `slug`, the `infoTo` template, `params`, the
  `activeTab` (`?tab=`), and an optional `header`:
  ```tsx
  <EntityInfoView
    workbench={propertyWorkbench}
    slug={propertySlug}
    infoTo="/custom-properties/$propertySlug/info"
    params={{ propertySlug }}
    activeTab={tab}                     // from Route.useSearch()
    header={(/* back link + title/badges + Edit link + Delete */)}
  />
  ```
- **`TabbedEntityLayout`** (+ exported `navLinkClass`) — the **edit** layout shell (`edit.tsx`).
  It renders the `header`, a horizontal scrolling tab `<nav>` strip (`navStripClass`), and the
  `<Outlet/>`. You give it the nav **declaratively**, not as JSX:
  ```tsx
  <TabbedEntityLayout
    header={(/* back-to-view link + description */)}
    nav={editNav}                       // readonly TabNavItem[] = { to, label }[]
    params={{ websiteSlug }}            // route params shared by every nav link
    navAriaLabel="Website sections"
  />
  ```
- **`ListingHubLayout`** — only for **listing entities** (those whose bare `$slug` renders
  `BookmarkSearchView`). The pathless `_hub` layout that renders the entity `<h1>` header over a
  horizontal strip of real path segments — `Bookmarks | Gallery | Media | Info` — and the active child
  via `<Outlet/>`. See the **listing entities** note at the end of the route-files step.
- **`TabWrapper`** — a single tab's shell: handles loading / not-found and renders a `title` + muted
  `description` header above `children(entity)`.
- **`createTabWrapper(slugParam, useEntityBySlug, selectEntity, notFoundMessage)`** — builds an
  entity-specific tab wrapper from its by-slug hook so each tab route stays one JSX element. The
  existing one-line wrappers (`WebsiteTabWrapper`, `PropertyTabWrapper`, `CategoryEditTabWrapper`,
  `MediaTypeTabWrapper`, `YouTubeChannelTabWrapper`) are the template.

Work front-to-back: extract shared pieces from the existing `*Detail` / `*Form`, then add the routes.
Decide the tab list from the entity's existing sections (e.g. property → General / Options /
Categories / Display / Autofill). A tab may be **conditional** (Custom Properties hides "Options" for
boolean — see `hasPropertyOptions` in `lib/propertyForm.ts`).

## Checklist

### 1. Per-entity tab wrapper (`packages/client/src/components/<Entity>TabWrapper.tsx`)
One line via the factory — it keeps the consumer-facing prop name entity-specific so tab routes read
naturally:
```tsx
export const WebsiteTabWrapper = createTabWrapper(
  "websiteSlug", useWebsiteBySlug, result => result.website, "Website not found.",
);
```
Pass the hook **by reference** (not wrapped in an arrow) so `react-hooks/rules-of-hooks` stays happy;
`selectEntity` is the plain picker for the hook's entity key (`r => r.website`).

- **Exception — skip the wrapper, go inline:** when a tab body needs more than the entity itself, call
  `useXBySlug` + render `<TabWrapper>` directly in that tab route instead. Tags does this because its
  General tab needs the full tree (`data`) to resolve the parent name.

### 2. Split the read-only `*Detail` into section bodies
Export each section's **body** (no `LabeledSection`/title wrapper) from the existing `*Detail`, e.g.
`PropertyGeneralFields`, `PropertyOptionsFields`, `PropertyCategoriesContent`, `PropertyDisplayFields`
in `PropertyDetail.tsx` (or `CategoryGeneralFields` in `CategoryPreviewCard.tsx`). The whole `*Detail`
recomposes them under `LabeledSection` + `Separator`, while each view-tab route renders one bare body
inside the wrapper.
- **Gotcha:** `react-refresh/only-export-components` — a file that exports components must not also
  export plain functions. Put helpers like `hasPropertyOptions` in a `lib/*.ts`. (Where a file
  genuinely must mix the two — as `lib/form.tsx` and `TabWrapper.tsx` do — add a file-level
  `/* eslint-disable react-refresh/only-export-components */` with a comment, but prefer splitting.)

### 3. Extract shared form pieces from `*Form`
Move reusable subcomponents (e.g. `CategoryCheckboxList`, `OperandCheckboxList` →
`PropertyFormFields.tsx`) and pure helpers/constants/zod bits (`toggleId`, `summarize*`, option
arrays → `lib/propertyForm.ts`). The **whole `*Form` stays** for the create page and re-imports them.

### 4. Per-tab edit forms (`packages/client/src/components/<Entity><Tab>Form.tsx`)
Each tab is an **independent** `useAppForm` that saves a **partial** update via
`useUpdate<Entity>().mutate({ id, input })` — copy `WebsiteGeneralForm` / `CategoryGeneralForm` /
`PropertyGeneralForm`. The update input is already `Partial<…>`, so a tab persists only its own fields.
Gate the save button with **`requireDirty`** on the shared `SubmitButton`:
```tsx
<form.AppForm>
  <form.SubmitButton label="Save changes" size="sm" requireDirty />
</form.AppForm>
```
`requireDirty` disables the button while the form is at its default values (non-persistent dirty, via
the form's `isDefaultValue` state) — don't hand-roll a `Subscribe`-to-values comparison. If a rename
can change the slug, navigate to the returned `updated.slug` in `onSuccess` (see `PropertyGeneralForm`).
Forms whose dirty state isn't field-based (e.g. `WebsiteParamRulesForm` / `WebsiteShortenedLinksForm`
manage draft `useState` + a JSON-compare) keep their own local check.

### 5. Route files (`packages/client/src/routes/`)

**View side — one route, tabs come from the workbench.** There is **no** `_view.tsx` /
`_view.<tab>.tsx` subtree and **no** `viewNav` array. The vertical Info rail is derived from the
descriptor by `EntityInfoView`, so **adding/renaming/removing a view tab is a change to the
`*Workbench` descriptor only** — no route file per tab. The only view route file is:

- `<entity>.$<slug>.index.tsx` — a `beforeLoad` **redirect** to `…/info` (was `…/general`).
- `<entity>.$<slug>.info.tsx` — validates `?tab=` with `validateInfoTabSearch` and renders
  `<EntityInfoView workbench={…} slug={slug} infoTo="…/$slug/info" params={{ <slug> }} activeTab={tab}
  header={…} />`. The `header` carries the back link, name + badges, an **Edit** link, and (usually) a
  Delete button — see `routes/custom-properties.$propertySlug.info.tsx` as the reference.

  The **Edit** link should navigate to the edit tab matching the current `?tab=`. Keep a module-scope
  `VIEW_TO_EDIT` map keyed by tab key → edit route, and resolve it from `?tab=` (`Route.useSearch()`),
  falling back to `general` for a view-only tab with no edit counterpart (e.g. Tags' `hierarchy`):

  ```tsx
  // module scope — quote ALL keys when any key contains a hyphen (quote-props rule):
  const VIEW_TO_EDIT = {
    "general": "/custom-properties/$propertySlug/edit/general",
    "options": "/custom-properties/$propertySlug/edit/options",
    "display-rules": "/custom-properties/$propertySlug/edit/display-rules",
  } as const;
  type PropertyEditRoute = typeof VIEW_TO_EDIT[keyof typeof VIEW_TO_EDIT];

  // inside the component:
  const { tab } = Route.useSearch();
  const editRoute: PropertyEditRoute =
    (VIEW_TO_EDIT[(tab ?? "general") as keyof typeof VIEW_TO_EDIT]
      ?? VIEW_TO_EDIT.general) as PropertyEditRoute;

  <Button asChild variant="outline" size="sm">
    <Link to={editRoute} params={{ propertySlug }}>Edit</Link>
  </Button>
  ```

  **Styling gotcha:** `@stylistic/quote-props` enforces *consistent* quoting within an object.
  If any key requires quotes (hyphen in the name), *all* keys must be quoted. Always run
  `pnpm lint:fix` from the repo root after adding the map.

  **Hierarchy tab** (view-only): a taxonomy with a `parentId` tree (Tags, Media Types, Locations,
  Genres & Moods) gets a `view`-only `WorkbenchTab` (see CLAUDE.md → Content hierarchies → Hierarchy
  tab rule) — it appears in the vertical Info rail automatically and is simply absent from
  `VIEW_TO_EDIT` so Edit falls back to General. **Websites are the sanctioned derived-tree
  exception** — no `parentId` column, but their Hierarchy tab renders the domain/subdomain tree
  derived by `useWebsiteTree` (`websiteHierarchyView.tsx`). Don't add a Hierarchy tab to a genuinely
  flat taxonomy.

**Edit side — unchanged** (real path-segment routes, mirror the tabs):
- `<entity>.$<slug>.edit.tsx` — edit layout (back-to-view link + description, `editNav`,
  `TabbedEntityLayout`).
- `<entity>.$<slug>.edit.index.tsx` — redirect to `…/edit/general`.
- `<entity>.$<slug>.edit.<tab>.tsx` — one per tab; a one-line `WorkbenchRouteTab` (`mode="edit"`).

**Listing entities** (those whose bare `$slug` renders `BookmarkSearchView` — Categories, Tags,
Websites, Media Types, YouTube Channels, Genres & Moods, Languages, Locations, People, Groups, and the
Plex/media taxonomies) wrap the listing panes and the Info page in a pathless **`_hub`** layout using
`ListingHubLayout`, so the `Bookmarks | Gallery | Media | Info` strip + header show on every listing
view but never on `edit` (which stays outside `_hub`). The route set is:
- `<entity>.$<slug>._hub.tsx` — the `ListingHubLayout` shell (header + the four tabs).
- `<entity>.$<slug>._hub.{index,gallery,media}.tsx` — the three listing panes; each renders the shared
  `routes/-<entity>Listing.tsx` body with an `activeView` prop (`"bookmarks"|"gallery"|"media"`).
- `<entity>.$<slug>._hub.info.tsx` — the Info page (`EntityInfoView`, `infoTo="…/$slug/info"` — the
  pathless `_hub` strips from the URL).

`BookmarkSearchView` gained a controlled `activeView?: "bookmarks"|"gallery"|"media"` prop and its
`header` is now optional (the `_hub` layout owns the entity `<h1>`). Reference:
`routes/categories.$categorySlug._hub*.tsx` + `routes/-categoryListing.tsx`.

`routeTree.gen.ts` is generated — do not hand-edit. Run
`pnpm --filter=@eesimple/client routeTree` (or rely on the Vite plugin on `dev`/`build`).

### 6. Optional: entity-scoped Autofill tab
`AutofillRulesList` takes a scope prop — `categoryId` (rules that set that category) or `propertyId`
(rules that set a value for that property, via its number/boolean/dateTime value arrays). Add a new
scope prop the same way if needed: filter `scopedRules`, hide the category filter when scoped, and add
a scoped empty message. Render `<AutofillRulesList <scope>={entity.id} />` inside the wrapper on both
the view and edit autofill tabs.
- **Gotcha:** a property value on a *new* rule is gated by the rule's selected category
  (`categoryProps` in `AutofillRuleForm.tsx`), so there's no coherent default to prefill from a
  property with no category — the "New Autofill Rule" button just opens the standard create form.

## Verify

```
pnpm --filter=@eesimple/client routeTree   # regenerate route tree (or rely on dev/build)
pnpm typecheck
pnpm test
pnpm lint:fix                              # always from repo root
```

Then run `pnpm dev` and check that the entity:
- redirects `/<entity>/<slug>` to `…/info` (info-only entities) or renders the `_hub` Bookmarks pane
  (listing entities), and switches Info tabs via the **vertical rail** — the active tab is the `?tab=`
  search param and conditional tabs appear/disappear by type,
- has an **Edit** link on the Info page that preserves the active `?tab=` (e.g. clicking Edit from the
  "Options" tab lands on the edit "Options" tab, not "General"); tabs without an edit counterpart fall
  back to "General"; each edit tab saves independently and the tab reloads correctly, and
- (if added) shows only the autofill rules scoped to the entity on its Autofill tab.
```

## Maintaining an existing tabbed entity

- **Add / rename / remove a tab in one place**: the entity's `EntityWorkbench` descriptor
  (`components/workbench/<entity>.tsx`) — the Info rail (`EntityInfoView`) and the edit routes
  (`WorkbenchRouteTab`) both derive from it. Adding a
  **view** tab is descriptor-only (it appears in the vertical Info rail automatically — no route
  file). Adding an **edit** tab also needs its `edit.<tab>.tsx` route + `editNav`/`VIEW_TO_EDIT`
  entries. A rename needs no breadcrumb work (`crumbLabel()` title-cases the slug; only oddities go in
  `LABEL_OVERRIDES`).
- **Removing a tab**: for a view tab, just drop it from the descriptor; for an edit tab, also delete
  its `edit.<tab>.tsx` route file and its `editNav`/`VIEW_TO_EDIT` entries. A view-only tab (e.g.
  Hierarchy) must never appear in `VIEW_TO_EDIT`.
- **Tab drift** ("the Info rail and edit tabs show a different tab set") means someone bypassed the
  descriptor — fold the stray tab back into it rather than patching one surface.
