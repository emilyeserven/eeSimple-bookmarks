import { createFileRoute, redirect } from "@tanstack/react-router";

/** `/taxonomies/books/:slug` redirects to the General view tab by default. */
export const Route = createFileRoute("/taxonomies/books/$bookSlug/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/taxonomies/books/$bookSlug/general",
      params,
    });
  },
});
