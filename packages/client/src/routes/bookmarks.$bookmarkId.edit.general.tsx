import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { BookmarkEditTabWrapper } from "../components/BookmarkEditTabWrapper";
import { BookmarkGeneralForm } from "../components/BookmarkGeneralForm";
import { useBookmark, useDeleteBookmark } from "../hooks/useBookmarks";
import { useCategories } from "../hooks/useCategories";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/bookmarks/$bookmarkId/edit/general")({
  component: GeneralTab,
});

function GeneralTab() {
  const {
    t,
  } = useTranslation();
  const {
    bookmarkId,
  } = Route.useParams();
  const navigate = Route.useNavigate();
  const {
    data: bookmark,
  } = useBookmark(bookmarkId);
  const {
    data: categories,
  } = useCategories();
  const deleteBookmark = useDeleteBookmark();

  function handleDelete() {
    deleteBookmark.mutate(bookmarkId, {
      onSuccess: () => {
        const slug = (categories ?? []).find(c => c.id === bookmark?.categoryId)?.slug;
        void (slug
          ? navigate({
            to: "/categories/$categorySlug",
            params: {
              categorySlug: slug,
            },
          })
          : navigate({
            to: "/bookmarks",
          }));
      },
    });
  }

  return (
    <BookmarkEditTabWrapper
      bookmarkId={bookmarkId}
      title={t("General")}
      description={t("URL, name, description, category, and tags.")}
    >
      {bookmark => (
        <>
          <BookmarkGeneralForm bookmark={bookmark} />
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{t("Delete bookmark")}</p>
              <p className="text-sm text-muted-foreground">{t("This action cannot be undone.")}</p>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleteBookmark.isPending}
            >
              {t("Delete")}
            </Button>
          </div>
        </>
      )}
    </BookmarkEditTabWrapper>
  );
}
