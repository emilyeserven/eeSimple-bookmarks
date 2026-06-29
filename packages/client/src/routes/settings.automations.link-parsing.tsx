import { createFileRoute } from "@tanstack/react-router";

import { LinkParsingSettings } from "../components/LinkParsingSettings";

export const Route = createFileRoute("/settings/automations/link-parsing")({
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
    </section>
  );
}
