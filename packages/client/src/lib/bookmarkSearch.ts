// URL-persisted bookmark filter state, split into four cohesive modules: the `BookmarkSearch` type
// surface (`bookmarkSearchTypes`), URL parsing + human-readable summary (`bookmarkSearchValidate`),
// the `BOOKMARK_SEARCH_FACETS` matching engine (`bookmarkSearchMatch`), and the immutable `with*`
// updaters (`bookmarkSearchMutations`). This shell re-exports the whole surface so the ~64 consumers
// keep importing from `./bookmarkSearch`.
export * from "./bookmarkSearchMatch";
export * from "./bookmarkSearchMutations";
export * from "./bookmarkSearchTypes";
export * from "./bookmarkSearchValidate";
