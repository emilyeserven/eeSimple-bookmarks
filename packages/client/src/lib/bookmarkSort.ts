import type {
  BookmarkFieldSort,
  BookmarkRandomSort,
  BookmarkSort,
  BookmarkSortDimension,
  Bookmark,
  BuiltinSortField,
  CustomProperty,
  CustomPropertyType,
  PreferredLanguage,
  SortDirection,
} from "@eesimple/types";

import { resolveNameSortKey } from "@eesimple/types";

import i18n from "../i18n";

export type {
  BookmarkFieldSort,
  BookmarkRandomSort,
  BookmarkSort,
  BookmarkSortDimension,
  BuiltinSortField,
  SortDirection,
};

export const RANDOM_FIELD = "random";

interface SortFieldOption {
  value: string;
  label: string;
}

/** The field choices for a Sort control: built-in fields, then sortable custom properties. */
export function sortFieldOptions(
  properties: CustomProperty[],
  opts?: { includeRandom?: boolean },
): SortFieldOption[] {
  const sortableProperties = properties.filter(
    p => (SORTABLE_PROPERTY_TYPES as readonly string[]).includes(p.type),
  );
  return [
    ...(opts?.includeRandom
      ? [{
        value: RANDOM_FIELD,
        label: i18n.t("Random"),
      }]
      : []),
    {
      value: "title",
      label: i18n.t("Title"),
    },
    {
      value: "createdAt",
      label: i18n.t("Date Added"),
    },
    {
      value: "updatedAt",
      label: i18n.t("Date Updated"),
    },
    ...sortableProperties.map(p => ({
      value: p.id,
      label: p.name,
    })),
  ];
}

/** The display label for a single built-in field or custom-property id. */
function describeSortField(field: string, properties: CustomProperty[]): string {
  if (field === "title") return i18n.t("Title");
  if (field === "createdAt") return i18n.t("Date Added");
  if (field === "updatedAt") return i18n.t("Date Updated");
  return properties.find(p => p.id === field)?.name ?? i18n.t("Custom property");
}

/** A one-line summary of a `BookmarkSort`, e.g. for a collapsed section preview. */
export function sortSummaryLabel(
  sort: BookmarkSort | null | undefined,
  properties: CustomProperty[],
): string {
  if (!sort) return i18n.t("Default order");
  if ("random" in sort) return i18n.t("Random order");
  const dirArrow = (d: SortDirection) => (d === "asc" ? "↑" : "↓");
  const primary = `${describeSortField(sort.primary.field, properties)} ${dirArrow(sort.primary.direction)}`;
  if (!sort.secondary) return primary;
  const secondary = `${describeSortField(sort.secondary.field, properties)} ${dirArrow(sort.secondary.direction)}`;
  return i18n.t("{{primary}}, then {{secondary}}", {
    primary,
    secondary,
  });
}

/** Custom property types whose values can be meaningfully compared for sorting. */
export const SORTABLE_PROPERTY_TYPES = [
  "number",
  "calculate",
  "ratingScale",
  "datetime",
  "text",
  "boolean",
  "choices",
] as const;

/** Missing/null values always sort last, regardless of the ascending/descending sign. */
const NULL_LAST = 1;

/**
 * Compares two possibly-null values. A present value always precedes a missing one (so blanks sink
 * to the bottom in both directions); two present values are compared with `cmp` and scaled by `sign`.
 */
function compareNullable<T>(
  av: T | null,
  bv: T | null,
  sign: number,
  cmp: (a: T, b: T) => number,
): number {
  if (av === null && bv === null) return 0;
  if (av === null) return NULL_LAST;
  if (bv === null) return -NULL_LAST;
  return sign * cmp(av, bv);
}

const localeCmp = (a: string, b: string, locale?: string): number =>
  a.localeCompare(b, locale, {
    sensitivity: "base",
  });

/**
 * How to resolve a bookmark's title for sorting: which language's name to prefer, and the BCP-47
 * collation locale for the comparison. Both default to "no preference / default locale" so callers
 * that don't care (and existing tests) get today's behavior.
 */
export interface TitleSortContext {
  preferredLanguage?: PreferredLanguage | null;
  /** Fallback language for the `preferRomanized` sort branch; defaults to English when unset. */
  fallbackLanguage?: PreferredLanguage | null;
  locale?: string;
}

/** The string a bookmark's title sorts by — its preferred-language name, else primary, else title. */
function bookmarkTitleSortKey(bookmark: Bookmark, ctx: TitleSortContext): string {
  return resolveNameSortKey(
    bookmark.names,
    bookmark.title,
    {
      preferredLanguage: ctx.preferredLanguage,
      fallbackLanguage: ctx.fallbackLanguage,
    },
  );
}
/** Ordinal comparison for values that compare with `<` / `>` (ISO dates, etc.). */
const ordinalCmp = <T>(a: T, b: T): number => (a < b ? -1 : a > b ? 1 : 0);

/** Extracts the label of the first selected choice value (falling back to its raw key). */
function firstChoiceLabel(bookmark: Bookmark, prop: CustomProperty): string | null {
  const cv = bookmark.choicesValues.find(v => v.propertyId === prop.id);
  if (!cv || cv.values.length === 0) return null;
  return prop.choicesItems.find(i => i.value === cv.values[0])?.label ?? cv.values[0];
}

type PropComparator = (a: Bookmark, b: Bookmark, prop: CustomProperty, sign: number) => number;

const numberComparator: PropComparator = (a, b, prop, sign) =>
  compareNullable(
    a.numberValues.find(v => v.propertyId === prop.id)?.value ?? null,
    b.numberValues.find(v => v.propertyId === prop.id)?.value ?? null,
    sign,
    (x, y) => x - y,
  );

/** Per-property-type value comparators. Types absent from this map are not sortable (stable/0). */
const PROPERTY_COMPARATORS: Partial<Record<CustomPropertyType, PropComparator>> = {
  number: numberComparator,
  calculate: numberComparator,
  ratingScale: numberComparator,
  datetime: (a, b, prop, sign) =>
    compareNullable(
      a.dateTimeValues.find(v => v.propertyId === prop.id)?.value ?? null,
      b.dateTimeValues.find(v => v.propertyId === prop.id)?.value ?? null,
      sign,
      ordinalCmp,
    ),
  text: (a, b, prop, sign) =>
    compareNullable(
      a.textValues.find(v => v.propertyId === prop.id)?.value ?? null,
      b.textValues.find(v => v.propertyId === prop.id)?.value ?? null,
      sign,
      localeCmp,
    ),
  boolean: (a, b, prop, sign) =>
    compareNullable(
      a.booleanValues.find(v => v.propertyId === prop.id)?.value ?? null,
      b.booleanValues.find(v => v.propertyId === prop.id)?.value ?? null,
      sign,
      // false (0) < true (1)
      (x, y) => (x ? 1 : 0) - (y ? 1 : 0),
    ),
  choices: (a, b, prop, sign) =>
    compareNullable(firstChoiceLabel(a, prop), firstChoiceLabel(b, prop), sign, localeCmp),
};

/** Compares by a built-in field, or returns null when `field` is not a built-in. */
function compareBuiltInField(
  a: Bookmark,
  b: Bookmark,
  field: string,
  sign: number,
  titleCtx: TitleSortContext,
): number | null {
  if (field === "title") {
    return sign * localeCmp(
      bookmarkTitleSortKey(a, titleCtx),
      bookmarkTitleSortKey(b, titleCtx),
      titleCtx.locale,
    );
  }
  if (field === "createdAt") return sign * ordinalCmp(a.createdAt, b.createdAt);
  // Null (never-updated) always sorts last regardless of direction.
  if (field === "updatedAt") return compareNullable(a.updatedAt, b.updatedAt, sign, ordinalCmp);
  return null;
}

/** Returns a numeric comparator result for a single sort dimension. */
function compareOneDimension(
  a: Bookmark,
  b: Bookmark,
  dim: BookmarkSortDimension,
  properties: CustomProperty[],
  titleCtx: TitleSortContext,
): number {
  const sign = dim.direction === "asc" ? 1 : -1;

  const builtIn = compareBuiltInField(a, b, dim.field, sign, titleCtx);
  if (builtIn !== null) return builtIn;

  const prop = properties.find(p => p.id === dim.field);
  if (!prop) return 0;
  return PROPERTY_COMPARATORS[prop.type]?.(a, b, prop, sign) ?? 0;
}

/** A deterministic 32-bit hash of `id` mixed with `seed`, used to derive a stable shuffle order. */
function seededRank(id: string, seed: number): number {
  let hash = seed | 0;
  for (let i = 0; i < id.length; i++) {
    hash = Math.imul(hash ^ id.charCodeAt(i), 2654435761);
    hash ^= hash >>> 15;
  }
  return hash >>> 0;
}

/**
 * Returns a stable sorted copy of `bookmarks` according to `sort`.
 * When `sort` is undefined the original order is preserved (server's `createdAt DESC`).
 *
 * `titleCtx` picks which language's name a title sorts by (and the collation locale) — the interface
 * language, or a per-page override. Defaulted so callers/tests that don't care get today's behavior.
 */
export function sortBookmarks(
  bookmarks: Bookmark[],
  sort: BookmarkSort | undefined,
  properties: CustomProperty[],
  titleCtx: TitleSortContext = {},
): Bookmark[] {
  if (!sort) return bookmarks;
  if ("random" in sort) {
    return [...bookmarks].sort((a, b) =>
      seededRank(a.id, sort.seed) - seededRank(b.id, sort.seed));
  }
  return [...bookmarks].sort((a, b) => {
    const primary = compareOneDimension(a, b, sort.primary, properties, titleCtx);
    if (primary !== 0) return primary;
    if (sort.secondary) return compareOneDimension(a, b, sort.secondary, properties, titleCtx);
    return 0;
  });
}
