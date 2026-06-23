import { createFileRoute, redirect } from "@tanstack/react-router";

import { validateCardDisplayListSearch } from "../lib/cardDisplayScope";

/** Card Display Rules moved to /card-display-rules — redirect old bookmark/entity-tab links. */
export const Route = createFileRoute("/settings/card-display-rules")({
  validateSearch: validateCardDisplayListSearch,
  beforeLoad: ({
    search,
  }) => {
    throw redirect({
      to: "/card-display-rules",
      search,
      replace: true,
    });
  },
});
