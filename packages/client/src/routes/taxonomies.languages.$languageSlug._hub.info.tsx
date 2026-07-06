import { createFileRoute } from "@tanstack/react-router";

import { EntityInfoView } from "../components/workbench/EntityInfoView";
import { languageWorkbench } from "../components/workbench/language";
import { validateInfoTabSearch } from "../lib/infoTabSearch";

export const Route = createFileRoute("/taxonomies/languages/$languageSlug/_hub/info")({
  validateSearch: validateInfoTabSearch,
  component: LanguageInfoTab,
});

function LanguageInfoTab() {
  const {
    languageSlug,
  } = Route.useParams();
  const {
    tab,
  } = Route.useSearch();
  return (
    <EntityInfoView
      workbench={languageWorkbench}
      slug={languageSlug}
      infoTo="/taxonomies/languages/$languageSlug/info"
      params={{
        languageSlug,
      }}
      activeTab={tab}
    />
  );
}
