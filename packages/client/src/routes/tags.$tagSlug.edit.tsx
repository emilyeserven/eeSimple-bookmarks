import { Link, createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useTagBySlug } from "../hooks/useTags";

export const Route = createFileRoute("/tags/$tagSlug/edit")({
  component: TagEditLayout,
});

const editNav = [
  {
    to: "/tags/$tagSlug/edit/general",
    label: "General",
  },
  {
    to: "/tags/$tagSlug/edit/autofill",
    label: "Autofill Rules",
  },
  {
    to: "/tags/$tagSlug/edit/display-rules",
    label: "Display Rules",
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
      nav={editNav}
      params={{
        tagSlug,
      }}
      navAriaLabel="Tag edit sections"
    />
  );
}
