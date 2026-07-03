import { createFileRoute, redirect } from "@tanstack/react-router";

/** `/taxonomies/tracks/:slug` redirects to the General view tab by default. */
export const Route = createFileRoute("/taxonomies/tracks/$trackSlug/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/taxonomies/tracks/$trackSlug/general",
      params,
    });
  },
});
