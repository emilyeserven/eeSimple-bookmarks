import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout for a single book: the detail view and its `/edit` page render through here. */
export const Route = createFileRoute("/taxonomies/books/$bookSlug")({
  component: BookLayout,
});

function BookLayout() {
  return <Outlet />;
}
