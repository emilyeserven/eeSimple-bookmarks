import { eq } from "drizzle-orm";
import type { ImportBlacklistEntry } from "@eesimple/types";
import { normalizeBlacklist } from "@eesimple/types";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { DEFAULT_SHORTENER_IGNORE_LIST, ROW_ID } from "./appSettingsShared";

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
