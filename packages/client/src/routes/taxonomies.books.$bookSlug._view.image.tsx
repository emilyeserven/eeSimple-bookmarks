import { createFileRoute } from "@tanstack/react-router";

import { bookWorkbench } from "../components/workbench/book";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute(
  "/taxonomies/books/$bookSlug/_view/image",
)({
  component: ImageViewTab,
});

function ImageViewTab() {
  const {
    bookSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={bookWorkbench}
      tabKey="image"
      mode="view"
      slug={bookSlug}
    />
  );
}
