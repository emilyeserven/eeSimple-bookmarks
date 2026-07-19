import type {
  BookmarkFieldSort,
  BookmarkRandomSort,
  BookmarkSort,
  BookmarkSortDimension,
  BuiltinSortField,
  CustomProperty,
  SortDirection,
} from "@eesimple/types";

import { RANDOM_FIELD, SORTABLE_PROPERTY_TYPES } from "@eesimple/types";

import i18n from "../i18n";

export type {
  BookmarkFieldSort,
  BookmarkRandomSort,
  BookmarkSort,
  BookmarkSortDimension,
  BuiltinSortField,
  SortDirection,
};

// The pure sort engine moved to `@eesimple/types` so the middleware sorts server-side before
// paginating (`POST /api/bookmarks/search`); the i18n label helpers stay client-side.
// (`SORTABLE_PROPERTY_TYPES` is imported above for `sortFieldOptions` but deliberately not
// re-exported — no client consumer reads it from here.)
export type { TitleSortContext } from "@eesimple/types";
export { RANDOM_FIELD, sortBookmarks } from "@eesimple/types";

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
