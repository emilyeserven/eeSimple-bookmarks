import { eq } from "drizzle-orm";
import type {
  AiAutotagSettings,
  AiBulkEditSettings,
  AiSummarizationSettings,
  BookmarkAiUpdateSettings,
  HomepageContentSettings,
  ScratchpadSettings,
  TagReparentSettings,
  UpdateAiAutotagInput,
  UpdateAiSummarizationInput,
  UpdateAiBulkEditInput,
  UpdateBookmarkAiUpdateInput,
  UpdateHomepageContentInput,
  UpdateScratchpadInput,
  UpdateTagReparentInput,
} from "@eesimple/types";
import { resolveHomepageWidgetOrder } from "@eesimple/types";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { asQuickAddDisplay, asWidth, DEFAULT_AI_AUTOTAG, DEFAULT_AI_BULK_EDIT, DEFAULT_AI_SUMMARIZATION, DEFAULT_BOOKMARK_AI_UPDATE, DEFAULT_HOMEPAGE_CONTENT, DEFAULT_SCRATCHPAD, DEFAULT_SHORTENER_IGNORE_LIST, DEFAULT_TAG_REPARENT, ROW_ID } from "./appSettingsShared";

/** Read just the homepage-content settings shown/edited on the homepage settings page. */
export async function getHomepageContentSettings(): Promise<HomepageContentSettings> {
  const [row] = await db
    .select({
      homepageText: appSettings.homepageText,
      homepageTextWidth: appSettings.homepageTextWidth,
      bookmarkQuickAddEnabled: appSettings.bookmarkQuickAddEnabled,
      bookmarkQuickAddWidth: appSettings.bookmarkQuickAddWidth,
      bookmarkQuickAddDisplay: appSettings.bookmarkQuickAddDisplay,
      homepageHeaderHidden: appSettings.homepageHeaderHidden,
      homepageTextEnabled: appSettings.homepageTextEnabled,
      searchEnabled: appSettings.searchEnabled,
      searchWidth: appSettings.searchWidth,
      widgetOrder: appSettings.widgetOrder,
    })
    .from(appSettings)
    .where(eq(appSettings.id, ROW_ID));
  if (!row) return DEFAULT_HOMEPAGE_CONTENT;
  return {
    homepageText: row.homepageText,
    homepageTextWidth: asWidth(row.homepageTextWidth),
    bookmarkQuickAddEnabled: row.bookmarkQuickAddEnabled,
    bookmarkQuickAddWidth: asWidth(row.bookmarkQuickAddWidth),
    bookmarkQuickAddDisplay: asQuickAddDisplay(row.bookmarkQuickAddDisplay),
    homepageHeaderHidden: row.homepageHeaderHidden,
    homepageTextEnabled: row.homepageTextEnabled,
    searchEnabled: row.searchEnabled ?? false,
    searchWidth: asWidth(row.searchWidth),
    widgetOrder: resolveHomepageWidgetOrder(row.widgetOrder),
  };
}

/** Replace the homepage-content settings, upserting the singleton. Returns the stored values. */
export async function updateHomepageContentSettings(
  input: UpdateHomepageContentInput,
): Promise<HomepageContentSettings> {
  const next: HomepageContentSettings = {
    homepageText: input.homepageText,
    homepageTextWidth: asWidth(input.homepageTextWidth),
    bookmarkQuickAddEnabled: input.bookmarkQuickAddEnabled,
    bookmarkQuickAddWidth: asWidth(input.bookmarkQuickAddWidth),
    bookmarkQuickAddDisplay: asQuickAddDisplay(input.bookmarkQuickAddDisplay),
    homepageHeaderHidden: input.homepageHeaderHidden,
    homepageTextEnabled: input.homepageTextEnabled,
    searchEnabled: input.searchEnabled,
    searchWidth: asWidth(input.searchWidth),
    widgetOrder: resolveHomepageWidgetOrder(input.widgetOrder),
  };
  await db
    .insert(appSettings)
    .values({
      id: ROW_ID,
      shortenerIgnoreList: DEFAULT_SHORTENER_IGNORE_LIST,
      ...next,
    })
    .onConflictDoUpdate({
      target: appSettings.id,
      set: next,
    });
  return next;
}

/** Read the AI summarization settings. */
export async function getAiSummarizationSettings(): Promise<AiSummarizationSettings> {
  const [row] = await db
    .select({
      aiSummarizationPrompt: appSettings.aiSummarizationPrompt,
      aiSummarizationSuggestTags: appSettings.aiSummarizationSuggestTags,
    })
    .from(appSettings)
    .where(eq(appSettings.id, ROW_ID));
  if (!row) return DEFAULT_AI_SUMMARIZATION;
  return {
    aiSummarizationPrompt: row.aiSummarizationPrompt,
    aiSummarizationSuggestTags: row.aiSummarizationSuggestTags ?? false,
  };
}

/** Replace the AI summarization settings, upserting the singleton. Returns the stored values. */
export async function updateAiSummarizationSettings(
  input: UpdateAiSummarizationInput,
): Promise<AiSummarizationSettings> {
  const next: AiSummarizationSettings = {
    aiSummarizationPrompt: input.aiSummarizationPrompt,
    aiSummarizationSuggestTags: input.aiSummarizationSuggestTags,
  };
  await db
    .insert(appSettings)
    .values({
      id: ROW_ID,
      ...next,
    })
    .onConflictDoUpdate({
      target: appSettings.id,
      set: next,
    });
  return next;
}

/** Read the Scratchpad note (coalescing the nullable column to an empty string). */
export async function getScratchpadSettings(): Promise<ScratchpadSettings> {
  const [row] = await db
    .select({
      scratchpadText: appSettings.scratchpadText,
    })
    .from(appSettings)
    .where(eq(appSettings.id, ROW_ID));
  if (!row) return DEFAULT_SCRATCHPAD;
  return {
    scratchpadText: row.scratchpadText ?? "",
  };
}

/** Replace the Scratchpad note, upserting the singleton. Returns the stored value. */
export async function updateScratchpadSettings(
  input: UpdateScratchpadInput,
): Promise<ScratchpadSettings> {
  const next: ScratchpadSettings = {
    scratchpadText: input.scratchpadText,
  };
  await db
    .insert(appSettings)
    .values({
      id: ROW_ID,
      ...next,
    })
    .onConflictDoUpdate({
      target: appSettings.id,
      set: next,
    });
  return next;
}

/** Read the AI autotag settings. */
export async function getAiAutotagSettings(): Promise<AiAutotagSettings> {
  const [row] = await db
    .select({
      aiAutotagPrompt: appSettings.aiAutotagPrompt,
      aiAutotagIncludeExistingTags: appSettings.aiAutotagIncludeExistingTags,
    })
    .from(appSettings)
    .where(eq(appSettings.id, ROW_ID));
  if (!row) return DEFAULT_AI_AUTOTAG;
  return {
    aiAutotagPrompt: row.aiAutotagPrompt ?? "",
    aiAutotagIncludeExistingTags: row.aiAutotagIncludeExistingTags ?? false,
  };
}

/** Replace the AI autotag settings, upserting the singleton. Returns the stored values. */
export async function updateAiAutotagSettings(
  input: UpdateAiAutotagInput,
): Promise<AiAutotagSettings> {
  const next: AiAutotagSettings = {
    aiAutotagPrompt: input.aiAutotagPrompt,
    aiAutotagIncludeExistingTags: input.aiAutotagIncludeExistingTags,
  };
  await db
    .insert(appSettings)
    .values({
      id: ROW_ID,
      ...next,
    })
    .onConflictDoUpdate({
      target: appSettings.id,
      set: next,
    });
  return next;
}

/** Read the tag reparent prompt (coalescing the nullable column to an empty string). */
export async function getTagReparentSettings(): Promise<TagReparentSettings> {
  const [row] = await db
    .select({
      tagReparentPrompt: appSettings.tagReparentPrompt,
    })
    .from(appSettings)
    .where(eq(appSettings.id, ROW_ID));
  if (!row) return DEFAULT_TAG_REPARENT;
  return {
    tagReparentPrompt: row.tagReparentPrompt ?? "",
  };
}

/** Replace the tag reparent prompt, upserting the singleton. Returns the stored value. */
export async function updateTagReparentSettings(
  input: UpdateTagReparentInput,
): Promise<TagReparentSettings> {
  const next: TagReparentSettings = {
    tagReparentPrompt: input.tagReparentPrompt,
  };
  await db
    .insert(appSettings)
    .values({
      id: ROW_ID,
      ...next,
    })
    .onConflictDoUpdate({
      target: appSettings.id,
      set: next,
    });
  return next;
}

/** Read the bookmark AI-update prompt template (coalescing the nullable column to an empty string). */
export async function getBookmarkAiUpdateSettings(): Promise<BookmarkAiUpdateSettings> {
  const [row] = await db
    .select({
      bookmarkAiUpdatePrompt: appSettings.bookmarkAiUpdatePrompt,
    })
    .from(appSettings)
    .where(eq(appSettings.id, ROW_ID));
  if (!row) return DEFAULT_BOOKMARK_AI_UPDATE;
  return {
    bookmarkAiUpdatePrompt: row.bookmarkAiUpdatePrompt ?? "",
  };
}

/** Replace the bookmark AI-update prompt template, upserting the singleton. Returns the stored value. */
export async function updateBookmarkAiUpdateSettings(
  input: UpdateBookmarkAiUpdateInput,
): Promise<BookmarkAiUpdateSettings> {
  const next: BookmarkAiUpdateSettings = {
    bookmarkAiUpdatePrompt: input.bookmarkAiUpdatePrompt,
  };
  await db
    .insert(appSettings)
    .values({
      id: ROW_ID,
      ...next,
    })
    .onConflictDoUpdate({
      target: appSettings.id,
      set: next,
    });
  return next;
}

/** Read the AI Bulk Edit prompt template (coalescing the nullable column to an empty string). */
export async function getAiBulkEditSettings(): Promise<AiBulkEditSettings> {
  const [row] = await db
    .select({
      aiBulkEditPrompt: appSettings.aiBulkEditPrompt,
    })
    .from(appSettings)
    .where(eq(appSettings.id, ROW_ID));
  if (!row) return DEFAULT_AI_BULK_EDIT;
  return {
    aiBulkEditPrompt: row.aiBulkEditPrompt ?? "",
  };
}

/** Replace the AI Bulk Edit prompt template, upserting the singleton. Returns the stored value. */
export async function updateAiBulkEditSettings(
  input: UpdateAiBulkEditInput,
): Promise<AiBulkEditSettings> {
  const next: AiBulkEditSettings = {
    aiBulkEditPrompt: input.aiBulkEditPrompt,
  };
  await db
    .insert(appSettings)
    .values({
      id: ROW_ID,
      ...next,
    })
    .onConflictDoUpdate({
      target: appSettings.id,
      set: next,
    });
  return next;
}
