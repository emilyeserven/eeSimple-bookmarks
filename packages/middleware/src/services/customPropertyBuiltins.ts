import { eq, inArray } from "drizzle-orm";
import type { ChoicesItem } from "@eesimple/types";
import { db } from "@/db";
import { customProperties, mediaTypes, propertyMediaTypes } from "@/db/schema";
import {
  CONTENT_STATUS_SLUG,
  DATE_POSTED_SLUG,
  FILL_IN_STATUS_SLUG,
  ISBN_SLUG,
  PAGE_RANGE_SLUG,
  PROGRESS_SLUG,
  RUNTIME_SLUG,
  SECTIONS_SLUG,
} from "@/services/customPropertyRelations";

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
 * Scope a property to a single media type looked up by slug. Replaces the full
 * `propertyMediaTypes` set for the property. No-ops if the media type doesn't exist yet.
 */
async function scopePropertyToMediaTypeSlug(propertyId: string, mediaTypeSlug: string): Promise<void> {
  const [row] = await db
    .select({
      id: mediaTypes.id,
    })
    .from(mediaTypes)
    .where(eq(mediaTypes.slug, mediaTypeSlug));
  if (!row) return;
  await db.delete(propertyMediaTypes).where(eq(propertyMediaTypes.propertyId, propertyId));
  await db.insert(propertyMediaTypes).values([{
    propertyId,
    mediaTypeId: row.id,
  }]);
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

const FILL_IN_STATUS_DEFAULT_ITEMS: ChoicesItem[] = [
  {
    label: "Not Started",
    value: "not-started",
    isDefault: true,
  },
  {
    label: "In Progress",
    value: "in-progress",
  },
  {
    label: "Finished",
    value: "finished",
  },
];

/**
 * Ensure the built-in "Fill-in Status" choices property exists. Idempotent and safe to call at boot
 * in every environment: a single-select radio choices property available in every category, tracking
 * how far along the user is in filling the bookmark record in. Seeded with `showInForm: false` so it
 * surfaces in the Add Bookmark form's Advanced section rather than the main area (mirrors the ISBN
 * built-in — a built-in that shows on the add form is kept off `BOOKMARK_FORM_DETAIL_SLUGS`).
 */
export async function ensureFillInStatusProperty(): Promise<string> {
  const [existing] = await db
    .select({
      id: customProperties.id,
    })
    .from(customProperties)
    .where(eq(customProperties.slug, FILL_IN_STATUS_SLUG));
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
      name: "Fill-in Status",
      slug: FILL_IN_STATUS_SLUG,
      type: "choices",
      builtIn: true,
      choicesItems: FILL_IN_STATUS_DEFAULT_ITEMS,
      choicesDisplay: "radio",
      choicesMultiple: false,
      allCategories: true,
      showInForm: false,
      hiddenFromForm: false,
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
  return readPropertyIdBySlug(FILL_IN_STATUS_SLUG);
}

/**
 * Ensure the built-in "Progress" itemInItems property exists. Idempotent and safe to call at boot
 * in every environment — must run after {@link ensureSectionsProperty} (the fresh-install seed
 * links Progress to derive from Sections completion) and after ensureBuiltInMediaTypes (the seed's
 * per-media-type text override references the "book" media type).
 *
 * The update branch deliberately re-asserts only the identity flags: the text segments and the
 * per-media-type overrides are user-configurable, so re-asserting them here would clobber the
 * user's edits on every boot (as the old ensurePageProgressProperty did). A fresh install renders
 * `{current} of {total}` with a book-scoped " pages" suffix.
 *
 * The derive-from-Sections link IS backfilled — but only when currently unset (`null`), so an
 * existing deploy whose Progress row predates the fresh-install seed still auto-derives from the
 * built-in Sections property, while a user's deliberate custom/None choice is preserved.
 */
export async function ensureProgressProperty(sectionsPropertyId: string | null): Promise<string> {
  const [existing] = await db
    .select({
      id: customProperties.id,
      itemInItemsSourcePropertyId: customProperties.itemInItemsSourcePropertyId,
    })
    .from(customProperties)
    .where(eq(customProperties.slug, PROGRESS_SLUG));
  if (existing) {
    await db
      .update(customProperties)
      .set({
        builtIn: true,
        enabled: true,
        allCategories: true,
        // Repair an ABSENT derive-from-Sections link only (e.g. the old manual "Page Progress"
        // renamed to "Progress" by migrate.ts kept a null source). A non-null source is a
        // user/fresh-install choice and is left untouched, preserving the "don't clobber edits"
        // contract — so this fills the gap without overwriting a deliberately-set source.
        ...(existing.itemInItemsSourcePropertyId === null && sectionsPropertyId !== null
          ? {
            itemInItemsSourcePropertyId: sectionsPropertyId,
          }
          : {}),
      })
      .where(eq(customProperties.id, existing.id));
    return existing.id;
  }

  const [bookMediaType] = await db
    .select({
      id: mediaTypes.id,
    })
    .from(mediaTypes)
    .where(eq(mediaTypes.slug, "book"));
  const [row] = await db
    .insert(customProperties)
    .values({
      name: "Progress",
      slug: PROGRESS_SLUG,
      type: "itemInItems",
      builtIn: true,
      allCategories: true,
      showInForm: true,
      showInListings: true,
      itemInItemsBeforeText: null,
      itemInItemsBetweenText: " of ",
      itemInItemsAfterText: null,
      itemInItemsMediaTypeTexts: bookMediaType
        ? {
          [bookMediaType.id]: {
            afterText: " pages",
          },
        }
        : null,
      itemInItemsSourcePropertyId: sectionsPropertyId,
    })
    .onConflictDoNothing({
      target: customProperties.slug,
    })
    .returning({
      id: customProperties.id,
    });
  if (row) return row.id;

  // Lost a concurrent insert race — re-read the row the other writer created.
  return readPropertyIdBySlug(PROGRESS_SLUG);
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
  await scopePropertyToMediaTypeSlug(propertyId, "book");

  return propertyId;
}

/**
 * Ensure the built-in "Sections" property exists — the single generic sections list (the merger of
 * the former Chapters / Page Sections / URL Sections built-ins; migrate.ts folds pre-existing
 * deploys into it). Available everywhere (all categories + all media types), tiered (sub-items),
 * with every entry type allowed and no default type preference — the client picks a sensible
 * default entry type from the bookmark's media type instead. Idempotent — safe to call at boot.
 *
 * The update branch re-asserts only the identity flags: the entry-type config and description are
 * user-configurable, so re-asserting them would clobber user edits on every boot (as the old
 * per-property seeds did).
 */
export async function ensureSectionsProperty(): Promise<string> {
  const [existing] = await db
    .select({
      id: customProperties.id,
    })
    .from(customProperties)
    .where(eq(customProperties.slug, SECTIONS_SLUG));
  if (existing) {
    await db
      .update(customProperties)
      .set({
        builtIn: true,
        enabled: true,
        allCategories: true,
        allMediaTypes: true,
      })
      .where(eq(customProperties.id, existing.id));
    return existing.id;
  }

  const [row] = await db
    .insert(customProperties)
    .values({
      name: "Sections",
      slug: SECTIONS_SLUG,
      type: "sections",
      builtIn: true,
      allCategories: true,
      allMediaTypes: true,
      showInForm: true,
      showInListings: false,
      sectionsDefaultType: null,
      sectionsAllowedTypes: null,
      sectionsTiered: true,
      description: "Chapters, sections, or parts of this content — with URLs, page numbers, or timestamps.",
    })
    .onConflictDoNothing({
      target: customProperties.slug,
    })
    .returning({
      id: customProperties.id,
    });
  if (row) return row.id;

  // Lost a concurrent insert race — re-read the row the other writer created.
  return readPropertyIdBySlug(SECTIONS_SLUG);
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

/**
 * Look up the built-in "Sections" property id at request time, or `null` when it hasn't been
 * seeded yet. Read-only (never seeds) — used by the extension fill-context to target the
 * synthetic YouTube chapters rule. Mirrors {@link getContentStatusPropertyId}.
 */
export async function getSectionsPropertyId(): Promise<string | null> {
  const [row] = await db
    .select({
      id: customProperties.id,
    })
    .from(customProperties)
    .where(eq(customProperties.slug, SECTIONS_SLUG));
  return row?.id ?? null;
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
