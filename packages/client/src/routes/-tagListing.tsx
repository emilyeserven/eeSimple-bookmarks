import type { TagBookmarkSearch } from "./-tagSearch";

import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useCategoryPageData } from "./-categoryPageData";
import { BookmarkSearchView } from "../components/BookmarkSearchView";
import { SectionTagProvider } from "../components/SectionTagContext";
import { useSectionDisplayMode } from "../lib/bookmarkColumns";
import { findAncestorPath, subtreeIds } from "../lib/tagTree";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export { validateTagSearch } from "./-tagSearch";
export type { TagBookmarkSearch } from "./-tagSearch";

interface Props {
  tagSlug: string;
  /** Which results view the outer `_hub` strip selected (bookmarks/gallery/media). */
  activeView: "bookmarks" | "gallery";
  search: TagBookmarkSearch;
  onSearchChange: (next: TagBookmarkSearch) => void;
}

/**
 * The tag-scoped bookmarks listing body, shared by the `_hub.index` / `_hub.gallery` / `_hub.media`
 * routes (each passes its own `activeView`). The entity `<h1>` header lives in the `_hub` layout, so this
 * passes none to `BookmarkSearchView`. The optional `?taggedSections` mode REPLACES the tag-membership
 * filter with "sections carry this tag" (so the set matches the tags listing's section-count badge, and
 * a bookmark whose chapter is about the tag shows even when the bookmark itself isn't tagged); it rides
 * on `search` so it survives filter changes. Both modes evaluate server-side via the `tag` scope
 * (the server expands the subtree).
 */
export function TagListing({
  tagSlug, activeView, search, onSearchChange,
}: Props) {
  const {
    t,
  } = useTranslation();

  const sectionDisplayMode = useSectionDisplayMode(`tag:${tagSlug}`);

  const {
    categories,
    properties,
    tagTree,
    mediaTypes,
    youtubeChannels,
    relationshipTypes,
    people,
    placeTypes,
    genreMoods,
  } = useCategoryPageData();

  const path = tagTree ? findAncestorPath(tagTree, tagSlug) : null;
  const tag = path?.[path.length - 1];

  // Still resolving the tag tree — wait before deciding the tag is missing.
  if (!tagTree) {
    return <p className="text-muted-foreground">{t("Loading tag…")}</p>;
  }

  if (!tag) {
    return <p className="text-destructive">{t("Tag not found.")}</p>;
  }

  // This tag plus its descendants — used by the section-tag card-field provider below (the
  // server-side scope resolves the same subtree itself).
  const tagIds = new Set(subtreeIds(tag));

  const view = (
    <BookmarkSearchView
      activeView={activeView}
      header={search.taggedSections
        ? (
          <Badge
            variant="secondary"
            className="gap-1"
          >
            {t("Tagged sections")}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("Clear tagged-sections filter")}
              className="size-4"
              onClick={() =>
                onSearchChange({
                  ...search,
                  taggedSections: undefined,
                })}
            >
              <X className="size-3" />
            </Button>
          </Badge>
        )
        : undefined}
      pageKey={`tag:${tagSlug}`}
      tree={tagTree ?? []}
      properties={properties ?? []}
      categories={categories ?? []}
      mediaTypes={mediaTypes ?? []}
      youtubeChannels={youtubeChannels ?? []}
      relationshipTypes={relationshipTypes ?? []}
      people={people ?? []}
      placeTypes={placeTypes ?? []}
      genreMoods={genreMoods ?? []}
      scope={{
        kind: "tag",
        id: tag.id,
        taggedSections: search.taggedSections,
      }}
      search={search}
      onSearchChange={next =>
        onSearchChange({
          ...next,
          taggedSections: search.taggedSections,
        })}
      emptyMessage={search.taggedSections
        ? t("No bookmarks with sections tagged with this tag yet.")
        : t("No bookmarks with this tag yet.")}
      noMatchMessage={t("No bookmarks with this tag match these filters.")}
    />
  );

  // The provider gates the "Tagged sections" card field to this page + mode only.
  return search.taggedSections
    ? (
      <SectionTagProvider
        value={{
          tagIds,
          tagName: tag.name,
          mode: sectionDisplayMode,
        }}
      >
        {view}
      </SectionTagProvider>
    )
    : view;
}
