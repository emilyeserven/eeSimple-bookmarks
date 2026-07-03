import { createFileRoute, redirect } from "@tanstack/react-router";

/** `/taxonomies/albums/:slug` redirects to the General view tab by default. */
export const Route = createFileRoute("/taxonomies/albums/$albumSlug/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/taxonomies/albums/$albumSlug/general",
      params,
    });
  },
});
