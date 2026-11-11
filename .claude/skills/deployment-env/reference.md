# Reference: moved from CLAUDE.md

These sections were moved verbatim out of the root `CLAUDE.md` when it was slimmed to an index. Mentions of "CLAUDE.md → <section>" elsewhere (code comments, other skills) refer to the sections below.

## Deployment

The **gateway pattern** uses `packages/gateway` as the single production entrypoint: a Fastify
server that spawns the middleware as a child process, proxies `/api/*` to it, serves the client's
static build, runs `drizzle-kit push` on boot, and respawns the middleware with backoff. The
root `Dockerfile` builds everything for production. Deploy via Coolify using only `DATABASE_URL`
(see `README.md`).

The middleware calls `app.listen()` **before** running its boot data-steps (`ensure*` / `backfill*`
in `src/index.ts`) so the gateway's `/healthz` probe and `/api/*` proxy stay reachable even if a
boot step is slow on modest hardware — keep that ordering when adding boot steps. The gateway waits
on the middleware with a configurable timeout (`MIDDLEWARE_WAIT_TIMEOUT_MS`, default 60s; database
readiness uses `DB_WAIT_TIMEOUT_MS`).

### Scheduled backups

Settings → Advanced → Backups runs `pg_dump --format=custom` on a schedule and sends the dump to
another computer, usually over Tailscale: into a folder over **SFTP** (the default; any Mac, Linux or
Windows machine with SSH turned on, signed in with a password or an app-generated ed25519 key, host
key remembered on first connect) or into an **S3-compatible bucket** (Garage, MinIO). It can mirror
new image-bucket objects too, and prunes old dumps to the retention count. The schedule is stored as
plain choices (frequency, time, weekday, browser time zone) and turned into a cron expression by
`cronFromSchedule`, which [Croner](https://github.com/Hexagon/croner) runs in-process, started after
`app.listen()`. Config lives on `app_settings` (`backup_settings` jsonb, the encrypted
`backup_sftp_password` / `backup_sftp_private_key` / `backup_s3_secret_access_key`,
`backup_last_run`); code is `services/backupConfig.ts`, `backupRun.ts`, `backupScheduler.ts` and
`utils/backupTarget.ts`, `backupSftp.ts`, `backupStore.ts`. The final Docker stage installs
`postgresql-client-18` from the PostgreSQL apt repo, because pg_dump refuses to dump a server newer
than itself and Debian bookworm only ships 15. Destinations are operator-configured private/tailnet
addresses; SSH and the AWS SDK use Node sockets, not the SSRF-guarded fetch.

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `DATABASE_URL` | middleware / gateway | PostgreSQL connection string |
| `DOCS_ENABLED` | middleware / gateway | Expose the Swagger/OpenAPI docs at `/docs` and the Storybook static UI at `/storybook`. `true`/`1` on, `false`/`0` off; unset defaults to on outside production and off in production. The middleware gates the `@fastify/swagger` registration on it; the gateway gates the `/docs` proxy and the `/storybook` static serving on it — all parse the flag identically, so set `true` to serve the docs and Storybook through the production gateway. Storybook is always built into the image (Dockerfile `build-client` stage → `packages/client/storybook-static/`); only the serving is gated. The API is unauthenticated, so this makes the full surface publicly explorable. |
| `POSTGRES_USER` | docker-compose | DB user (default: `postgres`) |
| `POSTGRES_PASSWORD` | docker-compose | DB password (default: `password`) |
| `POSTGRES_DB` | docker-compose | DB name (default: `bookmarks`) |
| `POSTGRES_HOST_PORT` | docker-compose | Host port mapped to the db container's 5432 (default: `5432`). Override to avoid host port collisions on a shared host. |
| `GATEWAY_HOST_PORT` | docker-compose | Host port mapped to the gateway's 3000 (default: `3000`). |
| `BUILD_STORYBOOK` | docker-compose (build arg) | Docker **build argument** (default: `1`). Set `0` for a faster image build that skips the memory-heavy Storybook static build; that image 404s `/storybook`. The compose file threads it through as `${BUILD_STORYBOOK:-1}`; on Coolify's Dockerfile build pack set it in the app's build arguments. |
| `S3_ENDPOINT` | middleware / gateway | Object-storage (Garage/S3) endpoint for bookmark images, e.g. `http://garage:3900`. |
| `S3_REGION` | middleware / gateway | Object-storage region (default: `garage`; must match `garage.toml`'s `s3_region`). |
| `S3_BUCKET` | middleware / gateway | Bucket for bookmark images (default: `bookmarks`; auto-created on boot). |
| `S3_ACCESS_KEY_ID` | middleware / gateway | Object-storage access key. Image routes return 503 until set. |
| `S3_SECRET_ACCESS_KEY` | middleware / gateway | Object-storage secret key. |
| `GARAGE_S3_HOST_PORT` | docker-compose | Host port mapped to Garage's S3 API 3900 (default: `3900`). |
| `STORAGE_QUOTA_BYTES` | middleware / gateway | Optional storage quota in bytes shown in the Gallery UI alongside used space (e.g. `10737418240` for 10 GB). Omit to hide the quota line. |
| `HOSTED_METADATA_ENDPOINT` | middleware / gateway | **Optional, default off.** Tier 2 hosted metadata provider — a Microlink-compatible API endpoint (e.g. `https://api.microlink.io/`, or a self-hosted Microlink). When set, hard pages (JS-rendered, bot-protected) are resolved by the hosted service and merged over the direct scrape; when unset the pipeline behaves identically (direct scrape only). Setting it is what sends URLs off-box — privacy-preserving by default. Surfaced on Settings → Connectors. |
| `HOSTED_METADATA_API_KEY` | middleware / gateway | Optional API key for the hosted metadata provider, sent as the `x-api-key` header. |
| `HOSTED_METADATA_PROVIDER` | middleware / gateway | Optional provider label (e.g. `microlink`) shown on the Connectors settings page; does not affect behavior. |
| `YOUTUBE_API_KEY` | middleware / gateway | **Optional, default off.** Tier 2 — when a key resolves, a YouTube video's duration/publish-date/description come from the YouTube Data API v3 (`videos.list`) instead of the brittle `ytInitialPlayerResponse` watch-page scrape, and a YouTube channel's avatar comes from `channels.list`'s thumbnail instead of scraping the channel page's `og:image` (`fetchChannelAvatarUrlViaApi` in `services/youtube.ts`, used by `services/youtubeChannelImages.ts`) — YouTube increasingly 403s non-browser requests to channel pages, so the scrape alone is unreliable; unset falls back to the scrape. Video title/thumbnail/channel-name stay on keyless oEmbed either way. Surfaced on Settings → Connectors with a link to the Google Cloud Console to create a key. Secret — set via env var, or via Settings → Connectors where it's stored encrypted at rest when `APP_SECRET` is set (the `hostedMetadataApiKey`/Kavita pattern; DB value wins over the env var). |
| `INSTAGRAM_API_KEY` | middleware / gateway | **Optional, default off.** Tier 2 — when set (with `INSTAGRAM_API_ENDPOINT`), an Instagram account's avatar/profile data come from a third-party profile API instead of the keyless public-embed scrape; unset (or on failure) falls back to the keyless scrape, so behavior is identical out of the box. Powers pulling a person's image from a connected Instagram account. Surfaced on Settings → Connectors. Keys are secrets → env vars only. |
| `INSTAGRAM_API_ENDPOINT` | middleware / gateway | Optional URL template for the Instagram profile API, with a `{handle}` placeholder (e.g. `https://provider.example/ig/{handle}`); the endpoint must return JSON carrying `profile_pic_url_hd` / `profile_pic_url`. `INSTAGRAM_API_KEY` is sent as a `Bearer` token. Only used when both vars are set. |
| `ARCHIVEBOX_ENDPOINT` | middleware / gateway | **Optional, default off.** Base URL of a self-hosted [ArchiveBox](https://archivebox.io/) instance. **Link-out only** — when set, bookmarks gain UI (detail header, the placeable `archiveLink` card field, an "Archive now" action) that opens the archived snapshot (`<base>/?q=<url>`) or the add view (`<base>/add?url=<url>`) in a new tab. **No token is sent and the middleware makes no calls to ArchiveBox** — the user's browser opens the links against their own instance. The base URL is non-secret and returned on `GET /api/connectors` so the client can build the links. A DB value (Settings → Connectors) overrides this env var. |
| `KAVITA_ENDPOINT` | middleware / gateway | **Optional, default off.** Base URL of a self-hosted [Kavita](https://www.kavitareader.com/) ebook/manga server (e.g. `http://localhost:5000`). With `KAVITA_API_KEY` set, bookmarks can be **linked to a Kavita series** (searchable picker on the bookmark edit General tab, stored as `kavitaSeriesId`/`kavitaLibraryId`/`kavitaSeriesName`), gain a "View on Kavita" link-out (detail header + the placeable `kavitaLink` card field, opening `<base>/library/<lib>/series/<id>`), can **import the series cover** as the bookmark image, and can **import the book's table of contents** into the built-in Page Sections property ("Import from Kavita" on the edit Properties tab; `GET /api/kavita/toc?seriesId=` — EPUB via Kavita's book-chapters API, PDF by downloading the file and parsing its embedded outline server-side with `pdfjs-dist`; replace-review-save, persisted by the tab's Save). Series searches, cover fetches, and ToC reads are proxied by the middleware (`services/kavita.ts`, `services/pdfToc.ts`, `GET /api/kavita/series`) so the key never reaches the browser. The base URL is non-secret and returned on `GET /api/connectors`. A DB value (Settings → Connectors) overrides this env var. |
| `KAVITA_API_KEY` | middleware / gateway | **Optional, default off.** Kavita API key (from Kavita → User Settings → API Key), exchanged server-side for a plugin JWT (`POST /api/Plugin/authenticate`) and never returned by any endpoint. Secret — set via env var, or via Settings → Connectors where it's stored encrypted at rest when `APP_SECRET` is set (the `hostedMetadataApiKey` pattern; DB value wins over the env var). |
| `PLEX_ENDPOINT` | middleware / gateway | **Optional, default off.** Base URL of a self-hosted [Plex](https://www.plex.tv/) media server (e.g. `http://localhost:32400`). With `PLEX_TOKEN` set, bookmarks can be **linked to a Plex item** — movie/show/music (searchable picker on the bookmark edit General tab, stored as `plexRatingKey`/`plexItemType`/`plexItemTitle`), gain a "View on Plex" link-out (detail header + the placeable `plexLink` card field, opening the item on the configured server's web UI), and can **import the item's poster** as the bookmark image. Item searches and poster fetches are proxied by the middleware (`services/plex.ts`, `GET /api/plex/search`) so the token never reaches the browser; the web-UI deep link uses the server's `machineIdentifier`, read once from Plex's `/identity` (non-secret) and returned on `GET /api/connectors`. A DB value (Settings → Connectors) overrides this env var. |
| `PLEX_TOKEN` | middleware / gateway | **Optional, default off.** Plex authentication token (`X-Plex-Token` — see [Finding an authentication token](https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/)), sent as the `X-Plex-Token` header on server-side requests and never returned by any endpoint. Secret — set via env var, or via Settings → Connectors where it's stored encrypted at rest when `APP_SECRET` is set (the `hostedMetadataApiKey`/Kavita pattern; DB value wins over the env var). |
| `CARTO_API_KEY` | middleware / gateway | **Optional, default off.** API key for [CARTO basemap tiles](https://carto.com/basemaps/apikey/), used by the Locations map's **"hide administrative borders"** style (`lib/basemapTiles.ts` → `BasemapTileLayer`). CARTO enforces a key on `basemaps.cartocdn.com`; without one those tiles render with an "API KEY REQUIRED" watermark. The default bordered basemap is keyless OpenStreetMap, so the map works either way and no fallback logic is needed. Settable via env var or **Settings → Connectors**, where it's stored encrypted at rest when `APP_SECRET` is set (DB value wins over the env var). **This is the one connector key returned to the browser** — it is served raw on `GET /api/connectors` (`ConnectorsStatus.basemap.cartoApiKey`) because Leaflet fetches the tiles itself, so the key has to ride in the tile URL; it's a low-value, referrer-restrictable, fair-use basemap key, not a server credential. |
| `NOMINATIM_ENDPOINT` | middleware / gateway | **Optional, keyless.** Overrides the OpenStreetMap Nominatim base URL used by the Locations geocoder (`services/geocoding.ts`); default `https://nominatim.openstreetmap.org`. Point at a self-hosted Nominatim to keep place lookups on-box. Non-secret, reported on `GET /api/connectors`. |
| `WIKIDATA_ENDPOINT` | middleware / gateway | **Optional, keyless, default on.** Wikidata base URL for the geocoder's **fallback** (`services/wikidataGeocoding.ts`), used only when Nominatim returns no candidates — i.e. traditional / informal / natural regions with no admin boundary (e.g. 中国地方 / Chūgoku region). Supplies coordinates (`P625`), country (`P17`→`P297`), ancestor chain (`P131`), and an area outline (linked `P402`/`P3896`, else composed from `P150` constituents). Default `https://www.wikidata.org`; point at a self-hosted Wikibase mirror to keep lookups on-box. Non-secret, reported on `GET /api/connectors`. |
| `WIKIMEDIA_MAPS_ENDPOINT` | middleware / gateway | **Optional, keyless.** Base URL of the Kartographer geoshape service the Wikidata fallback uses to fetch a region's *linked* area outline (`<base>/geoshape?getgeojson=1&ids=<QID>`); default `https://maps.wikimedia.org`. Only used when an item links an OSM relation/geoshape; otherwise the area is composed from constituents via Nominatim. |

Bookmark images are compressed to a 1200px WebP and stored in object storage (Garage by default),
served via `GET /api/bookmarks/:id/image`. Without the `S3_*` vars the app runs normally but image
upload/auto-capture returns 503. See `README.md` → "Object storage (Garage)" for the one-time setup.

See `packages/middleware/.env.example`.
