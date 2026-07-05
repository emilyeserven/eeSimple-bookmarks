---
name: bookmark-add-form
description: >-
  Manage and extend the Add Bookmark form field-placement system in eeSimple Bookmarks — the central
  Settings → Display → Bookmark Add Form tab that decides, per field, whether the quick create form
  shows it in the main area (Default), the collapsible Advanced section, or hides it. Use when asked
  to "add a field to the Add Bookmark form", "make X placeable on the add form", "hide a built-in
  property from the add form", "add a row to the Bookmark Add Form settings", "move an add-form field
  to Advanced/hidden by default", "change what the create form shows", or "why doesn't my new
  property/field appear when adding a bookmark". Mirrors how the standard fields (including the
  taxonomy/media/location relations Groups, Genres & Moods, Locations, Media links, and the two
  blacklists) and the 8 built-in detail slugs became placeable. Create-mode only — edit surfaces are
  deliberately unaffected.
---

# Manage the Add Bookmark form field placement

Field placement on the **create** Add Bookmark form is configured **centrally**, not hardcoded per
field. One settings tab (`Settings → Display → Bookmark Add Form`, `/settings/display/bookmark-add`)
sorts every field into **Default** (main area), **Advanced** (collapsible section), or **Hidden**.
This is **create-mode only** (`!isEdit`) — edit surfaces render as before and stay editable.

## The three kinds of placeable field

| Kind | Stored as | Edited via |
|---|---|---|
| **Standard fields** — `title`, `names`, `categoryId`, `mediaTypeId`, `languageId`, `groupId`, `descriptionTags`, `personIds`, `image`, plus the taxonomy/media/location relations `groupIds` (creators, plural), `genreMoodIds`, `locationIds`, `mediaLink` (six book/movie/tvShow/episode/album/track FKs), `blacklistedTagIds`, `blacklistedLocationIds` (the last six **default Hidden**) | the server-side `bookmark-add-form` app-settings group — `standardFieldPlacements` **map** keyed by field, resolved `{ ...DEFAULT, ...stored }` | Card 1 of the tab |
| **Built-in detail properties** (`BOOKMARK_FORM_DETAIL_SLUGS`: runtime, date-posted, content-status, page-progress, page-range, page-sections, chapters, url-sections) | the same group's `builtInPropertyPlacements` map, keyed by slug, resolved `{ ...defaults, ...stored }` | Card 2 of the tab |
| **User custom properties** | the property's own `showInForm` / `hiddenFromForm` flags | Card 3 of the tab, via `useUpdateCustomProperty` |

`url` is always shown and is intentionally **not** placeable. Card 3 lists **all** enabled custom
properties regardless of category/media-type lock, but the **lock stays the ultimate runtime gate** — a
locked property still only renders on the create form when a matching category/media type is selected
(the scope short-circuit in `selectVisibleFormProperties` runs before placement and is not bypassed).

## The pieces

- **Shared types** — `packages/types/src/bookmarkAddForm.ts`: the `BOOKMARK_ADD_FORM_STANDARD_FIELDS`
  tuple (→ `BookmarkAddFormStandardField`), `BOOKMARK_ADD_FORM_PLACEMENTS` (`default`/`advanced`/
  `hidden`), `BOOKMARK_FORM_DETAIL_SLUGS` + the 8 `*_SLUG` constants (re-exported by
  `components/bookmarkFormSchema.ts` so existing importers are unchanged),
  `BookmarkAddFormSettings` (`standardFieldPlacements` + `builtInPropertyPlacements`, both
  `Record<key, placement>`), and `DEFAULT_BOOKMARK_ADD_FORM_SETTINGS` (`title`/`names` →
  `default`, the six original taxonomy fields + `image` → `advanced`, the six newer relations + all
  detail slugs → `hidden`). Shared by middleware and client.
- **Middleware group** (`bookmark-add-form`) — nullable jsonb columns on `appSettings` in `db/schema.ts`
  (push-safe additive): `bookmarkFormStandardPlacements` (the current standard-field map) +
  `bookmarkFormBuiltInPlacements`, plus the **legacy** `bookmarkFormAdvancedFields`/
  `bookmarkFormHiddenFields` arrays kept only so `resolveBookmarkAddFormSettings` can derive the map for
  a pre-existing row on first read. `getBookmarkAddFormSettings` / `updateBookmarkAddFormSettings` +
  `asBookmarkAddFormPlacements` normalizer + `resolveBookmarkAddFormSettings` in `services/appSettings.ts`,
  and `GET`/`PUT /api/app-settings/bookmark-add-form` in `routes/appSettings.ts`. Mirrors the
  `sidebar-customization` group — see the **`app-settings-group`** skill.
- **Client plumbing** — `lib/api/settings.ts` (`getBookmarkAddForm`/`updateBookmarkAddForm`);
  `hooks/useAppSettings.ts` (`useBookmarkAddFormSettings`, `useUpdateBookmarkAddFormSettings`,
  `useBookmarkAddFormConfig` = `data ?? DEFAULT_BOOKMARK_ADD_FORM_SETTINGS`).
- **Resolver** — `lib/bookmarkAddForm.ts` `resolveBookmarkAddForm(settings, isEdit)` → `{ mainStandardFields,
  advancedStandardFields, mainHiddenSlugs, advancedHiddenSlugs, placementOverrides }`. **Create mode**
  buckets each field by `settings.standardFieldPlacements[field]` (`hidden` skipped, `advanced` →
  Advanced, else main). **Edit mode ignores `settings`** and derives the split from
  `DEFAULT.standardFieldPlacements` — `default` → main, `advanced` → Advanced, `hidden` → **excluded**
  (so the newer hidden-by-default relations never render on edit); main hides all 8 detail slugs, advanced
  hides runtime/date-posted. Consumed via `hooks/useBookmarkAddFormVisibility.ts` (settings query + `useMemo`).
- **Form render** — `components/BookmarkRevealedFields.tsx` calls `useBookmarkAddFormVisibility` and
  renders standard fields through `components/bookmarkAddFormFields.tsx`'s `BookmarkStandardFieldZone`
  (an **exhaustive** `Record<BookmarkAddFormStandardField, (props) => ReactNode>` dispatch — a missing
  key fails `tsc`), then custom fields via `RevealedCustomFields` / `BookmarkAdvancedSection`, threading
  `hiddenSlugs` + `placementOverrides` into `selectVisibleFormProperties` (`bookmarkFormProperties.ts`).
  Each relation field is its own small `Bookmark*Field` component (form-state-driven, `useEntityCreateOption`
  inline-create) — e.g. `BookmarkGroupsField`, `BookmarkGenreMoodsField`, `BookmarkLocationsField`,
  `BookmarkExcludedTagsField`, `BookmarkExcludedLocationsField`, `BookmarkMediaLinkField` (the create
  wrapper over the selection-driven `BookmarkMediaField`).
- **Settings page** — `components/DisplayBookmarkAddSettings.tsx` (3 shadcn `<Card>`s of
  `SegmentedToggleRow`s; `STANDARD_FIELD_ICONS` per field; plus a **Preview** button opening
  `components/BookmarkAddFormPreviewDialog.tsx` — a `<BookmarkForm previewMode />` in a `Dialog`, so
  field placement can be checked without leaving the settings page) +
  `hooks/useBookmarkAddFormSettingsPage.ts` (state + per-row save handlers + field-named toasts;
  `BOOKMARK_ADD_FORM_STANDARD_LABELS`; `standardFieldPlacement` reads the map, `setStandardFieldPlacement`
  writes one map entry). Route
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

**Make a new standard field placeable** (a new user-pickable create-form field) —
1. add its key to `BOOKMARK_ADD_FORM_STANDARD_FIELDS` **and** an entry in
   `DEFAULT_STANDARD_FIELD_PLACEMENTS` (→ `DEFAULT_BOOKMARK_ADD_FORM_SETTINGS.standardFieldPlacements`) —
   default a brand-new relation to `"hidden"` so the create form is unchanged until opted in;
2. a `BOOKMARK_ADD_FORM_STANDARD_LABELS` entry in `useBookmarkAddFormSettingsPage.ts` and a distinct
   `STANDARD_FIELD_ICONS` entry in `DisplayBookmarkAddSettings.tsx`;
3. a render entry in the `FIELD_RENDERERS` dispatch in `bookmarkAddFormFields.tsx` — usually a small
   form-state `Bookmark*Field` component mirroring `BookmarkPeopleField` (`form.Field` + a combobox +
   `useEntityCreateOption`). Auto-gates (render `null` when a value is absent) live inside it.

`tsc` enforces the label, icon, and dispatch entries (all three are `Record<BookmarkAddFormStandardField, …>`).

If the relation isn't already in the create form's state/payload, also: add its field(s) to
`bookmarkSchema` + `SAMPLE_DEFAULT_VALUES` + `buildBookmarkDefaultValues` (`bookmarkFormSchema.ts`) and
forward it in the create payload in `useBookmarkFormHandlers.ts` (the media-link `bookId`…`trackId` FKs
needed this; `genreMoodIds`/`locationIds`/`groupIds`/blacklists were already in state and the endpoint
already accepted them). See step 6 of the **`add-entity`** skill for the surrounding form/schema wiring.

**Add a new app-settings key** (a global add-form knob) — extend the group per the
**`app-settings-group`** skill: a nullable jsonb column, the resolver's `?? default`, the PUT
JSON-schema body, and the client hooks.

## Gotchas

- **Create-mode only.** Any placement change must leave edit surfaces byte-for-byte as before —
  `resolveBookmarkAddForm(settings, /* isEdit */ true)` derives its split from
  `DEFAULT.standardFieldPlacements` (ignoring `settings`) and returns no `placementOverrides`. A new
  field that defaults to `hidden` is **excluded** from the edit split, so it never renders on edit.
  Don't route settings into the edit path.
- **Standard-field placement is a map, resolved `{ ...DEFAULT, ...stored }`** — the same pattern as
  `builtInPropertyPlacements`. This replaced the old `advancedFields`/`hiddenFields` arrays, whose
  "absence = main area" model couldn't express a per-field default (a newly-added field would show in
  Default for existing saved rows). With the map, "Default/main" is stored as an explicit
  `{ field: "default" }` entry (not an absence), and an untouched field inherits its default — so a new
  `hidden`-default relation stays hidden for everyone, no boot backfill. The middleware derives the map
  from the legacy array columns once for a pre-existing row (`deriveStandardPlacementsFromLegacyArrays`).
- **The category-lock is the ultimate runtime gate for custom properties.** Card 3 lists every enabled
  custom property regardless of lock, but a category-locked property still only renders on the create
  form when a matching category/media type is selected. Don't bypass the scope short-circuit in
  `selectVisibleFormProperties` — placement never overrides the lock (deliberate).
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
