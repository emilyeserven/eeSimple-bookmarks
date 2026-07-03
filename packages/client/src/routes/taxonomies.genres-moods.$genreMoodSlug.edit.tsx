import { Link, createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useGenreMoodBySlug } from "../hooks/useGenreMoods";

export const Route = createFileRoute("/taxonomies/genres-moods/$genreMoodSlug/edit")({
  component: GenreMoodEditLayout,
});

const editNav = [
  {
    to: "/taxonomies/genres-moods/$genreMoodSlug/edit/general",
    label: "General",
  },
] as const;

function GenreMoodEditLayout() {
  const {
    genreMoodSlug,
  } = Route.useParams();
  const {
    genreMood, isLoading,
  } = useGenreMoodBySlug(genreMoodSlug);

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/genres-moods/$genreMoodSlug"
            params={{
              genreMoodSlug,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            ← Back to {isLoading ? "entry" : (genreMood?.name ?? "entry")}
          </Link>
          <h1 className="text-2xl font-bold">Edit entry</h1>
        </div>
      )}
      nav={editNav}
      params={{
        genreMoodSlug,
      }}
      navAriaLabel="Genres & Moods edit sections"
    />
  );
}
