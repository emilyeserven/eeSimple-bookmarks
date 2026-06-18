import { createFileRoute, redirect } from "@tanstack/react-router";

/** `/taxonomies/youtube-channels/:slug` redirects to the General view tab by default. */
export const Route = createFileRoute("/taxonomies/youtube-channels/$channelSlug/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/taxonomies/youtube-channels/$channelSlug/general",
      params,
    });
  },
});
