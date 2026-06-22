import { createFileRoute, redirect } from "@tanstack/react-router";

/** The per-entity Autofill tab now lives on the consolidated Settings → Autofill page, filtered. */
export const Route = createFileRoute("/custom-properties/$propertySlug/edit/autofill")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/settings/autofill",
      search: {
        property: params.propertySlug,
      },
    });
  },
});
