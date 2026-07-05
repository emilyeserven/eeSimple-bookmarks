import { eq } from "drizzle-orm";
import type {
  AdvancedSettings,
  AiSummarizationSettings,
  AutomationSettings,
  BookmarkAddFormPlacement,
  BookmarkAddFormSettings,
  BookmarkDetailImageSize,
  BookmarkGraphSettings,
  BookmarkGraphWeight,
  BookmarkGraphWeights,
  BookmarkDetailLayout,
  BookmarkDetailVideoSize,
  ConnectorsAppSettings,
  DisplayPreferenceSettings,
  HomepageContentSettings,
  HomepageContentWidth,
  ImportBlacklistEntry,
  InterfaceLanguage,
  PlaceTypeColorConfig,
  PlaceTypeDisplayConfig,
  PlaceTypeIconConfig,
  PlaceTypeLevelGroup,
  PlaceTypeLevelGroupConfig,
  QuickAddDisplay,
  SidebarCustomizationSettings,
  SidebarOpenModifier,
  UpdateAdvancedSettingsInput,
  UpdateAiSummarizationInput,
  UpdateAutomationInput,
  UpdateBookmarkAddFormInput,
  UpdateBookmarkGraphInput,
  UpdateConnectorsSettingsInput,
  UpdateDisplayPreferenceInput,
  UpdateHomepageContentInput,
  UpdateSidebarCustomizationInput,
} from "@eesimple/types";
import { BOOKMARK_ADD_FORM_PLACEMENTS, CANONICAL_PLACE_TYPE_ORDER, DEFAULT_BOOKMARK_ADD_FORM_SETTINGS, DEFAULT_BOOKMARK_GRAPH_SETTINGS, DEFAULT_BOOKMARKS_PER_PAGE, DEFAULT_HOMEPAGE_WIDGET_ORDER, LOCATION_DISPLAY_MODES, MAP_PIN_SCALE_DEFAULT, MAP_PIN_SCALE_MAX, MAP_PIN_SCALE_MIN, normalizeBlacklist, normalizeHexColor, normalizeIconName, normalizeLevelMode, placeTypeKey, resolveHomepageWidgetOrder } from "@eesimple/types";
import { db } from "@/db";
import { appSettings, locations } from "@/db/schema";
import { encryptionEnabled, maybeDecrypt, maybeEncrypt } from "@/utils/crypto";

/** The app-settings singleton always lives at row id = 1, mirroring `homepage_filter`. */
const ROW_ID = 1;

/**
 * Default generic URL-shortener domains. These can't be expanded to a specific vendor, so the
 * add-bookmark form nudges the user to paste the full link instead.
 */
const DEFAULT_SHORTENER_IGNORE_LIST = [
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "ow.ly",
  "is.gd",
  "buff.ly",
  "rebrand.ly",
  "cutt.ly",
];

/** Default homepage-content settings, used when seeding and when the row is somehow absent. */
const DEFAULT_HOMEPAGE_CONTENT: HomepageContentSettings = {
  homepageText: "",
  homepageTextWidth: "full",
  bookmarkQuickAddEnabled: false,
  bookmarkQuickAddWidth: "full",
  bookmarkQuickAddDisplay: "collapsible",
  homepageHeaderHidden: false,
  homepageTextEnabled: true,
  searchEnabled: false,
  searchWidth: "full",
  widgetOrder: DEFAULT_HOMEPAGE_WIDGET_ORDER,
};

/** Default advanced settings (all opt-in sidebar links off), used when seeding / when row absent. */
const DEFAULT_ADVANCED_SETTINGS: AdvancedSettings = {
  coolifyLinkEnabled: false,
  coolifyUrl: "",
  docsLinkEnabled: false,
  storybookLinkEnabled: false,
  drizzleGatewayLinkEnabled: false,
  drizzleGatewayUrl: "",
  githubLinkEnabled: false,
};

/** Default sidebar-customization settings (nothing hidden), used when seeding / when row absent. */
const DEFAULT_SIDEBAR_CUSTOMIZATION: SidebarCustomizationSettings = {
  hiddenCategoryIds: [],
  seeMoreCategoryIds: [],
  hiddenTaxonomyItems: [],
  seeMoreTaxonomyItems: [],
  hiddenCustomizationItems: [],
  seeMoreCustomizationItems: [],
  hiddenManagementItems: [],
  hiddenSidebarGroups: [],
  hiddenConnectorLinks: [],
  seeMoreConnectorLinks: [],
};

/** Default automation settings (auto-fetch on, Alt modifier), used when seeding / when row absent. */
const DEFAULT_AUTOMATION: AutomationSettings = {
  autoFetchTitle: true,
  autoFetchImage: true,
  autoApplyTitleTags: false,
  autoApplyTitleLocations: false,
  sidebarOpenModifier: "alt",
};

/** Default Bookmark Graph relatedness settings, used when seeding / when row absent. */
const DEFAULT_BOOKMARK_GRAPH: BookmarkGraphSettings = DEFAULT_BOOKMARK_GRAPH_SETTINGS;

/** Clamp an arbitrary stored value to a relatedness weight (0–3), defaulting to `fallback`. */
function asGraphWeight(value: unknown, fallback: BookmarkGraphWeight): BookmarkGraphWeight {
  return value === 0 || value === 1 || value === 2 || value === 3 ? value : fallback;
}

/**
 * Coerce an arbitrary stored jsonb blob into valid {@link BookmarkGraphSettings}: clamp each weight
 * to 0–3, clamp `maxRelated` to 1–100, and merge over the defaults so a partial/legacy row is safe.
 */
function resolveBookmarkGraph(raw: unknown): BookmarkGraphSettings {
  const stored = (raw ?? {}) as Partial<BookmarkGraphSettings>;
  const storedWeights = (stored.weights ?? {}) as Partial<BookmarkGraphWeights>;
  const defaults = DEFAULT_BOOKMARK_GRAPH.weights;
  const weights: BookmarkGraphWeights = {
    tags: asGraphWeight(storedWeights.tags, defaults.tags),
    category: asGraphWeight(storedWeights.category, defaults.category),
    mediaType: asGraphWeight(storedWeights.mediaType, defaults.mediaType),
    genreMoods: asGraphWeight(storedWeights.genreMoods, defaults.genreMoods),
    people: asGraphWeight(storedWeights.people, defaults.people),
    groups: asGraphWeight(storedWeights.groups, defaults.groups),
    website: asGraphWeight(storedWeights.website, defaults.website),
    youtubeChannel: asGraphWeight(storedWeights.youtubeChannel, defaults.youtubeChannel),
  };
  const rawMax = typeof stored.maxRelated === "number" && Number.isFinite(stored.maxRelated)
    ? Math.round(stored.maxRelated)
    : DEFAULT_BOOKMARK_GRAPH.maxRelated;
  return {
    weights,
    maxRelated: Math.min(100, Math.max(1, rawMax)),
  };
}

/** Default AI summarization settings (empty prompt), used when seeding / when row absent. */
const DEFAULT_AI_SUMMARIZATION: AiSummarizationSettings = {
  aiSummarizationPrompt: "",
};

/** Default display/detail preferences, used when seeding / when row absent. */
const DEFAULT_DISPLAY_PREFERENCES: DisplayPreferenceSettings = {
  bookmarkDetailImageSize: "medium",
  bookmarkDetailVideoSize: "standard",
  bookmarkDetailLayout: "single",
  interfaceLanguage: "en",
  customPropertyTypeIcons: null,
  onDemandFilters: [],
  filtersInDrawer: false,
  filtersHidden: false,
  panelPinned: false,
  drawerUnpinnedBreakpoints: [768],
  croppedWidth: 16,
  croppedHeight: 9,
  hanScriptLanguage: "ja",
  secondaryLanguageId: null,
  minAreaPinThresholdKm2: 0,
  bookmarksPerPage: DEFAULT_BOOKMARKS_PER_PAGE,
  mapPinScale: MAP_PIN_SCALE_DEFAULT,
  screenshotDefaultDelayMs: 0,
  screenshotDefaultWidth: 1280,
  screenshotDefaultHeight: 720,
  screenshotDefaultScrollDistance: 0,
};

/** Coerce a stored width string to the typed union, defaulting to "full". */
function asWidth(value: string | null | undefined): HomepageContentWidth {
  return value === "half" ? "half" : "full";
}

/** Coerce a stored display string to the typed union, defaulting to "collapsible". */
function asQuickAddDisplay(value: string | null | undefined): QuickAddDisplay {
  return value === "expanded" ? "expanded" : "collapsible";
}

/** Coerce a stored modifier string to the typed union, defaulting to "alt". */
function asModifier(value: string | null | undefined): SidebarOpenModifier {
  return value === "ctrl" || value === "shift" || value === "meta" ? value : "alt";
}

/** Coerce a stored detail-image-size string to the typed union, defaulting to "medium". */
function asImageSize(value: string | null | undefined): BookmarkDetailImageSize {
  return value === "small" || value === "large" ? value : "medium";
}

/** Coerce a stored detail-video-size string to the typed union, defaulting to "standard". */
function asVideoSize(value: string | null | undefined): BookmarkDetailVideoSize {
  return value === "half" || value === "twoThirds" || value === "fullwidth" ? value : "standard";
}

/** Coerce a stored detail-layout string to the typed union, defaulting to "single". */
function asDetailLayout(value: string | null | undefined): BookmarkDetailLayout {
  return value === "tabbed" ? "tabbed" : "single";
}

/** Coerce a stored interface-language string to the typed union, defaulting to "en". */
function asInterfaceLanguage(value: string | null | undefined): InterfaceLanguage {
  return value === "ja" ? "ja" : "en";
}

/** Coerce a stored Han-only-name language to the typed union, defaulting to "ja" (Japanese). */
export function asHanScriptLanguage(value: string | null | undefined): "ja" | "zh" {
  return value === "zh" ? "zh" : "ja";
}

/** Clamp a stored cropped dimension to a positive integer (mirrors the old client setter). */
export function asCropped(value: number | null | undefined, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(1, Math.round(value));
}

/** Clamp the stored min-area-pin threshold (km²) to a non-negative number; `0` disables it. */
export function asMinAreaThreshold(value: number | null | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(0, value);
}

/** Clamp the stored map-pin scale to [MAP_PIN_SCALE_MIN, MAP_PIN_SCALE_MAX], defaulting to 1. */
export function asMapPinScale(value: number | null | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return MAP_PIN_SCALE_DEFAULT;
  return Math.min(MAP_PIN_SCALE_MAX, Math.max(MAP_PIN_SCALE_MIN, value));
}

/** Clamp a stored screenshot-default numeric field to an integer within [min, max]. */
export function asScreenshotDefault(
  value: number | null | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

/** Coerce breakpoints to a deduped, sorted array of positive integers. */
export function asBreakpoints(value: number[] | null | undefined): number[] {
  if (!Array.isArray(value)) return [...DEFAULT_DISPLAY_PREFERENCES.drawerUnpinnedBreakpoints];
  const cleaned = value
    .filter(n => typeof n === "number" && Number.isFinite(n) && n > 0)
    .map(n => Math.round(n));
  return [...new Set(cleaned)].sort((a, b) => a - b);
}

/** Idempotently seed the settings singleton on first boot. Safe to call on every start. */
export async function ensureAppSettings(): Promise<void> {
  const [existing] = await db
    .select({
      id: appSettings.id,
    })
    .from(appSettings)
    .where(eq(appSettings.id, ROW_ID));
  if (existing) return;
  await db
    .insert(appSettings)
    .values({
      id: ROW_ID,
      shortenerIgnoreList: DEFAULT_SHORTENER_IGNORE_LIST,
      ...DEFAULT_HOMEPAGE_CONTENT,
      ...DEFAULT_ADVANCED_SETTINGS,
      ...DEFAULT_SIDEBAR_CUSTOMIZATION,
      ...DEFAULT_AUTOMATION,
      ...DEFAULT_DISPLAY_PREFERENCES,
      ...DEFAULT_AI_SUMMARIZATION,
      bookmarkGraph: DEFAULT_BOOKMARK_GRAPH,
    })
    .onConflictDoNothing({
      target: appSettings.id,
    });
}

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
    })
    .from(appSettings)
    .where(eq(appSettings.id, ROW_ID));
  if (!row) return DEFAULT_AI_SUMMARIZATION;
  return {
    aiSummarizationPrompt: row.aiSummarizationPrompt,
  };
}

/** Replace the AI summarization settings, upserting the singleton. Returns the stored values. */
export async function updateAiSummarizationSettings(
  input: UpdateAiSummarizationInput,
): Promise<AiSummarizationSettings> {
  const next: AiSummarizationSettings = {
    aiSummarizationPrompt: input.aiSummarizationPrompt,
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

/** Read the generic-shortener ignore list. */
export async function getShortenerIgnoreList(): Promise<string[]> {
  const [row] = await db
    .select({
      shortenerIgnoreList: appSettings.shortenerIgnoreList,
    })
    .from(appSettings)
    .where(eq(appSettings.id, ROW_ID));
  return row?.shortenerIgnoreList ?? [];
}

/**
 * Replace the generic-shortener ignore list. Domains are normalized (trimmed, lower-cased, leading
 * `www.` stripped) and de-duplicated; empties are dropped. Returns the stored list.
 */
export async function updateShortenerIgnoreList(domains: string[]): Promise<string[]> {
  const normalized = [
    ...new Set(
      domains
        .map(d => d.trim().replace(/^www\./i, "").toLowerCase())
        .filter(d => d.length > 0),
    ),
  ];
  await db
    .insert(appSettings)
    .values({
      id: ROW_ID,
      shortenerIgnoreList: normalized,
    })
    .onConflictDoUpdate({
      target: appSettings.id,
      set: {
        shortenerIgnoreList: normalized,
      },
    });
  return normalized;
}

/** Read the user-defined query params to strip in addition to the built-in TRACKING_PARAMS. */
export async function getCustomStripParams(): Promise<string[]> {
  const [row] = await db
    .select({
      customStripParams: appSettings.customStripParams,
    })
    .from(appSettings)
    .where(eq(appSettings.id, ROW_ID));
  return row?.customStripParams ?? [];
}

/**
 * Replace the custom strip-params list. Params are normalized (trimmed, lower-cased) and
 * de-duplicated; empties are dropped. Returns the stored list.
 */
export async function updateCustomStripParams(params: string[]): Promise<string[]> {
  const normalized = [
    ...new Set(
      params
        .map(p => p.trim().toLowerCase())
        .filter(p => p.length > 0),
    ),
  ];
  await db
    .insert(appSettings)
    .values({
      id: ROW_ID,
      shortenerIgnoreList: DEFAULT_SHORTENER_IGNORE_LIST,
      customStripParams: normalized,
    })
    .onConflictDoUpdate({
      target: appSettings.id,
      set: {
        customStripParams: normalized,
      },
    });
  return normalized;
}

/** Read the redirect ignore list (domains whose redirect chains are never followed). */
export async function getRedirectIgnoreList(): Promise<string[]> {
  const [row] = await db
    .select({
      redirectIgnoreList: appSettings.redirectIgnoreList,
    })
    .from(appSettings)
    .where(eq(appSettings.id, ROW_ID));
  return row?.redirectIgnoreList ?? [];
}

/**
 * Replace the redirect ignore list. Domains are normalized (trimmed, lower-cased, leading `www.`
 * stripped) and de-duplicated; empties are dropped. Returns the stored list.
 */
export async function updateRedirectIgnoreList(domains: string[]): Promise<string[]> {
  const normalized = [
    ...new Set(
      domains
        .map(d => d.trim().replace(/^www\./i, "").toLowerCase())
        .filter(d => d.length > 0),
    ),
  ];
  await db
    .insert(appSettings)
    .values({
      id: ROW_ID,
      shortenerIgnoreList: DEFAULT_SHORTENER_IGNORE_LIST,
      redirectIgnoreList: normalized,
    })
    .onConflictDoUpdate({
      target: appSettings.id,
      set: {
        redirectIgnoreList: normalized,
      },
    });
  return normalized;
}

/** Read the imports blacklist (links matching these are dropped from future imports). */
export async function getImportBlacklist(): Promise<ImportBlacklistEntry[]> {
  const [row] = await db
    .select({
      importBlacklist: appSettings.importBlacklist,
    })
    .from(appSettings)
    .where(eq(appSettings.id, ROW_ID));
  return row?.importBlacklist ?? [];
}

/** Replace the imports blacklist. Entries are normalized + de-duplicated. */
export async function updateImportBlacklist(
  entries: ImportBlacklistEntry[],
): Promise<ImportBlacklistEntry[]> {
  const normalized = normalizeBlacklist(entries);
  await db
    .insert(appSettings)
    .values({
      id: ROW_ID,
      shortenerIgnoreList: DEFAULT_SHORTENER_IGNORE_LIST,
      importBlacklist: normalized,
    })
    .onConflictDoUpdate({
      target: appSettings.id,
      set: {
        importBlacklist: normalized,
      },
    });
  return normalized;
}

/** Add a single entry to the imports blacklist (normalized + de-duplicated). Returns the new list. */
export async function addImportBlacklistEntry(
  entry: ImportBlacklistEntry,
): Promise<ImportBlacklistEntry[]> {
  const current = await getImportBlacklist();
  return updateImportBlacklist([...current, entry]);
}

/** Read the opt-in Advanced sidebar-link settings (Coolify, docs, Storybook). */
export async function getAdvancedSettings(): Promise<AdvancedSettings> {
  const [row] = await db
    .select({
      coolifyLinkEnabled: appSettings.coolifyLinkEnabled,
      coolifyUrl: appSettings.coolifyUrl,
      docsLinkEnabled: appSettings.docsLinkEnabled,
      storybookLinkEnabled: appSettings.storybookLinkEnabled,
      drizzleGatewayLinkEnabled: appSettings.drizzleGatewayLinkEnabled,
      drizzleGatewayUrl: appSettings.drizzleGatewayUrl,
      githubLinkEnabled: appSettings.githubLinkEnabled,
    })
    .from(appSettings)
    .where(eq(appSettings.id, ROW_ID));
  if (!row) return DEFAULT_ADVANCED_SETTINGS;
  return {
    coolifyLinkEnabled: row.coolifyLinkEnabled,
    coolifyUrl: row.coolifyUrl,
    docsLinkEnabled: row.docsLinkEnabled,
    storybookLinkEnabled: row.storybookLinkEnabled,
    drizzleGatewayLinkEnabled: row.drizzleGatewayLinkEnabled,
    drizzleGatewayUrl: row.drizzleGatewayUrl,
    githubLinkEnabled: row.githubLinkEnabled,
  };
}

/** Replace the Advanced sidebar-link settings, upserting the singleton. Returns the stored values. */
export async function updateAdvancedSettings(
  input: UpdateAdvancedSettingsInput,
): Promise<AdvancedSettings> {
  const next: AdvancedSettings = {
    coolifyLinkEnabled: input.coolifyLinkEnabled,
    coolifyUrl: input.coolifyUrl.trim(),
    docsLinkEnabled: input.docsLinkEnabled,
    storybookLinkEnabled: input.storybookLinkEnabled,
    drizzleGatewayLinkEnabled: input.drizzleGatewayLinkEnabled,
    drizzleGatewayUrl: input.drizzleGatewayUrl.trim(),
    githubLinkEnabled: input.githubLinkEnabled,
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

/** Read the left-sidebar customization settings (group A). */
export async function getSidebarCustomizationSettings(): Promise<SidebarCustomizationSettings> {
  const [row] = await db
    .select({
      hiddenCategoryIds: appSettings.hiddenCategoryIds,
      seeMoreCategoryIds: appSettings.seeMoreCategoryIds,
      hiddenTaxonomyItems: appSettings.hiddenTaxonomyItems,
      seeMoreTaxonomyItems: appSettings.seeMoreTaxonomyItems,
      hiddenCustomizationItems: appSettings.hiddenCustomizationItems,
      seeMoreCustomizationItems: appSettings.seeMoreCustomizationItems,
      hiddenManagementItems: appSettings.hiddenManagementItems,
      hiddenSidebarGroups: appSettings.hiddenSidebarGroups,
      hiddenConnectorLinks: appSettings.hiddenConnectorLinks,
      seeMoreConnectorLinks: appSettings.seeMoreConnectorLinks,
    })
    .from(appSettings)
    .where(eq(appSettings.id, ROW_ID));
  if (!row) return DEFAULT_SIDEBAR_CUSTOMIZATION;
  return {
    hiddenCategoryIds: row.hiddenCategoryIds ?? [],
    seeMoreCategoryIds: row.seeMoreCategoryIds ?? [],
    hiddenTaxonomyItems: row.hiddenTaxonomyItems ?? [],
    seeMoreTaxonomyItems: row.seeMoreTaxonomyItems ?? [],
    hiddenCustomizationItems: row.hiddenCustomizationItems ?? [],
    seeMoreCustomizationItems: row.seeMoreCustomizationItems ?? [],
    hiddenManagementItems: row.hiddenManagementItems ?? [],
    hiddenSidebarGroups: row.hiddenSidebarGroups ?? [],
    hiddenConnectorLinks: row.hiddenConnectorLinks ?? [],
    seeMoreConnectorLinks: row.seeMoreConnectorLinks ?? [],
  };
}

/** Replace the sidebar-customization settings, upserting the singleton. Returns the stored values. */
export async function updateSidebarCustomizationSettings(
  input: UpdateSidebarCustomizationInput,
): Promise<SidebarCustomizationSettings> {
  const next: SidebarCustomizationSettings = {
    hiddenCategoryIds: [...input.hiddenCategoryIds],
    seeMoreCategoryIds: [...input.seeMoreCategoryIds],
    hiddenTaxonomyItems: [...input.hiddenTaxonomyItems],
    seeMoreTaxonomyItems: [...input.seeMoreTaxonomyItems],
    hiddenCustomizationItems: [...input.hiddenCustomizationItems],
    seeMoreCustomizationItems: [...input.seeMoreCustomizationItems],
    hiddenManagementItems: [...input.hiddenManagementItems],
    hiddenSidebarGroups: [...input.hiddenSidebarGroups],
    hiddenConnectorLinks: [...input.hiddenConnectorLinks],
    seeMoreConnectorLinks: [...input.seeMoreConnectorLinks],
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

/** Read the automation/behavior settings (group B). */
export async function getAutomationSettings(): Promise<AutomationSettings> {
  const [row] = await db
    .select({
      autoFetchTitle: appSettings.autoFetchTitle,
      autoFetchImage: appSettings.autoFetchImage,
      autoApplyTitleTags: appSettings.autoApplyTitleTags,
      autoApplyTitleLocations: appSettings.autoApplyTitleLocations,
      sidebarOpenModifier: appSettings.sidebarOpenModifier,
    })
    .from(appSettings)
    .where(eq(appSettings.id, ROW_ID));
  if (!row) return DEFAULT_AUTOMATION;
  return {
    autoFetchTitle: row.autoFetchTitle,
    autoFetchImage: row.autoFetchImage,
    autoApplyTitleTags: row.autoApplyTitleTags,
    autoApplyTitleLocations: row.autoApplyTitleLocations ?? false,
    sidebarOpenModifier: asModifier(row.sidebarOpenModifier),
  };
}

/** Replace the automation settings, upserting the singleton. Returns the stored values. */
export async function updateAutomationSettings(
  input: UpdateAutomationInput,
): Promise<AutomationSettings> {
  const next: AutomationSettings = {
    autoFetchTitle: input.autoFetchTitle,
    autoFetchImage: input.autoFetchImage,
    autoApplyTitleTags: input.autoApplyTitleTags,
    autoApplyTitleLocations: input.autoApplyTitleLocations,
    sidebarOpenModifier: asModifier(input.sidebarOpenModifier),
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

/** Read the Bookmark Graph relatedness settings (per-dimension weights + max count). */
export async function getBookmarkGraphSettings(): Promise<BookmarkGraphSettings> {
  const [row] = await db
    .select({
      bookmarkGraph: appSettings.bookmarkGraph,
    })
    .from(appSettings)
    .where(eq(appSettings.id, ROW_ID));
  if (!row) return DEFAULT_BOOKMARK_GRAPH;
  return resolveBookmarkGraph(row.bookmarkGraph);
}

/** Replace the Bookmark Graph settings, upserting the singleton. Returns the stored (coerced) values. */
export async function updateBookmarkGraphSettings(
  input: UpdateBookmarkGraphInput,
): Promise<BookmarkGraphSettings> {
  const next = resolveBookmarkGraph(input);
  await db
    .insert(appSettings)
    .values({
      id: ROW_ID,
      shortenerIgnoreList: DEFAULT_SHORTENER_IGNORE_LIST,
      bookmarkGraph: next,
    })
    .onConflictDoUpdate({
      target: appSettings.id,
      set: {
        bookmarkGraph: next,
      },
    });
  return next;
}

/**
 * Sanitize a per-placeType display config: keep only well-formed entries (valid `displayMode`,
 * boolean `visible`, finite `sortOrder`) under a normalized placeType key. Tolerates arbitrary
 * client/stored shapes so a malformed jsonb row never crashes the map.
 */
export function normalizePlaceTypeDisplay(input: unknown): PlaceTypeDisplayConfig {
  if (input === null || typeof input !== "object") return {};
  const out: PlaceTypeDisplayConfig = {};
  for (const [rawKey, rawValue] of Object.entries(input as Record<string, unknown>)) {
    const key = placeTypeKey(rawKey);
    if (key === "" || rawValue === null || typeof rawValue !== "object") continue;
    const value = rawValue as Record<string, unknown>;
    const displayMode = LOCATION_DISPLAY_MODES.find(mode => mode === value.displayMode);
    if (!displayMode) continue;
    const color = normalizeHexColor(value.color);
    out[key] = {
      displayMode,
      visible: value.visible !== false,
      sortOrder: typeof value.sortOrder === "number" && Number.isFinite(value.sortOrder)
        ? value.sortOrder
        : 0,
      ...(color
        ? {
          color,
        }
        : {}),
    };
  }
  return out;
}

/** Read the per-placeType map display config (Settings → Locations + the map "Levels" overlay). */
export async function getPlaceTypeDisplay(): Promise<PlaceTypeDisplayConfig> {
  const [row] = await db
    .select({
      placeTypeDisplay: appSettings.placeTypeDisplay,
    })
    .from(appSettings)
    .where(eq(appSettings.id, ROW_ID));
  return normalizePlaceTypeDisplay(row?.placeTypeDisplay ?? {});
}

/** Replace the per-placeType map display config, upserting the singleton. Returns the stored value. */
export async function updatePlaceTypeDisplay(
  input: PlaceTypeDisplayConfig,
): Promise<PlaceTypeDisplayConfig> {
  const next = normalizePlaceTypeDisplay(input);
  await db
    .insert(appSettings)
    .values({
      id: ROW_ID,
      shortenerIgnoreList: DEFAULT_SHORTENER_IGNORE_LIST,
      placeTypeDisplay: next,
    })
    .onConflictDoUpdate({
      target: appSettings.id,
      set: {
        placeTypeDisplay: next,
      },
    });
  return next;
}

/**
 * Sanitize the named place-type level groups: keep only well-formed groups (a string id+name, a
 * valid `displayMode`, an array of normalized member place-type keys), coercing `visible`/`sortOrder`.
 * Tolerates arbitrary client/stored shapes so a malformed jsonb row never crashes the map.
 */
export function normalizePlaceTypeLevelGroups(input: unknown): PlaceTypeLevelGroupConfig {
  if (!Array.isArray(input)) return [];
  const out: PlaceTypeLevelGroupConfig = [];
  input.forEach((rawGroup, index) => {
    if (rawGroup === null || typeof rawGroup !== "object") return;
    const value = rawGroup as Record<string, unknown>;
    const displayMode = LOCATION_DISPLAY_MODES.find(mode => mode === value.displayMode);
    if (!displayMode) return;
    const id = typeof value.id === "string" && value.id.trim() !== ""
      ? value.id
      : `group-${index}`;
    const name = typeof value.name === "string" ? value.name.trim() : "";
    const placeTypes = Array.isArray(value.placeTypes)
      ? [...new Set(
        value.placeTypes
          .filter((pt): pt is string => typeof pt === "string")
          .map(pt => placeTypeKey(pt))
          .filter(pt => pt !== ""),
      )]
      : [];
    // `visible` is retired as a user setting (superseded by the per-anchor `defaultHiddenGroupIds`
    // checklist) — it is always stored `true`. The legacy value survives only to seed the
    // `showOnMainMap` back-compat default for pre-`showOnMainMap` configs.
    const legacyVisible = value.visible !== false;
    const defaultHiddenGroupIds = Array.isArray(value.defaultHiddenGroupIds)
      ? [...new Set(
        value.defaultHiddenGroupIds.filter((gid): gid is string => typeof gid === "string" && gid.trim() !== ""),
      )]
      : [];
    const group: PlaceTypeLevelGroup = {
      id,
      name,
      placeTypes,
      displayMode,
      visible: true,
      // Absent → fall back to the legacy `visible` so existing configs keep the current main-map
      // appearance (before `showOnMainMap` existed, every visible group showed on the main map).
      showOnMainMap: typeof value.showOnMainMap === "boolean" ? value.showOnMainMap : legacyVisible,
      levelMode: normalizeLevelMode(value.levelMode),
      defaultHiddenGroupIds,
      sortOrder: typeof value.sortOrder === "number" && Number.isFinite(value.sortOrder)
        ? value.sortOrder
        : index,
      color: normalizeHexColor(value.color),
    };
    out.push(group);
  });
  return out;
}

/** Read the named place-type level groups (Settings → Locations + the map "Levels" overlay). */
export async function getPlaceTypeLevelGroups(): Promise<PlaceTypeLevelGroupConfig> {
  const [row] = await db
    .select({
      placeTypeLevelGroups: appSettings.placeTypeLevelGroups,
    })
    .from(appSettings)
    .where(eq(appSettings.id, ROW_ID));
  return normalizePlaceTypeLevelGroups(row?.placeTypeLevelGroups ?? []);
}

/** Replace the named place-type level groups, upserting the singleton. Returns the stored value. */
export async function updatePlaceTypeLevelGroups(
  input: PlaceTypeLevelGroupConfig,
): Promise<PlaceTypeLevelGroupConfig> {
  const next = normalizePlaceTypeLevelGroups(input);
  await db
    .insert(appSettings)
    .values({
      id: ROW_ID,
      shortenerIgnoreList: DEFAULT_SHORTENER_IGNORE_LIST,
      placeTypeLevelGroups: next,
    })
    .onConflictDoUpdate({
      target: appSettings.id,
      set: {
        placeTypeLevelGroups: next,
      },
    });
  return next;
}

/**
 * Sanitize the per-placeType map-pin icon overrides: keep only entries whose key normalizes to a
 * non-empty place-type key and whose value is a usable Lucide icon name. Tolerates arbitrary
 * client/stored shapes so a malformed jsonb row never crashes the map.
 */
export function normalizePlaceTypeIcons(input: unknown): PlaceTypeIconConfig {
  if (input === null || typeof input !== "object" || Array.isArray(input)) return {};
  const out: PlaceTypeIconConfig = {};
  for (const [rawKey, rawValue] of Object.entries(input as Record<string, unknown>)) {
    const key = placeTypeKey(rawKey);
    const icon = normalizeIconName(rawValue);
    if (key !== "" && icon) out[key] = icon;
  }
  return out;
}

/** Read the per-placeType map-pin icon overrides (Settings → Locations "Place Type Icons"). */
export async function getPlaceTypeIcons(): Promise<PlaceTypeIconConfig> {
  const [row] = await db
    .select({
      placeTypeIcons: appSettings.placeTypeIcons,
    })
    .from(appSettings)
    .where(eq(appSettings.id, ROW_ID));
  return normalizePlaceTypeIcons(row?.placeTypeIcons ?? {});
}

/** Replace the per-placeType map-pin icon overrides, upserting the singleton. Returns the stored value. */
export async function updatePlaceTypeIcons(
  input: PlaceTypeIconConfig,
): Promise<PlaceTypeIconConfig> {
  const next = normalizePlaceTypeIcons(input);
  await db
    .insert(appSettings)
    .values({
      id: ROW_ID,
      shortenerIgnoreList: DEFAULT_SHORTENER_IGNORE_LIST,
      placeTypeIcons: next,
    })
    .onConflictDoUpdate({
      target: appSettings.id,
      set: {
        placeTypeIcons: next,
      },
    });
  return next;
}

/**
 * Sanitize the per-placeType map color overrides: keep only entries whose key normalizes to a
 * non-empty place-type key and whose value is a valid `#rgb`/`#rrggbb` hex color. Tolerates arbitrary
 * client/stored shapes so a malformed jsonb row never crashes the map.
 */
export function normalizePlaceTypeColors(input: unknown): PlaceTypeColorConfig {
  if (input === null || typeof input !== "object" || Array.isArray(input)) return {};
  const out: PlaceTypeColorConfig = {};
  for (const [rawKey, rawValue] of Object.entries(input as Record<string, unknown>)) {
    const key = placeTypeKey(rawKey);
    const color = normalizeHexColor(rawValue);
    if (key !== "" && color) out[key] = color;
  }
  return out;
}

/** Read the per-placeType map color overrides (Settings → Locations "Pin Style"). */
export async function getPlaceTypeColors(): Promise<PlaceTypeColorConfig> {
  const [row] = await db
    .select({
      placeTypeColors: appSettings.placeTypeColors,
    })
    .from(appSettings)
    .where(eq(appSettings.id, ROW_ID));
  return normalizePlaceTypeColors(row?.placeTypeColors ?? {});
}

/** Replace the per-placeType map color overrides, upserting the singleton. Returns the stored value. */
export async function updatePlaceTypeColors(
  input: PlaceTypeColorConfig,
): Promise<PlaceTypeColorConfig> {
  const next = normalizePlaceTypeColors(input);
  await db
    .insert(appSettings)
    .values({
      id: ROW_ID,
      shortenerIgnoreList: DEFAULT_SHORTENER_IGNORE_LIST,
      placeTypeColors: next,
    })
    .onConflictDoUpdate({
      target: appSettings.id,
      set: {
        placeTypeColors: next,
      },
    });
  return next;
}

/**
 * Move a slug-keyed `Record` entry from `from` onto `to`, **only where `to` has no entry**, always
 * dropping `from`. Returns the new record, or `null` when `from` is absent (nothing to migrate). Pure —
 * shared by the display, icon, and color migrations and unit-tested directly.
 */
export function remapRecordKey<V>(
  record: Record<string, V>,
  from: string,
  to: string,
): Record<string, V> | null {
  if (!(from in record)) return null;
  const next = {
    ...record,
  };
  if (!(to in next)) next[to] = next[from];
  delete next[from];
  return next;
}

/**
 * Rewrite level-group membership, replacing place-type key `from` with `to` (deduped), dropping `from`.
 * Returns the new groups, or `null` when no group references `from`. Pure — unit-tested directly.
 */
export function remapLevelGroupMembers(
  groups: PlaceTypeLevelGroupConfig,
  from: string,
  to: string,
): PlaceTypeLevelGroupConfig | null {
  let touched = false;
  const next = groups.map((group) => {
    if (!group.placeTypes.includes(from)) return group;
    touched = true;
    const members = group.placeTypes.filter(pt => pt !== from);
    if (!members.includes(to)) members.push(to);
    return {
      ...group,
      placeTypes: members,
    };
  });
  return touched ? next : null;
}

/**
 * Migrate the slug-keyed map display config from a deleted place type onto a reassign target — moving
 * its `placeTypeDisplay` setting, `placeTypeIcons` glyph, and `placeTypeColors` color onto the target
 * **only where the target has none**, rewriting its `placeTypeLevelGroups` membership to the target,
 * and always dropping the old slug. Used by `deletePlaceType` when locations are reassigned, so the
 * carried-over look follows the relocated locations. No-op when `oldSlug === targetSlug` or either is
 * blank.
 */
export async function migratePlaceTypeConfig(oldSlug: string, targetSlug: string): Promise<void> {
  const from = placeTypeKey(oldSlug);
  const to = placeTypeKey(targetSlug);
  if (from === "" || to === "" || from === to) return;

  const nextDisplay = remapRecordKey(await getPlaceTypeDisplay(), from, to);
  if (nextDisplay) await updatePlaceTypeDisplay(nextDisplay);

  const nextIcons = remapRecordKey(await getPlaceTypeIcons(), from, to);
  if (nextIcons) await updatePlaceTypeIcons(nextIcons);

  const nextColors = remapRecordKey(await getPlaceTypeColors(), from, to);
  if (nextColors) await updatePlaceTypeColors(nextColors);

  const nextGroups = remapLevelGroupMembers(await getPlaceTypeLevelGroups(), from, to);
  if (nextGroups) await updatePlaceTypeLevelGroups(nextGroups);
}

/** Starter level-group buckets, covering {@link CANONICAL_PLACE_TYPE_ORDER} most-general → specific. */
const SEED_LEVEL_GROUP_BUCKETS: { id: string;
  name: string;
  placeTypes: string[]; }[] = [
  {
    id: "seed-country",
    name: "Country",
    placeTypes: ["continent", "country"],
  },
  {
    id: "seed-region",
    name: "Region",
    placeTypes: ["state", "region", "province", "state_district", "county"],
  },
  {
    id: "seed-locality",
    name: "Locality",
    placeTypes: ["municipality", "city", "borough", "town", "village", "hamlet"],
  },
  {
    id: "seed-neighborhood",
    name: "Neighborhood",
    placeTypes: ["suburb", "quarter", "neighbourhood", "city_block"],
  },
  {
    id: "seed-area",
    name: "Area",
    placeTypes: ["island", "islet", "locality"],
  },
];

/** Canonical rank for ordering a place type (unknowns sort last), used when seeding "Other". */
function canonicalRank(key: string): number {
  const index = CANONICAL_PLACE_TYPE_ORDER.indexOf(key as (typeof CANONICAL_PLACE_TYPE_ORDER)[number]);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

/**
 * Seed an initial set of named place-type level groups the first time (when the column is null) by
 * bucketing the place types discovered in the data (∪ any legacy per-placeType config) into a few
 * tiers (Country / Region / Locality / Neighborhood / Area), plus an "Other" group for anything
 * unrecognized. Carries over each member's legacy `visible`/`displayMode` where one was set. Idempotent
 * — skips once the column holds an array (even an empty one the user cleared), and writes nothing
 * until at least one place type exists, so it self-heals on a later boot.
 */
export async function ensureDefaultPlaceTypeLevelGroups(): Promise<void> {
  const [row] = await db
    .select({
      groups: appSettings.placeTypeLevelGroups,
    })
    .from(appSettings)
    .where(eq(appSettings.id, ROW_ID));
  // Only seed when never initialized (null); an explicit array (incl. []) means the user owns it.
  if (row && row.groups != null) return;

  const legacy = await getPlaceTypeDisplay();
  const distinctRows = await db
    .selectDistinct({
      placeType: locations.placeType,
    })
    .from(locations);
  const allKeys = new Set<string>(Object.keys(legacy));
  for (const r of distinctRows) {
    const key = placeTypeKey(r.placeType);
    if (key !== "") allKeys.add(key);
  }
  if (allKeys.size === 0) return; // no place types yet — try again on a later boot

  const assigned = new Set<string>();
  const groups: PlaceTypeLevelGroupConfig = [];
  let sortOrder = 0;
  for (const bucket of SEED_LEVEL_GROUP_BUCKETS) {
    const members = bucket.placeTypes.filter(pt => allKeys.has(pt));
    if (members.length === 0) continue;
    members.forEach(pt => assigned.add(pt));
    const configured = members.map(pt => legacy[pt]).filter(Boolean) as PlaceTypeDisplayConfig[string][];
    groups.push({
      id: bucket.id,
      name: bucket.name,
      placeTypes: members,
      displayMode: configured[0]?.displayMode ?? "area",
      visible: configured.length > 0 ? configured.some(setting => setting.visible) : true,
      sortOrder: sortOrder++,
    });
  }
  const others = [...allKeys]
    .filter(key => !assigned.has(key))
    .sort((a, b) => canonicalRank(a) - canonicalRank(b) || a.localeCompare(b));
  if (others.length > 0) {
    const configured = others.map(pt => legacy[pt]).filter(Boolean) as PlaceTypeDisplayConfig[string][];
    groups.push({
      id: "seed-other",
      name: "Other",
      placeTypes: others,
      displayMode: configured[0]?.displayMode ?? "area",
      visible: configured.length > 0 ? configured.some(setting => setting.visible) : true,
      sortOrder: sortOrder++,
    });
  }
  await updatePlaceTypeLevelGroups(groups);
}

/** Read the display/detail preferences (group C). */
export async function getDisplayPreferenceSettings(): Promise<DisplayPreferenceSettings> {
  const [row] = await db
    .select({
      bookmarkDetailImageSize: appSettings.bookmarkDetailImageSize,
      bookmarkDetailVideoSize: appSettings.bookmarkDetailVideoSize,
      bookmarkDetailLayout: appSettings.bookmarkDetailLayout,
      interfaceLanguage: appSettings.interfaceLanguage,
      filtersInDrawer: appSettings.filtersInDrawer,
      filtersHidden: appSettings.filtersHidden,
      panelPinned: appSettings.panelPinned,
      drawerUnpinnedBreakpoints: appSettings.drawerUnpinnedBreakpoints,
      croppedWidth: appSettings.croppedWidth,
      croppedHeight: appSettings.croppedHeight,
      customPropertyTypeIcons: appSettings.customPropertyTypeIcons,
      onDemandFilters: appSettings.onDemandFilters,
      hanScriptLanguage: appSettings.hanScriptLanguage,
      secondaryLanguageId: appSettings.secondaryLanguageId,
      minAreaPinThresholdKm2: appSettings.minAreaPinThresholdKm2,
      bookmarksPerPage: appSettings.bookmarksPerPage,
      mapPinScale: appSettings.mapPinScale,
      screenshotDefaultDelayMs: appSettings.screenshotDefaultDelayMs,
      screenshotDefaultWidth: appSettings.screenshotDefaultWidth,
      screenshotDefaultHeight: appSettings.screenshotDefaultHeight,
      screenshotDefaultScrollDistance: appSettings.screenshotDefaultScrollDistance,
    })
    .from(appSettings)
    .where(eq(appSettings.id, ROW_ID));
  if (!row) return DEFAULT_DISPLAY_PREFERENCES;
  return {
    bookmarkDetailImageSize: asImageSize(row.bookmarkDetailImageSize),
    bookmarkDetailVideoSize: asVideoSize(row.bookmarkDetailVideoSize),
    bookmarkDetailLayout: asDetailLayout(row.bookmarkDetailLayout),
    interfaceLanguage: asInterfaceLanguage(row.interfaceLanguage),
    filtersInDrawer: row.filtersInDrawer,
    filtersHidden: row.filtersHidden,
    panelPinned: row.panelPinned,
    drawerUnpinnedBreakpoints: asBreakpoints(row.drawerUnpinnedBreakpoints),
    croppedWidth: asCropped(row.croppedWidth, DEFAULT_DISPLAY_PREFERENCES.croppedWidth),
    croppedHeight: asCropped(row.croppedHeight, DEFAULT_DISPLAY_PREFERENCES.croppedHeight),
    customPropertyTypeIcons: (row.customPropertyTypeIcons as Partial<Record<string, string>> | null) ?? null,
    onDemandFilters: row.onDemandFilters ?? [],
    hanScriptLanguage: asHanScriptLanguage(row.hanScriptLanguage),
    secondaryLanguageId: row.secondaryLanguageId,
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
  };
}

/** Read the hosted-metadata connector settings, merging db values with env-var fallbacks. */
export async function getConnectorsSettings(): Promise<ConnectorsAppSettings> {
  const [row] = await db
    .select({
      hostedMetadataEndpoint: appSettings.hostedMetadataEndpoint,
      hostedMetadataApiKey: appSettings.hostedMetadataApiKey,
      hostedMetadataProvider: appSettings.hostedMetadataProvider,
      archiveBoxEndpoint: appSettings.archiveBoxEndpoint,
      kavitaEndpoint: appSettings.kavitaEndpoint,
      kavitaApiKey: appSettings.kavitaApiKey,
      plexEndpoint: appSettings.plexEndpoint,
      plexToken: appSettings.plexToken,
      youtubeApiKey: appSettings.youtubeApiKey,
      imageUrlBlacklist: appSettings.imageUrlBlacklist,
    })
    .from(appSettings)
    .where(eq(appSettings.id, ROW_ID));
  const endpoint = row?.hostedMetadataEndpoint ?? process.env.HOSTED_METADATA_ENDPOINT ?? "";
  const provider = row?.hostedMetadataProvider ?? process.env.HOSTED_METADATA_PROVIDER ?? "";
  const hasStoredKey = Boolean(row?.hostedMetadataApiKey);
  const hasEnvKey = Boolean(process.env.HOSTED_METADATA_API_KEY);
  return {
    hostedMetadataEndpoint: endpoint,
    hostedMetadataProvider: provider,
    hostedMetadataApiKeySet: hasStoredKey || hasEnvKey,
    encryptionEnabled: encryptionEnabled(),
    archiveBoxEndpoint: row?.archiveBoxEndpoint ?? process.env.ARCHIVEBOX_ENDPOINT ?? "",
    kavitaEndpoint: row?.kavitaEndpoint ?? process.env.KAVITA_ENDPOINT ?? "",
    kavitaApiKeySet: Boolean(row?.kavitaApiKey) || Boolean(process.env.KAVITA_API_KEY),
    plexEndpoint: row?.plexEndpoint ?? process.env.PLEX_ENDPOINT ?? "",
    plexTokenSet: Boolean(row?.plexToken) || Boolean(process.env.PLEX_TOKEN),
    youtubeApiKeySet: Boolean(row?.youtubeApiKey) || Boolean(process.env.YOUTUBE_API_KEY),
    imageUrlBlacklist: row?.imageUrlBlacklist ?? [],
  };
}

/** Read just the image-URL blacklist patterns (Settings → Connectors), or `[]` when unset/unavailable. */
export async function getImageUrlBlacklist(): Promise<string[]> {
  try {
    const [row] = await db
      .select({
        imageUrlBlacklist: appSettings.imageUrlBlacklist,
      })
      .from(appSettings)
      .where(eq(appSettings.id, ROW_ID));
    return row?.imageUrlBlacklist ?? [];
  }
  catch {
    // DB unavailable (e.g. test environment) — behave as no blacklist.
    return [];
  }
}

/**
 * Retrieve the decrypted API key for the hosted metadata provider. Checks the database first
 * (decrypting if encrypted), then falls back to the `HOSTED_METADATA_API_KEY` env var.
 */
export async function getDecryptedHostedApiKey(): Promise<string | null> {
  try {
    const [row] = await db
      .select({
        hostedMetadataApiKey: appSettings.hostedMetadataApiKey,
      })
      .from(appSettings)
      .where(eq(appSettings.id, ROW_ID));
    if (row?.hostedMetadataApiKey) {
      const decrypted = maybeDecrypt(row.hostedMetadataApiKey);
      if (decrypted) return decrypted;
    }
  }
  catch {
    // DB unavailable (e.g. test environment) — fall through to env var.
  }
  return process.env.HOSTED_METADATA_API_KEY ?? null;
}

/**
 * Get the active hosted metadata endpoint: database value wins over env var.
 * Returns null when neither is configured.
 */
export async function getActiveHostedEndpoint(): Promise<string | null> {
  try {
    const [row] = await db
      .select({
        hostedMetadataEndpoint: appSettings.hostedMetadataEndpoint,
      })
      .from(appSettings)
      .where(eq(appSettings.id, ROW_ID));
    return row?.hostedMetadataEndpoint || process.env.HOSTED_METADATA_ENDPOINT || null;
  }
  catch {
    return process.env.HOSTED_METADATA_ENDPOINT || null;
  }
}

/**
 * Get the active hosted metadata provider name: database value wins over env var.
 * Returns null when neither is configured.
 */
export async function getActiveHostedProvider(): Promise<string | null> {
  try {
    const [row] = await db
      .select({
        hostedMetadataProvider: appSettings.hostedMetadataProvider,
      })
      .from(appSettings)
      .where(eq(appSettings.id, ROW_ID));
    return row?.hostedMetadataProvider || process.env.HOSTED_METADATA_PROVIDER || null;
  }
  catch {
    return process.env.HOSTED_METADATA_PROVIDER || null;
  }
}

/**
 * Get the active ArchiveBox base URL: database value wins over env var.
 * Returns null when neither is configured.
 */
export async function getActiveArchiveBoxEndpoint(): Promise<string | null> {
  try {
    const [row] = await db
      .select({
        archiveBoxEndpoint: appSettings.archiveBoxEndpoint,
      })
      .from(appSettings)
      .where(eq(appSettings.id, ROW_ID));
    return row?.archiveBoxEndpoint || process.env.ARCHIVEBOX_ENDPOINT || null;
  }
  catch {
    return process.env.ARCHIVEBOX_ENDPOINT || null;
  }
}

/**
 * Get the active Kavita base URL: database value wins over env var.
 * Returns null when neither is configured.
 */
export async function getActiveKavitaEndpoint(): Promise<string | null> {
  try {
    const [row] = await db
      .select({
        kavitaEndpoint: appSettings.kavitaEndpoint,
      })
      .from(appSettings)
      .where(eq(appSettings.id, ROW_ID));
    return row?.kavitaEndpoint || process.env.KAVITA_ENDPOINT || null;
  }
  catch {
    return process.env.KAVITA_ENDPOINT || null;
  }
}

/**
 * Retrieve the decrypted Kavita API key. Checks the database first (decrypting if encrypted),
 * then falls back to the `KAVITA_API_KEY` env var.
 */
export async function getDecryptedKavitaApiKey(): Promise<string | null> {
  try {
    const [row] = await db
      .select({
        kavitaApiKey: appSettings.kavitaApiKey,
      })
      .from(appSettings)
      .where(eq(appSettings.id, ROW_ID));
    if (row?.kavitaApiKey) {
      const decrypted = maybeDecrypt(row.kavitaApiKey);
      if (decrypted) return decrypted;
    }
  }
  catch {
    // DB unavailable (e.g. test environment) — fall through to env var.
  }
  return process.env.KAVITA_API_KEY ?? null;
}

/**
 * Get the active Plex base URL: database value wins over env var.
 * Returns null when neither is configured.
 */
export async function getActivePlexEndpoint(): Promise<string | null> {
  try {
    const [row] = await db
      .select({
        plexEndpoint: appSettings.plexEndpoint,
      })
      .from(appSettings)
      .where(eq(appSettings.id, ROW_ID));
    return row?.plexEndpoint || process.env.PLEX_ENDPOINT || null;
  }
  catch {
    return process.env.PLEX_ENDPOINT || null;
  }
}

/**
 * Retrieve the decrypted Plex `X-Plex-Token`. Checks the database first (decrypting if encrypted),
 * then falls back to the `PLEX_TOKEN` env var.
 */
export async function getDecryptedPlexToken(): Promise<string | null> {
  try {
    const [row] = await db
      .select({
        plexToken: appSettings.plexToken,
      })
      .from(appSettings)
      .where(eq(appSettings.id, ROW_ID));
    if (row?.plexToken) {
      const decrypted = maybeDecrypt(row.plexToken);
      if (decrypted) return decrypted;
    }
  }
  catch {
    // DB unavailable (e.g. test environment) — fall through to env var.
  }
  return process.env.PLEX_TOKEN ?? null;
}

/**
 * Retrieve the decrypted YouTube Data API v3 key. Checks the database first (decrypting if
 * encrypted), then falls back to the `YOUTUBE_API_KEY` env var.
 */
export async function getDecryptedYoutubeApiKey(): Promise<string | null> {
  try {
    const [row] = await db
      .select({
        youtubeApiKey: appSettings.youtubeApiKey,
      })
      .from(appSettings)
      .where(eq(appSettings.id, ROW_ID));
    if (row?.youtubeApiKey) {
      const decrypted = maybeDecrypt(row.youtubeApiKey);
      if (decrypted) return decrypted;
    }
  }
  catch {
    // DB unavailable (e.g. test environment) — fall through to env var.
  }
  return process.env.YOUTUBE_API_KEY ?? null;
}

/** Replace the hosted-metadata connector settings, upserting the singleton. */
export async function updateConnectorsSettings(
  input: UpdateConnectorsSettingsInput,
): Promise<ConnectorsAppSettings> {
  // Base (non-secret) fields are always written; each API key is written only when its input is
  // non-null (null = leave the stored key unchanged; "" = clear; other values encrypt and store).
  const set: Partial<typeof appSettings.$inferInsert> = {
    hostedMetadataEndpoint: input.hostedMetadataEndpoint.trim(),
    hostedMetadataProvider: input.hostedMetadataProvider.trim(),
    archiveBoxEndpoint: input.archiveBoxEndpoint.trim(),
    kavitaEndpoint: input.kavitaEndpoint.trim(),
    plexEndpoint: input.plexEndpoint.trim(),
    // Normalize the blacklist: trim entries, drop blanks, dedupe — store a clean list.
    imageUrlBlacklist: [...new Set(input.imageUrlBlacklist.map(p => p.trim()).filter(Boolean))],
  };
  if (input.hostedMetadataApiKey !== null) {
    set.hostedMetadataApiKey = input.hostedMetadataApiKey.trim()
      ? maybeEncrypt(input.hostedMetadataApiKey.trim())
      : null;
  }
  if (input.kavitaApiKey !== null) {
    set.kavitaApiKey = input.kavitaApiKey.trim()
      ? maybeEncrypt(input.kavitaApiKey.trim())
      : null;
  }
  if (input.plexToken !== null) {
    set.plexToken = input.plexToken.trim()
      ? maybeEncrypt(input.plexToken.trim())
      : null;
  }
  if (input.youtubeApiKey !== null) {
    set.youtubeApiKey = input.youtubeApiKey.trim()
      ? maybeEncrypt(input.youtubeApiKey.trim())
      : null;
  }
  await db
    .insert(appSettings)
    .values({
      id: ROW_ID,
      ...set,
    })
    .onConflictDoUpdate({
      target: appSettings.id,
      set,
    });
  return getConnectorsSettings();
}

/** Replace the display/detail preferences, upserting the singleton. Returns the stored values. */
export async function updateDisplayPreferenceSettings(
  input: UpdateDisplayPreferenceInput,
): Promise<DisplayPreferenceSettings> {
  const next: DisplayPreferenceSettings = {
    bookmarkDetailImageSize: asImageSize(input.bookmarkDetailImageSize),
    bookmarkDetailVideoSize: asVideoSize(input.bookmarkDetailVideoSize),
    bookmarkDetailLayout: asDetailLayout(input.bookmarkDetailLayout),
    interfaceLanguage: asInterfaceLanguage(input.interfaceLanguage),
    filtersInDrawer: input.filtersInDrawer,
    filtersHidden: input.filtersHidden,
    panelPinned: input.panelPinned,
    drawerUnpinnedBreakpoints: asBreakpoints(input.drawerUnpinnedBreakpoints),
    croppedWidth: asCropped(input.croppedWidth, DEFAULT_DISPLAY_PREFERENCES.croppedWidth),
    croppedHeight: asCropped(input.croppedHeight, DEFAULT_DISPLAY_PREFERENCES.croppedHeight),
    customPropertyTypeIcons: input.customPropertyTypeIcons ?? null,
    onDemandFilters: [...(input.onDemandFilters ?? [])],
    hanScriptLanguage: asHanScriptLanguage(input.hanScriptLanguage),
    secondaryLanguageId: input.secondaryLanguageId ?? null,
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

/**
 * Sanitize a stored built-in-property-placement map: keep only string keys whose value is one of
 * {@link BOOKMARK_ADD_FORM_PLACEMENTS}, dropping anything else. Tolerates arbitrary/malformed jsonb
 * so a bad stored row never crashes the Add Bookmark form.
 */
export function asBookmarkAddFormPlacements(value: unknown): Record<string, BookmarkAddFormPlacement> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, BookmarkAddFormPlacement> = {};
  for (const [key, rawValue] of Object.entries(value as Record<string, unknown>)) {
    if (typeof key !== "string" || key === "") continue;
    const placement = BOOKMARK_ADD_FORM_PLACEMENTS.find(candidate => candidate === rawValue);
    if (!placement) continue;
    out[key] = placement;
  }
  return out;
}

/**
 * The nine standard fields that existed under the legacy `advancedFields`/`hiddenFields` array
 * model. A one-time back-compat read (below) derives an explicit placement for each of these from a
 * pre-existing saved row: absence from both legacy arrays meant "main area" (`default`) for these
 * fields, so we record that explicitly rather than letting the merge re-inherit their newer default.
 * Newer standard fields are intentionally absent here — they take their {@link
 * DEFAULT_BOOKMARK_ADD_FORM_SETTINGS} default (e.g. hidden) via the merge.
 */
const LEGACY_STANDARD_FIELDS = [
  "title",
  "romanizedTitle",
  "categoryId",
  "mediaTypeId",
  "languageId",
  "groupId",
  "descriptionTags",
  "personIds",
  "image",
] as const;

/**
 * Derive an explicit standard-field placement map from the legacy `advancedFields`/`hiddenFields`
 * arrays, reproducing the old membership semantics (`hidden` > `advanced` > `default`/main) for the
 * nine fields that model knew. Only the legacy fields are emitted; the merge over the defaults fills
 * in any newer field with its own default.
 */
function deriveStandardPlacementsFromLegacyArrays(
  advanced: string[] | null | undefined,
  hidden: string[] | null | undefined,
): Record<string, BookmarkAddFormPlacement> {
  const advancedSet = new Set(advanced ?? []);
  const hiddenSet = new Set(hidden ?? []);
  const derived: Record<string, BookmarkAddFormPlacement> = {};
  for (const field of LEGACY_STANDARD_FIELDS) {
    derived[field] = hiddenSet.has(field) ? "hidden" : advancedSet.has(field) ? "advanced" : "default";
  }
  return derived;
}

/**
 * Pure resolver behind {@link getBookmarkAddFormSettings}. Both placement maps are resolved as
 * `{ ...DEFAULT, ...stored }` so a key the user never touched inherits its default (a newly-added
 * standard field that defaults to hidden stays hidden for a row that predates it). Back-compat: when
 * the new `bookmarkFormStandardPlacements` column is absent but the legacy
 * `advancedFields`/`hiddenFields` arrays are present, the legacy arrays are derived into the map
 * once so an existing customized row keeps its choices for the original nine fields. Exported (rather
 * than only exercised through the DB-backed getter) so this merge logic is directly unit-testable.
 */
export function resolveBookmarkAddFormSettings(row?: {
  bookmarkFormAdvancedFields?: string[] | null;
  bookmarkFormHiddenFields?: string[] | null;
  bookmarkFormBuiltInPlacements?: Record<string, unknown> | null;
  bookmarkFormStandardPlacements?: Record<string, unknown> | null;
  bookmarkFormRevealAutofilledInMain?: boolean | null;
} | null): BookmarkAddFormSettings {
  if (!row) return DEFAULT_BOOKMARK_ADD_FORM_SETTINGS;
  const builtInPropertyPlacements = {
    ...DEFAULT_BOOKMARK_ADD_FORM_SETTINGS.builtInPropertyPlacements,
    ...asBookmarkAddFormPlacements(row.bookmarkFormBuiltInPlacements ?? {}),
  };
  // Prefer the new map column; fall back to deriving from the legacy arrays for pre-existing rows.
  const storedStandard = row.bookmarkFormStandardPlacements != null
    ? asBookmarkAddFormPlacements(row.bookmarkFormStandardPlacements)
    : (row.bookmarkFormAdvancedFields != null || row.bookmarkFormHiddenFields != null)
      ? deriveStandardPlacementsFromLegacyArrays(row.bookmarkFormAdvancedFields, row.bookmarkFormHiddenFields)
      : {};
  return {
    standardFieldPlacements: {
      ...DEFAULT_BOOKMARK_ADD_FORM_SETTINGS.standardFieldPlacements,
      ...storedStandard,
    },
    builtInPropertyPlacements,
    revealAutofilledInMain: row.bookmarkFormRevealAutofilledInMain ?? false,
  };
}

/** Read the Add Bookmark form field-placement settings (Settings → Display → Add Bookmark Form). */
export async function getBookmarkAddFormSettings(): Promise<BookmarkAddFormSettings> {
  const [row] = await db
    .select({
      bookmarkFormAdvancedFields: appSettings.bookmarkFormAdvancedFields,
      bookmarkFormHiddenFields: appSettings.bookmarkFormHiddenFields,
      bookmarkFormBuiltInPlacements: appSettings.bookmarkFormBuiltInPlacements,
      bookmarkFormStandardPlacements: appSettings.bookmarkFormStandardPlacements,
      bookmarkFormRevealAutofilledInMain: appSettings.bookmarkFormRevealAutofilledInMain,
    })
    .from(appSettings)
    .where(eq(appSettings.id, ROW_ID));
  return resolveBookmarkAddFormSettings(row);
}

/** Replace the Add Bookmark form field-placement settings, upserting the singleton. Returns the stored values. */
export async function updateBookmarkAddFormSettings(
  input: UpdateBookmarkAddFormInput,
): Promise<BookmarkAddFormSettings> {
  const next = {
    bookmarkFormStandardPlacements: asBookmarkAddFormPlacements(input.standardFieldPlacements),
    bookmarkFormBuiltInPlacements: asBookmarkAddFormPlacements(input.builtInPropertyPlacements),
    bookmarkFormRevealAutofilledInMain: input.revealAutofilledInMain ?? false,
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
  return resolveBookmarkAddFormSettings(next);
}
