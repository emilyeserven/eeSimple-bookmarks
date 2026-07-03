import { createFileRoute } from "@tanstack/react-router";

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
    newsletterSlug,
  } = Route.useParams();
  const {
    newsletter, isLoading,
  } = useNewsletterBySlug(newsletterSlug);

  return (
    <TabbedEntityLayout
      header={(
        <h1 className="text-2xl font-bold">
          {isLoading ? "Newsletter" : (newsletter?.name ?? "Newsletter not found")}
        </h1>
      )}
      nav={viewNav}
      params={{
        newsletterSlug,
      }}
      navAriaLabel="Newsletter sections"
    />
  );
}
