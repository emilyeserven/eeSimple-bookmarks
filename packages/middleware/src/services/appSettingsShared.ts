import { eq } from "drizzle-orm";
import type {
  AdvancedSettings,
  AiAutotagSettings,
  AiSummarizationSettings,
  BookmarkAiUpdateSettings,
  TagReparentSettings,
  AutomationSettings,
  BookmarkDetailImageSize,
  BookmarkDetailLayout,
  BookmarkDetailVideoSize,
  BookmarkGraphSettings,
  BookmarkGraphWeight,
  BookmarkGraphWeights,
  DisplayPreferenceSettings,
  HomepageContentSettings,
  HomepageContentWidth,
  InterfaceLanguage,
  PersonSourceLabelSettings,
  QuickAddDisplay,
  ScratchpadSettings,
  SidebarCustomizationSettings,
  SidebarOpenModifier,
} from "@eesimple/types";
import { DEFAULT_BOOKMARK_GRAPH_SETTINGS, DEFAULT_BOOKMARKS_PER_PAGE, DEFAULT_HOMEPAGE_WIDGET_ORDER, DEFAULT_PERSON_SOURCE_LABEL_SETTINGS, MAP_PIN_SCALE_DEFAULT, MAP_PIN_SCALE_MAX, MAP_PIN_SCALE_MIN } from "@eesimple/types";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { MAX_IMAGE_EDGE } from "@/utils/image";

/** The app-settings singleton always lives at row id = 1, mirroring `homepage_filter`. */
export const ROW_ID = 1;

/**
 * Default generic URL-shortener domains. These can't be expanded to a specific vendor, so the
 * add-bookmark form nudges the user to paste the full link instead.
 */
export const DEFAULT_SHORTENER_IGNORE_LIST = [
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
export const DEFAULT_HOMEPAGE_CONTENT: HomepageContentSettings = {
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
export const DEFAULT_ADVANCED_SETTINGS: AdvancedSettings = {
  coolifyLinkEnabled: false,
  coolifyUrl: "",
  docsLinkEnabled: false,
  storybookLinkEnabled: false,
  drizzleGatewayLinkEnabled: false,
  drizzleGatewayUrl: "",
  githubLinkEnabled: false,
};

/** Default sidebar-customization settings (nothing hidden), used when seeding / when row absent. */
export const DEFAULT_SIDEBAR_CUSTOMIZATION: SidebarCustomizationSettings = {
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
export const DEFAULT_AUTOMATION: AutomationSettings = {
  autoFetchTitle: true,
  autoFetchImage: true,
  autoApplyTitleTags: false,
  autoApplyTitleLocations: false,
  shareBypassInbox: false,
  sidebarOpenModifier: "alt",
  defaultCategoryId: null,
};

/** Default Bookmark Graph relatedness settings, used when seeding / when row absent. */
export const DEFAULT_BOOKMARK_GRAPH: BookmarkGraphSettings = DEFAULT_BOOKMARK_GRAPH_SETTINGS;

/** Clamp an arbitrary stored value to a relatedness weight (0–3), defaulting to `fallback`. */
export function asGraphWeight(value: unknown, fallback: BookmarkGraphWeight): BookmarkGraphWeight {
  return value === 0 || value === 1 || value === 2 || value === 3 ? value : fallback;
}

/**
 * Coerce an arbitrary stored jsonb blob into valid {@link BookmarkGraphSettings}: clamp each weight
 * to 0–3, clamp `maxRelated` to 1–100, and merge over the defaults so a partial/legacy row is safe.
 */
export function resolveBookmarkGraph(raw: unknown): BookmarkGraphSettings {
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
    showSecondLayer: typeof stored.showSecondLayer === "boolean"
      ? stored.showSecondLayer
      : DEFAULT_BOOKMARK_GRAPH.showSecondLayer,
  };
}

/** Default person source-label settings ("website" / "biography"), used when seeding / when row absent. */
export const DEFAULT_PERSON_SOURCE_LABELS: PersonSourceLabelSettings = DEFAULT_PERSON_SOURCE_LABEL_SETTINGS;

/**
 * Coerce an arbitrary stored jsonb blob into valid {@link PersonSourceLabelSettings}: fall back to
 * the default for each field when the stored value is missing, not a string, or blank after trim
 * (an empty label would match nothing, which is never useful), merging over the defaults so a
 * partial/legacy row is safe.
 */
export function resolvePersonSourceLabels(raw: unknown): PersonSourceLabelSettings {
  const stored = (raw ?? {}) as Partial<PersonSourceLabelSettings>;
  const websiteLabel = typeof stored.websiteLabel === "string" && stored.websiteLabel.trim()
    ? stored.websiteLabel
    : DEFAULT_PERSON_SOURCE_LABELS.websiteLabel;
  const biographyLabel = typeof stored.biographyLabel === "string" && stored.biographyLabel.trim()
    ? stored.biographyLabel
    : DEFAULT_PERSON_SOURCE_LABELS.biographyLabel;
  return {
    websiteLabel,
    biographyLabel,
  };
}

/** Default AI summarization settings (empty prompt), used when seeding / when row absent. */
export const DEFAULT_AI_SUMMARIZATION: AiSummarizationSettings = {
  aiSummarizationPrompt: "",
  aiSummarizationSuggestTags: false,
};

/** Default Scratchpad settings (empty note), used when seeding / when row absent. */
export const DEFAULT_SCRATCHPAD: ScratchpadSettings = {
  scratchpadText: "",
};

/** Default AI autotag settings (empty prompt), used when seeding / when row absent. */
export const DEFAULT_AI_AUTOTAG: AiAutotagSettings = {
  aiAutotagPrompt: "",
  aiAutotagIncludeExistingTags: false,
};

/** Default tag reparent settings (empty prompt), used when the row/column is absent. */
export const DEFAULT_TAG_REPARENT: TagReparentSettings = {
  tagReparentPrompt: "",
};

/** Default bookmark AI-update settings (empty prompt template), used when the row/column is absent. */
export const DEFAULT_BOOKMARK_AI_UPDATE: BookmarkAiUpdateSettings = {
  bookmarkAiUpdatePrompt: "",
};

/** Default display/detail preferences, used when seeding / when row absent. */
export const DEFAULT_DISPLAY_PREFERENCES: DisplayPreferenceSettings = {
  bookmarkDetailImageSize: "medium",
  bookmarkDetailVideoSize: "standard",
  bookmarkDetailLayout: "single",
  bookmarkCardThumbnailSize: "medium",
  interfaceLanguage: "en",
  customPropertyTypeIcons: null,
  onDemandFilters: [],
  filterOrder: [],
  mobileHiddenFilters: [],
  defaultBookmarkSort: null,
  searchBoxPinned: false,
  panelPinned: false,
  drawerUnpinnedBreakpoints: [768],
  croppedWidth: 16,
  croppedHeight: 9,
  hanScriptLanguage: "ja",
  secondaryLanguageId: null,
  fallbackLanguageId: null,
  minAreaPinThresholdKm2: 0,
  bookmarksPerPage: DEFAULT_BOOKMARKS_PER_PAGE,
  mapPinScale: MAP_PIN_SCALE_DEFAULT,
  screenshotDefaultDelayMs: 0,
  screenshotDefaultWidth: 1280,
  screenshotDefaultHeight: 720,
  screenshotDefaultScrollDistance: 0,
  maxImageEdge: MAX_IMAGE_EDGE,
  imageQuality: 80,
};

/** Coerce a stored width string to the typed union, defaulting to "full". */
export function asWidth(value: string | null | undefined): HomepageContentWidth {
  return value === "half" ? "half" : "full";
}

/** Coerce a stored display string to the typed union, defaulting to "collapsible". */
export function asQuickAddDisplay(value: string | null | undefined): QuickAddDisplay {
  return value === "expanded" ? "expanded" : "collapsible";
}

/** Coerce a stored modifier string to the typed union, defaulting to "alt". */
export function asModifier(value: string | null | undefined): SidebarOpenModifier {
  return value === "ctrl" || value === "shift" || value === "meta" ? value : "alt";
}

/** Coerce a stored detail-image-size string to the typed union, defaulting to "medium". */
export function asImageSize(value: string | null | undefined): BookmarkDetailImageSize {
  return value === "small" || value === "large" ? value : "medium";
}

/** Coerce a stored detail-video-size string to the typed union, defaulting to "standard". */
export function asVideoSize(value: string | null | undefined): BookmarkDetailVideoSize {
  return value === "half" || value === "twoThirds" || value === "fullwidth" ? value : "standard";
}

/** Coerce a stored detail-layout string to the typed union, defaulting to "single". */
export function asDetailLayout(value: string | null | undefined): BookmarkDetailLayout {
  return value === "tabbed" ? "tabbed" : "single";
}

/** Coerce a stored interface-language string to the typed union, defaulting to "en". */
export function asInterfaceLanguage(value: string | null | undefined): InterfaceLanguage {
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
      personSourceLabels: DEFAULT_PERSON_SOURCE_LABELS,
    })
    .onConflictDoNothing({
      target: appSettings.id,
    });
}
