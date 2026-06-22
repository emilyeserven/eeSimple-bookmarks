import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/taxonomies/newsletters/$newsletterSlug/edit/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/taxonomies/newsletters/$newsletterSlug/edit/general",
      params,
    });
  },
});
