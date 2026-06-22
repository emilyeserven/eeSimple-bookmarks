import { createFileRoute } from "@tanstack/react-router";

import { propertyWorkbench } from "../components/workbench/property";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/custom-properties/$propertySlug/_view/categories")({
  component: CategoriesViewTab,
});

function CategoriesViewTab() {
  const {
    propertySlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={propertyWorkbench}
      tabKey="categories"
      mode="view"
      slug={propertySlug}
    />
  );
}
