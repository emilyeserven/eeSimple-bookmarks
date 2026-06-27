import type { useBookmarkFormActions } from "./useBookmarkFormActions";
import type { useSourceDefaultFlags } from "./useBookmarkFormState";
import type { WebsiteLookup, YouTubeChannel, YouTubeChannelHint } from "@eesimple/types";

import { useRef, useState } from "react";

type Flags = ReturnType<typeof useSourceDefaultFlags>;
type WebsiteLookupMutation = ReturnType<typeof useBookmarkFormActions>["websiteLookup"];

interface UseBookmarkFormChannelParams {
  youtubeChannels: YouTubeChannel[] | undefined;
  websiteLookup: WebsiteLookupMutation;
  flags: Flags;
}

/**
 * YouTube-channel state and sourceDefaults derivation for the bookmark form. Owns the
 * channel-hint ref + mirror state, computes `isNewChannel` and `sourceDefaults`, and
 * exposes `handleChannelSelfIdsChange`. Extracted from `useBookmarkFormController` to
 * reduce that hook's hook-density score.
 */
export function useBookmarkFormChannel({
  youtubeChannels,
  websiteLookup,
  flags,
}: UseBookmarkFormChannelParams) {
  // The channel resolved from a fetched YouTube video, passed on save so the server links/creates it.
  // The ref is read by the submit handler (stale-closure-safe); the state drives the banner display.
  const channelHintRef = useRef<YouTubeChannelHint | null>(null);
  const [youtubeChannel, setYoutubeChannel] = useState<YouTubeChannelHint | null>(null);

  // True when the detected channel isn't in the existing channels list yet — shows "set defaults" checkboxes.
  const isNewChannel = youtubeChannel !== null
    && youtubeChannels !== undefined
    && !youtubeChannels.some(ch => ch.channelKey === youtubeChannel.key);

  const lookupData = websiteLookup.data;
  const isYouTube = lookupData?.domain === "youtube.com";
  const existingChannel = youtubeChannel
    ? youtubeChannels?.find(ch => ch.channelKey === youtubeChannel.key)
    : undefined;

  // The bookmark's "source" whose defaults the form can promote. The "set as default category/tags"
  // checkboxes show for a *new* source; the "set as default media type" one shows whenever the
  // source has *no* default media type yet.
  const sourceDefaults = buildSourceDefaults({
    isYouTube,
    youtubeChannel,
    isNewChannel,
    existingChannel,
    lookupData,
    flags,
  });

  // Merge the user-entered self-ids into the resolved channel hint (mirroring ref + state).
  function handleChannelSelfIdsChange(ids: string[]): void {
    const updated = {
      ...(youtubeChannel ?? {
        key: "",
        name: "",
      }),
      selfIds: ids,
    };
    channelHintRef.current = updated;
    setYoutubeChannel(updated);
  }

  function resetChannel(): void {
    channelHintRef.current = null;
    setYoutubeChannel(null);
  }

  return {
    channelHintRef,
    youtubeChannel,
    setYoutubeChannel,
    isNewChannel,
    sourceDefaults,
    handleChannelSelfIdsChange,
    resetChannel,
  };
}

// ---------------------------------------------------------------------------
// Module-level pure helper — scored independently by fallow.
// ---------------------------------------------------------------------------

interface BuildSourceDefaultsParams {
  isYouTube: boolean;
  youtubeChannel: YouTubeChannelHint | null;
  isNewChannel: boolean;
  existingChannel: YouTubeChannel | undefined;
  lookupData: WebsiteLookup | undefined;
  flags: Flags;
}

/** Derives the sourceDefaults object from the resolved lookup/channel data and flags. */
function buildSourceDefaults({
  isYouTube,
  youtubeChannel,
  isNewChannel,
  existingChannel,
  lookupData,
  flags,
}: BuildSourceDefaultsParams) {
  if (isYouTube) {
    return {
      label: youtubeChannel?.name ?? null,
      showSourceDefault: isNewChannel,
      showMediaTypeDefault: youtubeChannel !== null && !existingChannel?.mediaTypeId,
      setCategory: flags.setChannelCategory,
      setTags: flags.setChannelTags,
      setMediaType: flags.setChannelMediaType,
      onSetCategory: flags.setSetChannelCategory,
      onSetTags: flags.setSetChannelTags,
      onSetMediaType: flags.setSetChannelMediaType,
    };
  }
  return {
    label: lookupData?.domain ?? null,
    showSourceDefault: Boolean(lookupData?.domain) && !lookupData?.exists,
    showMediaTypeDefault: Boolean(lookupData?.domain) && !lookupData?.mediaTypeId,
    setCategory: flags.setWebsiteCategory,
    setTags: flags.setWebsiteTags,
    setMediaType: flags.setWebsiteMediaType,
    onSetCategory: flags.setSetWebsiteCategory,
    onSetTags: flags.setSetWebsiteTags,
    onSetMediaType: flags.setSetWebsiteMediaType,
  };
}
