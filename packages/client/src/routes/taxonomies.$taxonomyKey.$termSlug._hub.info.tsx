import { createFileRoute } from "@tanstack/react-router";

import { EntityInfoView } from "../components/workbench/EntityInfoView";
import { buildTaxonomyTermWorkbench } from "../components/workbench/taxonomyTerm";
import { useTaxonomyBySlug } from "../hooks/useTaxonomies";
import { validateInfoTabSearch } from "../lib/infoTabSearch";

export const Route = createFileRoute("/taxonomies/$taxonomyKey/$termSlug/_hub/info")({
  validateSearch: validateInfoTabSearch,
  component: TaxonomyTermInfoTab,
});

function TaxonomyTermInfoTab() {
  const {
    taxonomyKey, termSlug,
  } = Route.useParams();
  const {
    tab,
  } = Route.useSearch();
  const {
    taxonomy,
  } = useTaxonomyBySlug(taxonomyKey);

  if (!taxonomy) return null;

  return (
    <EntityInfoView
      workbench={buildTaxonomyTermWorkbench(taxonomy)}
      slug={termSlug}
      infoTo="/taxonomies/$taxonomyKey/$termSlug/info"
      params={{
        taxonomyKey,
        termSlug,
      }}
      activeTab={tab}
    />
  );
}
