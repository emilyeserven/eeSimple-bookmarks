import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/taxonomies/media-properties/$mediaPropertySlug/edit/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/taxonomies/media-properties/$mediaPropertySlug/edit/general",
      params,
    });
  },
});
