import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout for a single import rule: the detail view and its `/edit` page render through here. */
export const Route = createFileRoute("/import-rules/$ruleSlug")({
  component: ImportRuleLayout,
});

function ImportRuleLayout() {
  return <Outlet />;
}
