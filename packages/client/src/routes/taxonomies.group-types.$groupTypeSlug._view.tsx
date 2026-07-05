import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useGroupTypeBySlug } from "../hooks/useGroupTypes";

export const Route = createFileRoute("/taxonomies/group-types/$groupTypeSlug/_view")({
  component: GroupTypeViewLayout,
});

function GroupTypeViewLayout() {
  const {
    t,
  } = useTranslation();
  const {
    groupTypeSlug,
  } = Route.useParams();
  const {
    groupType, isLoading,
  } = useGroupTypeBySlug(groupTypeSlug);

  const viewNav = [
    {
      to: "/taxonomies/group-types/$groupTypeSlug/general",
      label: t("General"),
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
          {isLoading ? t("Group type") : (groupType?.name ?? t("Group type not found"))}
        </h1>
      )}
      nav={viewNav}
      params={{
        groupTypeSlug,
      }}
      navAriaLabel={t("Group type sections")}
    />
  );
}
