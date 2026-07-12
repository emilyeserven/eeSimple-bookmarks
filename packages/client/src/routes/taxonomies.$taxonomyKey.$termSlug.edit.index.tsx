import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { EntityEditView } from "../components/workbench/EntityEditView";
import { buildTaxonomyTermWorkbench } from "../components/workbench/taxonomyTerm";
import { useTaxonomyBySlug, useTaxonomyTermBySlug } from "../hooks/useTaxonomies";
import { validateEditTabSearch } from "../lib/infoTabSearch";

export const Route = createFileRoute("/taxonomies/$taxonomyKey/$termSlug/edit/")({
  validateSearch: validateEditTabSearch,
  component: TaxonomyTermEditPage,
});

function TaxonomyTermEditPage() {
  const {
    t,
  } = useTranslation();
  const {
    taxonomyKey, termSlug,
  } = Route.useParams();
  const {
    tab,
  } = Route.useSearch();
  const {
    taxonomy,
  } = useTaxonomyBySlug(taxonomyKey);
  const {
    term, isLoading,
  } = useTaxonomyTermBySlug(taxonomy?.id, termSlug);

  if (!taxonomy) return null;

  return (
    <EntityEditView
      workbench={buildTaxonomyTermWorkbench(taxonomy)}
      slug={termSlug}
      editTo="/taxonomies/$taxonomyKey/$termSlug/edit"
      params={{
        taxonomyKey,
        termSlug,
      }}
      activeTab={tab}
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/$taxonomyKey/$termSlug"
            params={{
              taxonomyKey,
              termSlug,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            {t("← Back to {{name}}", {
              name: isLoading ? t("term") : (term?.name ?? t("term")),
            })}
          </Link>
          <h1 className="text-2xl font-bold">{t("Edit term")}</h1>
        </div>
      )}
    />
  );
}
