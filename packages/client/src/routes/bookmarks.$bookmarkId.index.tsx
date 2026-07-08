import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { BookmarkDetail } from "../components/BookmarkDetail";
import { useBookmark } from "../hooks/useBookmarks";

export const Route = createFileRoute("/bookmarks/$bookmarkId/")({
  component: BookmarkDetailPage,
});

function BookmarkDetailPage() {
  const {
    t,
  } = useTranslation();
  const {
    bookmarkId,
  } = Route.useParams();
  const {
    data: bookmark, isLoading, error,
  } = useBookmark(bookmarkId);

  if (isLoading) {
    return <p className="text-muted-foreground">{t("Loading bookmark…")}</p>;
  }

  if (error || !bookmark) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">{error?.message ?? t("Bookmark not found.")}</p>
        <Link
          to="/bookmarks"
          className="
            text-sm text-muted-foreground
            hover:text-foreground
          "
        >
          {t("← Back to bookmarks")}
        </Link>
      </div>
    );
  }

  return <BookmarkDetail bookmark={bookmark} />;
}
