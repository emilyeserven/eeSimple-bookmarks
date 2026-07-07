/**
 * Shared types for the "Sync from outside source" feature — the header-strip Sync button + review
 * modal that lets a user re-pull an entity's fields from its linked outside source (a bookmark's URL
 * scan / Kavita / Plex, a location's geocoder, a taxonomy's source image), see current-vs-source
 * values side by side, and pick which to overwrite.
 *
 * The flow reuses the codebase's register-on-mount store pattern (mirroring `uiStore.listingPage` +
 * `useRegisterBulkSelect`): a mounted EDIT form publishes a {@link SyncProvider} into
 * `uiStore.syncProvider`; the header renders the Sync button only while one is registered; the modal
 * fetches fresh values (dispatching on {@link SyncDescriptorKind}), builds a {@link SyncDiff}, and on
 * Apply hands the selected rows back to the provider's {@link SyncProvider.applyStaged}, which closes
 * over the live form. Nothing persists until the entity's own save path runs (explicit Save for the
 * bookmark form; per-field auto-save for locations/taxonomies) — except image rows, which apply
 * immediately (see {@link SyncFieldDiff.applyImmediately}).
 */

/**
 * Which fetch strategy + apply dispatch the modal uses for a provider. This keys the *fetch hook*,
 * not the concrete entity type — image-only taxonomies (YouTube channel, website, person avatars)
 * share `"image-taxonomy"`. Each carries its specifics in {@link SyncProvider.refs}.
 */
export type SyncDescriptorKind = "bookmark" | "location" | "image-taxonomy";

/**
 * One selectable field-diff row in the modal. `kind: "text"` renders `current | next` as text;
 * `kind: "image"` renders `currentThumb`/`nextThumb` as side-by-side previews. `payload` is an opaque
 * per-row value the owning provider's `applyStaged` interprets (e.g. a language code, an author-names
 * array, an image-mutation key) — the modal never inspects it.
 */
export interface SyncFieldDiff {
  /** Stable id, unique within a provider's diff — used as the selection key and React key. */
  key: string;
  /** Human label shown in the row, e.g. "Title", "Latitude", "Cover image". */
  label: string;
  /** The entity's current local value (null/"" renders as an em dash). */
  current: string | number | null;
  /** The source's fresh value. */
  next: string | number | null;
  /** How the row renders. */
  kind: "text" | "image";
  /** Image rows: current image thumbnail URL (null → "no image"). */
  currentThumb?: string | null;
  /** Image rows: the new/source image thumbnail URL, when previewable. */
  nextThumb?: string | null;
  /**
   * True for rows that can't be staged into a form field and instead apply via an immediate server
   * POST on Apply (every image source — og:image / Kavita cover / Plex poster / taxonomy avatars).
   * The modal labels these "applies immediately".
   */
  applyImmediately?: boolean;
  /** Whether the checkbox starts checked: fill-empty (current empty, next present) → true; would-overwrite → false. */
  defaultChecked: boolean;
  /** Opaque value the provider's `applyStaged` uses to apply this row; never read by the modal. */
  payload?: unknown;
}

/** A named group of rows from one source ("Page metadata", "Kavita", "Plex", "Geocoding"). */
export interface SyncDiffGroup {
  /** Group heading, e.g. "Page metadata". */
  source: string;
  rows: SyncFieldDiff[];
}

/** The full diff the modal renders for a provider. */
export interface SyncDiff {
  groups: SyncDiffGroup[];
}

/** Options passed alongside the selected rows when applying. */
export interface SyncApplyOptions {
  /** Locations only: whether the (default-off) re-geocode toggle was on — force overwrite vs fill-empty. */
  regeocode: boolean;
}

/**
 * The descriptor a mounted edit form publishes into `uiStore.syncProvider`. Fetching is done by the
 * modal (a hook keyed on {@link descriptorKind}); {@link applyStaged} lives here because it must close
 * over the live form's state/setters.
 */
export interface SyncProvider {
  /** Selects the modal's fetch + apply dispatch. */
  descriptorKind: SyncDescriptorKind;
  /** Human name for the entity, shown in the modal title (e.g. a bookmark title or "Tokyo"). */
  entityLabel: string;
  /** The entity's id (bookmark id / location id / taxonomy id). */
  entityId: string;
  /** Extra refs the fetch hook needs (e.g. `url`, `kavitaSeriesId`, `plexRatingKey`, location `name`/`source`, taxonomy image endpoint). */
  refs?: Record<string, string | number | boolean | null>;
  /** Locations only: shows the re-geocode toggle (default off). */
  supportsRegeocode?: boolean;
  /**
   * Applies the user's selected rows: stages text rows into the mounted edit form and/or fires
   * immediate image POSTs. Runs the provider's own save path (or none, for auto-save entities).
   */
  applyStaged: (selected: SyncFieldDiff[], opts: SyncApplyOptions) => void | Promise<void>;
}

/** What a per-kind modal fetch hook returns: the built diff (once loaded), loading state, and any error. */
export interface SyncSourceFetch {
  /** The diff to render, or null while loading / on error / when there's nothing to sync. */
  diff: SyncDiff | null;
  isLoading: boolean;
  /** A user-facing message when the source couldn't be reached/found, else null. */
  error: string | null;
}

/** Build a fill-empty default for a row's checkbox: checked when there's a new value and no current one. */
export function fillEmptyDefault(current: string | number | null, next: string | number | null): boolean {
  const hasNext = next !== null && next !== "";
  const hasCurrent = current !== null && current !== "";
  return hasNext && !hasCurrent;
}

/** Whether a text row actually differs (so unchanged rows can be shown as "in sync" / hidden). */
export function rowDiffers(current: string | number | null, next: string | number | null): boolean {
  const normalizedCurrent = current ?? "";
  const normalizedNext = next ?? "";
  return String(normalizedCurrent) !== String(normalizedNext);
}
