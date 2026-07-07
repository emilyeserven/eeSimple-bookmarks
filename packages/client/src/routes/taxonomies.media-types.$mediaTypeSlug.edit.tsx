import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Pathless layout for a media type's edit surface. The page lives in the `index` child; the `$`
 *  child redirects the old per-tab paths. */
export const Route = createFileRoute("/taxonomies/media-types/$mediaTypeSlug/edit")({
  component: Outlet,
});
