import { browser } from "wxt/browser";

/*
 * Host access. The manifest asks for no host permissions up front — only `activeTab` (the page the
 * user clicked the toolbar icon on) plus `optional_host_permissions` for http/https. The extension
 * requests exactly what it needs, when it needs it:
 *
 *   - the configured server's host, when the user saves the server URL (`requestServerAccess`);
 *   - an image's host, when Apply has to download an image from another site (`requestOriginsAccess`).
 *
 * Chrome only shows a permission prompt from inside a user gesture, so callers must start the request
 * synchronously in their click handler — before any `await`.
 */

/**
 * The match pattern for a URL's host, covering every port and path (`http://raspi/*` for
 * `http://raspi:3000`). Null for a URL that isn't http(s) or doesn't parse.
 */
export function hostPattern(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return `${parsed.protocol}//${parsed.hostname}/*`;
  }
  catch {
    return null;
  }
}

/** The distinct host patterns of the http(s) URLs in `urls`. */
export function hostPatterns(urls: readonly string[]): string[] {
  return [...new Set(urls.map(hostPattern).filter((p): p is string => p !== null))];
}

/** Whether the extension already holds host access to every pattern. */
export async function hasOriginsAccess(origins: string[]): Promise<boolean> {
  if (origins.length === 0) return true;
  try {
    return await browser.permissions.contains({
      origins,
    });
  }
  catch {
    return false;
  }
}

/**
 * Ask for host access to `origins` (a no-op `true` when none). Call from a click handler, before any
 * `await`, so the browser can show its prompt. Resolves false when the user declines.
 */
export function requestOriginsAccess(origins: string[]): Promise<boolean> {
  if (origins.length === 0) return Promise.resolve(true);
  return browser.permissions.request({
    origins,
  }).catch(() => false);
}

/** Ask for host access to the eeSimple server at `serverUrl` (see {@link requestOriginsAccess}). */
export function requestServerAccess(serverUrl: string): Promise<boolean> {
  const pattern = hostPattern(serverUrl);
  return pattern ? requestOriginsAccess([pattern]) : Promise.resolve(false);
}

/** Whether host access to the eeSimple server at `serverUrl` has been granted. */
export async function hasServerAccess(serverUrl: string): Promise<boolean> {
  const pattern = hostPattern(serverUrl);
  return pattern ? hasOriginsAccess([pattern]) : false;
}
