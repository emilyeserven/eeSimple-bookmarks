import { createFileRoute } from "@tanstack/react-router";

import { newsletterWorkbench } from "../components/workbench/newsletter";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/taxonomies/newsletters/$newsletterSlug/_view/general")({
  component: GeneralViewTab,
});

function GeneralViewTab() {
  const {
    newsletterSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={newsletterWorkbench}
      tabKey="general"
      mode="view"
      slug={newsletterSlug}
    />
  );
}
