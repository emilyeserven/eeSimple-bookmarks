import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { EntityEditView } from "../components/workbench/EntityEditView";
import { newsletterWorkbench } from "../components/workbench/newsletter";
import { useNewsletterBySlug } from "../hooks/useNewsletters";

import { validateEditTabSearch } from "@/lib/infoTabSearch";

export const Route = createFileRoute("/taxonomies/newsletters/$newsletterSlug/edit/")({
  validateSearch: validateEditTabSearch,
  component: NewsletterEditPage,
});

function NewsletterEditPage() {
  const {
    t,
  } = useTranslation();
  const {
    newsletterSlug,
  } = Route.useParams();
  const {
    tab,
  } = Route.useSearch();
  const {
    newsletter, isLoading,
  } = useNewsletterBySlug(newsletterSlug);

  return (
    <EntityEditView
      workbench={newsletterWorkbench}
      slug={newsletterSlug}
      editTo="/taxonomies/newsletters/$newsletterSlug/edit"
      params={{
        newsletterSlug,
      }}
      activeTab={tab}
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/newsletters/$newsletterSlug"
            params={{
              newsletterSlug,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            {t("← Back to {{name}}", {
              name: isLoading ? t("newsletter") : (newsletter?.name ?? t("newsletter")),
            })}
          </Link>
          <h1 className="text-2xl font-bold">{t("Edit newsletter")}</h1>
        </div>
      )}
    />
  );
}
