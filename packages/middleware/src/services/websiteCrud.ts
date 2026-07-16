import { asc, eq, inArray } from "drizzle-orm";
import type { BulkBookmarkResult, BulkDeleteResult, CreateWebsiteInput, ExtensionFillRuleGroup, LabeledWebsite, SocialLink, UpdateWebsiteInput, Website, WebsiteExtensionFillRule, WebsiteNode, WebsiteScanObservation } from "@eesimple/types";
import { getShortenerIgnoreList } from "@/services/appSettings";
import { invalidateBookmarkCache } from "@/services/bookmarkCacheVersion";
import { bulkDeleteEntities } from "@/services/bulkDelete";
import { db } from "@/db";
import { deleteTaxonomyAssignmentsForOwner } from "@/services/taxonomyAssignments";
import { deleteLanguageUsagesForOwner } from "@/services/languageUsages";
import { bookmarks, categories, websiteFavicons, websiteTags, websites, websiteYoutubeChannels, type WebsiteRow } from "@/db/schema";
import { buildStringMap } from "@/utils/mapUtils";
import { slugify } from "@/utils/slug";
import { builtInWebsiteRenamedOrMoved, buildWebsiteScalarPatch, normalizeWebsiteDomain } from "@/services/websiteUpdate";
import { ensureWebsiteForUrl } from "@/services/websiteScan";
import {
  BuiltInWebsiteError,
  buildWebsiteTree,
  DuplicateDomainError,
  faviconUrlFrom,
  InvalidDomainError,
  matchesAnyDomain,
  normalizeDomain,
  slugFromDomain,
  takenWebsiteSlugs,
  type Tx,
  uniqueWebsiteSlug,
  websiteSelect,
} from "@/services/websiteHelpers";

/** Load default tag ids for a set of website ids as a map of id → string[]. */
async function loadWebsiteTagsMap(websiteIds: string[]): Promise<Map<string, string[]>> {
  if (websiteIds.length === 0) return new Map();
  const rows = await db
    .select({
      websiteId: websiteTags.websiteId,
      tagId: websiteTags.tagId,
    })
    .from(websiteTags)
    .where(inArray(websiteTags.websiteId, websiteIds));
  return buildStringMap(rows, r => r.websiteId, r => r.tagId);
}

/** Replace the full set of default tags for a website (delete-then-insert). */
async function setWebsiteTags(
  txOrDb: Tx | typeof db,
  websiteId: string,
  tagIds: string[],
): Promise<void> {
  await txOrDb.delete(websiteTags).where(eq(websiteTags.websiteId, websiteId));
  if (tagIds.length > 0) {
    await txOrDb.insert(websiteTags).values(tagIds.map(tagId => ({
      websiteId,
      tagId,
    })));
  }
}

/** Load associated YouTube channel ids for a set of website ids as a map of id → string[]. */
async function loadWebsiteChannelsMap(websiteIds: string[]): Promise<Map<string, string[]>> {
  if (websiteIds.length === 0) return new Map();
  const rows = await db
    .select({
      websiteId: websiteYoutubeChannels.websiteId,
      channelId: websiteYoutubeChannels.channelId,
    })
    .from(websiteYoutubeChannels)
    .where(inArray(websiteYoutubeChannels.websiteId, websiteIds));
  return buildStringMap(rows, r => r.websiteId, r => r.channelId);
}

/** Replace the full set of associated YouTube channels for a website (delete-then-insert). */
async function setWebsiteChannels(
  txOrDb: Tx | typeof db,
  websiteId: string,
  channelIds: string[],
): Promise<void> {
  await txOrDb.delete(websiteYoutubeChannels).where(eq(websiteYoutubeChannels.websiteId, websiteId));
  if (channelIds.length > 0) {
    await txOrDb.insert(websiteYoutubeChannels).values(channelIds.map(channelId => ({
      websiteId,
      channelId,
    })));
  }
}

/** Map a DB row to the shared `Website` wire type. */
function toWebsite(
  row: WebsiteRow & {
    bookmarkCount?: number;
    faviconCreatedAt?: Date | string | null;
    categoryName?: string | null;
    categorySlug?: string | null;
    categoryIcon?: string | null;
  },
  tagIds: string[] = [],
  youtubeChannelIds: string[] = [],
): Website {
  return {
    id: row.id,
    domain: row.domain,
    siteName: row.siteName,
    slug: row.slug ?? slugFromDomain(row.domain),
    description: row.description,
    builtIn: row.builtIn,
    isFavorite: row.isFavorite,
    shortenedLinks: row.shortenedLinks,
    paramRules: row.paramRules,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    bookmarkCount: row.bookmarkCount,
    imageUrl: faviconUrlFrom(row.id, row.faviconCreatedAt ?? null),
    faviconAutoGrabError: (row.faviconAutoGrabError as "no_image" | "bad_image" | "blocked" | "server_error" | "fetch_error" | null) ?? null,
    category: row.categoryId && row.categoryName
      ? {
        id: row.categoryId,
        name: row.categoryName,
        slug: row.categorySlug ?? slugify(row.categoryName),
        icon: row.categoryIcon ?? null,
      }
      : null,
    tagIds,
    mediaTypeId: row.mediaTypeId ?? null,
    socialLinks: (row.socialLinks as SocialLink[] | null) ?? [],
    labeledWebsites: (row.labeledWebsites as LabeledWebsite[] | null) ?? [],
    youtubeChannelIds,
    alternateNames: (row.alternateNames as string[] | null) ?? [],
    extensionFillRules: (row.extensionFillRules as WebsiteExtensionFillRule[] | null) ?? [],
    extensionFillRuleGroups: (row.extensionFillRuleGroups as ExtensionFillRuleGroup[] | null) ?? [],
    scanObservations: (row.scanObservations as WebsiteScanObservation[] | null) ?? [],
    redirectResolutionFailure: row.redirectResolutionFailure ?? false,
    scanUrlForIsbn: row.scanUrlForIsbn ?? false,
  };
}

/** Shared query builder for single-website lookups (joins favicon + category rows). */
function websiteBaseQuery() {
  return db
    .select(websiteSelect)
    .from(websites)
    .leftJoin(websiteFavicons, eq(websiteFavicons.websiteId, websites.id))
    .leftJoin(categories, eq(categories.id, websites.categoryId));
}

/** List all websites, ordered by site name. */
/** Compact `{id, name}` list (name = site name) for extension-fill relation match-or-create. */
export async function listWebsitesCompact(): Promise<{ id: string;
  name: string; }[]> {
  return db
    .select({
      id: websites.id,
      name: websites.siteName,
    })
    .from(websites);
}

export async function listWebsites(): Promise<Website[]> {
  const rows = await db
    .select({
      ...websiteSelect,
      bookmarkCount: db.$count(bookmarks, eq(bookmarks.websiteId, websites.id)),
    })
    .from(websites)
    .leftJoin(websiteFavicons, eq(websiteFavicons.websiteId, websites.id))
    .leftJoin(categories, eq(categories.id, websites.categoryId))
    .orderBy(asc(websites.siteName));
  const ids = rows.map(r => r.id);
  const [tagsMap, channelsMap] = await Promise.all([
    loadWebsiteTagsMap(ids),
    loadWebsiteChannelsMap(ids),
  ]);
  return rows.map(row => toWebsite(row, tagsMap.get(row.id) ?? [], channelsMap.get(row.id) ?? []));
}

export async function getWebsiteTree(): Promise<WebsiteNode[]> {
  return buildWebsiteTree(await listWebsites());
}

/** Fetch a single website by id, or `null` when absent. */
export async function getWebsite(id: string): Promise<Website | null> {
  const [row] = await websiteBaseQuery().where(eq(websites.id, id));
  if (!row) return null;
  const [tagsMap, channelsMap] = await Promise.all([
    loadWebsiteTagsMap([row.id]),
    loadWebsiteChannelsMap([row.id]),
  ]);
  return toWebsite(row, tagsMap.get(row.id) ?? [], channelsMap.get(row.id) ?? []);
}

/** Fetch a website by its normalized domain, or `null` when absent. */
export async function getWebsiteByDomain(domain: string): Promise<Website | null> {
  const [row] = await websiteBaseQuery().where(eq(websites.domain, domain));
  if (!row) return null;
  const [tagsMap, channelsMap] = await Promise.all([
    loadWebsiteTagsMap([row.id]),
    loadWebsiteChannelsMap([row.id]),
  ]);
  return toWebsite(row, tagsMap.get(row.id) ?? [], channelsMap.get(row.id) ?? []);
}

/**
 * Fetch a website by its canonical domain OR a verified shortened-link domain (e.g. `youtu.be`
 * resolves to the `youtube.com` site), or `null` when none matches.
 */
export async function getWebsiteByAnyDomain(domain: string): Promise<Website | null> {
  const [row] = await websiteBaseQuery().where(matchesAnyDomain(domain));
  if (!row) return null;
  const [tagsMap, channelsMap] = await Promise.all([
    loadWebsiteTagsMap([row.id]),
    loadWebsiteChannelsMap([row.id]),
  ]);
  return toWebsite(row, tagsMap.get(row.id) ?? [], channelsMap.get(row.id) ?? []);
}

/**
 * Look up the website for a URL without creating one — powers the add-bookmark banner. Resolves
 * verified shortened links to their parent site, and flags whether the host is a shortened link:
 * `"verified"` when it resolves through a shortened link, `"generic"` when it's in the ignore list,
 * else `null`. The returned `domain` is the resolved canonical domain (or the host when unmatched).
 */
export async function lookupWebsiteByUrl(
  url: string,
): Promise<{ domain: string | null;
  website: Website | null;
  shortener: "verified" | "generic" | null; }> {
  const host = normalizeDomain(url);
  if (!host) return {
    domain: null,
    website: null,
    shortener: null,
  };
  const website = await getWebsiteByAnyDomain(host);
  // Matched through a shortened link when the resolved site's canonical domain differs from the host.
  if (website && website.domain !== host) {
    return {
      domain: website.domain,
      website,
      shortener: "verified",
    };
  }
  if (!website) {
    const ignoreList = await getShortenerIgnoreList();
    if (ignoreList.includes(host)) {
      return {
        domain: host,
        website: null,
        shortener: "generic",
      };
    }
  }
  return {
    domain: host,
    website,
    shortener: null,
  };
}

/**
 * Resolve the website for a URL, creating a bare record for its domain when none exists yet — the
 * write-enabled counterpart to {@link lookupWebsiteByUrl}. Powers the extension's "Find a selector"
 * flow, which must attach a fill rule to a website even on a site the user hasn't set up yet. Reuses
 * the same lookup-or-create primitive (`ensureWebsiteForUrl`) as the bookmark-create path, so it
 * matches verified shortened links and never duplicates a domain. Returns `null` only when the URL
 * has no host.
 */
export async function resolveOrCreateWebsiteByUrl(url: string): Promise<Website | null> {
  const {
    domain, website,
  } = await lookupWebsiteByUrl(url);
  if (website) return website;
  // A host-less URL has nothing to create — bail before opening a transaction.
  if (!domain) return null;
  const id = await db.transaction(tx => ensureWebsiteForUrl(tx, url));
  return id ? getWebsite(id) : null;
}

/**
 * Manually add a website to the taxonomy. The `domain` is treated as a raw host (not a full URL),
 * normalized the same way `updateWebsite` does. Throws `InvalidDomainError` for an empty host and
 * `DuplicateDomainError` when the domain already exists.
 */
export async function createWebsite(input: CreateWebsiteInput): Promise<Website> {
  const domain = input.domain.trim().replace(/^www\./i, "").toLowerCase();
  if (domain.length === 0) throw new InvalidDomainError();

  const existing = await getWebsiteByDomain(domain);
  if (existing) throw new DuplicateDomainError(domain);

  const siteName = input.siteName?.trim() ? input.siteName.trim() : domain;
  const taken = await takenWebsiteSlugs();
  const slug = uniqueWebsiteSlug(slugFromDomain(domain), taken);

  const [row] = await db.insert(websites).values({
    domain,
    siteName,
    slug,
    description: input.description ?? null,
    ...(input.shortenedLinks !== undefined && {
      shortenedLinks: input.shortenedLinks,
    }),
    ...(input.paramRules !== undefined && {
      paramRules: input.paramRules,
    }),
  }).returning({
    id: websites.id,
  });
  return (await getWebsite(row.id))!;
}

/** Rename a website's site name and/or change its domain. Returns the updated row, or `null`. */
export async function updateWebsite(
  id: string,
  input: UpdateWebsiteInput,
): Promise<Website | null> {
  const [existing] = await db.select({
    id: websites.id,
    builtIn: websites.builtIn,
    siteName: websites.siteName,
    domain: websites.domain,
  }).from(websites).where(eq(websites.id, id));
  if (!existing) return null;
  if (existing.builtIn && builtInWebsiteRenamedOrMoved(input, existing)) {
    throw new BuiltInWebsiteError("A built-in website cannot be renamed or moved");
  }

  const patch: Partial<Pick<WebsiteRow, "domain" | "siteName" | "description" | "slug" | "shortenedLinks" | "paramRules" | "categoryId" | "mediaTypeId" | "socialLinks" | "labeledWebsites" | "alternateNames" | "extensionFillRules" | "extensionFillRuleGroups" | "scanObservations" | "redirectResolutionFailure" | "scanUrlForIsbn" | "isFavorite">> = buildWebsiteScalarPatch(input);
  if (input.isFavorite !== undefined) patch.isFavorite = input.isFavorite;
  if (input.domain !== undefined) {
    const domain = normalizeWebsiteDomain(input.domain);
    const [clash] = await db.select({
      id: websites.id,
    }).from(websites).where(eq(websites.domain, domain));
    if (clash && clash.id !== id) throw new DuplicateDomainError(domain);
    patch.domain = domain;
    // Regenerate the slug when the domain changes since it derives from the domain.
    const taken = await takenWebsiteSlugs(id);
    patch.slug = uniqueWebsiteSlug(slugFromDomain(domain), taken);
  }

  if (Object.keys(patch).length > 0) {
    await db.update(websites).set(patch).where(eq(websites.id, id));
  }

  if (input.tagIds !== undefined) {
    await setWebsiteTags(db, id, input.tagIds);
  }
  if (input.youtubeChannelIds !== undefined) {
    await setWebsiteChannels(db, id, input.youtubeChannelIds);
  }

  // Editing a website's extension-fill rules changes which of its bookmarks have a fillable field,
  // and that boolean feeds the condition cache — so rebuild it (mirrors bookmark-write invalidation).
  if (input.extensionFillRules !== undefined || input.extensionFillRuleGroups !== undefined) {
    invalidateBookmarkCache();
  }

  return getWebsite(id);
}

/** Delete a website. Built-ins can't be deleted. Bookmarks pointing at it are set to NULL via FK. */
export async function deleteWebsite(id: string): Promise<boolean> {
  const [existing] = await db.select({
    builtIn: websites.builtIn,
  }).from(websites).where(eq(websites.id, id));
  if (!existing) return false;
  if (existing.builtIn) throw new BuiltInWebsiteError("A built-in website cannot be deleted");
  const rows = await db.delete(websites).where(eq(websites.id, id)).returning({
    id: websites.id,
  });
  if (rows.length > 0) {
    await deleteLanguageUsagesForOwner("website", id);
    // Genre/mood assignments key off (ownerType, ownerId) with no FK on ownerId, so clean them up here.
    await deleteTaxonomyAssignmentsForOwner("website", id);
  }
  return rows.length > 0;
}

/** Delete many websites, reporting per-item outcomes (built-ins are skipped). */
export function bulkDeleteWebsites(ids: string[]): Promise<BulkDeleteResult[]> {
  return bulkDeleteEntities(ids, deleteWebsite, err => err instanceof BuiltInWebsiteError);
}

/** Apply a patch to many websites, reporting per-item outcomes. */
export async function bulkUpdateWebsites(
  ids: string[],
  patch: UpdateWebsiteInput,
): Promise<BulkBookmarkResult[]> {
  const results: BulkBookmarkResult[] = [];
  for (const id of ids) {
    try {
      const updated = await updateWebsite(id, patch);
      results.push(updated
        ? {
          id,
          status: "applied",
        }
        : {
          id,
          status: "not-found",
        });
    }
    catch (err) {
      results.push({
        id,
        status: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return results;
}

/** Add or remove a fixed set of default tags across many websites, reporting per-item outcomes. */
export async function bulkUpdateWebsiteTags(
  ids: string[],
  tagIds: string[],
  op: "add" | "remove",
): Promise<BulkBookmarkResult[]> {
  const results: BulkBookmarkResult[] = [];
  const removeSet = new Set(tagIds);
  for (const id of ids) {
    try {
      const existing = await getWebsite(id);
      if (!existing) {
        results.push({
          id,
          status: "not-found",
        });
        continue;
      }
      const current = existing.tagIds ?? [];
      const next = op === "add"
        ? [...new Set([...current, ...tagIds])]
        : current.filter(tagId => !removeSet.has(tagId));
      await updateWebsite(id, {
        tagIds: next,
      });
      results.push({
        id,
        status: "applied",
      });
    }
    catch (err) {
      results.push({
        id,
        status: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return results;
}
