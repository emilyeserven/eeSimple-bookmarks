import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/taxonomies/media-types/$mediaTypeSlug/edit/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/taxonomies/media-types/$mediaTypeSlug/edit/general",
      params,
    });
  },
});
