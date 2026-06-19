---
name: source-default-association
description: >-
  Give a "source" taxonomy (Websites / YouTube channels) a default taxonomy value that is
  automatically applied to new bookmarks saved from it, and surface the relationship on both ends, in
  eeSimple Bookmarks. Use when asked to "let websites/channels set a default X", "auto-apply X to
  bookmarks from this site/channel", "associate a media type/category/tag with a website or channel",
  or "show which sources feed this X". Mirrors how a source's default Category, default Tags, and
  default Media Type are stored and surfaced (the latter added on top of PR #279).
---

# Source default association (Website / YouTube channel → bookmark default)

Websites and YouTube channels are **sources**: when a bookmark is saved from one, the source's own
defaults are auto-applied to the new bookmark. Three defaults exist today, all built the same way:

- **default Category** (`categoryId`, scalar FK) — embedded as a `category` object on the wire type.
- **default Tags** (`tagIds`, many — join tables `website_tags` / `youtube_channel_tags`).
- **default Media Type** (`mediaTypeId`, scalar FK) — exposed as a **scalar id** on the wire type and
  resolved to a name/icon client-side (no DB join). This is the simplest variant; copy it.

Two shared client components surface the relationship (introduced in PR #279, extended for media
type). **Extend these, never fork a per-entity copy:**

- **`SourceAutofillDefaults`** (`packages/client/src/components/SourceAutofillDefaults.tsx`) — on a
  website/channel page, "New bookmarks saved from this site are automatically added to <Category>,
  marked as <MediaType>, and tagged <Tags>". Renders nothing when the source has no defaults.
- **`EntityAutofillSources`** (`packages/client/src/components/EntityAutofillSources.tsx`) — on a
  category/media-type/tag page, the "Websites" / "YouTube Channels" cards listing the sources whose
  defaults point at it. Driven by a discriminated `match` union (`category` | `media-type` | `tag`).

This is **not** a new autofill *rule* condition or a `setMediaTypeId` rule action — it's a default
stored directly on the source. (For rule conditions/actions see `add-condition-type` /
`scope-autofill`.)

## Recipe — add a new scalar default `X` to both sources (mirror Media Type)

### Backend
1. **Schema** (`packages/middleware/src/db/schema.ts`) — add a **nullable** FK column to both the
   `websites` and `youtubeChannels` tables, beside `categoryId`:
   ```ts
   xId: uuid("x_id").references((): AnyPgColumn => xs.id, { onDelete: "set null" }),
   ```
   A nullable column is a **push-safe additive** change — no `migrate.ts` entry (see CLAUDE.md →
   "Database schema changes").
2. **Types** (`packages/types/src/index.ts`) — add `xId?: string | null;` to `Website`,
   `YouTubeChannel`, `UpdateWebsiteInput`, and `UpdateYouTubeChannelInput`.
3. **Services** (`services/websites.ts`, `services/youtubeChannels.ts`) — add `xId: <table>.xId` to
   the shared select shape(s), pass `xId: row.xId ?? null` through `toWebsite` / `toYouTubeChannel`,
   and in `update*` add the column to the `patch` Pick + `if ("xId" in input) patch.xId = … ?? null;`
   (channels do a separate `db.update().set({ xId })` block — match the `categoryId` block there).
4. **Routes** (`routes/websites.ts`, `routes/youtubeChannels.ts`) — add
   `xId: { type: ["string", "null"], format: "uuid" }` to each update body schema.
5. **Apply the default on save** (`services/bookmarks.ts`, `createBookmark`) — this is the
   "inform autofill" step. Mirror the category/tags cascade (`siteData` is the matched `Website`;
   add a `getChannelXId(channelKey)` helper next to `getChannelCategoryId`). Precedence:
   `input.xId` → channel default → website default (`siteData?.xId`) → any built-in fallback.

### Client
6. **General forms** (`WebsiteGeneralForm.tsx`, `YouTubeChannelGeneralForm.tsx`) — add `xId` to the
   zod schema + `defaultValues`, pull the `useXs()` list, render a `<form.AppField name="xId">` →
   `<field.ComboboxField label="X" …>` (icon via `CategoryIcon`), include `xId: value.xId || null`
   in the `update*.mutate` input, and add an `xIdDirty` term to `disabledWhen`.
7. **`SourceAutofillDefaults`** — add an `xId?: string | null` prop, resolve it via `useXs()` (like
   `tagIds` → `useTags()`), push a clause (e.g. a `<XPill>`) into the `clauses` array, and include it
   in the empty-guard. Pass `xId={website.xId}` / `{channel.xId}` / `{ch.xId}` from the **six** source
   route files that render the component (3 website + 3 channel: `_view.general`, `_view.autofill`,
   `edit.autofill`).
8. **`EntityAutofillSources`** — add `{ kind: "x"; xId: string }` to the `match` union and a branch
   to both `sourceMatches` (`source.xId === match.xId`) and `noteFor`.
9. **Surface on X's page** — in X's `_view.autofill` / `edit.autofill` (and `_view.general` for
   parity), wrap the body in `space-y-6` and render
   `<EntityAutofillSources match={{ kind: "x", xId: x.id }} />` above the existing list — mirror the
   Media Type tabs.

## Verify

```
pnpm --filter=@eesimple/types build   # propagate the shared-type change first
pnpm typecheck
pnpm lint:fix                          # always from repo root
pnpm test
```

Then `pnpm dev`: set the default on a Website and a YouTube channel General tab and Save (persists on
reload); save a new bookmark from that domain/channel with no explicit value and confirm it inherits
the default; the chosen X's page lists the source under `EntityAutofillSources`, and the source's
page shows the inline `SourceAutofillDefaults` line.
