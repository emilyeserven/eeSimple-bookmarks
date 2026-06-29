import { createFileRoute, redirect } from "@tanstack/react-router";

/** The Gallery page became Settings → Advanced → Manage Media; keep the old URL working. */
export const Route = createFileRoute("/settings/gallery")({
  beforeLoad: () => {
    throw redirect({
      to: "/settings/advanced/manage-media",
    });
  },
});
