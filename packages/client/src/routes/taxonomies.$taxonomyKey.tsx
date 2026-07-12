import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { useTaxonomyBySlug } from "../hooks/useTaxonomies";

/**
 * Layout for a single user-configurable taxonomy: resolves it by slug and renders its listing/term
 * pages through here. TanStack's static-beats-dynamic routing keeps the built-in `/taxonomies/*`
 * segments (websites, media-types, genres-moods, …) matching their own routes; this dynamic route
 * serves user-created taxonomies.
 */
export const Route = createFileRoute("/taxonomies/$taxonomyKey")({
  component: TaxonomyLayout,
});

function TaxonomyLayout() {
  const {
    t,
  } = useTranslation();
  const {
    taxonomyKey,
  } = Route.useParams();
  const {
    taxonomy, isLoading,
  } = useTaxonomyBySlug(taxonomyKey);

  if (!taxonomy) {
    return (
      <section className="p-6">
        <p className="text-sm text-muted-foreground">
          {isLoading ? t("Loading…") : t("Taxonomy not found.")}
        </p>
      </section>
    );
  }

  return <Outlet />;
}
