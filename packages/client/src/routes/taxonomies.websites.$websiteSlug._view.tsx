import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { TaxonomyViewHeader } from "../components/TaxonomyViewHeader";
import { useWebsiteBySlug } from "../hooks/useWebsites";
import i18n from "../i18n";

import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/taxonomies/websites/$websiteSlug/_view")({
  component: WebsiteViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/websites/$websiteSlug/general",
    label: i18n.t("General"),
  },
  {
    to: "/taxonomies/websites/$websiteSlug/shortened-links",
    label: i18n.t("Shortened Links"),
  },
  {
    to: "/taxonomies/websites/$websiteSlug/param-rules",
    label: i18n.t("Param Rules"),
  },
  {
    type: "group",
    label: i18n.t("Rules"),
    items: [
      {
        to: "/taxonomies/websites/$websiteSlug/autofill",
        label: i18n.t("Autofill Rules"),
      },
      {
        to: "/taxonomies/websites/$websiteSlug/display-rules",
        label: i18n.t("Display Rules"),
      },
    ],
  },
] as const;

function WebsiteViewLayout() {
  const {
    t,
  } = useTranslation();
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
              {isLoading ? t("Website") : (website?.siteName ?? t("Website not found"))}
              {website?.builtIn ? <Badge variant="secondary">{t("Built-in")}</Badge> : null}
            </>
          )}
        />
      )}
      nav={viewNav}
      params={{
        websiteSlug,
      }}
      navAriaLabel={t("Website sections")}
    />
  );
}
