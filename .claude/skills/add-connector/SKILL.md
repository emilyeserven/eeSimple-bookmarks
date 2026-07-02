---
name: add-connector
description: >-
  Add a new metadata connector (a keyless oEmbed provider, or an external metadata/ISBN/image data
  source) to the Add Bookmark prefill pipeline in eeSimple Bookmarks. Use when asked to "add an
  oEmbed provider", "support metadata from site X", "add a new data source for scanning", "add a
  metadata API", "wire a new connector into /api/scan", or "add a provider to the Connectors page".
  Also covers maintaining connectors — "the X provider broke / changed its endpoint", "rotate/remove a connector", "update a provider's URL".
  Mirrors how Vimeo/Spotify/TikTok (oEmbed), Open Library → Google Books (ISBN), and the hosted
  provider / YouTube Data API (Tier 2) were added.
---

# Add a metadata connector

Connectors feed the Add Bookmark scan. The pipeline runs server-side and favors **keyless,
self-hostable** sources; off-box calls that need a key are **Tier 2 — env-gated, default off**.
Pick the case that matches and follow it. See the **"Metadata fetching & connectors"** section of
`CLAUDE.md` for the architecture.

## Case A — a new keyless oEmbed provider (most common)

A site that exposes an oEmbed endpoint. **One edit:** add it to the registry.

1. In `packages/types/src/oembed.ts`, add an entry to `OEMBED_PROVIDERS`:
   ```ts
   {
     name: "Bandcamp",
     matches: url => hostMatches(url, ["bandcamp.com"]),
     endpoint: url => jsonEndpoint("https://bandcamp.com/api/oembed", url),
   },
   ```
   `hostMatches` / `jsonEndpoint` are the shared helpers in that file. The host list matches the host
   **and** its subdomains.

That's it. The provider now flows everywhere automatically: `services/oembed.ts`'s `fetchOEmbedForUrl`
resolves it in `buildGenericMetadataResult` (`routes/metadata.ts`) and in `GET /api/scan`; image
auto-capture (`fetchAndStoreOgImage` → `fetchOEmbedThumbnail`) uses its thumbnail; and the
**Settings → Connectors** page lists it (it maps over `OEMBED_PROVIDERS`). **Do not** hand-list the
provider anywhere else.

- **Test:** add a `findOEmbedProvider` case in `packages/middleware/src/tests/oembed.test.ts`.
- A site with **no static endpoint but a `<link rel="oembed">` tag** needs *no* registry entry —
  `fetchOEmbedForUrl` autodiscovers it from the head HTML already fetched.

## Case B — a fallback data source for an existing lookup (e.g. another ISBN provider)

Mirror the Open Library → Google Books chain in `services/isbn.ts`:

1. Add `fetchMyProvider(isbn): Promise<IsbnLookupOutcome>` returning `{ kind: "ok", result } |
   { kind: "not_found" } | { kind: "error" }` (so the route can tell 404 from 502).
2. Slot it into the chain in `fetchIsbnMetadata` (first usable result wins; `not_found` from any
   provider → 404; all `error` → 502).
3. Test the chain in `packages/middleware/src/tests/isbn.test.ts` by stubbing `global.fetch` per host.

The route (`routes/metadata.ts`) is unchanged — it already maps the outcome.

## Case C — a Tier 2 (keyed / off-box) provider

For anything that sends URLs to a third party or needs an API key. **Default off, env-gated, with a
keyless fallback** — mirror `services/hostedMetadata.ts` and the YouTube Data API path in
`services/youtube.ts`.

1. New `services/<provider>.ts`: an `xEnabled()` helper = `Boolean(process.env.X_ENDPOINT_OR_KEY)`
   (mirror `isObjectStoreConfigured()`), and `fetchX(url)` returning normalized fields or `null` on
   failure/off. SSRF-guard any returned image/URL via `isPublicHttpUrl`.
2. Wire it where it belongs (e.g. into `buildGenericMetadataResult` for page metadata): call it only
   `if (xEnabled())`, and **always fall back** to the keyless path when it returns `null`.
3. **Keys are secrets → env vars only, never the unauthenticated `app_settings` API.** Document the
   vars in the `CLAUDE.md` env table, `packages/middleware/.env.example`, and `README.md`, marked
   "optional, default off".
4. Report status (no secrets) from `routes/connectors.ts` `GET /api/connectors` (`ConnectorsStatus`
   in `@eesimple/types`) and add a card with a live badge in `components/ConnectorsSettings.tsx`.
   Cover the enabled/disabled flag in `tests/connectors.test.ts` and the service in its own test.

## Don't

- Don't add a separate client→server round-trip for a connector — it plugs into the single
  `/api/scan` page fetch (and the granular `/api/fetch-metadata`).
- Don't hand-list oEmbed providers outside `OEMBED_PROVIDERS`.
- Don't wire `services/scanCache.ts` into `invalidateBookmarkCache()` — scan data is display-only.
- Don't fetch a client-supplied image URL for capture — `fetchAndStoreOgImage` derives it from the
  bookmark's own stored URL (SSRF-safe).

## Maintaining an existing connector

- **oEmbed provider changed its endpoint/domains**: `OEMBED_PROVIDERS` in
  `packages/types/src/oembed.ts` is the single edit point — the middleware and the Connectors
  settings page both derive from it. Update `oembed.test.ts` fixtures alongside.
- **Removing a provider**: delete its registry entry (Case A) or its service + env rows (Case C);
  the Connectors page updates by derivation. For Tier 2, also remove the env vars from
  CLAUDE.md's table and `.env.example`, and the encrypted-key read/write pair in
  `services/appSettings.ts` if it had one.
- **Key rotation / outage**: keyed providers must keep falling back to the keyless path when the
  key stops resolving — if a report says scans hang on a dead provider, check the timeout + fallback
  in its service before touching the pipeline. Stale scan metadata self-heals via the
  `scanCache.ts` TTL; never wire the cache into bookmark invalidation.
