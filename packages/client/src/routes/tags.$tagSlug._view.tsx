import { Link, createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout, navLinkClass } from "../components/TabbedEntityLayout";
import { useDeleteTag, useTagBySlug } from "../hooks/useTags";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/tags/$tagSlug/_view")({
  component: TagViewLayout,
});

const viewNav = [
  {
    to: "/tags/$tagSlug/general",
    label: "General",
  },
] as const;

function TagViewLayout() {
  const {
    tagSlug,
  } = Route.useParams();
  const navigate = Route.useNavigate();
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
                      to="/tags/$tagSlug/edit/general"
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
      nav={(
        <nav
          className="
            flex shrink-0 flex-col gap-1
            sm:w-48
          "
          aria-label="Tag sections"
        >
          {viewNav.map(item => (
            <Link
              key={item.to}
              to={item.to}
              params={{
                tagSlug,
              }}
              className={cn(navLinkClass)}
              activeProps={{
                className: "bg-accent text-accent-foreground",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    />
  );
}
