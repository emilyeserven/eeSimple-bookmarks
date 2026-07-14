import { eq } from "drizzle-orm";
import type {
  BookmarkAddFormAdvancedRule,
  BookmarkAddFormPlacement,
  BookmarkAddFormSettings,
  UpdateBookmarkAddFormInput,
} from "@eesimple/types";
import { BOOKMARK_ADD_FORM_PLACEMENTS, DEFAULT_BOOKMARK_ADD_FORM_SETTINGS, emptyConditionTree } from "@eesimple/types";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { DEFAULT_SHORTENER_IGNORE_LIST, ROW_ID } from "./appSettingsShared";

/**
 * Sanitize a stored built-in-property-placement map: keep only string keys whose value is one of
 * {@link BOOKMARK_ADD_FORM_PLACEMENTS}, dropping anything else. Tolerates arbitrary/malformed jsonb
 * so a bad stored row never crashes the Add Bookmark form.
 */
export function asBookmarkAddFormPlacements(value: unknown): Record<string, BookmarkAddFormPlacement> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, BookmarkAddFormPlacement> = {};
  for (const [key, rawValue] of Object.entries(value as Record<string, unknown>)) {
    if (typeof key !== "string" || key === "") continue;
    const placement = BOOKMARK_ADD_FORM_PLACEMENTS.find(candidate => candidate === rawValue);
    if (!placement) continue;
    out[key] = placement;
  }
  return out;
}

/**
 * Sanitize the stored advanced-rules array: keep only well-formed entries, coercing each field and
 * dropping anything malformed, so a bad stored row never crashes the Add Bookmark form. An entry
 * needs a non-empty string `id`; `conditions` is kept only when it's a `{ type: "group" }` object
 * (else an empty tree), the two placement maps run through {@link asBookmarkAddFormPlacements}, and
 * `name`/`sortOrder` are coerced with sensible fallbacks.
 */
export function asBookmarkAddFormAdvancedRules(value: unknown): BookmarkAddFormAdvancedRule[] {
  if (!Array.isArray(value)) return [];
  const out: BookmarkAddFormAdvancedRule[] = [];
  for (const entry of value) {
    if (entry === null || typeof entry !== "object") continue;
    const raw = entry as Record<string, unknown>;
    if (typeof raw.id !== "string" || raw.id === "") continue;
    const conditions
      = raw.conditions !== null
        && typeof raw.conditions === "object"
        && (raw.conditions as { type?: unknown }).type === "group"
        ? raw.conditions as BookmarkAddFormAdvancedRule["conditions"]
        : emptyConditionTree();
    out.push({
      id: raw.id,
      ...(typeof raw.name === "string" && raw.name !== ""
        ? {
          name: raw.name,
        }
        : {}),
      conditions,
      standardFieldPlacements: asBookmarkAddFormPlacements(raw.standardFieldPlacements),
      propertyPlacements: asBookmarkAddFormPlacements(raw.propertyPlacements),
      sortOrder: typeof raw.sortOrder === "number" && Number.isFinite(raw.sortOrder) ? raw.sortOrder : out.length,
    });
  }
  return out;
}

/**
 * The nine standard fields that existed under the legacy `advancedFields`/`hiddenFields` array
 * model. A one-time back-compat read (below) derives an explicit placement for each of these from a
 * pre-existing saved row: absence from both legacy arrays meant "main area" (`default`) for these
 * fields, so we record that explicitly rather than letting the merge re-inherit their newer default.
 * Newer standard fields are intentionally absent here — they take their {@link
 * DEFAULT_BOOKMARK_ADD_FORM_SETTINGS} default (e.g. hidden) via the merge.
 */
const LEGACY_STANDARD_FIELDS = [
  "title",
  "romanizedTitle",
  "categoryId",
  "mediaTypeId",
  "languageId",
  "groupId",
  "descriptionTags",
  "personIds",
  "image",
] as const;

/**
 * Derive an explicit standard-field placement map from the legacy `advancedFields`/`hiddenFields`
 * arrays, reproducing the old membership semantics (`hidden` > `advanced` > `default`/main) for the
 * nine fields that model knew. Only the legacy fields are emitted; the merge over the defaults fills
 * in any newer field with its own default.
 */
function deriveStandardPlacementsFromLegacyArrays(
  advanced: string[] | null | undefined,
  hidden: string[] | null | undefined,
): Record<string, BookmarkAddFormPlacement> {
  const advancedSet = new Set(advanced ?? []);
  const hiddenSet = new Set(hidden ?? []);
  const derived: Record<string, BookmarkAddFormPlacement> = {};
  for (const field of LEGACY_STANDARD_FIELDS) {
    derived[field] = hiddenSet.has(field) ? "hidden" : advancedSet.has(field) ? "advanced" : "default";
  }
  return derived;
}

/**
 * Pure resolver behind {@link getBookmarkAddFormSettings}. Both placement maps are resolved as
 * `{ ...DEFAULT, ...stored }` so a key the user never touched inherits its default (a newly-added
 * standard field that defaults to hidden stays hidden for a row that predates it). Back-compat: when
 * the new `bookmarkFormStandardPlacements` column is absent but the legacy
 * `advancedFields`/`hiddenFields` arrays are present, the legacy arrays are derived into the map
 * once so an existing customized row keeps its choices for the original nine fields. Exported (rather
 * than only exercised through the DB-backed getter) so this merge logic is directly unit-testable.
 */
export function resolveBookmarkAddFormSettings(row?: {
  bookmarkFormAdvancedFields?: string[] | null;
  bookmarkFormHiddenFields?: string[] | null;
  bookmarkFormBuiltInPlacements?: Record<string, unknown> | null;
  bookmarkFormStandardPlacements?: Record<string, unknown> | null;
  bookmarkFormRevealAutofilledInMain?: boolean | null;
  bookmarkFormAdvancedRules?: unknown;
} | null): BookmarkAddFormSettings {
  if (!row) return DEFAULT_BOOKMARK_ADD_FORM_SETTINGS;
  const builtInPropertyPlacements = {
    ...DEFAULT_BOOKMARK_ADD_FORM_SETTINGS.builtInPropertyPlacements,
    ...asBookmarkAddFormPlacements(row.bookmarkFormBuiltInPlacements ?? {}),
  };
  // Prefer the new map column; fall back to deriving from the legacy arrays for pre-existing rows.
  const storedStandard = row.bookmarkFormStandardPlacements != null
    ? asBookmarkAddFormPlacements(row.bookmarkFormStandardPlacements)
    : (row.bookmarkFormAdvancedFields != null || row.bookmarkFormHiddenFields != null)
      ? deriveStandardPlacementsFromLegacyArrays(row.bookmarkFormAdvancedFields, row.bookmarkFormHiddenFields)
      : {};
  return {
    standardFieldPlacements: {
      ...DEFAULT_BOOKMARK_ADD_FORM_SETTINGS.standardFieldPlacements,
      ...storedStandard,
    },
    builtInPropertyPlacements,
    advancedRules: asBookmarkAddFormAdvancedRules(row.bookmarkFormAdvancedRules ?? []),
    revealAutofilledInMain: row.bookmarkFormRevealAutofilledInMain ?? false,
  };
}

/** Read the Add Bookmark form field-placement settings (Settings → Display → Add Bookmark Form). */
export async function getBookmarkAddFormSettings(): Promise<BookmarkAddFormSettings> {
  const [row] = await db
    .select({
      bookmarkFormAdvancedFields: appSettings.bookmarkFormAdvancedFields,
      bookmarkFormHiddenFields: appSettings.bookmarkFormHiddenFields,
      bookmarkFormBuiltInPlacements: appSettings.bookmarkFormBuiltInPlacements,
      bookmarkFormStandardPlacements: appSettings.bookmarkFormStandardPlacements,
      bookmarkFormRevealAutofilledInMain: appSettings.bookmarkFormRevealAutofilledInMain,
      bookmarkFormAdvancedRules: appSettings.bookmarkFormAdvancedRules,
    })
    .from(appSettings)
    .where(eq(appSettings.id, ROW_ID));
  return resolveBookmarkAddFormSettings(row);
}

/** Replace the Add Bookmark form field-placement settings, upserting the singleton. Returns the stored values. */
export async function updateBookmarkAddFormSettings(
  input: UpdateBookmarkAddFormInput,
): Promise<BookmarkAddFormSettings> {
  const next = {
    bookmarkFormStandardPlacements: asBookmarkAddFormPlacements(input.standardFieldPlacements),
    bookmarkFormBuiltInPlacements: asBookmarkAddFormPlacements(input.builtInPropertyPlacements),
    bookmarkFormRevealAutofilledInMain: input.revealAutofilledInMain ?? false,
    bookmarkFormAdvancedRules: asBookmarkAddFormAdvancedRules(input.advancedRules ?? []),
  };
  await db
    .insert(appSettings)
    .values({
      id: ROW_ID,
      shortenerIgnoreList: DEFAULT_SHORTENER_IGNORE_LIST,
      ...next,
    })
    .onConflictDoUpdate({
      target: appSettings.id,
      set: next,
    });
  return resolveBookmarkAddFormSettings(next);
}
