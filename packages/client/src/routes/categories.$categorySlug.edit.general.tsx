import { createFileRoute } from "@tanstack/react-router";

import { categoryWorkbench } from "../components/workbench/category";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/categories/$categorySlug/edit/general")({
  component: GeneralTab,
});

function GeneralTab() {
  const {
    categorySlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={categoryWorkbench}
      tabKey="general"
      mode="edit"
      slug={categorySlug}
    />
  );
}
