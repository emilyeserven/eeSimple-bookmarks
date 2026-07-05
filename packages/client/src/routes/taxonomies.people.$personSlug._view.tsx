import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { LocalizedNameLabel } from "../components/LocalizedNameLabel";
import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { TaxonomyViewHeader } from "../components/TaxonomyViewHeader";
import { usePersonBySlug } from "../hooks/usePeople";

export const Route = createFileRoute("/taxonomies/people/$personSlug/_view")({
  component: PersonViewLayout,
});

function PersonViewLayout() {
  const {
    t,
  } = useTranslation();
  const {
    personSlug,
  } = Route.useParams();
  const {
    person, isLoading,
  } = usePersonBySlug(personSlug);
  const viewNav = [
    {
      to: "/taxonomies/people/$personSlug/general",
      label: t("General"),
    },
  ] as const;

  return (
    <TabbedEntityLayout
      header={(
        <TaxonomyViewHeader
          image={{
            kind: "url",
            url: person?.imageUrl ?? null,
          }}
          title={person
            ? (
              <LocalizedNameLabel
                names={person.names ?? []}
                base={person.name}
              />
            )
            : (isLoading ? t("Person") : t("Person not found"))}
        />
      )}
      nav={viewNav}
      params={{
        personSlug,
      }}
      navAriaLabel={t("Person sections")}
    />
  );
}
