import type { BookmarkSearch } from "./bookmarkSearch";
import type { IsbnLink } from "./isbnLinks";
import type { Bookmark, BookmarkSectionsValue, CardFieldZones, ChoicesDisplayType, ChoicesItem, CustomProperty, RatingDisplay, SectionEntry } from "@eesimple/types";

import { countSectionLeaves } from "@eesimple/types";

import { resolveBooleanDisplay } from "./bookmarkCardValues";
import { formatBoolean, formatDateTime, formatNumber } from "./bookmarkFormat";
import { buildPropertyQuickSearch } from "./bookmarkPropertyQuickFilter";
import { buildIsbnLinks } from "./isbnLinks";
import { formatProgressValue, formatRatingCaption, formatSectionsValue } from "./propertyFormat";

export interface NumberPropertyRow {
  id: string;
  name: string;
  isCalculated: boolean;
  value: string;
  search: BookmarkSearch;
}

export interface RatingPropertyRow {
  id: string;
  name: string;
  value: number;
  /** High end of a range rating; `null` for a single value. */
  valueEnd: number | null;
  max: number;
  allowHalf: boolean;
  label: string | undefined;
  /** Per-number label caption (single label, or `from → to`); `null` when there's nothing to add. */
  caption: string | null;
  /** How to render — stars or tick marks. */
  display: RatingDisplay;
  /** When true, a range fills its start level's glyph too (inclusive band). */
  rangeIncludeStart: boolean;
  search: BookmarkSearch;
}

export interface BooleanPropertyRow {
  id: string;
  name: string;
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
  value: string;
  search: BookmarkSearch;
}

export interface FilePropertyRow {
  id: string;
  name: string;
  isImage: boolean;
  url: string;
  filename: string | null;
  search: BookmarkSearch;
}

export interface ChoicesPropertyRow {
  id: string;
  name: string;
  items: ChoicesItem[];
  selectedValues: string[];
  displayMode: ChoicesDisplayType;
  search: BookmarkSearch;
}

export interface ProgressPropertyRow {
  id: string;
  name: string;
  current: number;
  total: number;
  formatted: string;
  search: BookmarkSearch;
}

export interface SectionsPropertyRow {
  id: string;
  name: string;
  exhaustive: boolean;
  sections: SectionEntry[];
  formatted: string;
  search: BookmarkSearch;
}

export interface TextPropertyRow {
  id: string;
  name: string;
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
          value: entry.value,
          valueEnd: entry.valueEnd ?? null,
          max: (property.ratingMax ?? 5) as number,
          allowHalf: property.ratingAllowHalf,
          label: property.ratingShowLabel ? (property.ratingLabel ?? undefined) : undefined,
          caption: formatRatingCaption(property, entry.value, entry.valueEnd, bookmark.categoryId),
          display: property.ratingDisplay ?? "stars",
          rangeIncludeStart: property.ratingRangeIncludeStart,
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
          items: property.choicesItems,
          selectedValues: entry.values,
          displayMode: property.choicesDisplay ?? "radio",
          search: buildPropertyQuickSearch(property, entry.values.join(", ")),
        }
        : null;
    })
    .filter((row): row is ChoicesPropertyRow => row !== null);

  const storedProgressIds = new Set(bookmark.progressValues.map(entry => entry.propertyId));
  const storedProgressRows = bookmark.progressValues
    .map((entry): ProgressPropertyRow | null => {
      const property = byId.get(entry.propertyId);
      return property && property.type === "itemInItems" && property.showInDetails
        ? {
          id: entry.propertyId,
          name: property.name,
          current: entry.current,
          total: entry.total,
          formatted: formatProgressValue(entry, property, bookmark.mediaType?.id ?? null),
          search: buildPropertyQuickSearch(property, formatProgressValue(entry, property, bookmark.mediaType?.id ?? null)),
        }
        : null;
    })
    .filter((row): row is ProgressPropertyRow => row !== null);
  // A sections-derived Progress with no stored value still renders on View when its linked Sections
  // value is exhaustive (the total is authoritative) — the field appears as soon as an exhaustive
  // Sections list exists, before any manual/recomputed save, deriving current/total from completion.
  const derivedProgressRows = properties
    .map((property): ProgressPropertyRow | null => {
      if (property.type !== "itemInItems" || !property.showInDetails || !property.itemInItemsSourcePropertyId) return null;
      if (storedProgressIds.has(property.id)) return null;
      const sectionsValue = bookmark.sectionsValues.find(value => value.propertyId === property.itemInItemsSourcePropertyId);
      if (!sectionsValue || !sectionsValue.exhaustive || sectionsValue.sections.length === 0) return null;
      const counts = countSectionLeaves(sectionsValue.sections);
      const value = {
        propertyId: property.id,
        current: counts.completed,
        total: counts.total,
      };
      return {
        id: property.id,
        name: property.name,
        current: counts.completed,
        total: counts.total,
        formatted: formatProgressValue(value, property, bookmark.mediaType?.id ?? null),
        search: buildPropertyQuickSearch(property, formatProgressValue(value, property, bookmark.mediaType?.id ?? null)),
      };
    })
    .filter((row): row is ProgressPropertyRow => row !== null);
  const progressRows = [...storedProgressRows, ...derivedProgressRows];

  const sectionsRows = bookmark.sectionsValues
    .map((entry): SectionsPropertyRow | null => {
      const property = byId.get(entry.propertyId);
      return property && property.type === "sections" && property.showInDetails
        ? {
          id: entry.propertyId,
          name: property.name,
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
