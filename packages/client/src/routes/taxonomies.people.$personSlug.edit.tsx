import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/taxonomies/people/$personSlug/edit")({
  component: () => <Outlet />,
});
