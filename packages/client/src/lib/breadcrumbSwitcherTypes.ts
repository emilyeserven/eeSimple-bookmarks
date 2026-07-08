/** The flat (non-tree) slug-routed taxonomies a breadcrumb name crumb can switch among. */
export type TaxonomyEntity
  = | "website"
    | "youtube-channel"
    | "custom-property"
    | "autofill"
    | "import-rule";

/**
 * Describes what a switchable breadcrumb crumb switches among. Builders in `-appHeader.tsx` attach a
 * spec to a crumb; the component resolves the sibling list (from already-cached queries) on its own.
 */
export type SwitcherSpec
  = | { kind: "category";
    currentSlug: string; }
    | { kind: "bookmark";
      categoryId: string;
      currentId: string; }
      | { kind: "treeSiblings";
        tree: "tag" | "media-type" | "location";
        parentId: string | null;
        currentSlug: string; }
        | { kind: "taxonomy";
          entity: TaxonomyEntity;
          currentSlug: string; };

export interface SwitcherOption {
  /** Stable identity used to mark the current item (slug for most, id for bookmarks). */
  value: string;
  label: string;
  /** Plain-string path navigated to on select. */
  href: string;
}
