import { createFileRoute, redirect } from "@tanstack/react-router";

/** `/taxonomies/relationship-types/:slug` redirects to the General view tab by default. */
export const Route = createFileRoute("/taxonomies/relationship-types/$relationshipTypeSlug/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/taxonomies/relationship-types/$relationshipTypeSlug/info",
      params,
    });
  },
});
