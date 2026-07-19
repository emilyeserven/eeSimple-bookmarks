// The custom-property filter predicate moved to `@eesimple/types` (evaluated server-side by
// `POST /api/bookmarks/search` via the shared facet matcher). This shell keeps client imports
// unchanged.
export type { BooleanFilter, DateTimeFilter, NumberFilter } from "@eesimple/types";
export { bookmarkMatchesFilters } from "@eesimple/types";
