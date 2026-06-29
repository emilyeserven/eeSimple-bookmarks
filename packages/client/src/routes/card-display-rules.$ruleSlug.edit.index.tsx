import { createFileRoute, redirect } from "@tanstack/react-router";

/** `/card-display-rules/:slug/edit` lands on the General tab by default. */
export const Route = createFileRoute("/card-display-rules/$ruleSlug/edit/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/card-display-rules/$ruleSlug/edit/general",
      params,
    });
  },
});
