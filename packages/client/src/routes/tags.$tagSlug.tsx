import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout wrapper for a single tag — its detail and edit pages render through here. */
export const Route = createFileRoute("/tags/$tagSlug")({
  component: () => <Outlet />,
});
