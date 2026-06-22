import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout for a single newsletter: its issues, detail view, and `/edit` page render through here. */
export const Route = createFileRoute("/taxonomies/newsletters/$newsletterSlug")({
  component: NewsletterLayout,
});

function NewsletterLayout() {
  return <Outlet />;
}
