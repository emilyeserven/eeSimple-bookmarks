/**
 * Candidate URL resolution leaf: unwrap a raw extracted link through trackers/redirects, canonicalize
 * it, collapse duplicates that land on the same canonical URL, and pre-mark a resolved candidate as a
 * duplicate when it already exists as a bookmark. Shared by the ingest pipeline
 * (`importPipeline.ts`'s `processImport`) and the single-item re-resolve path
 * (`importPipeline.ts`'s `recheckImportItemUrl`) — pulled out on its own so those two call sites don't
 * need to depend on each other.
 */

import type { ImportItemStatus } from "@eesimple/types";
import { canonicalize } from "@eesimple/types";
import { checkBookmarkUrlDuplicate } from "@/services/bookmarks";
import type { LinkCandidate } from "@/services/newsletterIngest";
import { unwrapRedirect, unwrapWithBrowserless } from "@/services/redirectUnwrap";
import type { listWebsites } from "@/services/websites";

/** A candidate after redirect-unwrap + canonicalize, ready to stage. */
export interface ResolvedCandidate {
  rawUrl: string;
  anchorText: string;
  url: string | null;
  status: ImportItemStatus;
  errorReason: string | null;
  /** The surrounding source passage (paragraph + nearest heading), carried from extraction. */
  context: string | null;
}

/** True when `url`'s hostname (minus leading www.) matches any entry in `ignoreList`. */
function isRedirectIgnored(url: string, ignoreList: string[]): boolean {
  if (ignoreList.length === 0) return false;
  try {
    const hostname = new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
    return ignoreList.some(d => hostname === d || hostname.endsWith(`.${d}`));
  }
  catch {
    return false;
  }
}

/** Unwrap a candidate's tracker URL and canonicalize the destination. Falls back to the raw URL on a
 * non-security failure so a slow/blocking article server doesn't drop the link; only an SSRF block
 * marks the row as an error. Skips unwrapping if the URL's domain is in `redirectIgnoreList`.
 *
 * `opts.browserlessFallback` — when true, also tries Browserless when HTTP returns a 200 without
 * following any redirect (JS-redirect trackers like Beehiiv) in addition to HTTP-error cases. Pass
 * this for single-URL explicit retry paths where latency is acceptable; leave it off for bulk imports. */
export async function resolveCandidate(
  candidate: LinkCandidate,
  data: { mode: "trackers";
    websites: Awaited<ReturnType<typeof listWebsites>>;
    ignoreList: string[];
    redirectIgnoreList: string[];
    customStripParams: string[]; },
  opts?: { browserlessFallback?: boolean },
): Promise<ResolvedCandidate> {
  if (isRedirectIgnored(candidate.rawUrl, data.redirectIgnoreList)) {
    return {
      rawUrl: candidate.rawUrl,
      anchorText: candidate.anchorText,
      url: canonicalize(candidate.rawUrl, data).url,
      status: "pending",
      errorReason: null,
      context: candidate.context,
    };
  }
  const result = await unwrapRedirect(candidate.rawUrl);
  if (result.kind === "blocked") {
    return {
      rawUrl: candidate.rawUrl,
      anchorText: candidate.anchorText,
      url: null,
      status: "error",
      errorReason: "Link redirected to a blocked (private) address.",
      context: candidate.context,
    };
  }

  let destination: string;
  if (result.kind === "ok" && result.redirected) {
    // HTTP redirect chain followed — destination is confirmed, no Browserless needed.
    destination = result.finalUrl;
  }
  else {
    // HTTP returned 200 without a redirect (possible JS-redirect tracker) or an HTTP error
    // (bot detection). Try Browserless when: the caller requested full fallback, OR the server
    // returned an HTTP error (clearest signal the plain-HTTP path is being blocked).
    const shouldTryBrowserless = opts?.browserlessFallback === true
      || result.kind === "http_error";
    if (shouldTryBrowserless) {
      const browserlessUrl = await unwrapWithBrowserless(candidate.rawUrl);
      destination = browserlessUrl ?? (result.kind === "ok" ? result.finalUrl : candidate.rawUrl);
    }
    else {
      destination = result.kind === "ok" ? result.finalUrl : candidate.rawUrl;
    }
  }

  return {
    rawUrl: candidate.rawUrl,
    anchorText: candidate.anchorText,
    url: canonicalize(destination, data).url,
    status: "pending",
    errorReason: null,
    context: candidate.context,
  };
}

/** Collapse candidates that resolved to the same canonical URL, keeping the richest anchor text. */
export function dedupeResolved(items: ResolvedCandidate[]): ResolvedCandidate[] {
  const byUrl = new Map<string, ResolvedCandidate>();
  const passthrough: ResolvedCandidate[] = [];
  for (const item of items) {
    if (item.url === null) {
      passthrough.push(item); // errored rows always kept (each is distinct)
      continue;
    }
    const existing = byUrl.get(item.url);
    if (!existing) byUrl.set(item.url, item);
    else {
      byUrl.set(item.url, {
        ...existing,
        anchorText: item.anchorText.length > existing.anchorText.length ? item.anchorText : existing.anchorText,
        context: existing.context ?? item.context,
      });
    }
  }
  return [...byUrl.values(), ...passthrough];
}

/** Pre-mark a resolved candidate as a duplicate when its URL already exists as a bookmark. */
export async function withDuplicateFlag(item: ResolvedCandidate): Promise<{
  item: ResolvedCandidate;
  duplicateBookmarkId: string | null;
}> {
  if (item.url === null || item.status !== "pending") return {
    item,
    duplicateBookmarkId: null,
  };
  const dup = await checkBookmarkUrlDuplicate(item.url);
  const match = dup.exactMatch ?? dup.pathMatch;
  if (match) return {
    item: {
      ...item,
      status: "duplicate",
    },
    duplicateBookmarkId: match.id,
  };
  return {
    item,
    duplicateBookmarkId: null,
  };
}
