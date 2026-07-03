import type { YouTubeChannel } from "@eesimple/types";

import { EntityYouTubeChannelsField } from "./EntityYouTubeChannelsField";

interface Props {
  channels: YouTubeChannel[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

/**
 * Multi-select field for associating YouTube channels with a website.
 * Saving happens immediately on each selection change.
 */
export function WebsiteYouTubeChannelsField(props: Props) {
  return (
    <EntityYouTubeChannelsField
      {...props}
      description="YouTube channels associated with this website."
    />
  );
}
