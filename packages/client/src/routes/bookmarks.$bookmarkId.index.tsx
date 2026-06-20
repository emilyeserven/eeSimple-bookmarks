import { Link, createFileRoute } from "@tanstack/react-router";

import { BookmarkDetail } from "../components/BookmarkDetail";
import { useBookmark, useUpdateBookmark } from "../hooks/useBookmarks";
import { useCategories } from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { usePropertyGroups } from "../hooks/usePropertyGroups";
import { mergeBooleanValue } from "../lib/bookmarkFormat";

export const Route = createFileRoute("/bookmarks/$bookmarkId/")({
  component: BookmarkDetailPage,
});

function BookmarkDetailPage() {
  const {
    bookmarkId,
  } = Route.useParams();
  const {
    data: bookmark, isLoading, error,
  } = useBookmark(bookmarkId);
  const {
    data: categories,
  } = useCategories();
  const {
    data: properties,
  } = useCustomProperties();
  const {
    data: propertyGroups,
  } = usePropertyGroups();
  const updateBookmark = useUpdateBookmark();

  if (isLoading) {
    return <p className="text-muted-foreground">Loading bookmark…</p>;
  }

  if (error || !bookmark) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">{error?.message ?? "Bookmark not found."}</p>
        <Link
          to="/bookmarks"
          className="
            text-sm text-muted-foreground
            hover:text-foreground
          "
        >
          ← Back to bookmarks
        </Link>
      </div>
    );
  }

  function saveBoolean(propertyId: string, value: boolean) {
    if (!bookmark) return;
    updateBookmark.mutate({
      id: bookmark.id,
      input: {
        booleanValues: mergeBooleanValue(bookmark.booleanValues, propertyId, value),
      },
    });
  }

  return (
    <BookmarkDetail
      bookmark={bookmark}
      categories={categories ?? []}
      properties={properties ?? []}
      propertyGroups={propertyGroups ?? []}
      onSaveBoolean={saveBoolean}
    />
  );
}
