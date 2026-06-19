import { createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useBookmark, useDeleteBookmark } from "../hooks/useBookmarks";
import { useCategories } from "../hooks/useCategories";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/bookmarks/$bookmarkId/edit")({
  component: BookmarkEditLayout,
});

const editNav = [
  {
    to: "/bookmarks/$bookmarkId/edit/general",
    label: "General",
  },
  {
    to: "/bookmarks/$bookmarkId/edit/properties",
    label: "Properties",
  },
  {
    to: "/bookmarks/$bookmarkId/edit/image",
    label: "Image",
  },
  {
    to: "/bookmarks/$bookmarkId/edit/relationships",
    label: "Relationships",
  },
] as const;

function BookmarkEditLayout() {
  const {
    bookmarkId,
  } = Route.useParams();
  const navigate = Route.useNavigate();
  const {
    data: bookmark, isLoading,
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
    <div className="space-y-6">
      <TabbedEntityLayout
        header={(
          <h1 className="text-2xl font-bold">
            {isLoading ? "Edit bookmark" : (bookmark?.title ?? "Bookmark not found")}
          </h1>
        )}
        nav={editNav}
        params={{
          bookmarkId,
        }}
        navAriaLabel="Bookmark edit sections"
      />
      <Separator />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Delete bookmark</p>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
        </div>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={deleteBookmark.isPending}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
