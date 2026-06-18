import { createFileRoute, redirect } from "@tanstack/react-router";

/** `/taxonomies/media-types/:slug` redirects to the General view tab by default. */
export const Route = createFileRoute("/taxonomies/media-types/$mediaTypeSlug/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/taxonomies/media-types/$mediaTypeSlug/general",
      params,
    });
  },
});
