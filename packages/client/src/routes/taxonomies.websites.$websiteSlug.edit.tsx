import { Link, createFileRoute } from "@tanstack/react-router";

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
          ← Back to {website.siteName}
        </Link>
        <h1 className="text-2xl font-bold">Edit website</h1>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <WebsiteRow
          website={website}
          onSaved={() => navigate({
            to: "/taxonomies/websites",
          })}
        />
      </div>
    </section>
  );
}
