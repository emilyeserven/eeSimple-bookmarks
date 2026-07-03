import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/taxonomies/movies/$movieSlug/edit/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/taxonomies/movies/$movieSlug/edit/general",
      params,
    });
  },
});
