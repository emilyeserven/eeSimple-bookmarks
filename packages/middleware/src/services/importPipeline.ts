/**
 * Import ingest pipeline: turn raw content (a pasted/fetched/uploaded newsletter today; other link
 * sources such as listicles later) into a reviewable Inbox queue of candidate bookmarks. The pure
 * extraction lives in `newsletterIngest.ts` and the redirect resolution in `redirectUnwrap.ts`; this
 * module wires them to the DB — queueing an import, running its background worker
 * (fetch → extract → unwrap → canonicalize → dedupe → pre-mark duplicates → enrich → persist), and
 * re-resolving a single item's URL on demand.
 *
 * Staging rows are NOT matchable bookmark data, so writes here never call `invalidateBookmarkCache`.
 * Only `createBookmark` (invoked via `approveImportItem` on auto-approve) touches the cache, which it
 * already does internally.
 */

import { eq } from "drizzle-orm";
import type {
  ImportSource,
  Import as ImportRecord,
} from "@eesimple/types";
import { isBlacklisted } from "@eesimple/types";
import { db } from "@/db";
import { importItems, imports } from "@/db/schema";
import { addImportBlacklistEntry, getCustomStripParams, getImportBlacklist, getRedirectIgnoreList, getShortenerIgnoreList } from "@/services/appSettings";
import { dedupeResolved, resolveCandidate, type ResolvedCandidate, withDuplicateFlag } from "@/services/importCandidateResolve";
import { applyImportRules } from "@/services/importRules";
import { approveImportItem } from "@/services/importApproveFlow";
import { enqueueImportJob } from "@/services/importQueue";
import { getImport } from "@/services/importReads";
import {
  extractArticleBody,
  extractCandidates,
  extractEmlHtml,
  filterAndDedupe,
  isAssetUrl,
} from "@/services/newsletterIngest";
import {
  extractDescription,
  extractImageUrl,
  extractTitle,
  fetchBodyHtmlResult,
  fetchHeadHtml,
  isPublicHttpUrl,
} from "@/services/metadata";
import { mapWithConcurrency } from "@/services/redirectUnwrap";
import { listWebsites } from "@/services/websites";

/** Concurrent outbound fetches for redirect unwrap / enrichment (bounded; see `mapWithConcurrency`). */
const FETCH_CONCURRENCY = 6;
const ENRICH_CONCURRENCY = 5;

/** What the ingest pipeline needs, regardless of which entry point produced it. */
export interface IngestInput {
  source: ImportSource;
  /** Raw content (HTML or text). For `.eml` the caller extracts the HTML first. Empty for `url`
   * imports until the worker fetches `fetchUrl`. */
  content: string;
  /** For `source === "url"`: the public page to fetch in the background worker (off the request path). */
  fetchUrl?: string | null;
  kind: "html" | "text" | "auto";
  /** Explicit/parsed import label (e.g. a provided title or an `.eml` Subject); wins over parsing. */
  title?: string | null;
  /** Fallback label (source URL / filename) used only when no title is provided or parsed. */
  titleFallback?: string | null;
  sourceUrl?: string | null;
  /** The newsletter (publication) this import belongs to, or `null`. */
  newsletterId?: string | null;
  /** Default category applied to every link approved from this import. */
  defaultCategoryId?: string | null;
}

/** Eagerly fetch a candidate's page title/description/image (best-effort; never throws). */
async function enrichCandidate(
  item: ResolvedCandidate,
): Promise<{ title: string | null;
  description: string | null;
  imageUrl: string | null; }> {
  const seedTitle = item.anchorText.trim() || null;
  if (item.url === null || item.status !== "pending") {
    return {
      title: seedTitle,
      description: null,
      imageUrl: null,
    };
  }
  const html = await fetchHeadHtml(item.url);
  if (html === null) return {
    title: seedTitle,
    description: null,
    imageUrl: null,
  };
  const image = extractImageUrl(html, item.url);
  return {
    // Prefer the fetched page title (og:title/<title>); fall back to the source anchor text.
    title: extractTitle(html) ?? seedTitle,
    description: extractDescription(html),
    imageUrl: image && isPublicHttpUrl(image) ? image : null,
  };
}

/** How often (every Nth enriched link) the worker flushes `processedCount` to the DB. */
const PROGRESS_FLUSH_EVERY = 3;

/** Mark an import as failed with a human-readable reason (best-effort; never throws). */
async function markImportFailed(importId: string, reason: string): Promise<void> {
  await db
    .update(imports)
    .set({
      status: "failed",
      errorReason: reason,
    })
    .where(eq(imports.id, importId));
}

/**
 * Create the `imports` row immediately with `status === "queued"` and no items, returning the queued
 * record so the request can respond instantly. The links are extracted later by `processImport` on
 * the background queue (see `queueImport`).
 */
export async function createQueuedImport(input: IngestInput): Promise<ImportRecord> {
  // Provisional label: an explicit/parsed title, then a title parsed from any content we already have
  // (paste/upload), then the URL/filename fallback. `url` imports refine this once the page is fetched.
  const parsedTitle = input.title == null && input.kind !== "text" && input.content
    ? extractTitle(input.content)
    : null;
  const title = input.title ?? parsedTitle ?? input.titleFallback ?? null;
  const [importRow] = await db
    .insert(imports)
    .values({
      source: input.source,
      title,
      sourceUrl: input.sourceUrl ?? null,
      newsletterId: input.newsletterId ?? null,
      defaultCategoryId: input.defaultCategoryId ?? null,
      status: "queued",
    })
    .returning({
      id: imports.id,
    });
  return (await getImport(importRow!.id))!;
}

/**
 * Run the full ingest pipeline for one queued import: (fetch for `url`) → extract → unwrap →
 * canonicalize → dedupe → pre-mark duplicates → enrich → persist, advancing the import's
 * `status`/`totalCount`/`processedCount` as it goes. Records its own failure (`status === "failed"`)
 * rather than throwing — it runs detached on the background queue.
 */
export async function processImport(importId: string, input: IngestInput): Promise<void> {
  try {
    await db
      .update(imports)
      .set({
        status: "processing",
      })
      .where(eq(imports.id, importId));

    // For a `url` import, fetch the page now — off the request path — so a slow/blocking server never
    // holds the user's submit open.
    let content = input.content;
    if (input.source === "url" && input.fetchUrl) {
      const result = await fetchBodyHtmlResult(input.fetchUrl, /<\/body>/i);
      if (result.kind !== "ok") {
        await markImportFailed(importId, `Could not fetch that page (${result.kind}).`);
        return;
      }
      content = result.html;
      // Now that we have the page, refine the import label from its <title>/og:title.
      const refined = input.title ?? extractTitle(content) ?? input.titleFallback ?? null;
      if (refined) {
        await db.update(imports).set({
          title: refined,
        }).where(eq(imports.id, importId));
      }
    }

    // Scope link extraction to the main article body when present (a full webpage), so site
    // nav/sidebar/footer/related-posts links are dropped; fall back to the whole document when no
    // article region is found (a newsletter email — unchanged behavior).
    const scoped = input.kind !== "text" ? (extractArticleBody(content) ?? content) : content;
    const candidates = filterAndDedupe(extractCandidates(scoped, input.kind));
    await db
      .update(imports)
      .set({
        totalCount: candidates.length,
        processedCount: 0,
      })
      .where(eq(imports.id, importId));

    const [websites, ignoreList, redirectIgnoreList, blacklist, customStripParams] = await Promise.all([
      listWebsites(),
      getShortenerIgnoreList(),
      getRedirectIgnoreList(),
      getImportBlacklist(),
      getCustomStripParams(),
    ]);
    const data = {
      mode: "trackers" as const,
      websites,
      ignoreList,
      redirectIgnoreList,
      customStripParams,
    };

    const resolvedAll = await mapWithConcurrency(
      candidates,
      FETCH_CONCURRENCY,
      candidate => resolveCandidate(candidate, data),
    );
    // Drop blacklisted links AND static-asset destinations (font/image files) AFTER resolution, so a
    // tracker-wrapped link is unwrapped to its real target first — the wrapper's path never ends in
    // `.woff`/`.png`, only the destination does. Dropped links are never staged, so they vanish from
    // future imports.
    const resolved = dedupeResolved(
      resolvedAll.filter(
        item => item.url === null || (!isBlacklisted(item.url, blacklist) && !isAssetUrl(item.url)),
      ),
    );

    const flagged = await Promise.all(resolved.map(withDuplicateFlag));
    // Refine the progress denominator to the real number of items now that dedupe/filtering is done.
    await db
      .update(imports)
      .set({
        totalCount: flagged.length,
      })
      .where(eq(imports.id, importId));

    // Always enrich: fetch each candidate's title/description/preview so the review queue and the
    // created bookmarks have them without an opt-in step. Advance `processedCount` as we go (throttled).
    let processed = 0;
    const enriched = await mapWithConcurrency(
      flagged,
      ENRICH_CONCURRENCY,
      async (entry) => {
        const out = await enrichCandidate(entry.item);
        processed += 1;
        if (processed === flagged.length || processed % PROGRESS_FLUSH_EVERY === 0) {
          // Best-effort progress write — a transient failure here must not fail the whole import
          // (the final count is set authoritatively in the persist transaction below).
          try {
            await db.update(imports).set({
              processedCount: processed,
            }).where(eq(imports.id, importId));
          }
          catch {
            // Ignore; progress is advisory.
          }
        }
        return out;
      },
    );

    // Evaluate import rules for each pending item (non-pending items keep their existing status).
    const ruleActions = await Promise.all(
      flagged.map((entry, i) => {
        if (entry.item.status !== "pending" || entry.item.url === null) return Promise.resolve(null);
        return applyImportRules({
          url: entry.item.url,
          title: enriched[i]!.title,
        });
      }),
    );

    const toApproveIds: string[] = [];
    const toBlockUrls: string[] = [];

    await db.transaction(async (tx) => {
      if (flagged.length > 0) {
        const inserted = await tx.insert(importItems).values(
          flagged.map((entry, i) => {
            const action = ruleActions[i];
            let status = entry.item.status;
            if (status === "pending") {
              if (action === "reject") status = "rejected";
              else if (action === "block") status = "blocked";
              // action === "approve" → keep pending; approveImportItem runs after the transaction
            }
            return {
              importId,
              url: entry.item.url,
              rawUrl: entry.item.rawUrl,
              title: enriched[i]!.title,
              description: enriched[i]!.description,
              imageUrl: enriched[i]!.imageUrl,
              newsletterContext: entry.item.context,
              anchorText: entry.item.anchorText || null,
              status,
              duplicateBookmarkId: entry.duplicateBookmarkId,
              errorReason: entry.item.errorReason,
            };
          }),
        ).returning({
          id: importItems.id,
        });

        for (let i = 0; i < flagged.length; i++) {
          const action = ruleActions[i];
          const entry = flagged[i]!;
          if (entry.item.status !== "pending") continue;
          if (action === "block" && entry.item.url !== null) toBlockUrls.push(entry.item.url);
          else if (action === "approve") {
            const row = inserted[i];
            if (row) toApproveIds.push(row.id);
          }
        }
      }
      await tx
        .update(imports)
        .set({
          status: "complete",
          processedCount: flagged.length,
        })
        .where(eq(imports.id, importId));
    });

    // Post-transaction: add domain-level blacklist entries for rule-blocked URLs.
    for (const url of toBlockUrls) {
      try {
        const host = new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
        await addImportBlacklistEntry({
          kind: "domain",
          value: host,
        });
      }
      catch {
        // Unparseable URL — skip blacklist entry.
      }
    }

    // Post-transaction: auto-approve matched items. One failure must not abort the rest.
    for (const id of toApproveIds) {
      try {
        await approveImportItem(id);
      }
      catch {
        // Approval failures are non-fatal; the item stays pending for manual review.
      }
    }
  }
  catch (err) {
    await markImportFailed(importId, err instanceof Error ? err.message : String(err));
  }
}

/**
 * Create a queued import and enqueue its background processing, returning the queued record at once.
 * The route responds immediately; the Inbox fills as the worker (`processImport`) runs. This is the
 * single entry point the ingest routes call.
 */
export async function queueImport(input: IngestInput): Promise<ImportRecord> {
  const record = await createQueuedImport(input);
  enqueueImportJob(() => processImport(record.id, input));
  return record;
}

/**
 * Build candidate content for a `.eml`/`.html` upload, returning the HTML (or text) to ingest plus a
 * parsed title (the `.eml` Subject) when available — used as the import label.
 */
export function contentFromUpload(
  filename: string,
  bytes: Buffer,
): { content: string;
  kind: "html" | "text";
  title: string | null; } | null {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".eml")) {
    const {
      html, text, subject,
    } = extractEmlHtml(bytes);
    if (html) return {
      content: html,
      kind: "html",
      title: subject,
    };
    if (text) return {
      content: text,
      kind: "text",
      title: subject,
    };
    return null;
  }
  if (lower.endsWith(".html") || lower.endsWith(".htm")) {
    return {
      content: bytes.toString("utf8"),
      kind: "html",
      title: null,
    };
  }
  if (lower.endsWith(".txt")) {
    return {
      content: bytes.toString("utf8"),
      kind: "text",
      title: null,
    };
  }
  return null;
}

/**
 * Re-run redirect unwrap + canonicalize for a single item's `rawUrl`. Updates `url`, `status`, and
 * `errorReason` if the result differs. Useful when a link's tracker redirect was unreachable at
 * ingest time (network hiccup, redeploy) and the user wants to retry. Returns the new resolved URL
 * and whether the item was actually updated.
 */
export async function recheckImportItemUrl(
  itemId: string,
): Promise<{ url: string | null;
  updated: boolean; } | null> {
  const [item] = await db.select().from(importItems).where(eq(importItems.id, itemId));
  if (!item) return null;
  if (!item.rawUrl) return {
    url: item.url,
    updated: false,
  };

  const [websites, ignoreList, redirectIgnoreList, customStripParams] = await Promise.all([
    listWebsites(),
    getShortenerIgnoreList(),
    getRedirectIgnoreList(),
    getCustomStripParams(),
  ]);
  const data = {
    mode: "trackers" as const,
    websites,
    ignoreList,
    redirectIgnoreList,
    customStripParams,
  };
  const resolved = await resolveCandidate(
    {
      rawUrl: item.rawUrl,
      anchorText: item.anchorText ?? "",
      source: "html-anchor",
      context: item.newsletterContext,
    },
    data,
    {
      browserlessFallback: true,
    },
  );

  if (resolved.url === item.url && resolved.status === item.status) {
    return {
      url: resolved.url,
      updated: false,
    };
  }
  await db
    .update(importItems)
    .set({
      url: resolved.url,
      status: resolved.status,
      errorReason: resolved.errorReason,
    })
    .where(eq(importItems.id, itemId));
  return {
    url: resolved.url,
    updated: true,
  };
}
