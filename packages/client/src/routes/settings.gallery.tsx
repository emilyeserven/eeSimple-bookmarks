import { createFileRoute, redirect } from "@tanstack/react-router";

/** The Gallery page became Settings → Media → Manage Media; keep the old URL working. */
export const Route = createFileRoute("/settings/gallery")({
  beforeLoad: () => {
    throw redirect({
      to: "/settings/media/manage",
    });
  },
});
