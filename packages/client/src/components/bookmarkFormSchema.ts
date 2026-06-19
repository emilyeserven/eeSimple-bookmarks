import type { ImageIntent } from "./bookmarkImageIntent";
import type { AutofillInput, AutofillResult } from "../lib/autofill";
import type {
  AutofillRule,
  Bookmark,
  BookmarkBooleanValue,
  BookmarkDateTimeValue,
  BookmarkNumberValue,
  CustomProperty,
} from "@eesimple/types";

import { propertyAppliesToCategory } from "@eesimple/types";
import { z } from "zod";

import { EMPTY_IMAGE_INTENT } from "./bookmarkImageIntent";
import { applyAutofill } from "../lib/autofill";
import { useAppForm } from "../lib/form";
import { buildNumberValuesFromInputs } from "../lib/propertyValues";

export const bookmarkSchema = z.object({
  url: z.string().url("Enter a valid URL"),
  title: z.string().min(1, "Title is required"),
  categoryId: z.string().min(1, "Category is required"),
  description: z.string(),
  tagIds: z.array(z.string()),
});

/** Slug of the built-in "Video Length" property, hidden from the form (filled server-side). */
export const VIDEO_LENGTH_SLUG = "video-length";

/** Cheap client-side check so we only hit the richer metadata endpoint for YouTube URLs. */
export function looksLikeYouTube(url: string): boolean {
  return /(?:youtube\.com|youtu\.be)/i.test(url);
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
  categoryId: string;
  description: string;
  tagIds: string[];
} = {
  url: "",
  title: "",
  categoryId: "",
  description: "",
  tagIds: [],
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

/** The raw custom-property inputs the submit handler reads off its ref. */
export interface CustomPropertyInputs {
  numberInputs: Record<string, string>;
  booleanInputs: Record<string, boolean>;
  dateTimeInputs: Record<string, string>;
}

/** The category-scoped, validated property values built for a bookmark's create/update payload. */
export interface CategoryPropertyValues {
  numberValues: BookmarkNumberValue[];
  booleanValues: BookmarkBooleanValue[];
  dateTimeValues: BookmarkDateTimeValue[];
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
      file: null,
      auto: true,
      remove: false,
    }
    : EMPTY_IMAGE_INTENT;
}

/**
 * Build the typed property values for the submit payload: only properties that belong to the chosen
 * category and are enabled, with number inputs parsed/validated and empty datetimes dropped.
 */
export function buildCategoryPropertyValues(
  customProperties: CustomProperty[],
  categoryId: string,
  inputs: CustomPropertyInputs,
): CategoryPropertyValues {
  const {
    numberInputs: numbers, booleanInputs: booleans, dateTimeInputs: dateTimes,
  } = inputs;
  // Only persist values for properties that belong to the chosen category and are enabled.
  const categoryProps = customProperties.filter(property =>
    propertyAppliesToCategory(property, categoryId) && property.enabled);
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
  return {
    numberValues,
    booleanValues,
    dateTimeValues,
  };
}
