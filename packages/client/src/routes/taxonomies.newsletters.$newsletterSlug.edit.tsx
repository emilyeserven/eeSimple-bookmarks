import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useNewsletterBySlug } from "../hooks/useNewsletters";

import i18n from "@/i18n";

export const Route = createFileRoute("/taxonomies/newsletters/$newsletterSlug/edit")({
  component: NewsletterEditLayout,
});

const editNav = [
  {
    to: "/taxonomies/newsletters/$newsletterSlug/edit/general",
    label: i18n.t("General"),
  },
] as const;

function NewsletterEditLayout() {
  const {
    t,
  } = useTranslation();
  const {
    newsletterSlug,
  } = Route.useParams();
  const {
    newsletter, isLoading,
  } = useNewsletterBySlug(newsletterSlug);

  return (
    <TabbedEntityLayout
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
      nav={editNav}
      params={{
        newsletterSlug,
      }}
      navAriaLabel={t("Newsletter edit sections")}
    />
  );
}
