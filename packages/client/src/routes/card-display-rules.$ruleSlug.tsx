import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout for a single card display rule: the detail view and its `/edit` page render through here. */
export const Route = createFileRoute("/card-display-rules/$ruleSlug")({
  component: () => <Outlet />,
});
