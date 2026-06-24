import { and, eq, inArray } from "drizzle-orm";
import type {
  BookmarkBooleanValue,
  BookmarkChoicesValue,
  BookmarkDateTimeValue,
  BookmarkNumberValue,
  BookmarkProgressValue,
  BookmarkSectionsValue,
} from "@eesimple/types";
import { db } from "@/db";
import {
  bookmarkAuthors,
  bookmarkBooleanValues,
  bookmarkChoicesValues,
  bookmarkDateTimeValues,
  bookmarkNumberValues,
  bookmarkProgressValues,
  bookmarkSectionsValues,
  bookmarkTags,
  calculatePropertyOperands,
  customProperties,
} from "@/db/schema";

/** A Drizzle transaction handle, as passed to the `db.transaction` callback. */
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Insert join rows linking a bookmark to the given tag ids (no-op when empty). */
export async function linkTags(tx: Tx, bookmarkId: string, tagIds: string[] | undefined): Promise<void> {
  if (!tagIds || tagIds.length === 0) return;
  await tx.insert(bookmarkTags).values(tagIds.map(tagId => ({
    bookmarkId,
    tagId,
  })));
}

/** Insert join rows linking a bookmark to the given author ids (no-op when empty). */
export async function linkAuthors(tx: Tx, bookmarkId: string, authorIds: string[] | undefined): Promise<void> {
  if (!authorIds || authorIds.length === 0) return;
  await tx.insert(bookmarkAuthors).values(authorIds.map(authorId => ({
    bookmarkId,
    authorId,
  })));
}

/** Insert number custom-property values for a bookmark (no-op when empty). */
export async function setNumberValues(
  tx: Tx,
  bookmarkId: string,
  numberValues: BookmarkNumberValue[] | undefined,
): Promise<void> {
  if (!numberValues || numberValues.length === 0) return;
  await tx.insert(bookmarkNumberValues).values(numberValues.map(entry => ({
    bookmarkId,
    propertyId: entry.propertyId,
    value: entry.value,
  })));
}

/** Insert boolean custom-property values for a bookmark (no-op when empty). */
export async function setBooleanValues(
  tx: Tx,
  bookmarkId: string,
  booleanValues: BookmarkBooleanValue[] | undefined,
): Promise<void> {
  if (!booleanValues || booleanValues.length === 0) return;
  await tx.insert(bookmarkBooleanValues).values(booleanValues.map(entry => ({
    bookmarkId,
    propertyId: entry.propertyId,
    value: entry.value,
  })));
}

/** Insert date/time custom-property values for a bookmark (no-op when empty). */
export async function setDateTimeValues(
  tx: Tx,
  bookmarkId: string,
  dateTimeValues: BookmarkDateTimeValue[] | undefined,
): Promise<void> {
  if (!dateTimeValues || dateTimeValues.length === 0) return;
  await tx.insert(bookmarkDateTimeValues).values(dateTimeValues.map(entry => ({
    bookmarkId,
    propertyId: entry.propertyId,
    value: entry.value,
  })));
}

/** Insert choices custom-property values for a bookmark (no-op when empty). */
export async function setChoicesValues(
  tx: Tx,
  bookmarkId: string,
  choicesValues: BookmarkChoicesValue[] | undefined,
): Promise<void> {
  if (!choicesValues || choicesValues.length === 0) return;
  await tx.insert(bookmarkChoicesValues).values(choicesValues.map(entry => ({
    bookmarkId,
    propertyId: entry.propertyId,
    values: entry.values,
  })));
}

/** Insert item-in-items custom-property values for a bookmark (no-op when empty). */
export async function setProgressValues(
  tx: Tx,
  bookmarkId: string,
  progressValues: BookmarkProgressValue[] | undefined,
): Promise<void> {
  if (!progressValues || progressValues.length === 0) return;
  await tx.insert(bookmarkProgressValues).values(progressValues.map(entry => ({
    bookmarkId,
    propertyId: entry.propertyId,
    current: entry.current,
    total: entry.total,
  })));
}

/** Insert sections custom-property values for a bookmark (no-op when empty). */
export async function setSectionsValues(
  tx: Tx,
  bookmarkId: string,
  sectionsValues: BookmarkSectionsValue[] | undefined,
): Promise<void> {
  if (!sectionsValues || sectionsValues.length === 0) return;
  await tx.insert(bookmarkSectionsValues).values(sectionsValues.map(entry => ({
    bookmarkId,
    propertyId: entry.propertyId,
    exhaustive: entry.exhaustive,
    sections: entry.sections,
  })));
}

/**
 * Sum the stored values of the given operand properties for a bookmark, treating a missing
 * value as 0. Pure — kept separate from DB access so it can be unit-tested.
 */
export function sumOperands(valueById: Map<string, number>, operandIds: string[]): number {
  return operandIds.reduce((total, id) => total + (valueById.get(id) ?? 0), 0);
}

/**
 * Recompute and persist every calculate property's value for a bookmark, storing the result
 * in `bookmark_number_values` so it filters and sorts like a real number. Must run after the
 * bookmark's number values are written, since calculate results derive from them.
 */
export async function recomputeCalculatedValues(tx: Tx, bookmarkId: string): Promise<void> {
  const calcProps = await tx
    .select({
      id: customProperties.id,
    })
    .from(customProperties)
    .where(eq(customProperties.type, "calculate"));
  if (calcProps.length === 0) return;
  const calcIds = calcProps.map(prop => prop.id);

  // Clear stale calculate results so they don't pollute the operand sums below.
  await tx
    .delete(bookmarkNumberValues)
    .where(and(eq(bookmarkNumberValues.bookmarkId, bookmarkId), inArray(bookmarkNumberValues.propertyId, calcIds)));

  const operandRows = await tx
    .select({
      propertyId: calculatePropertyOperands.propertyId,
      operandPropertyId: calculatePropertyOperands.operandPropertyId,
    })
    .from(calculatePropertyOperands)
    .where(inArray(calculatePropertyOperands.propertyId, calcIds));
  const operandsByCalc = new Map<string, string[]>();
  for (const row of operandRows) {
    const list = operandsByCalc.get(row.propertyId) ?? [];
    list.push(row.operandPropertyId);
    operandsByCalc.set(row.propertyId, list);
  }

  const valueRows = await tx
    .select({
      propertyId: bookmarkNumberValues.propertyId,
      value: bookmarkNumberValues.value,
    })
    .from(bookmarkNumberValues)
    .where(eq(bookmarkNumberValues.bookmarkId, bookmarkId));
  const valueById = new Map(valueRows.map(row => [row.propertyId, row.value]));

  const inserts = calcProps.map(prop => ({
    bookmarkId,
    propertyId: prop.id,
    value: sumOperands(valueById, operandsByCalc.get(prop.id) ?? []),
  }));
  if (inserts.length > 0) await tx.insert(bookmarkNumberValues).values(inserts);
}
