---
name: client-data-hooks
description: >-
  Wire a client data hook (`packages/client/src/hooks/use<Entity>.ts`) in eeSimple Bookmarks — the
  per-entity TanStack Query convention: module-level query-key consts, `useX()` list + `useXBySlug()`
  cache lookup, the `createCrudApi(endpoint)` factory, `useCreate/Update/Delete/BulkDelete` mutations,
  and the cross-entity **invalidation graph** (each entity invalidates itself *plus its dependents*).
  Use when asked to "add/copy a data hook for X", "why is my listing/bookmark card stale after saving X",
  "what should my mutation invalidate", "which query keys ripple into bookmarks", "wire onSuccess
  invalidation", "add a useXBySlug", or when the `add-entity` skill's step-6 ("copy `useMediaTypes.ts`")
  needs unpacking. Mirrors `useMediaTypes.ts` (leanest, inline invalidation) and `useCategories.ts`
  (shared `useXInvalidation()` helper + toasts). Also covers maintaining a hook — "add a cross-entity
  invalidation", "a rename doesn't refresh bookmarks", "the graph is missing a dependent".
---

# Client data hooks

Every browsable entity has a data-hook file `packages/client/src/hooks/use<Entity>.ts` that follows the
same TanStack Query shape. Build a new one by copying an existing, complete file — **`hooks/useMediaTypes.ts`**
is the leanest reference (inline invalidation, no toasts); **`hooks/useCategories.ts`** shows the richer form
(a shared `useCategoryInvalidation()` helper + delete/save toasts).

The load-bearing, non-mechanical part is the **cross-entity invalidation graph** below — *who invalidates
whom, and why*. A hook that hydrates data onto bookmarks but forgets to invalidate `["bookmarks"]` produces a
silent stale-UI bug that copy-from-sibling won't catch. This is the failure mode this skill exists to prevent.

> **Not** the same as the middleware's server-side `invalidateBookmarkCache()` (a different concern — the
> Fastify in-memory bookmark cache, documented in CLAUDE.md → "Caching / growth path"). This skill is about
> **client** react-query invalidation only.

## 1. The API layer — `createCrudApi`

Entity APIs are built on the `createCrudApi<T, C, U>(endpoint)` factory in
`packages/client/src/lib/api/client.ts`. It returns five methods:

```ts
createCrudApi<Row, CreateInput, UpdateInput>("media-types")
// → { list, create, update, remove, bulkDelete }
```

- `list()` → `GET /api/<endpoint>` (returns `T[]`). `create(input)` → `POST`. `update(id, input)` → `PATCH`.
  `remove(id)` → `DELETE`. `bulkDelete(ids)` → `POST /api/<endpoint>/bulk-delete` (returns `BulkDeleteResult[]`).
- **The delete method is named `remove`, not `delete`** (reserved word).
- **There is no `get(id)`** single-fetch method — single-entity lookups are done **client-side by slug** over
  the cached list (see `useXBySlug` below), not via a per-id endpoint.

Base plumbing (also in `client.ts`): `request<T>(path, init)` prefixes `/api`, adds
`Content-Type: application/json` **only when a body is present**, throws `ApiError` on a non-`ok` response
(passing through the server's `code`/`detail`/`params`), and returns `undefined` on `204`. `uploadImageFile`
is the multipart escape hatch (favicon/avatar/bookmark image uploads — it sets no content-type so the browser
adds the boundary).

Entity APIs live in `packages/client/src/lib/api/taxonomies.ts` as **spread-and-extend** objects:

```ts
export const mediaTypesApi = {
  ...createCrudApi<MediaType, CreateMediaTypeInput, UpdateMediaTypeInput>("media-types"),
  tree: () => request<MediaTypeNode[]>("/media-types/tree"),
};
```

Common extensions: `tree` (tree taxonomies), `uploadImage`/`autoImage`/`deleteImage` (image entities),
`lookup` (websites/locations), a `remove` **override** that appends a `?reassignTo=` query param (place-types,
location-relations, language-usage-levels), and per-entity extras like `categoriesApi.defaults`/`setDefaults`.
A pure factory with no extras is just re-exported (`languagesApi`, `relationshipTypesApi`,
`customPropertiesApi`, `groupTypesApi`).

**Error text.** Caught errors become toast text via `describeError(err, fallback)` (`lib/apiError.ts`): an
`ApiError` with a `code` is run through `translateErrorCode(code, params)` (`lib/errorMessages.ts`); an
unmapped code (or a non-`ApiError`) falls back to the server's raw English `message`. See the **`api-errors`**
skill for the server envelope; don't re-derive it here.

## 2. Query-key naming

Declare keys as **module-scoped `as const` string arrays**, one per file. Nested keys spread the base.

```ts
const MEDIA_TYPES_KEY = ["media-types"] as const;
const BOOKMARKS_KEY = ["bookmarks"] as const;      // re-declared here to invalidate cross-entity
// nested: [...MEDIA_TYPES_KEY, "tree"]   [...CATEGORIES_KEY, categoryId, "defaults"]
```

- The key string is the **kebab-case endpoint name** (`"media-types"`, `"youtube-channels"`,
  `"custom-properties"`, `"genre-moods"`).
- **There is no central query-key factory.** Cross-entity invalidation just re-declares the *other* entity's
  literal array (every hook that ripples into bookmarks has its own `const BOOKMARKS_KEY = ["bookmarks"]`).
- The global `queryClient` (`lib/queryClient.ts`) defaults to `staleTime: 30_000` and
  `refetchOnWindowFocus: false`.

## 3. The hook set

```ts
export function useMediaTypes() {
  return useQuery({ queryKey: MEDIA_TYPES_KEY, queryFn: mediaTypesApi.list });
}

// Single-entity lookup = .find over the cached list (NOT a network call).
export function useMediaTypeBySlug(slug: string) {
  const query = useMediaTypes();
  return { ...query, mediaType: (query.data ?? []).find(item => item.slug === slug) };
}
```

- **`useXBySlug`** filters the cached list by slug (tree taxonomies flatten the tree query first — mirror
  `useTagBySlug`). Only add it if the entity's name is resolved from a slug somewhere (breadcrumbs, a detail
  page); an unused export trips the fallow dead-code gate (see `add-entity` step 6).
- **Mutations** take the `{ id, input }` variable shape and wire `onSuccess: invalidate`:

```ts
export function useUpdateMediaType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateMediaTypeInput }) =>
      mediaTypesApi.update(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MEDIA_TYPES_KEY });
      void queryClient.invalidateQueries({ queryKey: BOOKMARKS_KEY }); // rename ripples into bookmark reads
    },
  });
}
```

- **`useBulkDeleteX`** delegates to the shared **`useBulkDeleteEntity(api.bulkDelete, invalidate)`**
  (`hooks/useBulkDeleteEntity.ts`), which runs `invalidate()` then fires one `notifyBulkResult(results, "deleted")`
  summary toast. A Manager only needs the hook, not the API + invalidation wiring.
- **Invalidation-helper style is free.** Extract a `useXInvalidation()` hook-closure (`useCategories`,
  `useTags`, `useLocations`, `useTaxonomies`), a plain module fn `invalidateXConsumers(queryClient)`
  (`useGroups`, `useGroupTypes`, `useLanguageUsageLevels`), or inline it per mutation (most files). If you
  inline, keep the create/update/delete/bulk key sets **deliberate** — they legitimately differ, and that's
  exactly where an omission hides.

## 4. The invalidation graph

Verified against code. Each entity invalidates **its own key**; the column below is the *additional* keys its
mutations touch. Unless noted, `create` invalidates **self only** (a brand-new term is on no bookmark yet)
while `update`/`delete`/`bulk-delete` add the dependents.

| Entity (hook) | Own key | Also invalidates | Helper / notes |
|---|---|---|---|
| Categories (`useCategories`) | `categories` | `custom-properties`, `bookmarks` | `useCategoryInvalidation()` |
| Custom Properties (`useCustomProperties`) | `custom-properties` | `bookmarks` (update/delete/bulk) | inline; create → self only |
| Media Types (`useMediaTypes`) | `media-types` | `bookmarks` (update/delete/bulk) | inline; `tree` key |
| Tags (`useTags`) | `tags` | `bookmarks` | `useTagInvalidation()`; `tree` key |
| Websites (`useWebsites`) | `websites` | `bookmarks`, `websites/redirect-failures`, `youtube-channels` (on update) | inline; shared website↔channel join |
| YouTube Channels (`useYouTubeChannels`) | `youtube-channels` | `bookmarks`, `websites` (on update); `…/missing-image-count` | inline; shared join |
| Groups (`useGroups`) | `groups` | `bookmarks`, `group-types` | `invalidateGroupConsumers(qc)` |
| Group Types (`useGroupTypes`) | `group-types` | `groups` | `invalidateGroupTypeConsumers(qc)`; **not** bookmarks |
| People (`usePeople`) | `people` | `bookmarks` (update/delete/bulk) | inline; image mutations → `people` only (justified, §5) |
| Newsletters (`useNewsletters`) | `newsletters` | `bookmarks` | inline |
| Locations (`useLocations`) | `locations` | `bookmarks` | `useLocationInvalidation()`; `tree` key |
| Location Relations (`useLocationRelations`) | `location-relations` | `bookmarks`, `locations` (update/delete/bulk) | inline |
| Place Types (`usePlaceTypes`) | `place-types` | `locations` (delete/bulk) | inline; **not** bookmarks |
| Languages (`useLanguages`) | `languages` | `bookmarks` (update/delete/bulk) | inline |
| Language Usage Levels (`useLanguageUsageLevels`) | `language-usage-levels` | `language-usages`, `bookmarks` | `invalidateAll(qc)`; no `BySlug`/`BulkDelete` |
| Relationship Types (`useRelationshipTypes`) | `relationship-types` | `bookmarks` (update/delete/bulk) | inline |
| Genres & Moods (`useGenreMoods`) | `genre-moods` | `bookmarks` (update/delete/bulk) | inline; `tree` key |
| Saved Filters (`useSavedFilters`) | `saved-filters` | — | self-contained |
| Autofill Rules (`useAutofill`) | `autofill-rules` | backfill/exempt sub-keys only | **never** `bookmarks` (known gap, §5) |
| Taxonomies + terms (`useTaxonomies`) | `taxonomies` | `bookmarks`, `taxonomy-terms/favorites`, `[…, id, "terms", "tree"]`; promote/demote add `tags` | `useTaxonomyInvalidation(id?)` |
| Per-owner joins — `useLanguageUsages` / `useGenreMoodAssignments` / `useTaxonomyAssignments` | dynamic `[key, ownerType, ownerId]` | parent taxonomy (`genre-moods` / `taxonomies`); `bookmarks` **only if `ownerType === "bookmark"`** | `setQueryData` + conditional invalidate |

## 5. The rule for extending the graph

When adding or editing a hook, decide its dependents by these rules rather than blindly copying a sibling:

- **Does the entity hydrate onto the bookmark row/card? ⇒ invalidate `["bookmarks"]` on update + delete +
  bulk-delete.** (Not on `create` — nothing references it yet.) This is the most-missed edge: a rename that
  doesn't refresh bookmark cards is the symptom. Anything appearing on a bookmark — a top-level FK
  (`categoryId`/`mediaTypeId`/`languageId`), a hydrated relation (`Bookmark.people`/`.groups`/`.genreMoods`),
  tags, or a custom-property value — qualifies.
- **Image/avatar mutation ⇒ invalidate `["bookmarks"]` only if the bookmark's *embedded* shape carries the
  image.** `BookmarkWebsite`/`BookmarkYouTubeChannel` embed `imageUrl`, so favicon/avatar mutations **do**
  invalidate bookmarks. `BookmarkPerson`/`BookmarkGroup` are `Pick<…, "id" | "name" | "slug">` (no image), so
  People/Groups image mutations **correctly** invalidate only their own key. This asymmetry is **justified,
  not a bug** — check the `Bookmark*` `Pick` in `packages/types/src/index.ts` before deciding.
- **Shared join with another entity ⇒ invalidate that entity too.** websites↔youtube-channels (each other),
  groups↔group-types (each other), place-types & location-relations → locations, language-usage-levels →
  language-usages.
- **Per-owner assignment writes** `setQueryData` the owner key, invalidate the parent taxonomy, and add
  `["bookmarks"]` **only** for `ownerType === "bookmark"` — mirror `useSetOwnerGenreMoods`.
- **Self-contained entities skip `["bookmarks"]`** deliberately: saved-filters (display-only), place-types /
  group-types (they ripple into locations / groups, not bookmarks), autofill-rules.
  - **Known gap (do not "fix" as a copy-paste):** `useApplyAutofillBackfill` mutates bookmark field values but
    invalidates only autofill/global-backfill keys — a bookmarks view can show stale values until refetch.
    Tracked as a follow-up to #1366; don't silently paper over it in a new hook.

## 6. Toasts

Fire toasts from the **mutation hook**, not the call site (a hook that toasts internally makes a silent bare
`.mutate()` impossible). Use `notifySuccess`/`notifyError` (`lib/notifications.ts`), `notifyBulkResult` for
bulk ops (`lib/bulkResults.ts`), or `notifyFieldSaved`/`notifyFieldSaveError` for auto-save fields
(`lib/autoSave.ts`). The observed convention:

- **`delete`** fires `notifySuccess(t("<Entity> deleted"))`.
- **`create`** fires a `notifySuccess`/`notifyError` pair where the create is a discrete user action
  (`useCreateCustomProperty` → `"Property created"`, `useCreateSavedFilter` → `"Filter saved"`).
- **`update` stays toast-less** when the edit tab auto-saves per field (the field's own `notifyFieldSaved`
  fires — a generic "X saved" would double up). See `useUpdateCustomProperty`'s comment.
- **Bulk** ops fire `notifyBulkResult(results, "deleted" | "updated")`.

The two-layer notify contract (sonner + persistent Notifications log) is owned by the **`toast-notifications`**
skill — consult it for the helper details rather than duplicating them here.

## Verify

```
pnpm --filter=@eesimple/client typecheck   # a scaffolded hook must compile
```

Then spot-check the graph: for the entity you touched, confirm the `invalidateQueries` calls in
`useCreate/Update/Delete/BulkDelete` match §4's rules — especially that a bookmark-hydrated entity invalidates
`["bookmarks"]` on update **and** delete **and** bulk-delete.
