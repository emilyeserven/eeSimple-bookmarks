import { createFileRoute, redirect } from "@tanstack/react-router";

/** `/taxonomies/episodes/:slug` redirects to the General view tab by default. */
export const Route = createFileRoute("/taxonomies/episodes/$episodeSlug/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/taxonomies/episodes/$episodeSlug/general",
      params,
    });
  },
});
