// The `BOOKMARK_SEARCH_FACETS` matching engine moved to `@eesimple/types` so the middleware
// evaluates the exact same predicate server-side (`POST /api/bookmarks/search`). This shell keeps
// the client consumers importing from `./bookmarkSearch` unchanged; the `passes*` helpers are not
// re-exported — their only consumers are the matcher internals, now inside the types package.
export {
  bookmarkMatchesSearch,
  bookmarkSearchEquals,
  hasAnyActiveFilter,
} from "@eesimple/types";
