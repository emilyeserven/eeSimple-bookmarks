import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { NewsletterReviewList } from "../components/NewsletterReviewList";
import { useNewsletterImport } from "../hooks/useNewsletterImports";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/newsletters/$importId")({
  component: NewsletterReviewPage,
});

function NewsletterReviewPage() {
  const {
    importId,
  } = Route.useParams();
  const {
    data: newsletter, isLoading, error,
  } = useNewsletterImport(importId);

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
        <h2 className="text-xl font-semibold">Review candidates</h2>
        <p className="text-sm text-muted-foreground">
          Approve, edit, or reject each extracted link. Approving creates a bookmark; duplicates are
          flagged automatically.
        </p>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
      {error ? <p className="text-sm text-destructive">Couldn&apos;t load this import.</p> : null}
      {newsletter
        ? (
          <NewsletterReviewList
            importId={newsletter.id}
            items={newsletter.items}
          />
        )
        : null}
    </section>
  );
}
