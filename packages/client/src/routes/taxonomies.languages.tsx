import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout wrapper for the Languages area. */
export const Route = createFileRoute("/taxonomies/languages")({
  component: () => <Outlet />,
});
