import { createFileRoute } from "@tanstack/react-router";

import { languageWorkbench } from "../components/workbench/language";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute(
  "/taxonomies/languages/$languageSlug/_view/general",
)({
  component: GeneralViewTab,
});

function GeneralViewTab() {
  const {
    languageSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={languageWorkbench}
      tabKey="general"
      mode="view"
      slug={languageSlug}
    />
  );
}
