import { createFileRoute, redirect } from "@tanstack/react-router";

/** The per-entity Autofill tab redirects to the consolidated Autofill Rules page, filtered. */
export const Route = createFileRoute("/custom-properties/$propertySlug/edit/autofill")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/autofill",
      search: {
        property: params.propertySlug,
      },
    });
  },
});
