import { createFileRoute, redirect } from "@tanstack/react-router";

/** `/taxonomies/authors/:slug` redirects to the General view tab by default. */
export const Route = createFileRoute("/taxonomies/authors/$authorSlug/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/taxonomies/authors/$authorSlug/general",
      params,
    });
  },
});
