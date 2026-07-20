import { asc, eq, ne } from "drizzle-orm";
import { clampRatingMax } from "@eesimple/types";
import type {
  BulkDeleteResult,
  ChoicesItem,
  CreateCustomPropertyInput,
  CustomProperty,
  UpdateCustomPropertyInput,
} from "@eesimple/types";
import { db } from "@/db";
import {
  customProperties,
  type CustomPropertyRow,
  type NewCustomPropertyRow,
} from "@/db/schema";
import { invalidateBookmarkCache } from "@/services/bookmarkCache";
import { bulkDeleteEntities } from "@/services/bulkDelete";
import {
  categoryIdsByPropertyId,
  CONTENT_STATUS_SLUG,
  ISBN_SLUG,
  mediaTypeIdsByPropertyId,
  operandIdsByPropertyId,
  PROGRESS_SLUG,
  RUNTIME_SLUG,
  SECTIONS_SLUG,
  setCalculateOperands,
  setPropertyCategories,
  setPropertyMediaTypes,
} from "@/services/customPropertyRelations";
import { AppError } from "@/utils/errors";
import { slugify, uniqueSlug } from "@/utils/slug";

/** Thrown when an update or delete targets a built-in property in a disallowed way. */
export class BuiltInPropertyError extends AppError {
  constructor(message: string) {
    super(message, "builtInImmutable", 403);
  }
}

/** Map a DB row plus its hydrated relations to the shared `CustomProperty` wire type. */
function toCustomProperty(
  row: CustomPropertyRow,
  categoryIds: string[],
  mediaTypeIds: string[],
  operandPropertyIds: string[],
): CustomProperty {
  return {
    id: row.id,
    name: row.name,
    // Backfill runs at boot, but fall back to a derived slug so the wire type is never null.
    slug: row.slug ?? slugify(row.name),
    type: row.type as CustomProperty["type"],
    builtIn: row.builtIn,
    isFavorite: row.isFavorite,
    numberFormat: (row.numberFormat as CustomProperty["numberFormat"]) ?? null,
    dateTimeFormat: (row.dateTimeFormat as CustomProperty["dateTimeFormat"]) ?? null,
    dateTimeAllowYearMonth: row.dateTimeAllowYearMonth ?? false,
    quickFilterRange: row.quickFilterRange ?? null,
    description: row.description,
    numberMin: row.numberMin,
    numberMax: row.numberMax,
    unitSingular: row.unitSingular,
    unitPlural: row.unitPlural,
    valuePrefix: row.valuePrefix,
    zeroLabel: row.zeroLabel,
    maxLabel: row.maxLabel,
    operandPropertyIds,
    categoryIds,
    allCategories: row.allCategories,
    mediaTypeIds,
    allMediaTypes: row.allMediaTypes,
    editableOnCard: row.editableOnCard,
    editableViaCmdk: row.editableViaCmdk,
    enabledInInbox: row.enabledInInbox ?? false,
    showInForm: row.showInForm,
    hiddenFromForm: row.hiddenFromForm,
    showInListings: row.showInListings,
    showInGallery: row.showInGallery,
    showInDetails: row.showInDetails,
    enabled: row.enabled,
    allowDefault: row.allowDefault,
    booleanLabelPreset: (row.booleanLabelPreset as CustomProperty["booleanLabelPreset"]) ?? null,
    booleanTrueLabel: row.booleanTrueLabel ?? null,
    booleanFalseLabel: row.booleanFalseLabel ?? null,
    ratingMax: (row.ratingMax as CustomProperty["ratingMax"]) ?? null,
    ratingAllowZero: row.ratingAllowZero ?? false,
    ratingAllowHalf: row.ratingAllowHalf ?? false,
    ratingShowLabel: row.ratingShowLabel ?? false,
    ratingLabel: row.ratingLabel ?? null,
    ratingAllowRange: row.ratingAllowRange ?? false,
    ratingLabels: (row.ratingLabels as CustomProperty["ratingLabels"]) ?? null,
    ratingCategoryLabels: (row.ratingCategoryLabels as CustomProperty["ratingCategoryLabels"]) ?? null,
    ratingDisplay: (row.ratingDisplay as CustomProperty["ratingDisplay"]) ?? null,
    ratingRangeIncludeStart: row.ratingRangeIncludeStart ?? false,
    choicesItems: (row.choicesItems as ChoicesItem[] | null) ?? [],
    choicesDisplay: (row.choicesDisplay as CustomProperty["choicesDisplay"]) ?? null,
    choicesMultiple: row.choicesMultiple ?? false,
    itemInItemsBeforeText: row.itemInItemsBeforeText ?? null,
    itemInItemsBetweenText: row.itemInItemsBetweenText ?? null,
    itemInItemsAfterText: row.itemInItemsAfterText ?? null,
    itemInItemsMediaTypeTexts: (row.itemInItemsMediaTypeTexts as CustomProperty["itemInItemsMediaTypeTexts"]) ?? null,
    itemInItemsSourcePropertyId: row.itemInItemsSourcePropertyId ?? null,
    sectionsDefaultType: (row.sectionsDefaultType as CustomProperty["sectionsDefaultType"]) ?? null,
    sectionsAllowedTypes: (row.sectionsAllowedTypes as CustomProperty["sectionsAllowedTypes"]) ?? null,
    sectionsTiered: row.sectionsTiered ?? null,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  };
}

/** Slugs reserved for real sub-routes + built-ins, so a property can never shadow them. */
const RESERVED_SLUGS = ["new", RUNTIME_SLUG, CONTENT_STATUS_SLUG, PROGRESS_SLUG, SECTIONS_SLUG, ISBN_SLUG];

/** Existing property slugs plus reserved route words, optionally excluding one id (when renaming). */
async function takenSlugs(excludeId?: string): Promise<string[]> {
  const rows = await db
    .select({
      slug: customProperties.slug,
    })
    .from(customProperties)
    .where(excludeId ? ne(customProperties.id, excludeId) : undefined);
  return [...RESERVED_SLUGS, ...rows.map(row => row.slug).filter((slug): slug is string => slug !== null)];
}

export async function listCustomProperties(): Promise<CustomProperty[]> {
  const rows = await db.select().from(customProperties).orderBy(asc(customProperties.name));
  const ids = rows.map(row => row.id);
  const [categoryMap, mediaTypeMap, operandMap] = await Promise.all([
    categoryIdsByPropertyId(ids),
    mediaTypeIdsByPropertyId(ids),
    operandIdsByPropertyId(ids),
  ]);
  return rows.map(row =>
    toCustomProperty(
      row,
      categoryMap.get(row.id) ?? [],
      mediaTypeMap.get(row.id) ?? [],
      operandMap.get(row.id) ?? [],
    ));
}

export async function getCustomProperty(id: string): Promise<CustomProperty | null> {
  const [row] = await db.select().from(customProperties).where(eq(customProperties.id, id));
  if (!row) return null;
  const [categoryMap, mediaTypeMap, operandMap] = await Promise.all([
    categoryIdsByPropertyId([row.id]),
    mediaTypeIdsByPropertyId([row.id]),
    operandIdsByPropertyId([row.id]),
  ]);
  return toCustomProperty(
    row,
    categoryMap.get(row.id) ?? [],
    mediaTypeMap.get(row.id) ?? [],
    operandMap.get(row.id) ?? [],
  );
}

/** Coerce a requested rating max to a supported whole scale (2–20); defaults to 5. */
function normalizeRatingMax(value: number | null | undefined): number {
  return clampRatingMax(value);
}

/**
 * Assemble the insert row for a new custom property. The bulk of the columns are plain mirrors of
 * the input, so they reuse the same data-driven mapper as the update path (`buildUpdatePatch` over
 * `COPYABLE_FIELDS`): a provided field is copied, an omitted one is left off so the Drizzle column
 * default applies (the old per-field `?? false/true/null` matched those defaults exactly). Only the
 * required identity columns (`name`/`slug`/`type`) and the type-gated columns (`dateTimeFormat`, the
 * `rating*` set) need explicit handling.
 */
export function buildInsertValues(
  input: CreateCustomPropertyInput,
  slug: string,
): NewCustomPropertyRow {
  const isRating = input.type === "ratingScale";
  const base = buildUpdatePatch(input, slug);
  return {
    ...base,
    name: input.name,
    slug,
    type: input.type,
    dateTimeFormat: input.type === "datetime" ? (input.dateTimeFormat ?? "date") : null,
    dateTimeAllowYearMonth: input.type === "datetime" ? (input.dateTimeAllowYearMonth ?? false) : false,
    ratingMax: isRating ? normalizeRatingMax(input.ratingMax) : null,
    ratingAllowZero: isRating ? (input.ratingAllowZero ?? null) : null,
    ratingAllowHalf: isRating ? (input.ratingAllowHalf ?? null) : null,
    ratingShowLabel: isRating ? (input.ratingShowLabel ?? null) : null,
    ratingLabel: isRating ? (input.ratingLabel ?? null) : null,
    ratingAllowRange: isRating ? (input.ratingAllowRange ?? null) : null,
    ratingLabels: isRating ? (input.ratingLabels ?? null) : null,
    ratingCategoryLabels: isRating ? (input.ratingCategoryLabels ?? null) : null,
    ratingDisplay: isRating ? (input.ratingDisplay ?? null) : null,
    ratingRangeIncludeStart: isRating ? (input.ratingRangeIncludeStart ?? null) : null,
  };
}

export async function createCustomProperty(
  input: CreateCustomPropertyInput,
): Promise<CustomProperty> {
  const slug = uniqueSlug(input.name, await takenSlugs(), "property");
  const values = buildInsertValues(input, slug);
  const id = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(customProperties)
      .values(values)
      .returning({
        id: customProperties.id,
      });
    if (input.type === "calculate") {
      await setCalculateOperands(tx, row.id, input.operandPropertyIds ?? []);
    }
    if (input.categoryIds && input.categoryIds.length > 0) {
      await setPropertyCategories(tx, row.id, input.categoryIds);
    }
    if (input.mediaTypeIds && input.mediaTypeIds.length > 0) {
      await setPropertyMediaTypes(tx, row.id, input.mediaTypeIds);
    }
    return row.id;
  });
  // Re-read so callers always get the hydrated shape (categoryIds + operandPropertyIds).
  return (await getCustomProperty(id))!;
}

export type UpdatePatch = Partial<
  Pick<
    CustomPropertyRow,
    | "name"
    | "slug"
    | "numberFormat"
    | "dateTimeFormat"
    | "dateTimeAllowYearMonth"
    | "quickFilterRange"
    | "description"
    | "numberMin"
    | "numberMax"
    | "unitSingular"
    | "unitPlural"
    | "valuePrefix"
    | "zeroLabel"
    | "maxLabel"
    | "showInForm"
    | "hiddenFromForm"
    | "showInListings"
    | "showInGallery"
    | "showInDetails"
    | "allCategories"
    | "allMediaTypes"
    | "editableOnCard"
    | "editableViaCmdk"
    | "enabledInInbox"
    | "enabled"
    | "allowDefault"
    | "booleanLabelPreset"
    | "booleanTrueLabel"
    | "booleanFalseLabel"
    | "ratingMax"
    | "ratingAllowZero"
    | "ratingAllowHalf"
    | "ratingShowLabel"
    | "ratingLabel"
    | "ratingAllowRange"
    | "ratingLabels"
    | "ratingCategoryLabels"
    | "ratingDisplay"
    | "ratingRangeIncludeStart"
    | "choicesItems"
    | "choicesDisplay"
    | "choicesMultiple"
    | "itemInItemsBeforeText"
    | "itemInItemsBetweenText"
    | "itemInItemsAfterText"
    | "itemInItemsMediaTypeTexts"
    | "itemInItemsSourcePropertyId"
    | "sectionsDefaultType"
    | "sectionsAllowedTypes"
    | "sectionsTiered"
    | "isFavorite"
  >
>;

/**
 * Column keys copied straight from the matching input field by `buildUpdatePatch`. Derived as the
 * keys shared by the input and the patch whose defined input value is assignable to the column —
 * so the `satisfies` below turns a miscategorised field (one needing a transform) into a compile
 * error. Every input field is a plain `T | null` mirror of its column, so an explicit `null` clears
 * it and `undefined` leaves it untouched; no per-field coercion is needed.
 */
type CopyableField = {
  [K in keyof UpdatePatch & keyof UpdateCustomPropertyInput]:
  Exclude<UpdateCustomPropertyInput[K], undefined> extends UpdatePatch[K] ? K : never;
}[keyof UpdatePatch & keyof UpdateCustomPropertyInput];

/** The settable columns. Adding a field is one entry here, not another `if` branch. */
const COPYABLE_FIELDS = [
  "name",
  "numberFormat",
  "dateTimeFormat",
  "dateTimeAllowYearMonth",
  "quickFilterRange",
  "description",
  "numberMin",
  "numberMax",
  "unitSingular",
  "unitPlural",
  "valuePrefix",
  "zeroLabel",
  "maxLabel",
  "showInForm",
  "hiddenFromForm",
  "showInListings",
  "showInGallery",
  "showInDetails",
  "allCategories",
  "allMediaTypes",
  "editableOnCard",
  "editableViaCmdk",
  "enabledInInbox",
  "enabled",
  "allowDefault",
  "booleanLabelPreset",
  "booleanTrueLabel",
  "booleanFalseLabel",
  "ratingMax",
  "ratingAllowZero",
  "ratingAllowHalf",
  "ratingShowLabel",
  "ratingLabel",
  "ratingAllowRange",
  "ratingLabels",
  "ratingCategoryLabels",
  "ratingDisplay",
  "ratingRangeIncludeStart",
  "choicesItems",
  "choicesDisplay",
  "choicesMultiple",
  "itemInItemsBeforeText",
  "itemInItemsBetweenText",
  "itemInItemsAfterText",
  "itemInItemsMediaTypeTexts",
  "itemInItemsSourcePropertyId",
  "sectionsDefaultType",
  "sectionsAllowedTypes",
  "sectionsTiered",
  "isFavorite",
] as const satisfies readonly CopyableField[];

/**
 * Copy one settable column when the input set it. Generic over a single `K` so the indexed write
 * stays sound; `K extends CopyableField` proves the defined value matches the column, so the
 * narrowing assertion (never `any`) only bridges TS's inability to track that through the index.
 */
function copyColumn<K extends CopyableField>(
  patch: UpdatePatch,
  input: UpdateCustomPropertyInput,
  key: K,
): void {
  const value = input[key];
  if (value !== undefined) patch[key] = value as UpdatePatch[K];
}

export function buildUpdatePatch(input: UpdateCustomPropertyInput, renamedSlug: string | undefined): UpdatePatch {
  const patch: UpdatePatch = {};
  for (const key of COPYABLE_FIELDS) {
    copyColumn(patch, input, key);
  }
  // The slug is derived from a rename rather than sent in the input, so it rides along separately.
  if (renamedSlug !== undefined) patch.slug = renamedSlug;
  return patch;
}

export async function updateCustomProperty(
  id: string,
  input: UpdateCustomPropertyInput,
): Promise<CustomProperty | null> {
  // Keep the slug in sync when the name changes. Computed before the write transaction so the
  // uniqueness read sees a committed view and never nests a second pooled connection inside it.
  let renamedSlug: string | undefined;
  if (input.name !== undefined) {
    const [current] = await db
      .select({
        name: customProperties.name,
      })
      .from(customProperties)
      .where(eq(customProperties.id, id));
    if (current && input.name !== current.name) {
      renamedSlug = uniqueSlug(input.name, await takenSlugs(id), "property");
    }
  }

  const found = await db.transaction(async (tx) => {
    const [existing] = await tx
      .select({
        id: customProperties.id,
        type: customProperties.type,
        name: customProperties.name,
        builtIn: customProperties.builtIn,
      })
      .from(customProperties)
      .where(eq(customProperties.id, id));
    if (!existing) return false;
    if (existing.builtIn && input.name !== undefined && input.name !== existing.name) {
      throw new BuiltInPropertyError("A built-in property cannot be renamed");
    }
    if (existing.builtIn && input.enabled === false) {
      throw new BuiltInPropertyError("A built-in property cannot be disabled");
    }

    const patch = buildUpdatePatch(input, renamedSlug);
    if (Object.keys(patch).length > 0) {
      await tx.update(customProperties).set(patch).where(eq(customProperties.id, id));
    }

    if (input.operandPropertyIds !== undefined && existing.type === "calculate") {
      await setCalculateOperands(tx, id, input.operandPropertyIds);
    }
    if (input.categoryIds !== undefined) {
      await setPropertyCategories(tx, id, input.categoryIds);
    }
    if (input.mediaTypeIds !== undefined) {
      await setPropertyMediaTypes(tx, id, input.mediaTypeIds);
    }
    return true;
  });

  return found ? getCustomProperty(id) : null;
}

export async function deleteCustomProperty(id: string): Promise<boolean> {
  const [existing] = await db
    .select({
      builtIn: customProperties.builtIn,
    })
    .from(customProperties)
    .where(eq(customProperties.id, id));
  if (!existing) return false;
  if (existing.builtIn) throw new BuiltInPropertyError("A built-in property cannot be deleted");
  // FK cascade removes the property's values, operands, and category links.
  const rows = await db.delete(customProperties).where(eq(customProperties.id, id)).returning({
    id: customProperties.id,
  });
  // The cascade removes this property's stored values, which condition matching reads.
  if (rows.length > 0) invalidateBookmarkCache();
  return rows.length > 0;
}

/** Delete many custom properties, reporting per-item outcomes (built-ins are skipped). */
export function bulkDeleteCustomProperties(ids: string[]): Promise<BulkDeleteResult[]> {
  return bulkDeleteEntities(ids, deleteCustomProperty, err => err instanceof BuiltInPropertyError);
}
