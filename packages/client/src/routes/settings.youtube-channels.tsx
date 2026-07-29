import { createFileRoute, redirect } from "@tanstack/react-router";

/** The YouTube Channels taxonomy lives at `/taxonomies/youtube-channels`; keep the old URL working. */
export const Route = createFileRoute("/settings/youtube-channels")({
  beforeLoad: () => {
    throw redirect({
      to: "/taxonomies/youtube-channels",
    });
  },
});
