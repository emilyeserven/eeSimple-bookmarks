---
name: tabbed-pages
description: >-
  Convert a slug-routed entity's single detail/edit pages into the vertical-tabbed View + Edit layout
  used by Categories and Settings (left sidebar nav + `<Outlet/>`), optionally adding an entity-scoped
  Autofill Rules tab. Use when asked to "give X a vertical tabbed layout", "make X's detail/edit pages
  tabbed like Categories/Settings", "split the X page into tabs", or "add an autofill tab to X".
  Mirrors how the Custom Properties view/edit pages were tabbed (General / Options / Categories /
  Display / Autofill).
---

# Convert detail/edit pages to a vertical-tabbed layout

Categories and Settings render a left **vertical nav** beside an `<Outlet/>`; each tab is its own
file-based route. This skill restructures an entity that currently has one long detail page and one
long edit form into that shape. **Reference implementation: Custom Properties** (the most complete
example — tabbed read-only View *and* Edit, plus a scoped Autofill tab). The Categories edit subtree
(`categories.$categorySlug.edit.*`) is the original pattern for the edit side.

Work front-to-back: extract shared pieces from the existing `*Detail` / `*Form`, then add the routes.
Decide the tab list from the entity's existing sections (e.g. property → General / Options /
Categories / Display / Autofill). A tab may be **conditional** (Custom Properties hides "Options" for
boolean — see `hasPropertyOptions` in `lib/propertyForm.ts`).

## Checklist

### 1. Tab-content wrapper (`packages/client/src/components/<Entity>TabWrapper.tsx`)
Copy `PropertyTabWrapper.tsx` (itself modeled on `CategoryEditTabWrapper.tsx`): it loads the entity by
slug (`use<Entity>BySlug`), renders loading/not-found states and an `h2` title + muted description,
then `children(entity)`. Both the view and edit tabs use it so each tab route stays a thin wrapper.

### 2. Split the read-only `*Detail` into section bodies
Export each section's **body** (no `LabeledSection`/title wrapper) from the existing `*Detail`, e.g.
`PropertyGeneralFields`, `PropertyOptionsFields`, `PropertyCategoriesContent`, `PropertyDisplayFields`
in `PropertyDetail.tsx`. The whole `*Detail` recomposes them under `LabeledSection` + `Separator`
(so the **right panel keeps using the whole `*Detail`** — right-panel parity), while each view-tab
route renders one bare body inside the wrapper.
- **Gotcha:** `react-refresh/only-export-components` — a file that exports components must not also
  export plain functions. Put helpers like `hasPropertyOptions` in a `lib/*.ts`, not in the `*Detail`
  component file.

### 3. Extract shared form pieces from `*Form`
Move reusable subcomponents (e.g. `CategoryCheckboxList`, `OperandCheckboxList` →
`PropertyFormFields.tsx`) and pure helpers/constants/zod bits (`toggleId`, `summarize*`, option
arrays → `lib/propertyForm.ts`). The **whole `*Form` stays** for the create page + right panel and
re-imports them.

### 4. Per-tab edit forms (`packages/client/src/components/<Entity><Tab>Form.tsx`)
Each tab is an **independent** `useAppForm` that saves a **partial** update via
`useUpdate<Entity>().mutate({ id, input })` — copy `CategoryGeneralForm.tsx` /
`PropertyGeneralForm.tsx`. The update input is already `Partial<…>`, so a tab persists only its own
fields. Use a dirty-check `disabledWhen` on the `SubmitButton` where it helps. If a rename can change
the slug, navigate to the returned `updated.slug` in `onSuccess` (see `PropertyGeneralForm`).

### 5. Route files (`packages/client/src/routes/`)
View side (pathless `_view` layout keeps URLs clean, e.g. `/custom-properties/:slug/general`):
- `<entity>.$<slug>.index.tsx` — change to a `beforeLoad` **redirect** to `…/general`.
- `<entity>.$<slug>._view.tsx` — header (back link, name + badges, an **Edit** link) + vertical nav +
  `<Outlet/>`. Build the nav array, omitting any conditional tab. Reuse the `navLinkClass` +
  `flex flex-col gap-6 sm:flex-row` + `sm:w-48` shell from `categories.$categorySlug.edit.tsx`.
- `<entity>.$<slug>._view.<tab>.tsx` — one per tab; wrapper → the matching `*Fields` body.

Edit side (mirror the Categories `edit` subtree):
- `<entity>.$<slug>.edit.tsx` — edit layout (back-to-view link, vertical nav, `<Outlet/>`).
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
The panel's content type keeps reusing the **whole** `*Detail` / `*Form` in its narrow column (as
Categories keeps its panel non-tabbed). Don't build panel-only tabbed variants — `contentTypes.tsx`
needs no change.

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
- has an **Edit** link to `…/edit/general`; each edit tab saves independently and reloads correctly,
- (if added) shows only the autofill rules scoped to the entity on its Autofill tab, and
- still works in the right panel via the whole `*Detail` / `*Form`.
```
