import { createFileRoute, redirect } from "@tanstack/react-router";

/** `/taxonomies/artists/:slug` redirects to the General view tab by default. */
export const Route = createFileRoute("/taxonomies/artists/$artistSlug/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/taxonomies/artists/$artistSlug/general",
      params,
    });
  },
});
