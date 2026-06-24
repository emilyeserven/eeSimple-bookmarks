import { createFileRoute, redirect } from "@tanstack/react-router";

/** `/taxonomies/publishers/:slug` redirects to the General view tab by default. */
export const Route = createFileRoute("/taxonomies/publishers/$publisherSlug/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/taxonomies/publishers/$publisherSlug/general",
      params,
    });
  },
});
