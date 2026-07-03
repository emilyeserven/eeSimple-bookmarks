import { createFileRoute } from "@tanstack/react-router";

import { bookWorkbench } from "../components/workbench/book";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute(
  "/taxonomies/books/$bookSlug/edit/image",
)({
  component: ImageEditTab,
});

function ImageEditTab() {
  const {
    bookSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={bookWorkbench}
      tabKey="image"
      mode="edit"
      slug={bookSlug}
    />
  );
}
