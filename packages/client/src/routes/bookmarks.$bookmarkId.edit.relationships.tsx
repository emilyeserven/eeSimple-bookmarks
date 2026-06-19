import { createFileRoute } from "@tanstack/react-router";

import { BookmarkRelationshipsEditor } from "../components/BookmarkRelationshipsEditor";
import { useBookmark } from "../hooks/useBookmarks";

export const Route = createFileRoute("/bookmarks/$bookmarkId/edit/relationships")({
  component: RelationshipsTab,
});

function RelationshipsTab() {
  const {
    bookmarkId,
  } = Route.useParams();
  const navigate = Route.useNavigate();
  const {
    data: bookmark, isLoading, error,
  } = useBookmark(bookmarkId);

  const backToDetail = () => navigate({
    to: "/bookmarks/$bookmarkId",
    params: {
      bookmarkId,
    },
  });

  if (isLoading) return <p className="text-muted-foreground">Loading bookmark…</p>;
  if (error || !bookmark) {
    return (
      <p className="text-destructive">{error?.message ?? "Bookmark not found."}</p>
    );
  }

  return (
    <BookmarkRelationshipsEditor
      bookmarkId={bookmarkId}
      initialRelated={bookmark.relatedBookmarks}
      onDone={backToDetail}
    />
  );
}
