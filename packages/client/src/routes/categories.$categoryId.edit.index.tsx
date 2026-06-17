import { createFileRoute, redirect } from "@tanstack/react-router";

/** `/categories/:id/edit` lands on the General tab by default. */
export const Route = createFileRoute("/categories/$categoryId/edit/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/categories/$categoryId/edit/general",
      params,
    });
  },
});
