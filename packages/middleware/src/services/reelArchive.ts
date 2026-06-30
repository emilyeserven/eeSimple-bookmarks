/**
 * On-demand Instagram-reel video archiving. Captures a reel's video into the app's own object
 * storage (Garage/S3) so it survives the reel later being deleted from Instagram — the self-contained
 * counterpart to the link-out ArchiveBox connector.
 *
 * Pipeline:
 *   1. Extract the reel's public video URL (+ dimensions), preferring the keyless path: Instagram's
 *      public `/embed/` endpoint exposes `video_url` in its `shortcode_media` JSON (the same source
 *      `fetchInstagramCarousel` reads for images) without needing any configuration, and isn't subject
 *      to the login wall the live reel page can show a headless browser. When that yields nothing,
 *      fall back to a configured Browserless instance (`/chromium/function`), which loads the reel and
 *      reads the page's `og:video` meta tags or a `<video>` element (mirrors the on-demand Browserless
 *      screenshot in `bookmarkImages.ts`).
 *   2. The middleware fetches that MP4 itself — SSRF-guarded, with the reel as `Referer` to clear
 *      Instagram's CDN hotlink protection — and stores the raw bytes via `putObject`.
 *   3. A 0..1-per-bookmark `bookmark_reel_archives` row records the metadata and the object is added
 *      to the Gallery manifest.
 *
 * Best-effort and never throws: every failure path returns a string sentinel the route maps to a
 * status code. This is display/media-only data, so it deliberately does NOT touch
 * `invalidateBookmarkCache()` (a reel archive doesn't change a bookmark's matchable data — same
 * carve-out as screenshots and Card Display Rules).
 */

import type { ActiveReelArchiveJob, InstagramReelArchive, ReelArchiveJob, ReelArchiveJobStatus } from "@eesimple/types";
import { isInstagramReelUrl } from "@eesimple/types";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { bookmarkReelArchives, type BookmarkReelArchiveRow, bookmarks, reelArchiveJobs } from "@/db/schema";
import { forgetManifestObject, recordManifestObject } from "@/services/gallery";
import { getActiveHostedEndpoint, getDecryptedHostedApiKey } from "@/services/appSettings";
import { fetchInstagramEmbedVideo } from "@/services/instagram";
import { BROWSER_USER_AGENT, isPublicHttpUrl } from "@/services/metadata";
import { enqueueReelArchiveJob } from "@/services/reelArchiveQueue";
import { deleteObject, isObjectStoreConfigured, putObject } from "@/utils/objectStore";

export type ArchiveReelResult
  = InstagramReelArchive | "not_found" | "not_reel" | "not_configured" | "no_video" | "fetch_error";

/** Time budget for the Browserless navigate + extract step. */
const EXTRACT_TIMEOUT_MS = 30_000;
/** Time budget for downloading the MP4 (reels are short, but allow for slow CDNs / larger files). */
const VIDEO_FETCH_TIMEOUT_MS = 60_000;
/** Cap on the video bytes we'll buffer (a reel is stored, not streamed through, so memory matters). */
const MAX_VIDEO_BYTES = 200 * 1024 * 1024;

/** Object-storage key for a bookmark's reel archive. Stable per bookmark, so a re-archive overwrites it. */
function reelObjectKeyFor(bookmarkId: string): string {
  return `bookmarks/${bookmarkId}-reel.mp4`;
}

/** Version token embedded in the serving URL so a re-archive busts the browser cache. */
function reelVersion(row: { createdAt: Date | string }): number {
  const created = row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt);
  return created.getTime();
}

/** Map a stored reel-archive row to the shared wire type (used by routes and hydration). */
export function reelArchiveFromRow(row: BookmarkReelArchiveRow): InstagramReelArchive {
  return {
    url: `/api/bookmarks/${row.bookmarkId}/reel-archive?v=${reelVersion(row)}`,
    contentType: row.contentType,
    byteSize: row.byteSize,
    width: row.width,
    height: row.height,
    durationSeconds: row.durationSeconds,
    sourceUrl: row.sourceUrl,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  };
}

/** Read a bookmark's stored reel-archive row, or null when it has none. */
export async function getBookmarkReelArchiveRow(bookmarkId: string): Promise<BookmarkReelArchiveRow | null> {
  const [row] = await db.select().from(bookmarkReelArchives).where(
    eq(bookmarkReelArchives.bookmarkId, bookmarkId),
  );
  return row ?? null;
}

/** Delete a bookmark's reel archive (object + row). Returns whether one existed. */
export async function removeBookmarkReelArchive(bookmarkId: string): Promise<boolean> {
  const row = await getBookmarkReelArchiveRow(bookmarkId);
  if (!row) return false;
  await deleteObject(row.objectKey);
  await db.delete(bookmarkReelArchives).where(eq(bookmarkReelArchives.bookmarkId, bookmarkId));
  await forgetManifestObject(row.objectKey);
  return true;
}

/** The video URL + dimensions a Browserless extraction yields for a reel. */
export interface ExtractedReelVideo {
  videoUrl: string;
  width: number | null;
  height: number | null;
}

/**
 * Puppeteer body run inside Browserless: navigate the reel and return its public video URL from the
 * `og:video` meta tags (what link-unfurlers read) or a `<video>` element's https `src`. Kept free of
 * backslash-heavy regex so it survives JSON-stringification into the request body. Returns
 * `{ videoUrl, width, height }`.
 */
const EXTRACT_FUNCTION = `export default async ({ page, context }) => {
  await page.setUserAgent(${JSON.stringify(BROWSER_USER_AGENT)});
  await page.goto(context.url, { waitUntil: "networkidle2", timeout: 20000 });
  return await page.evaluate(() => {
    const meta = (p) => document.querySelector('meta[property="' + p + '"]')?.getAttribute("content") || null;
    const num = (v) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : null; };
    let videoUrl = meta("og:video:secure_url") || meta("og:video:url") || meta("og:video");
    if (!videoUrl) {
      const el = document.querySelector("video");
      const src = el && el.getAttribute("src");
      if (src && /^https?:/.test(src)) videoUrl = src;
    }
    return { videoUrl: videoUrl || null, width: num(meta("og:video:width")), height: num(meta("og:video:height")) };
  });
}`;

/**
 * Extract a reel's public video URL (+ dimensions) by driving the configured Browserless instance.
 * Returns null when Browserless is unconfigured, the request fails, or no video URL is exposed.
 * Never throws.
 */
export async function extractReelVideoUrl(reelUrl: string): Promise<ExtractedReelVideo | null> {
  const endpoint = await getActiveHostedEndpoint();
  if (!endpoint) return null;
  const token = await getDecryptedHostedApiKey();

  try {
    const res = await fetch(`${endpoint.replace(/\/$/, "")}/chromium/function`, {
      method: "POST",
      signal: AbortSignal.timeout(EXTRACT_TIMEOUT_MS),
      headers: {
        "Content-Type": "application/json",
        ...(token
          ? {
            Authorization: `Bearer ${token}`,
          }
          : {}),
      },
      body: JSON.stringify({
        code: EXTRACT_FUNCTION,
        context: {
          url: reelUrl,
        },
      }),
    });
    if (!res.ok) return null;
    const json = await res.json() as Record<string, unknown>;
    // Browserless returns the function's value at the top level; tolerate a `{ data: … }` wrapper too.
    const payload = (json.data && typeof json.data === "object")
      ? json.data as Record<string, unknown>
      : json;
    const videoUrl = payload.videoUrl;
    if (typeof videoUrl !== "string" || videoUrl.length === 0) return null;
    const dim = (v: unknown): number | null => (typeof v === "number" && v > 0 ? v : null);
    return {
      videoUrl,
      width: dim(payload.width),
      height: dim(payload.height),
    };
  }
  catch {
    return null;
  }
}

/**
 * Download an Instagram video URL into a Buffer, guarded by a timeout and a byte cap. Identifies as a
 * real browser and sends the reel page as `Referer` — Instagram's video CDN 403s requests without the
 * matching referer (hotlink protection). Returns null on any failure. Never throws.
 */
async function downloadVideo(url: string, referer: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(VIDEO_FETCH_TIMEOUT_MS),
      headers: {
        "User-Agent": BROWSER_USER_AGENT,
        "Accept": "video/mp4,video/*;q=0.9,*/*;q=0.5",
        "Referer": referer,
      },
    });
    if (!res.ok || !res.body) return null;
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;
    for (;;) {
      const {
        done, value,
      } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > MAX_VIDEO_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
    return Buffer.concat(chunks);
  }
  catch {
    return null;
  }
}

/**
 * Capture the bookmark's Instagram reel video and store it. Returns the wire shape on success, or a
 * sentinel: `"not_found"` (bookmark gone), `"not_reel"` (URL isn't an IG reel/tv permalink),
 * `"not_configured"` (object storage missing), `"no_video"` (no extractable video URL from either the
 * keyless embed or a configured Browserless instance), or `"fetch_error"` (the MP4 couldn't be
 * downloaded). Never throws.
 */
export async function archiveInstagramReel(bookmarkId: string): Promise<ArchiveReelResult> {
  const [bookmark] = await db.select({
    id: bookmarks.id,
    url: bookmarks.url,
  })
    .from(bookmarks).where(eq(bookmarks.id, bookmarkId));
  if (!bookmark) return "not_found";
  if (!bookmark.url || !isInstagramReelUrl(bookmark.url)) return "not_reel";
  if (!isObjectStoreConfigured()) return "not_configured";

  let extracted = await fetchInstagramEmbedVideo(bookmark.url);
  if (!extracted) {
    const endpoint = await getActiveHostedEndpoint();
    if (endpoint) extracted = await extractReelVideoUrl(bookmark.url);
  }
  if (!extracted || !isPublicHttpUrl(extracted.videoUrl)) return "no_video";

  const bytes = await downloadVideo(extracted.videoUrl, bookmark.url);
  if (!bytes || bytes.byteLength === 0) return "fetch_error";

  const objectKey = reelObjectKeyFor(bookmarkId);
  const contentType = "video/mp4";
  await putObject(objectKey, bytes, contentType);

  const values = {
    bookmarkId,
    objectKey,
    contentType,
    byteSize: bytes.byteLength,
    width: extracted.width,
    height: extracted.height,
    durationSeconds: null,
    sourceUrl: bookmark.url,
    createdAt: new Date(),
  };
  const [row] = await db
    .insert(bookmarkReelArchives)
    .values(values)
    .onConflictDoUpdate({
      target: bookmarkReelArchives.bookmarkId,
      set: values,
    })
    .returning();
  await recordManifestObject({
    objectKey,
    contentType,
    byteSize: bytes.byteLength,
    bookmarkId,
  });
  return reelArchiveFromRow(row);
}

// ---------------------------------------------------------------------------
// Background-job tracking — mirrors the import queue (queued → processing →
// complete | failed), so the on-demand capture runs off the request and its
// progress surfaces in the header progress indicator.
// ---------------------------------------------------------------------------

/** Human-readable failure reason for each non-success outcome of `archiveInstagramReel`. */
const FAILURE_REASONS: Record<Exclude<ArchiveReelResult, InstagramReelArchive>, string> = {
  not_found: "Bookmark not found.",
  not_reel: "This bookmark is not an Instagram reel.",
  not_configured: "Reel archiving is not configured.",
  no_video: "No reel video was found.",
  fetch_error: "The reel video could not be downloaded.",
};

/** Create a `reel_archive_jobs` row in `queued` state and return its full record. */
export async function createQueuedReelArchiveJob(bookmarkId: string): Promise<ReelArchiveJob> {
  const [row] = await db
    .insert(reelArchiveJobs)
    .values({
      bookmarkId,
      status: "queued",
    })
    .returning({
      id: reelArchiveJobs.id,
    });
  return (await getReelArchiveJob(row!.id))!;
}

/**
 * Run one queued reel-archive job: flip to `processing`, capture the reel, then mark `complete` or
 * `failed` (with a reason). Records its own outcome rather than throwing — it runs detached on the
 * background queue.
 */
export async function processReelArchiveJob(jobId: string, bookmarkId: string): Promise<void> {
  await db.update(reelArchiveJobs).set({
    status: "processing",
  }).where(eq(reelArchiveJobs.id, jobId));

  let result: ArchiveReelResult;
  try {
    result = await archiveInstagramReel(bookmarkId);
  }
  catch {
    result = "fetch_error";
  }

  const status: ReelArchiveJobStatus = typeof result === "string" ? "failed" : "complete";
  await db.update(reelArchiveJobs).set({
    status,
    errorReason: typeof result === "string" ? FAILURE_REASONS[result] : null,
  }).where(eq(reelArchiveJobs.id, jobId));
}

/**
 * Entry point for the on-demand action: create a queued job and enqueue its processing, returning the
 * queued record immediately so the request responds instantly. The capture runs on the FIFO queue.
 */
export async function queueReelArchive(bookmarkId: string): Promise<ReelArchiveJob> {
  const job = await createQueuedReelArchiveJob(bookmarkId);
  enqueueReelArchiveJob(() => processReelArchiveJob(job.id, bookmarkId));
  return job;
}

/** Read one reel-archive job's full record (with the bookmark title), or null when it's gone. */
export async function getReelArchiveJob(jobId: string): Promise<ReelArchiveJob | null> {
  const [row] = await db
    .select({
      id: reelArchiveJobs.id,
      bookmarkId: reelArchiveJobs.bookmarkId,
      status: reelArchiveJobs.status,
      errorReason: reelArchiveJobs.errorReason,
      bookmarkTitle: bookmarks.title,
    })
    .from(reelArchiveJobs)
    .leftJoin(bookmarks, eq(reelArchiveJobs.bookmarkId, bookmarks.id))
    .where(eq(reelArchiveJobs.id, jobId));
  if (!row) return null;
  return {
    id: row.id,
    bookmarkId: row.bookmarkId,
    bookmarkTitle: row.bookmarkTitle ?? "Bookmark",
    status: row.status as ReelArchiveJobStatus,
    errorReason: row.errorReason,
  };
}

/**
 * List the reel-archive jobs currently in flight (`queued`/`processing`), newest first. Powers the
 * header progress indicator, which polls this while any job is active.
 */
export async function listActiveReelArchiveJobs(): Promise<ActiveReelArchiveJob[]> {
  const rows = await db
    .select({
      id: reelArchiveJobs.id,
      bookmarkId: reelArchiveJobs.bookmarkId,
      status: reelArchiveJobs.status,
      bookmarkTitle: bookmarks.title,
    })
    .from(reelArchiveJobs)
    .leftJoin(bookmarks, eq(reelArchiveJobs.bookmarkId, bookmarks.id))
    .where(inArray(reelArchiveJobs.status, ["queued", "processing"]))
    .orderBy(desc(reelArchiveJobs.createdAt));
  return rows.map(row => ({
    id: row.id,
    bookmarkId: row.bookmarkId,
    bookmarkTitle: row.bookmarkTitle ?? "Bookmark",
    status: row.status as ReelArchiveJobStatus,
  }));
}

/**
 * Mark any reel-archive job left `queued`/`processing` as `failed` on boot — a restart abandons the
 * in-process worker, so those rows can never finish on their own. Idempotent; safe every boot.
 */
export async function resetStalledReelArchiveJobs(): Promise<number> {
  const rows = await db
    .update(reelArchiveJobs)
    .set({
      status: "failed",
      errorReason: "Reel archiving was interrupted by a server restart.",
    })
    .where(inArray(reelArchiveJobs.status, ["queued", "processing"]))
    .returning({
      id: reelArchiveJobs.id,
    });
  return rows.length;
}
