import { createFileRoute, Link } from "@tanstack/react-router";
import { Tag as TagIcon } from "lucide-react";

import { useCategoryPageData } from "./-categoryPageData";
import { BookmarkSearchView } from "../components/BookmarkSearchView";
import { validateBookmarkSearch } from "../lib/bookmarkSearch";
import { findAncestorPath, subtreeIds } from "../lib/tagTree";

export const Route = createFileRoute("/tags/$tagSlug/")({
  validateSearch: validateBookmarkSearch,
  component: TagBookmarksPage,
});

function TagBookmarksPage() {
  const {
    tagSlug,
  } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const {
    categories,
    properties,
    propertyGroups,
    bookmarks,
    bookmarksLoading,
    error,
    tagTree,
    mediaTypes,
    youtubeChannels,
    relationshipTypes,
    authors,
  } = useCategoryPageData(search.tags);

  const path = tagTree ? findAncestorPath(tagTree, tagSlug) : null;
  const tag = path?.[path.length - 1];

  // Still resolving the tag tree — wait before deciding the tag is missing.
  if (!tagTree && bookmarksLoading) {
    return <p className="text-muted-foreground">Loading tag…</p>;
  }

  if (!tag) {
    return <p className="text-destructive">Tag not found.</p>;
  }

  // Include bookmarks tagged with this tag or any of its descendants.
  const tagIds = new Set(subtreeIds(tag));
  const tagBookmarks = (bookmarks ?? []).filter(b => b.tags.some(t => tagIds.has(t.id)));

  return (
    <BookmarkSearchView
      header={(
        <div className="space-y-2">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <TagIcon className="size-6 shrink-0" />
            {tag.name}
          </h1>
          {tag.children.length > 0 && (
            <div
              className="
                flex flex-wrap items-center gap-2 text-sm text-muted-foreground
              "
            >
              <span>Sub-tags:</span>
              {tag.children.map(child => (
                <Link
                  key={child.id}
                  to="/tags/$tagSlug"
                  params={{
                    tagSlug: child.slug,
                  }}
                  className="
                    rounded-full border px-2.5 py-0.5 font-medium
                    hover:bg-accent
                  "
                >
                  {child.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
      pageKey={`tag:${tagSlug}`}
      tree={tagTree ?? []}
      properties={properties ?? []}
      propertyGroups={propertyGroups ?? []}
      categories={categories ?? []}
      mediaTypes={mediaTypes ?? []}
      youtubeChannels={youtubeChannels ?? []}
      relationshipTypes={relationshipTypes ?? []}
      authors={authors ?? []}
      bookmarks={tagBookmarks}
      search={search}
      onSearchChange={next => navigate({
        search: next,
        replace: true,
        resetScroll: false,
      })}
      isLoading={bookmarksLoading}
      error={error}
      emptyMessage="No bookmarks with this tag yet."
      noMatchMessage="No bookmarks with this tag match these filters."
    />
  );
}
