import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Pathless layout for an autofill rule's edit surface. The page lives in the `index` child; the
 *  `$` child redirects the old per-tab paths. */
export const Route = createFileRoute("/autofill/$ruleSlug/edit")({
  component: Outlet,
});
