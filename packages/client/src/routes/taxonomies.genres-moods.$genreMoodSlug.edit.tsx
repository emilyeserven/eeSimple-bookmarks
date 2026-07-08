import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Pathless layout for a genre/mood's edit surface. The page lives in the `index` child; the `$`
 *  child redirects the old per-tab paths. */
export const Route = createFileRoute("/taxonomies/genres-moods/$genreMoodSlug/edit")({
  component: Outlet,
});
