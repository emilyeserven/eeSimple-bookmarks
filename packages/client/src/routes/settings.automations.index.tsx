import { createFileRoute, redirect } from "@tanstack/react-router";

/** `/settings/automations` lands on the Global tab by default. */
export const Route = createFileRoute("/settings/automations/")({
  beforeLoad: () => {
    throw redirect({
      to: "/settings/automations/global",
    });
  },
});
