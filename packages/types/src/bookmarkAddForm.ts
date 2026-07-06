/**
 * Shared types for the Bookmark Add Form placement settings (Settings → Display → Add Bookmark
 * Form). These control which fields of the Add Bookmark form show in the main area by default, in
 * the collapsible Advanced section, or are hidden entirely.
 *
 * Mirrors the `CUSTOM_PROPERTY_TYPES` pattern in `customProperties.ts`: an `as const` tuple with a
 * derived union type, so a new field/slug is a one-line change here rather than a hand-mirrored
 * edit across packages.
 */

/** Built-in custom-property slug for the "Runtime" detail property, hidden from the form by default. */
export const RUNTIME_SLUG = "runtime";
/** Built-in custom-property slug for the "Date Posted" detail property, hidden from the form by default. */
export const DATE_POSTED_SLUG = "date-posted";
/** Built-in custom-property slug for the "Content Status" detail property, hidden from the form by default. */
export const CONTENT_STATUS_SLUG = "content-status";
/** Built-in custom-property slug for the "Page Progress" detail property, hidden from the form by default. */
export const PAGE_PROGRESS_SLUG = "page-progress";
/** Built-in custom-property slug for the "Page Range" detail property, hidden from the form by default. */
export const PAGE_RANGE_SLUG = "page-range";
/** Built-in custom-property slug for the "Page Sections" detail property, hidden from the form by default. */
export const PAGE_SECTIONS_SLUG = "page-sections";
/** Built-in custom-property slug for the "Chapters" detail property, hidden from the form by default. */
export const CHAPTERS_SLUG = "chapters";
/** Built-in custom-property slug for the "URL Sections" detail property, hidden from the form by default. */
export const URL_SECTIONS_SLUG = "url-sections";

/**
 * Built-in custom-property slugs treated as detail properties on the Add Bookmark form — better
 * filled after creation in the edit/properties view, so they default to hidden. Derived into
 * {@link DEFAULT_BOOKMARK_ADD_FORM_SETTINGS.builtInPropertyPlacements} below.
 */
export const BOOKMARK_FORM_DETAIL_SLUGS = [
  RUNTIME_SLUG,
  DATE_POSTED_SLUG,
  CONTENT_STATUS_SLUG,
  PAGE_PROGRESS_SLUG,
  PAGE_RANGE_SLUG,
  PAGE_SECTIONS_SLUG,
  CHAPTERS_SLUG,
  URL_SECTIONS_SLUG,
] as const;

/**
 * The standard (non-custom-property) fields on the Add Bookmark form that can be placed into the
 * main area, the Advanced section, or hidden.
 *
 * The first eight are the original always-available fields; the remaining six are taxonomy / media /
 * location relations that used to be editable only on the post-create edit surfaces. They default to
 * `hidden` (see {@link DEFAULT_BOOKMARK_ADD_FORM_SETTINGS}) so the create form is unchanged until the
 * user opts each one in.
 */
export const BOOKMARK_ADD_FORM_STANDARD_FIELDS = [
  "title",
  "names",
  "categoryId",
  "mediaTypeId",
  "descriptionTags",
  "personIds",
  "image",
  "groupIds",
  "genreMoodIds",
  "locationIds",
  "mediaLink",
  "blacklistedTagIds",
  "blacklistedLocationIds",
] as const;

/** A standard Add Bookmark form field. Derived from {@link BOOKMARK_ADD_FORM_STANDARD_FIELDS}. */
export type BookmarkAddFormStandardField = typeof BOOKMARK_ADD_FORM_STANDARD_FIELDS[number];

/**
 * Where a field appears on the Add Bookmark form:
 * - `default` — shown in the main area.
 * - `advanced` — tucked into the collapsible Advanced section.
 * - `hidden` — not shown at all (still editable after creation on the edit/properties tab).
 */
export const BOOKMARK_ADD_FORM_PLACEMENTS = ["default", "advanced", "hidden"] as const;

/** Where a field appears on the Add Bookmark form. Derived from {@link BOOKMARK_ADD_FORM_PLACEMENTS}. */
export type BookmarkAddFormPlacement = typeof BOOKMARK_ADD_FORM_PLACEMENTS[number];

/**
 * Settings controlling Add Bookmark form field placement, persisted server-side (Settings →
 * Display → Add Bookmark Form) so the choices follow the user across devices.
 *
 * Both `standardFieldPlacements` and `builtInPropertyPlacements` are per-key placement maps resolved
 * as `{ ...DEFAULT_BOOKMARK_ADD_FORM_SETTINGS.<map>, ...stored }`: a key the user never touched
 * inherits its default (so a newly-added field that defaults to `hidden` stays hidden even for users
 * with a saved settings row that predates it), while an explicit choice — including `"default"` (the
 * main area) — is stored as a real entry rather than being encoded as an absence. This replaced the
 * old `advancedFields`/`hiddenFields` membership arrays, which could not express a per-field default.
 */
export interface BookmarkAddFormSettings {
  /** Placement for each standard field, keyed by field. */
  standardFieldPlacements: Record<string, BookmarkAddFormPlacement>;
  /** Placement for each built-in detail custom-property slug, keyed by slug. */
  builtInPropertyPlacements: Record<string, BookmarkAddFormPlacement>;
  /**
   * When true, any field a URL/title automation just filled (an Autofill Rule's category/tags/
   * locations/property values, or the URL metadata scan's title/description/people/image) is lifted
   * into the main area of the *create* form regardless of its configured Advanced/Hidden placement,
   * so the user can see what the automation did without expanding Advanced. Create-mode only; the
   * category/media-type scope lock and `hiddenFromForm` still gate visibility. Defaults to `false`.
   */
  revealAutofilledInMain: boolean;
}

/** Payload for replacing the Add Bookmark form placement settings. */
export type UpdateBookmarkAddFormInput = BookmarkAddFormSettings;

/**
 * Default placement for every standard Add Bookmark form field: `title`/`names` show in
 * the main area, today's taxonomy fields (category/media type/description & tags/
 * people/image) sit in Advanced, and the newer taxonomy/media/location relations
 * (groups/genres & moods/locations/media link/blacklists) default to hidden so the create form is
 * unchanged until the user opts them in.
 */
const DEFAULT_STANDARD_FIELD_PLACEMENTS: Record<BookmarkAddFormStandardField, BookmarkAddFormPlacement> = {
  title: "default",
  names: "default",
  categoryId: "advanced",
  mediaTypeId: "advanced",
  descriptionTags: "advanced",
  personIds: "advanced",
  image: "advanced",
  groupIds: "hidden",
  genreMoodIds: "hidden",
  locationIds: "hidden",
  mediaLink: "hidden",
  blacklistedTagIds: "hidden",
  blacklistedLocationIds: "hidden",
};

/**
 * Default placement settings: the standard-field defaults above, and every built-in detail property
 * slug defaults to hidden (matching the pre-existing `hiddenSlugs` behavior in
 * `RevealedCustomFields.tsx`).
 */
export const DEFAULT_BOOKMARK_ADD_FORM_SETTINGS: BookmarkAddFormSettings = {
  standardFieldPlacements: {
    ...DEFAULT_STANDARD_FIELD_PLACEMENTS,
  },
  builtInPropertyPlacements: Object.fromEntries(
    BOOKMARK_FORM_DETAIL_SLUGS.map(slug => [slug, "hidden"]),
  ) as Record<string, BookmarkAddFormPlacement>,
  revealAutofilledInMain: false,
};
