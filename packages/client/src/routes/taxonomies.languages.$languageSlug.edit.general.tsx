import { createFileRoute } from "@tanstack/react-router";

import { languageWorkbench } from "../components/workbench/language";
import { WorkbenchRouteTab } from "../components/workbench/WorkbenchRouteTab";

export const Route = createFileRoute(
  "/taxonomies/languages/$languageSlug/edit/general",
)({
  component: GeneralEditTab,
});

function GeneralEditTab() {
  const {
    languageSlug,
  } = Route.useParams();
  return (
    <WorkbenchRouteTab
      workbench={languageWorkbench}
      tabKey="general"
      mode="edit"
      slug={languageSlug}
    />
  );
}
