import { createFileRoute } from "@tanstack/react-router";

import { tvShowWorkbench } from "../components/workbench/tvShow";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/taxonomies/tv-shows/$tvShowSlug/edit/languages")({
  component: LanguagesEditTab,
});

function LanguagesEditTab() {
  const {
    tvShowSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={tvShowWorkbench}
      tabKey="languages"
      mode="edit"
      slug={tvShowSlug}
    />
  );
}
