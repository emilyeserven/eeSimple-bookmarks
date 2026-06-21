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
 */
export const CUSTOM_PROPERTY_TYPES = [
  "number", "boolean", "calculate", "datetime", "ratingScale", "image", "file",
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
};

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
