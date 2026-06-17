import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout for the bookmarks section: the listing, a single bookmark, and its edit page render here. */
export const Route = createFileRoute("/bookmarks")({
  component: BookmarksLayout,
});

function BookmarksLayout() {
  return <Outlet />;
}
