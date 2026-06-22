import { createFileRoute } from "@tanstack/react-router";

import { websiteWorkbench } from "../components/workbench/website";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/taxonomies/websites/$websiteSlug/_view/shortened-links")({
  component: ShortenedLinksViewTab,
});

function ShortenedLinksViewTab() {
  const {
    websiteSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={websiteWorkbench}
      tabKey="shortened-links"
      mode="view"
      slug={websiteSlug}
    />
  );
}
