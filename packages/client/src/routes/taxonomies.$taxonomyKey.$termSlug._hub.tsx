import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ListingHubLayout } from "../components/ListingHubLayout";
import { LocalizedNameLabel } from "../components/LocalizedNameLabel";
import { useTaxonomyBySlug, useTaxonomyTermBySlug } from "../hooks/useTaxonomies";

export const Route = createFileRoute("/taxonomies/$taxonomyKey/$termSlug/_hub")({
  component: TaxonomyTermHubLayout,
});

function TaxonomyTermHubLayout() {
  const {
    t,
  } = useTranslation();
  const {
    taxonomyKey, termSlug,
  } = Route.useParams();
  const {
    taxonomy,
  } = useTaxonomyBySlug(taxonomyKey);
  const {
    term, isLoading,
  } = useTaxonomyTermBySlug(taxonomy?.id, termSlug);

  return (
    <ListingHubLayout
      header={(
        <h1
          className="
            flex min-w-0 flex-wrap items-center gap-2 text-2xl font-bold
          "
        >
          {term
            ? (
              <LocalizedNameLabel
                names={term.names ?? []}
                base={term.name}
              />
            )
            : (isLoading ? t("Term") : t("Term not found"))}
        </h1>
      )}
      tabs={[
        {
          to: "/taxonomies/$taxonomyKey/$termSlug",
          label: t("Bookmarks"),
          exact: true,
        },
        {
          to: "/taxonomies/$taxonomyKey/$termSlug/gallery",
          label: t("Gallery"),
        },
        {
          to: "/taxonomies/$taxonomyKey/$termSlug/info",
          label: t("Info"),
        },
      ]}
      params={{
        taxonomyKey,
        termSlug,
      }}
      navAriaLabel={t("{{name}} sections", {
        name: taxonomy?.name ?? t("term"),
      })}
    />
  );
}
