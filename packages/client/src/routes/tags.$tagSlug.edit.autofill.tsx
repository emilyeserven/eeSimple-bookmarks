import { createFileRoute } from "@tanstack/react-router";

import { tagWorkbench } from "../components/workbench/tag";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/tags/$tagSlug/edit/autofill")({
  component: AutofillEditTab,
});

function AutofillEditTab() {
  const {
    tagSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={tagWorkbench}
      tabKey="autofill"
      mode="edit"
      slug={tagSlug}
    />
  );
}
