import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout wrapper for the Tags taxonomy — listing, detail and edit pages render through here. */
export const Route = createFileRoute("/tags")({
  component: () => <Outlet />,
});
