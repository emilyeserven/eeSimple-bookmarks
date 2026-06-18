import { eq } from "drizzle-orm";
import type {
  AppSettings,
  HomepageContentSettings,
  HomepageContentWidth,
  QuickAddDisplay,
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
    })
    .onConflictDoNothing({
      target: appSettings.id,
    });
}

/** Read the full settings singleton, falling back to defaults when the row is somehow absent. */
export async function getAppSettings(): Promise<AppSettings> {
  const [row] = await db.select().from(appSettings).where(eq(appSettings.id, ROW_ID));
  return {
    shortenerIgnoreList: row?.shortenerIgnoreList ?? [],
    homepageText: row?.homepageText ?? DEFAULT_HOMEPAGE_CONTENT.homepageText,
    homepageTextWidth: asWidth(row?.homepageTextWidth),
    bookmarkQuickAddEnabled: row?.bookmarkQuickAddEnabled
      ?? DEFAULT_HOMEPAGE_CONTENT.bookmarkQuickAddEnabled,
    bookmarkQuickAddWidth: asWidth(row?.bookmarkQuickAddWidth),
    bookmarkQuickAddDisplay: asQuickAddDisplay(row?.bookmarkQuickAddDisplay),
    homepageHeaderHidden: row?.homepageHeaderHidden ?? false,
  };
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
