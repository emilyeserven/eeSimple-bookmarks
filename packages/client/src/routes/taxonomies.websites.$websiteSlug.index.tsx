import { createFileRoute, redirect } from "@tanstack/react-router";

/** `/taxonomies/websites/:slug` redirects to the General view tab by default. */
export const Route = createFileRoute("/taxonomies/websites/$websiteSlug/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/taxonomies/websites/$websiteSlug/general",
      params,
    });
  },
});
