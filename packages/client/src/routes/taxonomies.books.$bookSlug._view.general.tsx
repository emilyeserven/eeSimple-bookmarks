import { createFileRoute } from "@tanstack/react-router";

import { bookWorkbench } from "../components/workbench/book";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute(
  "/taxonomies/books/$bookSlug/_view/general",
)({
  component: GeneralViewTab,
});

function GeneralViewTab() {
  const {
    bookSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={bookWorkbench}
      tabKey="general"
      mode="view"
      slug={bookSlug}
    />
  );
}
