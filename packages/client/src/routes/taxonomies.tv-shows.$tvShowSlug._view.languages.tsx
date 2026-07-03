import { createFileRoute } from "@tanstack/react-router";

import { tvShowWorkbench } from "../components/workbench/tvShow";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/taxonomies/tv-shows/$tvShowSlug/_view/languages")({
  component: LanguagesViewTab,
});

function LanguagesViewTab() {
  const {
    tvShowSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={tvShowWorkbench}
      tabKey="languages"
      mode="view"
      slug={tvShowSlug}
    />
  );
}
