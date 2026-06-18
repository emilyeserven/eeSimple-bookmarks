import { createFileRoute, redirect } from "@tanstack/react-router";

/** `/taxonomies/websites/:slug/edit` redirects to the General tab by default. */
export const Route = createFileRoute("/taxonomies/websites/$websiteSlug/edit/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/taxonomies/websites/$websiteSlug/edit/general",
      params,
    });
  },
});
