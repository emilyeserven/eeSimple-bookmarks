---
name: surface-entity-field
description: >-
  Surface a stored-but-hidden entity property on its slug-routed View (detail) and Edit page in
  eeSimple Bookmarks — wire a single field through the entity's field registry + layout so it can be
  read and edited. Use when asked to "show field X on the View/Edit page", "expose/surface a
  property", "field X isn't displayed/editable", "add X to the General/Options tab", or "the API
  stores X but the UI doesn't show it". Mirrors how numberFormat (Custom Properties), setMediaTypeId
  (Autofill prefill), favicon (Websites), avatar (YouTube Channels), and builtIn/icon (Media Types)
  were surfaced. For a brand-new field/column end-to-end use `add-entity`; to scaffold the whole
  view/edit layout use `tabbed-pages`.
---

# Surface a stored field on an entity's page

Every entity's view/edit UI is now **layout-driven**: a **field registry** (`fields`) + a
**`defaultLayout`** on its `EntityWorkbench` descriptor (`components/workbench/<entity>.tsx`), rendered
by `EntityInfoView` / `EntityEditView` → `LayoutDrivenTabBody`. **Read CLAUDE.md → "Entity page
layouts" first** — that section is the model this skill applies to a single field. There are **no
`*Detail` bodies, no per-tab route files, and no opaque panes** anymore; a field is a `WorkbenchField`
in the registry, and its placement is a `key` in `defaultLayout`.

Most "show field X on the page" requests are **client-only**: the field already round-trips through the
shared types, the route's JSON schema, and the service — it's just missing from a form + a view. **So
always trace first** (step 0) and only touch the middleware when the trace fails.

> **Bookmarks are the same registry pattern, off `ENTITY_DESCRIPTORS` (#1163).** A **bookmark** is
> id-routed, so surfacing a bookmark field is done in `components/workbench/bookmark.tsx` (view
> renderers live in `bookmarkViewFields.tsx`; edit renderers wrap the existing `Bookmark*Form`
> components) and placed in `BOOKMARK_DEFAULT_LAYOUT`. The detail page (`BookmarkDetailBody`/`Tabbed`
> via `hooks/useBookmarkViewTabs.ts`) and edit page (`BookmarkEditView`) both render from that
> registry. A **data-empty** view tab is dropped in `lib/bookmarkViewTabs.ts`
> (`hiddenBookmarkViewTabKeys`), not via per-field `showIf`. Everything else below applies unchanged.

Canonical examples already in the tree, by effort:

- **`numberFormat`** (Custom Properties) — a client-only enum select added to the `options` composite
  field. Files: `propertyFormSchema.ts`, the Options edit form, the Options view, `lib/propertyForm.ts`,
  `lib/propertyFormat.ts`.
- **`setMediaTypeId`** (Autofill *Prefill*) — a client-only nullable `<Select>` added to the prefill
  composite's edit form + view.
- **Favicon / avatar** (Websites, YouTube Channels) — images. Display via `EntityImagePreview`;
  upload/replace via `EntityImageField` + a multipart route + a "from bytes" service.

## Step 0 — Trace whether the field already flows (this decides the effort)

Check, in order — if all three are present it's **client-only**, skip steps 1–2:

1. **Types** (`packages/types/src/index.ts`): the field on the entity interface, on
   `Create<Entity>Input`, and therefore on `Update<Entity>Input` (which is `Partial<Create…>` /
   `Partial<Omit<Create…, "type">>`). e.g. `NumberFormat`, `CustomProperty.numberFormat`,
   `CreateCustomPropertyInput.numberFormat?`; `AutofillRule.setMediaTypeId`.
2. **Route body schema** (`packages/middleware/src/routes/<entity>.ts`): the create/update body
   JSON schema lists the property (these use `additionalProperties: false`, so an un-listed field is
   silently rejected). e.g. `customProperties.ts` `numberFormat` enum; `autofill.ts` `setMediaTypeId`.
3. **Service** (`packages/middleware/src/services/<entity>.ts`): the row→DTO mapper **reads** it, the
   create path **writes** it, and the update path **patches** it (`if (input.X !== undefined) patch.X
   = …`). e.g. `services/customProperties.ts`.

## Step 1 — (only if missing) Add to the types

Add the field to the entity interface and to `Create<Entity>Input`. `Update<Entity>Input` inherits it
because it's a `Partial<…>` of the create input. Add a shared union type (like `NumberFormat`) if the
field is an enum. `@eesimple/types` emits native ESM — intra-package re-exports need `.js` extensions.

## Step 2 — (only if missing) Add middleware validation + service plumbing

- Add the property to the create-body JSON schema (`additionalProperties: false` means it's rejected
  until listed). The update route reuses the same body.
- In the service: read it in the row→DTO mapper, set it on insert, and add
  `if (input.X !== undefined) patch.X = input.X;` to the update patch. Use the `numberFormat` lines in
  `services/customProperties.ts` as the template.

## Step 3 — Decide the placement: extend a composite field, or add a new one

Open the entity's descriptor (`components/workbench/<entity>.tsx`) and its `fields` registry. Two
outcomes:

- **The field joins an existing composite field** (the common case). Most scalars belong in the
  **General** tab, and General is registered as **one** placeable field — e.g. media type's
  `general: { view: MediaTypeGeneralView, edit: ({entity}) => <MediaTypeGeneralForm mediaType={entity} /> }`,
  or category's `details` (name/icon/description as one `useAppForm` grid). A composite registers as one
  field on purpose (CLAUDE.md → "Field-granularity edge cases"), so you **don't add a registry key** —
  you edit the composite's underlying view + edit components (step 4a). Do this unless the field is
  genuinely a new section.
- **The field warrants its own placeable unit** (a distinct section/tab — rare for a single field). Add
  a new `WorkbenchField` to the registry and place its key in `defaultLayout` (step 4b).

Don't invent a whole new tab for one scalar — fold it into General's composite.

## Step 4a — Common case: extend an existing composite field

The composite's edit renderer wraps `<Entity>GeneralForm` (auto-save) and its view renderer wraps
`<Entity>GeneralView` (a read-only `dl`). Edit those two components — **no registry or `defaultLayout`
change**:

**Edit form** (`components/<Entity>GeneralForm.tsx`, the auto-save form — reference
`CategoryGeneralForm.tsx`):
- add the field to the module's zod object (`categorySchema` etc.) and to `defaultValues` /
  `valuesFromEntity` with a null fallback (`entity.numberFormat ?? "plain"`);
- render the control via `form.AppField` (`TextField` / `TextareaField` / `NumberField` / `SelectField`
  / `ComboboxField`, or `IconPicker` / `DateTimePicker` / `EntityImageField`), and save it through the
  form's `useFieldAutoSave` instance: **text/textarea save on blur** (`onBlur={() =>
  autoSave.saveField("x", value)}`), **selects/toggles/comboboxes on change** (`onValueChange`). Reuse a
  shared options array (e.g. `NUMBER_FORMAT_OPTIONS` in `lib/propertyForm.ts`); a **nullable** select
  uses a `NO_*` sentinel mapped to `null` on save. There is **no Save button** — see the
  `toast-notifications` skill for the auto-save rules.

**View** (`components/workbench/<entity>Views.tsx` `<Entity>GeneralView`, the `dl`): add a `<dt>/<dd>`
pair (or a `DetailField` row, which auto-hides when empty). For enums add a labels map in
`lib/<entity>Format.ts` (mirror `NUMBER_FORMAT_LABELS`); for icons use `CategoryIcon` from `@/lib/icons`;
for images use `EntityImagePreview`; resolve foreign-key ids to names from the relevant list hook
(`useMediaTypes()` etc.).

## Step 4b — New placeable field (a distinct section)

Add a `WorkbenchField` entry to the entity's `fields` registry and its key to the `defaultLayout`:

```tsx
type <Entity>FieldKey = … | "myField";

const <entity>Fields = {
  // …existing fields…
  myField: {
    key: "myField",
    label: i18n.t("My section"),
    view: ({ entity }) => <MyFieldView entity={entity} />,   // omit ⇒ never in view mode
    edit: ({ entity }) => <MyFieldForm entity={entity} />,   // owns its own useFieldAutoSave; omit ⇒ never in edit
    showIf: entity => entity.type === "number",              // optional
  },
} satisfies Record<<Entity>FieldKey, WorkbenchField<Entity>>;
```

Then append `"myField"` to the right section in `defaultLayout` (typed `<Entity>FieldKey[]`), e.g. a new
tab:

```ts
{ key: "my-tab", label: i18n.t("My section"),
  sections: [{ key: "my-tab", fields: ["myField"] satisfies <Entity>FieldKey[] }] }
```

Rules that matter (CLAUDE.md → "Entity page layouts"):
- **The renderer must return a JSX *element*, not call hooks directly** — `LayoutDrivenTabBody` invokes
  `render({entity})` as a plain call, so any hooks live inside the returned component (`MyFieldForm`),
  never in the arrow.
- **view/edit parity is by construction**: an `edit`-only field renders nothing in view (the old
  edit-only "Display" tab), a `view`-only field renders nothing in edit (the old view-only "Hierarchy"
  tab). `showIf` hides the field (and, if it's the only field in a section/tab, that section/tab) unless
  it returns true — reproducing a conditional tab like Custom Properties' Options
  (`hasPropertyOptions`).
- **Exhaustiveness**: the `satisfies Record<<Entity>FieldKey, …>` makes a declared key without a renderer
  fail `tsc`; a `defaultLayout` field key that isn't in the registry is silently dropped by
  `resolveLayout`, so keep the union + registry + layout in sync.

## Step 5 — Confirm the mutation (usually nothing to add)

The edit form already saves a partial via `useFieldAutoSave` → `useUpdate<Entity>().mutate({ id,
input })`, and that hook invalidates the relevant React Query caches — just include the new key. The
view re-reads the same entity from cache, so it inherits the field automatically; never build a
surface-specific variant.

### Images — the larger path (only when adding upload/replace)

Favicon/avatar already have **serve** + **auto-capture** + **delete** routes and an `imageUrl` on the
entity, but **no bytes-ingest** path. To add upload:

- **Service:** add `set<Entity>ImageFromBytes(id, rawBytes)` that calls the existing internal
  `set…Image(id, bytes, "upload")` (widen its `source` union to include `"upload"`). See
  `services/websiteFavicons.ts` / `services/youtubeChannelImages.ts`.
- **Route:** add `POST /api/<entity>/:id/image` multipart, mirroring `routes/bookmarks.ts`'s upload
  (multipart file → `toBuffer()` → service; 503 when storage unconfigured, 413 too-large, 415
  bad-image, 201 with `{ imageUrl }`). Place it beside the existing `…/image/auto` route.
- **Client:** add `uploadImage` to the entity's API module via the shared `uploadImageFile` helper in
  `lib/api.ts`; add a `useUpload<Entity>Image` hook (mirror `useUploadBookmarkImage`) that invalidates
  the entity query; wire it into `EntityImageField` in the composite's edit renderer.

## Extraction (reverse direction) — split a composite into granular fields

The steps above **add** or **fold** a field; this is the opposite move — breaking a coarse composite
field into several independently-placeable fields so an operator can arrange them (and pull some into
their own section) in **Settings → Display → Page Layouts**. Reference: the bookmark `general`/"Details"
field split into Name / Primary language / Names / URL / Description / Category / Media type / Tags, with
the two blacklists pulled into an **Advanced** section (#1163). The composite-vs-granular judgment is in
CLAUDE.md → "Field-granularity edge cases"; do this only when the sub-fields genuinely deserve
independent placement, not to atomize a cohesive grid.

Pick the shape by how each sub-field is backed — the deciding question is **cross-field coordination**,
not whether a `useAppForm` exists:

- **Independently-backed sub-field** (its own hook / react-query-backed, or a shared `useAppForm` with
  **no cross-field coordination**) → just promote it with step 4b: a `WorkbenchField` whose renderer wraps
  the existing sub-component, placed in `defaultLayout`. Each field can call the same controller hook
  **independently** (its own instance per fiber); react-query dedupes the shared mutation/queries across
  fibers, so nothing else is needed. Precedents: Category (`primaryLanguage`/`names` beside the `details`
  composite), **Newsletter** (`useNewsletterGeneralForm` called per sub-field, #1187), **Custom
  Property** (`usePropertyGeneralForm` → `name`/`type`/`status`/`description` edit fields +
  `status`/`description`/`created` view rows, #1196), and **Media Type** (the *whole* General composite
  atomized — name/sortOrder/description/parent/icon/hidden edit fields + per-row `DetailField` view rows,
  each field its **own** single-field `useAppForm`+`useFieldAutoSave`; the sole name→primary-language
  coupling rides the react-query cache via `usePrimaryLanguageField` reading the persisted `mediaType.name`,
  #1189). These share a `useAppForm`+autosave but split cleanly because each field's save is self-contained
  (e.g. name→slug follow) and the fields don't read each other's live state — so **skip the provider**, and
  recompose the whole-form/whole-view shells (`MediaTypeGeneralForm` / `MediaTypeGeneralView`) from the
  split halves so their story/test stay unchanged.
- **Shared controller that must mount exactly once** — either **genuine cross-field coordination**
  (name-blur autofill, website-lookup → offer → category, primary-language sync — the bookmark case) **or**
  granular fields that share **one mounted instance**: local `useState` that can't dedupe across fibers,
  or a once-only side-effect like the header "Sync from source" registration (the **Website** case,
  `useImageTaxonomySyncRegistration` — calling the controller per fiber would thrash the store). The render
  seam calls each field renderer as a plain function, so N naive field components would each instantiate N
  separate controllers **and lose the coordination / re-run the side-effect**. Use a **form-context
  provider**:
  1. **Context** — a `<Entity>GeneralFormProvider` that calls the controller hook (+ any react-query
     field hooks + the sync registration) **once** and exposes them; a `use<Entity>GeneralFormContext()`
     reader. Reference: `components/BookmarkGeneralFormContext.tsx`.
  2. **Mount** it at the entity's **edit-view** level, wrapping the edit body — gated on the active tab
     hosting a shared-form field so the controller mounts exactly where the old monolithic form did (and
     follows the fields if an operator relocates them). Reference: `BookmarkEditView.tsx`
     (`SHARED_FORM_FIELD_KEYS`). **A slug-routed entity has no bespoke edit view** — it renders through
     the generic `EntityEditView`, so instead of editing an edit-view file you declare the provider on the
     **workbench descriptor**: set `editFormProvider: ({ entity, children }) => <XGeneralFormProvider
     entity={entity}>{children}</…>` and `sharedFormFieldKeys: new Set([...])` on `EntityWorkbench`, and
     `EntityEditView` wraps the edit body with the same active-tab gate. References: `websiteWorkbench`
     (`components/workbench/website.tsx`) + `WebsiteGeneralFormContext.tsx`; `locationWorkbench`
     (`components/workbench/location.tsx`) + `LocationGeneralFormContext.tsx` (#1191, the
     maximal-atomization case whose map is its own view-only `map` field).
  3. **Granular edit fields** — each a thin component that reads the shared controller from context and
     renders the existing sub-component; register each as a `WorkbenchField.edit`. View fields read the
     entity directly (no context). Split any shared sub-component into per-field halves
     (`BookmarkGeneralRelationsSection` → media-type + tags; `BookmarkBlacklistSection` → the two
     blacklist halves) and **recompose** the original from the halves so its story/test and other
     consumers stay unchanged.
  4. **Layout** — place the new keys in `defaultLayout`; group the pulled-out fields into a **titled
     section** (`{ key, title, fields }`) to turn a former `CollapsibleFormSection` into a first-class
     section (the bookmark **Advanced** section).
  5. **Snapshot** — add/update the both-modes layout test (`bookmarkLayout.test.tsx`,
     `locationLayout.test.tsx`, or the entity's rollout harness — e.g. `batch2Layouts.test.tsx` for Custom
     Property) to the new field/section order. Remember view/edit parity: edit-only fields
     (Name/Type/blacklists) drop in view, view-only fields (bookmark `detailsExtra`, Custom Property
     `created`, Location's `map` / `slug` / `bookmarkCount`) drop in edit.

  **Location (#1191)** is the maximal-atomization + slug-routed reference: every General row became its
  own field (the map is its own **view-only** `map` field — `LocationMapView`, extracted with the
  ancestry logic, `LocationMapSection` props preserved per the `locations-map` skill), and only two
  genuine coordination clusters stayed whole (lat/long + Re-geocode button; Wikipedia EN/Local + Autofill
  button) because a single shared action drives each.

## Verify

```
pnpm typecheck
pnpm test
pnpm lint:fix          # always from repo root
```

Then `pnpm dev` and confirm the entity:

- shows the new field/row on its **Info** page (enum labels, resolved FK names, image preview, or
  "None"/omitted when empty),
- edits and **persists** it from the **Edit** page after a reload, auto-saving on blur/change with a
  field-named toast (no Save button; see `toast-notifications`),
- (images) uploads, auto-captures, and removes — the `?v=` cache-buster refreshes the served URL,
- (new registry field) appears in the resolved layout in the right mode, and disappears cleanly when
  `showIf` is false (the whole tab hides if it was the only field).
