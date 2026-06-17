import { createFileRoute, redirect } from "@tanstack/react-router";

/** `/settings` lands on the Custom Properties sub-page by default. */
export const Route = createFileRoute("/settings/")({
  beforeLoad: () => {
    throw redirect({
      to: "/settings/custom-properties",
    });
  },
});
