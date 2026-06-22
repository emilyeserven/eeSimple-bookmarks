import { eq } from "drizzle-orm";
import type {
  AdvancedSettings,
  HomepageContentSettings,
  HomepageContentWidth,
  QuickAddDisplay,
  UpdateAdvancedSettingsInput,
  UpdateHomepageContentInput,
} from "@eesimple/types";
import { db } from "@/db";
import { appSettings } from "@/db/schema";

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
};

/** Coerce a stored width string to the typed union, defaulting to "full". */
function asWidth(value: string | null | undefined): HomepageContentWidth {
  return value === "half" ? "half" : "full";
}

/** Coerce a stored display string to the typed union, defaulting to "collapsible". */
function asQuickAddDisplay(value: string | null | undefined): QuickAddDisplay {
  return value === "expanded" ? "expanded" : "collapsible";
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

/** Read the opt-in Advanced sidebar-link settings (Coolify, docs, Storybook). */
export async function getAdvancedSettings(): Promise<AdvancedSettings> {
  const [row] = await db
    .select({
      coolifyLinkEnabled: appSettings.coolifyLinkEnabled,
      coolifyUrl: appSettings.coolifyUrl,
      docsLinkEnabled: appSettings.docsLinkEnabled,
      storybookLinkEnabled: appSettings.storybookLinkEnabled,
    })
    .from(appSettings)
    .where(eq(appSettings.id, ROW_ID));
  if (!row) return DEFAULT_ADVANCED_SETTINGS;
  return {
    coolifyLinkEnabled: row.coolifyLinkEnabled,
    coolifyUrl: row.coolifyUrl,
    docsLinkEnabled: row.docsLinkEnabled,
    storybookLinkEnabled: row.storybookLinkEnabled,
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
