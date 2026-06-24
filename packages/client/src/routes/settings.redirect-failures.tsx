import { createFileRoute } from "@tanstack/react-router";

import { RedirectFailuresSettings } from "../components/RedirectFailuresSettings";

export const Route = createFileRoute("/settings/redirect-failures")({
  component: RedirectFailuresPage,
});

function RedirectFailuresPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Redirect Failures</h2>
        <p className="text-sm text-muted-foreground">
          Bookmarks whose website is flagged for unreliable redirect resolution. Enter the correct
          URL for each bookmark to re-fetch its title, description, and image.
        </p>
      </div>
      <RedirectFailuresSettings />
    </section>
  );
}
