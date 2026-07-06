import { createFileRoute, redirect } from "@tanstack/react-router";

/** `/import-rules/:slug` lands on the General view tab by default. */
export const Route = createFileRoute("/import-rules/$ruleSlug/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/import-rules/$ruleSlug/info",
      params,
    });
  },
});
