import { createFileRoute, redirect } from "@tanstack/react-router";

/** `/taxonomies/movies/:slug` redirects to the General view tab by default. */
export const Route = createFileRoute("/taxonomies/movies/$movieSlug/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/taxonomies/movies/$movieSlug/general",
      params,
    });
  },
});
