import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { NewsletterImportForm } from "../components/NewsletterImportForm";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/newsletters/new")({
  validateSearch: (search: Record<string, unknown>): { newsletterId?: string } => ({
    newsletterId: typeof search.newsletterId === "string" ? search.newsletterId : undefined,
  }),
  component: NewsletterNewPage,
});

function NewsletterNewPage() {
  const {
    newsletterId,
  } = Route.useSearch();
  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="-ml-2"
        >
          <Link to="/newsletters">
            <ArrowLeft className="size-4" />
            Back to imports
          </Link>
        </Button>
        <h2 className="text-xl font-semibold">New newsletter import</h2>
        <p className="text-sm text-muted-foreground">
          Paste a newsletter, fetch its public &ldquo;view in browser&rdquo; URL, or upload a saved
          .eml / .html file. Article links are extracted and tracker redirects resolved for review.
        </p>
      </div>

      <NewsletterImportForm initialNewsletterId={newsletterId ?? null} />
    </section>
  );
}
