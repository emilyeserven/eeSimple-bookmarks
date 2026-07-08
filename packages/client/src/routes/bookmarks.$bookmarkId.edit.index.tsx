import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { BookmarkEditView } from "../components/BookmarkEditView";
import { useBookmark } from "../hooks/useBookmarks";

import { validateEditTabSearch } from "@/lib/infoTabSearch";

export const Route = createFileRoute("/bookmarks/$bookmarkId/edit/")({
  validateSearch: validateEditTabSearch,
  component: BookmarkEditPage,
});

function BookmarkEditPage() {
  const {
    t,
  } = useTranslation();
  const {
    bookmarkId,
  } = Route.useParams();
  const {
    tab,
  } = Route.useSearch();
  const {
    data: bookmark, isLoading,
  } = useBookmark(bookmarkId);

  return (
    <BookmarkEditView
      bookmarkId={bookmarkId}
      activeTab={tab}
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
            {t("← Back to bookmark")}
          </Link>
          <h1 className="text-2xl font-bold">
            {isLoading ? t("Edit bookmark") : (bookmark?.title ?? t("Bookmark not found"))}
          </h1>
        </div>
      )}
    />
  );
}
