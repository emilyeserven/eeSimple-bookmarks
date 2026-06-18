import { createFileRoute } from "@tanstack/react-router";

import { WebsitesListing } from "../components/WebsiteManager";

export const Route = createFileRoute("/settings/websites")({
  component: WebsitesPage,
});

function WebsitesPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Websites</h2>
        <p className="text-sm text-muted-foreground">
          The built-in Websites taxonomy. Each site is created automatically from a bookmark&apos;s URL;
          rename a site here to give it a friendly name.
        </p>
      </div>
      <WebsitesListing />
    </section>
  );
}
