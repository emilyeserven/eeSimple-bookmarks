import { createFileRoute, redirect } from "@tanstack/react-router";

/** `/taxonomies/group-types/:slug` redirects to the General view tab by default. */
export const Route = createFileRoute("/taxonomies/group-types/$groupTypeSlug/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/taxonomies/group-types/$groupTypeSlug/general",
      params,
    });
  },
});
