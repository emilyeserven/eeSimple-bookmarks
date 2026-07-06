import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ListingHubLayout } from "../components/ListingHubLayout";
import { LocalizedNameLabel } from "../components/LocalizedNameLabel";
import { TaxonomyViewHeader } from "../components/TaxonomyViewHeader";
import { useGroupBySlug } from "../hooks/useGroups";

/**
 * The group listing shell: the entity header over the `Bookmarks | Gallery | Media | Info` strip,
 * shared by the bookmarks/gallery/media panes and the Info page. `edit` is a sibling of this pathless
 * layout, so the strip never shows while editing.
 */
export const Route = createFileRoute("/taxonomies/groups/$groupSlug/_hub")({
  component: GroupHubLayout,
});

function GroupHubLayout() {
  const {
    t,
  } = useTranslation();
  const {
    groupSlug,
  } = Route.useParams();
  const {
    group, isLoading,
  } = useGroupBySlug(groupSlug);

  return (
    <ListingHubLayout
      header={(
        <TaxonomyViewHeader
          image={{
            kind: "url",
            url: group?.imageUrl ?? null,
          }}
          title={group
            ? (
              <LocalizedNameLabel
                names={group.names ?? []}
                base={group.name}
              />
            )
            : (isLoading ? t("Group") : t("Group not found"))}
        />
      )}
      tabs={[
        {
          to: "/taxonomies/groups/$groupSlug",
          label: t("Bookmarks"),
          exact: true,
        },
        {
          to: "/taxonomies/groups/$groupSlug/gallery",
          label: t("Gallery"),
        },
        {
          to: "/taxonomies/groups/$groupSlug/media",
          label: t("Media"),
        },
        {
          to: "/taxonomies/groups/$groupSlug/info",
          label: t("Info"),
        },
      ]}
      params={{
        groupSlug,
      }}
      navAriaLabel={t("Group sections")}
    />
  );
}
