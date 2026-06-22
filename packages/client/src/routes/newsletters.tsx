import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/newsletters")({
  component: NewsletterLayout,
});

function NewsletterLayout() {
  return <Outlet />;
}
