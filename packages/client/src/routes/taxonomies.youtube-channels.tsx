import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout wrapper for the YouTube Channels taxonomy — detail and edit pages render through here. */
export const Route = createFileRoute("/taxonomies/youtube-channels")({
  component: () => <Outlet />,
});
