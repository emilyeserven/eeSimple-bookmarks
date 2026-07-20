import type { BookmarkProgressValue, BookmarkSectionsValue, CustomProperty, CustomPropertyType, DateTimeFormat, NumberFormat, SectionEntry } from "@eesimple/types";

import { resolveItemInItemsTexts, resolveRatingLevelLabel, SECTION_ENTRY_TYPE_LABELS } from "@eesimple/types";

import i18n from "../i18n";

/** Human labels for each custom-property type, shared by the detail view and listing previews. */
export const TYPE_LABELS: Record<CustomPropertyType, string> = {
  number: i18n.t("Number"),
  boolean: i18n.t("Boolean"),
  calculate: i18n.t("Calculate (Sum)"),
  datetime: i18n.t("Date / Time"),
  ratingScale: i18n.t("Rating Scale"),
  image: i18n.t("Image"),
  file: i18n.t("File"),
  choices: i18n.t("Choices"),
  itemInItems: i18n.t("Item in Items"),
  sections: i18n.t("Sections"),
  text: i18n.t("Text"),
};

/** Which parts of a progress value's text to render (see {@link composeProgressText}). */
export interface ProgressTextOptions {
  /** Show the "X of Y" numbers (default true). */
  showCount?: boolean;
  /** Show the unit / counter-word text — the before/after segments (default true). */
  showUnit?: boolean;
}

/**
 * Compose an itemInItems value's display text from its configured segments, honoring the
 * per-media-type overrides when the bookmark's media type is passed (e.g. "3 of 10 pages" on a book
 * vs "24 of 230 modules" on a course). The two flags select which parts render — the "X of Y" count
 * and/or the unit / counter-word text — so a card field can show either, both, or none:
 * - both → `before + "X of Y" + after` (the full string, e.g. "chapter 3 of 12" or "3 of 10 pages")
 * - count only → `"X of Y"` (e.g. "3 of 10")
 * - unit only → the trimmed before/after words (e.g. "pages" or "chapter")
 * - neither → `""`
 */
export function composeProgressText(
  value: BookmarkProgressValue,
  property: CustomProperty,
  mediaTypeId?: string | null,
  options?: ProgressTextOptions,
): string {
  const showCount = options?.showCount ?? true;
  const showUnit = options?.showUnit ?? true;
  const texts = resolveItemInItemsTexts(property, mediaTypeId, value.textOverride);
  const before = texts.before ?? "";
  const between = texts.between ?? i18n.t(" of ");
  const after = texts.after ?? "";
  // Auto-spacing (per-bookmark, default on) is applied to the count-bearing branches via
  // joinProgressDisplay; the unit-only branch is already trimmed words.
  if (showCount && showUnit) return joinProgressDisplay(before, value.current, between, value.total, after, value.autoSpace);
  if (showCount) return joinProgressDisplay("", value.current, between, value.total, "", value.autoSpace);
  if (showUnit) return [before.trim(), after.trim()].filter(Boolean).join(" ");
  return "";
}

/**
 * Format an itemInItems value using the property's configured text segments (the full "X of Y unit"
 * string). Thin wrapper over {@link composeProgressText} with both parts shown.
 */
export function formatProgressValue(
  value: BookmarkProgressValue,
  property: CustomProperty,
  mediaTypeId?: string | null,
): string {
  return composeProgressText(value, property, mediaTypeId);
}

/**
 * Assemble an itemInItems display string from its resolved segments. Auto-spacing (the default, unless
 * the bookmark opts out with `autoSpace === false`): each **non-empty** text label is trimmed and set
 * off from its adjacent number by a single space, while an empty label introduces no separator. This
 * is backward-compatible with the raw concat for labels that already carry their own spacing (the
 * default `between` `" of "` → "5 of 200", book `after` `" pages"` → "5 of 200 pages", an empty
 * `between` → "12"), but lets a user type "page"/"of"/"pages" without spaces and get "page 5 of 200
 * pages". `autoSpace === false` keeps the verbatim concat, so a tight `between:"/"` renders "5/200".
 * Shared by the formatter and the property-config previews.
 */
export function joinProgressDisplay(
  before: string,
  current: number,
  between: string,
  total: number,
  after: string,
  autoSpace?: boolean | null,
): string {
  if (autoSpace === false) {
    return `${before}${current}${between}${total}${after}`;
  }
  const beforeLabel = before.trim();
  const betweenLabel = between.trim();
  const afterLabel = after.trim();
  let out = beforeLabel ? `${beforeLabel} ${current}` : `${current}`;
  out += betweenLabel ? ` ${betweenLabel} ${total}` : `${total}`;
  if (afterLabel) out += ` ${afterLabel}`;
  return out;
}

/** The selectable levels of a `ratingScale`, low → high (0 when zero allowed; half-steps when allowed). */
export function ratingLevelValues(property: CustomProperty): number[] {
  const max = property.ratingMax ?? 5;
  const min = property.ratingAllowZero ? 0 : 1;
  const step = property.ratingAllowHalf ? 0.5 : 1;
  const levels: number[] = [];
  for (let level = min; level <= max + 1e-9; level += step) {
    levels.push(Math.round(level * 2) / 2);
  }
  return levels;
}

/**
 * The display label for a single rating level: the bookmark's category override, else the
 * property's per-number label, else the number (see `resolveRatingLevelLabel` in `@eesimple/types`).
 */
export function ratingLevelLabel(
  property: CustomProperty,
  level: number,
  categoryId?: string | null,
): string {
  return resolveRatingLevelLabel(property, level, categoryId) ?? String(level);
}

/**
 * A caption for a rating value using the per-number labels: a single label, or `from → to` for a
 * range. Returns `null` when the property has no labels and no range (nothing to add beside the
 * stars). Pass the bookmark's `categoryId` so its category label overrides apply.
 */
export function formatRatingCaption(
  property: CustomProperty,
  value: number,
  valueEnd?: number | null,
  categoryId?: string | null,
): string | null {
  // A range always gets a caption (labels, or the numbers when unlabelled) since the stars alone
  // can't convey "from X to Y".
  const isRange = valueEnd != null && valueEnd !== value;
  if (isRange) {
    return `${ratingLevelLabel(property, value, categoryId)} → ${ratingLevelLabel(property, valueEnd, categoryId)}`;
  }
  // A single value shows a caption only when *that* level is labelled (else the stars suffice).
  return resolveRatingLevelLabel(property, value, categoryId);
}

/** Human labels for what a `datetime` property captures. */
export const DATE_TIME_FORMAT_LABELS: Record<DateTimeFormat, string> = {
  date: i18n.t("Date only"),
  time: i18n.t("Time only"),
  datetime: i18n.t("Date & time"),
};

/** Human labels for how a `number` property's value is displayed. */
export const NUMBER_FORMAT_LABELS: Record<NumberFormat, string> = {
  plain: i18n.t("Plain"),
  duration: i18n.t("Duration"),
};

/**
 * Render a `timestamp`-type section value (stored as integer seconds) as a clock — `m:ss` or, past an
 * hour, `h:mm:ss`. A non-numeric value is returned unchanged so hand-entered strings still display.
 */
export function formatSeconds(value: string): string {
  const total = Number(value);
  if (!Number.isFinite(total) || value.trim() === "") return value;
  const secs = Math.max(0, Math.floor(total));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  return `${h > 0 ? `${h}:` : ""}${mm}:${String(s).padStart(2, "0")}`;
}

/** Format a single section entry's positional value, rendering timestamp seconds as a clock. */
export function formatSectionValue(entry: SectionEntry): string {
  const display = (v: string) => (entry.type === "timestamp" ? formatSeconds(v) : v);
  return entry.endValue ? `${display(entry.startValue)}–${display(entry.endValue)}` : display(entry.startValue);
}

/**
 * The clickable link for a section entry, or `undefined`. The explicit {@link SectionEntry.url} wins;
 * otherwise a legacy `type: "url"` entry's {@link SectionEntry.startValue} is used (it predates the
 * dedicated `url` field). Blank values resolve to `undefined`.
 */
export function sectionEntryLink(entry: SectionEntry): string | undefined {
  if (entry.url && entry.url.trim() !== "") return entry.url.trim();
  if (entry.type === "url" && entry.startValue.trim() !== "") return entry.startValue.trim();
  return undefined;
}

/**
 * The positional value to render as text beside a section entry's name. Suppressed for `type: "url"`
 * (whose value is shown as the link instead, via {@link sectionEntryLink}); otherwise the page range
 * / timestamp clock from {@link formatSectionValue}.
 */
export function sectionEntryPositional(entry: SectionEntry): string {
  return entry.type === "url" ? "" : formatSectionValue(entry);
}

/** Format a single section entry as a one-line summary (e.g. "Chapter 1: pp. 1–10" or "Intro: 0:00–5:30"). */
export function formatSectionEntry(entry: SectionEntry): string {
  const typeSuffix = SECTION_ENTRY_TYPE_LABELS[entry.type];
  const value = formatSectionValue(entry);
  // A `name`-only entry (or any entry with a blank positional value) shows just its name + type.
  const base = value ? `${entry.name}: ${value} (${typeSuffix})` : `${entry.name} (${typeSuffix})`;
  const childCount = entry.children?.length ?? 0;
  return childCount > 0 ? `${base} · ${childCount} ${childCount === 1 ? "item" : "items"}` : base;
}

/** Total leaf items across a tiered value (children count; a childless entry counts as one item). */
function countSectionItems(value: BookmarkSectionsValue): number {
  return value.sections.reduce((sum, s) => sum + (s.children?.length ?? 0), 0);
}

/** Format a sections value as a compact summary (e.g. "3 sections (exhaustive)" or "3 sections, 12 items"). */
export function formatSectionsValue(value: BookmarkSectionsValue): string {
  const count = value.sections.length;
  const base = count === 1 ? "1 section" : `${count} sections`;
  const items = countSectionItems(value);
  const withItems = items > 0 ? `${base}, ${items} ${items === 1 ? "item" : "items"}` : base;
  return value.exhaustive ? `${withItems} (exhaustive)` : withItems;
}

/** Default Lucide icon name for each custom-property type. */
export const CUSTOM_PROPERTY_TYPE_ICONS: Record<CustomPropertyType, string> = {
  number: "Hash",
  boolean: "ToggleLeft",
  calculate: "Sigma",
  datetime: "Calendar",
  ratingScale: "Star",
  image: "Image",
  file: "Paperclip",
  choices: "ListChecks",
  itemInItems: "Layers",
  sections: "BookOpen",
  text: "ALargeSmall",
};

/**
 * Resolve the effective icon name for a property type.
 * Applies a user override when present, otherwise returns the default.
 */
export function resolvePropertyTypeIcon(
  type: CustomPropertyType,
  overrides: Partial<Record<CustomPropertyType, string>> | null | undefined,
): string {
  return overrides?.[type] ?? CUSTOM_PROPERTY_TYPE_ICONS[type];
}
