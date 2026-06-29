import { createFileRoute, redirect } from "@tanstack/react-router";

/** `/settings/advanced` lands on the Connectors tab by default. */
export const Route = createFileRoute("/settings/advanced/")({
  beforeLoad: () => {
    throw redirect({
      to: "/settings/advanced/connectors",
    });
  },
});
