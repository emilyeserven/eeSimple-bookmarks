import { Link, createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useBookmark } from "../hooks/useBookmarks";

export const Route = createFileRoute("/bookmarks/$bookmarkId/edit")({
  component: BookmarkEditLayout,
});

const editNav = [
  {
    to: "/bookmarks/$bookmarkId/edit/general",
    label: "General",
  },
  {
    to: "/bookmarks/$bookmarkId/edit/relationships",
    label: "Relationships",
  },
] as const;

function BookmarkEditLayout() {
  const {
    bookmarkId,
  } = Route.useParams();
  const {
    data: bookmark, isLoading,
  } = useBookmark(bookmarkId);

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/bookmarks/$bookmarkId"
            params={{
              bookmarkId,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            ← Back to bookmark
          </Link>
          <h1 className="text-2xl font-bold">
            {isLoading ? "Edit bookmark" : (bookmark?.title ?? "Edit bookmark")}
          </h1>
        </div>
      )}
      nav={editNav}
      params={{
        bookmarkId,
      }}
      navAriaLabel="Bookmark edit sections"
    />
  );
}
