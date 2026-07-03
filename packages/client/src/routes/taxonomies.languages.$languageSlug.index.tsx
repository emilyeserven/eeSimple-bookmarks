import { createFileRoute, redirect } from "@tanstack/react-router";

/** `/taxonomies/languages/:slug` redirects to the General view tab by default. */
export const Route = createFileRoute("/taxonomies/languages/$languageSlug/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/taxonomies/languages/$languageSlug/general",
      params,
    });
  },
});
