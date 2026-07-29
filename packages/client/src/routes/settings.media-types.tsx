import { createFileRoute, redirect } from "@tanstack/react-router";

/** The Media Types taxonomy lives at `/taxonomies/media-types`; keep the old URL working. */
export const Route = createFileRoute("/settings/media-types")({
  beforeLoad: () => {
    throw redirect({
      to: "/taxonomies/media-types",
    });
  },
});
