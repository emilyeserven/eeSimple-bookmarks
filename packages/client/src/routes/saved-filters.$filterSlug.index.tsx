import { createFileRoute, redirect } from "@tanstack/react-router";

/** `/saved-filters/:slug` redirects to the General view tab by default. */
export const Route = createFileRoute("/saved-filters/$filterSlug/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/saved-filters/$filterSlug/info",
      params,
    });
  },
});
