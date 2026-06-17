import { db } from "@/db/index";
import { bookmarks } from "@/db/schema";

/**
 * Seed a sample bookmark when the table is empty. Skipped in production so real
 * deployments start clean. Useful for local `pnpm dev`.
 */
export async function maybeSeed(): Promise<void> {
  if (process.env.NODE_ENV === "production") return;

  const [existing] = await db.select({
    id: bookmarks.id,
  }).from(bookmarks).limit(1);
  if (existing) return;

  await db.insert(bookmarks).values({
    url: "https://github.com",
    title: "GitHub",
    description: "Where the code lives.",
    tags: ["dev", "tools"],
    favorite: true,
  });
}
