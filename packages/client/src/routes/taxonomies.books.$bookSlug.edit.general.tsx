import { createFileRoute } from "@tanstack/react-router";

import { bookWorkbench } from "../components/workbench/book";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute(
  "/taxonomies/books/$bookSlug/edit/general",
)({
  component: GeneralEditTab,
});

function GeneralEditTab() {
  const {
    bookSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={bookWorkbench}
      tabKey="general"
      mode="edit"
      slug={bookSlug}
    />
  );
}
