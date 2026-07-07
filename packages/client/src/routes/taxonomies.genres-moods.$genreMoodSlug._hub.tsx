import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ListingHubLayout } from "../components/ListingHubLayout";
import { LocalizedNameLabel } from "../components/LocalizedNameLabel";
import { useGenreMoodBySlug } from "../hooks/useGenreMoods";

export const Route = createFileRoute("/taxonomies/genres-moods/$genreMoodSlug/_hub")({
  component: GenreMoodHubLayout,
});

function GenreMoodHubLayout() {
  const {
    t,
  } = useTranslation();
  const {
    genreMoodSlug,
  } = Route.useParams();
  const {
    genreMood, isLoading,
  } = useGenreMoodBySlug(genreMoodSlug);

  return (
    <ListingHubLayout
      header={(
        <h1
          className="
            flex min-w-0 flex-wrap items-center gap-2 text-2xl font-bold
          "
        >
          {genreMood
            ? (
              <LocalizedNameLabel
                names={genreMood.names ?? []}
                base={genreMood.name}
              />
            )
            : (isLoading ? t("Entry") : t("Entry not found"))}
        </h1>
      )}
      tabs={[
        {
          to: "/taxonomies/genres-moods/$genreMoodSlug",
          label: t("Bookmarks"),
          exact: true,
        },
        {
          to: "/taxonomies/genres-moods/$genreMoodSlug/gallery",
          label: t("Gallery"),
        },
        {
          to: "/taxonomies/genres-moods/$genreMoodSlug/info",
          label: t("Info"),
        },
      ]}
      params={{
        genreMoodSlug,
      }}
      navAriaLabel={t("Genres & Moods sections")}
    />
  );
}
