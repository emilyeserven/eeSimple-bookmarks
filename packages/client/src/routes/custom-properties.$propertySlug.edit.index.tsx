import { createFileRoute, redirect } from "@tanstack/react-router";

/** `/custom-properties/:slug/edit` lands on the General tab by default. */
export const Route = createFileRoute("/custom-properties/$propertySlug/edit/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/custom-properties/$propertySlug/edit/general",
      params,
    });
  },
});
