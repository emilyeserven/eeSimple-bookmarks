import { createFileRoute } from "@tanstack/react-router";

import { categoryWorkbench } from "../components/workbench/category";
import { EntityInfoView } from "../components/workbench/EntityInfoView";
import { validateInfoTabSearch } from "../lib/infoTabSearch";

export const Route = createFileRoute("/categories/$categorySlug/_hub/info")({
  validateSearch: validateInfoTabSearch,
  component: CategoryInfoTab,
});

function CategoryInfoTab() {
  const {
    categorySlug,
  } = Route.useParams();
  const {
    tab,
  } = Route.useSearch();
  return (
    <EntityInfoView
      workbench={categoryWorkbench}
      slug={categorySlug}
      infoTo="/categories/$categorySlug/info"
      params={{
        categorySlug,
      }}
      activeTab={tab}
    />
  );
}
