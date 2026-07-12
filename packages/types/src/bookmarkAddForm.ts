/**
 * Shared types for the Bookmark Add Form placement settings (Settings → Display → Add Bookmark
 * Form). These control which fields of the Add Bookmark form show in the main area by default, in
 * the collapsible Advanced section, or are hidden entirely.
 *
 * Mirrors the `CUSTOM_PROPERTY_TYPES` pattern in `customProperties.ts`: an `as const` tuple with a
 * derived union type, so a new field/slug is a one-line change here rather than a hand-mirrored
 * edit across packages.
 */

import type { ConditionInput, ConditionTree, EvaluateOptions } from "./conditions.js";

import { emptyConditionTree, evaluateConditions } from "./conditions.js";

/** Built-in custom-property slug for the "Runtime" detail property, hidden from the form by default. */
export const RUNTIME_SLUG = "runtime";
/** Built-in custom-property slug for the "Date Posted" detail property, hidden from the form by default. */
export const DATE_POSTED_SLUG = "date-posted";
/** Built-in custom-property slug for the "Content Status" detail property, hidden from the form by default. */
export const CONTENT_STATUS_SLUG = "content-status";
/** Built-in custom-property slug for the "Progress" detail property, hidden from the form by default. */
export const PROGRESS_SLUG = "progress";
/** Built-in custom-property slug for the "Page Range" detail property, hidden from the form by default. */
export const PAGE_RANGE_SLUG = "page-range";
/**
 * Built-in custom-property slug for the "Sections" detail property (the merger of the former
 * Chapters / Page Sections / URL Sections built-ins), hidden from the form by default.
 */
export const SECTIONS_SLUG = "sections";

/**
 * Built-in custom-property slugs treated as detail properties on the Add Bookmark form — better
 * filled after creation in the edit/properties view, so they default to hidden. Derived into
 * {@link DEFAULT_BOOKMARK_ADD_FORM_SETTINGS.builtInPropertyPlacements} below.
 */
export const BOOKMARK_FORM_DETAIL_SLUGS = [
  RUNTIME_SLUG,
  DATE_POSTED_SLUG,
  CONTENT_STATUS_SLUG,
  PROGRESS_SLUG,
  PAGE_RANGE_SLUG,
  SECTIONS_SLUG,
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
  "secondaryUrl",
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
/**
 * A conditional placement override for the *create* form. When {@link conditions} match the
 * in-progress bookmark (evaluated live against the partially-filled form via
 * {@link applyAdvancedRules}), the rule's sparse placement maps are overlaid on top of the base
 * settings — so, e.g., "if Media Type is Book, show Page Progress in the main area." Reuses the shared
 * condition tree (the same Filter builder autofill rules and card display rules use).
 */
export interface BookmarkAddFormAdvancedRule {
  /** Stable id (client-generated), used as the React key and for update/delete. */
  id: string;
  /** Optional human label shown in the settings list; falls back to a generated summary when absent. */
  name?: string;
  /** The condition tree that gates this rule (empty tree = matches nothing, so the rule is inert). */
  conditions: ConditionTree;
  /** Sparse: only the standard fields this rule repositions. A field absent here inherits the base placement. */
  standardFieldPlacements: Record<string, BookmarkAddFormPlacement>;
  /** Sparse: only the property slugs (built-in detail OR user custom) this rule repositions. */
  propertyPlacements: Record<string, BookmarkAddFormPlacement>;
  /** Lower runs first; a later (higher `sortOrder`) matching rule wins a field, matching autofill's last-writer merge. */
  sortOrder: number;
}

export interface BookmarkAddFormSettings {
  /** Placement for each standard field, keyed by field. */
  standardFieldPlacements: Record<string, BookmarkAddFormPlacement>;
  /** Placement for each built-in detail custom-property slug, keyed by slug. */
  builtInPropertyPlacements: Record<string, BookmarkAddFormPlacement>;
  /**
   * Conditional placement overrides applied on the *create* form when their conditions match the
   * in-progress bookmark. Empty by default. Create-mode only — edit surfaces never read them.
   */
  advancedRules: BookmarkAddFormAdvancedRule[];
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
  secondaryUrl: "hidden",
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
  advancedRules: [],
  revealAutofilledInMain: false,
};

/**
 * Overlay the matching advanced rules onto the base placement settings for one render of the *create*
 * form. Each rule whose {@link BookmarkAddFormAdvancedRule.conditions} match `input` contributes its
 * sparse `standardFieldPlacements` (onto {@link BookmarkAddFormSettings.standardFieldPlacements}) and
 * `propertyPlacements` (onto {@link BookmarkAddFormSettings.builtInPropertyPlacements}, which the
 * client resolver turns into per-slug `placementOverrides` covering built-in **and** user custom
 * property slugs). Rules are applied in ascending `sortOrder`, so a later matching rule wins a
 * conflicting field — the same last-writer semantics as `mergeMatchingAutofillRules`.
 *
 * Pure and create-mode only. The other settings fields (`advancedRules`, `revealAutofilledInMain`)
 * pass through unchanged; the returned object is safe to feed straight into `resolveBookmarkAddForm`.
 */
export function applyAdvancedRules(
  base: BookmarkAddFormSettings,
  input: ConditionInput,
  options?: EvaluateOptions,
): BookmarkAddFormSettings {
  if (base.advancedRules.length === 0) return base;
  const standardFieldPlacements = {
    ...base.standardFieldPlacements,
  };
  const builtInPropertyPlacements = {
    ...base.builtInPropertyPlacements,
  };
  for (const rule of [...base.advancedRules].sort((a, b) => a.sortOrder - b.sortOrder)) {
    if (!evaluateConditions(rule.conditions, input, options)) continue;
    Object.assign(standardFieldPlacements, rule.standardFieldPlacements);
    Object.assign(builtInPropertyPlacements, rule.propertyPlacements);
  }
  return {
    ...base,
    standardFieldPlacements,
    builtInPropertyPlacements,
  };
}

/** A blank advanced rule, used by the settings UI's "Add rule" action. `id` is supplied by the caller. */
export function makeEmptyAdvancedRule(id: string, sortOrder: number): BookmarkAddFormAdvancedRule {
  return {
    id,
    conditions: emptyConditionTree(),
    standardFieldPlacements: {},
    propertyPlacements: {},
    sortOrder,
  };
}
