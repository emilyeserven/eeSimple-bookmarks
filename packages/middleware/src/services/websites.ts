import { and, asc, eq, inArray, ne, or, sql } from "drizzle-orm";
import type { BulkBookmarkResult, BulkDeleteResult, CreateWebsiteInput, LabeledWebsite, RedirectFailureBookmark, RedirectFailureWebsite, ShortenedLink, SocialLink, UpdateWebsiteInput, Website, WebsiteExtensionFillRule, WebsiteNode, WebsiteParamRule } from "@eesimple/types";
import { getShortenerIgnoreList } from "@/services/appSettings";
import { bulkDeleteEntities } from "@/services/bulkDelete";
import { db } from "@/db";
import { deleteTaxonomyAssignmentsForOwner } from "@/services/taxonomyAssignments";
import { deleteLanguageUsagesForOwner } from "@/services/languageUsages";
import { bookmarkImages, bookmarks, categories, websiteFavicons, websiteTags, websites, websiteYoutubeChannels, type WebsiteRow } from "@/db/schema";
import { AppError } from "@/utils/errors";
import { buildStringMap } from "@/utils/mapUtils";
import { slugify } from "@/utils/slug";
import { builtInWebsiteRenamedOrMoved, buildWebsiteScalarPatch, normalizeWebsiteDomain } from "@/services/websiteUpdate";

/**
 * Build a favicon serving URL (with a `?v=` cache-buster) from a website id and its favicon's
 * `createdAt`, or `null` when there's no favicon. Kept in sync with `websiteFaviconUrl` in the
 * favicon service — both encode the version the same way so a replaced favicon busts the cache.
 */
function faviconUrlFrom(websiteId: string, createdAt: Date | string | null): string | null {
  if (!createdAt) return null;
  const time = (createdAt instanceof Date ? createdAt : new Date(createdAt)).getTime();
  return `/api/websites/${websiteId}/image?v=${time}`;
}

/** Transaction handle type, matching the callback arg of `db.transaction`. */
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Thrown when a website rename/move would collide with an existing domain. */
export class DuplicateDomainError extends AppError {
  constructor(domain: string) {
    super(`A website already exists for "${domain}"`, "duplicateDomain", 409, {
      domain,
    });
  }
}

/** Thrown when an update or delete targets a built-in website in a disallowed way. */
export class BuiltInWebsiteError extends AppError {
  constructor(message: string) {
    super(message, "builtInImmutable", 403);
  }
}

/**
 * Seeded built-in websites, kept in sync at boot. Built-ins can't be renamed or deleted, but their
 * `shortenedLinks`/`paramRules` are seeded once (on insert) and stay user-editable thereafter.
 */
const BUILT_IN_WEBSITES: {
  domain: string;
  siteName: string;
  shortenedLinks: ShortenedLink[];
  paramRules: WebsiteParamRule[];
}[] = [
  {
    domain: "youtube.com",
    siteName: "YouTube",
    shortenedLinks: [
      {
        domain: "youtu.be",
        expandTo: "https://www.youtube.com/watch?v={id}",
        keepShortened: false,
      },
    ],
    paramRules: [
      {
        pathSuffix: "/watch",
        params: ["v"],
      },
      {
        pathSuffix: "/playlist",
        params: ["list"],
      },
    ],
  },
];

/**
 * SQL predicate matching a website by its canonical `domain` OR any of its verified
 * `shortenedLinks[].domain` (so e.g. a `youtu.be` URL resolves to the `youtube.com` site). Uses
 * jsonb containment (`@>`) for partial-object matching within the array.
 */
function matchesAnyDomain(domain: string) {
  return or(
    eq(websites.domain, domain),
    sql`${websites.shortenedLinks} @> ${JSON.stringify([{
      domain,
    }])}::jsonb`,
  );
}

/**
 * Derive a URL-safe slug base from a domain by stripping the TLD (last dot-segment) and
 * slugifying. `"github.com"` → `"github"`, `"news.ycombinator.com"` → `"news-ycombinator"`.
 */
function slugFromDomain(domain: string): string {
  const withoutTld = domain.replace(/\.[^.]+$/, "");
  return slugify(withoutTld) || slugify(domain) || "website";
}

/**
 * Pick a website slug for `base` that does not collide with `taken`. Appends `-2`, `-3`, …
 * until unique.
 */
function uniqueWebsiteSlug(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;
  for (let n = 2; ; n += 1) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
}

/** Fetch the set of all existing website slugs, optionally excluding one row. */
async function takenWebsiteSlugs(excludeId?: string): Promise<Set<string>> {
  const rows = await db
    .select({
      slug: websites.slug,
    })
    .from(websites)
    .where(excludeId ? ne(websites.id, excludeId) : undefined);
  return new Set(rows.map(r => r.slug).filter((s): s is string => s !== null));
}

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
    redirectResolutionFailure: row.redirectResolutionFailure ?? false,
    scanUrlForIsbn: row.scanUrlForIsbn ?? false,
  };
}

/** Shared select shape for website lookups (includes favicon + category join fields). */
const websiteSelect = {
  id: websites.id,
  domain: websites.domain,
  siteName: websites.siteName,
  slug: websites.slug,
  description: websites.description,
  builtIn: websites.builtIn,
  shortenedLinks: websites.shortenedLinks,
  paramRules: websites.paramRules,
  socialLinks: websites.socialLinks,
  labeledWebsites: websites.labeledWebsites,
  alternateNames: websites.alternateNames,
  extensionFillRules: websites.extensionFillRules,
  createdAt: websites.createdAt,
  categoryId: websites.categoryId,
  mediaTypeId: websites.mediaTypeId,
  faviconAutoGrabError: websites.faviconAutoGrabError,
  redirectResolutionFailure: websites.redirectResolutionFailure,
  scanUrlForIsbn: websites.scanUrlForIsbn,
  faviconCreatedAt: websiteFavicons.createdAt,
  categoryName: categories.name,
  categorySlug: categories.slug,
  categoryIcon: categories.icon,
};

/**
 * Normalize a URL to its host for the Websites taxonomy: lower-cased, leading `www.` stripped.
 * Mirrors the client's `hostOf()` so both sides agree on a bookmark's website. Pure — returns
 * `null` for any value that isn't a parseable URL with a host.
 */
export function normalizeDomain(url: string): string | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
    return host.length > 0 ? host : null;
  }
  catch {
    return null;
  }
}

/**
 * Derive the brand label from a domain: the registrable name before the public suffix, e.g.
 * `github` from `github.com` or `sub.github.com`. A best-effort heuristic used only for cleaning
 * up fetched titles.
 */
function brandFromDomain(domain: string): string {
  const labels = domain.split(".").filter(Boolean);
  if (labels.length >= 2) return labels[labels.length - 2];
  return labels[0] ?? domain;
}

/** Escape a string for safe inclusion in a `RegExp`. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Strip a trailing site-name/brand suffix from an autogenerated title so site names aren't
 * appended to titles (e.g. `"Pricing · GitHub"` → `"Pricing"`). Matches a trailing separator
 * followed by the site name or the domain's brand label, only when a non-empty prefix remains.
 * Pure — kept separate from DB access for unit testing.
 */
export function stripSiteNameSuffix(
  title: string,
  {
    siteName, domain,
  }: { siteName?: string | null;
    domain?: string | null; },
): string {
  const candidates: string[] = [];
  if (siteName && siteName.trim().length > 0) candidates.push(siteName.trim());
  if (domain) candidates.push(brandFromDomain(domain));

  for (const token of candidates) {
    if (token.length === 0) continue;
    // Trailing separator (dash/pipe/colon/dot variants) + the token at the very end.
    const re = new RegExp(`\\s*[-|–—·•:／]\\s*${escapeRegExp(token)}\\s*$`, "i");
    if (!re.test(title)) continue;
    const stripped = title.replace(re, "").trim();
    if (stripped.length > 0) return stripped;
  }
  return title;
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

/**
 * Find the parent domain of a domain in the given domain set: the longest-suffix candidate that
 * exists as a website (e.g. `blog.example.com` → `example.com`). Pure — no DB access.
 */
function findParentDomain(domain: string, domainSet: Set<string>): string | null {
  const parts = domain.split(".");
  for (let i = 1; i < parts.length - 1; i++) {
    const candidate = parts.slice(i).join(".");
    if (domainSet.has(candidate)) return candidate;
  }
  return null;
}

/**
 * Build a nested tree from a flat website list, grouping subdomains under their parent domains.
 * Pure — kept separate from DB access so it can be unit-tested.
 */
export function buildWebsiteTree(all: Website[]): WebsiteNode[] {
  const domainSet = new Set(all.map(w => w.domain));
  const byDomain = new Map<string, WebsiteNode>(
    all.map(w => [w.domain, {
      ...w,
      children: [],
    }]),
  );
  const roots: WebsiteNode[] = [];
  for (const node of byDomain.values()) {
    const parentDomain = findParentDomain(node.domain, domainSet);
    const parent = parentDomain ? byDomain.get(parentDomain) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
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
 * Resolve the website for a URL inside a transaction, creating it when none exists yet.
 * `siteName` sets the friendly name for the new site; defaults to the domain when omitted.
 * Returns the website id, or `null` when the URL has no host.
 */
export async function ensureWebsiteForUrl(tx: Tx, url: string, siteName?: string): Promise<string | null> {
  const domain = normalizeDomain(url);
  if (!domain) return null;

  // Match by canonical domain OR a verified shortened link, so e.g. a kept `youtu.be` bookmark
  // associates with the existing `youtube.com` site instead of creating a `youtu.be` website.
  const [existing] = await tx
    .select({
      id: websites.id,
    })
    .from(websites)
    .where(matchesAnyDomain(domain));
  if (existing) return existing.id;

  // Generate a slug before inserting (read outside tx is safe — backfill covers edge cases).
  const taken = await takenWebsiteSlugs();
  const slug = uniqueWebsiteSlug(slugFromDomain(domain), taken);

  const inserted = await tx
    .insert(websites)
    .values({
      domain,
      siteName: siteName?.trim() || domain,
      slug,
    })
    .onConflictDoNothing({
      target: websites.domain,
    })
    .returning({
      id: websites.id,
    });
  if (inserted.length > 0) return inserted[0].id;

  // Lost a concurrent insert race — re-read the row the other writer created.
  const [row] = await tx
    .select({
      id: websites.id,
    })
    .from(websites)
    .where(eq(websites.domain, domain));
  return row?.id ?? null;
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

/** Thrown when a manual create is given a domain that normalizes to an empty host. */
export class InvalidDomainError extends AppError {
  constructor() {
    super("A non-empty domain is required", "validation", 400);
  }
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

  const patch: Partial<Pick<WebsiteRow, "domain" | "siteName" | "description" | "slug" | "shortenedLinks" | "paramRules" | "categoryId" | "mediaTypeId" | "socialLinks" | "labeledWebsites" | "alternateNames" | "extensionFillRules" | "redirectResolutionFailure" | "scanUrlForIsbn">> = buildWebsiteScalarPatch(input);
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

/**
 * Ensure the seeded built-in websites exist and are marked built-in. Idempotent and safe to call at
 * boot: inserts any missing built-in by domain, and upgrades a pre-existing auto-created row (e.g. a
 * youtube.com site created before seeding) to `builtIn` with the canonical site name. The slug is
 * only set on insert, preserving any slug an existing row already has.
 */
export async function ensureBuiltInWebsites(): Promise<void> {
  for (const {
    domain, siteName, shortenedLinks, paramRules,
  } of BUILT_IN_WEBSITES) {
    const taken = await takenWebsiteSlugs();
    const slug = uniqueWebsiteSlug(slugFromDomain(domain), taken);
    await db
      .insert(websites)
      .values({
        domain,
        siteName,
        slug,
        builtIn: true,
        // Rules are seeded on first insert only; they stay out of the conflict `set` below so a
        // user's later edits to the built-in site's shortened links / param rules are preserved.
        shortenedLinks,
        paramRules,
      })
      .onConflictDoUpdate({
        target: websites.domain,
        set: {
          builtIn: true,
          siteName,
        },
      });

    // Heal rows that predate rule seeding (e.g. a youtube.com site auto-created before the built-in
    // param rules existed): seed the rules only when the row never received them — both arrays still
    // empty — so deliberate user edits to a built-in's rules are left untouched.
    await db
      .update(websites)
      .set({
        shortenedLinks,
        paramRules,
      })
      .where(and(
        eq(websites.domain, domain),
        sql`${websites.shortenedLinks} = '[]'::jsonb`,
        sql`${websites.paramRules} = '[]'::jsonb`,
      ));
  }
}

/** A stored extension-fill rule as it may exist on disk, including the retired `pathSuffix` field. */
type LegacyExtensionFillRule = WebsiteExtensionFillRule & { pathSuffix?: string };

/**
 * Convert one website's rules from the retired suffix-only `pathSuffix` gate to the mode-based
 * `pathMatch` (as a `suffix` match, preserving today's behavior). Returns the migrated array only
 * when something changed, else `null` — the caller skips a no-op write, keeping the boot step
 * idempotent. An already-migrated rule (`pathMatch` present, no `pathSuffix`) is left untouched.
 */
export function migrateExtensionFillRules(
  rules: LegacyExtensionFillRule[],
): WebsiteExtensionFillRule[] | null {
  let changed = false;
  const migrated = rules.map((rule): WebsiteExtensionFillRule => {
    const {
      pathSuffix, ...rest
    } = rule;
    if (pathSuffix === undefined) return rule;
    changed = true;
    // A blank legacy suffix was an always-apply gate — drop it entirely.
    const trimmed = pathSuffix.trim();
    if (!trimmed || rest.pathMatch) return rest;
    return {
      ...rest,
      pathMatch: {
        mode: "suffix",
        value: trimmed,
      },
    };
  });
  return changed ? migrated : null;
}

/**
 * Migrate any stored extension-fill rules still using the retired `pathSuffix` gate to `pathMatch`.
 * Idempotent — only rows that actually change are written. jsonb shape change only; no drizzle
 * migration. Websites are a small, bounded set, so loading them all for a one-time boot step is fine.
 */
export async function backfillExtensionFillPathMatch(): Promise<void> {
  const rows = await db
    .select({
      id: websites.id,
      extensionFillRules: websites.extensionFillRules,
    })
    .from(websites);

  for (const row of rows) {
    if (!row.extensionFillRules) continue;
    const migrated = migrateExtensionFillRules(row.extensionFillRules as LegacyExtensionFillRule[]);
    if (!migrated) continue;
    await db
      .update(websites)
      .set({
        extensionFillRules: migrated,
      })
      .where(eq(websites.id, row.id));
  }
}

/**
 * Return websites flagged for redirect resolution failure, each with their associated bookmarks
 * (id, url, title, description, imageUrl). Ordered by site name; bookmarks ordered by title.
 */
export async function listRedirectFailureWebsites(): Promise<RedirectFailureWebsite[]> {
  const flaggedRows = await db
    .select(websiteSelect)
    .from(websites)
    .leftJoin(websiteFavicons, eq(websiteFavicons.websiteId, websites.id))
    .leftJoin(categories, eq(categories.id, websites.categoryId))
    .where(eq(websites.redirectResolutionFailure, true))
    .orderBy(asc(websites.siteName));

  if (flaggedRows.length === 0) return [];

  const websiteIds = flaggedRows.map(r => r.id);
  const bookmarkRows = await db
    .select({
      id: bookmarks.id,
      url: bookmarks.url,
      title: bookmarks.title,
      description: bookmarks.description,
      websiteId: bookmarks.websiteId,
      imageObjectKey: bookmarkImages.objectKey,
    })
    .from(bookmarks)
    .leftJoin(bookmarkImages, eq(bookmarkImages.bookmarkId, bookmarks.id))
    .where(inArray(bookmarks.websiteId, websiteIds))
    .orderBy(asc(bookmarks.title));

  const bookmarksByWebsite = new Map<string, RedirectFailureBookmark[]>();
  for (const bm of bookmarkRows) {
    if (!bm.websiteId) continue;
    const list = bookmarksByWebsite.get(bm.websiteId) ?? [];
    list.push({
      id: bm.id,
      url: bm.url,
      title: bm.title,
      description: bm.description,
      imageUrl: bm.imageObjectKey ? `/api/bookmarks/${bm.id}/image` : null,
    });
    bookmarksByWebsite.set(bm.websiteId, list);
  }

  return flaggedRows.map(site => ({
    id: site.id,
    domain: site.domain,
    siteName: site.siteName,
    slug: site.slug ?? slugFromDomain(site.domain),
    imageUrl: faviconUrlFrom(site.id, site.faviconCreatedAt ?? null),
    bookmarks: bookmarksByWebsite.get(site.id) ?? [],
  }));
}
