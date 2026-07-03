import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout for a single person: detail view and edit page render through here. */
export const Route = createFileRoute("/taxonomies/people/$personSlug")({
  component: PersonLayout,
});

function PersonLayout() {
  return <Outlet />;
}
