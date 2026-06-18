import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout for a single autofill rule: the detail view and its `/edit` page render through here. */
export const Route = createFileRoute("/settings/autofill/$ruleSlug")({
  component: AutofillRuleLayout,
});

function AutofillRuleLayout() {
  return <Outlet />;
}
