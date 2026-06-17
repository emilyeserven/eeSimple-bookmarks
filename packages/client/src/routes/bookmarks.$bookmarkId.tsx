import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout for a single bookmark: the detail view and its edit page render through here. */
export const Route = createFileRoute("/bookmarks/$bookmarkId")({
  component: BookmarkLayout,
});

function BookmarkLayout() {
  return <Outlet />;
}
