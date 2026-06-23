import { createFileRoute, redirect } from "@tanstack/react-router";

/** The per-entity Display Rules tab redirects to the consolidated Card Display Rules page, filtered. */
export const Route = createFileRoute("/categories/$categorySlug/edit/display-rules")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/card-display-rules",
      search: {
        scope: "category",
        scopeSlug: params.categorySlug,
      },
    });
  },
});
