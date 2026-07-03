import { createFileRoute, redirect } from "@tanstack/react-router";

/** `/taxonomies/tv-shows/:slug` redirects to the General view tab by default. */
export const Route = createFileRoute("/taxonomies/tv-shows/$tvShowSlug/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/taxonomies/tv-shows/$tvShowSlug/general",
      params,
    });
  },
});
