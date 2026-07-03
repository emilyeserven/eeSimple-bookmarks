---
name: sync-from-source
description: >-
  Add or extend the "Sync from source" header button + review modal in eeSimple Bookmarks — the
  header-strip control that re-pulls an entity's fields from its outside source (a bookmark's URL
  scan, a location's geocoder, a taxonomy's source image), shows current-vs-source values with
  per-row overwrite checkboxes, and stages the picked values into the edit form (or applies images
  immediately). Use when asked to "add a sync button for X", "let users re-pull X from its source",
  "add X to the sync modal", "show current vs source values for X", "wire a new source into the sync
  flow", or "add a preview endpoint for a source image". Mirrors how bookmarks (scan), locations
  (geocode), and the image-only taxonomies (YouTube/website/person/Plex) were wired.
---

# Sync from outside source

The header-strip **Sync** button lets a user re-pull an entity's fields from its outside source, review
a **current vs source** diff, tick which fields to overwrite, and apply. It's the review layer over the
scattered one-shot "rescan"/"re-fetch image" actions. Nothing persists until the entity's own save path
runs — except image rows, which apply immediately.

## The mechanism (register-on-mount, mirrors `uiStore.listingPage`)

A mounted **edit form** publishes a `SyncProvider` into `uiStore.syncProvider` via
`useRegisterSyncProvider(provider)` (clears on unmount, also closing the modal). The header renders the
Sync button **only while a provider is registered** (`syncFromSourceAction` gates on `ctx.syncProvider`),
so it shows on edit surfaces and nowhere else. There is no per-entity-type logic in the header.

- **Types:** `lib/syncSources/syncSourceTypes.ts` — `SyncProvider`, `SyncFieldDiff`, `SyncDiffGroup`,
  `SyncDiff`, `SyncSourceFetch`, plus `fillEmptyDefault` / `rowDiffers`.
- **Store:** `uiStore.syncProvider` (the descriptor) + `uiStore.syncModalOpen` (the modal flag). Both
  transient (not in `partialize`).
- **Modal:** one store-driven `AppSyncModal` at the app-header level (`routes/-appHeader.tsx`), mirroring
  `AppAddBookmarkModal`. The header button (`SyncActionButton`), the mobile menu item
  (`SyncActionMenuItem`), and the CMD+K item (`CommandPalette` → `SyncFromSourceCommandItem`) all just
  flip `syncModalOpen`, so there's one modal instance.
- **Modal body:** `SyncFromSourceModal.tsx` + controller `useSyncFromSourceModal.ts` + row components
  `SyncDiffRow.tsx` / `SyncImageDiffRow.tsx`. The controller dispatches to the per-kind fetch hook
  (each gated on `open && kind`), seeds the checkbox selection from each row's `defaultChecked`
  (fill-empty), drives the locations re-geocode toggle (default off → select-all when on), and on Apply
  hands the selected rows to `provider.applyStaged`.

## A provider has two halves

`descriptorKind` (`"bookmark" | "location" | "image-taxonomy" | "plex-title" | "podcast-feed"`) selects
the **fetch hook**; the **registration hook** builds `applyStaged` closing over the live form. Split so
fetching stays in the modal (gated on open) and applying has the form state.

| Kind | Fetch hook | Diff builder (pure, tested) | Registration hook | applyStaged |
|---|---|---|---|---|
| `bookmark` | `useBookmarkSyncSource` (`/api/scan`) | `lib/syncSources/bookmarkDiff.ts` | `useBookmarkSyncRegistration` (in `BookmarkGeneralForm`) | title/description → `form.setFieldValue` (Save persists); image → `useAutoBookmarkImage` (immediate) |
| `location` | `useLocationSyncSource` (`/api/locations/lookup`) | `lib/syncSources/locationDiff.ts` | `useLocationSyncRegistration` (in `LocationGeneralForm`) | per-field `setFieldValue`+`saveField`; re-geocode on → force `repullCoordinates` for coord/boundary rows |
| `image-taxonomy` | `useImageOnlyTaxonomySyncSource` (`…/image/source-preview` or the Plex poster proxy) | `lib/syncSources/imageTaxonomyDiff.ts` | `useImageTaxonomySyncRegistration` (in each general form + `PlexTaxonomyImageTab`) | the row → the caller's existing auto-fetch/import mutation (immediate) |
| `plex-title` | `usePlexTitleSyncSource` (`…/:id/plex-metadata-preview` for the resolved Wikidata names/links + the Plex poster proxy) | `lib/syncSources/plexTitleDiff.ts` | `usePlexTitleSyncRegistration` (in `PlexTitleGeneralForm`) | text rows (native/romanized names + Wikipedia links) → `form.setFieldValue`+`saveField` (name follows the slug); poster row → the image gallery's `plex-poster` auto-fetch (immediate) |
| `podcast-feed` | `usePodcastSyncSource` (`…/:id/feed-preview`, resolve-only RSS/iTunes metadata via `podcastsApi.feedPreview`) | `lib/syncSources/podcastDiff.ts` | `usePodcastSyncRegistration` (in `PodcastGeneralForm`) | text rows (name/author/description) → `form.setFieldValue`+`saveField` (name follows the slug); artwork row → the image gallery's `artwork` auto-fetch (immediate). **Keyless** — registers whenever the podcast has a `feedUrl` or `itunesId`, not gated on a connector |

**Why Plex titles aren't `image-taxonomy`:** the five Plex media taxonomies (Movies/TV Shows/Episodes/
Albums/Tracks) sync **text *and* image** — native/romanized names + Wikipedia links resolved
from Wikidata (via the Plex item's external IDs, title-search fallback; the middleware's
`resolvePlexTaxonomyMetadata` reuses the shared `services/wikidata.ts` Action-API client) **plus** the
poster. So they carry their own `plex-title` kind, registered from `PlexTitleGeneralForm` (the poster
half also stays syncable image-only from `PlexTaxonomyImageTab`). The `…/plex-metadata-preview` route is
a **resolve-only** GET (never writes) — the picked text rows persist through the form's per-field
auto-save.

**Stage vs immediate:** text/data rows **stage** into the form (persisted by the form's own save — the
bookmark form's explicit Save, or per-field auto-save for locations/taxonomies). **Image rows apply
immediately** (`applyImmediately: true`) because every image source stores-on-fetch and can't be staged
into a form field.

## Recipes

### Add a new field to an existing provider
Edit that provider's **pure diff builder** (add a `SyncFieldDiff` with a `payload`) and its
**registration hook's `applyStaged`** (handle the new `payload`). Extend the builder's `.test.ts`. Text
fields stage; images set `applyImmediately: true`.

### Add a brand-new syncable entity
1. Pick the `descriptorKind` (reuse `image-taxonomy` for a single source image; else add a new kind to
   the union in `syncSourceTypes.ts` and a new branch in `useSyncFromSourceModal.ts`).
2. Write a **pure diff builder** in `lib/syncSources/` (+ `.test.ts`) — `fillEmptyDefault` for the
   checkbox default, `rowDiffers` to skip in-sync/absent fields.
3. Write a **fetch hook** returning `SyncSourceFetch` (`useQuery` gated on `enabled`).
4. Write a **registration hook** that builds a stable `SyncProvider` (memoize the provider; keep
   `applyStaged` referentially stable via a `useRef` of the latest deps so the register-effect doesn't
   thrash) and calls `useRegisterSyncProvider`. Call it from the entity's **edit** form.
5. **No header edit needed** — the button appears automatically once a provider registers. Do **not**
   add a per-entity CMD+K item; the store-gated `SyncFromSourceCommandItem` already mirrors it.

### Add a preview endpoint for an image source
Image-only taxonomy sources store-and-apply with no preview, so a true current-vs-new needs a GET that
**resolves** the candidate URL without storing:
- **Public-URL sources** (YouTube avatar via `fetchChannelAvatarUrlViaApi` + og:image
  `extractImageUrl`; website favicon via `extractFaviconUrls` → `duckDuckGoIconUrl` fallback; person
  avatar via `fetchSocialProfileImageUrl` / og:image): add a `resolve*ImageUrl(id)` service fn (reusing
  the same helpers the store path uses so preview == applied) and a `GET …/image/source-preview` route
  returning `{ imageUrl: string | null }`.
- **Token-gated sources** (Plex poster): add a bytes-proxy `GET /api/plex/poster?ratingKey=` that
  streams `fetchPlexPoster` with an `image/*` content-type — the client uses that URL as the `<img>`
  src directly (no JSON fetch).
Then point the fetch hook's `previewPath` / plex branch at it.

## Gotchas
- **Referential stability:** a registration hook that rebuilds its provider every render flip-flops the
  store (set → unmount-cleanup → set…). Memoize the provider and stabilize `applyStaged`; for the image
  hook, depend on `applyImage != null` (a boolean), not the callback identity.
- **`applyImage: null` hides the button** — pass `null` when the source is unavailable (connector off,
  no linked item, built-in website, read-only surface) so nothing registers.
- **The button lives on the edit surface**, not the read-only view (the provider registers from the edit
  form). The CMD+K item navigates there implicitly by only showing while a provider is registered.
- **Locations:** never sync name/romanized name (they drive the slug); the re-geocode toggle is
  **default off** (fill-empty), on = force overwrite coordinates + boundary via `repullCoordinates`.
  Respect the `locations-map` skill + the `lib/locationLevels.ts` doc block.

See also: `add-connector` (adding the underlying scan/oEmbed source), `surface-entity-field` (exposing a
field on view/edit first), `toast-notifications` (the auto-save + toast standard staged rows rely on),
`cmd-k-entity-context` (the separate per-entity palette group — Sync is store-gated, not a `fields`
entry).
