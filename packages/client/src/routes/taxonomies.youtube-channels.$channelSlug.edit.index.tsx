import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/taxonomies/youtube-channels/$channelSlug/edit/")({
  beforeLoad: ({
    params,
  }) => {
    throw redirect({
      to: "/taxonomies/youtube-channels/$channelSlug/edit/general",
      params,
    });
  },
});
