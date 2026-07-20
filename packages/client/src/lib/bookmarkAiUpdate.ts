/**
 * Pure helpers behind the bookmark edit "AI" tab: list which bookmark fields an external AI may
 * update (standard scalars, taxonomy relations by name, and custom-property values), build the
 * ready-to-paste prompt (bookmark context + per-field output rules + existing vocabulary), and parse
 * the AI's pasted JSON reply into per-field proposals. No hooks, no I/O — everything here is
 * unit-tested directly; the tab's controller hook is thin wiring over these (the sectionsAiImport /
 * tagReparent convention). The review/apply half lives in `bookmarkAiUpdateReview.ts`.
 */

import type { Bookmark, CustomProperty } from "@eesimple/types";

import { propertyAppliesToCategory, propertyAppliesToMediaType } from "@eesimple/types";

/** A standard (non-property) field the AI may update. Relations are expressed by NAME in the JSON. */
export const AI_STANDARD_FIELD_KEYS = [
  "title",
  "description",
  "names",
  "year",
  "isbn",
  "priority",
  "category",
  "mediaType",
  "tags",
  "people",
  "groups",
] as const;

export type AiStandardFieldKey = typeof AI_STANDARD_FIELD_KEYS[number];

/** A checkable field: a standard field, or a custom property keyed by its id. */
export type AiUpdatableFieldKey = AiStandardFieldKey | `prop:${string}`;

/** Untranslated display labels for the standard fields (the UI wraps them in `t()`). */
export const AI_STANDARD_FIELD_LABELS: Record<AiStandardFieldKey, string> = {
  title: "Title",
  description: "Description",
  names: "Names",
  year: "Year",
  isbn: "ISBN",
  priority: "Priority",
  category: "Category",
  mediaType: "Media type",
  tags: "Tags",
  people: "People",
  groups: "Groups",
};

/** Why a listed custom property can't be AI-updated (shown as a disabled row). */
export type AiFieldDisabledReason = "calculated" | "sectionsDriven";

export interface AiUpdatableField {
  key: AiUpdatableFieldKey;
  /** Untranslated label — a standard-field label (UI translates) or the property's own name. */
  label: string;
  group: "standard" | "relations" | "properties";
  /** Set for custom-property fields. */
  property?: CustomProperty;
  /** Set when the field is listed but not updatable (derived values). */
  disabledReason?: AiFieldDisabledReason;
}

export function aiFieldKeyForProperty(propertyId: string): AiUpdatableFieldKey {
  return `prop:${propertyId}`;
}

/** The property id inside a `prop:` field key, or null for a standard key. */
export function propertyIdFromAiFieldKey(key: AiUpdatableFieldKey): string | null {
  return key.startsWith("prop:") ? key.slice("prop:".length) : null;
}

/** Whether a custom property's value can ride the AI-update JSON at all. */
function propertyIsAiListable(property: CustomProperty): boolean {
  // Image/file blobs can't be expressed in a pasted JSON object.
  return property.enabled && property.type !== "image" && property.type !== "file";
}

/** The disabled-row reason for a listable property whose value is derived, else undefined. */
function propertyDisabledReason(property: CustomProperty): AiFieldDisabledReason | undefined {
  if (property.type === "calculate") return "calculated";
  if (property.type === "itemInItems" && property.itemInItemsSourcePropertyId) return "sectionsDriven";
  return undefined;
}

/**
 * The checkable field list for one bookmark: the standard scalar fields, the by-name relation
 * fields, and every enabled JSON-typed custom property in scope for the bookmark's category or
 * media type (the same union scoping as the bookmark form; `hiddenFromForm` is deliberately NOT
 * applied — this is an edit surface). Derived (`calculate` / sections-driven progress) properties
 * are listed as disabled rows so the user sees why they can't be checked.
 */
export function listAiUpdatableFields(
  bookmark: Bookmark,
  properties: CustomProperty[],
): AiUpdatableField[] {
  const standard: AiUpdatableField[] = (["title", "description", "names", "year", "isbn", "priority"] as const)
    .map(key => ({
      key,
      label: AI_STANDARD_FIELD_LABELS[key],
      group: "standard" as const,
    }));
  const relations: AiUpdatableField[] = (["category", "mediaType", "tags", "people", "groups"] as const)
    .map(key => ({
      key,
      label: AI_STANDARD_FIELD_LABELS[key],
      group: "relations" as const,
    }));
  const propertyFields: AiUpdatableField[] = properties
    .filter(propertyIsAiListable)
    .filter(property =>
      propertyAppliesToCategory(property, bookmark.categoryId)
      || propertyAppliesToMediaType(property, bookmark.mediaType?.id ?? null))
    .map((property) => {
      const disabledReason = propertyDisabledReason(property);
      return {
        key: aiFieldKeyForProperty(property.id),
        label: property.name,
        group: "properties" as const,
        property,
        ...(disabledReason && {
          disabledReason,
        }),
      };
    });
  return [...standard, ...relations, ...propertyFields];
}

// ---------------------------------------------------------------------------------------------------
// Prompt building
// ---------------------------------------------------------------------------------------------------

/** Fallback template used when the stored (user-editable) template is empty. */
export const DEFAULT_BOOKMARK_AI_UPDATE_TEMPLATE
  = "You are helping maintain a personal bookmark database. Using the bookmark context below (and "
    + "what you know about the item, including from the web), provide improved or corrected values for "
    + "ONLY the requested fields. Leave out any field you cannot improve confidently.";

/** Existing tag names beyond this cap are omitted from the prompt (the list can be huge). */
export const TAG_VOCAB_LIMIT = 300;

export interface BookmarkAiUpdatePromptArgs {
  /** The stored user template; empty falls back to {@link DEFAULT_BOOKMARK_AI_UPDATE_TEMPLATE}. */
  template: string;
  bookmark: Bookmark;
  checked: AiUpdatableFieldKey[];
  /** Every custom property (checked ones are resolved by id from here). */
  properties: CustomProperty[];
  /** The bookmark's category name (the hydrated bookmark carries only `categoryId`). */
  categoryName: string | null;
  /** Vocabulary lists, embedded only when the matching relation field is checked. */
  categoryNames: string[];
  mediaTypeNames: string[];
  tagNames: string[];
}

/** The stored value of one per-type array for a property, or undefined when the bookmark has none. */
function propertyCurrentDisplay(property: CustomProperty, bookmark: Bookmark): string {
  switch (property.type) {
    case "number":
    case "calculate":
    case "ratingScale": {
      const entry = bookmark.numberValues.find(v => v.propertyId === property.id);
      if (!entry) return "(not set)";
      return entry.valueEnd != null ? `${entry.value}–${entry.valueEnd}` : String(entry.value);
    }
    case "boolean": {
      const entry = bookmark.booleanValues.find(v => v.propertyId === property.id);
      return entry ? String(entry.value) : "(not set)";
    }
    case "datetime": {
      const entry = bookmark.dateTimeValues.find(v => v.propertyId === property.id);
      return entry ? entry.value : "(not set)";
    }
    case "choices": {
      const entry = bookmark.choicesValues.find(v => v.propertyId === property.id);
      if (!entry || entry.values.length === 0) return "(not set)";
      const labels = new Map(property.choicesItems.map(item => [item.value, item.label]));
      return entry.values.map(v => labels.get(v) ?? v).join(", ");
    }
    case "itemInItems": {
      const entry = bookmark.progressValues.find(v => v.propertyId === property.id);
      return entry ? `${entry.current} of ${entry.total}` : "(not set)";
    }
    case "sections": {
      const entry = bookmark.sectionsValues.find(v => v.propertyId === property.id);
      return entry && entry.sections.length > 0 ? `${entry.sections.length} sections` : "(not set)";
    }
    case "text": {
      const entry = bookmark.textValues.find(v => v.propertyId === property.id);
      return entry?.value.trim() ? entry.value : "(not set)";
    }
    default:
      return "(not set)";
  }
}

/** `label: value` context line, omitted (null) when the value is empty. */
function contextLine(label: string, value: string | null | undefined): string | null {
  return value != null && value !== "" ? `- ${label}: ${value}` : null;
}

/** The "Bookmark context" block: every standard field's current value + checked properties'. */
function buildContextBlock(args: BookmarkAiUpdatePromptArgs, checkedProperties: CustomProperty[]): string {
  const {
    bookmark,
  } = args;
  const names = bookmark.names
    .map(name => `[${name.language.name}] ${name.value}`)
    .join("; ");
  const lines = [
    contextLine("Title", bookmark.title),
    contextLine("URL", bookmark.url),
    contextLine("Description", bookmark.description),
    contextLine("Category", args.categoryName),
    contextLine("Media type", bookmark.mediaType?.name ?? null),
    contextLine("Website", bookmark.website?.siteName ?? null),
    contextLine("Tags", bookmark.tags.map(tag => tag.name).join(", ")),
    contextLine("People", bookmark.people.map(person => person.name).join(", ")),
    contextLine("Groups", bookmark.groups.map(group => group.name).join(", ")),
    contextLine("Names", names),
    contextLine("Year", bookmark.year != null ? String(bookmark.year) : null),
    contextLine("ISBN", bookmark.isbn),
    contextLine("Priority", String(bookmark.priority)),
    ...checkedProperties.map(property =>
      contextLine(property.name, propertyCurrentDisplay(property, bookmark))),
  ].filter((line): line is string => line !== null);
  return ["Bookmark context:", ...lines].join("\n");
}

/** The datetime encoding rule for a property's configured format. */
function dateTimeRule(property: CustomProperty): string {
  switch (property.dateTimeFormat) {
    case "time": return "a 24h time string \"HH:MM\"";
    case "datetime": return "a local date-time string \"YYYY-MM-DDTHH:MM\"";
    default:
      return property.dateTimeAllowYearMonth
        ? "a date string \"YYYY-MM-DD\" (or month-only \"YYYY-MM\")"
        : "a date string \"YYYY-MM-DD\"";
  }
}

/** The rating bounds/step rule from the property's config. */
function ratingRule(property: CustomProperty): string {
  const max = property.ratingMax ?? 5;
  const min = property.ratingAllowZero ? 0 : 1;
  const step = property.ratingAllowHalf ? ", half steps allowed" : ", whole numbers only";
  const range = property.ratingAllowRange
    ? " (or a range object { \"value\": low, \"valueEnd\": high })"
    : "";
  return `a rating number from ${min} to ${max}${step}${range}`;
}

/** The output-format rule for one custom property, by type. */
function propertyRule(property: CustomProperty): string {
  switch (property.type) {
    case "number": {
      const bounds = [
        property.numberMin !== null ? `min ${property.numberMin}` : null,
        property.numberMax !== null ? `max ${property.numberMax}` : null,
      ].filter(Boolean).join(", ");
      const unit = property.unitPlural ?? property.unitSingular;
      const format = property.numberFormat === "duration" ? " (a count of seconds)" : "";
      return `a number${format}${bounds ? ` (${bounds})` : ""}${unit ? `, measured in ${unit}` : ""}`;
    }
    case "ratingScale": return ratingRule(property);
    case "boolean": return "true or false";
    case "datetime": return dateTimeRule(property);
    case "choices": {
      const options = property.choicesItems.map(item => `"${item.value}"`).join(", ");
      return property.choicesMultiple
        ? `an array of values from: ${options}`
        : `an array with ONE value from: ${options}`;
    }
    case "itemInItems": return "an object { \"current\": number, \"total\": number }";
    case "sections": {
      const children = property.sectionsTiered
        ? ", optionally with one level of \"children\" (same shape, no deeper nesting)"
        : "";
      return "an array of sections { \"name\": string, \"startValue\"?: page/timestamp/URL where it "
        + `starts, "endValue"?: where it ends }${children} — this REPLACES the current sections`;
    }
    case "text": return "a text string";
    default: return "a value";
  }
}

/** One `- "key": rule` line per checked field, with the property description/instructions appended. */
function buildRulesBlock(args: BookmarkAiUpdatePromptArgs, checkedProperties: CustomProperty[]): string {
  const checked = new Set(args.checked);
  const lines: string[] = [];
  if (checked.has("title")) lines.push("- \"title\": string — an improved, accurate title.");
  if (checked.has("description")) lines.push("- \"description\": string — a concise description of the item.");
  if (checked.has("names")) {
    lines.push("- \"names\": array of { \"language\": a language name or ISO 639-1 code, \"value\": the item's title in that language }.");
  }
  if (checked.has("year")) lines.push("- \"year\": integer — the publication/release year.");
  if (checked.has("isbn")) lines.push("- \"isbn\": string — the ISBN-13 (preferred) or ISBN-10.");
  if (checked.has("priority")) lines.push("- \"priority\": integer — ordering weight, higher appears first.");
  if (checked.has("category")) lines.push("- \"category\": string — ONE category name; strongly prefer a name from the existing list below.");
  if (checked.has("mediaType")) lines.push("- \"mediaType\": string — ONE media type name; strongly prefer a name from the existing list below.");
  if (checked.has("tags")) lines.push("- \"tags\": array of tag names to ADD (existing tags are kept); reuse names from the existing list below exactly when one fits.");
  if (checked.has("people")) lines.push("- \"people\": array of person names to ADD (individual creators, e.g. authors).");
  if (checked.has("groups")) lines.push("- \"groups\": array of group names to ADD (bands, studios, companies).");
  for (const property of checkedProperties) {
    const notes = [
      property.description ? `Description: ${property.description}` : null,
      property.aiInstructions ? `Instructions: ${property.aiInstructions}` : null,
    ].filter(Boolean).join(" ");
    lines.push(`- "properties"."${property.slug}": ${propertyRule(property)}.${notes ? ` ${notes}` : ""}`);
  }
  return ["Fields to update — include ONLY these keys in your reply:", ...lines].join("\n");
}

/** The existing-vocabulary block for checked relation fields; null when none apply. */
function buildVocabularyBlock(args: BookmarkAiUpdatePromptArgs): string | null {
  const checked = new Set(args.checked);
  const lines: string[] = [];
  if (checked.has("category") && args.categoryNames.length > 0) {
    lines.push(`- Categories: ${args.categoryNames.join(", ")}`);
  }
  if (checked.has("mediaType") && args.mediaTypeNames.length > 0) {
    lines.push(`- Media types: ${args.mediaTypeNames.join(", ")}`);
  }
  if (checked.has("tags") && args.tagNames.length > 0) {
    const capped = args.tagNames.slice(0, TAG_VOCAB_LIMIT);
    const truncated = args.tagNames.length > capped.length ? " (list truncated)" : "";
    lines.push(`- Tags: ${capped.join(", ")}${truncated}`);
  }
  if (lines.length === 0) return null;
  return ["Existing vocabulary:", ...lines].join("\n");
}

/** A sample JSON value per field, composed into the output example. */
function exampleValueForProperty(property: CustomProperty): unknown {
  switch (property.type) {
    case "number": return 42;
    case "ratingScale": return property.ratingAllowZero ? 0 : 4;
    case "boolean": return true;
    case "datetime":
      if (property.dateTimeFormat === "time") return "20:30";
      if (property.dateTimeFormat === "datetime") return "2024-05-01T20:30";
      return "2024-05-01";
    case "choices": return property.choicesItems.slice(0, 1).map(item => item.value);
    case "itemInItems": return {
      current: 3,
      total: 12,
    };
    case "sections": return [{
      name: "Chapter 1",
      startValue: "1",
    }];
    default: return "…";
  }
}

const STANDARD_EXAMPLES: Record<AiStandardFieldKey, unknown> = {
  title: "Improved title",
  description: "A concise description.",
  names: [{
    language: "Japanese",
    value: "…",
  }],
  year: 2022,
  isbn: "9781234567890",
  priority: 10,
  category: "Category name",
  mediaType: "Media type name",
  tags: ["existing tag", "new tag"],
  people: ["Person Name"],
  groups: ["Group Name"],
};

/** The output example filtered to the checked fields. */
function buildExample(args: BookmarkAiUpdatePromptArgs, checkedProperties: CustomProperty[]): string {
  const checked = new Set(args.checked);
  const example: Record<string, unknown> = {};
  for (const key of AI_STANDARD_FIELD_KEYS) {
    if (checked.has(key)) example[key] = STANDARD_EXAMPLES[key];
  }
  if (checkedProperties.length > 0) {
    example.properties = Object.fromEntries(
      checkedProperties.map(property => [property.slug, exampleValueForProperty(property)]),
    );
  }
  return JSON.stringify(example, null, 2);
}

/**
 * Assemble the ready-to-paste prompt: template → bookmark context → per-field output rules →
 * existing vocabulary → the strict-JSON output instruction with a checked-fields example. The prompt
 * text is AI-facing, not UI, so it is deliberately not translated (the AI-autotag precedent).
 */
export function buildBookmarkAiUpdatePrompt(args: BookmarkAiUpdatePromptArgs): string {
  const template = args.template.trim() || DEFAULT_BOOKMARK_AI_UPDATE_TEMPLATE;
  const byId = new Map(args.properties.map(property => [property.id, property]));
  const checkedProperties = args.checked
    .map(propertyIdFromAiFieldKey)
    .filter((id): id is string => id !== null)
    .map(id => byId.get(id))
    .filter((property): property is CustomProperty => property !== undefined);
  const output = "Respond with ONLY a JSON object — no prose and no code fences. Include ONLY the "
    + `fields listed above, using exactly this shape:\n${buildExample(args, checkedProperties)}`;
  return [
    template,
    buildContextBlock(args, checkedProperties),
    buildRulesBlock(args, checkedProperties),
    buildVocabularyBlock(args),
    output,
  ].filter((block): block is string => block !== null).join("\n\n");
}

// ---------------------------------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------------------------------

/** A section proposed by the AI (before it becomes a `SectionEntry`); capped at depth 2. */
export interface AiSectionProposal {
  name: string;
  startValue?: string;
  endValue?: string;
  children?: AiSectionProposal[];
}

/** One `names` entry as the AI expressed it (the language is resolved at review time). */
export interface AiNameEntry {
  language: string;
  value: string;
}

/** The normalized value of one accepted proposal, discriminated per field kind. */
export type AiProposalValue
  = | { kind: "text";
    text: string; }
    | { kind: "number";
      value: number; }
      | { kind: "name";
        name: string; }
        | { kind: "nameList";
          names: string[]; }
          | { kind: "names";
            entries: AiNameEntry[]; }
            | { kind: "propNumber";
              value: number;
              valueEnd?: number; }
              | { kind: "propBoolean";
                value: boolean; }
                | { kind: "propDateTime";
                  value: string; }
                  | { kind: "propChoices";
                    values: string[];
                    dropped: string[]; }
                    | { kind: "propProgress";
                      current: number;
                      total: number; }
                      | { kind: "propSections";
                        sections: AiSectionProposal[]; }
                        | { kind: "propText";
                          text: string; };

/** One field's parsed proposal: an accepted value, or a rejection with a short (translatable) reason. */
export type AiUpdateProposal
  = | { fieldKey: AiUpdatableFieldKey;
    ok: true;
    value: AiProposalValue; }
    | { fieldKey: AiUpdatableFieldKey;
      ok: false;
      reason: string; };

/** The outcome of parsing the pasted AI response, driving the review UI. */
export type BookmarkAiUpdateParseState
  = | { kind: "empty" }
    | { kind: "error" }
    | { kind: "invalid" }
    | { kind: "ok";
      proposals: AiUpdateProposal[];
      /** Top-level / property keys present in the JSON but not checked (ignored, surfaced muted). */
      ignoredKeys: string[]; };

/** Strip a wrapping markdown code fence (```json … ```), a common AI-response drift. */
function stripCodeFence(text: string): string {
  const fenced = /^```[a-z]*\s*\n([\s\S]*?)\n?```$/i.exec(text);
  return fenced ? fenced[1] : text;
}

function invalid(fieldKey: AiUpdatableFieldKey, reason: string): AiUpdateProposal {
  return {
    fieldKey,
    ok: false,
    reason,
  };
}

function accepted(fieldKey: AiUpdatableFieldKey, value: AiProposalValue): AiUpdateProposal {
  return {
    fieldKey,
    ok: true,
    value,
  };
}

/** A trimmed non-empty string, else null. */
function asText(raw: unknown): string | null {
  return typeof raw === "string" && raw.trim() !== "" ? raw.trim() : null;
}

/** A finite number (accepting numeric strings), else null. */
function asNumber(raw: unknown): number | null {
  const num = typeof raw === "number"
    ? raw
    : typeof raw === "string" && raw.trim() !== ""
      ? Number(raw)
      : Number.NaN;
  return Number.isFinite(num) ? num : null;
}

/** Trimmed, deduped (case-insensitively) non-empty string entries of an array, else null. */
function asNameList(raw: unknown): string[] | null {
  const list = Array.isArray(raw) ? raw : typeof raw === "string" ? [raw] : null;
  if (!list) return null;
  const seen = new Set<string>();
  const names: string[] = [];
  for (const entry of list) {
    const name = asText(entry);
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    names.push(name);
  }
  return names;
}

function parseStandardText(fieldKey: AiUpdatableFieldKey, raw: unknown): AiUpdateProposal {
  const text = asText(raw);
  return text === null
    ? invalid(fieldKey, "Not text")
    : accepted(fieldKey, {
      kind: "text",
      text,
    });
}

function parseStandardInt(fieldKey: AiUpdatableFieldKey, raw: unknown): AiUpdateProposal {
  const num = asNumber(raw);
  if (num === null || !Number.isInteger(num)) return invalid(fieldKey, "Not a whole number");
  return accepted(fieldKey, {
    kind: "number",
    value: num,
  });
}

function parseNames(fieldKey: AiUpdatableFieldKey, raw: unknown): AiUpdateProposal {
  if (!Array.isArray(raw)) return invalid(fieldKey, "Not a list of names");
  const entries: AiNameEntry[] = [];
  for (const entry of raw) {
    if (typeof entry !== "object" || entry === null) return invalid(fieldKey, "Not a list of names");
    const obj = entry as Record<string, unknown>;
    const language = asText(obj.language);
    const value = asText(obj.value);
    if (!language || !value) return invalid(fieldKey, "Not a list of names");
    entries.push({
      language,
      value,
    });
  }
  if (entries.length === 0) return invalid(fieldKey, "Not a list of names");
  return accepted(fieldKey, {
    kind: "names",
    entries,
  });
}

function parseRelation(fieldKey: AiUpdatableFieldKey, raw: unknown, single: boolean): AiUpdateProposal {
  if (single) {
    const name = asText(raw);
    return name === null
      ? invalid(fieldKey, "Not a name")
      : accepted(fieldKey, {
        kind: "name",
        name,
      });
  }
  const names = asNameList(raw);
  if (names === null || names.length === 0) return invalid(fieldKey, "Not a list of names");
  return accepted(fieldKey, {
    kind: "nameList",
    names,
  });
}

/** Whether `value` sits on the property's rating scale (bounds, zero, half steps). */
function ratingValueValid(property: CustomProperty, value: number): boolean {
  const max = property.ratingMax ?? 5;
  const min = property.ratingAllowZero ? 0 : 1;
  if (value < min || value > max) return false;
  const step = property.ratingAllowHalf ? 0.5 : 1;
  return Number.isInteger(value / step);
}

function parseRating(fieldKey: AiUpdatableFieldKey, property: CustomProperty, raw: unknown): AiUpdateProposal {
  const isRange = typeof raw === "object" && raw !== null && !Array.isArray(raw);
  if (isRange) {
    if (!property.ratingAllowRange) return invalid(fieldKey, "Not a number");
    const obj = raw as Record<string, unknown>;
    const value = asNumber(obj.value);
    const valueEnd = asNumber(obj.valueEnd);
    if (value === null || valueEnd === null) return invalid(fieldKey, "Not a number");
    if (!ratingValueValid(property, value) || !ratingValueValid(property, valueEnd) || valueEnd < value) {
      return invalid(fieldKey, "Out of range");
    }
    return accepted(fieldKey, {
      kind: "propNumber",
      value,
      valueEnd,
    });
  }
  const value = asNumber(raw);
  if (value === null) return invalid(fieldKey, "Not a number");
  if (!ratingValueValid(property, value)) return invalid(fieldKey, "Out of range");
  return accepted(fieldKey, {
    kind: "propNumber",
    value,
  });
}

function parsePropNumber(fieldKey: AiUpdatableFieldKey, property: CustomProperty, raw: unknown): AiUpdateProposal {
  const value = asNumber(raw);
  if (value === null) return invalid(fieldKey, "Not a number");
  if (
    (property.numberMin !== null && value < property.numberMin)
    || (property.numberMax !== null && value > property.numberMax)
  ) return invalid(fieldKey, "Out of range");
  return accepted(fieldKey, {
    kind: "propNumber",
    value,
  });
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const YEAR_MONTH_RE = /^\d{4}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;
const DATE_TIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

/** Whether `value` matches the property's canonical datetime encoding. */
function dateTimeValueValid(property: CustomProperty, value: string): boolean {
  switch (property.dateTimeFormat) {
    case "time": return TIME_RE.test(value);
    case "datetime": return DATE_TIME_RE.test(value);
    default:
      return DATE_RE.test(value) || (property.dateTimeAllowYearMonth && YEAR_MONTH_RE.test(value));
  }
}

function parseDateTime(fieldKey: AiUpdatableFieldKey, property: CustomProperty, raw: unknown): AiUpdateProposal {
  const value = asText(raw);
  if (value === null || !dateTimeValueValid(property, value)) {
    return invalid(fieldKey, "Unrecognized date format");
  }
  return accepted(fieldKey, {
    kind: "propDateTime",
    value,
  });
}

function parseChoices(fieldKey: AiUpdatableFieldKey, property: CustomProperty, raw: unknown): AiUpdateProposal {
  const list = asNameList(raw);
  if (list === null) return invalid(fieldKey, "Not a list of names");
  // Resolve case-insensitively against the option values first, then the display labels.
  const byValue = new Map(property.choicesItems.map(item => [item.value.toLowerCase(), item.value]));
  const byLabel = new Map(property.choicesItems.map(item => [item.label.toLowerCase(), item.value]));
  const values: string[] = [];
  const dropped: string[] = [];
  for (const entry of list) {
    const resolved = byValue.get(entry.toLowerCase()) ?? byLabel.get(entry.toLowerCase());
    if (resolved !== undefined && !values.includes(resolved)) values.push(resolved);
    else if (resolved === undefined) dropped.push(entry);
  }
  if (values.length === 0) return invalid(fieldKey, "No matching choice options");
  const kept = property.choicesMultiple ? values : values.slice(0, 1);
  return accepted(fieldKey, {
    kind: "propChoices",
    values: kept,
    dropped: [...dropped, ...values.slice(kept.length)],
  });
}

function parseProgress(fieldKey: AiUpdatableFieldKey, raw: unknown): AiUpdateProposal {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return invalid(fieldKey, "Not a { current, total } object");
  }
  const obj = raw as Record<string, unknown>;
  const current = asNumber(obj.current);
  const total = asNumber(obj.total);
  if (
    current === null || total === null
    || !Number.isInteger(current) || !Number.isInteger(total)
    || current < 0 || total < 0
  ) return invalid(fieldKey, "Not a { current, total } object");
  return accepted(fieldKey, {
    kind: "propProgress",
    current,
    total,
  });
}

/** Normalize one raw section object; children beyond depth 2 are dropped via `allowChildren`. */
function normalizeSectionProposal(raw: unknown, allowChildren: boolean): AiSectionProposal | null {
  if (typeof raw !== "object" || raw === null) return null;
  const obj = raw as Record<string, unknown>;
  const name = asText(obj.name);
  if (!name) return null;
  const startValue = obj.startValue != null ? String(obj.startValue).trim() : "";
  const endValue = obj.endValue != null ? String(obj.endValue).trim() : "";
  const section: AiSectionProposal = {
    name,
    ...(startValue && {
      startValue,
    }),
    ...(endValue && {
      endValue,
    }),
  };
  if (allowChildren && Array.isArray(obj.children) && obj.children.length > 0) {
    const children: AiSectionProposal[] = [];
    for (const child of obj.children) {
      const normalized = normalizeSectionProposal(child, false);
      if (!normalized) return null;
      children.push(normalized);
    }
    section.children = children;
  }
  return section;
}

function parseSections(fieldKey: AiUpdatableFieldKey, property: CustomProperty, raw: unknown): AiUpdateProposal {
  if (!Array.isArray(raw) || raw.length === 0) return invalid(fieldKey, "Not a list of sections");
  const allowChildren = property.sectionsTiered === true;
  const sections: AiSectionProposal[] = [];
  for (const entry of raw) {
    const section = normalizeSectionProposal(entry, allowChildren);
    if (!section) return invalid(fieldKey, "Not a list of sections");
    sections.push(section);
  }
  return accepted(fieldKey, {
    kind: "propSections",
    sections,
  });
}

/** Parse one custom property's raw JSON value per its type. */
function parsePropertyValue(property: CustomProperty, raw: unknown): AiUpdateProposal {
  const fieldKey = aiFieldKeyForProperty(property.id);
  switch (property.type) {
    case "number": return parsePropNumber(fieldKey, property, raw);
    case "ratingScale": return parseRating(fieldKey, property, raw);
    case "boolean":
      return typeof raw === "boolean"
        ? accepted(fieldKey, {
          kind: "propBoolean",
          value: raw,
        })
        : invalid(fieldKey, "Not true or false");
    case "datetime": return parseDateTime(fieldKey, property, raw);
    case "choices": return parseChoices(fieldKey, property, raw);
    case "itemInItems": return parseProgress(fieldKey, raw);
    case "sections": return parseSections(fieldKey, property, raw);
    case "text": {
      const text = asText(raw);
      return text === null
        ? invalid(fieldKey, "Not text")
        : accepted(fieldKey, {
          kind: "propText",
          text,
        });
    }
    default: return invalid(fieldKey, "Not supported");
  }
}

/** Parse one standard field's raw JSON value. */
function parseStandardValue(key: AiStandardFieldKey, raw: unknown): AiUpdateProposal {
  switch (key) {
    case "title":
    case "description":
    case "isbn":
      return parseStandardText(key, raw);
    case "year":
    case "priority":
      return parseStandardInt(key, raw);
    case "names":
      return parseNames(key, raw);
    case "category":
    case "mediaType":
      return parseRelation(key, raw, true);
    default:
      return parseRelation(key, raw, false);
  }
}

/**
 * Parse the pasted AI reply against the checked fields. `empty`/`error`/`invalid` mirror the other
 * AI features (nothing pasted / unparseable JSON / not a JSON object); an individually malformed
 * field value becomes a rejected proposal (reviewed with its reason) rather than failing the whole
 * parse. Keys the user didn't check — or that don't exist — are collected into `ignoredKeys`.
 */
export function parseBookmarkAiUpdateText(
  text: string,
  checked: AiUpdatableFieldKey[],
  properties: CustomProperty[],
): BookmarkAiUpdateParseState {
  const trimmed = text.trim();
  if (!trimmed) return {
    kind: "empty",
  };
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripCodeFence(trimmed));
  }
  catch {
    return {
      kind: "error",
    };
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {
    kind: "invalid",
  };
  const root = parsed as Record<string, unknown>;
  const checkedSet = new Set(checked);
  const standardKeys = new Set<string>(AI_STANDARD_FIELD_KEYS);
  const proposals: AiUpdateProposal[] = [];
  const ignoredKeys: string[] = [];

  for (const [key, raw] of Object.entries(root)) {
    if (key === "properties") continue;
    if (standardKeys.has(key) && checkedSet.has(key as AiStandardFieldKey)) {
      proposals.push(parseStandardValue(key as AiStandardFieldKey, raw));
    }
    else {
      ignoredKeys.push(key);
    }
  }

  const rawProperties = root.properties;
  if (typeof rawProperties === "object" && rawProperties !== null && !Array.isArray(rawProperties)) {
    const bySlug = new Map(properties.map(property => [property.slug, property]));
    for (const [slug, raw] of Object.entries(rawProperties as Record<string, unknown>)) {
      const property = bySlug.get(slug);
      if (property && checkedSet.has(aiFieldKeyForProperty(property.id))) {
        proposals.push(parsePropertyValue(property, raw));
      }
      else {
        ignoredKeys.push(`properties.${slug}`);
      }
    }
  }
  else if (rawProperties !== undefined) {
    ignoredKeys.push("properties");
  }

  return {
    kind: "ok",
    proposals,
    ignoredKeys,
  };
}
