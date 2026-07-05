import { asc, eq, inArray, isNull, ne } from "drizzle-orm";
import type {
  BulkDeleteResult,
  ChoicesItem,
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
  type NewCustomPropertyRow,
  propertyCategories,
  propertyMediaTypes,
} from "@/db/schema";
import { invalidateBookmarkCache } from "@/services/bookmarkCache";
import { bulkDeleteEntities } from "@/services/bulkDelete";
import { AppError } from "@/utils/errors";
import { slugify, uniqueSlug } from "@/utils/slug";

/** Thrown when a custom-property payload is structurally invalid (e.g. a bad calculate config). */
export class CustomPropertyValidationError extends AppError {
  constructor(message: string) {
    super(message, "validation", 400);
  }
}

/** Thrown when an update or delete targets a built-in property in a disallowed way. */
export class BuiltInPropertyError extends AppError {
  constructor(message: string) {
    super(message, "builtInImmutable", 403);
  }
}

/** Reserved slug + spec of the built-in "Runtime" property, seeded at boot. */
export const RUNTIME_SLUG = "runtime";

/** Reserved slug + spec of the built-in "Date Posted" property, seeded at boot. */
export const DATE_POSTED_SLUG = "date-posted";

/** Reserved slug + spec of the built-in "Content Status" choices property, seeded at boot. */
export const CONTENT_STATUS_SLUG = "content-status";

/** Reserved slug + spec of the built-in "Page Progress" itemInItems property, seeded at boot. */
export const PAGE_PROGRESS_SLUG = "page-progress";

/** Reserved slug + spec of the built-in "Page Range" itemInItems property, seeded at boot. */
export const PAGE_RANGE_SLUG = "page-range";

/** Reserved slug for the built-in "ISBN / ASIN" text property, seeded at boot. */
export const ISBN_SLUG = "isbn";

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
    editableViaCmdk: row.editableViaCmdk,
    enabledInInbox: row.enabledInInbox ?? false,
    showInForm: row.showInForm,
    hiddenFromForm: row.hiddenFromForm,
    showInListings: row.showInListings,
    showInGallery: row.showInGallery,
    showInDetails: row.showInDetails,
    enabled: row.enabled,
    allowDefault: row.allowDefault,
    propertyGroupId: row.propertyGroupId,
    booleanLabelPreset: (row.booleanLabelPreset as CustomProperty["booleanLabelPreset"]) ?? null,
    booleanTrueLabel: row.booleanTrueLabel ?? null,
    booleanFalseLabel: row.booleanFalseLabel ?? null,
    ratingMax: (row.ratingMax as CustomProperty["ratingMax"]) ?? null,
    ratingAllowZero: row.ratingAllowZero ?? false,
    ratingAllowHalf: row.ratingAllowHalf ?? false,
    ratingShowLabel: row.ratingShowLabel ?? false,
    ratingLabel: row.ratingLabel ?? null,
    choicesItems: (row.choicesItems as ChoicesItem[] | null) ?? [],
    choicesDisplay: (row.choicesDisplay as CustomProperty["choicesDisplay"]) ?? null,
    choicesMultiple: row.choicesMultiple ?? false,
    itemInItemsBeforeText: row.itemInItemsBeforeText ?? null,
    itemInItemsBetweenText: row.itemInItemsBetweenText ?? null,
    itemInItemsAfterText: row.itemInItemsAfterText ?? null,
    sectionsDefaultType: (row.sectionsDefaultType as CustomProperty["sectionsDefaultType"]) ?? null,
    sectionsAllowedTypes: (row.sectionsAllowedTypes as CustomProperty["sectionsAllowedTypes"]) ?? null,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  };
}

/** Slugs reserved for real sub-routes + built-ins, so a property can never shadow them. */
const RESERVED_SLUGS = ["new", RUNTIME_SLUG, CONTENT_STATUS_SLUG, PAGE_PROGRESS_SLUG, ISBN_SLUG];

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
    ratingMax: isRating ? normalizeRatingMax(input.ratingMax) : null,
    ratingAllowZero: isRating ? (input.ratingAllowZero ?? null) : null,
    ratingAllowHalf: isRating ? (input.ratingAllowHalf ?? null) : null,
    ratingShowLabel: isRating ? (input.ratingShowLabel ?? null) : null,
    ratingLabel: isRating ? (input.ratingLabel ?? null) : null,
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
    | "propertyGroupId"
    | "booleanLabelPreset"
    | "booleanTrueLabel"
    | "booleanFalseLabel"
    | "ratingMax"
    | "ratingAllowZero"
    | "ratingAllowHalf"
    | "ratingShowLabel"
    | "ratingLabel"
    | "choicesItems"
    | "choicesDisplay"
    | "choicesMultiple"
    | "itemInItemsBeforeText"
    | "itemInItemsBetweenText"
    | "itemInItemsAfterText"
    | "sectionsDefaultType"
    | "sectionsAllowedTypes"
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
  "editableViaCmdk",
  "enabledInInbox",
  "enabled",
  "allowDefault",
  "propertyGroupId",
  "booleanLabelPreset",
  "booleanTrueLabel",
  "booleanFalseLabel",
  "ratingMax",
  "ratingAllowZero",
  "ratingAllowHalf",
  "ratingShowLabel",
  "ratingLabel",
  "choicesItems",
  "choicesDisplay",
  "choicesMultiple",
  "itemInItemsBeforeText",
  "itemInItemsBetweenText",
  "itemInItemsAfterText",
  "sectionsDefaultType",
  "sectionsAllowedTypes",
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
 * Scope a property to Video + Audio media types and all their children. Replaces the full
 * `propertyMediaTypes` set for the property. No-ops if neither root exists yet.
 */
async function scopePropertyToVideoAudioTree(propertyId: string): Promise<void> {
  const rootRows = await db
    .select({
      id: mediaTypes.id,
    })
    .from(mediaTypes)
    .where(inArray(mediaTypes.slug, ["video", "audio"]));
  if (rootRows.length === 0) return;
  const rootIds = rootRows.map(r => r.id);
  const childRows = await db
    .select({
      id: mediaTypes.id,
    })
    .from(mediaTypes)
    .where(inArray(mediaTypes.parentId, rootIds));
  const allMediaTypeIds = [...rootIds, ...childRows.map(r => r.id)];
  await db.delete(propertyMediaTypes).where(eq(propertyMediaTypes.propertyId, propertyId));
  await db.insert(propertyMediaTypes).values(allMediaTypeIds.map(mediaTypeId => ({
    propertyId,
    mediaTypeId,
  })));
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

  await scopePropertyToVideoAudioTree(propertyId);
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

const CONTENT_STATUS_DEFAULT_ITEMS: ChoicesItem[] = [
  {
    label: "Not Started",
    value: "not-started",
    isDefault: true,
  },
  {
    label: "Reading",
    value: "reading",
  },
  {
    label: "Shortlist",
    value: "shortlist",
  },
  {
    label: "Paused",
    value: "paused",
  },
  {
    label: "Dropped",
    value: "dropped",
  },
  {
    label: "Finished",
    value: "finished",
  },
  {
    label: "AI Summary Queue",
    value: "ai-summary-queue",
  },
  {
    label: "Summarized by AI",
    value: "summarized-by-ai",
  },
];

/**
 * Ensure the built-in "Content Status" choices property exists. Idempotent and safe to call at boot
 * in every environment: a single-select radio choices property available in every category.
 */
export async function ensureContentStatusProperty(): Promise<string> {
  const [existing] = await db
    .select({
      id: customProperties.id,
    })
    .from(customProperties)
    .where(eq(customProperties.slug, CONTENT_STATUS_SLUG));
  if (existing) {
    await db
      .update(customProperties)
      .set({
        builtIn: true,
        enabled: true,
        allCategories: true,
      })
      .where(eq(customProperties.id, existing.id));
    return existing.id;
  }

  const [row] = await db
    .insert(customProperties)
    .values({
      name: "Content Status",
      slug: CONTENT_STATUS_SLUG,
      type: "choices",
      builtIn: true,
      choicesItems: CONTENT_STATUS_DEFAULT_ITEMS,
      choicesDisplay: "radio",
      choicesMultiple: false,
      allCategories: true,
      showInForm: true,
      showInListings: true,
      allowDefault: true,
    })
    .onConflictDoNothing({
      target: customProperties.slug,
    })
    .returning({
      id: customProperties.id,
    });
  if (row) return row.id;

  // Lost a concurrent insert race — re-read the row the other writer created.
  return readPropertyIdBySlug(CONTENT_STATUS_SLUG);
}

/**
 * Append any missing Content Status choices (e.g. "AI Summary Queue", "Summarized by AI") to an
 * existing installation. Idempotent: each value is only added when absent, preserving user edits.
 */
export async function backfillContentStatusOptions(): Promise<void> {
  const [row] = await db
    .select({
      id: customProperties.id,
      choicesItems: customProperties.choicesItems,
    })
    .from(customProperties)
    .where(eq(customProperties.slug, CONTENT_STATUS_SLUG));
  if (!row) return;

  const existing = (row.choicesItems ?? []) as ChoicesItem[];
  const existingValues = new Set(existing.map(item => item.value));
  const missing = CONTENT_STATUS_DEFAULT_ITEMS.filter(item => !existingValues.has(item.value));
  if (missing.length === 0) return;

  await db
    .update(customProperties)
    .set({
      choicesItems: [...existing, ...missing],
    })
    .where(eq(customProperties.id, row.id));
}

/**
 * Ensure the built-in "Page Progress" itemInItems property exists. Idempotent and safe to call at
 * boot in every environment. Pre-configured as `{current} of {total} pages`.
 */
export async function ensurePageProgressProperty(): Promise<string> {
  const [existing] = await db
    .select({
      id: customProperties.id,
    })
    .from(customProperties)
    .where(eq(customProperties.slug, PAGE_PROGRESS_SLUG));
  if (existing) {
    await db
      .update(customProperties)
      .set({
        builtIn: true,
        enabled: true,
        allCategories: true,
        itemInItemsBetweenText: " of ",
        itemInItemsAfterText: " pages",
      })
      .where(eq(customProperties.id, existing.id));
    return existing.id;
  }

  const [row] = await db
    .insert(customProperties)
    .values({
      name: "Page Progress",
      slug: PAGE_PROGRESS_SLUG,
      type: "itemInItems",
      builtIn: true,
      allCategories: true,
      showInForm: true,
      showInListings: true,
      itemInItemsBeforeText: null,
      itemInItemsBetweenText: " of ",
      itemInItemsAfterText: " pages",
    })
    .onConflictDoNothing({
      target: customProperties.slug,
    })
    .returning({
      id: customProperties.id,
    });
  if (row) return row.id;

  // Lost a concurrent insert race — re-read the row the other writer created.
  return readPropertyIdBySlug(PAGE_PROGRESS_SLUG);
}

/**
 * Ensure the built-in "Page Range" itemInItems property exists and is scoped to the "Book" media
 * type. Idempotent and safe to call at boot — must run after ensureBuiltInMediaTypes so the "book"
 * slug row is present. Renders as "Pages <first>-<last>".
 */
export async function ensurePageRangeProperty(): Promise<string> {
  const [existing] = await db
    .select({
      id: customProperties.id,
    })
    .from(customProperties)
    .where(eq(customProperties.slug, PAGE_RANGE_SLUG));

  let propertyId: string;
  if (existing) {
    await db
      .update(customProperties)
      .set({
        builtIn: true,
        enabled: true,
        allCategories: false,
        itemInItemsBeforeText: "Pages ",
        itemInItemsBetweenText: "-",
        itemInItemsAfterText: null,
      })
      .where(eq(customProperties.id, existing.id));
    propertyId = existing.id;
  }
  else {
    const [row] = await db
      .insert(customProperties)
      .values({
        name: "Page Range",
        slug: PAGE_RANGE_SLUG,
        type: "itemInItems",
        builtIn: true,
        allCategories: false,
        showInForm: true,
        showInListings: true,
        itemInItemsBeforeText: "Pages ",
        itemInItemsBetweenText: "-",
        itemInItemsAfterText: null,
      })
      .onConflictDoNothing({
        target: customProperties.slug,
      })
      .returning({
        id: customProperties.id,
      });
    propertyId = row ? row.id : await readPropertyIdBySlug(PAGE_RANGE_SLUG);
  }

  // Scope to the "Book" media type — mirrors the ensureRuntimeProperty pattern.
  const [bookRow] = await db
    .select({
      id: mediaTypes.id,
    })
    .from(mediaTypes)
    .where(eq(mediaTypes.slug, "book"));
  if (bookRow) {
    await db
      .delete(propertyMediaTypes)
      .where(eq(propertyMediaTypes.propertyId, propertyId));
    await db
      .insert(propertyMediaTypes)
      .values([{
        propertyId,
        mediaTypeId: bookRow.id,
      }]);
  }

  return propertyId;
}

/** Reserved slug for the built-in "Chapters" sections property (timestamps for video/audio). */
export const CHAPTERS_SLUG = "chapters";

/** Reserved slug for the built-in "Page Sections" sections property (books). */
export const PAGE_SECTIONS_SLUG = "page-sections";

/** Reserved slug for the built-in "URL Sections" sections property (websites/apps). */
export const URL_SECTIONS_SLUG = "url-sections";

/**
 * Ensure the built-in "Chapters" sections property exists and is scoped to the Video and Audio
 * media types (and their children). Idempotent — safe to call at boot. Default type: timestamp.
 */
export async function ensureChaptersProperty(): Promise<string> {
  const [existing] = await db
    .select({
      id: customProperties.id,
    })
    .from(customProperties)
    .where(eq(customProperties.slug, CHAPTERS_SLUG));

  let propertyId: string;
  if (existing) {
    await db
      .update(customProperties)
      .set({
        builtIn: true,
        enabled: true,
        allCategories: false,
        sectionsDefaultType: "timestamp",
        sectionsAllowedTypes: null,
      })
      .where(eq(customProperties.id, existing.id));
    propertyId = existing.id;
  }
  else {
    const [row] = await db
      .insert(customProperties)
      .values({
        name: "Chapters",
        slug: CHAPTERS_SLUG,
        type: "sections",
        builtIn: true,
        allCategories: false,
        showInForm: true,
        showInListings: false,
        sectionsDefaultType: "timestamp",
        sectionsAllowedTypes: null,
        description: "Timestamps or chapters in this video or audio content.",
      })
      .onConflictDoNothing({
        target: customProperties.slug,
      })
      .returning({
        id: customProperties.id,
      });
    propertyId = row ? row.id : await readPropertyIdBySlug(CHAPTERS_SLUG);
  }

  await scopePropertyToVideoAudioTree(propertyId);
  return propertyId;
}

/**
 * Ensure the built-in "Page Sections" sections property exists and is scoped to the Book media
 * type. Idempotent — safe to call at boot. Default type: page.
 */
export async function ensurePageSectionsProperty(): Promise<string> {
  const [existing] = await db
    .select({
      id: customProperties.id,
    })
    .from(customProperties)
    .where(eq(customProperties.slug, PAGE_SECTIONS_SLUG));

  let propertyId: string;
  if (existing) {
    await db
      .update(customProperties)
      .set({
        builtIn: true,
        enabled: true,
        allCategories: false,
        sectionsDefaultType: "page",
        sectionsAllowedTypes: null,
      })
      .where(eq(customProperties.id, existing.id));
    propertyId = existing.id;
  }
  else {
    const [row] = await db
      .insert(customProperties)
      .values({
        name: "Page Sections",
        slug: PAGE_SECTIONS_SLUG,
        type: "sections",
        builtIn: true,
        allCategories: false,
        showInForm: true,
        showInListings: false,
        sectionsDefaultType: "page",
        sectionsAllowedTypes: null,
        description: "Page number ranges for chapters or sections in this book.",
      })
      .onConflictDoNothing({
        target: customProperties.slug,
      })
      .returning({
        id: customProperties.id,
      });
    propertyId = row ? row.id : await readPropertyIdBySlug(PAGE_SECTIONS_SLUG);
  }

  const [bookRow] = await db
    .select({
      id: mediaTypes.id,
    })
    .from(mediaTypes)
    .where(eq(mediaTypes.slug, "book"));
  if (bookRow) {
    await db.delete(propertyMediaTypes).where(eq(propertyMediaTypes.propertyId, propertyId));
    await db.insert(propertyMediaTypes).values([{
      propertyId,
      mediaTypeId: bookRow.id,
    }]);
  }

  return propertyId;
}

/**
 * Ensure the built-in "URL Sections" sections property exists and is scoped to the Website/App
 * media type. Idempotent — safe to call at boot. Default type: url.
 */
export async function ensureUrlSectionsProperty(): Promise<string> {
  const [existing] = await db
    .select({
      id: customProperties.id,
    })
    .from(customProperties)
    .where(eq(customProperties.slug, URL_SECTIONS_SLUG));

  let propertyId: string;
  if (existing) {
    await db
      .update(customProperties)
      .set({
        builtIn: true,
        enabled: true,
        allCategories: false,
        sectionsDefaultType: "url",
        sectionsAllowedTypes: null,
      })
      .where(eq(customProperties.id, existing.id));
    propertyId = existing.id;
  }
  else {
    const [row] = await db
      .insert(customProperties)
      .values({
        name: "URL Sections",
        slug: URL_SECTIONS_SLUG,
        type: "sections",
        builtIn: true,
        allCategories: false,
        showInForm: true,
        showInListings: false,
        sectionsDefaultType: "url",
        sectionsAllowedTypes: null,
        description: "URL-based sections or anchor links within this website or app.",
      })
      .onConflictDoNothing({
        target: customProperties.slug,
      })
      .returning({
        id: customProperties.id,
      });
    propertyId = row ? row.id : await readPropertyIdBySlug(URL_SECTIONS_SLUG);
  }

  const [websiteRow] = await db
    .select({
      id: mediaTypes.id,
    })
    .from(mediaTypes)
    .where(eq(mediaTypes.slug, "website-app"));
  if (websiteRow) {
    await db.delete(propertyMediaTypes).where(eq(propertyMediaTypes.propertyId, propertyId));
    await db.insert(propertyMediaTypes).values([{
      propertyId,
      mediaTypeId: websiteRow.id,
    }]);
  }

  return propertyId;
}

/**
 * Look up the built-in "Content Status" property id at request time, or `null` when it hasn't been
 * seeded yet. Used by the bookmark service to apply the default "Not Started" value on create.
 */
export async function getContentStatusPropertyId(): Promise<string | null> {
  const [row] = await db
    .select({
      id: customProperties.id,
    })
    .from(customProperties)
    .where(eq(customProperties.slug, CONTENT_STATUS_SLUG));
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
    const slug = uniqueSlug(property.name, taken, "property");
    taken.push(slug);
    await db.update(customProperties).set({
      slug,
    }).where(eq(customProperties.id, property.id));
  }
}

/**
 * Ensure the built-in "ISBN / ASIN" text property exists. Available in all categories so users
 * can store an ISBN or ASIN on any bookmark and have the client generate lookup links from it.
 * Idempotent — safe to call at boot.
 */
export async function ensureIsbnProperty(): Promise<string> {
  const [existing] = await db
    .select({
      id: customProperties.id,
    })
    .from(customProperties)
    .where(eq(customProperties.slug, ISBN_SLUG));
  if (existing) {
    await db
      .update(customProperties)
      .set({
        builtIn: true,
        enabled: true,
        allCategories: true,
        hiddenFromForm: false,
      })
      .where(eq(customProperties.id, existing.id));
    return existing.id;
  }

  const [row] = await db
    .insert(customProperties)
    .values({
      name: "ISBN / ASIN",
      slug: ISBN_SLUG,
      type: "text",
      builtIn: true,
      description: "ISBN (books) or ASIN (Amazon products). Used to auto-generate lookup links.",
      allCategories: true,
      hiddenFromForm: false,
      showInListings: false,
      showInDetails: true,
    })
    .onConflictDoNothing({
      target: customProperties.slug,
    })
    .returning({
      id: customProperties.id,
    });
  if (row) return row.id;

  // Lost a concurrent insert race — re-read the row the other writer created.
  return readPropertyIdBySlug(ISBN_SLUG);
}
