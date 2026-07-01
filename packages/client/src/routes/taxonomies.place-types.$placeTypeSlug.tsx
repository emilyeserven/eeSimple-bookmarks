import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout for a single place type: the detail view and its `/edit` page render through here. */
export const Route = createFileRoute("/taxonomies/place-types/$placeTypeSlug")({
  component: () => <Outlet />,
});
