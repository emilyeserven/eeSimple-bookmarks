import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Pathless layout for a card display rule's edit surface. The page lives in the `index` child;
 *  the `$` child redirects the old per-tab paths. */
export const Route = createFileRoute("/card-display-rules/$ruleSlug/edit")({
  component: Outlet,
});
