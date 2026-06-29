import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout for a single location: the detail view and its `/edit` page render through here. */
export const Route = createFileRoute("/taxonomies/locations/$locationSlug")({
  component: LocationLayout,
});

function LocationLayout() {
  return <Outlet />;
}
