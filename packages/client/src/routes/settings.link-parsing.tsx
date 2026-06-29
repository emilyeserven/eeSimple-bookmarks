import { createFileRoute, redirect } from "@tanstack/react-router";

/** Link parsing moved under Settings → Automations; keep the old URL working. */
export const Route = createFileRoute("/settings/link-parsing")({
  beforeLoad: () => {
    throw redirect({
      to: "/settings/automations/link-parsing",
    });
  },
});
