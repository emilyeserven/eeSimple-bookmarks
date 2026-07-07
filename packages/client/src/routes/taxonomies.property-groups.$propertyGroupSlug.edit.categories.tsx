import { createFileRoute } from "@tanstack/react-router";

import { propertyGroupWorkbench } from "../components/workbench/propertyGroup";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute(
  "/taxonomies/property-groups/$propertyGroupSlug/edit/categories",
)({
  component: CategoriesEditTab,
});

function CategoriesEditTab() {
  const {
    propertyGroupSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={propertyGroupWorkbench}
      tabKey="categories"
      mode="edit"
      slug={propertyGroupSlug}
    />
  );
}
