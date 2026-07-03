import { createFileRoute, redirect } from "@tanstack/react-router";

/** `/taxonomies/podcasts/:slug` redirects to the General view tab by default. */
export const Route = createFileRoute("/taxonomies/podcasts/$podcastSlug/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/taxonomies/podcasts/$podcastSlug/general",
      params,
    });
  },
});
