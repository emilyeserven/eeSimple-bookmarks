import { Link, createFileRoute, useRouterState } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useDeleteTag, useTagBySlug } from "../hooks/useTags";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/tags/$tagSlug/_view")({
  component: TagViewLayout,
});

const viewNav = [
  {
    to: "/tags/$tagSlug/general",
    label: "General",
  },
  {
    to: "/tags/$tagSlug/hierarchy",
    label: "Hierarchy",
  },
  {
    to: "/tags/$tagSlug/autofill",
    label: "Autofill Rules",
  },
] as const;

// "hierarchy" is view-only; clicking Edit from there falls back to "general".
const VIEW_TO_EDIT = {
  general: "/tags/$tagSlug/edit/general",
  autofill: "/tags/$tagSlug/edit/autofill",
} as const;
type TagEditRoute = typeof VIEW_TO_EDIT[keyof typeof VIEW_TO_EDIT];

function TagViewLayout() {
  const {
    tagSlug,
  } = Route.useParams();
  const navigate = Route.useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const editRoute: TagEditRoute = (VIEW_TO_EDIT[pathname.split("/").at(-1) as keyof typeof VIEW_TO_EDIT] ?? VIEW_TO_EDIT.general) as TagEditRoute;
  const {
    tag, isLoading,
  } = useTagBySlug(tagSlug);
  const deleteTag = useDeleteTag();

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/tags"
            className="
              inline-block text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            ← Back to tags
          </Link>
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold">
              {isLoading ? "Tag" : (tag?.name ?? "Tag not found")}
            </h1>
            {tag
              ? (
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                  >
                    <Link
                      to={editRoute}
                      params={{
                        tagSlug,
                      }}
                    >
                      Edit
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="
                      text-destructive
                      hover:text-destructive
                    "
                    disabled={deleteTag.isPending}
                    onClick={() => deleteTag.mutate(tag.id, {
                      onSuccess: () => navigate({
                        to: "/tags",
                      }),
                    })}
                  >
                    {deleteTag.isPending ? "Deleting…" : "Delete"}
                  </Button>
                </div>
              )
              : null}
          </div>
        </div>
      )}
      nav={viewNav}
      params={{
        tagSlug,
      }}
      navAriaLabel="Tag sections"
    />
  );
}
