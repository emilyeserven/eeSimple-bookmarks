import { createFileRoute, redirect } from "@tanstack/react-router";

/** `/card-display-rules/:slug` lands on the General view tab by default. */
export const Route = createFileRoute("/card-display-rules/$ruleSlug/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/card-display-rules/$ruleSlug/info",
      params,
    });
  },
});
