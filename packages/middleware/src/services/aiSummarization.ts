import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { bookmarkChoicesValues, customProperties } from "@/db/schema";
import { invalidateBookmarkCache } from "@/services/bookmarkCache";
import { CONTENT_STATUS_SLUG } from "@/services/customProperties";

/**
 * Transition all bookmarks with Content Status "AI Summary Queue" to "Summarized by AI".
 * Returns the number of bookmarks updated.
 */
export async function markAiQueueSummarized(): Promise<{ count: number }> {
  const [prop] = await db
    .select({
      id: customProperties.id,
    })
    .from(customProperties)
    .where(eq(customProperties.slug, CONTENT_STATUS_SLUG));
  if (!prop) return {
    count: 0,
  };

  const result = await db
    .update(bookmarkChoicesValues)
    .set({
      values: sql`'["summarized-by-ai"]'::jsonb`,
    })
    .where(
      sql`${bookmarkChoicesValues.propertyId} = ${prop.id}::uuid
        AND ${bookmarkChoicesValues.values} @> '["ai-summary-queue"]'::jsonb`,
    );

  const count = result.rowCount ?? 0;
  if (count > 0) invalidateBookmarkCache();
  return {
    count,
  };
}
