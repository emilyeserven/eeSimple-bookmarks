import { Link, createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useNewsletterBySlug } from "../hooks/useNewsletters";

export const Route = createFileRoute("/taxonomies/newsletters/$newsletterSlug/edit")({
  component: NewsletterEditLayout,
});

const editNav = [
  {
    to: "/taxonomies/newsletters/$newsletterSlug/edit/general",
    label: "General",
  },
] as const;

function NewsletterEditLayout() {
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
            ← Back to {isLoading ? "newsletter" : (newsletter?.name ?? "newsletter")}
          </Link>
          <h1 className="text-2xl font-bold">Edit newsletter</h1>
        </div>
      )}
      nav={editNav}
      params={{
        newsletterSlug,
      }}
      navAriaLabel="Newsletter edit sections"
    />
  );
}
