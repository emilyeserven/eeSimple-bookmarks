import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/taxonomies/relationship-types/$relationshipTypeSlug/edit/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/taxonomies/relationship-types/$relationshipTypeSlug/edit/general",
      params,
    });
  },
});
