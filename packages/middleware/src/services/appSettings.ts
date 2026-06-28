import { eq } from "drizzle-orm";
import type {
  AdvancedSettings,
  AiSummarizationSettings,
  AutomationSettings,
  BookmarkDetailImageSize,
  BookmarkDetailLayout,
  BookmarkDetailVideoSize,
  ConnectorsAppSettings,
  DisplayPreferenceSettings,
  HomepageContentSettings,
  HomepageContentWidth,
  ImportBlacklistEntry,
  QuickAddDisplay,
  SidebarCustomizationSettings,
  SidebarOpenModifier,
  UpdateAdvancedSettingsInput,
  UpdateAiSummarizationInput,
  UpdateAutomationInput,
  UpdateConnectorsSettingsInput,
  UpdateDisplayPreferenceInput,
  UpdateHomepageContentInput,
  UpdateSidebarCustomizationInput,
} from "@eesimple/types";
import { normalizeBlacklist } from "@eesimple/types";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
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
};

/** Default automation settings (auto-fetch on, Alt modifier), used when seeding / when row absent. */
const DEFAULT_AUTOMATION: AutomationSettings = {
  autoFetchTitle: true,
  autoFetchImage: true,
  autoApplyTitleTags: false,
  sidebarOpenModifier: "alt",
};

/** Default AI summarization settings (empty prompt), used when seeding / when row absent. */
const DEFAULT_AI_SUMMARIZATION: AiSummarizationSettings = {
  aiSummarizationPrompt: "",
};

/** Default display/detail preferences, used when seeding / when row absent. */
const DEFAULT_DISPLAY_PREFERENCES: DisplayPreferenceSettings = {
  bookmarkDetailImageSize: "medium",
  bookmarkDetailVideoSize: "standard",
  bookmarkDetailLayout: "single",
  customPropertyTypeIcons: null,
  filtersInDrawer: false,
  filtersHidden: false,
  panelPinned: false,
  drawerUnpinnedBreakpoints: [768],
  croppedWidth: 16,
  croppedHeight: 9,
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

/** Clamp a stored cropped dimension to a positive integer (mirrors the old client setter). */
function asCropped(value: number | null | undefined, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(1, Math.round(value));
}

/** Coerce breakpoints to a deduped, sorted array of positive integers. */
function asBreakpoints(value: number[] | null | undefined): number[] {
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
      sidebarOpenModifier: appSettings.sidebarOpenModifier,
    })
    .from(appSettings)
    .where(eq(appSettings.id, ROW_ID));
  if (!row) return DEFAULT_AUTOMATION;
  return {
    autoFetchTitle: row.autoFetchTitle,
    autoFetchImage: row.autoFetchImage,
    autoApplyTitleTags: row.autoApplyTitleTags,
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

/** Read the display/detail preferences (group C). */
export async function getDisplayPreferenceSettings(): Promise<DisplayPreferenceSettings> {
  const [row] = await db
    .select({
      bookmarkDetailImageSize: appSettings.bookmarkDetailImageSize,
      bookmarkDetailVideoSize: appSettings.bookmarkDetailVideoSize,
      bookmarkDetailLayout: appSettings.bookmarkDetailLayout,
      filtersInDrawer: appSettings.filtersInDrawer,
      filtersHidden: appSettings.filtersHidden,
      panelPinned: appSettings.panelPinned,
      drawerUnpinnedBreakpoints: appSettings.drawerUnpinnedBreakpoints,
      croppedWidth: appSettings.croppedWidth,
      croppedHeight: appSettings.croppedHeight,
      customPropertyTypeIcons: appSettings.customPropertyTypeIcons,
    })
    .from(appSettings)
    .where(eq(appSettings.id, ROW_ID));
  if (!row) return DEFAULT_DISPLAY_PREFERENCES;
  return {
    bookmarkDetailImageSize: asImageSize(row.bookmarkDetailImageSize),
    bookmarkDetailVideoSize: asVideoSize(row.bookmarkDetailVideoSize),
    bookmarkDetailLayout: asDetailLayout(row.bookmarkDetailLayout),
    filtersInDrawer: row.filtersInDrawer,
    filtersHidden: row.filtersHidden,
    panelPinned: row.panelPinned,
    drawerUnpinnedBreakpoints: asBreakpoints(row.drawerUnpinnedBreakpoints),
    croppedWidth: asCropped(row.croppedWidth, DEFAULT_DISPLAY_PREFERENCES.croppedWidth),
    croppedHeight: asCropped(row.croppedHeight, DEFAULT_DISPLAY_PREFERENCES.croppedHeight),
    customPropertyTypeIcons: (row.customPropertyTypeIcons as Partial<Record<string, string>> | null) ?? null,
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
  };
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

/** Replace the hosted-metadata connector settings, upserting the singleton. */
export async function updateConnectorsSettings(
  input: UpdateConnectorsSettingsInput,
): Promise<ConnectorsAppSettings> {
  const endpoint = input.hostedMetadataEndpoint.trim();
  const provider = input.hostedMetadataProvider.trim();
  const archiveBoxEndpoint = input.archiveBoxEndpoint.trim();
  if (input.hostedMetadataApiKey === null) {
    // null = leave any existing API key unchanged; only update endpoint/provider.
    await db
      .insert(appSettings)
      .values({
        id: ROW_ID,
        hostedMetadataEndpoint: endpoint,
        hostedMetadataProvider: provider,
        archiveBoxEndpoint,
      })
      .onConflictDoUpdate({
        target: appSettings.id,
        set: {
          hostedMetadataEndpoint: endpoint,
          hostedMetadataProvider: provider,
          archiveBoxEndpoint,
        },
      });
  }
  else {
    // "" = clear the stored key; any other value = encrypt and store.
    const apiKeyToStore = input.hostedMetadataApiKey.trim()
      ? maybeEncrypt(input.hostedMetadataApiKey.trim())
      : null;
    await db
      .insert(appSettings)
      .values({
        id: ROW_ID,
        hostedMetadataEndpoint: endpoint,
        hostedMetadataProvider: provider,
        hostedMetadataApiKey: apiKeyToStore,
        archiveBoxEndpoint,
      })
      .onConflictDoUpdate({
        target: appSettings.id,
        set: {
          hostedMetadataEndpoint: endpoint,
          hostedMetadataProvider: provider,
          hostedMetadataApiKey: apiKeyToStore,
          archiveBoxEndpoint,
        },
      });
  }
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
    filtersInDrawer: input.filtersInDrawer,
    filtersHidden: input.filtersHidden,
    panelPinned: input.panelPinned,
    drawerUnpinnedBreakpoints: asBreakpoints(input.drawerUnpinnedBreakpoints),
    croppedWidth: asCropped(input.croppedWidth, DEFAULT_DISPLAY_PREFERENCES.croppedWidth),
    croppedHeight: asCropped(input.croppedHeight, DEFAULT_DISPLAY_PREFERENCES.croppedHeight),
    customPropertyTypeIcons: input.customPropertyTypeIcons ?? null,
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
