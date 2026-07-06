import { createFileRoute, redirect } from "@tanstack/react-router";

/** `/taxonomies/property-groups/:slug` redirects to the General view tab by default. */
export const Route = createFileRoute("/taxonomies/property-groups/$propertyGroupSlug/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/taxonomies/property-groups/$propertyGroupSlug/info",
      params,
    });
  },
});
