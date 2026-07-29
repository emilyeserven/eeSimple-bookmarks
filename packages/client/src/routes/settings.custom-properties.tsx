import { createFileRoute, redirect } from "@tanstack/react-router";

/** Custom Properties live at the top-level `/custom-properties` pages; keep the old URL working. */
export const Route = createFileRoute("/settings/custom-properties")({
  beforeLoad: () => {
    throw redirect({
      to: "/custom-properties",
    });
  },
});
