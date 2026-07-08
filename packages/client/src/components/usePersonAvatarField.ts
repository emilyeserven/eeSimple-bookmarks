import type { Person, Website, YouTubeChannel } from "@eesimple/types";

import {
  useAdoptChannelImageForPerson,
  useAdoptWebsiteFaviconForPerson,
  useAutoPersonImage,
  useDeletePersonImage,
  useUploadPersonImage,
} from "../hooks/usePeople";
import { useWebsites } from "../hooks/useWebsites";
import { useYouTubeChannels } from "../hooks/useYouTubeChannels";

/**
 * Backs the person **avatar** field: the image mutations, the combined busy flag, and the connected
 * YouTube channels / websites that carry an image (so the "adopt their photo/favicon" actions can be
 * offered). Independently react-query-backed and mounted by the `avatar` edit field — there is no
 * shared General-form controller (the person composite extraction, #1194, follows the Category
 * "independently-backed" shape, not the Bookmark form-context provider).
 */
export function usePersonAvatarField(person: Person) {
  const uploadAvatar = useUploadPersonImage();
  const autoAvatar = useAutoPersonImage();
  const deleteAvatar = useDeletePersonImage();
  const adoptChannel = useAdoptChannelImageForPerson();
  const adoptWebsite = useAdoptWebsiteFaviconForPerson();
  const avatarBusy
    = uploadAvatar.isPending
      || autoAvatar.isPending
      || deleteAvatar.isPending
      || adoptChannel.isPending
      || adoptWebsite.isPending;

  const {
    data: channels,
  } = useYouTubeChannels();
  const {
    data: websites,
  } = useWebsites();

  const connectedChannelsWithImage: YouTubeChannel[] = (channels ?? []).filter(
    ch => person.youtubeChannelIds.includes(ch.id) && ch.imageUrl != null,
  );
  const connectedWebsitesWithImage: Website[] = (websites ?? []).filter(
    site => person.websiteIds.includes(site.id) && site.imageUrl != null,
  );

  return {
    avatarBusy,
    uploadAvatar,
    autoAvatar,
    deleteAvatar,
    adoptChannel,
    adoptWebsite,
    connectedChannelsWithImage,
    connectedWebsitesWithImage,
  };
}
