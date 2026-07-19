// The `BOOKMARK_SEARCH_FACETS` matching engine moved to `@eesimple/types` so the middleware
// evaluates the exact same predicate server-side (`POST /api/bookmarks/search`). This shell keeps
// the client consumers importing from `./bookmarkSearch` unchanged.
export {
  bookmarkMatchesSearch,
  bookmarkSearchEquals,
  hasAnyActiveFilter,
  passesGenreMoodsExclusion,
  passesGenreMoodsFilter,
  passesLanguageUsagesFilter,
  passesPlaceTypesExclusion,
  passesPlaceTypesFilter,
  passesPresence,
} from "@eesimple/types";
