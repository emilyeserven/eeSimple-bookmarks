// The `BookmarkSearch` type surface moved to `@eesimple/types` so the middleware can evaluate the
// same shape server-side (`POST /api/bookmarks/search`). This shell keeps the ~64 client consumers
// importing from `./bookmarkSearch` unchanged.
export type { BookmarkSearch, MediaSourceMatchField, OwnerLanguageUsage } from "@eesimple/types";
