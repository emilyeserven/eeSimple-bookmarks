import { Link, createFileRoute } from "@tanstack/react-router";

import { TaxonomyDetailLayout } from "../components/TaxonomyDetailLayout";
import { WebsiteRow } from "../components/WebsiteManager";
import { useWebsiteBySlug } from "../hooks/useWebsites";

export const Route = createFileRoute("/taxonomies/websites/$websiteSlug/edit")({
  component: WebsiteEditPage,
});

function WebsiteEditPage() {
  const {
    websiteSlug,
  } = Route.useParams();
  const navigate = Route.useNavigate();
  const {
    website, isLoading, error,
  } = useWebsiteBySlug(websiteSlug);

  return (
    <TaxonomyDetailLayout
      isLoading={isLoading}
      error={error}
      entity={website}
      loadingLabel="Loading website…"
      notFoundMessage="Website not found."
      listHref="/taxonomies/websites"
      listLabel="Back to websites"
    >
      {ws => (
        <section className="space-y-6">
          <div className="space-y-1">
            <Link
              to="/taxonomies/websites/$websiteSlug"
              params={{
                websiteSlug,
              }}
              className="
                text-sm text-muted-foreground
                hover:text-foreground
              "
            >
              ← Back to {ws.siteName}
            </Link>
            <h1 className="text-2xl font-bold">Edit website</h1>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <WebsiteRow
              website={ws}
              onSaved={() => navigate({
                to: "/taxonomies/websites",
              })}
            />
          </div>
        </section>
      )}
    </TaxonomyDetailLayout>
  );
}
