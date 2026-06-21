import { asc, eq, inArray, isNull, ne } from "drizzle-orm";
import type {
  CreateCustomPropertyInput,
  CustomProperty,
  UpdateCustomPropertyInput,
} from "@eesimple/types";
import { db } from "@/db";
import {
  calculatePropertyOperands,
  customProperties,
  type CustomPropertyRow,
  mediaTypes,
  propertyCategories,
  propertyMediaTypes,
} from "@/db/schema";
import { invalidateBookmarkCache } from "@/services/bookmarkCache";
import { slugify, uniqueSlug } from "@/utils/slug";

/** Thrown when a custom-property payload is structurally invalid (e.g. a bad calculate config). */
export class CustomPropertyValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CustomPropertyValidationError";
  }
}

/** Thrown when an update or delete targets a built-in property in a disallowed way. */
export class BuiltInPropertyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BuiltInPropertyError";
  }
}

/** Reserved slug + spec of the built-in "Runtime" property, seeded at boot. */
export const RUNTIME_SLUG = "runtime";

/** Reserved slug + spec of the built-in "Date Posted" property, seeded at boot. */
export const DATE_POSTED_SLUG = "date-posted";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

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
    numberFormat: (row.numberFormat as CustomProperty["numberFormat"]) ?? null,
    dateTimeFormat: (row.dateTimeFormat as CustomProperty["dateTimeFormat"]) ?? null,
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
    showInForm: row.showInForm,
    hiddenFromForm: row.hiddenFromForm,
    showInListings: row.showInListings,
    showInGallery: row.showInGallery,
    showInDetails: row.showInDetails,
    enabled: row.enabled,
    allowDefault: row.allowDefault,
    propertyGroupId: row.propertyGroupId,
    showIfFalse: row.showIfFalse ?? false,
    booleanLabelPreset: (row.booleanLabelPreset as CustomProperty["booleanLabelPreset"]) ?? null,
    booleanTrueLabel: row.booleanTrueLabel ?? null,
    booleanFalseLabel: row.booleanFalseLabel ?? null,
    showLabelColon: row.showLabelColon ?? true,
    showValueBeforeLabel: row.showValueBeforeLabel ?? false,
    hideLabel: row.hideLabel ?? false,
    clickableInView: row.clickableInView ?? false,
    ratingMax: (row.ratingMax as CustomProperty["ratingMax"]) ?? null,
    ratingAllowZero: row.ratingAllowZero ?? false,
    ratingAllowHalf: row.ratingAllowHalf ?? false,
    ratingShowLabel: row.ratingShowLabel ?? false,
    ratingLabel: row.ratingLabel ?? null,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  };
}

/** Slugs reserved for real sub-routes + built-ins, so a property can never shadow them. */
const RESERVED_SLUGS = ["new", RUNTIME_SLUG];

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

/** Load category ids for a set of property ids in a single query, grouped by property id. */
async function categoryIdsByPropertyId(propertyIds: string[]): Promise<Map<string, string[]>> {
  const grouped = new Map<string, string[]>();
  if (propertyIds.length === 0) return grouped;

  const rows = await db
    .select({
      propertyId: propertyCategories.propertyId,
      categoryId: propertyCategories.categoryId,
    })
    .from(propertyCategories)
    .where(inArray(propertyCategories.propertyId, propertyIds));

  for (const row of rows) {
    const list = grouped.get(row.propertyId) ?? [];
    list.push(row.categoryId);
    grouped.set(row.propertyId, list);
  }
  return grouped;
}

/** Load media type ids for a set of property ids in a single query, grouped by property id. */
async function mediaTypeIdsByPropertyId(propertyIds: string[]): Promise<Map<string, string[]>> {
  const grouped = new Map<string, string[]>();
  if (propertyIds.length === 0) return grouped;

  const rows = await db
    .select({
      propertyId: propertyMediaTypes.propertyId,
      mediaTypeId: propertyMediaTypes.mediaTypeId,
    })
    .from(propertyMediaTypes)
    .where(inArray(propertyMediaTypes.propertyId, propertyIds));

  for (const row of rows) {
    const list = grouped.get(row.propertyId) ?? [];
    list.push(row.mediaTypeId);
    grouped.set(row.propertyId, list);
  }
  return grouped;
}

/** Load calculate-operand ids for a set of property ids, grouped by the calculate property id. */
async function operandIdsByPropertyId(propertyIds: string[]): Promise<Map<string, string[]>> {
  const grouped = new Map<string, string[]>();
  if (propertyIds.length === 0) return grouped;

  const rows = await db
    .select({
      propertyId: calculatePropertyOperands.propertyId,
      operandPropertyId: calculatePropertyOperands.operandPropertyId,
    })
    .from(calculatePropertyOperands)
    .where(inArray(calculatePropertyOperands.propertyId, propertyIds));

  for (const row of rows) {
    const list = grouped.get(row.propertyId) ?? [];
    list.push(row.operandPropertyId);
    grouped.set(row.propertyId, list);
  }
  return grouped;
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

/** Replace a property's category links with the given set (no-op delete then insert). */
async function setPropertyCategories(
  tx: Tx,
  propertyId: string,
  categoryIds: string[],
): Promise<void> {
  await tx.delete(propertyCategories).where(eq(propertyCategories.propertyId, propertyId));
  if (categoryIds.length === 0) return;
  await tx.insert(propertyCategories).values(categoryIds.map(categoryId => ({
    propertyId,
    categoryId,
  })));
}

/** Replace a property's media-type links with the given set (no-op delete then insert). */
async function setPropertyMediaTypes(
  tx: Tx,
  propertyId: string,
  mediaTypeIds: string[],
): Promise<void> {
  await tx.delete(propertyMediaTypes).where(eq(propertyMediaTypes.propertyId, propertyId));
  if (mediaTypeIds.length === 0) return;
  await tx.insert(propertyMediaTypes).values(mediaTypeIds.map(mediaTypeId => ({
    propertyId,
    mediaTypeId,
  })));
}

/** Replace a calculate property's operands, validating they are ≥2 existing `number` properties. */
async function setCalculateOperands(
  tx: Tx,
  propertyId: string,
  operandPropertyIds: string[],
): Promise<void> {
  if (operandPropertyIds.length < 2) {
    throw new CustomPropertyValidationError("A calculate property needs at least two operands");
  }
  const unique = [...new Set(operandPropertyIds)];
  if (unique.includes(propertyId)) {
    throw new CustomPropertyValidationError("A calculate property cannot reference itself");
  }
  const operands = await tx
    .select({
      id: customProperties.id,
      type: customProperties.type,
    })
    .from(customProperties)
    .where(inArray(customProperties.id, unique));
  const byId = new Map(operands.map(operand => [operand.id, operand.type]));
  for (const id of unique) {
    if (byId.get(id) !== "number") {
      throw new CustomPropertyValidationError("Calculate operands must be Number properties");
    }
  }

  await tx.delete(calculatePropertyOperands).where(eq(calculatePropertyOperands.propertyId, propertyId));
  await tx.insert(calculatePropertyOperands).values(unique.map(operandPropertyId => ({
    propertyId,
    operandPropertyId,
  })));
}

/** Coerce a requested rating max to a supported scale (3 or 5); defaults to 5. */
function normalizeRatingMax(value: number | null | undefined): 3 | 5 {
  return value === 3 ? 3 : 5;
}

export async function createCustomProperty(
  input: CreateCustomPropertyInput,
): Promise<CustomProperty> {
  const isRating = input.type === "ratingScale";
  const slug = uniqueSlug(input.name, await takenSlugs());
  const id = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(customProperties)
      .values({
        name: input.name,
        slug,
        type: input.type,
        numberFormat: input.numberFormat ?? null,
        dateTimeFormat: input.type === "datetime" ? (input.dateTimeFormat ?? "date") : null,
        quickFilterRange: input.quickFilterRange ?? null,
        description: input.description ?? null,
        numberMin: input.numberMin ?? null,
        numberMax: input.numberMax ?? null,
        unitSingular: input.unitSingular ?? null,
        unitPlural: input.unitPlural ?? null,
        valuePrefix: input.valuePrefix ?? null,
        zeroLabel: input.zeroLabel ?? null,
        maxLabel: input.maxLabel ?? null,
        showInForm: input.showInForm ?? false,
        hiddenFromForm: input.hiddenFromForm ?? false,
        showInListings: input.showInListings ?? true,
        showInGallery: input.showInGallery ?? true,
        showInDetails: input.showInDetails ?? true,
        allCategories: input.allCategories ?? false,
        allMediaTypes: input.allMediaTypes ?? false,
        editableOnCard: input.editableOnCard ?? false,
        enabled: input.enabled ?? true,
        allowDefault: input.allowDefault ?? true,
        propertyGroupId: input.propertyGroupId ?? null,
        showIfFalse: input.showIfFalse ?? null,
        booleanLabelPreset: input.booleanLabelPreset ?? null,
        booleanTrueLabel: input.booleanTrueLabel ?? null,
        booleanFalseLabel: input.booleanFalseLabel ?? null,
        showLabelColon: input.showLabelColon ?? null,
        showValueBeforeLabel: input.showValueBeforeLabel ?? null,
        hideLabel: input.hideLabel ?? null,
        clickableInView: input.clickableInView ?? null,
        ratingMax: isRating ? normalizeRatingMax(input.ratingMax) : null,
        ratingAllowZero: isRating ? (input.ratingAllowZero ?? null) : null,
        ratingAllowHalf: isRating ? (input.ratingAllowHalf ?? null) : null,
        ratingShowLabel: isRating ? (input.ratingShowLabel ?? null) : null,
        ratingLabel: isRating ? (input.ratingLabel ?? null) : null,
      })
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
    | "enabled"
    | "allowDefault"
    | "propertyGroupId"
    | "showIfFalse"
    | "booleanLabelPreset"
    | "booleanTrueLabel"
    | "booleanFalseLabel"
    | "showLabelColon"
    | "showValueBeforeLabel"
    | "hideLabel"
    | "clickableInView"
    | "ratingMax"
    | "ratingAllowZero"
    | "ratingAllowHalf"
    | "ratingShowLabel"
    | "ratingLabel"
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
  "enabled",
  "allowDefault",
  "propertyGroupId",
  "showIfFalse",
  "booleanLabelPreset",
  "booleanTrueLabel",
  "booleanFalseLabel",
  "showLabelColon",
  "showValueBeforeLabel",
  "hideLabel",
  "clickableInView",
  "ratingMax",
  "ratingAllowZero",
  "ratingAllowHalf",
  "ratingShowLabel",
  "ratingLabel",
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
      renamedSlug = uniqueSlug(input.name, await takenSlugs(id));
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

/** Re-read a built-in property's id by its slug after a concurrent-insert race. */
async function readPropertyIdBySlug(slug: string): Promise<string> {
  const [row] = await db
    .select({
      id: customProperties.id,
    })
    .from(customProperties)
    .where(eq(customProperties.slug, slug));
  return row.id;
}

/**
 * Ensure the built-in "Runtime" property exists and is scoped to Video and Audio media types
 * (including their children). Idempotent and safe to call at boot — must run after
 * ensureBuiltInMediaTypes so the Video/Audio rows are present when scoping is applied.
 */
export async function ensureRuntimeProperty(): Promise<string> {
  const [existing] = await db
    .select({
      id: customProperties.id,
    })
    .from(customProperties)
    .where(eq(customProperties.slug, RUNTIME_SLUG));

  let propertyId: string;
  if (existing) {
    await db
      .update(customProperties)
      .set({
        name: "Runtime",
        builtIn: true,
        enabled: true,
        allCategories: false,
        showInListings: true,
        editableOnCard: true,
        numberFormat: "duration",
      })
      .where(eq(customProperties.id, existing.id));
    propertyId = existing.id;
  }
  else {
    const [row] = await db
      .insert(customProperties)
      .values({
        name: "Runtime",
        slug: RUNTIME_SLUG,
        type: "number",
        builtIn: true,
        numberFormat: "duration",
        description: "Runtime of the content, in seconds. Auto-filled from a video URL.",
        numberMin: 0,
        allCategories: false,
        showInListings: true,
        editableOnCard: true,
      })
      .onConflictDoNothing({
        target: customProperties.slug,
      })
      .returning({
        id: customProperties.id,
      });
    propertyId = row ? row.id : await readPropertyIdBySlug(RUNTIME_SLUG);
  }

  // Scope to Video + Audio roots and all their children. Runs after ensureBuiltInMediaTypes so the
  // slugs exist; gracefully no-ops if they haven't been seeded yet on a truly fresh DB.
  const rootRows = await db
    .select({
      id: mediaTypes.id,
    })
    .from(mediaTypes)
    .where(inArray(mediaTypes.slug, ["video", "audio"]));
  if (rootRows.length > 0) {
    const rootIds = rootRows.map(r => r.id);
    const childRows = await db
      .select({
        id: mediaTypes.id,
      })
      .from(mediaTypes)
      .where(inArray(mediaTypes.parentId, rootIds));
    const allMediaTypeIds = [...rootIds, ...childRows.map(r => r.id)];
    await db
      .delete(propertyMediaTypes)
      .where(eq(propertyMediaTypes.propertyId, propertyId));
    await db
      .insert(propertyMediaTypes)
      .values(allMediaTypeIds.map(mediaTypeId => ({
        propertyId,
        mediaTypeId,
      })));
  }

  return propertyId;
}

/**
 * Look up the built-in "Runtime" property id at request time, or `null` when it hasn't been
 * seeded yet. Used by the bookmark service to backfill a video's duration from fetched metadata.
 */
export async function getRuntimePropertyId(): Promise<string | null> {
  const [row] = await db
    .select({
      id: customProperties.id,
    })
    .from(customProperties)
    .where(eq(customProperties.slug, RUNTIME_SLUG));
  return row?.id ?? null;
}

/**
 * Ensure the built-in "Date Posted" property exists. Idempotent and safe to call at boot in every
 * environment: a datetime property (date-only) available in every category. Auto-populated from the
 * YouTube watch page's `<meta itemprop="datePublished">` when a bookmark URL is fetched.
 */
export async function ensureDatePostedProperty(): Promise<string> {
  const [existing] = await db
    .select({
      id: customProperties.id,
    })
    .from(customProperties)
    .where(eq(customProperties.slug, DATE_POSTED_SLUG));
  if (existing) {
    await db
      .update(customProperties)
      .set({
        builtIn: true,
        enabled: true,
        allCategories: true,
        showInListings: true,
        dateTimeFormat: "date",
      })
      .where(eq(customProperties.id, existing.id));
    return existing.id;
  }

  const [row] = await db
    .insert(customProperties)
    .values({
      name: "Date Posted",
      slug: DATE_POSTED_SLUG,
      type: "datetime",
      builtIn: true,
      dateTimeFormat: "date",
      description: "Date the video was published. Auto-filled from a YouTube video URL.",
      allCategories: true,
      showInListings: true,
    })
    .onConflictDoNothing({
      target: customProperties.slug,
    })
    .returning({
      id: customProperties.id,
    });
  if (row) return row.id;

  // Lost a concurrent insert race — re-read the row the other writer created.
  return readPropertyIdBySlug(DATE_POSTED_SLUG);
}

/**
 * Look up the built-in "Date Posted" property id at request time, or `null` when it hasn't been
 * seeded yet. Used by the bookmark service to backfill a video's publish date from fetched metadata.
 */
export async function getDatePostedPropertyId(): Promise<string | null> {
  const [row] = await db
    .select({
      id: customProperties.id,
    })
    .from(customProperties)
    .where(eq(customProperties.slug, DATE_POSTED_SLUG));
  return row?.id ?? null;
}

/** Fill in slugs for any properties missing one (e.g. rows that predate the `slug` column). */
export async function backfillCustomPropertySlugs(): Promise<void> {
  const missing = await db
    .select({
      id: customProperties.id,
      name: customProperties.name,
    })
    .from(customProperties)
    .where(isNull(customProperties.slug));
  if (missing.length === 0) return;

  const taken = await takenSlugs();
  for (const property of missing) {
    const slug = uniqueSlug(property.name, taken);
    taken.push(slug);
    await db.update(customProperties).set({
      slug,
    }).where(eq(customProperties.id, property.id));
  }
}
