import { Link, createFileRoute } from "@tanstack/react-router";

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

  if (isLoading) {
    return <p className="text-muted-foreground">Loading website…</p>;
  }

  if (error || !website) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">{error?.message ?? "Website not found."}</p>
        <Link
          to="/taxonomies/websites"
          className="
            text-sm text-muted-foreground
            hover:text-foreground
          "
        >
          ← Back to websites
        </Link>
      </div>
    );
  }

  return (
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
      <div className="rounded-lg border bg-card p-4">
        <WebsiteCard website={website} />
      </div>
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
            deleteWebsite.mutate(website.id, {
              onSuccess: () => navigate({
                to: "/taxonomies/websites",
              }),
            })}
        >
          {deleteWebsite.isPending ? "Deleting…" : "Delete website"}
        </Button>
      </div>
    </section>
  );
}
