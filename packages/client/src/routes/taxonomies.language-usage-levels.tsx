import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/taxonomies/language-usage-levels")({
  component: () => <Outlet />,
});
