import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/taxonomies/authors/$authorSlug/edit")({
  component: () => <Outlet />,
});
