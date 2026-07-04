/**
 * Link-out URL builder and display helpers for the Plex connector. A linked bookmark stores the
 * item's `ratingKey`, and the deep link opens the item's page in Plex's web UI on the operator's own
 * server. No token is sent; the user's browser opens this against their own Plex instance. The web
 * UI deep link needs the server's `machineIdentifier` (resolved server-side and returned by
 * `GET /api/connectors`).
 */

/** Plex web-UI item page for a linked bookmark (opens on the configured server host). */
export function plexItemUrl(baseUrl: string, machineIdentifier: string, ratingKey: string): string {
  const key = encodeURIComponent(`/library/metadata/${ratingKey}`);
  return `${baseUrl.replace(/\/$/, "")}/web/index.html#!/server/${machineIdentifier}/details?key=${key}`;
}
