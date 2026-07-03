import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout wrapper for the Books area — detail and edit pages render through here. */
export const Route = createFileRoute("/taxonomies/books")({
  component: () => <Outlet />,
});
