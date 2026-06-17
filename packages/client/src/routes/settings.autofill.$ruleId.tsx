import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Autofill rules are now edited in the shared right-hand panel rather than on their own page.
 * This shim keeps old `/settings/autofill/$ruleId` deep links working by redirecting to the
 * list with the panel pointed at the rule via the `dCT`/`dCId` drawer params.
 */
export const Route = createFileRoute("/settings/autofill/$ruleId")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/settings/autofill",
      search: {
        dCT: "autofill",
        dCId: params.ruleId,
      },
    });
  },
});
