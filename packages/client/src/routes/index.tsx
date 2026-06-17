import { Link, createFileRoute } from "@tanstack/react-router";

import { BookmarkCard } from "../components/BookmarkCard";
import { ColumnsSwitcher } from "../components/ColumnsSwitcher";
import { useHomepageBookmarks } from "../hooks/useBookmarks";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { COLUMN_CLASS, useBookmarkColumns } from "../lib/bookmarkColumns";

export const Route = createFileRoute("/")({
  component: HomePage,
});

const HOME_PAGE_KEY = "home";

function HomePage() {
  const {
    data: bookmarks, isLoading, error,
  } = useHomepageBookmarks();
  const {
    data: customProperties,
  } = useCustomProperties();
  const columns = useBookmarkColumns(HOME_PAGE_KEY);

  const homepage = bookmarks ?? [];

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Homepage</h1>
          <p className="text-muted-foreground">
            Bookmarks from your homepage categories and tags, ordered by priority.
          </p>
        </div>
        <ColumnsSwitcher pageKey={HOME_PAGE_KEY} />
      </div>

      {isLoading ? <p className="text-muted-foreground">Loading bookmarks…</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}

      {!isLoading && homepage.length === 0
        ? (
          <p className="text-muted-foreground">
            Nothing here yet. Choose homepage categories or tags in
            {" "}
            <Link
              to="/settings/categories"
              className="
                font-medium text-foreground
                hover:underline
              "
            >
              Settings → Categories
            </Link>
            {" "}
            to surface bookmarks here.
          </p>
        )
        : null}

      <div
        className={`
          grid gap-3
          ${COLUMN_CLASS[columns]}
        `}
      >
        {homepage.map(bookmark => (
          <BookmarkCard
            key={bookmark.id}
            bookmark={bookmark}
            properties={customProperties ?? []}
          />
        ))}
      </div>
    </section>
  );
}
