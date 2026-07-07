import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/taxonomies/location-relations/$locationRelationSlug/edit/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/taxonomies/location-relations/$locationRelationSlug/edit/general",
      params,
    });
  },
});
