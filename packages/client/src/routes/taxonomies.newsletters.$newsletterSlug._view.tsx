import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useNewsletterBySlug } from "../hooks/useNewsletters";

export const Route = createFileRoute("/taxonomies/newsletters/$newsletterSlug/_view")({
  component: NewsletterViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/newsletters/$newsletterSlug/general",
    label: "General",
  },
] as const;

function NewsletterViewLayout() {
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
        <h1 className="text-2xl font-bold">
          {isLoading ? t("Newsletter") : (newsletter?.name ?? t("Newsletter not found"))}
        </h1>
      )}
      nav={viewNav.map(item => ({
        ...item,
        label: t(item.label),
      }))}
      params={{
        newsletterSlug,
      }}
      navAriaLabel={t("Newsletter sections")}
    />
  );
}
