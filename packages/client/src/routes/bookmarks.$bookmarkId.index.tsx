import { Link, createFileRoute } from "@tanstack/react-router";

import { BookmarkDetail } from "../components/BookmarkDetail";
import { useBookmark, useDeleteBookmark } from "../hooks/useBookmarks";
import { useCategories } from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { usePropertyGroups } from "../hooks/usePropertyGroups";

import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/bookmarks/$bookmarkId/")({
  component: BookmarkDetailPage,
});

function BookmarkDetailPage() {
  const {
    bookmarkId,
  } = Route.useParams();
  const navigate = Route.useNavigate();
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
  const deleteBookmark = useDeleteBookmark();

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

  return (
    <section className="space-y-4">
      <Link
        to="/bookmarks"
        className="
          inline-block text-sm text-muted-foreground
          hover:text-foreground
        "
      >
        ← Back to bookmarks
      </Link>
      <Card className="p-4">
        <BookmarkDetail
          bookmark={bookmark}
          categories={categories ?? []}
          properties={properties ?? []}
          propertyGroups={propertyGroups ?? []}
          onEdit={() => navigate({
            to: "/bookmarks/$bookmarkId/edit",
            params: {
              bookmarkId,
            },
          })}
          onDelete={() => deleteBookmark.mutate(bookmarkId, {
            onSuccess: () => {
              // Return to the bookmark's category listing, or all bookmarks if it has none.
              const slug = (categories ?? [])
                .find(item => item.id === bookmark.categoryId)?.slug;
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
          })}
        />
      </Card>
    </section>
  );
}
