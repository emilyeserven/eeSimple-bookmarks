import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ListingHubLayout } from "../components/ListingHubLayout";
import { LocalizedNameLabel } from "../components/LocalizedNameLabel";
import { TaxonomyViewHeader } from "../components/TaxonomyViewHeader";
import { usePersonBySlug } from "../hooks/usePeople";

/**
 * The person listing shell: the entity header over the `Bookmarks | Gallery | Media | Info` strip,
 * shared by the bookmarks/gallery/media panes and the Info page. `edit` is a sibling of this pathless
 * layout, so the strip never shows while editing.
 */
export const Route = createFileRoute("/taxonomies/people/$personSlug/_hub")({
  component: PersonHubLayout,
});

function PersonHubLayout() {
  const {
    t,
  } = useTranslation();
  const {
    personSlug,
  } = Route.useParams();
  const {
    person, isLoading,
  } = usePersonBySlug(personSlug);

  return (
    <ListingHubLayout
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
      tabs={[
        {
          to: "/taxonomies/people/$personSlug",
          label: t("Bookmarks"),
          exact: true,
        },
        {
          to: "/taxonomies/people/$personSlug/gallery",
          label: t("Gallery"),
        },
        {
          to: "/taxonomies/people/$personSlug/media",
          label: t("Media"),
        },
        {
          to: "/taxonomies/people/$personSlug/info",
          label: t("Info"),
        },
      ]}
      params={{
        personSlug,
      }}
      navAriaLabel={t("Person sections")}
    />
  );
}
