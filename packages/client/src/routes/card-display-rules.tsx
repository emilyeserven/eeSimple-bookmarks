import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout for Card Display Rules: the listing and each rule's detail/edit pages render through here. */
export const Route = createFileRoute("/card-display-rules")({
  component: () => <Outlet />,
});
