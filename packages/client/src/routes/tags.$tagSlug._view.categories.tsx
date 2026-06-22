import { createFileRoute } from "@tanstack/react-router";

import { tagWorkbench } from "../components/workbench/tag";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute("/tags/$tagSlug/_view/categories")({
  component: CategoriesViewTab,
});

function CategoriesViewTab() {
  const {
    tagSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={tagWorkbench}
      tabKey="categories"
      mode="view"
      slug={tagSlug}
    />
  );
}
