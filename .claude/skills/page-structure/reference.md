# Reference: moved from CLAUDE.md

These sections were moved verbatim out of the root `CLAUDE.md` when it was slimmed to an index. Mentions of "CLAUDE.md → <section>" elsewhere (code comments, other skills) refer to the sections below.

## Page-header breadcrumbs

The top app-bar breadcrumb trail is built in **one place** —
`packages/client/src/routes/-appHeaderCrumbs.tsx` (`breadcrumbsForPath()` + its helpers, consumed by
`-appHeader.tsx`). It derives crumbs
from the **pathname** and enriches them with real entity names resolved via `use*BySlug` hooks. Don't
render a page-specific breadcrumb anywhere else; route components only set their own `<h1>`/`<h2>`
title (see **Content hierarchies**), never a header crumb.

- **Shape:** `List → [ancestors…] → Name → [Section]`. Every crumb except the last is a `<Link>`
  (`BreadcrumbLink asChild`); the last is the current page (`BreadcrumbPage`, non-link).
- **Listing page** → one non-link crumb (`Categories`, `Bookmarks`, …). **Detail / `info` page** →
  `List(link) → Name` (the info page's inner tabs are a `?tab=` param and stay out of the trail).
  **Edit tab** → `List(link) → Name(link → that entity's `…/info` view) → Section`. No bare `Edit`
  leaf when the entity has tabs — end on the tab's label.
- **Name resolves the real entity name** via the entity's `use*BySlug` hook — never a generic
  singular. The descriptor's `singular` is only a brief loading placeholder.
- **Most slug-routed entities share one builder.** Categories, Websites, Media Types, YouTube
  Channels, Custom Properties, and Autofill are all driven by `TAXONOMY_DESCRIPTORS`
  + `taxonomyCrumbs()`. Only **Tags** (ancestor chain), **Bookmarks** (category + title), and
  **Settings** stay bespoke.
- **Segment labels** come from the single `crumbLabel()` helper — a small `LABEL_OVERRIDES` map (only
  where the label differs from a title-cased slug, e.g. `youtube-channels → "YouTube Channels"`,
  `autofill → "Autofill Rules"`) unioned with a title-case humanizer (`shortened-links → "Shortened
  Links"`). Don't reintroduce per-section label maps; new tabs get a correct label for free.
- **Adding a new slug-routed entity** (see the **`add-entity`** skill) means **both**: add its
  `TAXONOMY_DESCRIPTORS` entry **and** resolve its name in `AppHeader` (a `use*BySlug` call feeding
  the `taxonomyNames` map). Skipping either falls through to the generic `"eeSimple Bookmarks"`
  fallback or shows the `singular` placeholder forever.

## Content hierarchies

The client lays out page and panel content with a small, fixed set of hierarchies. Pick the one
that matches the surface — don't invent a new structure for a one-off page.

- **Flat `LabeledSection` stack** (`packages/client/src/components/LabeledSection.tsx`) — the
  default for detail/edit page content. A small heading + optional muted description sits in a left
  column (`md:col-span-1`, ~1/5) with its content on the right (`md:col-span-4`, ~4/5), stacking on
  narrow screens. Stack instances in a `space-y-6` container and divide them with `<Separator />`
  (`@/components/ui/separator`). **Don't wrap a detail/edit page's content in a card box**
  (`rounded-lg border bg-card`, shadcn `<Card>`) — the stack is the box. Refs:
  `AutofillRuleDetail`/`AutofillRuleForm`, the Website view/edit pages, `BookmarkDetail`,
  `PropertyDetail`.
- **Collapsible / accordion section** (`packages/client/src/components/CollapsibleFormSection.tsx`)
  — a trigger showing the title plus a one-line preview (hidden when open) and a rotating chevron,
  expanding to its full fields. Reach for it **only** when a section is long or optional and
  benefits from collapsing (e.g. autofill activation conditions, property options). Refs:
  `AutofillRuleForm`, `PropertyForm`, `HomepageSectionForm`.
- **Info page = vertical `?tab=` rail** (`packages/client/src/components/workbench/EntityInfoView.tsx`) —
  a slug-routed entity's read-only **Info** page (`…/$slug/info`, e.g. `/categories/dev/info`) is a
  **vertical** tab rail beside the active tab's body, and the active tab is a **`?tab=<key>` search
  param** (`/categories/dev/info?tab=custom-properties`), *not* a path segment. The rail is **derived from the
  entity's resolved layout** — `deriveWorkbenchTabs(workbench, layout, "view", entity)`, which returns the
  view-mode-visible tabs of the resolved `EntityLayout` (see **Entity page layouts**) — and each tab body
  is rendered by the shared `workbench/WorkbenchRouteTab.tsx` (`mode="view"`) → `LayoutDrivenTabBody`, so
  it is the same body the old per-segment `_view.*` routes rendered. The `?tab=` param is validated by
  `validateInfoTabSearch` (`lib/infoTabSearch.ts`). A single-tab entity drops the rail. **There are no
  more `_view` layout routes or per-tab `_view.*` route files** — one `…$slug.info.tsx` (or
  `…$slug._hub.info.tsx` for listing entities) route per entity replaces the whole `_view` subtree.
- **Edit page = horizontal `?tab=` strip** (`packages/client/src/components/workbench/EntityEditView.tsx`,
  over the shared **`TabbedShell.tsx`** + `navLinkClass` + `navStripClass`) — the edit-mode mirror of the
  Info rail: a `header` over a horizontal tab `nav` strip and a `min-w-0` content pane, where the active
  tab is the **`?tab=<key>` search param** (`…/$slug/edit?tab=display`, validated by `validateEditTabSearch`),
  **not** a path segment. There is a **single `…/$slug/edit` route** per entity, not one route file per
  tab. The strip is derived from the resolved layout — `deriveWorkbenchTabs(workbench, layout, "edit",
  entity)` — and each tab body is the same `workbench/WorkbenchRouteTab.tsx` (`mode="edit"`) →
  `LayoutDrivenTabBody` the Info rail uses, so one descriptor drives every surface; each tab body is itself
  a flat `LabeledSection` stack. Consecutive tabs sharing a `WorkbenchTab.group` collapse into a trailing
  **"More" dropdown** (`EntityEditView`'s `groupEditTabs`). The strip (`navStripClass`:
  `flex items-center gap-1 overflow-x-auto border-b pb-1`) scrolls horizontally when the tabs overflow, so
  the same component serves the page and mobile.
  - **`TabbedEntityLayout.tsx`** — the older path-segment-tab shell — is now used **only** by the
    **Settings** page (`routes/settings.tsx`); slug-routed entity edit moved off it to the `?tab=`
    `EntityEditView` above (bookmarks use `TabbedShell` directly via `BookmarkEditView`). Don't reach for
    `TabbedEntityLayout` on an entity. (`VerticalTabbedLayout` is the sanctioned **settings-section**
    pattern — the tabbed Display/Automations/Locations/Advanced sections render through it; never use it
    for a slug-routed entity's edit tabs.)
  - **Hierarchy tab rule:** every taxonomy whose schema row has a `parentId` tree — currently
    **Tags**, **Media Types**, **Locations**, and **Genres & Moods** — gets a view-only **"Hierarchy"**
    workbench tab (a "Parents" ancestor chain + a "Children" subtree). It is a `view`-only
    `WorkbenchTab` in the entity's `*Workbench` descriptor (so it shows on the Info rail but not on Edit),
    resolves the node *with children* from the `use*Tree()` query (not the flat `use*BySlug`), reuses the
    generic `findAncestorPath`/`flattenTree` from `lib/tagTree.ts`, and renders the entity's `*TreeList`.
    The shared **`HierarchyView`** component (`components/HierarchyView.tsx`) renders the "Parents" +
    "Children" body, and the **`useExpandedSet`** hook (`hooks/useExpandedSet.ts`) tracks expanded
    nodes — a new tree taxonomy passes its `ancestors`, a `renderAncestorLink`, and its `*TreeList`
    rather than re-implementing the markup. **Websites are the sanctioned derived-tree exception**:
    no `parentId` column, but their Hierarchy tab renders the domain/subdomain tree derived by
    `useWebsiteTree` (`websiteHierarchyView.tsx`) — a *derived* tree is legitimate for a view-only
    Hierarchy tab when a real containment relation exists in the data. Genuinely flat taxonomies
    (Categories, YouTube Channels) do **not** get one.
- **Entity-scoped bookmarks page + the `_hub` listing strip** — an entity whose bookmarks can be
  meaningfully listed (Categories, Tags, Websites, Media Types, YouTube Channels, Genres & Moods,
  Languages, Locations, Media Properties, the seven media taxonomies, People, Groups) gets a **pathless
  `_hub` layout** (`…$slug._hub.tsx` → `components/ListingHubLayout.tsx`) that renders the entity `<h1>`
  header over a **horizontal outer strip of real URL path segments**: **Bookmarks** (`…/$slug`, exact
  match), **Gallery** (`…/$slug/gallery`), and **Info** (`…/$slug/info`).
  The first two are `BookmarkSearchView` panes sharing the filter sidebar — selected by the
  `activeView` prop passed from each `_hub.{index,gallery}.tsx` route — and **Info** navigates to
  the vertical `EntityInfoView`. `edit` sits **outside** `_hub` (a sibling of the pathless layout) so
  the strip never shows while editing. Each entity's listing body is a shared `routes/-<entity>Listing.tsx`
  component the pane routes render with their own `activeView`; it resolves the entity by slug,
  filters bookmarks by its id/relation, and passes `pageKey`/filter props to `BookmarkSearchView` with
  **no `header`** (the `<h1>` lives in `_hub`). **Do not redirect to `/bookmarks?<filter>=…`** — that
  loses the entity context and breaks deep-linking. Reference: `routes/categories.$categorySlug._hub.tsx`
  + `._hub.index.tsx` + `-categoryListing.tsx`. **The header shows an Edit (pencil) icon, not an Info
  icon** — Info is now a listing tab, so `viewDetailsAction`/`taxonomyViewLink` were removed;
  `taxonomyEditLink` (`components/header/toolbarActionTypes.tsx`) renders the Edit button on the bare
  listing + its gallery/info tabs, **derived from `ENTITY_ROUTES` via `matchEntityRoute`** (every
  slug-routed kind gets it with zero per-entity code; custom-taxonomy term pages are the one special
  case). Don't reintroduce a per-entity switch there. The `_hub` header is the `<h1>` title plus any entity-specific chrome (the tree entities'
  sub-items chip row: Tags' "Sub-tags:", Locations' "Sub-locations:", and Languages' clearable
  `?usageLevel=` badge). **Newsletters** are the bespoke listing entity — their `_hub` strip is
  `Issues | Info` (the "listing" is the import-group issues list, not bookmarks).
- **Card boxes** — three documented uses of the card token, never for detail/edit page content:
  - **List/row cards**: use `<RowCard>` from `@/components/ui/card` (renders `rounded-lg border
    bg-card`). Pass padding (`p-4`) or layout utilities (`group relative`) via `className`. Used in
    `WebsiteManager`, `MediaTypeManager`, `YouTubeChannelManager`,
    `CategoryPreviewCard` (row variant), `BookmarkSearchView`, `HomepageSectionBlock`,
    `CustomPropertyManager`, `AutofillRulesList`.
  - **Settings panels**: use the shadcn `<Card>` with `<CardHeader>`, `<CardContent>`, etc.
    (`DisplaySettings`, `AutomationsSettings`, `LinkParsingSettings`,
    `HomepageSectionsSettings`).
  - **Drag-chip rows**: the compact `rounded-md border bg-card` token for sortable chips/rows
    (`SortableFilterRow`, `HomepageWidgetOrderList`, the card-field-zone `FieldChip`) — keep the
    exact class string. (One sanctioned `RowCard` hold-out: a semantic `<li>` list row may
    hand-roll the `rounded-lg` token until `RowCard` grows `asChild` — see
    `NotificationsBellPopover`; a collapse-trigger `<button>`'s chrome is not a card use at all.)

  The hand-rolled "← Back to X" link, inline `"Loading…"` text, muted empty-state `<p>`, and
  "X not found" fallbacks are the current consistent micro-idioms — reuse the existing class
  strings/wording verbatim rather than inventing variants; promoting them to shared primitives
  (`BackLink`/`EmptyState`/skeletons) is an open follow-up, not something to do piecemeal.
- **Entity view/edit = the `EntityWorkbench` descriptor** (the URL-driven right drawer/panel was
  removed in issue #1108 — there is no more `components/panel/`, `drawerSearch`, `dOpen`/`dCT`/…
  params, or `useEditPanelClick`/`usePanelControls`; every affordance now just navigates to the full
  page).
  - **One source of truth per entity = its `EntityWorkbench` descriptor** (`components/workbench/<entity>.tsx`,
    typed by `workbench/types.ts`). The descriptor carries the **field registry** (`layoutKind` + `fields`
    + `defaultLayout` — see **Entity page layouts**), the load hook (`useBySlug`),
    `name`/`isBuiltIn`/`canDelete`, and a `useDelete` control; its `tabs` array is now **thin**
    (`{ key, label, group? }`, no `view`/`edit` `WorkbenchPane`) — it survives only to carry the code-only
    `group` nav metadata. `EntityInfoView`/`EntityEditView` derive the tab rail/strip from the resolved
    layout and render each tab body via `WorkbenchRouteTab` → `LayoutDrivenTabBody`, dispatching the
    registry's per-field `view`/`edit` renderer by mode. So the view bodies, the edit forms (the auto-save
    `*GeneralForm` / per-field forms), and the responsive `TabbedShell` are all shared — **add/rename a tab
    or place a field in exactly one place** (the registry + `defaultLayout`). **Never** reintroduce an
    inline `*Row` editor, a `*Card`/`TagViewInfo` view card, the opaque pane `render`, or the monolithic
    submit **create** form for edit. **Create** flows (inline-create modals) keep their submit form —
    `CreateAutofillRule` / `TagCreateForm` / `PropertyForm` / `BookmarkForm` stay submit-driven for create
    only.
  - **The shared tabbed shell is `components/TabbedShell.tsx`** — a horizontal, scrollable tab strip
    (`navStripClass`) above the active body, on every surface (full-width page and phone); the strip
    scrolls horizontally when the tabs overflow, so the main pane is mobile-friendly for free. A
    single-tab (or tab-less) surface drops the nav strip.
  - **Bookmarks are layout-driven too (#1163), but off `ENTITY_DESCRIPTORS`.** A bookmark's view **and**
    edit both resolve the `"bookmark"` field registry (`components/workbench/bookmark.tsx` +
    `bookmarkViewFields.tsx`) through the shared `LayoutDrivenTabBody`; the old asymmetry
    (`buildBookmarkDetailSections` view vs. a per-tab edit route quartet) is gone. Bookmarks are
    **id-routed**, not slug-routed, so they can't reuse the slug-coupled `EntityInfoView`/`EntityEditView`:
    the detail page uses `BookmarkDetailBody` (single column) / `BookmarkDetailTabbed`, both fed by
    `hooks/useBookmarkViewTabs.ts` (resolves the layout + drops the data-empty tabs — the registry
    replacement for the old per-section null-omission, pure logic in `lib/bookmarkViewTabs.ts`), and edit
    is the single `bookmarks.$bookmarkId.edit` route (`?tab=`, redirected from the old `/edit/<seg>` paths
    incl. legacy `relationships → related`) rendering `components/BookmarkEditView.tsx` — the id-routed
    mirror of `EntityEditView`, with a bespoke General-tab Delete danger zone (bookmarks have no
    `useDelete` workbench control). The `"bookmark"` field split gives parity by construction:
    `general`/`customProperties`/`languageUsages`/`gallery`/`reel` carry both renderers; `relatedEdit` is
    edit-only; `relatedBookmarks`/`hierarchy`/`mediaSource`/`locationsMap`/`metadata`/`debugInfo` are
    view-only (so Metadata/Debug are view-only tabs and the Related tab shows the four view blocks in view,
    the one edit form in edit). Byte-identical is **waived** for bookmarks (design §7-A) — the unified tab
    order is view-preserving (general, properties, languages, image, video, related, metadata, debug) so
    the default single-column detail page stays closest to today; the edit strip reorders but each tab's
    content is unchanged. Every save behavior is untouched (each `edit` renderer just wraps the existing
    form — see **Edit-tab auto-save standard**).

## Entity page layouts

The per-deploy **Page Layouts** editor (#1106) lets an operator arrange an entity's view/edit UI as a
user-editable **Tab › Section › Field** tree, instead of the tab/section structure being hardcoded JSX.
**The whole system is live** — the schema, the `WorkbenchField` registry contract, the pure
`resolveLayout`, the render seam, server persistence, and the drag-and-drop editor (**Settings → Display
→ Page Layouts**, `PageLayoutsSettings` + `LayoutBoard`) all shipped. **Every entity is layout-driven**:
all 19 slug-routed workbench kinds, the shared `taxonomy-term` kind, *and* bookmarks render through the resolved-layout path (pilots
Category + Newsletter #1161, then rollout batches #1164/#1165, bookmarks #1163). The legacy opaque-pane
path (`WorkbenchPane.render`) still exists in the types + `WorkbenchRouteTab`/`deriveWorkbenchTabs` as a
**dormant fallback**, but **no descriptor populates panes anymore** — treat "add a field to a page" as a
registry edit, never a pane edit.

- **Schema (`@eesimple/types`, `entityLayouts.ts`).** `EntityLayout = { tabs: LayoutTab[] }`,
  `LayoutTab = { key, label, icon?, description?, sections: LayoutSection[] }`, `LayoutSection = { key,
  title?, description?, columns?, fields: string[] }`. `key`s are stable machine slugs (merge identity);
  `label`/`title` are user-editable; array order = render order; `icon` is a serialized **string name** (a
  user-created tab must be jsonb-serializable — the registry's real `LucideIcon` is resolved from it via
  `lib/icons.tsx` `icons[name]`). `columns` is a section's **column count (1–4; absent = 1 = full-width
  stack)** — its fields render at `1/columns` width and overflow wraps, honored identically in the editor
  preview (`LayoutBoard`) and on the real View/Edit pages (`LayoutDrivenTabBody` via `sectionColumnsClass`
  in `lib/layoutColumns.ts`, which stacks to one column below `md`). `description` is an optional
  user-editable blurb shown on the View/Edit pages: a **tab** description renders as a muted line at the
  top of the tab body, a **section** description renders under its title (via `LabeledSection`'s
  `description`). `columns`/`description` are additive jsonb (no migration) but each has the same
  hand-maintained sync points: the Fastify `layoutSectionSchema`/`layoutTabSchema`
  (`middleware/routes/entityLayoutsSchema.ts`, `additionalProperties: false`) and the two places a
  tab/section literal is rebuilt from scratch — `resolveLayout`'s recreated-tab/-section branch and the
  editor's `renameSection` reducer — must carry them through (#1220). **Page Layouts is its own top-level settings
  section** (`/settings/page-layouts`, a vertical entity rail, not the old Display sub-tab dropdown). `LAYOUTABLE_ENTITY_KINDS` (19 slug-routed workbench kinds + `"taxonomy-term"` + `"bookmark"` = 21) is the single edit
  point for adding a layoutable kind; `EntityLayoutRecord` is the API/DB row shape (`{ entityKind, layout,
  updatedAt }`, `layout: null` = no override) and `isValidEntityLayout` is the structural boundary guard
  (validates the tabs/sections nesting only — it does **not** check field keys; that is `resolveLayout`'s
  read-time job).
- **Field registry contract (`components/workbench/types.ts`).** A `WorkbenchField<E>` is a placeable,
  mode-aware unit: `{ key, label, icon?, view?, edit?, showIf? }` — the mode picks the `view`/`edit`
  renderer, so **view/edit parity is by construction** (one layout tree, no per-mode storage; an
  edit-only field renders nothing in view and vice-versa, which reproduces today's view-only "Hierarchy"
  / edit-only "Display" tabs for free). A composite editor (Conditions builder, gallery grid, rules
  list) registers as **one** field — internals are not decomposed. `useFieldAutoSave` stays inside the
  `edit` renderer; the danger zone stays a `WorkbenchRouteTab` fixture, not a placeable field.
- **Every entity opts in via three descriptor fields.** `EntityWorkbench` carries `layoutKind` /
  `fields` / `defaultLayout`; with all three set (now **every** descriptor),
  `EntityInfoView`/`EntityEditView` build their rail + per-tab `LabeledSection` stacks from the resolved
  layout (`deriveWorkbenchTabs` + `LayoutDrivenTabBody`), registry `fields` dispatched by mode. (Omitting
  all three falls back to the opaque `tabs`/pane `render` path — the pre-migration behavior, retained as a
  dormant fallback, no longer exercised.) **Bookmarks are the exception that stays off
  `ENTITY_DESCRIPTORS`** (id-routed, not slug-routed): they adopt only `layoutKind`/`fields`/`defaultLayout`
  and render through `LayoutDrivenTabBody` via bookmark-specific view bodies + `BookmarkEditView`, not the
  slug-coupled `EntityInfoView`/`EntityEditView` — see **Content hierarchies → Bookmarks are
  layout-driven**. Author `fields` exhaustively (`const
  fooFields = {…} satisfies Record<FooFieldKey, WorkbenchField<Foo>>` + a `defaultLayout` whose section
  `fields` are typed `FooFieldKey[]`) so a declared key without a renderer fails `tsc` — the
  `bookmarkAddFormFields.tsx` FIELD_RENDERERS idiom.
  - **Adding or surfacing a field is the everyday change, and it is two edits:** add the `WorkbenchField`
    entry to the entity's `fields` registry (`view` and/or `edit` renderer, optional `showIf`) **and**
    place its `key` in `defaultLayout` (append it to the section it belongs in). That is the whole surface
    — **no route file, no per-tab form, no `*Detail`/pane wiring**; the registry entry *is* the field.
    (`resolveLayout` even auto-appends a known-but-unplaced field to its default home, but a field you
    never add to `defaultLayout` can't appear until you do — so always place it.) See the
    **`surface-entity-field`** skill.
  - **The migration recipe (already applied to every entity; repeat only for a brand-new layoutable
    kind):** audit the entity's current tabs/panes → build `fields` + `defaultLayout` (one untitled section
    per tab, fields in current render order) → set `layoutKind`/`fields`/`defaultLayout` → **delete the
    opaque pane bodies** (thin the `tabs` array down to `{ key, label, group? }` — it now exists only to
    carry the code-only `group` nav metadata + satisfy the type) → snapshot-check tab/section/field order
    in **both** modes (`pilotLayouts.test.tsx` for the pilots, `rolloutBatch1Layouts.test.tsx` /
    `batch2Layouts.test.tsx` for the rollout, `bookmarkLayout.test.tsx` for bookmarks). The default must
    render byte-identically at the **tab/section/field-order** level — the layout-driven path intentionally
    drops the pane `<h2>`/description header (the rail label + section titles identify the content) and
    normalizes decomposed edit fields to `space-y-6`; those are the accepted deltas, not CSS pixel-parity
    (byte-identical is **waived** for bookmarks per design §7-A — one unified layout can't match the two
    asymmetric legacy surfaces).
  - **A field renderer must return a JSX *element* (`({entity}) => <Comp .../>`), never call hooks
    directly** — `LayoutDrivenTabBody` invokes `render({entity})` as a plain call, so any hooks must live
    inside the returned component (isolated fiber), or the changing field set breaks the Rules of Hooks.
  - **Field-granularity edge cases** (judgment, not mechanical): a scalar cluster sharing one `useAppForm`
    + a `grid sm:grid-cols-2` stays **one** field (Website `general` = site name/domain/description —
    splitting would linearize the grid); asymmetric view/edit composites reconcile into **one ordered field list**
    where each field is view-only, edit-only, or both, and the mode picks the renderer (Category
    `genreMoods` edit-only + `autofillSources` view-only; Newsletter `name`/`tags`/`genreMoods` edit-only +
    `metadata` view-only); a within-tab `<Separator/>` folds into the **leading edge of the field it
    precedes** (Newsletter `tags`/`genreMoods`), since the layout inserts separators only between sections.
  - **Extracting a coarse composite into granular fields (the repeatable recipe).** The inverse of the
    "keep it composite" judgment above: when an operator should be able to place a composite field's
    sub-fields independently (e.g. the bookmark `general`/"Details" field → Name / Primary language /
    Names / URL / Description / Category / Media type / Tags, with the blacklists pulled into an **Advanced**
    section — #1163), promote each sub-field to its own `WorkbenchField` key. Two shapes, by how the
    sub-field is backed:
    1. **Independently-backed sub-field** (its own hook / react-query-backed, no shared `useAppForm`) →
       promote it directly: add a `WorkbenchField` (its `edit`/`view` renderer wraps the existing
       sub-component) and place its key in `defaultLayout`. This is the Category precedent
       (`primaryLanguage`/`names` broken out beside the `details` composite) — nothing else is needed
       because react-query already coordinates the shared state across the separate fibers. Category's
       `name`/`icon`/`description` (#1186) turned out to be this same shape even though they shared one
       `useAppForm` — the grid was only a layout convenience, with **no real cross-field coordination**
       between the three (each already auto-saved on its own trigger); splitting them just meant giving
       each its own tiny `useAppForm` + `useFieldAutoSave` instance, not a form-context provider. Check
       for genuine coordination (shared validation, one field's save affecting another) before reaching
       for shape 2 below. A single **bundled** state hook likewise counts here (no provider) when each
       returned slice is used by exactly one field and auto-save is per field: every granular field
       component calls the one hook and reads only its slice — Newsletter (`useNewsletterGeneralForm`)
       and **YouTube Channel** (#1192, `useYouTubeChannelGeneralForm`, atomized into name / description /
       avatar / default-category / self-ids / tags / websites / groups / labeled-websites / genres; the
       avatar field owns the "Sync from source" registration).
    2. **Shared-`useAppForm` composite** (one controller with cross-field coordination — the bookmark
       General form: name-blur autofill, website-lookup → autofill offer → category, primary-language
       sync) → because the render seam calls each field renderer as a plain function, N independent field
       components would each spin up N separate form instances. Introduce a **form-context provider** at
       the entity's **edit-view** level that instantiates the controller **once**
       (`BookmarkGeneralFormProvider` in `BookmarkGeneralFormContext.tsx`, mounted by `BookmarkEditView`
       around the edit body — gated on the active tab hosting a shared-form field so it mounts exactly
       where the old monolithic form did). **A slug-routed entity has no bespoke edit view** (it renders
       through the generic `EntityEditView`), so it declares the provider on its **workbench descriptor**
       instead — `editFormProvider` + `sharedFormFieldKeys` on `EntityWorkbench`, which `EntityEditView`
       uses to wrap the edit body with the same active-tab gate (reference: `websiteWorkbench` +
       `WebsiteGeneralFormContext.tsx`, #1188). Each granular **edit** field is then a thin component that
       reads the shared controller from context (`useBookmarkGeneralFormContext`) and renders the existing
       sub-component; **view** fields read the entity directly and need no context. Split any shared
       sub-component into per-field halves (`BookmarkGeneralRelationsSection` → media-type + tags;
       `BookmarkBlacklistSection` → the two blacklist halves) and **recompose** the original from the
       halves so its story/test and any other consumer stay unchanged (the "form reused elsewhere is
       recomposed" rule below). Place the new keys in `defaultLayout` — grouping the pulled-out fields
       into a **titled section** (`{ key, title, fields }`) is how the old `CollapsibleFormSection`
       "Advanced" becomes a first-class section. Finish by updating the both-modes snapshot
       (`bookmarkLayout.test.tsx`) to the new field/section order. See the **`surface-entity-field`**
       skill's "Extraction (reverse direction)" section.
  - **A form reused elsewhere is recomposed, not deleted.** `CategoryGeneralForm` (used by `CategoryCard`)
    and `NewsletterGeneralForm` (used by its story) are recomposed from the **same** extracted per-field
    sub-components the registry uses, so their output/tests/stories are unchanged while the layout tab gets
    per-field placement. `usePrimaryLanguageField` is react-query-backed, so mounting it in two separate
    fields (name-sync + the standalone primary-language field) coordinates via the shared cache.
- **Nav grouping survives the layout path.** The edit strip's "More" dropdown (consecutive same-`group`
  tabs collapse under a shared `group` label) is code-only metadata on `WorkbenchTab.group`,
  **never persisted in the layout jsonb**. `deriveWorkbenchTabs` re-attaches each resolved tab's `group`
  from the matching `workbench.tabs[key]` — so a layout-driven descriptor keeps a thin `tabs` array solely
  as the group source, and a user-created tab (no matching key) stays flat.
- **Resolution.** Defaults derive from **code, never the DB**: an absent/empty stored layout resolves to
  the descriptor's `defaultLayout`, so a deploy with no saved layout renders as today. The pure
  `resolveLayout(stored, defaultLayout, knownFieldKeys)` (`@eesimple/types`) reconciles a stale stored
  layout: unknown field keys dropped, known-but-unplaced fields appended to their default home
  (recreating a deleted container so a new code-added field can never be invisible), ≥1 tab always
  resolves. The two render-time gates it defers to the renderer live in the pure helpers in
  `lib/workbenchLayout.ts` (`fieldRendersInMode` / `visibleSectionsForTab` / `modeVisibleTabs`): a
  section with no mode-visible field, and a tab with no visible section, are hidden at render.
- **Persistence + the editor are live.** `hooks/useEntityLayout.ts` `useEntityLayout(kind)` is the
  **single read seam** every consumer goes through (`useResolvedWorkbenchLayout(workbench)`); it reads the
  `entity_layouts` store via `useEntityLayouts()` (`hooks/useEntityLayouts.ts` → `GET /api/entity-layouts`,
  one shared cached query) and returns the kind's stored `layout` (or `null` → the code `defaultLayout`).
  Writes go through `useSaveEntityLayout`/`useResetEntityLayout` (`PUT`/`DELETE /api/entity-layouts/:kind`,
  served by `middleware/routes/entityLayouts.ts` + `services/entityLayouts.ts`, whose `upsertEntityLayout`
  is select-then-branch (see the **`test-structure`** skill) so it stays testable against the
  in-memory fake db). The **DnD editor** is
  `components/LayoutBoard.tsx` (a dnd-kit Tab › Section › Field board with an unplaced-fields tray + a tab
  `IconPicker`, controlled `value`/`onChange`, no persistence of its own), staged and committed by
  `PageLayoutsSettings.tsx` on **Settings → Display → Page Layouts**. You can also prove the loop by hand:
  `PUT` a layout for a kind and the live page rearranges in both modes; `DELETE` resets to the default.
  - **Editor selectable list = all layoutable kinds (#1371 complete).** The editor's kind picker
    (`LAYOUT_DRIVEN_ENTITIES` in `lib/layoutDrivenEntities.ts`) now lists **every** `LAYOUTABLE_ENTITY_KIND`
    — each entity's General composite has been atomized into granular, independently-placeable fields
    (the media-type #1189 / Category #1186 recipe; the final batch — Language, Place Type, Location
    Relation, Group Type, Relationship Type, Import Rule, Saved Filter, Taxonomy Term — landed in #1371).
    To add a new layoutable kind: add one `{ kind, label }` entry here; the render side needs no change.
    **`taxonomy-term` is the special case** — it has no `ENTITY_DESCRIPTORS` entry (its real workbench is
    built per-taxonomy by `buildTaxonomyTermWorkbench`), so the picker resolves it through a static base
    workbench (built from a synthetic hierarchical taxonomy) via a `baseWorkbenchForKind` special case, and
    its preview uses the synthetic `buildSampleEntity("taxonomy-term")` (no real-instance list, since its
    instances span every custom taxonomy). **Card Display Rules is *not* a layoutable kind** — it's a
    settings page, absent from `LAYOUTABLE_ENTITY_KINDS`, so it can't be added here without first being
    turned into a slug-routed entity with a field registry.
- **Dynamic (user-defined) placeable fields (#1163+).** The layout engine also carries **runtime-sourced**
  fields, not just the compile-time `fields` registry: a descriptor may set `useDynamicFields` (on
  `EntityWorkbench`) returning a `DynamicFieldSet` (fields keyed by a runtime id + a `defaultHome`
  tab/section). `useLayoutDrivenWorkbench` (`hooks/useEntityLayout.ts`) merges these into the resolved
  `fields` and appends their keys to an **augmented** `defaultLayout` (via `augmentDefaultLayout` in
  `lib/workbenchLayout.ts`) so an unplaced/new one still gets a home — keeping `resolveLayout` pure and
  the invisibility invariant intact. Every layout consumer (`EntityInfoView`/`EntityEditView`/
  `WorkbenchRouteTab`, the bookmark detail/edit bodies, and `PageLayoutsSettings`' tray) routes its
  workbench through this seam. **Bookmarks are the sole source today:** each **enabled** custom property
  is a placeable field keyed by its id (`useBookmarkDynamicFields` in `BookmarkPropertyLayoutFields.tsx`;
  the Card-Display-Rules card-field convention), so an operator arranges individual properties across the
  bookmark view/edit tabs. All per-property edit fields share **one** `useBookmarkPropertiesForm`
  controller via `BookmarkPropertiesFormContext` (mounted by `BookmarkEditView` when the active tab hosts
  a property field), since the controller debounce-persists the whole value set. This **replaced Property
  Groups**, which was removed — there is no property-group entity, table, or `propertyGroupId` column; the
  bookmark property view/form and the filter sidebar render properties flat.
- **Explicitly out of scope for v1 — don't "fix" these:**
  - **Create forms are unaffected.** The Add Bookmark quick-create form keeps its own, separate placement
    system (Settings → Display → Bookmark Add Form; see **Add Bookmark form field placement** + the
    `bookmark-add-form` skill). Page Layouts governs **view/edit** surfaces only.
  - **No per-mode divergence.** One layout tree drives both view and edit; the mode only chooses which
    renderer of a field fires. There is no separate stored arrangement for view vs edit — an edit-only or
    view-only field is how a per-mode difference is expressed.
  - **No per-user layouts.** A layout is **per-deploy** (one stored `entity_layouts` row per kind,
    operator-set), not per-user; there is no user column.
