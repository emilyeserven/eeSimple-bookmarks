import { createFileRoute } from "@tanstack/react-router";

import { EntityInfoView } from "../components/workbench/EntityInfoView";
import { tagWorkbench } from "../components/workbench/tag";
import { validateInfoTabSearch } from "../lib/infoTabSearch";

export const Route = createFileRoute("/tags/$tagSlug/_hub/info")({
  validateSearch: validateInfoTabSearch,
  component: TagInfoTab,
});

function TagInfoTab() {
  const {
    tagSlug,
  } = Route.useParams();
  const {
    tab,
  } = Route.useSearch();
  return (
    <EntityInfoView
      workbench={tagWorkbench}
      slug={tagSlug}
      infoTo="/tags/$tagSlug/info"
      params={{
        tagSlug,
      }}
      activeTab={tab}
    />
  );
}
