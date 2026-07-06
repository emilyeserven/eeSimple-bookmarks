import { createFileRoute } from "@tanstack/react-router";

import { EntityInfoView } from "../components/workbench/EntityInfoView";
import { locationWorkbench } from "../components/workbench/location";
import { validateInfoTabSearch } from "../lib/infoTabSearch";

export const Route = createFileRoute("/taxonomies/locations/$locationSlug/_hub/info")({
  validateSearch: validateInfoTabSearch,
  component: LocationInfoTab,
});

function LocationInfoTab() {
  const {
    locationSlug,
  } = Route.useParams();
  const {
    tab,
  } = Route.useSearch();
  return (
    <EntityInfoView
      workbench={locationWorkbench}
      slug={locationSlug}
      infoTo="/taxonomies/locations/$locationSlug/info"
      params={{
        locationSlug,
      }}
      activeTab={tab}
    />
  );
}
