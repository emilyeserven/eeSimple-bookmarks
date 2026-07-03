import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/taxonomies/genres-moods/$genreMoodSlug/edit/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/taxonomies/genres-moods/$genreMoodSlug/edit/general",
      params,
    });
  },
});
