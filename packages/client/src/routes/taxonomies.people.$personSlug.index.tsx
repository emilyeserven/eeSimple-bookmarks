import { createFileRoute, redirect } from "@tanstack/react-router";

/** `/taxonomies/people/:slug` redirects to the General view tab by default. */
export const Route = createFileRoute("/taxonomies/people/$personSlug/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/taxonomies/people/$personSlug/general",
      params,
    });
  },
});
