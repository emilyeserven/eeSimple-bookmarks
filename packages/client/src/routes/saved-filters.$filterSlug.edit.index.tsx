import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/saved-filters/$filterSlug/edit/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/saved-filters/$filterSlug/edit/general",
      params,
    });
  },
});
