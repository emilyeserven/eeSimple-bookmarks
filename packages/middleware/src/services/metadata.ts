/**
 * Server-side metadata fetching. The browser can't read arbitrary cross-origin
 * pages (CORS), so the title lookup for a bookmark URL has to happen here.
 */

const FETCH_TIMEOUT_MS = 5000;
/** Cap the body we read so a huge response can't exhaust memory. */
const MAX_BYTES = 512 * 1024;

/**
 * A mainstream-browser User-Agent. Some sites (notably YouTube) serve their full HTML — including
 * the `og:title`/`<title>` meta tags — to browsers, but a stripped or consent interstitial to bot
 * User-Agents, which has no title to extract. Identifying as a browser gets the real page. See #124.
 */
const BROWSER_USER_AGENT
  = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    + "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

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
  return match ? match[1] : undefined;
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
type FetchHtmlResult
  = | { kind: "ok";
    html: string; }
    | { kind: "timeout" }
    | { kind: "http_error";
      status: number; }
      | { kind: "no_body" }
      | { kind: "network_error" };

/**
 * Fetch `url` and return its leading HTML, stopping as soon as `stopAt` matches (or the body cap is
 * hit). Reading incrementally lets the title/`<head>` parsers stop early instead of downloading the
 * whole page. Guarded by a timeout and a body cap; failures come back as typed kinds.
 */
async function fetchHtml(url: string, stopAt: RegExp): Promise<FetchHtmlResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": BROWSER_USER_AGENT,
        "Accept": "text/html,application/xhtml+xml",
      },
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
      if (stopAt.test(html) || received >= MAX_BYTES) {
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
        headers: {
          "User-Agent": BROWSER_USER_AGENT,
        },
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

/** Download an image URL into a Buffer, guarded by a timeout, content-type check, and byte cap. */
export async function downloadImage(url: string): Promise<Buffer | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "eeSimple-bookmarks/0.1 (+image-fetch)",
        "Accept": "image/*",
      },
    });
    if (!res.ok || !res.body) return null;
    if (!(res.headers.get("content-type") ?? "").toLowerCase().startsWith("image/")) return null;

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
        return null;
      }
      chunks.push(value);
    }
    return Buffer.concat(chunks);
  }
  catch {
    return null;
  }
  finally {
    clearTimeout(timeout);
  }
}

/** Typed outcome of an og:image fetch attempt. */
export type OgImageResult = Buffer | "fetch_error" | "blocked" | "server_error" | "no_image" | "bad_image";

/**
 * The non-buffer outcomes of an entity-image grab — a typed reason no image could be stored. Shared
 * by the website-favicon and YouTube-channel-avatar services so the outcome shape stays consistent.
 */
export type EntityImageGrabError = Exclude<OgImageResult, Buffer>;

/** A successful grab returns the cache-busting serving URL; otherwise a typed failure. */
export type EntityImageResult = { imageUrl: string } | "not_found" | EntityImageGrabError;

/**
 * Fetch the page at `pageUrl`, find its preview image (og:image / twitter:image / icon), download
 * it, and return the raw bytes — or a typed error string describing why it failed.
 */
export async function fetchOgImage(pageUrl: string): Promise<OgImageResult> {
  const result = await fetchHtml(pageUrl, /<\/head>/i);
  if (result.kind === "timeout" || result.kind === "network_error" || result.kind === "no_body") {
    return "fetch_error";
  }
  if (result.kind === "http_error") {
    return result.status >= 500 ? "server_error" : "blocked";
  }
  const imageUrl = extractImageUrl(result.html, pageUrl);
  if (!imageUrl || !isPublicHttpUrl(imageUrl)) return "no_image";
  const bytes = await downloadImage(imageUrl);
  return bytes ?? "bad_image";
}

/**
 * Fetch the page at `pageUrl`, find its favicon (icon link, then `og:image`), download it, and
 * return the raw bytes — or a typed error. Mirrors `fetchOgImage` but prefers declared icons via
 * `extractFaviconUrl`, and as a last resort tries the conventional `/favicon.ico`.
 */
export async function fetchFaviconImage(pageUrl: string): Promise<OgImageResult> {
  const result = await fetchHtml(pageUrl, /<\/head>/i);
  if (result.kind === "timeout" || result.kind === "network_error" || result.kind === "no_body") {
    return "fetch_error";
  }
  if (result.kind === "http_error") {
    return result.status >= 500 ? "server_error" : "blocked";
  }
  let iconUrl = extractFaviconUrl(result.html, pageUrl);
  if (!iconUrl) {
    // Last resort: the well-known conventional location every browser probes.
    try {
      iconUrl = new URL("/favicon.ico", pageUrl).href;
    }
    catch {
      return "no_image";
    }
  }
  if (!isPublicHttpUrl(iconUrl)) return "no_image";
  const bytes = await downloadImage(iconUrl);
  return bytes ?? "bad_image";
}
