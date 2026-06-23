import { createFileRoute, redirect } from "@tanstack/react-router";

/** `/import-rules/:slug/edit` lands on the General tab by default. */
export const Route = createFileRoute("/import-rules/$ruleSlug/edit/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/import-rules/$ruleSlug/edit/general",
      params,
    });
  },
});
