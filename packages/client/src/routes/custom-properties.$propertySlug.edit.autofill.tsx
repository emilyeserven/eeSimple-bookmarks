import { createFileRoute } from "@tanstack/react-router";

import { propertyWorkbench } from "../components/workbench/property";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/custom-properties/$propertySlug/edit/autofill")({
  component: AutofillEditTab,
});

function AutofillEditTab() {
  const {
    propertySlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={propertyWorkbench}
      tabKey="autofill"
      mode="edit"
      slug={propertySlug}
    />
  );
}
