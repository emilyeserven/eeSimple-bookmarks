import { eq } from "drizzle-orm";
import { db } from "@/db/index";
import {
  bookmarkBooleanValues,
  bookmarkNumberValues,
  bookmarks,
  bookmarkTags,
  calculatePropertyOperands,
  categories,
  categoryRootTags,
  customProperties,
  homepageTags,
  propertyCategories,
  tags,
} from "@/db/schema";

/**
 * Seed a sample bookmark and a small tag tree when the table is empty. Skipped in
 * production so real deployments start clean. Useful for local `pnpm dev`.
 *
 * The bookmark is linked to the leaf tag `cli` on purpose: filtering on the root
 * tag `dev` must surface it, demonstrating subtree filtering end-to-end. Assumes the
 * built-in "Default" category already exists (ensured at boot before this runs).
 */
export async function maybeSeed(): Promise<void> {
  if (process.env.NODE_ENV === "production") return;

  const [existing] = await db.select({
    id: bookmarks.id,
  }).from(bookmarks).limit(1);
  if (existing) return;

  const [defaultCategory] = await db.select({
    id: categories.id,
  }).from(categories).where(eq(categories.builtIn, true));

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
    categoryId: defaultCategory?.id ?? null,
    priority: 10,
  }).returning();

  await db.insert(bookmarkTags).values([
    {
      bookmarkId: bookmark.id,
      tagId: cli.id,
    },
  ]);

  // A spread of custom properties so the Settings page and dynamic filters have
  // something to show on a fresh `pnpm dev`: two numbers, their calculate sum, and a boolean.
  const [priority] = await db.insert(customProperties).values({
    name: "Priority",
    type: "number",
    numberMin: 0,
    numberMax: 10,
  }).returning();

  const [effort] = await db.insert(customProperties).values({
    name: "Effort",
    type: "number",
    numberMin: 0,
    numberMax: 10,
    unitSingular: "point",
    unitPlural: "points",
  }).returning();

  const [score] = await db.insert(customProperties).values({
    name: "Score",
    type: "calculate",
  }).returning();
  await db.insert(calculatePropertyOperands).values([
    {
      propertyId: score.id,
      operandPropertyId: priority.id,
    },
    {
      propertyId: score.id,
      operandPropertyId: effort.id,
    },
  ]);

  const [reviewed] = await db.insert(customProperties).values({
    name: "Reviewed",
    type: "boolean",
  }).returning();

  await db.insert(bookmarkNumberValues).values([
    {
      bookmarkId: bookmark.id,
      propertyId: priority.id,
      value: 8,
    },
    {
      bookmarkId: bookmark.id,
      propertyId: effort.id,
      value: 3,
    },
    // The calculate result (8 + 3) is precomputed here to mirror what a save would store.
    {
      bookmarkId: bookmark.id,
      propertyId: score.id,
      value: 11,
    },
  ]);
  await db.insert(bookmarkBooleanValues).values([
    {
      bookmarkId: bookmark.id,
      propertyId: reviewed.id,
      value: true,
    },
  ]);

  // A couple of categories (with Lucide icons) so the sidebar group and the
  // property/category assignment UI have something to show on a fresh `pnpm dev`.
  const [workflow] = await db.insert(categories).values({
    name: "Workflow",
    description: "Properties that drive triage and ordering.",
    icon: "Workflow",
    isHomepage: true,
  }).returning();
  await db.insert(categories).values({
    name: "Content",
    description: "Properties that describe what a bookmark is about.",
    icon: "BookOpen",
  }).returning();

  await db.insert(propertyCategories).values([
    {
      propertyId: priority.id,
      categoryId: workflow.id,
    },
    {
      propertyId: effort.id,
      categoryId: workflow.id,
    },
    {
      propertyId: score.id,
      categoryId: workflow.id,
    },
    {
      propertyId: reviewed.id,
      categoryId: workflow.id,
    },
  ]);

  // The Workflow category only offers the `dev` root tag; the homepage also surfaces `dev` bookmarks.
  await db.insert(categoryRootTags).values([
    {
      categoryId: workflow.id,
      tagId: dev.id,
    },
  ]);
  await db.insert(homepageTags).values([
    {
      tagId: dev.id,
    },
  ]);
}
