import { eq } from "drizzle-orm";
import type { ConnectorsAppSettings, UpdateConnectorsSettingsInput } from "@eesimple/types";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { encryptionEnabled, maybeDecrypt, maybeEncrypt } from "@/utils/crypto";
import { ROW_ID } from "./appSettingsShared";

/** Read the hosted-metadata connector settings, merging db values with env-var fallbacks. */
export async function getConnectorsSettings(): Promise<ConnectorsAppSettings> {
  const [row] = await db
    .select({
      hostedMetadataEndpoint: appSettings.hostedMetadataEndpoint,
      hostedMetadataApiKey: appSettings.hostedMetadataApiKey,
      hostedMetadataProvider: appSettings.hostedMetadataProvider,
      archiveBoxEndpoint: appSettings.archiveBoxEndpoint,
      kavitaEndpoint: appSettings.kavitaEndpoint,
      kavitaSidebarUrl: appSettings.kavitaSidebarUrl,
      kavitaApiKey: appSettings.kavitaApiKey,
      plexEndpoint: appSettings.plexEndpoint,
      plexToken: appSettings.plexToken,
      youtubeApiKey: appSettings.youtubeApiKey,
      imageUrlBlacklist: appSettings.imageUrlBlacklist,
      useNoCookieYoutubeEmbeds: appSettings.useNoCookieYoutubeEmbeds,
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
    kavitaSidebarUrl: row?.kavitaSidebarUrl ?? "",
    kavitaApiKeySet: Boolean(row?.kavitaApiKey) || Boolean(process.env.KAVITA_API_KEY),
    plexEndpoint: row?.plexEndpoint ?? process.env.PLEX_ENDPOINT ?? "",
    plexTokenSet: Boolean(row?.plexToken) || Boolean(process.env.PLEX_TOKEN),
    youtubeApiKeySet: Boolean(row?.youtubeApiKey) || Boolean(process.env.YOUTUBE_API_KEY),
    imageUrlBlacklist: row?.imageUrlBlacklist ?? [],
    useNoCookieYoutubeEmbeds: row?.useNoCookieYoutubeEmbeds ?? true,
  };
}

/** Whether YouTube embeds should use the privacy-enhanced `youtube-nocookie.com` host. Defaults to `true`. */
export async function getYoutubeEmbedUsesNoCookie(): Promise<boolean> {
  try {
    const [row] = await db
      .select({
        useNoCookieYoutubeEmbeds: appSettings.useNoCookieYoutubeEmbeds,
      })
      .from(appSettings)
      .where(eq(appSettings.id, ROW_ID));
    return row?.useNoCookieYoutubeEmbeds ?? true;
  }
  catch {
    // DB unavailable (e.g. test environment) — default to the privacy-enhanced host.
    return true;
  }
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
 * Get the browser-facing URL for the sidebar's Kavita link-out, or `null` when unset. This is a
 * display-only override (Settings → Connectors) for when a person's browser reaches Kavita at a
 * different address than the middleware container does; it never affects the server-side connector,
 * so it has no env-var fallback. Callers fall back to {@link getActiveKavitaEndpoint} when null.
 */
export async function getActiveKavitaSidebarUrl(): Promise<string | null> {
  try {
    const [row] = await db
      .select({
        kavitaSidebarUrl: appSettings.kavitaSidebarUrl,
      })
      .from(appSettings)
      .where(eq(appSettings.id, ROW_ID));
    return row?.kavitaSidebarUrl || null;
  }
  catch {
    return null;
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
    kavitaSidebarUrl: input.kavitaSidebarUrl.trim(),
    plexEndpoint: input.plexEndpoint.trim(),
    // Normalize the blacklist: trim entries, drop blanks, dedupe — store a clean list.
    imageUrlBlacklist: [...new Set(input.imageUrlBlacklist.map(p => p.trim()).filter(Boolean))],
    useNoCookieYoutubeEmbeds: input.useNoCookieYoutubeEmbeds,
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
