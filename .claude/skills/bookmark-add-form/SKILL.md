---
name: bookmark-add-form
description: >-
  Manage and extend the Add Bookmark form field-placement system in eeSimple Bookmarks — the central
  Settings → Display → Bookmark Add Form tab that decides, per field, whether the quick create form
  shows it in the main area (Default), the collapsible Advanced section, or hides it. Use when asked
  to "add a field to the Add Bookmark form", "make X placeable on the add form", "hide a built-in
  property from the add form", "add a row to the Bookmark Add Form settings", "move an add-form field
  to Advanced/hidden by default", "change what the create form shows", or "why doesn't my new
  property/field appear when adding a bookmark". Mirrors how the 9 standard fields and the 8 built-in
  detail slugs became placeable. Create-mode only — edit surfaces are deliberately unaffected.
---

# Manage the Add Bookmark form field placement

Field placement on the **create** Add Bookmark form is configured **centrally**, not hardcoded per
field. One settings tab (`Settings → Display → Bookmark Add Form`, `/settings/display/bookmark-add`)
sorts every field into **Default** (main area), **Advanced** (collapsible section), or **Hidden**.
This is **create-mode only** (`!isEdit`) — edit surfaces render as before and stay editable.

## The three kinds of placeable field

| Kind | Stored as | Edited via |
|---|---|---|
| **Standard fields** (`title`, `romanizedTitle`, `categoryId`, `mediaTypeId`, `languageId`, `groupId`, `descriptionTags`, `personIds`, `image`) | the server-side `bookmark-add-form` app-settings group — `advancedFields` / `hiddenFields` arrays (sidebar-style membership; absence from both = Default) | Card 1 of the tab |
| **Built-in detail properties** (`BOOKMARK_FORM_DETAIL_SLUGS`: runtime, date-posted, content-status, page-progress, page-range, page-sections, chapters, url-sections) | the same group's `builtInPropertyPlacements` map, keyed by slug, resolved `{ ...defaults, ...stored }` | Card 2 of the tab |
| **User custom properties** | the property's own `showInForm` / `hiddenFromForm` flags | Card 3 of the tab, via `useUpdateCustomProperty` |

`url` is always shown and is intentionally **not** placeable.

## The pieces

- **Shared types** — `packages/types/src/bookmarkAddForm.ts`: the `BOOKMARK_ADD_FORM_STANDARD_FIELDS`
  tuple (→ `BookmarkAddFormStandardField`), `BOOKMARK_ADD_FORM_PLACEMENTS` (`default`/`advanced`/
  `hidden`), `BOOKMARK_FORM_DETAIL_SLUGS` + the 8 `*_SLUG` constants (re-exported by
  `components/bookmarkFormSchema.ts` so existing importers are unchanged), `BookmarkAddFormSettings`,
  and `DEFAULT_BOOKMARK_ADD_FORM_SETTINGS` (today's Advanced residents in `advancedFields`, all detail
  slugs → `hidden`). Shared by middleware and client.
- **Middleware group** (`bookmark-add-form`) — 3 nullable jsonb columns on `appSettings`
  (`bookmarkFormAdvancedFields`, `bookmarkFormHiddenFields`, `bookmarkFormBuiltInPlacements` in
  `db/schema.ts`, push-safe additive), `getBookmarkAddFormSettings` / `updateBookmarkAddFormSettings`
  + `asBookmarkAddFormPlacements` normalizer + `resolveBookmarkAddFormSettings` in
  `services/appSettings.ts`, and `GET`/`PUT /api/app-settings/bookmark-add-form` in
  `routes/appSettings.ts`. Mirrors the `sidebar-customization` group — see the **`app-settings-group`**
  skill.
- **Client plumbing** — `lib/api/settings.ts` (`getBookmarkAddForm`/`updateBookmarkAddForm`);
  `hooks/useAppSettings.ts` (`useBookmarkAddFormSettings`, `useUpdateBookmarkAddFormSettings`,
  `useBookmarkAddFormConfig` = `data ?? DEFAULT_BOOKMARK_ADD_FORM_SETTINGS`).
- **Resolver** — `lib/bookmarkAddForm.ts` `resolveBookmarkAddForm(settings, isEdit)` → `{ mainStandardFields,
  advancedStandardFields, mainHiddenSlugs, advancedHiddenSlugs, placementOverrides }`. **Edit mode
  ignores `settings` and returns today's hardcoded split** (main = title/romanizedTitle; advanced =
  the rest; main hides all 8 detail slugs; advanced hides runtime/date-posted); create mode buckets by
  the settings. Consumed via `hooks/useBookmarkAddFormVisibility.ts` (settings query + `useMemo`).
- **Form render** — `components/BookmarkRevealedFields.tsx` calls `useBookmarkAddFormVisibility` and
  renders standard fields through `components/bookmarkAddFormFields.tsx`'s `BookmarkStandardFieldZone`
  (an **exhaustive** `Record<BookmarkAddFormStandardField, (props) => ReactNode>` dispatch — a missing
  key fails `tsc`), then custom fields via `RevealedCustomFields` / `BookmarkAdvancedSection`, threading
  `hiddenSlugs` + `placementOverrides` into `selectVisibleFormProperties` (`bookmarkFormProperties.ts`).
- **Settings page** — `components/DisplayBookmarkAddSettings.tsx` (3 shadcn `<Card>`s of
  `SegmentedToggleRow`s, plus a **Preview** button opening `components/BookmarkAddFormPreviewDialog.tsx`
  — a `<BookmarkForm previewMode />` in a `Dialog`, so field placement can be checked without leaving
  the settings page) + `hooks/useBookmarkAddFormSettingsPage.ts` (state + per-row save handlers +
  field-named toasts; `BOOKMARK_ADD_FORM_STANDARD_LABELS`; `standardFieldPlacement`). Route
  `routes/settings.display.bookmark-add.tsx` + `displayNav` entry in `lib/settingsNav.ts`.
- **Preview mode** — `BookmarkFormProps.previewMode` (`components/useBookmarkFormController.ts`) is a
  render-only flag threaded into the `useAppForm({ onSubmit })` config: when set, submit is a no-op no
  matter which action path reaches it (the footer's primary submit button **and** the "Add Now" quick
  path both funnel through the same `onSubmit`, so one guard covers both). `BookmarkFormFooter` also
  relabels the submit button "Preview only" and force-disables it so the no-op is visibly intentional.
  `previewMode` is otherwise inert — field reveal/visibility, URL scan, and ISBN lookup all still work,
  so the preview looks and behaves like the real form.

## Change recipes

**Hide a new built-in detail property from the create form** — add its slug to
`BOOKMARK_FORM_DETAIL_SLUGS` in `packages/types/src/bookmarkAddForm.ts`. That single edit seeds it
`hidden` (via `DEFAULT_BOOKMARK_ADD_FORM_SETTINGS`) and gives it a configurable row in Card 2. Do
**not** flip the property's own `hiddenFromForm` — that would also hide it from the edit Properties tab.

**Make a new standard field placeable** (a new user-pickable create-form field) — add its key to
`BOOKMARK_ADD_FORM_STANDARD_FIELDS` (+ its default bucket in `DEFAULT_BOOKMARK_ADD_FORM_SETTINGS`), a
`BOOKMARK_ADD_FORM_STANDARD_LABELS` entry in `useBookmarkAddFormSettingsPage.ts`, and a render entry in
the `BookmarkStandardFieldZone` dispatch in `bookmarkAddFormFields.tsx`. Auto-gates (e.g. render `null`
when a value is absent) live inside that render entry. `tsc` enforces the label + dispatch entries. See
also step 6 of the **`add-entity`** skill for the surrounding form/schema wiring.

**Add a new app-settings key** (a global add-form knob) — extend the group per the
**`app-settings-group`** skill: a nullable jsonb column, the resolver's `?? default`, the PUT
JSON-schema body, and the client hooks.

## Gotchas

- **Create-mode only.** Any placement change must leave edit surfaces byte-for-byte as before —
  `resolveBookmarkAddForm(settings, /* isEdit */ true)` returns the hardcoded split and no
  `placementOverrides`. Don't route settings into the edit path.
- **A stored `[]` is not a fallback.** `?? DEFAULT` applies per **null column** (service) / **undefined
  query** (client), never per empty array — a user who moved every field out of Advanced must keep an
  empty `advancedFields`, not silently re-inherit the defaults.
- **`builtInPropertyPlacements` is a map, resolved `{ ...defaults, ...stored }`** (not an array) so a
  future hidden-by-default slug stays hidden for users with a saved row that predates it.
- **User-property Hidden vs built-in Hidden differ in reach.** Card 3 writes `hiddenFromForm`, which
  hides the property from **all** bookmark forms (create and edit); Card 2's slug placements are
  create-only. Card copy surfaces this.
- **Don't touch `BookmarkPropertiesForm.tsx`'s `builtInHiddenSlugs`** (the YouTube runtime/date-posted
  swap) — a separate consumer, unrelated to this tab.
- **The old per-property "Main bookmark form" / "Show outside Advanced area" checkboxes are gone.**
  `PropertyDisplaySection` now only links to this tab; placement is centralized. Don't reintroduce them.
- **The Preview dialog never needs a settings-override prop.** This tab auto-saves every toggle
  immediately (no local/unsaved draft state), so `useBookmarkAddFormConfig()`'s query cache is always
  the latest saved value — the same cache `BookmarkRevealedFields` reads. "Preview with current
  settings" is simply "render the real form," nothing more.
