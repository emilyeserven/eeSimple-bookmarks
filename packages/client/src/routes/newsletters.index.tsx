import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { NewsletterImportList } from "../components/NewsletterImportList";
import { useSetListingPage } from "../hooks/useListingPage";
import { useNewsletterImports } from "../hooks/useNewsletterImports";

import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/newsletters/")({
  component: NewsletterListPage,
});

function NewsletterListPage() {
  const {
    data: imports,
  } = useNewsletterImports();
  const navigate = useNavigate();
  useSetListingPage("newsletter-imports-listing", false, false, false, () =>
    void navigate({
      to: "/newsletters/new",
    }));

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Newsletter Import</h2>
          {imports ? <Badge variant="secondary">{imports.length}</Badge> : null}
        </div>
        <p className="text-sm text-muted-foreground">
          Extract article links from a newsletter, then review them before adding bookmarks. Use the
          &ldquo;New&rdquo; button to paste content, fetch a public post URL, or upload a saved file.
        </p>
      </div>

      <NewsletterImportList />
    </section>
  );
}
