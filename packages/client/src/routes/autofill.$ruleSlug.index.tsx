import { createFileRoute, redirect } from "@tanstack/react-router";

/** `/autofill/:slug` lands on the General view tab by default. */
export const Route = createFileRoute("/autofill/$ruleSlug/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/autofill/$ruleSlug/general",
      params,
    });
  },
});
