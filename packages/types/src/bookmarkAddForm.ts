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
 */
export const BOOKMARK_ADD_FORM_STANDARD_FIELDS = [
  "title",
  "romanizedName",
  "categoryId",
  "mediaTypeId",
  "languageId",
  "groupId",
  "descriptionTags",
  "personIds",
  "image",
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
 * `advancedFields`/`hiddenFields` use sidebar-style membership: a standard field's absence from
 * both arrays means it shows in the main area by default. `builtInPropertyPlacements` is instead
 * resolved as `{ ...DEFAULT_BOOKMARK_ADD_FORM_SETTINGS.builtInPropertyPlacements, ...stored }` so a
 * future built-in property that defaults to hidden stays hidden even for users with an existing
 * saved settings row that predates it.
 */
export interface BookmarkAddFormSettings {
  /** Standard field keys placed in the Advanced section. */
  advancedFields: string[];
  /** Standard field keys hidden from the form entirely. */
  hiddenFields: string[];
  /** Placement for each built-in detail custom-property slug, keyed by slug. */
  builtInPropertyPlacements: Record<string, BookmarkAddFormPlacement>;
}

/** Payload for replacing the Add Bookmark form placement settings. */
export type UpdateBookmarkAddFormInput = BookmarkAddFormSettings;

/**
 * Default placement settings: today's Advanced-section residents stay in Advanced, no standard
 * field is hidden, and every built-in detail property slug defaults to hidden (matching the
 * pre-existing `hiddenSlugs` behavior in `RevealedCustomFields.tsx`).
 */
export const DEFAULT_BOOKMARK_ADD_FORM_SETTINGS: BookmarkAddFormSettings = {
  advancedFields: [
    "categoryId",
    "mediaTypeId",
    "languageId",
    "groupId",
    "descriptionTags",
    "personIds",
    "image",
  ],
  hiddenFields: [],
  builtInPropertyPlacements: Object.fromEntries(
    BOOKMARK_FORM_DETAIL_SLUGS.map(slug => [slug, "hidden"]),
  ) as Record<string, BookmarkAddFormPlacement>,
};
