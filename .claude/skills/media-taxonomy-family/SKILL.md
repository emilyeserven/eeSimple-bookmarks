---
name: media-taxonomy-family
description: >-
  Understand and extend the Plex/Kavita-backed media taxonomy family in eeSimple Bookmarks — Media
  Properties, Movies, TV Shows, Episodes, Artists, Albums, Tracks (all Plex-backed), and Books
  (Kavita-backed), plus their shared Image gallery. Use when asked to "add a field to Movies/TV
  Shows/Books/etc.", "add a new Plex-backed taxonomy" (e.g. a future Podcasts/Audiobooks entity),
  "change the Linked to Plex/Kavita box", "add an auto-fetch image source", "add an Image tab to a
  taxonomy entity", or before touching any `Plex*`/`*TaxonomyImage*`/`services/movies.ts` (or its five
  siblings)/`services/books.ts` file. Also covers maintaining the family — "the Plex link box doesn't
  show the item name", "a new field only shows up on some of the six Plex entities", "the image
  gallery cap/auto-fetch button is wrong for X".
---

# The Plex/Kavita-backed media taxonomy family

Eight sibling taxonomies live under `/taxonomies/`, all added across PRs #896–909:

- **Media Properties** — a flat franchise/IP grouping (e.g. "The Lord of the Rings"). No external
  service link; entities below optionally point at one via a nullable `mediaPropertyId`.
- **Movies, TV Shows, Episodes, Artists, Albums, Tracks** — **Plex-backed**. Identical shape:
  `id, name, romanizedName, slug, sortOrder, mediaPropertyId, plexRatingKey, plexItemType,
  plexItemTitle, year, createdAt` (Episode adds a `tvShowId` parent; Track adds an `albumId` parent).
- **Books** — **Kavita-backed**. Same shape but `kavitaSeriesId, kavitaLibraryId, kavitaSeriesName,
  isbn, releaseYear` instead of the Plex/year columns.

Each is a normal slug-routed entity (services/routes/hooks/workbench — see the `add-entity` skill for
that baseline); this skill covers what's specific to this family: the **shared generic components**,
the **denormalize-at-link-time** convention, and the **shared image gallery**.

## The shared Plex components — add a field ONCE, it covers 6 entities

Movies/TV Shows/Episodes/Artists/Albums/Tracks do **not** each have their own edit/view/create form.
They share three generic components, typed over a structural `PlexTitle` interface:

- `packages/client/src/components/PlexTitleGeneralForm.tsx` — the auto-save edit form
  (`PlexTitleGeneralForm<E extends PlexTitle>`). Owns the Name/Romanized name/Sort order/Media
  property/Year fields and the "Linked to Plex" box + `PlexItemLookup`.
- `packages/client/src/components/PlexTitleGeneralView.tsx` — the read-only View tab counterpart.
- `packages/client/src/components/PlexTitleForm.tsx` — the shared **create** form, chosen by a `kind:
  PlexKind` prop (`"movie"|"show"|"episode"|"album"|"artist"|"track"`).

Each entity's own files (`MovieGeneralForm.tsx`, `workbench/movie.tsx`, etc.) are thin wrappers that
just supply `entity`, `kind`, and the entity's own `useUpdateMovie`-style mutation. **To add a field to
all six Plex-backed entities, edit these three shared files once** — do not add six copies. This is
why `romanizedName` and the descriptive Plex box (below) only needed one edit here, unlike the
per-entity `romanizedName` duplication that Tags/Categories/Authors/Publishers/MediaTypes/Locations
still carry (a pre-existing inconsistency this family deliberately avoided).

Books are **not** part of the `PlexTitle` abstraction (different linkage shape), so `BookForm.tsx` /
`BookGeneralForm.tsx` / `workbench/book.tsx` are hand-rolled and any field added to Books needs its own
edit in each of those three.

## Denormalize the linked item's name at link time

Neither Plex nor Kavita item ids are meaningful to a human, so every linked-entity display needs the
**name**, not just the id. Rather than a live round-trip on every render, the name is captured once
when the link is made and stored alongside the id:

- Plex-backed entities: `plexItemTitle` (set in `applyPlex()`/cleared in `clearPlex()` in
  `PlexTitleGeneralForm.tsx`, and in `applyCandidate()` in `PlexTitleForm.tsx` for create — the value
  comes from `PlexItemResult.title`, already returned by the search, so this is free). Rendered as
  `Linked to Plex: {plexItemTitle ?? "Untitled"} (#{plexRatingKey})` in the edit box
  (`PlexTitleGeneralForm.tsx`) and the View tab's `PlexItemValue` (`PlexTitleGeneralView.tsx`).
- Books: `kavitaSeriesName`, same idea, set in `BookForm.tsx`/`BookGeneralForm.tsx`'s
  `applyCandidate()`/`applyKavita()`.

**If you add a new way to link one of these entities (or a new Plex/Kavita-backed sibling), denormalize
the display name the same way** — don't make the box/view do a live Plex/Kavita API call just to show
a name that was already in hand at link time.

## Romanized name

All 7 non-Media-Property entities have `romanizedName` (nullable, matches the established
Tags/Categories/etc. pattern: DB column + typed field + `RomanizedLabel` on the View tab). For the six
Plex-backed ones it lives in the shared `PlexTitleGeneralForm`/`PlexTitleGeneralView` (one edit, all
six); for Books it's hand-rolled in `BookGeneralForm.tsx`/`BookForm.tsx`. The page header `<h1>` in
each entity's `._view.tsx` route renders `<RomanizedLabel name={entity.name}
romanized={entity.romanizedName} />` instead of the bare name — do this for any new sibling too.

## The shared Image gallery — `taxonomyImages`

Every one of the 7 entities has an "Image" tab: a multi-image gallery (up to `MAX_TAXONOMY_IMAGES = 12`
per entity, one flagged `isMain`) with an entity-appropriate "pull from the linked service" auto-fetch
action. This is **not** per-entity plumbing — one polymorphic system serves all seven, because
`bookmark_images`' multi-image machinery is bookmark-specific and duplicating it 7× would be exactly
the kind of copy-paste this codebase avoids.

- **Schema**: `taxonomy_images` (`packages/middleware/src/db/schema.ts`) — `ownerType` (one of
  `TAXONOMY_IMAGE_OWNER_TYPES = ["movie","tvShow","episode","artist","album","track","book"]`) +
  `ownerId`, no FK (a single table can't FK into seven owner tables), indexed on `(ownerType,
  ownerId)`.
- **Service**: `services/taxonomyImages.ts` — `addTaxonomyImage`/`listTaxonomyImageRows`/
  `setMainTaxonomyImage`/`removeTaxonomyImage`, generic over `(ownerType, ownerId)`. Mirrors
  `services/bookmarkImages.ts`'s multi-image functions but against this shared table.
- **Routes**: `routes/taxonomyImageRoutes.ts` exports `registerTaxonomyImageRoutes(app, basePath,
  ownerType, tag, autoFetchActions)` — one call per entity's route file registers list/upload/
  set-main/delete plus each auto-fetch action as `POST ${basePath}/:id/images/<action-path>`.
  **The byte-serving route `GET /api/taxonomy-images/:imageId` is registered exactly ONCE**, via
  `registerTaxonomyImageServingRoute(app)` in `app.ts` — do not call it per entity, Fastify rejects a
  route path registered twice. (This is the one gotcha that bit the first implementation pass.)
- **Auto-fetch sources**: `importPlexPosterForTaxonomy(ownerType, ownerId)` in `services/plex.ts`
  (reads the entity's own `plexRatingKey` directly, calls the existing `fetchPlexPoster`);
  `importKavitaCoverForBook(bookId)` in `services/kavita.ts`; `importIsbnCoverForBook(bookId)` in
  `services/isbn.ts`. Each is a thin wrapper reusing an already-generic fetch primitive — adding a new
  source means writing one function like these, not new external API integration.
- **Client**: `hooks/useTaxonomyImages.ts` (generic hook, parametrized by API + owner id + query key) +
  `components/TaxonomyImageGallery.tsx` (the shared grid/upload/auto-fetch UI — every action is
  **immediate**, no staged intent or Save button, matching this app's per-field auto-save convention
  for taxonomy edit tabs) + `lib/api/taxonomyImages.ts`'s `createTaxonomyImageApi(basePath)`.
  `components/PlexTaxonomyImageTab.tsx` wraps these for the six Plex-backed entities (one "Use Plex
  poster" action, gated on `connectors.plex.enabled && entity.plexRatingKey !== null`);
  `components/BookImageTab.tsx` is Books' equivalent (two actions: Kavita cover + ISBN cover).

### Recipe: add a new auto-fetch source to an existing entity

1. Write a `services/<source>.ts` function `import<Source>For<Entity>(id)` that resolves whatever the
   entity needs (an id/key already on its own row) and calls `addTaxonomyImage(ownerType, id, bytes,
   "<source>", { setMain: true })`.
2. Add one entry to that entity's `registerTaxonomyImageRoutes(...)` call in its route file: `{ path:
   "<source>", run: id => import<Source>For<Entity>(id), errorMessages: {...} }`.
3. Add one entry to the `autoFetchActions` array passed into its `PlexTaxonomyImageTab`/`BookImageTab`
   usage (or a new per-entity wrapper if the entity has a source no sibling shares).

### Recipe: add an 8th sibling entity (e.g. a future Podcasts taxonomy)

1. Scaffold it as a normal slug-routed entity (`add-entity` skill) with the standard Plex-backed shape
   above (or the Kavita-backed shape if it's book-like).
2. Wrap the three shared Plex components (`PlexTitleGeneralForm`/`View`/`Form`) the way `MovieGeneralForm.tsx`/
   `workbench/movie.tsx` do — don't hand-roll a new edit/view/create form.
3. Add its `ownerType` literal to `TAXONOMY_IMAGE_OWNER_TYPES` (schema.ts) and `TaxonomyImageOwnerType`
   (`packages/types/src/taxonomyImages.ts`), give it a `.images = createTaxonomyImageApi(...)` in
   `lib/api/taxonomies.ts`, and add its `registerTaxonomyImageRoutes(...)` call with a "Use Plex poster"
   auto-fetch action.
4. Add the `"image"` tab to its workbench descriptor and the `._view.image.tsx`/`.edit.image.tsx` route
   pair (see the `tabbed-pages` skill for the general tab-adding recipe) — use Movies' pair as the
   literal template.
