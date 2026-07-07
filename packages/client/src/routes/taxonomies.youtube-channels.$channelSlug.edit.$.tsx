import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Redirect the old per-tab edit paths (`…/edit/general`, `…/edit/autofill`, `…/edit/display-rules`,
 * `…/edit/languages`) to the unified `…/edit?tab=<tab>` route.
 */
export const Route = createFileRoute("/taxonomies/youtube-channels/$channelSlug/edit/$")({
  beforeLoad: ({
    params,
  }) => {
    const segment = params._splat?.split("/").filter(Boolean)[0];
    throw redirect({
      to: "/taxonomies/youtube-channels/$channelSlug/edit",
      params: {
        channelSlug: params.channelSlug,
      },
      search: segment
        ? {
          tab: segment,
        }
        : {},
    });
  },
});
