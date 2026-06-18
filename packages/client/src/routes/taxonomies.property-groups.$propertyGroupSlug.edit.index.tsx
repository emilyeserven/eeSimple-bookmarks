import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/taxonomies/property-groups/$propertyGroupSlug/edit/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/taxonomies/property-groups/$propertyGroupSlug/edit/general",
      params,
    });
  },
});
