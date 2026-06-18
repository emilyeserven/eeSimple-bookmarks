import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/tags/$tagSlug/edit/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/tags/$tagSlug/edit/general",
      params,
    });
  },
});
