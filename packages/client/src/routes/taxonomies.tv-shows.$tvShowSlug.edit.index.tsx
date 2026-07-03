import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/taxonomies/tv-shows/$tvShowSlug/edit/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/taxonomies/tv-shows/$tvShowSlug/edit/general",
      params,
    });
  },
});
