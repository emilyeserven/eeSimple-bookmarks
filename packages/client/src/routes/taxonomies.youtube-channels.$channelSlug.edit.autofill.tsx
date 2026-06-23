import { createFileRoute, redirect } from "@tanstack/react-router";

/** The per-entity Autofill tab redirects to the consolidated Autofill Rules page, filtered. */
export const Route = createFileRoute("/taxonomies/youtube-channels/$channelSlug/edit/autofill")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/autofill",
      search: {
        channel: params.channelSlug,
      },
    });
  },
});
