import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/taxonomies/group-types/$groupTypeSlug/edit/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/taxonomies/group-types/$groupTypeSlug/edit/general",
      params,
    });
  },
});
