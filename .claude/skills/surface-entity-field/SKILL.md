---
name: surface-entity-field
description: >-
  Surface a stored-but-hidden entity property on its slug-routed View (detail) and Edit tab in
  eeSimple Bookmarks — wire a single field through the tabbed View+Edit layout so it can be read and
  edited. Use when asked to "show field X on the View/Edit page", "expose/surface a property",
  "field X isn't displayed/editable", "add X to the General/Options tab", or "the API stores X but
  the UI doesn't show it". Mirrors how numberFormat (Custom Properties), setMediaTypeId (Autofill
  prefill), favicon (Websites), avatar (YouTube Channels), and builtIn/icon (Media Types) were
  surfaced. For a brand-new field/column end-to-end use `add-entity`; to scaffold the tabs
  themselves use `tabbed-pages`.
---

# Surface a stored field on an entity's View + Edit tab

Most "show field X on the page" requests are **client-only**: the field already round-trips through
the shared types, the route's JSON schema, and the service — it's just missing from the form and the
detail view. **So always trace first** (step 0) and only touch the middleware when the trace fails.

Canonical examples already in the tree, by effort:

- **`numberFormat`** (Custom Properties) — client-only enum select added to a typed Options tab.
  Files: `propertyFormSchema.ts`, `PropertyForm.tsx`, `PropertyDetail.tsx`, `lib/propertyForm.ts`,
  `lib/propertyFormat.ts`.
- **`setMediaTypeId`** (Autofill *Prefill* tab) — client-only nullable `<Select>` copied from the
  unified `AutofillRuleForm.tsx` into the per-tab form/view. Files: `AutofillRulePrefillForm.tsx`,
  `AutofillRulePrefillPickers.tsx`, `AutofillRuleDetail.tsx`, the prefill view route.
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

## Step 3 — Pick the tab

Map the field to the right existing View+Edit tab — General for most, or a **typed/conditional** tab
(Custom Properties' Options is gated by `type === "number"` via `hasPropertyOptions` in
`lib/propertyForm.ts`). Don't invent a new tab for a single field.

## Step 4 — Add the field to the edit form's schema module

In the per-tab form's schema module (canonical `components/propertyFormSchema.ts`):

- add the field to the zod object,
- add it to `CREATE_DEFAULTS` / `defaultValues`,
- map it in `valuesFromProperty` with a null fallback (`property.numberFormat ?? "plain"`),
- emit it in `payloadFromValues`, **gating by type** where the field only applies to one type
  (`numberFormat: isNumber ? values.numberFormat : null`).

For a form that holds its values in `useState` (e.g. `AutofillRulePrefillForm.tsx`), instead add: an
`initial…` value, the `useState`, an entry in the `isDirty` check, and the key in the
`update….mutate({ input })` object.

## Step 5 — Render the control in the edit form

Use the right input via `form.AppField`: `TextField` / `TextareaField` / `NumberField` /
`SelectField` / `ComboboxField`, or `IconPicker` / `DateTimePicker`. Reuse a shared options array
(e.g. `NUMBER_FORMAT_OPTIONS` in `lib/propertyForm.ts`). A **nullable** select uses a `NO_*` sentinel
mapped to `null` on save — copy the `setMediaTypeId` select from `AutofillRuleForm.tsx`. Images use
`EntityImageField` (`components/EntityImageField.tsx`): pass `imageUrl`, `shape`, a `fallback` icon,
and `onUpload`/`onAuto`/`onRemove` mutations + a `busy` flag.

## Step 6 — Render the read-only row in the View

Add a `DetailField` row (`components/DetailField.tsx`; label + children, auto-hides when empty) inside
the detail body, or a `<dt>/<dd>` pair for the General tabs that use a raw `<dl>` grid (Media Types /
Websites / YouTube Channels view routes). For enums, add a labels map in `lib/propertyFormat.ts`
(mirror `DATE_TIME_FORMAT_LABELS` / `NUMBER_FORMAT_LABELS`). For icons use `CategoryIcon` from
`@/lib/icons`. For images use `EntityImagePreview` (read-only, fallback icon). Resolve foreign-key ids
to names from the relevant list hook (e.g. `useMediaTypes()` to name `setMediaTypeId`) and pass them
into the view component as a prop from its route.

## Step 7 — Confirm the mutation (usually nothing to add)

The per-tab form already saves a partial via `useUpdate<Entity>().mutate({ id, input })`, and that
hook invalidates the relevant React Query caches — just include the new key in `input`. The right
panel reuses the **same** `*Detail` / `*Form`, so it inherits the field automatically; never make a
panel-only variant.

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
  the entity query; wire it into `EntityImageField` on the Edit General tab.

## Verify

```
pnpm typecheck
pnpm test
pnpm lint:fix          # always from repo root
```

Then `pnpm dev` and confirm the entity:

- shows the new field/row on its **View** tab (enum labels, resolved FK names, image preview, or
  "None" when empty),
- edits and **persists** it from the **Edit** tab after a reload, with the Save button still
  `requireDirty`-gated (or the `isDirty` button disabled until changed),
- (images) uploads, auto-captures, and removes — the `?v=` cache-buster refreshes the served URL,
- still renders the same component in the right panel.
