import { createFileRoute, redirect } from "@tanstack/react-router";

/** `/settings/locations` lands on the Level Groups tab by default. */
export const Route = createFileRoute("/settings/locations/")({
  beforeLoad: () => {
    throw redirect({
      to: "/settings/locations/level-groups",
    });
  },
});
