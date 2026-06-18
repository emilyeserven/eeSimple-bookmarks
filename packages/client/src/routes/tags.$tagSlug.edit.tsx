import { Link, createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout, navLinkClass } from "../components/TabbedEntityLayout";
import { useTagBySlug } from "../hooks/useTags";

import { cn } from "@/lib/utils";

export const Route = createFileRoute("/tags/$tagSlug/edit")({
  component: TagEditLayout,
});

const editNav = [
  {
    to: "/tags/$tagSlug/edit/general",
    label: "General",
  },
] as const;

function TagEditLayout() {
  const {
    tagSlug,
  } = Route.useParams();
  const {
    tag, isLoading,
  } = useTagBySlug(tagSlug);

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/tags/$tagSlug"
            params={{
              tagSlug,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            ← Back to {isLoading ? "tag" : (tag?.name ?? "tag")}
          </Link>
          <h1 className="text-2xl font-bold">Edit tag</h1>
        </div>
      )}
      nav={(
        <nav
          className="
            flex shrink-0 flex-col gap-1
            sm:w-48
          "
          aria-label="Tag edit sections"
        >
          {editNav.map(item => (
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
