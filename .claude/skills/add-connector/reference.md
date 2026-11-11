# Reference: moved from CLAUDE.md

These sections were moved verbatim out of the root `CLAUDE.md` when it was slimmed to an index. Mentions of "CLAUDE.md → <section>" elsewhere (code comments, other skills) refer to the sections below.

## Metadata fetching & connectors

The Add Bookmark form auto-fills metadata by scanning a URL/ISBN through a small set of external
"connectors". The pipeline favors keyless, self-hostable sources; the only off-box calls that require
configuration are explicitly opt-in (Tier 2, below).

- **One consolidated scan, not many round-trips.** `GET /api/scan` (`routes/metadata.ts`) resolves
  redirects, then in **one page fetch** returns title + description + image + authors + website lookup
  + duplicate check + an instant favicon URL (`ScanResult` in `@eesimple/types`). The client's
  `performUrlScan` (`useBookmarkFormController.ts`) calls it once and applies the result via the pure
  helpers in `useBookmarkScanHandlers.ts` (`applyScanMetadata` / `applyYouTubeMeta` /
  `applyPeopleFromNames`). **The granular endpoints stay** (`/api/fetch-title`, `/api/fetch-metadata`,
  `/api/resolve-url`, `/api/websites/lookup`, `/api/bookmarks/url-check`) for the per-field manual
  buttons — don't delete them. Scan results are cached in `services/scanCache.ts` (short TTL,
  size-capped). **That cache is display/metadata-only — never wire it into `invalidateBookmarkCache()`**
  (a bookmark write doesn't change a URL's page metadata; stale entries self-heal within the TTL — the
  same carve-out as Card Display Rules).
- **oEmbed is a registry — add a provider in one place.** `OEMBED_PROVIDERS` in
  `packages/types/src/oembed.ts` is the single source of truth for keyless oEmbed providers (Vimeo,
  Spotify, TikTok, …); the middleware `services/oembed.ts` also autodiscovers a `<link rel="oembed">`
  endpoint from the head HTML it already fetched, and the Connectors settings page lists providers by
  mapping over the same registry. Don't hand-list providers anywhere — derive from the tuple. See the
  **`add-connector`** skill.
- **Image capture stays server-side and SSRF-safe.** `fetchAndStoreOgImage` (`services/bookmarkImages.ts`)
  derives the image URL **from the bookmark's own stored URL** (never a client value), branching
  YouTube → oEmbed provider → og:image scrape. The oEmbed/YouTube thumbnail and every third-party
  image/icon URL passes `isPublicHttpUrl` before fetch.
- **ISBN has a keyless fallback chain.** `services/isbn.ts` tries Open Library, then Google Books;
  the route maps the discriminated outcome to 200 / 404 (not found) / 502 (providers unreachable).
- **URL→ISBN autodetect in `/api/scan` is gated per-website.** A pasted bookmark URL is scanned for an
  ISBN **only when** it matches a website that exists in the taxonomy **and** that website's
  **`scanUrlForIsbn`** flag is on (the "Scan URL for ISBN" checkbox on the website's edit General tab —
  a nullable boolean mirroring `redirectResolutionFailure`). When gated on, detection tries, in order:
  the Amazon ASIN (pure, `extractIsbn13FromAmazonUrl`) then its page scrape (`services/amazon.ts`), the
  O'Reilly path (pure, `extractIsbn13FromOreillyUrl`), the honto.jp page scrape (`services/honto.ts`),
  and — for any opted-in site with **no** dedicated connector — a **generic page scrape**
  (`extractIsbnFromHtml` in `packages/types/src/isbnScrape.ts` via `services/isbnScrape.ts`
  `fetchIsbnFromPage`). The detected ISBN rides `ScanResult.isbn`; the client fills the ISBN property
  when empty (`handleAmazonIsbnDetected`, unchanged). **`GET /api/scan` resolves the website first**
  (hoisted out of the metadata `Promise.all`) so the gate is known before any ISBN work is dispatched.
  The gate is **scan-only** — the explicit `GET /api/isbn/from-book-url` (manual per-URL resolve for
  Amazon/honto/O'Reilly) stays **ungated**. Consequence: a deploy with no opted-in website records
  autodetects no ISBNs from a scan by default.
- **A detected value that resolves to a taxonomy entity (not just a display string) is matched or
  created client-side, never inside the scan/ISBN endpoints.** E.g. bookmark language: `services/
  metadata.ts`'s `extractLanguage` (og:locale/`<html lang>`), the YouTube Data API's
  `defaultAudioLanguage`/`defaultLanguage`, and Open Library/Google Books' language fields all land as
  a raw normalized code (`utils/languageCodes.ts`) on `ScanResult`/`FetchIsbnMetadataResult`; the
  client resolves it to a `Language` row via match-or-create in `useBookmarkScanHandlers.ts`/
  `useBookmarkIsbn.ts`, mirroring the pre-existing person (author-name)/group (ISBN publisher-name) name-resolution flow. See the
  **`add-connector`** skill's Case D.
- **Plex-backed media taxonomies pull names + Wikipedia links from Wikidata.** For the five Plex
  taxonomies (Movies/TV Shows/Episodes/Albums/Tracks), `services/wikidataTitle.ts`'s
  `resolveTitleWikidata` resolves the native-script name (→ `name`), the English name (→
  `englishName`, persisted as an English `entity_names` row via `mergeEnglishEntityName`), and
  English + local Wikipedia links — pinned by the Plex item's external IDs
  (IMDb/TMDb/TVDB/MusicBrainz via `haswbstatement`, title-search fallback). **The persisted English
  row stays English regardless of the "Fallback display language" setting (see **Multilingual display
  names** below)** — the value
  literally *is* the English name from Wikidata (`name:en`), the slug source is English for stability,
  and English-Wikipedia resolution sends the English name on purpose; the fallback setting only
  changes which stored row is *shown/sorted*, never what a source-derived name is stored as. It shares the keyless
  Wikidata Action-API client **`services/wikidata.ts`** with the Locations geocoder
  (`wikidataGeocoding.ts`) — the low-level `fetchJson`/`searchEntities`/`getEntities`/`fetchSitelinks`
  plumbing lives there, not in either caller. This is **resolve-only** (`GET
  …/:id/plex-metadata-preview` → `resolvePlexTaxonomyMetadata`; never writes) and surfaced through the
  **"Sync from source"** review modal (the `plex-title` kind — poster + names + links reviewed
  current-vs-source, picked rows persisted by the edit form's per-field auto-save). Display metadata
  only → never `invalidateBookmarkCache()`. See the **`sync-from-source`** skill.
- **Podcasts are the keyless odd one out of the media taxonomies.** The **Podcasts** taxonomy
  (`podcasts` table, `bookmarks.podcastId`; the 8th "Media Property" alongside Books/Movies/…) is
  sourced not from Plex/Kavita but keylessly from **Apple Podcasts (iTunes Search & Lookup API)** and a
  pasted **RSS/XML feed URL** — `services/podcastFeed.ts` (`searchPodcasts`/`lookupPodcastByItunesId`
  via iTunes JSON, `resolvePodcastFeed`/`parsePodcastFeed` via `fast-xml-parser`, `importPodcastArtwork`
  storing the feed/iTunes artwork through the taxonomy-image gallery). A create/edit **search picker**
  (`PodcastSearchPicker`, keyless — always shown) fills name/author/feed/iTunes + artwork on select;
  the edit form registers a **`podcast-feed`** sync kind so **"Sync from source"** re-pulls
  name/author/description (staged) + artwork (immediate) from `GET …/:id/feed-preview`
  (`resolvePodcastFeedPreview`, resolve-only). No env var, no `ConnectorsStatus` gating (an always-on
  card on Settings → Connectors); SSRF-guard every feed/artwork URL with `isPublicHttpUrl`; display
  metadata only → never `invalidateBookmarkCache()`. See the **`add-connector`** + **`sync-from-source`**
  skills.
- **Tier 2 providers are gated (DB value or env var) and default off.** `services/hostedMetadata.ts`
  (`HOSTED_METADATA_ENDPOINT`/`_API_KEY`/`_PROVIDER`, Microlink-compatible) and the YouTube Data API
  path in `services/youtube.ts` (`youtubeApiEnabledAsync`, key from Settings → Connectors or
  `YOUTUBE_API_KEY`) are **active iff a key resolves** — mirror `docsEnabled()` /
  `isObjectStoreConfigured()`. Both **fall back to the keyless path** when unconfigured, so behavior
  is identical out of the box and nothing leaves the box unless an operator opts in. Keys are secrets
  → set via env var, or via **Settings → Connectors**, where they're stored **encrypted at rest**
  when `APP_SECRET` is configured (`getDecryptedHostedApiKey` / `getDecryptedYoutubeApiKey` in
  `services/appSettings.ts`; DB value wins over the env var) — the same pattern as the Kavita
  connector. `GET /api/connectors` (`routes/connectors.ts`) reports their on/off status (no secrets);
  `GET`/`PUT /api/app-settings/connectors` is the authenticated pair that reads/writes the keys
  themselves (never the raw value on GET — only a `*ApiKeySet` boolean). Both are surfaced on the
  **Settings → Connectors** page (`components/ConnectorsSettings.tsx`,
  `components/ConnectorMetadataForms.tsx`).
