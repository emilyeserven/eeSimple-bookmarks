import { Link, createFileRoute } from "@tanstack/react-router";

import { BookmarkCard } from "../components/BookmarkCard";
import { useBookmarks } from "../hooks/useBookmarks";
import { sortPinnedBookmarks } from "../lib/pinned";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const {
    data: bookmarks, isLoading, error,
  } = useBookmarks();

  const pinned = sortPinnedBookmarks(bookmarks ?? []);

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Pinned</h1>
        <p className="text-muted-foreground">
          Your homepage bookmarks, ordered by priority.
        </p>
      </div>

      {isLoading ? <p className="text-muted-foreground">Loading bookmarks…</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}

      {!isLoading && pinned.length === 0
        ? (
          <p className="text-muted-foreground">
            Nothing pinned yet. Pin a bookmark from the
            {" "}
            <Link
              to="/bookmarks"
              className="
                font-medium text-foreground
                hover:underline
              "
            >
              Bookmarks
            </Link>
            {" "}
            page (under “Advanced”) to see it here.
          </p>
        )
        : null}

      <div
        className="
          grid gap-3
          sm:grid-cols-2
        "
      >
        {pinned.map(bookmark => (
          <BookmarkCard
            key={bookmark.id}
            bookmark={bookmark}
          />
        ))}
      </div>
    </section>
  );
}
