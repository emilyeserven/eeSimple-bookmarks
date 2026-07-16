import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  calculatePropertyOperands,
  customProperties,
  propertyCategories,
  propertyMediaTypes,
} from "@/db/schema";
import { AppError } from "@/utils/errors";

/** Thrown when a custom-property payload is structurally invalid (e.g. a bad calculate config). */
export class CustomPropertyValidationError extends AppError {
  constructor(message: string) {
    super(message, "validation", 400);
  }
}

/** Reserved slug + spec of the built-in "Runtime" property, seeded at boot. */
export const RUNTIME_SLUG = "runtime";

/** Reserved slug + spec of the built-in "Date Posted" property, seeded at boot. */
export const DATE_POSTED_SLUG = "date-posted";

/** Reserved slug + spec of the built-in "Content Status" choices property, seeded at boot. */
export const CONTENT_STATUS_SLUG = "content-status";

/**
 * Reserved slug + spec of the built-in "Fill-in Status" choices property, seeded at boot — tracks how
 * far along the user is in filling the bookmark record in (Not Started / In Progress / Finished).
 */
export const FILL_IN_STATUS_SLUG = "fill-in-status";

/** Reserved slug + spec of the built-in "Progress" itemInItems property, seeded at boot. */
export const PROGRESS_SLUG = "progress";

/**
 * Reserved slug + spec of the built-in "Sections" property, seeded at boot — the merger of the
 * former Chapters / Page Sections / URL Sections built-ins (folded together in migrate.ts).
 */
export const SECTIONS_SLUG = "sections";

/** Reserved slug + spec of the built-in "Page Range" itemInItems property, seeded at boot. */
export const PAGE_RANGE_SLUG = "page-range";

/** Reserved slug for the built-in "ISBN / ASIN" text property, seeded at boot. */
export const ISBN_SLUG = "isbn";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Load category ids for a set of property ids in a single query, grouped by property id. */
export async function categoryIdsByPropertyId(propertyIds: string[]): Promise<Map<string, string[]>> {
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
export async function mediaTypeIdsByPropertyId(propertyIds: string[]): Promise<Map<string, string[]>> {
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
export async function operandIdsByPropertyId(propertyIds: string[]): Promise<Map<string, string[]>> {
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

/** Replace a property's category links with the given set (no-op delete then insert). */
export async function setPropertyCategories(
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
export async function setPropertyMediaTypes(
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
export async function setCalculateOperands(
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
