/**
 * Single source of truth for the custom-property variant lists.
 *
 * Each list is an `as const` tuple; the corresponding union type is **derived** from it
 * (`typeof X[number]`). Client zod enums, the middleware Fastify JSON-Schema enums, and the
 * client label/option arrays all consume these, so adding a variant is a one-line change here
 * rather than a hand-mirrored edit across packages. There is intentionally no zod dependency in
 * `@eesimple/types` — these stay plain TS data.
 */

/**
 * The kind of a user-defined custom property:
 * - `number` — a single numeric value per bookmark, filtered via a range slider.
 * - `boolean` — a single true/false value per bookmark.
 * - `calculate` — a numeric value derived from other `number` properties (Sum formula);
 *   computed and stored server-side so it filters and sorts like a `number`.
 * - `datetime` — a calendar/clock value (a date, a time, or both; see {@link DateTimeFormat}).
 * - `ratingScale` — a star rating (e.g. 1–5). Stored as a numeric value in the same
 *   `bookmarkNumberValues` table as `number`/`calculate`, so it filters/sorts/conditions like a
 *   `number`; only its presentation (stars) and per-property config differ. See {@link RatingMax}.
 * - `image` — a single image attached per bookmark. Unlike the scalar types, the value is a binary
 *   blob in object storage (re-encoded to WebP); the bookmark carries only a {@link BookmarkFileValue}
 *   with its serving URL. Filtered/matched by presence only ("has a value / missing").
 * - `file` — a single arbitrary file attached per bookmark (stored as raw bytes, served as a
 *   download). Like `image`, the value is a blob carried as a {@link BookmarkFileValue} and matched
 *   by presence only.
 * - `choices` — a user-defined list of labeled options; bookmarks store the selected value(s).
 *   Rendered as checkbox, radio button, combobox, or dropdown depending on {@link ChoicesDisplayType}.
 */
export const CUSTOM_PROPERTY_TYPES = [
  "number", "boolean", "calculate", "datetime", "ratingScale", "image", "file", "choices", "itemInItems", "sections", "text",
] as const;

/** The kind of a user-defined custom property. Derived from {@link CUSTOM_PROPERTY_TYPES}. */
export type CustomPropertyType = typeof CUSTOM_PROPERTY_TYPES[number];

/** Human-friendly label for each custom-property type (used by the Type select). */
export const CUSTOM_PROPERTY_TYPE_LABELS: Record<CustomPropertyType, string> = {
  number: "Number",
  boolean: "Boolean",
  calculate: "Calculate (Sum)",
  datetime: "Date / Time",
  ratingScale: "Rating Scale",
  image: "Image",
  file: "File",
  choices: "Choices",
  itemInItems: "Two Numbers",
  sections: "Sections",
  text: "Text",
};

/**
 * How a `choices` property is rendered in the bookmark form:
 * - `checkbox` — a list of checkboxes (forces multi-select).
 * - `radio` — a radio button group (forces single-select).
 * - `combobox` — a searchable popover; single or multi-select controlled by `choicesMultiple`.
 * - `dropdown` — a select element; single or multi-select controlled by `choicesMultiple`.
 */
export const CHOICES_DISPLAY_TYPES = ["checkbox", "radio", "combobox", "dropdown"] as const;

/** How a `choices` property is rendered in the bookmark form. Derived from {@link CHOICES_DISPLAY_TYPES}. */
export type ChoicesDisplayType = typeof CHOICES_DISPLAY_TYPES[number];

/** Human-friendly label for each choices display type. */
export const CHOICES_DISPLAY_LABELS: Record<ChoicesDisplayType, string> = {
  checkbox: "Checkbox",
  radio: "Radio Button",
  combobox: "Combobox",
  dropdown: "Dropdown",
};

/** A single selectable option in a `choices` custom property. */
export interface ChoicesItem {
  /** Human-readable label shown to the user. */
  label: string;
  /** Slugified key stored in the bookmark value; unique within the property. */
  value: string;
  /** When `true`, this option is pre-selected in the bookmark form. Only one item should be default. */
  isDefault?: boolean;
}

/**
 * How a `number`/`calculate` value is rendered:
 * - `plain` — the number with its optional prefix/unit (the default).
 * - `duration` — the value is a count of seconds, shown as `H:MM:SS` / `M:SS` (e.g. video length).
 */
export const NUMBER_FORMATS = ["plain", "duration"] as const;

/** How a `number`/`calculate` value is rendered. Derived from {@link NUMBER_FORMATS}. */
export type NumberFormat = typeof NUMBER_FORMATS[number];

/** Human-friendly label for each number format (used by the Number format select). */
export const NUMBER_FORMAT_LABELS: Record<NumberFormat, string> = {
  plain: "Plain",
  duration: "Duration",
};

/**
 * How a `ratingScale` value is rendered:
 * - `stars` — star glyphs (the default; `null` also resolves to this).
 * - `ticks` — a compact horizontal scale of tick marks, used for both read-only display and (for
 *   single-value ratings) the editing input.
 */
export const RATING_DISPLAYS = ["stars", "ticks"] as const;

/** How a `ratingScale` value is rendered. Derived from {@link RATING_DISPLAYS}. */
export type RatingDisplay = typeof RATING_DISPLAYS[number];

/** Human-friendly label for each rating display style (used by the Display select). */
export const RATING_DISPLAY_LABELS: Record<RatingDisplay, string> = {
  stars: "Stars",
  ticks: "Range with tick marks",
};

/**
 * What a `datetime` property captures (and therefore how its value is entered/encoded):
 * - `date` — a calendar date only, stored as `"YYYY-MM-DD"`.
 * - `time` — a clock time only, stored as 24h `"HH:MM"`.
 * - `datetime` — both, stored as local `"YYYY-MM-DDTHH:MM"` (no timezone).
 *
 * The canonical encodings are chosen so values sort lexicographically.
 */
export const DATE_TIME_FORMATS = ["date", "time", "datetime"] as const;

/** What a `datetime` property captures. Derived from {@link DATE_TIME_FORMATS}. */
export type DateTimeFormat = typeof DATE_TIME_FORMATS[number];

export const SECTION_ENTRY_TYPES = ["name", "url", "page", "timestamp"] as const;
export type SectionEntryType = typeof SECTION_ENTRY_TYPES[number];

export const SECTION_ENTRY_TYPE_LABELS: Record<SectionEntryType, string> = {
  name: "Name only",
  url: "URL",
  page: "Page",
  timestamp: "Timestamp",
};

export interface SectionEntry {
  id: string;
  name: string;
  type: SectionEntryType;
  /**
   * The entry's positional value, interpreted per {@link type} (`page`/`timestamp` number, `url` link).
   * A `name`-only entry carries no positional value — `startValue` is `""` (a plain titled row, still
   * with an optional {@link url} link and {@link children}).
   */
  startValue: string;
  endValue?: string;
  /**
   * Optional clickable link, independent of {@link type} — an entry can carry a name, a positional
   * value (`page`/`timestamp`), **and** a link at once. Legacy `type: "url"` entries predate this
   * field and instead hold their link in {@link startValue}; display code falls back to that (see the
   * `sectionEntryLink` resolver), so both shapes render as a link.
   */
  url?: string;
  /**
   * Optional second tier. A tier-1 entry (a section/group header) may carry child entries; children
   * are leaf items and must NOT carry their own `children` — the model is capped at **depth 2**. Only
   * populated when the owning property opts in via `CustomProperty.sectionsTiered`.
   */
  children?: SectionEntry[];
  /**
   * Whether the user has marked this section/sub-item as read/watched. Checking a tier-1 entry also
   * checks all its children — that cascade is a **write-time** behavior (see
   * {@link setSectionCompleted}), never derived at read time, so a parent and its children can
   * legitimately disagree after later edits.
   */
  completed?: boolean;
  /**
   * Whether this section/sub-item is excluded from {@link countSectionLeaves}'s progress tally.
   * Checking a tier-1 entry also excludes all its children — the same write-time cascade as
   * {@link completed} — since only leaves are actually counted.
   */
  excludeFromProgress?: boolean;
  /**
   * Optional tag associations (tag ids) for this section/sub-item, set by the AI-import dialog or the
   * manual per-row picker — never by extension fill. A deleted tag leaves a dangling id here; display
   * code skips ids it can't resolve.
   */
  tagIds?: string[];
}

export interface BookmarkSectionsValue {
  propertyId: string;
  exhaustive: boolean;
  sections: SectionEntry[];
}

/**
 * Count the completion "leaves" of a sections list: a tier-1 entry with children is measured by its
 * children (each child is one leaf); one without children counts as one leaf itself. A leaf whose
 * `excludeFromProgress` is `true` is skipped entirely (neither `total` nor `completed`). Powers the
 * derived-Progress feature ("24 of 230 modules"), so middleware and client must share this exact rule.
 */
export function countSectionLeaves(sections: SectionEntry[]): { total: number;
  completed: number; } {
  let total = 0;
  let completed = 0;
  for (const entry of sections) {
    const leaves = entry.children && entry.children.length > 0 ? entry.children : [entry];
    for (const leaf of leaves) {
      if (leaf.excludeFromProgress === true) continue;
      total += 1;
      if (leaf.completed === true) completed += 1;
    }
  }
  return {
    total,
    completed,
  };
}

/**
 * Return a copy of `sections` with the entry `entryId`'s `completed` flag set. Setting a tier-1
 * entry cascades the same flag to all its children (the "checking a parent checks everything under
 * it" rule); setting a child touches only that child — the parent's own flag changes only via its
 * own checkbox.
 */
export function setSectionCompleted(
  sections: SectionEntry[],
  entryId: string,
  completed: boolean,
): SectionEntry[] {
  return sections.map((entry) => {
    if (entry.id === entryId) {
      return {
        ...entry,
        completed,
        ...(entry.children && {
          children: entry.children.map(child => ({
            ...child,
            completed,
          })),
        }),
      };
    }
    if (entry.children?.some(child => child.id === entryId)) {
      return {
        ...entry,
        children: entry.children.map(child => (child.id === entryId
          ? {
            ...child,
            completed,
          }
          : child)),
      };
    }
    return entry;
  });
}

/**
 * Per-media-type overrides for an `itemInItems` property's text segments, keyed by media-type id.
 * A field left `null`/absent inherits the property's base `itemInItemsBeforeText`/`BetweenText`/
 * `AfterText` — so "Progress" can render "1 of 10 pages" on a book and "24 of 230 modules" on a
 * course from one property. Stored as nullable jsonb on `custom_properties`.
 */
export type ItemInItemsMediaTypeTexts = Record<string, {
  beforeText?: string | null;
  betweenText?: string | null;
  afterText?: string | null;
}>;

/** The itemInItems text fields {@link resolveItemInItemsTexts} reads (structurally satisfied by `CustomProperty`). */
export interface ItemInItemsTextSource {
  itemInItemsBeforeText: string | null;
  itemInItemsBetweenText: string | null;
  itemInItemsAfterText: string | null;
  itemInItemsMediaTypeTexts: ItemInItemsMediaTypeTexts | null;
}

/**
 * Resolve an `itemInItems` property's before/between/after text, applying the priority chain
 * **per-bookmark override → per-media-type override → property base**: for each segment the first
 * non-null value in that order wins. `bookmarkOverride` is a single {@link BookmarkProgressValue}'s
 * `textOverride`; omitting it (the two-arg call) reduces to the media-type/base behavior unchanged.
 * Returns raw `string | null` segments — display defaults (`between` → `" of "`, others → `""`)
 * stay the caller's job so the client can localize them.
 */
export function resolveItemInItemsTexts(
  property: ItemInItemsTextSource,
  mediaTypeId: string | null | undefined,
  bookmarkOverride?: { beforeText?: string | null;
    betweenText?: string | null;
    afterText?: string | null; } | null,
): { before: string | null;
  between: string | null;
  after: string | null; } {
  const override = mediaTypeId ? property.itemInItemsMediaTypeTexts?.[mediaTypeId] : undefined;
  return {
    before: bookmarkOverride?.beforeText ?? override?.beforeText ?? property.itemInItemsBeforeText,
    between: bookmarkOverride?.betweenText ?? override?.betweenText ?? property.itemInItemsBetweenText,
    after: bookmarkOverride?.afterText ?? override?.afterText ?? property.itemInItemsAfterText,
  };
}

/** A plain text custom property value carried on a bookmark. */
export interface BookmarkTextValue {
  propertyId: string;
  value: string;
}
