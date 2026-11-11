# Reference: moved from CLAUDE.md

These sections were moved verbatim out of the root `CLAUDE.md` when it was slimmed to an index. Mentions of "CLAUDE.md → <section>" elsewhere (code comments, other skills) refer to the sections below.

## Outside-source sync

Any entity that pulls fields from an outside source gets a **header-strip "Sync from source" button**
that opens a **review modal** (current value vs the source's new value, per-row overwrite checkboxes).
It's the single review layer over the scattered one-shot rescan / re-fetch-image actions. **To wire a
new source, see the `sync-from-source` skill** — don't re-implement the modal or header plumbing.

- **Register-on-mount, one place per surface.** A mounted **edit form** publishes a `SyncProvider` into
  `uiStore.syncProvider` via `useRegisterSyncProvider` (mirrors `uiStore.listingPage` /
  `useRegisterBulkSelect`); `syncFromSourceAction` (`components/header/toolbarSyncAction.tsx`) renders
  the button **only while a provider is registered**, so the button appears on edit surfaces with no
  per-entity header code. The modal is a single store-driven `AppSyncModal` (mirrors
  `AppAddBookmarkModal`) opened by the header button, the mobile menu item, and the CMD+K
  `SyncFromSourceCommandItem` — all just flip `uiStore.syncModalOpen`.
- **A provider is two halves.** `descriptorKind` (`bookmark` / `location` / `image-taxonomy`) selects
  the modal-side **fetch hook** (`use{Bookmark,Location,ImageOnlyTaxonomy}SyncSource`, each gated on the
  modal being open); the **registration hook** (`use*SyncRegistration`, in the entity's edit form)
  builds `applyStaged` closing over the live form. Diff-building is a **pure, unit-tested** helper in
  `lib/syncSources/{bookmark,location,imageTaxonomy}Diff.ts` (`fillEmptyDefault` for the checkbox
  default, `rowDiffers` to skip in-sync fields). Types live in `lib/syncSources/syncSourceTypes.ts`.
  Each fetch hook's own pending/error/group-assembly logic is a thin `SyncQuerySlot[]` description
  handed to the shared pure `resolveSyncSourceFetch` (`lib/syncSources/syncSourceQuery.ts`, also
  home to the `strRef`/`numRef` ref-readers) rather than a hand-rolled conditional chain per source.
- **Stage vs immediate.** Text/data rows **stage** into the form and persist through its own save —
  per-field auto-save everywhere now, including bookmarks (the bookmark sync registration threads an
  `onFieldStaged` callback that re-runs the General tab's title/description auto-save after staging).
  **Image rows apply immediately** (`applyImmediately: true`) — every image source stores-on-fetch and
  can't be staged.
  Keep providers referentially stable (memoize the provider, stabilize `applyStaged` via a `useRef` of
  the latest deps) or the register-effect thrashes the store.
- **Locations** get a **default-off re-geocode toggle** (`supportsRegeocode`): off = fill empty fields;
  on = force-overwrite coordinates + boundary via `repullCoordinates` (never sync the name/English
  name — they drive the slug). Respect the `locations-map` skill + `lib/locationLevels.ts` doc block.
- **Image-only taxonomy previews.** Since image sources store-and-apply with no preview, each source
  exposes a **resolve-URL GET** so the modal can show the incoming image: public-URL sources return
  `GET …/image/source-preview` → `{ imageUrl }` (YouTube channel / website / person; the resolver reuses
  the same helpers the store path uses so preview == applied); token-gated Plex streams
  `GET /api/plex/poster?ratingKey=` as bytes. Registered in the three inline general forms + the shared
  `PlexTaxonomyImageTab` (one registration covers all six Plex taxonomies).
