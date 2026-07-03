import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout for a single group type: the detail view and its `/edit` page render through here. */
export const Route = createFileRoute("/taxonomies/group-types/$groupTypeSlug")({
  component: GroupTypeLayout,
});

function GroupTypeLayout() {
  return <Outlet />;
}
