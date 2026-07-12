import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { useTaxonomyBySlug, useTaxonomyTermBySlug } from "../hooks/useTaxonomies";

/** Layout for a single term: the detail view and its `/edit` page render through here. */
export const Route = createFileRoute("/taxonomies/$taxonomyKey/$termSlug")({
  component: TaxonomyTermLayout,
});

function TaxonomyTermLayout() {
  const {
    t,
  } = useTranslation();
  const {
    taxonomyKey, termSlug,
  } = Route.useParams();
  const {
    taxonomy, isLoading: taxonomyLoading,
  } = useTaxonomyBySlug(taxonomyKey);
  const {
    term, isLoading: termLoading,
  } = useTaxonomyTermBySlug(taxonomy?.id, termSlug);

  if (!term) {
    return (
      <section className="p-6">
        <p className="text-sm text-muted-foreground">
          {taxonomyLoading || termLoading ? t("Loading…") : t("Term not found.")}
        </p>
      </section>
    );
  }

  return <Outlet />;
}
