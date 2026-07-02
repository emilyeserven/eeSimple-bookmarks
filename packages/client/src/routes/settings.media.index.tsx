import { createFileRoute, redirect } from "@tanstack/react-router";

/** `/settings/media` lands on the Display tab by default. */
export const Route = createFileRoute("/settings/media/")({
  beforeLoad: () => {
    throw redirect({
      to: "/settings/media/display",
    });
  },
});
