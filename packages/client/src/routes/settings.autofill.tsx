import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout for autofill settings: the rules list and each rule's edit page render through here. */
export const Route = createFileRoute("/settings/autofill")({
  component: AutofillLayout,
});

function AutofillLayout() {
  return <Outlet />;
}
