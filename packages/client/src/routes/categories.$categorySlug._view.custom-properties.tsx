import { createFileRoute } from "@tanstack/react-router";

import { categoryWorkbench } from "../components/workbench/category";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/categories/$categorySlug/_view/custom-properties")({
  component: CustomPropertiesViewTab,
});

function CustomPropertiesViewTab() {
  const {
    categorySlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={categoryWorkbench}
      tabKey="custom-properties"
      mode="view"
      slug={categorySlug}
    />
  );
}
