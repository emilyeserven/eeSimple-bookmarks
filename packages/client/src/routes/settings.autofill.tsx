import { createFileRoute, redirect } from "@tanstack/react-router";

import { validateAutofillListSearch } from "../lib/autofillScope";

/** Autofill Rules moved to /autofill — redirect old entity-tab deeplinks. */
export const Route = createFileRoute("/settings/autofill")({
  validateSearch: validateAutofillListSearch,
  beforeLoad: ({
    search,
  }) => {
    throw redirect({
      to: "/autofill",
      search,
      replace: true,
    });
  },
});
