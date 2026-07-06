import { createFileRoute, redirect } from "@tanstack/react-router";

/** `/custom-properties/:slug` lands on the General view tab by default. */
export const Route = createFileRoute("/custom-properties/$propertySlug/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/custom-properties/$propertySlug/info",
      params,
    });
  },
});
