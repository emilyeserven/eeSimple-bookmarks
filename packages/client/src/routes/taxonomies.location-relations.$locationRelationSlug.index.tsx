import { createFileRoute, redirect } from "@tanstack/react-router";

/** `/taxonomies/location-relations/:slug` redirects to the General view tab by default. */
export const Route = createFileRoute("/taxonomies/location-relations/$locationRelationSlug/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/taxonomies/location-relations/$locationRelationSlug/info",
      params,
    });
  },
});
