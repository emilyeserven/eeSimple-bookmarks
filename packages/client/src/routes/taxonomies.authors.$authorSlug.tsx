import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout for a single author: detail view and edit page render through here. */
export const Route = createFileRoute("/taxonomies/authors/$authorSlug")({
  component: AuthorLayout,
});

function AuthorLayout() {
  return <Outlet />;
}
