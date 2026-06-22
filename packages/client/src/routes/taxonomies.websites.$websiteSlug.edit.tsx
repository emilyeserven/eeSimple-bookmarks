import { Link, createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useWebsiteBySlug } from "../hooks/useWebsites";

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
  {
    to: "/taxonomies/websites/$websiteSlug/edit/display-rules",
    label: "Display Rules",
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
      nav={editNav}
      params={{
        websiteSlug,
      }}
      navAriaLabel="Website edit sections"
    />
  );
}
