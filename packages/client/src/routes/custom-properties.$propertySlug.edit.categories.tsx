import { createFileRoute } from "@tanstack/react-router";

import { propertyWorkbench } from "../components/workbench/property";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/custom-properties/$propertySlug/edit/categories")({
  component: CategoriesEditTab,
});

function CategoriesEditTab() {
  const {
    propertySlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={propertyWorkbench}
      tabKey="categories"
      mode="edit"
      slug={propertySlug}
    />
  );
}
