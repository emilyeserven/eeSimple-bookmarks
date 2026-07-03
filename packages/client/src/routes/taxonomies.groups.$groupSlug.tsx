import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout for a single group: detail view and edit page render through here. */
export const Route = createFileRoute("/taxonomies/groups/$groupSlug")({
  component: GroupLayout,
});

function GroupLayout() {
  return <Outlet />;
}
