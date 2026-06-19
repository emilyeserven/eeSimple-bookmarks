---
name: tabbed-pages
description: >-
  Convert a slug-routed entity's single detail/edit pages into the vertical-tabbed View + Edit layout
  used by Categories and Settings (left sidebar nav + `<Outlet/>`), optionally adding an entity-scoped
  Autofill Rules tab. Use when asked to "give X a vertical tabbed layout", "make X's detail/edit pages
  tabbed like Categories/Settings", "split the X page into tabs", or "add an autofill tab to X".
  Mirrors how Custom Properties / Websites / Media Types / YouTube Channels / Categories / Tags /
  Property Groups view and edit pages were tabbed.
---

# Convert detail/edit pages to a vertical-tabbed layout

Categories and Settings render a left **vertical nav** beside an `<Outlet/>`; each tab is its own
file-based route. This skill restructures an entity that currently has one long detail page and one
long edit form into that shape. Seven entities already use it, so copy whichever is closest:

- **Custom Properties** — the most complete (read-only View *and* Edit, a **conditional** tab, plus a
  scoped Autofill tab).
- **Websites** — multiple non-trivial tabs (General / Shortened Links / Param Rules).
- **Media Types / YouTube Channels / Property Groups** — the leanest General-only edit forms (a
  single tab inside the full shell).
- **Tags** — the leanest View side, and the example of when to **skip** the per-entity wrapper.

## Shared primitives (already exist — reuse them)

In `packages/client/src/components/`:

- **`TabbedEntityLayout`** (+ exported `navLinkClass`) — the layout shell for `_view.tsx` / `edit.tsx`.
  It renders the `header`, the left vertical `<nav>`, and the `<Outlet/>`. You give it the nav
  **declaratively**, not as JSX:
  ```tsx
  <TabbedEntityLayout
    header={(/* back link + title/badges + Edit link (view) or description (edit) */)}
    nav={viewNav}                       // readonly TabNavItem[] = { to, label }[]
    params={{ websiteSlug }}            // route params shared by every nav link
    navAriaLabel="Website sections"
  />
  ```
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
recomposes them under `LabeledSection` + `Separator` (so the **right panel keeps using the whole
`*Detail`** — right-panel parity), while each view-tab route renders one bare body inside the wrapper.
- **Gotcha:** `react-refresh/only-export-components` — a file that exports components must not also
  export plain functions. Put helpers like `hasPropertyOptions` in a `lib/*.ts`. (Where a file
  genuinely must mix the two — as `lib/form.tsx` and `TabWrapper.tsx` do — add a file-level
  `/* eslint-disable react-refresh/only-export-components */` with a comment, but prefer splitting.)

### 3. Extract shared form pieces from `*Form`
Move reusable subcomponents (e.g. `CategoryCheckboxList`, `OperandCheckboxList` →
`PropertyFormFields.tsx`) and pure helpers/constants/zod bits (`toggleId`, `summarize*`, option
arrays → `lib/propertyForm.ts`). The **whole `*Form` stays** for the create page + right panel and
re-imports them.

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
View side (pathless `_view` layout keeps URLs clean, e.g. `/custom-properties/:slug/general`):
- `<entity>.$<slug>.index.tsx` — a `beforeLoad` **redirect** to `…/general`.
- `<entity>.$<slug>._view.tsx` — the layout: `<TabbedEntityLayout header={…} nav={viewNav}
  params={{ <slug> }} navAriaLabel="…" />`. Define `viewNav` as
  `const viewNav = [{ to, label }, …] as const` (conditionally spread an optional tab — see Custom
  Properties). The `header` carries the back link, name + badges, and an **Edit** link.

  The Edit link must navigate to the **same tab** the user is currently viewing. Use a module-scope
  `VIEW_TO_EDIT` map that keys every view tab to its edit route. Any view tab with no edit
  counterpart (e.g. Tags' `hierarchy`) simply falls back to `general` by being absent from the map.
  Read the current tab from the last URL segment via `useRouterState`:

  ```tsx
  import { useRouterState } from "@tanstack/react-router";

  // module scope — quote ALL keys when any key contains a hyphen (quote-props rule):
  const VIEW_TO_EDIT = {
    "general": "/websites/$websiteSlug/edit/general",
    "shortened-links": "/websites/$websiteSlug/edit/shortened-links",
    "param-rules": "/websites/$websiteSlug/edit/param-rules",
    "autofill": "/websites/$websiteSlug/edit/autofill",
  } as const;
  type WebsiteEditRoute = typeof VIEW_TO_EDIT[keyof typeof VIEW_TO_EDIT];

  // inside the component — multiline selector required by stylistic rules:
  const pathname = useRouterState({
    select: s => s.location.pathname,
  });
  const editRoute: WebsiteEditRoute =
    (VIEW_TO_EDIT[pathname.split("/").at(-1) as keyof typeof VIEW_TO_EDIT]
      ?? VIEW_TO_EDIT.general) as WebsiteEditRoute;

  // in JSX — keeps the existing asChild + Link pattern:
  <Button asChild variant="outline" size="sm">
    <Link to={editRoute} params={{ websiteSlug }}>Edit</Link>
  </Button>
  ```

  **Styling gotcha:** `@stylistic/quote-props` enforces *consistent* quoting within an object.
  If any key requires quotes (hyphen in the name), *all* keys must be quoted. If no keys need
  quotes, leave them unquoted. Always run `pnpm lint:fix` from the repo root after adding the map.
- `<entity>.$<slug>._view.<tab>.tsx` — one per tab; render `<EntityTabWrapper <entity>Slug={slug}
  title=… description=…>{e => <…Fields … />}</EntityTabWrapper>`.

Edit side (mirror the View side):
- `<entity>.$<slug>.edit.tsx` — edit layout (back-to-view link + description, `editNav`, same
  `TabbedEntityLayout`).
- `<entity>.$<slug>.edit.index.tsx` — redirect to `…/edit/general`.
- `<entity>.$<slug>.edit.<tab>.tsx` — one per tab; wrapper → the per-tab form.

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

### 7. Leave the right panel alone
The panel's content type keeps reusing the **whole** `*Detail` / `*Form` in its narrow column. Don't
build panel-only tabbed variants — `contentTypes.tsx` needs no change.

## Verify

```
pnpm --filter=@eesimple/client routeTree   # regenerate route tree (or rely on dev/build)
pnpm typecheck
pnpm test
pnpm lint:fix                              # always from repo root
```

Then run `pnpm dev` and check that the entity:
- redirects `/<entity>/<slug>` to `…/general` and switches tabs via the left nav (conditional tabs
  appear/disappear by type),
- has an **Edit** link that preserves the active tab (e.g. clicking Edit from "Param Rules" lands on
  the edit "Param Rules" tab, not "General"); tabs without an edit counterpart fall back to "General";
  each edit tab saves independently, the Save button is disabled until the form is dirty and
  re-disables when reverted, and the tab reloads correctly,
- (if added) shows only the autofill rules scoped to the entity on its Autofill tab, and
- still works in the right panel via the whole `*Detail` / `*Form`.
```
