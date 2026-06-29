import { createFileRoute, redirect } from "@tanstack/react-router";

/** `/settings/display` lands on the General tab by default. */
export const Route = createFileRoute("/settings/display/")({
  beforeLoad: () => {
    throw redirect({
      to: "/settings/display/general",
    });
  },
});
