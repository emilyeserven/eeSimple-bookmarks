import { createFileRoute } from "@tanstack/react-router";

import { EntityInfoView } from "../components/workbench/EntityInfoView";
import { websiteWorkbench } from "../components/workbench/website";
import { validateInfoTabSearch } from "../lib/infoTabSearch";

export const Route = createFileRoute("/taxonomies/websites/$websiteSlug/_hub/info")({
  validateSearch: validateInfoTabSearch,
  component: WebsiteInfoTab,
});

function WebsiteInfoTab() {
  const {
    websiteSlug,
  } = Route.useParams();
  const {
    tab,
  } = Route.useSearch();
  return (
    <EntityInfoView
      workbench={websiteWorkbench}
      slug={websiteSlug}
      infoTo="/taxonomies/websites/$websiteSlug/info"
      params={{
        websiteSlug,
      }}
      activeTab={tab}
    />
  );
}
