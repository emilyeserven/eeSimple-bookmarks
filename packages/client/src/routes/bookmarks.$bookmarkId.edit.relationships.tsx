import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * The bookmark "Relationships" edit tab moved to Settings → Relationships (deeplinked per-bookmark),
 * mirroring the Autofill Rules → Settings → Autofill consolidation. This route is kept only to redirect
 * stale/bookmarked links to the new home with this bookmark preselected.
 */
export const Route = createFileRoute("/bookmarks/$bookmarkId/edit/relationships")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/settings/relationships",
      search: {
        bookmark: params.bookmarkId,
      },
    });
  },
});
