import { createFileRoute, redirect } from "@tanstack/react-router";

/** `/bookmarks/:id/edit` lands on the General tab by default. */
export const Route = createFileRoute("/bookmarks/$bookmarkId/edit/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/bookmarks/$bookmarkId/edit/general",
      params,
    });
  },
});
