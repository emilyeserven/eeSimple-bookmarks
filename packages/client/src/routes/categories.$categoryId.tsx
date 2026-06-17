import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout for a single category: the detail view and its `/edit` tabs render through here. */
export const Route = createFileRoute("/categories/$categoryId")({
  component: CategoryLayout,
});

function CategoryLayout() {
  return <Outlet />;
}
