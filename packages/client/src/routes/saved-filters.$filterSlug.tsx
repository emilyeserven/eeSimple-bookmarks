import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/saved-filters/$filterSlug")({
  component: () => <Outlet />,
});
