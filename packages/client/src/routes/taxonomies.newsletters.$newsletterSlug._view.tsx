import { Link, createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useDeleteNewsletter, useNewsletterBySlug } from "../hooks/useNewsletters";

import { Button } from "@/components/ui/button";

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
  const navigate = Route.useNavigate();
  const {
    newsletter, isLoading,
  } = useNewsletterBySlug(newsletterSlug);
  const deleteNewsletter = useDeleteNewsletter();

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
              inline-block text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            ← Back to issues
          </Link>
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold">
              {isLoading ? "Newsletter" : (newsletter?.name ?? "Newsletter not found")}
            </h1>
            {newsletter
              ? (
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                  >
                    <Link
                      to="/taxonomies/newsletters/$newsletterSlug/edit/general"
                      params={{
                        newsletterSlug,
                      }}
                    >
                      Edit
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="
                      text-destructive
                      hover:text-destructive
                    "
                    disabled={deleteNewsletter.isPending}
                    onClick={() => deleteNewsletter.mutate(newsletter.id, {
                      onSuccess: () => navigate({
                        to: "/taxonomies/newsletters",
                      }),
                    })}
                  >
                    {deleteNewsletter.isPending ? "Deleting…" : "Delete"}
                  </Button>
                </div>
              )
              : null}
          </div>
        </div>
      )}
      nav={viewNav}
      params={{
        newsletterSlug,
      }}
      navAriaLabel="Newsletter sections"
    />
  );
}
