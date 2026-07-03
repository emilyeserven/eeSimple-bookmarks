import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout for a single language: the detail view and its `/edit` page render through here. */
export const Route = createFileRoute("/taxonomies/languages/$languageSlug")({
  component: LanguageLayout,
});

function LanguageLayout() {
  return <Outlet />;
}
