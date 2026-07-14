import { eq } from "drizzle-orm";
import type { BookmarkFieldSort, DisplayPreferenceSettings, UpdateDisplayPreferenceInput } from "@eesimple/types";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { MAX_IMAGE_EDGE } from "@/utils/image";
import { asBreakpoints, asCropped, asDetailLayout, asHanScriptLanguage, asImageSize, asInterfaceLanguage, asMapPinScale, asMinAreaThreshold, asScreenshotDefault, asVideoSize, DEFAULT_DISPLAY_PREFERENCES, DEFAULT_SHORTENER_IGNORE_LIST, ROW_ID } from "./appSettingsShared";

/** Read the display/detail preferences (group C). */
export async function getDisplayPreferenceSettings(): Promise<DisplayPreferenceSettings> {
  const [row] = await db
    .select({
      bookmarkDetailImageSize: appSettings.bookmarkDetailImageSize,
      bookmarkDetailVideoSize: appSettings.bookmarkDetailVideoSize,
      bookmarkDetailLayout: appSettings.bookmarkDetailLayout,
      bookmarkCardThumbnailSize: appSettings.bookmarkCardThumbnailSize,
      interfaceLanguage: appSettings.interfaceLanguage,
      searchBoxPinned: appSettings.searchBoxPinned,
      panelPinned: appSettings.panelPinned,
      drawerUnpinnedBreakpoints: appSettings.drawerUnpinnedBreakpoints,
      croppedWidth: appSettings.croppedWidth,
      croppedHeight: appSettings.croppedHeight,
      customPropertyTypeIcons: appSettings.customPropertyTypeIcons,
      onDemandFilters: appSettings.onDemandFilters,
      filterOrder: appSettings.filterOrder,
      mobileHiddenFilters: appSettings.mobileHiddenFilters,
      defaultBookmarkSort: appSettings.defaultBookmarkSort,
      hanScriptLanguage: appSettings.hanScriptLanguage,
      secondaryLanguageId: appSettings.secondaryLanguageId,
      fallbackLanguageId: appSettings.fallbackLanguageId,
      minAreaPinThresholdKm2: appSettings.minAreaPinThresholdKm2,
      bookmarksPerPage: appSettings.bookmarksPerPage,
      mapPinScale: appSettings.mapPinScale,
      screenshotDefaultDelayMs: appSettings.screenshotDefaultDelayMs,
      screenshotDefaultWidth: appSettings.screenshotDefaultWidth,
      screenshotDefaultHeight: appSettings.screenshotDefaultHeight,
      screenshotDefaultScrollDistance: appSettings.screenshotDefaultScrollDistance,
      maxImageEdge: appSettings.maxImageEdge,
      imageQuality: appSettings.imageQuality,
    })
    .from(appSettings)
    .where(eq(appSettings.id, ROW_ID));
  if (!row) return DEFAULT_DISPLAY_PREFERENCES;
  return {
    bookmarkDetailImageSize: asImageSize(row.bookmarkDetailImageSize),
    bookmarkDetailVideoSize: asVideoSize(row.bookmarkDetailVideoSize),
    bookmarkDetailLayout: asDetailLayout(row.bookmarkDetailLayout),
    bookmarkCardThumbnailSize: asImageSize(row.bookmarkCardThumbnailSize),
    interfaceLanguage: asInterfaceLanguage(row.interfaceLanguage),
    searchBoxPinned: row.searchBoxPinned,
    panelPinned: row.panelPinned,
    drawerUnpinnedBreakpoints: asBreakpoints(row.drawerUnpinnedBreakpoints),
    croppedWidth: asCropped(row.croppedWidth, DEFAULT_DISPLAY_PREFERENCES.croppedWidth),
    croppedHeight: asCropped(row.croppedHeight, DEFAULT_DISPLAY_PREFERENCES.croppedHeight),
    customPropertyTypeIcons: (row.customPropertyTypeIcons as Partial<Record<string, string>> | null) ?? null,
    onDemandFilters: row.onDemandFilters ?? [],
    filterOrder: row.filterOrder ?? [],
    mobileHiddenFilters: row.mobileHiddenFilters ?? [],
    defaultBookmarkSort: (row.defaultBookmarkSort as BookmarkFieldSort | null) ?? null,
    hanScriptLanguage: asHanScriptLanguage(row.hanScriptLanguage),
    secondaryLanguageId: row.secondaryLanguageId,
    fallbackLanguageId: row.fallbackLanguageId,
    minAreaPinThresholdKm2: asMinAreaThreshold(row.minAreaPinThresholdKm2),
    bookmarksPerPage: asCropped(row.bookmarksPerPage, DEFAULT_DISPLAY_PREFERENCES.bookmarksPerPage),
    mapPinScale: asMapPinScale(row.mapPinScale),
    screenshotDefaultDelayMs: asScreenshotDefault(row.screenshotDefaultDelayMs, DEFAULT_DISPLAY_PREFERENCES.screenshotDefaultDelayMs, 0, 30000),
    screenshotDefaultWidth: asScreenshotDefault(row.screenshotDefaultWidth, DEFAULT_DISPLAY_PREFERENCES.screenshotDefaultWidth, 200, 3840),
    screenshotDefaultHeight: asScreenshotDefault(row.screenshotDefaultHeight, DEFAULT_DISPLAY_PREFERENCES.screenshotDefaultHeight, 200, 2160),
    screenshotDefaultScrollDistance: asScreenshotDefault(
      row.screenshotDefaultScrollDistance,
      DEFAULT_DISPLAY_PREFERENCES.screenshotDefaultScrollDistance,
      0,
      10000,
    ),
    maxImageEdge: asScreenshotDefault(row.maxImageEdge, DEFAULT_DISPLAY_PREFERENCES.maxImageEdge, 200, 4000),
    imageQuality: asScreenshotDefault(row.imageQuality, DEFAULT_DISPLAY_PREFERENCES.imageQuality, 1, 100),
  };
}

/**
 * Read the image-processing options (max edge / WebP quality) used by {@link processImage} at every
 * call site. Falls back to the hardcoded pipeline defaults when settings can't be read (e.g. DB
 * unavailable), mirroring {@link getImageUrlBlacklist}'s resilience.
 */
export async function getImageProcessingOptions(): Promise<{ maxEdge: number;
  quality: number; }> {
  try {
    const settings = await getDisplayPreferenceSettings();
    return {
      maxEdge: settings.maxImageEdge,
      quality: settings.imageQuality,
    };
  }
  catch {
    return {
      maxEdge: MAX_IMAGE_EDGE,
      quality: 80,
    };
  }
}

/** Replace the display/detail preferences, upserting the singleton. Returns the stored values. */
export async function updateDisplayPreferenceSettings(
  input: UpdateDisplayPreferenceInput,
): Promise<DisplayPreferenceSettings> {
  const next: DisplayPreferenceSettings = {
    bookmarkDetailImageSize: asImageSize(input.bookmarkDetailImageSize),
    bookmarkDetailVideoSize: asVideoSize(input.bookmarkDetailVideoSize),
    bookmarkDetailLayout: asDetailLayout(input.bookmarkDetailLayout),
    bookmarkCardThumbnailSize: asImageSize(input.bookmarkCardThumbnailSize),
    interfaceLanguage: asInterfaceLanguage(input.interfaceLanguage),
    searchBoxPinned: input.searchBoxPinned,
    panelPinned: input.panelPinned,
    drawerUnpinnedBreakpoints: asBreakpoints(input.drawerUnpinnedBreakpoints),
    croppedWidth: asCropped(input.croppedWidth, DEFAULT_DISPLAY_PREFERENCES.croppedWidth),
    croppedHeight: asCropped(input.croppedHeight, DEFAULT_DISPLAY_PREFERENCES.croppedHeight),
    customPropertyTypeIcons: input.customPropertyTypeIcons ?? null,
    onDemandFilters: [...(input.onDemandFilters ?? [])],
    filterOrder: [...(input.filterOrder ?? [])],
    mobileHiddenFilters: [...(input.mobileHiddenFilters ?? [])],
    defaultBookmarkSort: input.defaultBookmarkSort ?? null,
    hanScriptLanguage: asHanScriptLanguage(input.hanScriptLanguage),
    secondaryLanguageId: input.secondaryLanguageId ?? null,
    fallbackLanguageId: input.fallbackLanguageId ?? null,
    minAreaPinThresholdKm2: asMinAreaThreshold(input.minAreaPinThresholdKm2),
    bookmarksPerPage: asCropped(input.bookmarksPerPage, DEFAULT_DISPLAY_PREFERENCES.bookmarksPerPage),
    mapPinScale: asMapPinScale(input.mapPinScale),
    screenshotDefaultDelayMs: asScreenshotDefault(input.screenshotDefaultDelayMs, DEFAULT_DISPLAY_PREFERENCES.screenshotDefaultDelayMs, 0, 30000),
    screenshotDefaultWidth: asScreenshotDefault(input.screenshotDefaultWidth, DEFAULT_DISPLAY_PREFERENCES.screenshotDefaultWidth, 200, 3840),
    screenshotDefaultHeight: asScreenshotDefault(input.screenshotDefaultHeight, DEFAULT_DISPLAY_PREFERENCES.screenshotDefaultHeight, 200, 2160),
    screenshotDefaultScrollDistance: asScreenshotDefault(
      input.screenshotDefaultScrollDistance,
      DEFAULT_DISPLAY_PREFERENCES.screenshotDefaultScrollDistance,
      0,
      10000,
    ),
    maxImageEdge: asScreenshotDefault(input.maxImageEdge, DEFAULT_DISPLAY_PREFERENCES.maxImageEdge, 200, 4000),
    imageQuality: asScreenshotDefault(input.imageQuality, DEFAULT_DISPLAY_PREFERENCES.imageQuality, 1, 100),
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
