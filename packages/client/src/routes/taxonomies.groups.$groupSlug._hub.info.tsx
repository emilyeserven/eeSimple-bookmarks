import { createFileRoute } from "@tanstack/react-router";

import { EntityInfoView } from "../components/workbench/EntityInfoView";
import { groupWorkbench } from "../components/workbench/group";
import { validateInfoTabSearch } from "../lib/infoTabSearch";

export const Route = createFileRoute("/taxonomies/groups/$groupSlug/_hub/info")({
  validateSearch: validateInfoTabSearch,
  component: GroupInfoTab,
});

function GroupInfoTab() {
  const {
    groupSlug,
  } = Route.useParams();
  const {
    tab,
  } = Route.useSearch();
  return (
    <EntityInfoView
      workbench={groupWorkbench}
      slug={groupSlug}
      infoTo="/taxonomies/groups/$groupSlug/info"
      params={{
        groupSlug,
      }}
      activeTab={tab}
    />
  );
}
