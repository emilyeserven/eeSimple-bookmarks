import { createFileRoute, redirect } from "@tanstack/react-router";

/** `/categories/:slug/edit` lands on the General tab by default. */
export const Route = createFileRoute("/categories/$categorySlug/edit/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/categories/$categorySlug/edit/general",
      params,
    });
  },
});
