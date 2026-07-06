import { createFileRoute } from "@tanstack/react-router";

import { EntityInfoView } from "../components/workbench/EntityInfoView";
import { personWorkbench } from "../components/workbench/person";
import { validateInfoTabSearch } from "../lib/infoTabSearch";

export const Route = createFileRoute("/taxonomies/people/$personSlug/_hub/info")({
  validateSearch: validateInfoTabSearch,
  component: PersonInfoTab,
});

function PersonInfoTab() {
  const {
    personSlug,
  } = Route.useParams();
  const {
    tab,
  } = Route.useSearch();
  return (
    <EntityInfoView
      workbench={personWorkbench}
      slug={personSlug}
      infoTo="/taxonomies/people/$personSlug/info"
      params={{
        personSlug,
      }}
      activeTab={tab}
    />
  );
}
