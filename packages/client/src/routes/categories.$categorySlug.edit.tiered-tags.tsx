import { createFileRoute } from "@tanstack/react-router";

import { categoryWorkbench } from "../components/workbench/category";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/categories/$categorySlug/edit/tiered-tags")({
  component: TieredTagsTab,
});

function TieredTagsTab() {
  const {
    categorySlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={categoryWorkbench}
      tabKey="tiered-tags"
      mode="edit"
      slug={categorySlug}
    />
  );
}
