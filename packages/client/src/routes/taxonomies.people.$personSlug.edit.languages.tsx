import { createFileRoute } from "@tanstack/react-router";

import { personWorkbench } from "../components/workbench/person";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/taxonomies/people/$personSlug/edit/languages")({
  component: LanguagesEditTab,
});

function LanguagesEditTab() {
  const {
    personSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={personWorkbench}
      tabKey="languages"
      mode="edit"
      slug={personSlug}
    />
  );
}
