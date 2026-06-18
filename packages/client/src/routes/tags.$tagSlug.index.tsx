import { createFileRoute, redirect } from "@tanstack/react-router";

/** `/tags/:slug` redirects to the General view tab by default. */
export const Route = createFileRoute("/tags/$tagSlug/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/tags/$tagSlug/general",
      params,
    });
  },
});
