import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/taxonomies/place-types/$placeTypeSlug/edit/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/taxonomies/place-types/$placeTypeSlug/edit/general",
      params,
    });
  },
});
