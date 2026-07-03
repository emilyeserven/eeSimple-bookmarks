import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/taxonomies/groups/$groupSlug/edit")({
  component: () => <Outlet />,
});
