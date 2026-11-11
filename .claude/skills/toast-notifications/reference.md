# Reference: moved from CLAUDE.md

These sections were moved verbatim out of the root `CLAUDE.md` when it was slimmed to an index. Mentions of "CLAUDE.md → <section>" elsewhere (code comments, other skills) refer to the sections below.

## Edit-tab auto-save standard

Every slug-routed entity **edit** tab (Categories, Custom Properties, Websites, Media Types, YouTube
Channels, Tags, Autofill) **auto-saves per field — there is no Save button.** Each
field persists on its own and fires a toast that **names the field** and is recorded in the
Notifications log (the header **bell popover**, `components/NotificationsBellPopover.tsx`, over the
`notificationStore` — this is the history home since the right drawer was removed in issue #1108).
There are exactly **two** engines, both toasting via
`lib/autoSave.ts` (`notifyFieldSaved` / `notifyFieldSaveError` wording): **per-field** saves go
through `hooks/useFieldAutoSave.ts` (the `saveField` engine: single-field PATCH, deep-equal no-op
skip, invalid skip, success-only snapshot advance); **whole-collection debounced saves** — a tab
persisting one value *set* with one section-named toast — go through
`hooks/useCollectionAutoSave.ts` (serialize-compare no-op skip, shared debounce, success-only
snapshot advance; behind the bookmark Properties / Languages / Names / Related tabs and the
property scope sections). Don't hand-roll either shape. **Reference:
`components/CategoryGeneralForm.tsx`.** The full recipe + rules live in the **`toast-notifications`**
skill — consult it before building or changing an edit tab. In short:

- **Trigger:** text/textarea save **on blur**; toggles/selects/checkboxes/comboboxes save **on
  change**. Keep `useAppForm` + the zod schema for field state/validation, but **delete** the `<form
  onSubmit>` wrapper, `<form.SubmitButton>` / `requireDirty`, and any manual `JSON.stringify` dirty
  check. The `lib/form.tsx` primitives already expose `onBlur` (text/number) and `onValueChange`
  (select/combobox) hooks — wire them; don't fork the primitives.
- **Invalid/failed saves keep the user's input** (never revert); the field-named error toast + the
  inline field error are the only feedback. An invalid value simply doesn't fire a save.
- **Name fields drive the slug** — pass `saveField`'s `opts.onSuccess` to navigate to the new slug
  when it changes (the on-blur trigger keeps this from firing mid-typing).
- **Multi-key sections** (e.g. `categoryIds` + `allCategories`) call `update.mutate({ … both … })`
  directly with one `notifyFieldSaved("Categories")` so the user sees a single section toast;
  association/toggle tabs (`CategoryCustomProperties`) just add the `notify*` callbacks to their existing
  mutation.
- **Exceptions:** **create** flows (create pages, right-panel create, inline-create modals) keep an
  explicit submit button — `PropertyForm` (full) and `TagForm` stay submit-driven for create while
  their per-tab **edit** forms auto-save. **Bookmark edit** also auto-saves per field now (General tab
  scalars via `useFieldAutoSave` + a bespoke `saveUrl`; the Properties tab debounce-persists the whole
  value set like the Languages tab, one "Properties" toast; the Related tab debounce-persists the
  relationship set the same way via `useCollectionAutoSave` — one "Related bookmarks" toast, and an
  incomplete draft row never fires a save) — the **only** Save button left on bookmark
  edit is the Image tab's, which applies the staged multi-image picker intent (uploads/kept/main/
  removals) that can't be expressed as a single field; every other Image action already saves
  immediately. **Bookmark edit is now the single layout-driven `?tab=` route (#1163)** — the per-tab
  route quartet is gone; each edit tab body is the `"bookmark"` field registry's `edit` renderer wrapping
  the **same** form component (`BookmarkGeneralForm` / `BookmarkRelatedForm` / `BookmarkPropertiesForm` /
  `LanguageUsagesTabEditor` / `BookmarkImageEditForm` / `BookmarkVideoEditForm`), so none of these save
  semantics changed; the General Delete danger zone is a `BookmarkEditView` fixture (bookmarks are
  id-routed, off the workbench `useDelete` control). See **Content hierarchies → Bookmarks are
  layout-driven**. `LocationAncestorsSection`'s "Save ancestors" button is the one documented
  entity-edit exception beyond create flows (multi-location create-and-reparent can't be expressed
  as a single field save; it still fires field-named toasts). **Settings-page inline managers**
  (place types, location relations, usage levels, taxonomies, …) toast every rename/mutation with
  `notifySuccess`/`notifyError` — a server write with no toast is a bug, not a style choice.
  **Local-only Zustand prefs** stay instant with **no toast**
  (nothing persists server-side). The no-toast carve-out is **only** for *ephemeral, device-local
  view prefs* in `uiStore` — what now remains there is `theme`, `collapsedSidebarSections`, the
  physical sizing (`sidebarWidth`/`tableColumnWidths`), open/closed state
  (`addBookmarkFormOpen`/`collapsedHomepageSectionIds`), the page-level listing prefs
  (`bookmarkColumns`/`viewMode`/`bookmarkImageMode`/…), and the transient filter/header state. A
  setting that must **stick across devices/browsers** belongs in the server-side `app_settings`
  singleton (`services/appSettings.ts` + `hooks/useAppSettings.ts`), **not** `uiStore` — and once it
  persists server-side it **does** fire a specific, recorded toast on save like any other persisted
  setting. The **Display / Sidebar (Drawer) / Automations** settings pages were migrated this way
  (issue #410, mirroring the **Advanced** Coolify/docs/Storybook fix): the sidebar-visibility lists,
  auto-fetch, bookmark-detail media sizing/layout, the listing search-box
  pin (`searchBoxPinned`), and the built-in Cropped W/H are server-backed groups
  (`/api/app-settings/{sidebar-customization,automation,display-preferences}`), read via convenience
  hooks (`useCroppedWidth`, …) and written with a `notifySuccess` toast —
  **including the inline popovers** that set the same prefs (detail-layout) and the on-blur Cropped
  W/H inputs. Don't misclassify a should-persist setting as a local pref: that's exactly what shipped
  those pages toast-less (and non-syncing) before the move. (The drawer-era `panelPinned`/
  `drawerUnpinnedBreakpoints`/`sidebarOpenModifier` keys were removed end to end — type, column,
  service, schema, hooks — in the conventions-audit sweep; `migrate.ts` drops the columns.) Known
  device-local `uiStore` keys flagged as *future server-migration candidates* (deliberate, pending an
  owner decision — don't treat them as precedent for new should-persist keys):
  `hideLocationMapAdminBorders`, `bookmarkGraphSpacing`, and the three global sort modes
  (`locationSortMode`/`categorySortMode`/`websiteSortMode`). (The former `selectedDisplayPreset` /
  `hiddenCardFields` / `bookmarkImageLayout` / `bookmarkCornerOverlays` per-page keys were **deleted**,
  not migrated: the Card Display consolidation removed every reader, so they were dead state the store
  kept persisting. The persist `version` bump to 3 drops them from existing browsers' stored blobs.)
