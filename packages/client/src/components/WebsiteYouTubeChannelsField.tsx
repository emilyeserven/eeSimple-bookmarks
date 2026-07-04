import type { YouTubeChannel } from "@eesimple/types";

import { useTranslation } from "react-i18next";

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
  const {
    t,
  } = useTranslation();

  return (
    <EntityYouTubeChannelsField
      {...props}
      description={t("YouTube channels associated with this website.")}
    />
  );
}
