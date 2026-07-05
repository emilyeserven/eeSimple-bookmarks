import type { ImageIntent } from "./bookmarkImageIntent";
import type { DraftEntityName } from "./entityNames/draftEntityName";
import type { AutofillInput, AutofillResult } from "../lib/autofill";
import type {
  AutofillRule,
  Bookmark,
  BookmarkBooleanValue,
  BookmarkChoicesValue,
  BookmarkDateTimeValue,
  BookmarkNumberValue,
  BookmarkProgressValue,
  BookmarkSectionsValue,
  BookmarkTextValue,
  CustomProperty,
  SectionEntry,
} from "@eesimple/types";

import { propertyAppliesToCategory, propertyAppliesToMediaType } from "@eesimple/types";
import { z } from "zod";

import { EMPTY_IMAGE_INTENT } from "./bookmarkImageIntent";
import i18n from "../i18n";
import { applyAutofill } from "../lib/autofill";
import { useAppForm } from "../lib/form";
import { buildNumberValuesFromInputs } from "../lib/propertyValues";

export const bookmarkSchema = z.object({
  url: z.string(),
  title: z.string().min(1, i18n.t("Title is required")),
  romanizedName: z.string(),
  // Staged multilingual names for the create form (create-only — edit uses its own EntityNamesTabEditor).
  names: z.array(z.object({
    languageId: z.string(),
    value: z.string(),
    isPrimary: z.boolean(),
  })),
  categoryId: z.string().min(1, i18n.t("Category is required")),
  mediaTypeId: z.string(),
  description: z.string(),
  tagIds: z.array(z.string()),
  genreMoodIds: z.array(z.string()),
  locationIds: z.array(z.string()),
  blacklistedTagIds: z.array(z.string()),
  blacklistedLocationIds: z.array(z.string()),
  personIds: z.array(z.string()),
  groupIds: z.array(z.string()),
  groupId: z.string(),
  // Media-link FKs — at most one is set (empty string = unset); the media picker enforces exclusivity.
  bookId: z.string(),
  movieId: z.string(),
  tvShowId: z.string(),
  episodeId: z.string(),
  albumId: z.string(),
  trackId: z.string(),
  podcastId: z.string(),
});

/**
 * Slugs of built-in detail custom properties hidden from the Add Bookmark form (filled
 * server-side or better filled after creation in the edit/properties view). Re-exported from
 * `@eesimple/types` — the single source of truth shared with the Bookmark Add Form placement
 * settings (Settings → Display → Add Bookmark Form) — so every existing importer keeps working
 * unchanged.
 */
export {
  CHAPTERS_SLUG,
  CONTENT_STATUS_SLUG,
  DATE_POSTED_SLUG,
  PAGE_PROGRESS_SLUG,
  PAGE_RANGE_SLUG,
  PAGE_SECTIONS_SLUG,
  RUNTIME_SLUG,
  URL_SECTIONS_SLUG,
} from "@eesimple/types";

/** Slug of the built-in "ISBN / ASIN" property — shown in the Add Bookmark form. */
export const ISBN_SLUG = "isbn";

/**
 * Case-insensitive name a user gives an availability-kind usage level to mean "this is the
 * bookmark's main content language" — there is no dedicated primary-language field anymore; scan/ISBN
 * auto-detect looks for an existing level with this name and attaches to it, no-opping (leaving the
 * language unassigned for manual entry) when no such level has been created yet.
 */
export const PRIMARY_LANGUAGE_LEVEL_NAME = "primary language";

/** Cheap client-side check so we only hit the richer metadata endpoint for YouTube URLs. */
export function looksLikeYouTube(url: string): boolean {
  return /(?:youtube\.com|youtu\.be)/i.test(url);
}

/** Client-side check: returns true when value looks like a fetchable URL. */
export function looksLikeUrl(value: string): boolean {
  return z.string().url().safeParse(value.trim()).success;
}

/** The kind of value the Add Bookmark primary input holds. */
export type BookmarkInputType = "url" | "isbn" | "text";

/**
 * Normalize an ISBN-like string: strip spaces and dashes, then accept an ISBN-13 (13 digits) or an
 * ISBN-10 (9 digits + a trailing digit or `X`). Returns the compact form (uppercased `X`), or `null`
 * when it isn't a syntactic ISBN. The checksum is intentionally not verified — the metadata lookup is
 * the real validator and a permissive client-side hint is fine.
 */
export function normalizeIsbn(value: string): string | null {
  const compact = value.replace(/[\s-]/g, "").toUpperCase();
  if (/^\d{13}$/.test(compact)) return compact;
  if (/^\d{9}[\dX]$/.test(compact)) return compact;
  return null;
}

/**
 * Classify the Add Bookmark primary input as a fetchable URL, an ISBN (10 or 13, dashed or not), or
 * plain text. URL is checked first (unambiguous); an empty value is treated as `"url"` — the neutral
 * default that keeps the normal Check URL / Add Now actions.
 */
export function detectBookmarkInputType(value: string): BookmarkInputType {
  const trimmed = value.trim();
  if (trimmed === "" || looksLikeUrl(trimmed)) return "url";
  if (normalizeIsbn(trimmed) !== null) return "isbn";
  return "text";
}

/**
 * A short, human-readable label for the detected input type, shown under the input, or `null` when
 * the input is empty. The ISBN case distinguishes the 10- vs 13-digit form.
 */
export function bookmarkInputHint(value: string): string | null {
  if (value.trim() === "") return null;
  const type = detectBookmarkInputType(value);
  if (type === "url") return i18n.t("Web link");
  if (type === "isbn") return normalizeIsbn(value)?.length === 13 ? i18n.t("ISBN-13") : i18n.t("ISBN-10");
  return i18n.t("Text — saved as the name");
}

/** Client-side mirror of the server's stripSiteNameSuffix for user-entered selfIds. */
export function stripSelfId(title: string, selfId: string): string {
  const escaped = selfId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`\\s*[-|–—·•:／]\\s*${escaped}\\s*$`, "i");
  const stripped = title.replace(re, "").trim();
  return stripped.length > 0 ? stripped : title;
}

/** Build a GitHub "new issue" URL (prefilled title/body) and open it in a new tab. */
export function openGitHubIssue(title: string, body: string): void {
  const url = new URL("https://github.com/emilyeserven/eesimple-bookmarks/issues/new");
  url.searchParams.set("title", title);
  url.searchParams.set("body", body);
  url.searchParams.set("labels", "bug");
  window.open(url.toString(), "_blank", "noopener,noreferrer");
}

/** The defaultValues shape for the bookmark form (drives `BookmarkFormApi`'s inferred field types). */
const SAMPLE_DEFAULT_VALUES: {
  url: string;
  title: string;
  romanizedName: string;
  names: DraftEntityName[];
  categoryId: string;
  mediaTypeId: string;
  description: string;
  tagIds: string[];
  genreMoodIds: string[];
  locationIds: string[];
  blacklistedTagIds: string[];
  blacklistedLocationIds: string[];
  personIds: string[];
  groupIds: string[];
  groupId: string;
  bookId: string;
  movieId: string;
  tvShowId: string;
  episodeId: string;
  albumId: string;
  trackId: string;
  podcastId: string;
} = {
  url: "",
  title: "",
  romanizedName: "",
  names: [],
  categoryId: "",
  mediaTypeId: "",
  description: "",
  tagIds: [],
  genreMoodIds: [],
  locationIds: [],
  blacklistedTagIds: [],
  blacklistedLocationIds: [],
  personIds: [],
  groupIds: [],
  groupId: "",
  bookId: "",
  movieId: "",
  tvShowId: "",
  episodeId: "",
  albumId: "",
  trackId: "",
  podcastId: "",
};

/**
 * The exact `useAppForm` instance type for the bookmark form, with `bookmarkSchema` wired as the
 * `onChange` validator. Sub-sections (e.g. the URL / images / properties field groups) take the live
 * form as a prop typed with this so they share the parent's fully-inferred field types. Inferred from
 * a sample factory (never executed — it exists only for its return type) so the generic shape always
 * matches `BookmarkForm`'s real `useAppForm` call, including the validator generics. The
 * `Bookmark`-derived `defaultValues` in `BookmarkForm` resolve to this same shape.
 */
function _bookmarkFormApiSample(_bookmark?: Bookmark) {
  return useAppForm({
    defaultValues: SAMPLE_DEFAULT_VALUES,
    validators: {
      onChange: bookmarkSchema,
    },
  });
}
export type BookmarkFormApi = ReturnType<typeof _bookmarkFormApiSample>;

/**
 * Initial create-mode values for the bookmark form, e.g. the URL/title handed in by the quick-add
 * popup. Ignored in edit mode (the existing bookmark's values take precedence).
 */
export interface BookmarkInitialValues {
  url?: string;
  title?: string;
  romanizedName?: string;
}

/**
 * The bookmark form's `defaultValues`, derived from an optional existing bookmark (edit) and an
 * optional locked category (create on a category page). In create mode, `initial` seeds the
 * URL/title (used by the quick-add popup). Extracted so the controller's `useAppForm` call stays a
 * single line and the nullish-fallback chain lives in one tested place.
 */
/** Scalar string fields, drawn from the bookmark, then the locked category / initial seed, else "". */
function scalarBookmarkDefaults(
  bookmark: Bookmark | undefined,
  lockedCategoryId: string | undefined,
  initial: BookmarkInitialValues,
) {
  return {
    url: bookmark?.originalUrl ?? bookmark?.url ?? initial.url ?? "",
    title: bookmark?.title ?? initial.title ?? "",
    romanizedName: bookmark?.romanizedName ?? initial.romanizedName ?? "",
    // Create-only staged names; edit mode manages names via its own EntityNamesTabEditor.
    names: [] as DraftEntityName[],
    categoryId: bookmark?.categoryId ?? lockedCategoryId ?? "",
    mediaTypeId: bookmark?.mediaType?.id ?? "",
    description: bookmark?.description ?? "",
    groupId: bookmark?.group?.id ?? "",
  };
}

/** The six media-link FK fields, defaulting to "" when the bookmark isn't linked to that media item. */
function mediaLinkDefaults(bookmark: Bookmark | undefined) {
  return {
    bookId: bookmark?.bookId ?? "",
    movieId: bookmark?.movieId ?? "",
    tvShowId: bookmark?.tvShowId ?? "",
    episodeId: bookmark?.episodeId ?? "",
    albumId: bookmark?.albumId ?? "",
    trackId: bookmark?.trackId ?? "",
    podcastId: bookmark?.podcastId ?? "",
  };
}

/** The multi-select relation id arrays, defaulting to [] when the bookmark has no such relations. */
function relationDefaults(bookmark: Bookmark | undefined) {
  return {
    tagIds: (bookmark?.tags.map(tag => tag.id) ?? []) as string[],
    genreMoodIds: (bookmark?.genreMoods.map(entry => entry.id) ?? []) as string[],
    locationIds: (bookmark?.locations.map(location => location.id) ?? []) as string[],
    blacklistedTagIds: (bookmark?.blacklistedTagIds ?? []) as string[],
    blacklistedLocationIds: (bookmark?.blacklistedLocationIds ?? []) as string[],
    personIds: (bookmark?.people.map(a => a.id) ?? []) as string[],
    groupIds: (bookmark?.groups.map(g => g.id) ?? []) as string[],
  };
}

export function buildBookmarkDefaultValues(
  bookmark: Bookmark | undefined,
  lockedCategoryId: string | undefined,
  initial: BookmarkInitialValues = {},
) {
  return {
    ...scalarBookmarkDefaults(bookmark, lockedCategoryId, initial),
    ...mediaLinkDefaults(bookmark),
    ...relationDefaults(bookmark),
  };
}

/** The raw custom-property inputs the submit handler reads off its ref. */
export interface CustomPropertyInputs {
  numberInputs: Record<string, string>;
  booleanInputs: Record<string, boolean>;
  dateTimeInputs: Record<string, string>;
  choicesInputs: Record<string, string[]>;
  progressInputs: Record<string, { current: string;
    total: string; }>;
  sectionsInputs: Record<string, { exhaustive: boolean;
    sections: SectionEntry[]; }>;
  textInputs: Record<string, string>;
}

/** The category-scoped, validated property values built for a bookmark's create/update payload. */
export interface CategoryPropertyValues {
  numberValues: BookmarkNumberValue[];
  booleanValues: BookmarkBooleanValue[];
  dateTimeValues: BookmarkDateTimeValue[];
  progressValues: BookmarkProgressValue[];
}

/** Run the autofill rules against the current URL/Title and return the suggested values. */
export function computeAutofill(input: AutofillInput, rules: AutofillRule[]): AutofillResult {
  return applyAutofill(input, rules);
}

/**
 * The pending image intent for a fresh (or just-reset) form: auto-fetch the preview when the
 * auto-fetch-image setting is on, otherwise the no-op default.
 */
export function initialImageIntent(autoFetchImage: boolean): ImageIntent {
  return autoFetchImage
    ? {
      ...EMPTY_IMAGE_INTENT,
      auto: true,
    }
    : EMPTY_IMAGE_INTENT;
}

/**
 * Build the typed progress-property values for the submit payload: only enabled itemInItems
 * properties scoped to the chosen category or media type, with at least one non-empty input.
 */
export function buildProgressValuesFromInputs(
  customProperties: CustomProperty[],
  categoryId: string,
  progressInputs: Record<string, { current: string;
    total: string; }>,
  mediaTypeId: string | null = null,
): BookmarkProgressValue[] {
  const categoryProps = customProperties.filter(property =>
    (propertyAppliesToCategory(property, categoryId)
      || propertyAppliesToMediaType(property, mediaTypeId))
    && property.enabled
    && property.type === "itemInItems");
  return categoryProps.flatMap((property) => {
    const entry = progressInputs[property.id];
    if (!entry) return [];
    const current = Number(entry.current);
    const total = Number(entry.total);
    if (!Number.isFinite(current) || !Number.isFinite(total)) return [];
    if (entry.current === "" && entry.total === "") return [];
    return [{
      propertyId: property.id,
      current,
      total,
    }];
  });
}

/**
 * Build the typed choices-property values for the submit payload: only enabled choices properties
 * scoped to the chosen category or media type, with non-empty selections.
 */
export function buildChoicesValuesFromInputs(
  customProperties: CustomProperty[],
  categoryId: string,
  choicesInputs: Record<string, string[]>,
  mediaTypeId: string | null = null,
): BookmarkChoicesValue[] {
  const categoryProps = customProperties.filter(property =>
    (propertyAppliesToCategory(property, categoryId)
      || propertyAppliesToMediaType(property, mediaTypeId))
    && property.enabled
    && property.type === "choices");
  return categoryProps.flatMap((property) => {
    const values = choicesInputs[property.id] ?? [];
    return values.length > 0
      ? [{
        propertyId: property.id,
        values,
      }]
      : [];
  });
}

/**
 * Build the typed sections-property values for the submit payload: only enabled sections properties
 * scoped to the chosen category or media type, with non-empty sections arrays.
 */
export function buildSectionsValuesFromInputs(
  customProperties: CustomProperty[],
  categoryId: string,
  sectionsInputs: Record<string, { exhaustive: boolean;
    sections: SectionEntry[]; }>,
  mediaTypeId: string | null = null,
): BookmarkSectionsValue[] {
  const categoryProps = customProperties.filter(property =>
    (propertyAppliesToCategory(property, categoryId)
      || propertyAppliesToMediaType(property, mediaTypeId))
    && property.enabled
    && property.type === "sections");
  return categoryProps.flatMap((property) => {
    const entry = sectionsInputs[property.id];
    if (!entry) return [];
    return [{
      propertyId: property.id,
      exhaustive: entry.exhaustive,
      sections: entry.sections,
    }];
  });
}

/**
 * Build the typed text-property values for the submit payload: only enabled text properties scoped
 * to the chosen category or media type, with non-empty values.
 */
export function buildTextValuesFromInputs(
  customProperties: CustomProperty[],
  categoryId: string,
  textInputs: Record<string, string>,
  mediaTypeId: string | null = null,
): BookmarkTextValue[] {
  const categoryProps = customProperties.filter(property =>
    (propertyAppliesToCategory(property, categoryId)
      || propertyAppliesToMediaType(property, mediaTypeId))
    && property.enabled
    && property.type === "text");
  return categoryProps.flatMap((property) => {
    const value = (textInputs[property.id] ?? "").trim();
    return value
      ? [{
        propertyId: property.id,
        value,
      }]
      : [];
  });
}

/**
 * Build the typed property values for the submit payload: only properties that belong to the chosen
 * category OR the chosen media type (union scoping) and are enabled, with number inputs
 * parsed/validated and empty datetimes dropped.
 */
export function buildCategoryPropertyValues(
  customProperties: CustomProperty[],
  categoryId: string,
  inputs: CustomPropertyInputs,
  mediaTypeId: string | null = null,
): CategoryPropertyValues {
  const {
    numberInputs: numbers, booleanInputs: booleans, dateTimeInputs: dateTimes, progressInputs: progress,
  } = inputs;
  // Only persist values for properties scoped to the chosen category or media type, and enabled.
  const categoryProps = customProperties.filter(property =>
    (propertyAppliesToCategory(property, categoryId)
      || propertyAppliesToMediaType(property, mediaTypeId))
    && property.enabled);
  const numberValues = buildNumberValuesFromInputs(categoryProps, numbers);
  const booleanValues: BookmarkBooleanValue[] = categoryProps
    .filter(property => property.type === "boolean")
    .map(property => ({
      propertyId: property.id,
      value: booleans[property.id] ?? false,
    }));
  const dateTimeValues: BookmarkDateTimeValue[] = categoryProps
    .filter(property => property.type === "datetime")
    .map(property => ({
      propertyId: property.id,
      value: (dateTimes[property.id] ?? "").trim(),
    }))
    .filter(entry => entry.value !== "");
  const progressValues = buildProgressValuesFromInputs(customProperties, categoryId, progress, mediaTypeId);
  return {
    numberValues,
    booleanValues,
    dateTimeValues,
    progressValues,
  };
}

/** All property value arrays needed for a bookmark update, built from a single `inputs` snapshot. */
export interface AllPropertyValues extends CategoryPropertyValues {
  choicesValues: ReturnType<typeof buildChoicesValuesFromInputs>;
  sectionsValues: ReturnType<typeof buildSectionsValuesFromInputs>;
  textValues: ReturnType<typeof buildTextValuesFromInputs>;
}

/**
 * Build every property-value array needed for a bookmark update in one call, using the same
 * `customProperties`, `categoryId`, `inputs`, and `mediaTypeId` args for every sub-builder.
 */
export function buildAllPropertyValues(
  customProperties: CustomProperty[],
  categoryId: string,
  inputs: CustomPropertyInputs,
  mediaTypeId: string | null = null,
): AllPropertyValues {
  const {
    numberValues, booleanValues, dateTimeValues, progressValues,
  } = buildCategoryPropertyValues(customProperties, categoryId, inputs, mediaTypeId);
  const choicesValues = buildChoicesValuesFromInputs(customProperties, categoryId, inputs.choicesInputs, mediaTypeId);
  const sectionsValues = buildSectionsValuesFromInputs(customProperties, categoryId, inputs.sectionsInputs, mediaTypeId);
  const textValues = buildTextValuesFromInputs(customProperties, categoryId, inputs.textInputs, mediaTypeId);
  return {
    numberValues,
    booleanValues,
    dateTimeValues,
    progressValues,
    choicesValues,
    sectionsValues,
    textValues,
  };
}
