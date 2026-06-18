import { createTabWrapper } from "./TabWrapper";

import { useYouTubeChannelBySlug } from "@/hooks/useYouTubeChannels";

/** Loads a YouTube channel by slug and renders a tab's title + description header above its content. */
export const YouTubeChannelTabWrapper = createTabWrapper(
  "channelSlug",
  useYouTubeChannelBySlug,
  result => result.channel,
  "Channel not found.",
);
