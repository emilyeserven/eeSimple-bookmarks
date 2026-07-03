import { createFileRoute } from "@tanstack/react-router";

import { RomanizedLabel } from "../components/RomanizedLabel";
import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { TaxonomyViewHeader } from "../components/TaxonomyViewHeader";
import { usePersonBySlug } from "../hooks/usePeople";

export const Route = createFileRoute("/taxonomies/people/$personSlug/_view")({
  component: PersonViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/people/$personSlug/general",
    label: "General",
  },
] as const;

function PersonViewLayout() {
  const {
    personSlug,
  } = Route.useParams();
  const {
    person, isLoading,
  } = usePersonBySlug(personSlug);

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
              <RomanizedLabel
                name={person.name}
                romanized={person.romanizedName}
              />
            )
            : (isLoading ? "Person" : "Person not found")}
        />
      )}
      nav={viewNav}
      params={{
        personSlug,
      }}
      navAriaLabel="Person sections"
    />
  );
}
