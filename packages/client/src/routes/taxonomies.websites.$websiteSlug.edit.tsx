import { Link, createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout, navLinkClass } from "../components/TabbedEntityLayout";
import { useWebsiteBySlug } from "../hooks/useWebsites";

import { cn } from "@/lib/utils";

export const Route = createFileRoute("/taxonomies/websites/$websiteSlug/edit")({
  component: WebsiteEditLayout,
});

const editNav = [
  {
    to: "/taxonomies/websites/$websiteSlug/edit/general",
    label: "General",
  },
  {
    to: "/taxonomies/websites/$websiteSlug/edit/shortened-links",
    label: "Shortened Links",
  },
  {
    to: "/taxonomies/websites/$websiteSlug/edit/param-rules",
    label: "Param Rules",
  },
  {
    to: "/taxonomies/websites/$websiteSlug/edit/autofill",
    label: "Autofill Rules",
  },
] as const;

function WebsiteEditLayout() {
  const {
    websiteSlug,
  } = Route.useParams();
  const {
    website, isLoading,
  } = useWebsiteBySlug(websiteSlug);

  return (
    <TabbedEntityLayout
      header={(
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
            ← Back to website
          </Link>
          <h1 className="text-2xl font-bold">
            {isLoading ? "Edit website" : (website?.siteName ?? "Website not found")}
          </h1>
          <p className="text-sm text-muted-foreground">
            Edit this website&apos;s name, shortened links, and param rules.
          </p>
        </div>
      )}
      nav={(
        <nav
          className="
            flex shrink-0 flex-col gap-1
            sm:w-48
          "
          aria-label="Website edit sections"
        >
          {editNav.map(item => (
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
