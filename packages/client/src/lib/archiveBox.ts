/**
 * Link-out URL builders for the ArchiveBox connector. ArchiveBox archives by URL and serves a
 * searchable public index, so we don't store per-bookmark snapshot ids — we link to the index
 * pre-searched to the bookmark's URL (view) and to the add view (archive now). No token is sent;
 * the user's browser opens these against their own ArchiveBox instance.
 */

/** Trim a trailing slash so we can append our own path segment cleanly. */
function trimTrailingSlash(baseUrl: string): string {
  return baseUrl.replace(/\/$/, "");
}

/** ArchiveBox public-index search for `url` — shows the archived snapshot(s) of that URL. */
export function archiveSearchUrl(baseUrl: string, url: string): string {
  return `${trimTrailingSlash(baseUrl)}/?q=${encodeURIComponent(url)}`;
}

/** ArchiveBox add view pre-filled with `url` — triggers a fresh archive of that URL. */
export function archiveAddUrl(baseUrl: string, url: string): string {
  return `${trimTrailingSlash(baseUrl)}/add?url=${encodeURIComponent(url)}`;
}
