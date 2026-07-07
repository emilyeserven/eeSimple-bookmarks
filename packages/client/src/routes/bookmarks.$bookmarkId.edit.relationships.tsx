import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * The bookmark "Relationships" edit tab was resurfaced inline as the "Related" edit tab (which also
 * carries the Media identity + creator/location/genre fields). This route is kept only to redirect
 * stale/bookmarked links to the new home.
 */
export const Route = createFileRoute("/bookmarks/$bookmarkId/edit/relationships")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/bookmarks/$bookmarkId/edit/related",
      params: {
        bookmarkId: params.bookmarkId,
      },
    });
  },
});
