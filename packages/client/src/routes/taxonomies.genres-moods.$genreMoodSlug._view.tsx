import { Link, createFileRoute, useRouterState } from "@tanstack/react-router";

import { RomanizedLabel } from "../components/RomanizedLabel";
import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useDeleteGenreMood, useGenreMoodBySlug } from "../hooks/useGenreMoods";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/taxonomies/genres-moods/$genreMoodSlug/_view")({
  component: GenreMoodViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/genres-moods/$genreMoodSlug/general",
    label: "General",
  },
  {
    to: "/taxonomies/genres-moods/$genreMoodSlug/hierarchy",
    label: "Hierarchy",
  },
] as const;

const VIEW_TO_EDIT = {
  general: "/taxonomies/genres-moods/$genreMoodSlug/edit/general",
} as const;
type GenreMoodEditRoute = typeof VIEW_TO_EDIT[keyof typeof VIEW_TO_EDIT];

function GenreMoodViewLayout() {
  const {
    genreMoodSlug,
  } = Route.useParams();
  const navigate = Route.useNavigate();
  const pathname = useRouterState({
    select: s => s.location.pathname,
  });
  const editRoute: GenreMoodEditRoute = (VIEW_TO_EDIT[pathname.split("/").at(-1) as keyof typeof VIEW_TO_EDIT] ?? VIEW_TO_EDIT.general) as GenreMoodEditRoute;
  const {
    genreMood, isLoading,
  } = useGenreMoodBySlug(genreMoodSlug);
  const deleteGenreMood = useDeleteGenreMood();

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/genres-moods"
            className="
              inline-block text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            ← Back to Genres & Moods
          </Link>
          <div className="flex items-start justify-between gap-4">
            <h1
              className="
                flex min-w-0 flex-wrap items-center gap-2 text-2xl font-bold
              "
            >
              {genreMood
                ? (
                  <RomanizedLabel
                    name={genreMood.name}
                    romanized={genreMood.romanizedName}
                  />
                )
                : (isLoading ? "Entry" : "Entry not found")}
            </h1>
            {genreMood
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
                        genreMoodSlug,
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
                    disabled={deleteGenreMood.isPending}
                    onClick={() => deleteGenreMood.mutate(genreMood.id, {
                      onSuccess: () => navigate({
                        to: "/taxonomies/genres-moods",
                      }),
                    })}
                  >
                    {deleteGenreMood.isPending ? "Deleting…" : "Delete"}
                  </Button>
                </div>
              )
              : null}
          </div>
        </div>
      )}
      nav={viewNav}
      params={{
        genreMoodSlug,
      }}
      navAriaLabel="Genres & Moods sections"
    />
  );
}
