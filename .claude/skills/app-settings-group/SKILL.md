---
name: app-settings-group
description: >-
  Add or extend a server-persisted settings group in eeSimple Bookmarks — a set of related settings
  stored on the `app_settings` singleton row, exposed as a `GET`/`PUT /api/app-settings/<group>`
  pair, read through convenience hooks, and saved with a field-named toast. Use when asked to "add
  a setting that syncs across devices", "persist X server-side", "add a Settings toggle/default for
  X", "move a uiStore pref to the server", "add an API-key/secret setting", or when deciding
  whether a new preference belongs in `uiStore` at all. Mirrors how display preferences,
  sidebar customization, automation, screenshot defaults, and the connector keys were built.
---

# Server-persisted app-settings group

**First decide where the setting lives.** `uiStore` (Zustand, local-only, no toast) is **only** for
ephemeral, device-local view prefs (theme, panel widths, open/closed state, page-level listing
prefs). Anything that should **stick across devices/browsers** goes on the server-side
`app_settings` singleton — and once server-side, saving it **fires a specific, recorded toast** like
every persisted setting. Misclassifying a should-sync setting as a local pref is exactly what
shipped the toast-less, non-syncing Display/Sidebar/Automations pages before issue #410.

## Recipe (mirror `display-preferences`)

All layers live in four files; a new setting in an *existing* group touches each at one spot, a new
*group* adds one block to each:

1. **Schema** — a column (usually jsonb or scalar, **nullable = push-safe**) on `appSettings` in
   `packages/middleware/src/db/schema.ts`. Nullable additive columns need no migration (see the
   `db-schema-change` skill if you're tempted by NOT NULL or a constraint).
2. **Service** (`packages/middleware/src/services/appSettings.ts`):
   - a `DEFAULT_*` constant carrying the fallback for every field;
   - a pure normalizer/clamp for anything user-shaped (`as*` / `normalize*` — these are exported
     and unit-tested in `tests/appSettings.test.ts`; extend the tests with the new field's junk
     inputs);
   - a `get<Group>Settings()` that reads the row and applies defaults, and an
     `update<Group>Settings(input)` that upserts via `.onConflictDoUpdate` on `ROW_ID`.
3. **Route** (`packages/middleware/src/routes/appSettings.ts`) — the `GET` + `PUT
   /api/app-settings/<group>` pair with a JSON-Schema body, following the existing pairs
   (`homepage-content`, `advanced`, `display-preferences`, …).
4. **Client** (`packages/client/src/hooks/useAppSettings.ts`) — a `use<Group>Settings()` query, an
   update mutation that invalidates it, and small per-field convenience hooks that apply the
   default (`useCroppedWidth`-style: `data?.field ?? DEFAULTS.field`). Add convenience hooks only
   for fields with multiple consumers — unused ones are dead-code findings (four were removed in
   the 2026-07 sweep).

**UI**: the settings page (and any inline popover that writes the same pref) saves per field with
`notifySuccess`/`notifyFieldSaved` naming the field — auto-save on change/blur, no Save button (see
the `toast-notifications` skill). Shared types for the group live in `@eesimple/types`.

## Secrets (API keys)

A key is never returned raw: store it via the encrypted-at-rest path
(`maybeEncrypt`/`maybeDecrypt`, effective when `APP_SECRET` is set), expose only a `*ApiKeySet`
boolean on `GET`, decrypt server-side with a `getDecrypted*` helper, and let a DB value win over the
corresponding env var — the `hostedMetadataApiKey` / Kavita / YouTube pattern in
`services/appSettings.ts` + `routes/connectors.ts`. Document any env-var fallback in CLAUDE.md's
environment table and `.env.example`.

## Verify

- Middleware tests cover the new normalizer's junk inputs; `pnpm typecheck` catches missed shared
  types.
- Boot twice locally (`pnpm dev`) — `ensureAppSettings()` must remain idempotent with the new
  column.
- The setting round-trips: change it in the UI → toast names the field → reload in another browser
  profile shows the new value.
