---
name: card-field-area
description: >-
  Manage and extend the bookmark-card "Card Fields" area in eeSimple Bookmarks — the per-rule,
  per-zone field placement system behind Settings → Card Display Rules. Use when asked to "add a
  field to bookmark cards", "add a field to the Card Fields area", "add a per-card display control /
  per-field knob", "make X placeable / movable in card display rules", "add a card field zone
  option", "move a property display setting into the card field area", or "manage the card field
  zones". Mirrors how Title / Open Link / More became placeable fields and how the boolean per-field
  knobs (hide-label / show-if-false / clickable / colon / value-order) became `CardFieldPlacement`
  props.
---

# Manage the Card Field area

The "Card Fields" area places each bookmark field into one of **8 zones** and tweaks per-field knobs.
A rule's placements are `CardFieldZones = Record<CardFieldZone, CardFieldPlacement[]>`; **a field key
absent from every zone is hidden**. The four body zones (`card-single-top`, `card-labels`,
`card-table`, `card-single-bottom`) render top-to-bottom, each imposing a *form* (full-width row /
pill / `label:value` table row); the four `image-*` corners overlay the image. Order **within** a
zone matters.

The model + helpers live in `packages/types/src/index.ts`: `CARD_FIELD_ZONES`, `CARD_BODY_ZONES`,
`CardFieldPlacement`, `CardFieldZones`, `emptyCardFieldZones()`, `zoneToCorner()`, `isCardBodyZone()`.

Two distinct extension tasks — pick the one you're doing.

## A. Add a new field to the Card Fields area

A "field" is a standard (non-custom-property) entry like `title` / `description` / `more`. Custom
properties are added automatically (see `eligibleCustomCardFields`), so this is only for new
*standard* fields. Touch points (Title / Open Link / More are the reference):

1. **Field definition (two mirrored lists).** Add `{ key, label }` to `STANDARD_CARD_FIELDS`
   (`packages/client/src/lib/bookmarkCardFieldDefs.ts`) **and** the key to `STANDARD_CARD_FIELD_KEYS`
   (`packages/middleware/src/services/cardDisplayDefaults.ts`) — keep them in sync (the board's
   "Available" tray and the middleware seed both read their own list).
2. **Default zone.** `defaultBodyZone(key)` exists in **both** `cardDisplayDefaults.ts` (middleware)
   and `bookmarkCardValues.ts` (client) — keep them identical. Header-like fields go to
   `card-single-top`; everything else to `card-labels`. `defaultFieldZones()` (middleware seed) and
   `defaultCardFieldZones()`/`fieldPlacementsForCard(undefined, …)` (client no-rule fallback) build
   from it.
3. **Render it.** Add a `case` to `describeField(key)` in
   `packages/client/src/components/BookmarkCardDetails.tsx`, returning the four `FieldRender` forms
   (`inline` pill / `block` full-width / `tableName` + `tableValue`). For an image-corner overlay add
   a branch to `standardFieldOverlayLabel` in `bookmarkCardValues.ts`. If the field needs handlers
   (clicks, menus), thread them in as props from `BookmarkCard.tsx` (see how `editableProperties` /
   `onAutoImage` / `onSave*` reach the `more` field) — never re-add a fixed header.
4. **Restrict zones if needed.** A field with no overlay form (e.g. an action button) should be kept
   out of the image corners: guard it in `CardFieldZoneBoard.moveKey()` (see the
   `HEADER_CARD_FIELD_KEYS` check).
5. **Boot backfill for existing rules.** "Absent = hidden", so existing rules won't show the new
   field until backfilled. Add an idempotent boot step beside `backfillCardDisplayRuleHeaderFields()`
   / `backfillCardDisplayRuleSubZones()` in `services/cardDisplayRules.ts`, wired into `src/index.ts`
   after the other `backfill*` steps (per CLAUDE.md boot ordering). Inject the key into its default
   zone for every rule with non-null `field_zones` that lacks it.

## B. Add a new per-field placement knob

A "knob" is a per-placement option like `scale` / `hideLabel` / `showIfFalse`. Touch points (the
boolean knobs are the reference):

1. **Type.** Add the optional prop to `CardFieldPlacement` (`packages/types/src/index.ts`). Document
   which fields/zones it applies to. If "absent = a non-false default" (like `showLabelColon`),
   say so.
2. **Server schema (mirror).** Add it to the hand-listed `displayProperties.fieldZones` items in
   `packages/middleware/src/routes/cardDisplayRules.ts` (`additionalProperties: false` rejects
   un-listed props). No DB change — `field_zones` is jsonb.
3. **Resolve it.** Add the field to `ResolvedFieldPlacement` and `resolveFieldPlacements()` in
   `packages/client/src/lib/bookmarkCardValues.ts` (apply the default there). Preserve it across a
   drag in `CardFieldZoneBoard.moveKey()`.
4. **Editor control.** Render a control in `CardFieldZoneBoard.tsx` via `patchPlacement(zone, key,
   patch)` — extend `ImagePlacementControls` / `TablePlacementControls`, or add a per-type control
   like `BooleanPlacementControls` (gated on the property `type` via the `properties` prop the board
   already receives).
5. **Consume it.** Read the resolved value in the render path (`buildBookmarkValueItems` /
   `BookmarkCardDetails`). If a formatter needs it (e.g. `formatBooleanBadge`), pass it **in** as an
   argument — don't read it off the `CustomProperty`.

## Non-listing surfaces resolve from the Default rule

Listing cards resolve a per-card rule; the detail/View page, right panel, and table do **not**.
They read the knob from the **Default** rule via `useDefaultFieldZones()`
(`lib/bookmarkCardFields.ts`) + `resolveBooleanDisplay()` / `resolveFieldPlacements()`
(`lib/bookmarkCardValues.ts`) — the precedent set by `useHideWebsiteForYouTube()`. A property absent
from the Default rule's zones falls back to the knob's default. **Never** re-introduce a global
property-level display flag or a per-surface visibility toggle — card appearance is configured only
via rules (see CLAUDE.md → Card Display Rules).

## Verify

```
pnpm build            # types → middleware → client (a shared-type change must propagate)
pnpm typecheck        # additionalProperties:false + the per-type Record maps catch missed surfaces
pnpm test
pnpm lint:fix         # always from repo root
```

Then `pnpm dev` and, in **Settings → Card Display Rules**:

- the new field/knob appears on a field chip, round-trips through a saved rule, and updates the live
  **Card preview**;
- it survives dragging the field between zones;
- listing cards reflect it, and the detail/View page + table reflect the **Default** rule's value;
- existing rules still show pre-existing fields (the boot backfill ran).
