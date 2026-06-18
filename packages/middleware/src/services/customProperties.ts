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
  propertyCategories,
} from "@/db/schema";
import { slugify, uniqueSlug } from "@/utils/slug";

/** Thrown when a custom-property payload is structurally invalid (e.g. a bad calculate config). */
export class CustomPropertyValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CustomPropertyValidationError";
  }
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Map a DB row plus its hydrated relations to the shared `CustomProperty` wire type. */
function toCustomProperty(
  row: CustomPropertyRow,
  categoryIds: string[],
  operandPropertyIds: string[],
): CustomProperty {
  return {
    id: row.id,
    name: row.name,
    // Backfill runs at boot, but fall back to a derived slug so the wire type is never null.
    slug: row.slug ?? slugify(row.name),
    type: row.type as CustomProperty["type"],
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
    editableOnCard: row.editableOnCard,
    showInForm: row.showInForm,
    hiddenFromForm: row.hiddenFromForm,
    showInListings: row.showInListings,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  };
}

/** Slugs reserved for real sub-routes, so a property can never shadow them (e.g. `/…/new`). */
const RESERVED_SLUGS = ["new"];

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
  const [categoryMap, operandMap] = await Promise.all([
    categoryIdsByPropertyId(ids),
    operandIdsByPropertyId(ids),
  ]);
  return rows.map(row =>
    toCustomProperty(row, categoryMap.get(row.id) ?? [], operandMap.get(row.id) ?? []));
}

export async function getCustomProperty(id: string): Promise<CustomProperty | null> {
  const [row] = await db.select().from(customProperties).where(eq(customProperties.id, id));
  if (!row) return null;
  const [categoryMap, operandMap] = await Promise.all([
    categoryIdsByPropertyId([row.id]),
    operandIdsByPropertyId([row.id]),
  ]);
  return toCustomProperty(row, categoryMap.get(row.id) ?? [], operandMap.get(row.id) ?? []);
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

export async function createCustomProperty(
  input: CreateCustomPropertyInput,
): Promise<CustomProperty> {
  const slug = uniqueSlug(input.name, await takenSlugs());
  const id = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(customProperties)
      .values({
        name: input.name,
        slug,
        type: input.type,
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
        allCategories: input.allCategories ?? false,
        editableOnCard: input.editableOnCard ?? false,
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
    return row.id;
  });
  // Re-read so callers always get the hydrated shape (categoryIds + operandPropertyIds).
  return (await getCustomProperty(id))!;
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
      })
      .from(customProperties)
      .where(eq(customProperties.id, id));
    if (!existing) return false;

    const patch: Partial<
      Pick<
        CustomPropertyRow,
        | "name"
        | "slug"
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
        | "allCategories"
        | "editableOnCard"
      >
    > = {};
    if (input.name !== undefined) patch.name = input.name;
    if (renamedSlug !== undefined) patch.slug = renamedSlug;
    if (input.description !== undefined) patch.description = input.description ?? null;
    if (input.numberMin !== undefined) patch.numberMin = input.numberMin;
    if (input.numberMax !== undefined) patch.numberMax = input.numberMax;
    if (input.unitSingular !== undefined) patch.unitSingular = input.unitSingular ?? null;
    if (input.unitPlural !== undefined) patch.unitPlural = input.unitPlural ?? null;
    if (input.valuePrefix !== undefined) patch.valuePrefix = input.valuePrefix ?? null;
    if (input.zeroLabel !== undefined) patch.zeroLabel = input.zeroLabel ?? null;
    if (input.maxLabel !== undefined) patch.maxLabel = input.maxLabel ?? null;
    if (input.showInForm !== undefined) patch.showInForm = input.showInForm;
    if (input.hiddenFromForm !== undefined) patch.hiddenFromForm = input.hiddenFromForm;
    if (input.showInListings !== undefined) patch.showInListings = input.showInListings;
    if (input.allCategories !== undefined) patch.allCategories = input.allCategories;
    if (input.editableOnCard !== undefined) patch.editableOnCard = input.editableOnCard;

    if (Object.keys(patch).length > 0) {
      await tx.update(customProperties).set(patch).where(eq(customProperties.id, id));
    }

    if (input.operandPropertyIds !== undefined && existing.type === "calculate") {
      await setCalculateOperands(tx, id, input.operandPropertyIds);
    }
    if (input.categoryIds !== undefined) {
      await setPropertyCategories(tx, id, input.categoryIds);
    }
    return true;
  });

  return found ? getCustomProperty(id) : null;
}

export async function deleteCustomProperty(id: string): Promise<boolean> {
  // FK cascade removes the property's values, operands, and category links.
  const rows = await db.delete(customProperties).where(eq(customProperties.id, id)).returning({
    id: customProperties.id,
  });
  return rows.length > 0;
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
