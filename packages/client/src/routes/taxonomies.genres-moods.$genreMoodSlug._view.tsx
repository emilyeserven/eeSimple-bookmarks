import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { RomanizedLabel } from "../components/RomanizedLabel";
import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useGenreMoodBySlug } from "../hooks/useGenreMoods";

export const Route = createFileRoute("/taxonomies/genres-moods/$genreMoodSlug/_view")({
  component: GenreMoodViewLayout,
});

function GenreMoodViewLayout() {
  const {
    t,
  } = useTranslation();
  const {
    genreMoodSlug,
  } = Route.useParams();
  const {
    genreMood, isLoading,
  } = useGenreMoodBySlug(genreMoodSlug);

  const viewNav = [
    {
      to: "/taxonomies/genres-moods/$genreMoodSlug/general",
      label: t("General"),
    },
    {
      to: "/taxonomies/genres-moods/$genreMoodSlug/hierarchy",
      label: t("Hierarchy"),
    },
  ] as const;

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
            : (isLoading ? t("Entry") : t("Entry not found"))}
        </h1>
      )}
      nav={viewNav}
      params={{
        genreMoodSlug,
      }}
      navAriaLabel={t("Genres & Moods sections")}
    />
  );
}
