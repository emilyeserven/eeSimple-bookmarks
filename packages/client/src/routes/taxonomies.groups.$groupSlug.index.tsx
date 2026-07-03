import { createFileRoute, redirect } from "@tanstack/react-router";

/** `/taxonomies/groups/:slug` redirects to the General view tab by default. */
export const Route = createFileRoute("/taxonomies/groups/$groupSlug/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/taxonomies/groups/$groupSlug/general",
      params,
    });
  },
});
