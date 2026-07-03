import { createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { TaxonomyViewHeader } from "../components/TaxonomyViewHeader";
import { useWebsiteBySlug } from "../hooks/useWebsites";

import { Badge } from "@/components/ui/badge";

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
  {
    type: "group",
    label: "Rules",
    items: [
      {
        to: "/taxonomies/websites/$websiteSlug/autofill",
        label: "Autofill Rules",
      },
      {
        to: "/taxonomies/websites/$websiteSlug/display-rules",
        label: "Display Rules",
      },
    ],
  },
] as const;

function WebsiteViewLayout() {
  const {
    websiteSlug,
  } = Route.useParams();
  const {
    website, isLoading,
  } = useWebsiteBySlug(websiteSlug);

  return (
    <TabbedEntityLayout
      header={(
        <TaxonomyViewHeader
          image={{
            kind: "url",
            url: website?.imageUrl ?? null,
          }}
          title={(
            <>
              {isLoading ? "Website" : (website?.siteName ?? "Website not found")}
              {website?.builtIn ? <Badge variant="secondary">Built-in</Badge> : null}
            </>
          )}
        />
      )}
      nav={viewNav}
      params={{
        websiteSlug,
      }}
      navAriaLabel="Website sections"
    />
  );
}
