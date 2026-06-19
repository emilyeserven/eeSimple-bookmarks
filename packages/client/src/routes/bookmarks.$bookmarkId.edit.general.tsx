import { createFileRoute } from "@tanstack/react-router";

import { BookmarkForm } from "../components/BookmarkForm";
import { useBookmark } from "../hooks/useBookmarks";

export const Route = createFileRoute("/bookmarks/$bookmarkId/edit/general")({
  component: GeneralTab,
});

function GeneralTab() {
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
    <BookmarkForm
      bookmark={bookmark}
      onDone={backToDetail}
    />
  );
}
