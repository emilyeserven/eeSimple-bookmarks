/**
 * Resolve a newsletter tracker/click-redirect URL to the real article URL by following redirects.
 *
 * Newsletter platforms (Beehiiv, Substack, Mailchimp, SendGrid, …) wrap every article link in a
 * click-tracking redirect. To save a clean, dedupe-friendly bookmark we follow the redirect chain to
 * its destination. The input is third-party content, so every hop is SSRF-guarded with
 * `isPublicHttpUrl` — we follow redirects **manually** (`redirect: "manual"`) because `"follow"`
 * would not re-check intermediate hops, letting a tracker 302 to a private address.
 */

import {
  getActiveHostedEndpoint,
  getDecryptedHostedApiKey,
} from "@/services/appSettings";
import { BROWSER_USER_AGENT, FETCH_TIMEOUT_MS, isPublicHttpUrl } from "@/services/metadata";

/** Max redirect hops to follow before giving up (a normal tracker is 1–2). */
const MAX_HOPS = 5;

/** Outcome of resolving a wrapped URL to its final destination. */
export type UnwrapResult
  = | { kind: "ok";
    finalUrl: string;
    redirected: boolean; }
    | { kind: "blocked" } // SSRF guard rejected the input or a redirect hop
    | { kind: "timeout" }
    | { kind: "http_error";
      status: number; }
      | { kind: "network_error" };

/** Single non-body request that does NOT auto-follow redirects, guarded by the shared timeout. */
async function probe(url: string, method: "HEAD" | "GET"): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      method,
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "User-Agent": BROWSER_USER_AGENT,
      },
    });
  }
  finally {
    clearTimeout(timeout);
  }
}

/** HEAD first, falling back to GET for servers that reject HEAD (405/501 or an outright failure). */
async function probeWithFallback(url: string): Promise<Response> {
  try {
    const res = await probe(url, "HEAD");
    if (res.status === 405 || res.status === 501) return probe(url, "GET");
    return res;
  }
  catch {
    return probe(url, "GET");
  }
}

/**
 * Follow `url`'s redirect chain (up to {@link MAX_HOPS}) and return its final destination. Each hop —
 * including the input — must pass `isPublicHttpUrl`, so a tracker that redirects to a private/loopback
 * address resolves to `{ kind: "blocked" }`. A non-redirect response ends the chain at the current URL.
 */
export async function unwrapRedirect(url: string): Promise<UnwrapResult> {
  if (!isPublicHttpUrl(url)) return {
    kind: "blocked",
  };

  let current = url;
  let redirected = false;
  try {
    for (let hop = 0; hop < MAX_HOPS; hop++) {
      const res = await probeWithFallback(current);

      // A 3xx with a Location header is a redirect we follow manually.
      const isRedirect = res.status >= 300 && res.status < 400;
      const location = res.headers.get("location");
      if (isRedirect && location) {
        const next = new URL(location, current).href; // resolve relative Location against current
        if (!isPublicHttpUrl(next)) return {
          kind: "blocked",
        };
        current = next;
        redirected = true;
        continue;
      }

      if (res.ok || (res.status >= 300 && res.status < 400)) {
        // Reached a non-redirect (or a redirect with no usable Location) — this is the destination.
        return {
          kind: "ok",
          finalUrl: current,
          redirected,
        };
      }
      return {
        kind: "http_error",
        status: res.status,
      };
    }
    // Hit the hop cap — return the furthest URL we reached rather than failing outright.
    return {
      kind: "ok",
      finalUrl: current,
      redirected,
    };
  }
  catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return {
      kind: "timeout",
    };
    return {
      kind: "network_error",
    };
  }
}

const BROWSERLESS_FUNCTION_TIMEOUT_MS = 20_000;

/**
 * Navigate `url` in a headless browser (via the configured Browserless instance) and return the
 * final URL after any JS redirects execute. Returns `null` when Browserless is not configured, the
 * request fails, or the page does not navigate away from `url`. Never throws.
 *
 * Use as a fallback for tracker URLs that use `window.location` / `meta refresh` redirects — HTTP
 * 200 followed by JS that navigates to the real article — which `unwrapRedirect`'s manual HTTP chain
 * cannot follow. Also catches bot-protected trackers that serve a JS challenge to plain HTTP clients.
 */
export async function unwrapWithBrowserless(url: string): Promise<string | null> {
  const endpoint = await getActiveHostedEndpoint();
  if (!endpoint) return null;
  const token = await getDecryptedHostedApiKey();

  try {
    const res = await fetch(`${endpoint.replace(/\/$/, "")}/chromium/function`, {
      method: "POST",
      signal: AbortSignal.timeout(BROWSERLESS_FUNCTION_TIMEOUT_MS),
      headers: {
        "Content-Type": "application/json",
        ...(token
          ? {
            Authorization: `Bearer ${token}`,
          }
          : {}),
      },
      body: JSON.stringify({
        code: `export default async ({ page, context }) => {
  await page.goto(context.url, { waitUntil: "networkidle2", timeout: 15000 });
  return { url: page.url() };
}`,
        context: {
          url,
        },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json() as unknown;
    const finalUrl = (data as Record<string, unknown>).url;
    if (typeof finalUrl !== "string" || finalUrl.length === 0) return null;
    // SSRF guard: reject any result that resolves to a private/loopback address.
    if (!isPublicHttpUrl(finalUrl)) return null;
    // Page didn't navigate — input URL was already the destination.
    if (finalUrl === url) return null;
    return finalUrl;
  }
  catch {
    return null;
  }
}

/**
 * Run `fn` over `items` with at most `limit` in flight at once. Used to bound the outbound fetches a
 * newsletter import makes (redirect unwrap + optional enrichment) so a 50-link newsletter doesn't
 * open 50 sockets at once. Results preserve input order.
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function worker(): Promise<void> {
    for (;;) {
      const index = next++;
      if (index >= items.length) return;
      results[index] = await fn(items[index]!, index);
    }
  }
  const workers = Array.from({
    length: Math.min(limit, items.length),
  }, () => worker());
  await Promise.all(workers);
  return results;
}
