import type { BookmarkSearch } from "./bookmarkSearch";
import type { IsbnLink } from "./isbnLinks";
import type { Bookmark, BookmarkSectionsValue, CardFieldZones, ChoicesDisplayType, ChoicesItem, CustomProperty, SectionEntry } from "@eesimple/types";

import { resolveBooleanDisplay } from "./bookmarkCardValues";
import { formatBoolean, formatDateTime, formatNumber } from "./bookmarkFormat";
import { buildPropertyQuickSearch } from "./bookmarkPropertyQuickFilter";
import { buildIsbnLinks } from "./isbnLinks";
import { formatProgressValue, formatSectionsValue } from "./propertyFormat";

export interface NumberPropertyRow {
  id: string;
  name: string;
  groupId: string | null;
  isCalculated: boolean;
  value: string;
  search: BookmarkSearch;
}

export interface RatingPropertyRow {
  id: string;
  name: string;
  groupId: string | null;
  value: number;
  max: number;
  allowHalf: boolean;
  label: string | undefined;
  search: BookmarkSearch;
}

export interface BooleanPropertyRow {
  id: string;
  name: string;
  groupId: string | null;
  rawValue: boolean;
  value: string;
  showLabelColon: boolean;
  showValueBeforeLabel: boolean;
  clickableInView: boolean;
  search: BookmarkSearch;
}

export interface DateTimePropertyRow {
  id: string;
  name: string;
  groupId: string | null;
  value: string;
  search: BookmarkSearch;
}

export interface FilePropertyRow {
  id: string;
  name: string;
  groupId: string | null;
  isImage: boolean;
  url: string;
  filename: string | null;
  search: BookmarkSearch;
}

export interface ChoicesPropertyRow {
  id: string;
  name: string;
  groupId: string | null;
  items: ChoicesItem[];
  selectedValues: string[];
  displayMode: ChoicesDisplayType;
  search: BookmarkSearch;
}

export interface ProgressPropertyRow {
  id: string;
  name: string;
  groupId: string | null;
  current: number;
  total: number;
  formatted: string;
  search: BookmarkSearch;
}

export interface SectionsPropertyRow {
  id: string;
  name: string;
  groupId: string | null;
  exhaustive: boolean;
  sections: SectionEntry[];
  formatted: string;
  search: BookmarkSearch;
}

export interface TextPropertyRow {
  id: string;
  name: string;
  groupId: string | null;
  value: string;
  links: IsbnLink[];
}

export interface BookmarkPropertyRows {
  numberRows: NumberPropertyRow[];
  ratingRows: RatingPropertyRow[];
  booleanRows: BooleanPropertyRow[];
  dateTimeRows: DateTimePropertyRow[];
  fileRows: FilePropertyRow[];
  choicesRows: ChoicesPropertyRow[];
  progressRows: ProgressPropertyRow[];
  sectionsRows: SectionsPropertyRow[];
  textRows: TextPropertyRow[];
}

/** True when at least one property row across all kinds is present. */
export function hasAnyPropertyRow(rows: BookmarkPropertyRows): boolean {
  return rows.numberRows.length > 0 || rows.ratingRows.length > 0
    || rows.booleanRows.length > 0 || rows.dateTimeRows.length > 0 || rows.fileRows.length > 0
    || rows.choicesRows.length > 0 || rows.progressRows.length > 0 || rows.sectionsRows.length > 0
    || rows.textRows.length > 0;
}

/**
 * Derive the render-ready, typed custom-property rows of a bookmark, partitioned by value kind.
 * Pure: `defaultZones` (the Default card display rule's field zones, resolving the per-card boolean
 * display knobs on non-listing surfaces) is passed in rather than read from a hook. Extracted from
 * `BookmarkPropertySections` so the derivation is unit-tested independently of its rendering.
 */
export function buildBookmarkPropertyRows(
  bookmark: Bookmark,
  properties: CustomProperty[],
  defaultZones: CardFieldZones | undefined,
): BookmarkPropertyRows {
  const byId = new Map(properties.map(property => [property.id, property]));

  const numberRows = bookmark.numberValues
    .map((entry): NumberPropertyRow | null => {
      const property = byId.get(entry.propertyId);
      // Rating scales live in numberValues but render as stars, not a formatted number.
      return property && property.type !== "ratingScale" && property.showInDetails
        ? {
          id: entry.propertyId,
          name: property.name,
          groupId: property.propertyGroupId,
          isCalculated: property.type === "calculate",
          value: formatNumber(entry.value, property),
          search: buildPropertyQuickSearch(property, entry.value),
        }
        : null;
    })
    .filter((row): row is NumberPropertyRow => row !== null);

  const ratingRows = bookmark.numberValues
    .map((entry): RatingPropertyRow | null => {
      const property = byId.get(entry.propertyId);
      return property && property.type === "ratingScale" && property.showInDetails
        ? {
          id: entry.propertyId,
          name: property.name,
          groupId: property.propertyGroupId,
          value: entry.value,
          max: (property.ratingMax ?? 5) as number,
          allowHalf: property.ratingAllowHalf,
          label: property.ratingShowLabel ? (property.ratingLabel ?? undefined) : undefined,
          search: buildPropertyQuickSearch(property, entry.value),
        }
        : null;
    })
    .filter((row): row is RatingPropertyRow => row !== null);

  const booleanRows = bookmark.booleanValues
    .map((entry): BooleanPropertyRow | null => {
      const property = byId.get(entry.propertyId);
      if (!property || !property.showInDetails) return null;
      const display = resolveBooleanDisplay(defaultZones, property.id);
      if (!entry.value && !display.showIfFalse) return null;
      const isIconPreset = !display.hideIcon
        && (property.booleanLabelPreset === "icons" || property.booleanLabelPreset === "stars");
      return {
        id: entry.propertyId,
        name: property.name,
        groupId: property.propertyGroupId,
        rawValue: entry.value,
        value: formatBoolean(entry.value, property, {
          hideIcon: display.hideIcon,
        }),
        showLabelColon: isIconPreset ? display.showLabelColon : true,
        showValueBeforeLabel: isIconPreset ? display.showValueBeforeLabel : false,
        clickableInView: display.clickableInView,
        search: buildPropertyQuickSearch(property, entry.value),
      };
    })
    .filter((row): row is BooleanPropertyRow => row !== null);

  const dateTimeRows = bookmark.dateTimeValues
    .map((entry): DateTimePropertyRow | null => {
      const property = byId.get(entry.propertyId);
      return property && property.showInDetails
        ? {
          id: entry.propertyId,
          name: property.name,
          groupId: property.propertyGroupId,
          value: formatDateTime(entry.value, property),
          search: buildPropertyQuickSearch(property, entry.value),
        }
        : null;
    })
    .filter((row): row is DateTimePropertyRow => row !== null);

  const fileRows = bookmark.fileValues
    .map((entry): FilePropertyRow | null => {
      const property = byId.get(entry.propertyId);
      // Only image/file properties opted into the detail view via `showInDetails` render here.
      return property && property.showInDetails
        ? {
          id: entry.propertyId,
          name: property.name,
          groupId: property.propertyGroupId,
          isImage: property.type === "image",
          url: entry.url,
          filename: entry.originalFilename,
          search: buildPropertyQuickSearch(property, entry.url),
        }
        : null;
    })
    .filter((row): row is FilePropertyRow => row !== null);

  const choicesRows = bookmark.choicesValues
    .map((entry): ChoicesPropertyRow | null => {
      const property = byId.get(entry.propertyId);
      return property && property.type === "choices" && property.showInDetails && entry.values.length > 0
        ? {
          id: entry.propertyId,
          name: property.name,
          groupId: property.propertyGroupId,
          items: property.choicesItems,
          selectedValues: entry.values,
          displayMode: property.choicesDisplay ?? "radio",
          search: buildPropertyQuickSearch(property, entry.values.join(", ")),
        }
        : null;
    })
    .filter((row): row is ChoicesPropertyRow => row !== null);

  const progressRows = bookmark.progressValues
    .map((entry): ProgressPropertyRow | null => {
      const property = byId.get(entry.propertyId);
      return property && property.type === "itemInItems" && property.showInDetails
        ? {
          id: entry.propertyId,
          name: property.name,
          groupId: property.propertyGroupId,
          current: entry.current,
          total: entry.total,
          formatted: formatProgressValue(entry, property),
          search: buildPropertyQuickSearch(property, formatProgressValue(entry, property)),
        }
        : null;
    })
    .filter((row): row is ProgressPropertyRow => row !== null);

  const sectionsRows = bookmark.sectionsValues
    .map((entry): SectionsPropertyRow | null => {
      const property = byId.get(entry.propertyId);
      return property && property.type === "sections" && property.showInDetails
        ? {
          id: entry.propertyId,
          name: property.name,
          groupId: property.propertyGroupId,
          exhaustive: entry.exhaustive,
          sections: entry.sections as SectionEntry[],
          formatted: formatSectionsValue(entry as BookmarkSectionsValue),
          search: buildPropertyQuickSearch(property, formatSectionsValue(entry as BookmarkSectionsValue)),
        }
        : null;
    })
    .filter((row): row is SectionsPropertyRow => row !== null);

  const textRows = bookmark.textValues
    .map((entry): TextPropertyRow | null => {
      const property = byId.get(entry.propertyId);
      return property && property.type === "text" && property.showInDetails
        ? {
          id: entry.propertyId,
          name: property.name,
          groupId: property.propertyGroupId,
          value: entry.value,
          links: buildIsbnLinks(entry.value),
        }
        : null;
    })
    .filter((row): row is TextPropertyRow => row !== null);

  return {
    numberRows,
    ratingRows,
    booleanRows,
    dateTimeRows,
    fileRows,
    choicesRows,
    progressRows,
    sectionsRows,
    textRows,
  };
}
