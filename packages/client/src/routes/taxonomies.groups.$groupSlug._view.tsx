import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { RomanizedLabel } from "../components/RomanizedLabel";
import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { TaxonomyViewHeader } from "../components/TaxonomyViewHeader";
import { useGroupBySlug } from "../hooks/useGroups";

export const Route = createFileRoute("/taxonomies/groups/$groupSlug/_view")({
  component: GroupViewLayout,
});

function GroupViewLayout() {
  const {
    t,
  } = useTranslation();
  const {
    groupSlug,
  } = Route.useParams();
  const {
    group, isLoading,
  } = useGroupBySlug(groupSlug);
  const viewNav = [
    {
      to: "/taxonomies/groups/$groupSlug/general",
      label: t("General"),
    },
  ] as const;

  return (
    <TabbedEntityLayout
      header={(
        <TaxonomyViewHeader
          image={{
            kind: "url",
            url: group?.imageUrl ?? null,
          }}
          title={group
            ? (
              <RomanizedLabel
                name={group.name}
                romanized={group.romanizedName}
              />
            )
            : (isLoading ? t("Group") : t("Group not found"))}
        />
      )}
      nav={viewNav}
      params={{
        groupSlug,
      }}
      navAriaLabel={t("Group sections")}
    />
  );
}
