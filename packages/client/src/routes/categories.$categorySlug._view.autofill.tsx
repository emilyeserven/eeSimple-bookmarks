import { createFileRoute } from "@tanstack/react-router";

import { categoryWorkbench } from "../components/workbench/category";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/categories/$categorySlug/_view/autofill")({
  component: AutofillViewTab,
});

function AutofillViewTab() {
  const {
    categorySlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={categoryWorkbench}
      tabKey="autofill"
      mode="view"
      slug={categorySlug}
    />
  );
}
