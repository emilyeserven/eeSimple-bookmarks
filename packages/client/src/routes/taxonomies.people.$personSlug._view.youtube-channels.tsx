import { createFileRoute } from "@tanstack/react-router";

import { personWorkbench } from "../components/workbench/person";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/taxonomies/people/$personSlug/_view/youtube-channels")({
  component: YouTubeChannelsViewTab,
});

function YouTubeChannelsViewTab() {
  const {
    personSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={personWorkbench}
      tabKey="youtube-channels"
      mode="view"
      slug={personSlug}
    />
  );
}
