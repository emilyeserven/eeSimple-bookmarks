import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { ImportForm } from "../components/ImportForm";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/inbox/new")({
  validateSearch: (search: Record<string, unknown>): { newsletterId?: string } => ({
    newsletterId: typeof search.newsletterId === "string" ? search.newsletterId : undefined,
  }),
  component: InboxNewPage,
});

function InboxNewPage() {
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
          <Link to="/inbox">
            <ArrowLeft className="size-4" />
            Back to inbox
          </Link>
        </Button>
        <h2 className="text-xl font-semibold">Add import</h2>
        <p className="text-sm text-muted-foreground">
          Paste a newsletter, fetch its public &ldquo;view in browser&rdquo; URL, or upload a saved
          .eml / .html file. Links are extracted and tracker redirects resolved for review in your inbox.
        </p>
      </div>

      <ImportForm initialNewsletterId={newsletterId ?? null} />
    </section>
  );
}
