import { Link, createFileRoute } from "@tanstack/react-router";

import { TaxonomyDetailLayout } from "../components/TaxonomyDetailLayout";
import { WebsiteCard } from "../components/WebsiteManager";
import { useDeleteWebsite, useWebsiteBySlug } from "../hooks/useWebsites";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/taxonomies/websites/$websiteSlug/")({
  component: WebsiteViewPage,
});

function WebsiteViewPage() {
  const {
    websiteSlug,
  } = Route.useParams();
  const navigate = Route.useNavigate();
  const {
    website, isLoading, error,
  } = useWebsiteBySlug(websiteSlug);
  const deleteWebsite = useDeleteWebsite();

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
        <section className="space-y-4">
          <Link
            to="/taxonomies/websites"
            className="
              inline-block text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            ← Back to websites
          </Link>
          <WebsiteCard website={ws} />
          <div className="border-t pt-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="
                text-destructive
                hover:text-destructive
              "
              disabled={deleteWebsite.isPending}
              onClick={() =>
                deleteWebsite.mutate(ws.id, {
                  onSuccess: () => navigate({
                    to: "/taxonomies/websites",
                  }),
                })}
            >
              {deleteWebsite.isPending ? "Deleting…" : "Delete website"}
            </Button>
          </div>
        </section>
      )}
    </TaxonomyDetailLayout>
  );
}
