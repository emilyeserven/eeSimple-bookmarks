import { createFileRoute } from "@tanstack/react-router";

import { LinkParsingSettings } from "../components/LinkParsingSettings";
import { RedirectFailuresSettings } from "../components/RedirectFailuresSettings";

export const Route = createFileRoute("/settings/link-parsing")({
  component: LinkParsingPage,
});

function LinkParsingPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Link parsing</h2>
        <p className="text-sm text-muted-foreground">
          Configure how bookmark URLs are cleaned up and how shortened links are handled.
        </p>
      </div>
      <LinkParsingSettings />
      <div>
        <h2 className="text-xl font-semibold">Redirect failures</h2>
        <p className="text-sm text-muted-foreground">
          Bookmarks whose website is flagged for unreliable redirect resolution. Enter the correct
          URL for each bookmark to re-fetch its title, description, and image.
        </p>
      </div>
      <RedirectFailuresSettings />
    </section>
  );
}
