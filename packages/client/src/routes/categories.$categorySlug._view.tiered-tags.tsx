import { createFileRoute } from "@tanstack/react-router";

import { categoryWorkbench } from "../components/workbench/category";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/categories/$categorySlug/_view/tiered-tags")({
  component: TieredTagsViewTab,
});

function TieredTagsViewTab() {
  const {
    categorySlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={categoryWorkbench}
      tabKey="tiered-tags"
      mode="view"
      slug={categorySlug}
    />
  );
}
