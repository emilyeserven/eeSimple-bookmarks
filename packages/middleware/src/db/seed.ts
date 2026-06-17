import { db } from "@/db/index";
import {
  bookmarkNumberValues,
  bookmarkPropertyTags,
  bookmarks,
  bookmarkTags,
  customProperties,
  customPropertyTags,
  tags,
} from "@/db/schema";

/**
 * Seed a sample bookmark and a small tag tree when the table is empty. Skipped in
 * production so real deployments start clean. Useful for local `pnpm dev`.
 *
 * The bookmark is linked to the leaf tag `cli` on purpose: filtering on the root
 * tag `dev` must surface it, demonstrating subtree filtering end-to-end.
 */
export async function maybeSeed(): Promise<void> {
  if (process.env.NODE_ENV === "production") return;

  const [existing] = await db.select({
    id: bookmarks.id,
  }).from(bookmarks).limit(1);
  if (existing) return;

  const [dev] = await db.insert(tags).values({
    name: "dev",
    parentId: null,
  }).returning();
  const [tools] = await db.insert(tags).values({
    name: "tools",
    parentId: dev.id,
  }).returning();
  const [cli] = await db.insert(tags).values({
    name: "cli",
    parentId: tools.id,
  }).returning();

  const [bookmark] = await db.insert(bookmarks).values({
    url: "https://github.com",
    title: "GitHub",
    description: "Where the code lives.",
    favorite: true,
    pinned: true,
    priority: 10,
  }).returning();

  await db.insert(bookmarkTags).values([
    {
      bookmarkId: bookmark.id,
      tagId: cli.id,
    },
  ]);

  // A couple of custom properties so the Settings page and dynamic filters have
  // something to show on a fresh `pnpm dev`.
  const [priority] = await db.insert(customProperties).values({
    name: "Priority",
    type: "number",
    numberMin: 0,
    numberMax: 10,
  }).returning();

  const [topic] = await db.insert(customProperties).values({
    name: "Topic",
    type: "tiered_tags",
  }).returning();

  const [web] = await db.insert(customPropertyTags).values({
    propertyId: topic.id,
    name: "web",
    parentId: null,
  }).returning();
  const [frontend] = await db.insert(customPropertyTags).values({
    propertyId: topic.id,
    name: "frontend",
    parentId: web.id,
  }).returning();

  await db.insert(bookmarkNumberValues).values([
    {
      bookmarkId: bookmark.id,
      propertyId: priority.id,
      value: 8,
    },
  ]);
  await db.insert(bookmarkPropertyTags).values([
    {
      bookmarkId: bookmark.id,
      propertyTagId: frontend.id,
    },
  ]);
}
