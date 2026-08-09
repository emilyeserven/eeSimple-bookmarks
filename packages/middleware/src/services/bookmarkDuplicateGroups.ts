/**
 * Whole-collection duplicate detection for the Settings → Advanced → Duplicates page. One pass over
 * the bookmark rows groups them in three confidence tiers — same URL/page (honoring each website's
 * `paramRules`, so e.g. two YouTube watch URLs only group when their `?v=` matches), shared media
 * identity (ISBN / Plex / Kavita / podcast feed — the same columns the add-form url-check uses),
 * and same normalized title (the lower-confidence "possible duplicates" tier). Pure read — the
 * grouping-key helpers live in `@eesimple/types` (`duplicates.ts`) and are shared with the per-URL
 * `checkBookmarkUrlDuplicate`.
 */

import type {
  DuplicateGroup,
  DuplicateGroupKind,
  DuplicateGroupMember,
  DuplicateIdentityField,
  DuplicateScanResult,
  WebsiteParamRule,
} from "@eesimple/types";
import {
  bookmarkPageKey,
  DUPLICATE_GROUP_KINDS,
  DUPLICATE_IDENTITY_FIELDS,
  mostSpecificParamRule,
  normalizeTitleKey,
} from "@eesimple/types";
import { db } from "@/db";
import { bookmarks } from "@/db/schema";
import { listWebsites, normalizeDomain } from "@/services/websites";

interface ScanRow {
  id: string;
  url: string | null;
  title: string;
  createdAt: Date;
  isbn: string | null;
  plexRatingKey: string | null;
  kavitaSeriesId: number | null;
  feedUrl: string | null;
}

/**
 * Every domain a website answers to (its own + its verified shortened-link domains) → its
 * `paramRules`. The bulk equivalent of `getWebsiteByAnyDomain`, built once per scan.
 */
async function loadParamRulesByDomain(): Promise<Map<string, WebsiteParamRule[]>> {
  const byDomain = new Map<string, WebsiteParamRule[]>();
  for (const website of await listWebsites()) {
    if (website.paramRules.length === 0) continue;
    byDomain.set(website.domain, website.paramRules);
    for (const link of website.shortenedLinks) byDomain.set(link.domain, website.paramRules);
  }
  return byDomain;
}

function toMember(row: ScanRow): DuplicateGroupMember {
  return {
    id: row.id,
    url: row.url,
    title: row.title,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Bucket rows by a derived key (rows whose key is null are skipped); only buckets of ≥ 2 duplicate. */
function bucketBy(rows: ScanRow[], keyOf: (row: ScanRow) => string | null): Map<string, ScanRow[]> {
  const buckets = new Map<string, ScanRow[]>();
  for (const row of rows) {
    const key = keyOf(row);
    if (key === null) continue;
    const bucket = buckets.get(key);
    if (bucket) bucket.push(row);
    else buckets.set(key, [row]);
  }
  for (const [key, bucket] of buckets) {
    if (bucket.length < 2) buckets.delete(key);
  }
  return buckets;
}

/** Order-independent identity of a group's member set, for cross-tier dedup. */
function memberSetKey(rows: ScanRow[]): string {
  return rows.map(row => row.id).sort().join("|");
}

function toGroup(
  kind: DuplicateGroupKind,
  key: string,
  rows: ScanRow[],
  identityField?: DuplicateIdentityField,
): DuplicateGroup {
  const members = [...rows]
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map(toMember);
  return {
    kind,
    key,
    ...identityField
      ? {
        identityField,
      }
      : {},
    members,
  };
}

function compareGroups(a: DuplicateGroup, b: DuplicateGroup): number {
  const kindOrder = DUPLICATE_GROUP_KINDS.indexOf(a.kind) - DUPLICATE_GROUP_KINDS.indexOf(b.kind);
  if (kindOrder !== 0) return kindOrder;
  return b.members.length - a.members.length;
}

/** Scan every bookmark and group the duplicates. On-demand, pure DB work — no background job. */
export async function scanDuplicateGroups(): Promise<DuplicateScanResult> {
  const rows: ScanRow[] = await db
    .select({
      id: bookmarks.id,
      url: bookmarks.url,
      title: bookmarks.title,
      createdAt: bookmarks.createdAt,
      isbn: bookmarks.isbn,
      plexRatingKey: bookmarks.plexRatingKey,
      kavitaSeriesId: bookmarks.kavitaSeriesId,
      feedUrl: bookmarks.feedUrl,
    })
    .from(bookmarks);
  const rulesByDomain = await loadParamRulesByDomain();

  const groups: DuplicateGroup[] = [];
  const emitted = new Set<string>();

  // URL tier: bucket by page key; a bucket whose raw URLs are all identical is the exact-match kind.
  const pageBuckets = bucketBy(rows, (row) => {
    if (!row.url) return null;
    let pathname: string;
    try {
      pathname = new URL(row.url).pathname;
    }
    catch {
      return null;
    }
    const domain = normalizeDomain(row.url);
    const rule = domain ? mostSpecificParamRule(rulesByDomain.get(domain) ?? [], pathname) : null;
    return bookmarkPageKey(row.url, rule);
  });
  for (const [key, bucket] of pageBuckets) {
    const sameUrl = bucket.every(row => row.url === bucket[0]!.url);
    groups.push(toGroup(sameUrl ? "same-url" : "same-page", key, bucket));
    emitted.add(memberSetKey(bucket));
  }

  // Identity tier: one bucketing per identity column, skipping member sets the URL tier already found.
  for (const field of DUPLICATE_IDENTITY_FIELDS) {
    const buckets = bucketBy(rows, (row) => {
      const value = row[field];
      return value == null || value === "" ? null : `${field}:${String(value)}`;
    });
    for (const [key, bucket] of buckets) {
      if (emitted.has(memberSetKey(bucket))) continue;
      groups.push(toGroup("shared-identity", key, bucket, field));
      emitted.add(memberSetKey(bucket));
    }
  }

  // Title tier: the lower-confidence "possible duplicates" list, kept separate from the sure tiers.
  const possibleGroups: DuplicateGroup[] = [];
  for (const [key, bucket] of bucketBy(rows, row => normalizeTitleKey(row.title))) {
    if (emitted.has(memberSetKey(bucket))) continue;
    possibleGroups.push(toGroup("same-title", key, bucket));
  }

  return {
    groups: groups.sort(compareGroups),
    possibleGroups: possibleGroups.sort(compareGroups),
    scannedCount: rows.length,
  };
}
