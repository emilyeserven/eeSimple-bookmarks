import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/taxonomies/tracks/$trackSlug/edit/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/taxonomies/tracks/$trackSlug/edit/general",
      params,
    });
  },
});
