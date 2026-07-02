import { createFileRoute, redirect } from "@tanstack/react-router";

/** This tab moved to Settings → Media → Manage Media; keep the old URL working. */
export const Route = createFileRoute("/settings/advanced/manage-media")({
  beforeLoad: () => {
    throw redirect({
      to: "/settings/media/manage",
    });
  },
});
