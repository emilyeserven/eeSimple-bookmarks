/**
 * Server-side metadata fetching. The browser can't read arbitrary cross-origin
 * pages (CORS), so the title lookup for a bookmark URL has to happen here.
 */

import type { SocialLink } from "@eesimple/types";
import { socialAccountFromUrl } from "@eesimple/types";

import { processImage } from "@/utils/image";

export const FETCH_TIMEOUT_MS = 5000;
/** Cap the body we read so a huge response can't exhaust memory. */
const MAX_BYTES = 512 * 1024;
/**
 * A larger cap for pages whose data of interest lives in the body rather than the `<head>` (the
 * YouTube watch page embeds `ytInitialPlayerResponse` after `</head>`). Still bounded so a huge
 * response can't exhaust memory; callers stop early at a sentinel once they've read enough.
 */
const MAX_BODY_BYTES = 3 * 1024 * 1024;

/**
 * A mainstream-browser User-Agent. Some sites (notably YouTube) serve their full HTML — including
 * the `og:title`/`<title>` meta tags — to browsers, but a stripped or consent interstitial to bot
 * User-Agents, which has no title to extract. Identifying as a browser gets the real page. See #124.
 */
export const BROWSER_USER_AGENT
  = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    + "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

/**
 * The companion headers a real Chrome sends alongside its User-Agent. Anti-bot CDNs
 * (Cloudflare/DataDome and friends) increasingly 403 a request whose UA *claims* Chrome but whose
 * header set is bare — the mismatch between "I'm Chrome" and "I sent two headers" is itself the
 * detection signal, so a browser UA alone (issue #124) is no longer enough. Sending the consistent
 * client-hint + language set makes the request look like the browser the UA already claims to be,
 * which clears those 403s on otherwise-public pages (e.g. japan-guide.com). `Accept-Encoding` is
 * intentionally omitted so undici keeps managing compression and hands us a decoded body; the
 * request-specific `Accept` and `Sec-Fetch-*` headers are added per call site (document vs. image).
 */
const BROWSER_CLIENT_HINTS: Record<string, string> = {
  "User-Agent": BROWSER_USER_AGENT,
  "Accept-Language": "en-US,en;q=0.9",
  "Sec-Ch-Ua": "\"Chromium\";v=\"124\", \"Google Chrome\";v=\"124\", \"Not-A.Brand\";v=\"99\"",
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": "\"Windows\"",
};

/** Browser-consistent headers for a top-level document navigation (HTML fetch / reachability probe). */
export const BROWSER_DOCUMENT_HEADERS: Record<string, string> = {
  ...BROWSER_CLIENT_HINTS,
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
};

export type FetchTitleResult
  = | { kind: "ok";
    title: string; }
    | { kind: "timeout" }
    | { kind: "http_error";
      status: number; }
      | { kind: "no_body" }
      | { kind: "no_title" }
      | { kind: "network_error" };

const NAMED_ENTITIES: Record<string, string> = {
  "amp": "&",
  "lt": "<",
  "gt": ">",
  "quot": "\"",
  "apos": "'",
  "#39": "'",
};

/** Decode the small set of HTML entities that commonly appear inside <title>. */
export function decodeEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
    const lower = entity.toLowerCase();
    if (lower.startsWith("#x")) {
      const code = Number.parseInt(entity.slice(2), 16);
      return Number.isNaN(code) ? match : String.fromCodePoint(code);
    }
    if (lower.startsWith("#")) {
      const code = Number.parseInt(entity.slice(1), 10);
      return Number.isNaN(code) ? match : String.fromCodePoint(code);
    }
    return NAMED_ENTITIES[lower] ?? match;
  });
}

/** Pull the raw `<title>` element text out of an HTML document, or undefined when absent. */
function titleTag(html: string): string | undefined {
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  if (!match) return undefined;
  const inner = match[1] ?? "";
  // A CDATA-wrapped <title> is a feed/XML artifact, not a usable page title — skip it.
  if (/<!\[CDATA\[[\s\S]*?\]\]>/.test(inner)) return undefined;
  return inner;
}

/**
 * Pick the best page title from an HTML document. Prefers `og:title` / `twitter:title` (the
 * canonical, shareable title sites publish) and falls back to the `<title>` element. The `<title>`
 * tag commonly appends a site-name suffix (e.g. "Recipe • Just One Cookbook") and templating
 * artifacts, whereas `og:title` carries the clean title — so this mirrors how `extractImageUrl`
 * prefers `og:image`. Returns the normalised title, or null when none is usable.
 */
export function extractTitle(html: string): string | null {
  const candidates = [
    metaContent(html, /(?:property|name)=["']og:title["']/i),
    metaContent(html, /(?:property|name)=["']twitter:title["']/i),
    titleTag(html),
  ];
  for (const raw of candidates) {
    if (raw === undefined) continue;
    const title = decodeEntities(raw).replace(/\s+/g, " ").trim();
    if (title.length > 0) return title;
  }
  return null;
}

/** A low-level fetch result: the page HTML, or a typed reason it couldn't be read. */
export type FetchHtmlResult
  = | { kind: "ok";
    html: string; }
    | { kind: "timeout" }
    | { kind: "http_error";
      status: number; }
      | { kind: "no_body" }
      | { kind: "network_error" };

/**
 * Fetch `url` and return its leading HTML, stopping as soon as `stopAt` matches (or `maxBytes` is
 * hit). Reading incrementally lets the title/`<head>` parsers stop early instead of downloading the
 * whole page. Guarded by a timeout and a body cap; failures come back as typed kinds.
 */
async function fetchHtml(url: string, stopAt: RegExp, maxBytes = MAX_BYTES): Promise<FetchHtmlResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: BROWSER_DOCUMENT_HEADERS,
    });
    if (!res.ok) return {
      kind: "http_error",
      status: res.status,
    };
    if (!res.body) return {
      kind: "no_body",
    };

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let html = "";
    let received = 0;
    for (;;) {
      const {
        done, value,
      } = await reader.read();
      if (done) break;
      received += value.byteLength;
      html += decoder.decode(value, {
        stream: true,
      });
      if (stopAt.test(html) || received >= maxBytes) {
        await reader.cancel();
        break;
      }
    }
    return {
      kind: "ok",
      html,
    };
  }
  catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return {
        kind: "timeout",
      };
    }
    return {
      kind: "network_error",
    };
  }
  finally {
    clearTimeout(timeout);
  }
}

/**
 * Fetch `url` and return a typed result describing why the title could not be
 * obtained, or the title itself. Guarded by a timeout and a body cap.
 */
export async function fetchPageTitle(url: string): Promise<FetchTitleResult> {
  // Read through `</head>` rather than stopping at `</title>`: the `og:title`/`twitter:title` meta
  // tags `extractTitle` prefers are typically emitted after the `<title>` element.
  const result = await fetchHtml(url, /<\/head>/i);
  if (result.kind !== "ok") return result;
  const title = extractTitle(result.html);
  if (title === null) return {
    kind: "no_title",
  };
  return {
    kind: "ok",
    title,
  };
}

/** A reachability check result: the link resolved, or a typed reason it couldn't be reached. */
export type CheckUrlResult
  = | { kind: "ok";
    status: number; }
    | { kind: "http_error";
      status: number; }
      | { kind: "timeout" }
      | { kind: "network_error" };

/**
 * Probe `url` to see whether it still resolves, without downloading the page body. Tries a `HEAD`
 * first and falls back to `GET` for servers that reject HEAD (405/501 or an outright failure).
 * Guarded by the same timeout as the other fetches. Like `fetchPageTitle`, it hits the raw
 * user-entered URL (only `isValidUrl` upstream, not `isPublicHttpUrl`) so intranet/localhost
 * bookmarks stay checkable.
 */
export async function checkUrl(url: string): Promise<CheckUrlResult> {
  async function probe(method: "HEAD" | "GET"): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      return await fetch(url, {
        method,
        redirect: "follow",
        signal: controller.signal,
        headers: BROWSER_DOCUMENT_HEADERS,
      });
    }
    finally {
      clearTimeout(timeout);
    }
  }

  try {
    let res: Response;
    try {
      res = await probe("HEAD");
      // Some servers don't implement HEAD; retry once with GET before giving up.
      if (res.status === 405 || res.status === 501) {
        res = await probe("GET");
      }
    }
    catch {
      // A HEAD that throws (e.g. the method is refused at the connection level) — fall back to GET.
      res = await probe("GET");
    }
    return res.ok
      ? {
        kind: "ok",
        status: res.status,
      }
      : {
        kind: "http_error",
        status: res.status,
      };
  }
  catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return {
        kind: "timeout",
      };
    }
    return {
      kind: "network_error",
    };
  }
}

/** Cap on the image bytes we'll download (an image is stored, not streamed, so memory matters). */
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * Fetch a URL and return its leading HTML through `</head>`, or null on any failure. Exposed so
 * site-specific extractors (e.g. YouTube duration scraping) can reuse the same guarded,
 * early-stopping fetch as the title/image lookups.
 */
export async function fetchHeadHtml(url: string): Promise<string | null> {
  const result = await fetchHtml(url, /<\/head>/i);
  return result.kind === "ok" ? result.html : null;
}

/**
 * Fetch a page and return the typed `FetchHtmlResult` (rather than collapsing failures to `null`),
 * reading into the body up to `MAX_BODY_BYTES` and stopping at `stopAt`. Used by the YouTube
 * watch-page scrape, whose data of interest (`ytInitialPlayerResponse`, schema.org microdata) lives
 * after `</head>` — and which needs the *reason* a fetch failed so it can be surfaced, not swallowed.
 */
export async function fetchBodyHtmlResult(url: string, stopAt: RegExp): Promise<FetchHtmlResult> {
  return fetchHtml(url, stopAt, MAX_BODY_BYTES);
}

/** Find the `content` of the first `<meta>` tag whose attributes match `attrMatch`. */
export function metaContent(html: string, attrMatch: RegExp): string | undefined {
  for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
    if (!attrMatch.test(tag)) continue;
    const content = /content=["']([^"']*)["']/i.exec(tag);
    if (content?.[1]) return content[1];
  }
  return undefined;
}

/** Find the `href` of the first `<link>` tag whose attributes match `attrMatch`. */
function linkHref(html: string, attrMatch: RegExp): string | undefined {
  for (const [tag] of html.matchAll(/<link\b[^>]*>/gi)) {
    if (!attrMatch.test(tag)) continue;
    const href = /href=["']([^"']*)["']/i.exec(tag);
    if (href?.[1]) return href[1];
  }
  return undefined;
}

/** Find the `href` of every `<link>` tag whose attributes match `attrMatch`. */
function linkHrefs(html: string, attrMatch: RegExp): string[] {
  const results: string[] = [];
  for (const [tag] of html.matchAll(/<link\b[^>]*>/gi)) {
    if (!attrMatch.test(tag)) continue;
    const href = /href=["']([^"']*)["']/i.exec(tag);
    if (href?.[1]) results.push(href[1]);
  }
  return results;
}

/**
 * Pull the description from an HTML document's `<head>`. Prefers `og:description` /
 * `twitter:description` (canonical shareable summaries) and falls back to the standard
 * `<meta name="description">`. Mirrors the approach of `extractTitle`. Pure — unit-testable.
 */
export function extractDescription(html: string): string | null {
  const candidates = [
    metaContent(html, /(?:property|name)=["']og:description["']/i),
    metaContent(html, /(?:property|name)=["']twitter:description["']/i),
    metaContent(html, /name=["']description["']/i),
  ];
  for (const raw of candidates) {
    if (raw === undefined) continue;
    const desc = decodeEntities(raw).replace(/\s+/g, " ").trim();
    if (desc.length > 0) return desc;
  }
  return null;
}

/**
 * Pull author name(s) from an HTML document's `<head>`. Reads the Open Graph article author
 * (`og:article:author`) and the standard `<meta name="author">`. Returns a deduplicated list of
 * non-empty names, or an empty array when none are found. Pure — unit-testable like `extractTitle`.
 */
export function extractAuthorNames(html: string): string[] {
  const candidates = [
    metaContent(html, /(?:property|name)=["']og:article:author["']/i),
    metaContent(html, /name=["']author["']/i),
  ];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of candidates) {
    if (!raw) continue;
    const name = decodeEntities(raw).replace(/\s+/g, " ").trim();
    if (name.length > 0 && !seen.has(name)) {
      seen.add(name);
      result.push(name);
    }
  }
  return result;
}

/**
 * Pull the site/publisher name from an HTML document's `<head>` via `og:site_name`. Useful as a
 * proxy for publisher attribution when a dedicated `og:article:author` is absent. Pure —
 * unit-testable like `extractTitle`.
 */
export function extractPublisher(html: string): string | null {
  const raw = metaContent(html, /property=["']og:site_name["']/i);
  return raw ? decodeEntities(raw).trim() || null : null;
}

/**
 * Pull a representative image URL out of an HTML document's `<head>`: prefers Open Graph and
 * Twitter-card images, falling back to a declared icon. Relative URLs are resolved against
 * `pageUrl`. Returns an absolute http(s) URL or null. Pure — unit-testable like `extractTitle`.
 */
export function extractImageUrl(html: string, pageUrl: string): string | null {
  const candidates = [
    metaContent(html, /(?:property|name)=["']og:image(?::url)?["']/i),
    metaContent(html, /name=["']twitter:image(?::src)?["']/i),
    linkHref(html, /rel=["'][^"']*\b(?:apple-touch-icon|shortcut icon|icon)\b[^"']*["']/i),
  ];
  for (const raw of candidates) {
    if (!raw) continue;
    const decoded = decodeEntities(raw).trim();
    if (!decoded) continue;
    try {
      const resolved = new URL(decoded, pageUrl);
      if (resolved.protocol === "http:" || resolved.protocol === "https:") return resolved.href;
    }
    catch {
      // Skip a malformed candidate and try the next one.
    }
  }
  return null;
}

/**
 * Pull a site's favicon URL out of an HTML document's `<head>`. Unlike `extractImageUrl` (which
 * prefers the large `og:image` share card), this prefers declared icon links — highest-quality
 * first (`apple-touch-icon` is typically a 180px PNG) — and only falls back to `og:image` when a
 * page declares no icon at all. Relative URLs are resolved against `pageUrl`. Returns an absolute
 * http(s) URL or null. Pure — unit-testable like `extractImageUrl`.
 */
export function extractFaviconUrl(html: string, pageUrl: string): string | null {
  const candidates = [
    linkHref(html, /rel=["'][^"']*\bapple-touch-icon\b[^"']*["']/i),
    // Matches both `rel="icon"` and `rel="shortcut icon"`.
    linkHref(html, /rel=["'][^"']*\bicon\b[^"']*["']/i),
    metaContent(html, /(?:property|name)=["']og:image(?::url)?["']/i),
  ];
  for (const raw of candidates) {
    if (!raw) continue;
    const decoded = decodeEntities(raw).trim();
    if (!decoded) continue;
    try {
      const resolved = new URL(decoded, pageUrl);
      if (resolved.protocol === "http:" || resolved.protocol === "https:") return resolved.href;
    }
    catch {
      // Skip a malformed candidate and try the next one.
    }
  }
  return null;
}

/**
 * Pull all favicon candidate URLs out of an HTML document's `<head>`, ordered by preference:
 * apple-touch-icons first, then all `rel="icon"` links, then `og:image`. Relative URLs are
 * resolved against `pageUrl`. Returns an ordered, deduped list of absolute http(s) URLs. Pure —
 * unit-testable like `extractFaviconUrl`.
 */
export function extractFaviconUrls(html: string, pageUrl: string): string[] {
  const rawCandidates: (string | undefined)[] = [
    ...linkHrefs(html, /rel=["'][^"']*\bapple-touch-icon\b[^"']*["']/i),
    ...linkHrefs(html, /rel=["'][^"']*\bicon\b[^"']*["']/i),
    metaContent(html, /(?:property|name)=["']og:image(?::url)?["']/i),
  ];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of rawCandidates) {
    if (!raw) continue;
    const decoded = decodeEntities(raw).trim();
    if (!decoded) continue;
    try {
      const resolved = new URL(decoded, pageUrl);
      if (
        (resolved.protocol === "http:" || resolved.protocol === "https:")
        && !seen.has(resolved.href)
      ) {
        seen.add(resolved.href);
        result.push(resolved.href);
      }
    }
    catch {
      // Skip malformed candidates.
    }
  }
  return result;
}

/**
 * The DuckDuckGo icon-service URL for a domain — an instant favicon without scraping or object
 * storage. Used as a display fallback (in `/api/scan`) and as a last-resort image source when a site
 * declares no usable icon. Note: requesting it leaks the bookmarked domain to DuckDuckGo (acceptable —
 * the same as fetching the site's own favicon directly), so it is not gated.
 */
export function duckDuckGoIconUrl(domain: string): string {
  return `https://icons.duckduckgo.com/ip3/${encodeURIComponent(domain)}.ico`;
}

/**
 * Reject non-http(s) URLs and obvious internal/loopback/private hosts. The image URL comes from a
 * third-party page, so it's treated as untrusted to limit SSRF on a private network.
 */
export function isPublicHttpUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  }
  catch {
    return false;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;

  // `url.hostname` returns IPv6 literals bracketed (e.g. "[::1]"); strip them for comparison.
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return false;

  // IPv6 literals contain a colon — block loopback (::1) and unique-local/link-local ranges.
  if (host.includes(":")) {
    return !(host === "::1" || /^f[cd]/.test(host) || host.startsWith("fe80:"));
  }

  // IPv4 literals — block loopback, private, and link-local ranges.
  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.\d{1,3}$/.exec(host);
  if (ipv4) {
    const a = Number(ipv4[1]);
    const b = Number(ipv4[2]);
    if (a === 0 || a === 10 || a === 127) return false;
    if (a === 169 && b === 254) return false;
    if (a === 192 && b === 168) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
  }
  return true;
}

/** Typed outcome of an og:image fetch attempt. */
export type OgImageResult = Buffer | "fetch_error" | "blocked" | "server_error" | "no_image" | "bad_image";

/**
 * Download an image URL into a Buffer, classifying *why* a failure happened instead of collapsing
 * every non-2xx/network/cap failure to one outcome — a CDN rate-limit or 5xx is transient (worth
 * `withTransientRetry`'s one retry) and is a different problem than bytes that downloaded fine but
 * can't be decoded (`bad_image`, determined later by `processImage`). Shared by `downloadImage`
 * (callers that only care whether bytes came back) and `fetchOgImage` (which needs the reason).
 *
 * Identifies as a real browser (the same `BROWSER_USER_AGENT` used for the HTML fetch) rather than a
 * bot UA: CDNs in front of high-traffic sites (Cloudflare/Mediavine, and YouTube's own image CDN)
 * routinely 403 or rate-limit non-browser User-Agents on image assets even though the page parsed
 * fine. When the calling page's URL is known it's passed as `referer` to defeat hotlink protection.
 *
 * The content-type is intentionally *not* gated here: some CDNs serve images as
 * `application/octet-stream` or omit the header, and `processImage` (sharp) is the real validator
 * downstream, so a pre-check would only add false negatives.
 */
async function downloadImageResult(
  url: string,
  referer?: string,
): Promise<Buffer | "fetch_error" | "blocked" | "server_error"> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        ...BROWSER_CLIENT_HINTS,
        "Accept": "image/avif,image/webp,image/png,image/svg+xml,image/*;q=0.8,*/*;q=0.5",
        "Sec-Fetch-Dest": "image",
        "Sec-Fetch-Mode": "no-cors",
        "Sec-Fetch-Site": "cross-site",
        ...(referer
          ? {
            Referer: referer,
          }
          : {}),
      },
    });
    if (!res.ok) return res.status >= 500 ? "server_error" : "blocked";
    if (!res.body) return "fetch_error";

    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;
    for (;;) {
      const {
        done, value,
      } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > MAX_IMAGE_BYTES) {
        await reader.cancel();
        return "fetch_error";
      }
      chunks.push(value);
    }
    return Buffer.concat(chunks);
  }
  catch {
    return "fetch_error";
  }
  finally {
    clearTimeout(timeout);
  }
}

/**
 * Download an image URL into a Buffer, guarded by a timeout and a byte cap. Thin wrapper over
 * {@link downloadImageResult} for callers (favicon candidate loops, oEmbed thumbnails) that only
 * need to know whether bytes came back, not why a failure happened.
 */
export async function downloadImage(url: string, referer?: string): Promise<Buffer | null> {
  const result = await downloadImageResult(url, referer);
  return typeof result === "string" ? null : result;
}

/**
 * The non-buffer outcomes of an entity-image grab — a typed reason no image could be stored. Shared
 * by the website-favicon and YouTube-channel-avatar services so the outcome shape stays consistent.
 */
export type EntityImageGrabError = Exclude<OgImageResult, Buffer>;

/** A successful grab returns the cache-busting serving URL; otherwise a typed failure. */
export type EntityImageResult = { imageUrl: string } | "not_found" | EntityImageGrabError;

/**
 * Fetch a page's `<head>` HTML, returning the html string or an `OgImageResult` error.
 * Centralises the error-kind → result-string mapping shared by `fetchOgImage` and `fetchFaviconImage`.
 */
async function fetchHeadOrImageError(pageUrl: string): Promise<string | Extract<OgImageResult, string>> {
  const result = await fetchHtml(pageUrl, /<\/head>/i);
  if (result.kind === "timeout" || result.kind === "network_error" || result.kind === "no_body") {
    return "fetch_error";
  }
  if (result.kind === "http_error") {
    return result.status >= 500 ? "server_error" : "blocked";
  }
  return result.html;
}

/**
 * Fetch the page at `pageUrl`, find its preview image (og:image / twitter:image / icon), download
 * it, and return the raw bytes — or a typed error string describing why it failed. The download
 * failure reason comes straight from `downloadImageResult` (`blocked` / `server_error` /
 * `fetch_error`); `bad_image` is reserved for bytes that *did* download but failed to decode
 * (determined downstream by `processImage`) — never collapsed onto a download failure, since only
 * the former feeds `withTransientRetry`'s retry.
 */
export async function fetchOgImage(pageUrl: string): Promise<OgImageResult> {
  const html = await fetchHeadOrImageError(pageUrl);
  if (typeof html !== "string") return html;
  const imageUrl = extractImageUrl(html, pageUrl);
  if (!imageUrl || !isPublicHttpUrl(imageUrl)) return "no_image";
  return downloadImageResult(imageUrl, pageUrl);
}

/**
 * Run `fn` once; if the result is a transient error (`"blocked"` or `"fetch_error"`), wait
 * `delayMs` and try once more. Used by the website-favicon and YouTube-channel-avatar services so
 * their retry logic doesn't have to be duplicated.
 */
export async function withTransientRetry(
  fn: () => Promise<OgImageResult>,
  delayMs = 2_000,
): Promise<OgImageResult> {
  const first = await fn();
  if (first === "blocked" || first === "fetch_error") {
    await new Promise<void>(r => setTimeout(r, delayMs));
    return fn();
  }
  return first;
}

/**
 * Fetch the page at `pageUrl`, find its favicon (icon links, then `og:image`), download and
 * validate each candidate in order, and return the raw bytes of the first decodable image — or a
 * typed error. Trying all candidates (instead of only the first) lets the pipeline skip formats
 * Sharp can't decode (e.g. SVG without librsvg) and fall through to the next option rather than
 * immediately returning `bad_image`.
 */
export async function fetchFaviconImage(pageUrl: string): Promise<OgImageResult> {
  const html = await fetchHeadOrImageError(pageUrl);
  if (typeof html !== "string") return html;

  const candidates = extractFaviconUrls(html, pageUrl);
  // Append the well-known conventional location every browser probes as a final fallback.
  try {
    const ico = new URL("/favicon.ico", pageUrl).href;
    if (!candidates.includes(ico)) candidates.push(ico);
  }
  catch {
    // ignore
  }

  if (candidates.length === 0) return "no_image";
  for (const iconUrl of candidates) {
    if (!isPublicHttpUrl(iconUrl)) continue;
    const bytes = await downloadImage(iconUrl, pageUrl);
    if (!bytes) continue;
    // Validate the bytes are decodable before returning; skips SVG or corrupted icons so the
    // loop can try the next candidate instead of surfacing bad_image immediately.
    const valid = await processImage(bytes);
    if (!valid) continue;
    return bytes;
  }
  return "bad_image";
}

/**
 * Scan an HTML document for `<a href>` links to recognizable social profiles (Instagram, X,
 * Facebook, LinkedIn, GitHub, Bluesky, Goodreads) and return the first match for each platform as a
 * `SocialLink`. Relative URLs are resolved against `pageUrl`; each candidate is funnelled through
 * the shared `socialAccountFromUrl` parser so the URL-shape rules live in one place. Pure —
 * unit-testable like `extractTitle`.
 */
export function extractSocialProfileLinks(html: string, pageUrl: string): SocialLink[] {
  const links: SocialLink[] = [];
  const seen = new Set<string>();

  for (const [, rawHref] of html.matchAll(/href=["']([^"']+)["']/gi)) {
    if (!rawHref) continue;
    let absolute: string;
    try {
      absolute = new URL(rawHref, pageUrl).toString();
    }
    catch {
      continue;
    }
    const ref = socialAccountFromUrl(absolute);
    if (!ref || seen.has(ref.platform)) continue;
    links.push({
      platform: ref.platform,
      url: ref.profileUrl,
    });
    seen.add(ref.platform);
  }

  return links;
}
