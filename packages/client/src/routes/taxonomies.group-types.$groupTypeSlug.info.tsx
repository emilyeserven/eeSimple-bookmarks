import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { EntityInfoView } from "../components/workbench/EntityInfoView";
import { groupTypeWorkbench } from "../components/workbench/groupType";
import { useGroupTypeBySlug } from "../hooks/useGroupTypes";
import { validateInfoTabSearch } from "../lib/infoTabSearch";

export const Route = createFileRoute("/taxonomies/group-types/$groupTypeSlug/info")({
  validateSearch: validateInfoTabSearch,
  component: GroupTypeInfoTab,
});

function GroupTypeInfoTab() {
  const {
    t,
  } = useTranslation();
  const {
    groupTypeSlug,
  } = Route.useParams();
  const {
    tab,
  } = Route.useSearch();
  const {
    groupType, isLoading,
  } = useGroupTypeBySlug(groupTypeSlug);

  return (
    <EntityInfoView
      workbench={groupTypeWorkbench}
      slug={groupTypeSlug}
      infoTo="/taxonomies/group-types/$groupTypeSlug/info"
      params={{
        groupTypeSlug,
      }}
      activeTab={tab}
      header={(
        <h1
          className="
            flex min-w-0 flex-wrap items-center gap-2 text-2xl font-bold
          "
        >
          {isLoading ? t("Group type") : (groupType?.name ?? t("Group type not found"))}
        </h1>
      )}
    />
  );
}
