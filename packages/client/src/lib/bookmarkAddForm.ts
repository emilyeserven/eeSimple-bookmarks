import type {
  BookmarkAddFormPlacement,
  BookmarkAddFormSettings,
  BookmarkAddFormStandardField,
} from "@eesimple/types";

import {
  BOOKMARK_ADD_FORM_STANDARD_FIELDS,
  BOOKMARK_FORM_DETAIL_SLUGS,
  DATE_POSTED_SLUG,
  DEFAULT_BOOKMARK_ADD_FORM_SETTINGS,
  RUNTIME_SLUG,
} from "@eesimple/types";

/** The resolved placement of every Add Bookmark form field for one render of the form. */
export interface ResolvedBookmarkAddForm {
  /** Standard fields rendered in the main area, in {@link BOOKMARK_ADD_FORM_STANDARD_FIELDS} order. */
  mainStandardFields: BookmarkAddFormStandardField[];
  /** Standard fields rendered in the collapsible Advanced section, in tuple order. */
  advancedStandardFields: BookmarkAddFormStandardField[];
  /** `hiddenSlugs` to pass to `selectVisibleFormProperties` for the main-area property list. */
  mainHiddenSlugs: string[];
  /** `hiddenSlugs` to pass to `selectVisibleFormProperties` for the Advanced property list. */
  advancedHiddenSlugs: string[];
  /**
   * Per-slug placement overrides for `selectVisibleFormProperties`'s `default`/`advanced` custom
   * property lists. `undefined` in edit mode, where placement is never user-configurable.
   */
  placementOverrides: Record<string, BookmarkAddFormPlacement> | undefined;
}

/**
 * Resolves where every Add Bookmark form field (standard fields + built-in detail custom
 * properties) renders, for one of the two surfaces that reuse the Add Bookmark form's field list:
 *
 * - **Edit mode** (`isEdit: true`) is intentionally unaffected by the Settings → Display → Add
 *   Bookmark Form placement settings — those settings only ever describe the *create* experience
 *   (a quick-creation form), while the edit tabs are the place users go to fill in every field
 *   including the "detail" properties. So edit mode always returns today's hardcoded split: the
 *   same `mainStandardFields`/`advancedStandardFields` as
 *   `DEFAULT_BOOKMARK_ADD_FORM_SETTINGS` (regardless of what the user has actually saved),
 *   `mainHiddenSlugs` = every {@link BOOKMARK_FORM_DETAIL_SLUGS} slug (matches
 *   `RevealedCustomFields.tsx`'s hardcoded list), `advancedHiddenSlugs` = `[RUNTIME_SLUG,
 *   DATE_POSTED_SLUG]` (matches `BookmarkCustomFields.tsx`'s default), and no per-property
 *   placement overrides.
 * - **Create mode** (`isEdit: false`) buckets each standard field by membership in
 *   `settings.hiddenFields` (omitted) / `settings.advancedFields` (advanced) / neither (main),
 *   preserving {@link BOOKMARK_ADD_FORM_STANDARD_FIELDS} tuple order in both output arrays. An
 *   unrecognized field key (e.g. one that existed in a stored settings row but was later removed
 *   from the tuple) is silently ignored rather than surfacing anywhere. Neither zone's property
 *   list gets a `hiddenSlugs` list in create mode — instead, custom property placement is resolved
 *   per-slug via `placementOverrides`, computed as `{ ...defaults.builtInPropertyPlacements,
 *   ...settings.builtInPropertyPlacements }` so a future built-in property that ships with a
 *   default placement stays on that default for users whose saved settings row predates it.
 */
export function resolveBookmarkAddForm(
  settings: BookmarkAddFormSettings,
  isEdit: boolean,
): ResolvedBookmarkAddForm {
  if (isEdit) {
    const defaultAdvanced = new Set(DEFAULT_BOOKMARK_ADD_FORM_SETTINGS.advancedFields);
    return {
      mainStandardFields: BOOKMARK_ADD_FORM_STANDARD_FIELDS.filter(field => !defaultAdvanced.has(field)),
      advancedStandardFields: BOOKMARK_ADD_FORM_STANDARD_FIELDS.filter(field => defaultAdvanced.has(field)),
      mainHiddenSlugs: [...BOOKMARK_FORM_DETAIL_SLUGS],
      advancedHiddenSlugs: [RUNTIME_SLUG, DATE_POSTED_SLUG],
      placementOverrides: undefined,
    };
  }

  const hidden = new Set(settings.hiddenFields);
  const advanced = new Set(settings.advancedFields);

  const mainStandardFields: BookmarkAddFormStandardField[] = [];
  const advancedStandardFields: BookmarkAddFormStandardField[] = [];
  for (const field of BOOKMARK_ADD_FORM_STANDARD_FIELDS) {
    if (hidden.has(field)) continue;
    if (advanced.has(field)) advancedStandardFields.push(field);
    else mainStandardFields.push(field);
  }

  return {
    mainStandardFields,
    advancedStandardFields,
    mainHiddenSlugs: [],
    advancedHiddenSlugs: [],
    placementOverrides: {
      ...DEFAULT_BOOKMARK_ADD_FORM_SETTINGS.builtInPropertyPlacements,
      ...settings.builtInPropertyPlacements,
    },
  };
}
