import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { AddYouTubeChannelModal } from "./AddYouTubeChannelModal";
import { ListingScaffold } from "./ListingScaffold";
import { useSetListingPage } from "../hooks/useListingPage";

import { youtubeChannelListingConfig } from "@/entities/youtubeChannel";
import { useListingScaffold } from "@/hooks/useListingScaffold";

/** Browsable, searchable channel listing with add modal. Shared by the YouTube Channels taxonomy page and the Settings page. */
export function YouTubeChannelsListing() {
  const {
    t,
  } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  useSetListingPage("youtube-channels-listing", {
    createAction: () => setModalOpen(true),
    addBookmark: {},
    createLabel: t("New channel"),
  });
  const navigate = useNavigate();
  const state = useListingScaffold(youtubeChannelListingConfig);

  return (
    <div className="space-y-4">
      <ListingScaffold
        config={youtubeChannelListingConfig}
        state={state}
      />

      <AddYouTubeChannelModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={(channel) => {
          void navigate({
            to: "/taxonomies/youtube-channels/$channelSlug/edit/general",
            params: {
              channelSlug: channel.slug,
            },
          });
        }}
      />
    </div>
  );
}
