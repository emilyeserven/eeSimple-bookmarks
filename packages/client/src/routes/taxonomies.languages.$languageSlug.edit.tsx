import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Pathless layout for a language's edit surface. The page lives in the `index` child; the `$`
 *  child redirects the old per-tab paths. */
export const Route = createFileRoute("/taxonomies/languages/$languageSlug/edit")({
  component: Outlet,
});
