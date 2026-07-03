import { createFileRoute, redirect } from "@tanstack/react-router";

/** `/taxonomies/media-properties/:slug` redirects to the General view tab by default. */
export const Route = createFileRoute("/taxonomies/media-properties/$mediaPropertySlug/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/taxonomies/media-properties/$mediaPropertySlug/general",
      params,
    });
  },
});
