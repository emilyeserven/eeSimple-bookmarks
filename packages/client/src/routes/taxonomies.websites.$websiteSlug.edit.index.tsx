import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { EntityEditView } from "../components/workbench/EntityEditView";
import { websiteWorkbench } from "../components/workbench/website";
import { useWebsiteBySlug } from "../hooks/useWebsites";

import { validateEditTabSearch } from "@/lib/infoTabSearch";

export const Route = createFileRoute("/taxonomies/websites/$websiteSlug/edit/")({
  validateSearch: validateEditTabSearch,
  component: WebsiteEditPage,
});

function WebsiteEditPage() {
  const {
    t,
  } = useTranslation();
  const {
    websiteSlug,
  } = Route.useParams();
  const {
    tab,
  } = Route.useSearch();
  const {
    website, isLoading,
  } = useWebsiteBySlug(websiteSlug);

  return (
    <EntityEditView
      workbench={websiteWorkbench}
      slug={websiteSlug}
      editTo="/taxonomies/websites/$websiteSlug/edit"
      params={{
        websiteSlug,
      }}
      activeTab={tab}
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
    />
  );
}
