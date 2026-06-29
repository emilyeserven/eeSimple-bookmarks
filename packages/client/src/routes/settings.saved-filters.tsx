import { createFileRoute, redirect } from "@tanstack/react-router";

/** Saved-filter management moved to the top-level `/saved-filters` page; keep the old URL working. */
export const Route = createFileRoute("/settings/saved-filters")({
  beforeLoad: () => {
    throw redirect({
      to: "/saved-filters",
    });
  },
});
