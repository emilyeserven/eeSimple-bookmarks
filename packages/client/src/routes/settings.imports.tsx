import { createFileRoute, redirect } from "@tanstack/react-router";

/** Import settings split into Settings → Automations → Imports (blacklist) and Settings → Advanced
 *  → Database usage (inbox sweep); keep the old URL working by landing on the blacklist. */
export const Route = createFileRoute("/settings/imports")({
  beforeLoad: () => {
    throw redirect({
      to: "/settings/automations/imports",
    });
  },
});
