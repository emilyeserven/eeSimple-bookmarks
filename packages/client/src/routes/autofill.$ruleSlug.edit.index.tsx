import { createFileRoute, redirect } from "@tanstack/react-router";

/** `/autofill/:slug/edit` lands on the General tab by default. */
export const Route = createFileRoute("/autofill/$ruleSlug/edit/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/autofill/$ruleSlug/edit/general",
      params,
    });
  },
});
