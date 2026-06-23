import { createFileRoute, redirect } from "@tanstack/react-router";

/** The per-entity Autofill tab redirects to the consolidated Autofill Rules page, filtered. */
export const Route = createFileRoute("/taxonomies/media-types/$mediaTypeSlug/edit/autofill")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/autofill",
      search: {
        mediaType: params.mediaTypeSlug,
      },
    });
  },
});
