import { createFileRoute, redirect } from "@tanstack/react-router";

/** Media Management moved under Settings → Advanced; keep the old URL working. */
export const Route = createFileRoute("/settings/media-management")({
  beforeLoad: () => {
    throw redirect({
      to: "/settings/advanced/manage-media",
    });
  },
});
