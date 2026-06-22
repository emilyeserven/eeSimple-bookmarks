import { createFileRoute, redirect } from "@tanstack/react-router";

/** The Gallery page was renamed to Media Management; keep the old URL working. */
export const Route = createFileRoute("/settings/gallery")({
  beforeLoad: () => {
    throw redirect({
      to: "/settings/media-management",
    });
  },
});
