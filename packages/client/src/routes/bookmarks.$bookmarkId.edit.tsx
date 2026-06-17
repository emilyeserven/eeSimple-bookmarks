import { Link, createFileRoute } from "@tanstack/react-router";

import { BookmarkForm } from "../components/BookmarkForm";
import { useBookmark } from "../hooks/useBookmarks";

export const Route = createFileRoute("/bookmarks/$bookmarkId/edit")({
  component: BookmarkEditPage,
});

function BookmarkEditPage() {
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

  return (
    <section className="space-y-6">
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
        <h1 className="text-2xl font-bold">Edit bookmark</h1>
      </div>

      {isLoading ? <p className="text-muted-foreground">Loading bookmark…</p> : null}
      {error || (!isLoading && !bookmark)
        ? <p className="text-destructive">{error?.message ?? "Bookmark not found."}</p>
        : null}
      {bookmark
        ? (
          <BookmarkForm
            bookmark={bookmark}
            onDone={backToDetail}
          />
        )
        : null}
    </section>
  );
}
