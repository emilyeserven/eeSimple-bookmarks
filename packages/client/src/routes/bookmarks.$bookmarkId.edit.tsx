import { createFileRoute } from "@tanstack/react-router";

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
    to: "/bookmarks/$bookmarkId/edit/properties",
    label: "Properties",
  },
  {
    to: "/bookmarks/$bookmarkId/edit/image",
    label: "Image",
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
        <h1 className="text-2xl font-bold">
          {isLoading ? "Edit bookmark" : (bookmark?.title ?? "Bookmark not found")}
        </h1>
      )}
      nav={editNav}
      params={{
        bookmarkId,
      }}
      navAriaLabel="Bookmark edit sections"
    />
  );
}
