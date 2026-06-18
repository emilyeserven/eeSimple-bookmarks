import { Link, createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout, navLinkClass } from "../components/TabbedEntityLayout";
import { useDeleteWebsite, useWebsiteBySlug } from "../hooks/useWebsites";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/taxonomies/websites/$websiteSlug/_view")({
  component: WebsiteViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/websites/$websiteSlug/general",
    label: "General",
  },
  {
    to: "/taxonomies/websites/$websiteSlug/shortened-links",
    label: "Shortened Links",
  },
  {
    to: "/taxonomies/websites/$websiteSlug/param-rules",
    label: "Param Rules",
  },
] as const;

function WebsiteViewLayout() {
  const {
    websiteSlug,
  } = Route.useParams();
  const navigate = Route.useNavigate();
  const {
    website, isLoading,
  } = useWebsiteBySlug(websiteSlug);
  const deleteWebsite = useDeleteWebsite();

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/websites"
            className="
              inline-block text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            ← Back to websites
          </Link>
          <div className="flex items-start justify-between gap-4">
            <h1
              className="
                flex min-w-0 flex-wrap items-center gap-2 text-2xl font-bold
              "
            >
              {isLoading ? "Website" : (website?.siteName ?? "Website not found")}
              {website?.builtIn ? <Badge variant="secondary">Built-in</Badge> : null}
            </h1>
            {website
              ? (
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                  >
                    <Link
                      to="/taxonomies/websites/$websiteSlug/edit/general"
                      params={{
                        websiteSlug,
                      }}
                    >
                      Edit
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="
                      text-destructive
                      hover:text-destructive
                    "
                    disabled={deleteWebsite.isPending}
                    onClick={() => deleteWebsite.mutate(website.id, {
                      onSuccess: () => navigate({
                        to: "/taxonomies/websites",
                      }),
                    })}
                  >
                    {deleteWebsite.isPending ? "Deleting…" : "Delete"}
                  </Button>
                </div>
              )
              : null}
          </div>
        </div>
      )}
      nav={(
        <nav
          className="
            flex shrink-0 flex-col gap-1
            sm:w-48
          "
          aria-label="Website sections"
        >
          {viewNav.map(item => (
            <Link
              key={item.to}
              to={item.to}
              params={{
                websiteSlug,
              }}
              className={cn(navLinkClass)}
              activeProps={{
                className: "bg-accent text-accent-foreground",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    />
  );
}
