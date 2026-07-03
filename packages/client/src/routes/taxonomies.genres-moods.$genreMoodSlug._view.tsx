import { createFileRoute } from "@tanstack/react-router";

import { RomanizedLabel } from "../components/RomanizedLabel";
import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useGenreMoodBySlug } from "../hooks/useGenreMoods";

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

function GenreMoodViewLayout() {
  const {
    genreMoodSlug,
  } = Route.useParams();
  const {
    genreMood, isLoading,
  } = useGenreMoodBySlug(genreMoodSlug);

  return (
    <TabbedEntityLayout
      header={(
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
      )}
      nav={viewNav}
      params={{
        genreMoodSlug,
      }}
      navAriaLabel="Genres & Moods sections"
    />
  );
}
