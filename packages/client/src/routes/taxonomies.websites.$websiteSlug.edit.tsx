import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useWebsiteBySlug } from "../hooks/useWebsites";

export const Route = createFileRoute("/taxonomies/websites/$websiteSlug/edit")({
  component: WebsiteEditLayout,
});

function WebsiteEditLayout() {
  const {
    t,
  } = useTranslation();
  const {
    websiteSlug,
  } = Route.useParams();
  const {
    website, isLoading,
  } = useWebsiteBySlug(websiteSlug);
  const editNav = [
    {
      to: "/taxonomies/websites/$websiteSlug/edit/general",
      label: t("General"),
    },
    {
      to: "/taxonomies/websites/$websiteSlug/edit/shortened-links",
      label: t("Shortened Links"),
    },
    {
      to: "/taxonomies/websites/$websiteSlug/edit/param-rules",
      label: t("Param Rules"),
    },
    {
      type: "group",
      label: t("Rules"),
      items: [
        {
          to: "/taxonomies/websites/$websiteSlug/edit/autofill",
          label: t("Autofill Rules"),
        },
        {
          to: "/taxonomies/websites/$websiteSlug/edit/display-rules",
          label: t("Display Rules"),
        },
      ],
    },
  ] as const;

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
            {t("← Back to website")}
          </Link>
          <h1 className="text-2xl font-bold">
            {isLoading ? t("Edit website") : (website?.siteName ?? t("Website not found"))}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("Edit this website's name, shortened links, and param rules.")}
          </p>
        </div>
      )}
      nav={editNav}
      params={{
        websiteSlug,
      }}
      navAriaLabel={t("Website edit sections")}
    />
  );
}
