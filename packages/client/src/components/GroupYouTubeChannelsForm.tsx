import type { Group } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { EntityRelationForm, EntityRelationView } from "./EntityRelationSection";
import { useUpdateGroup } from "../hooks/useGroups";
import { useYouTubeChannels } from "../hooks/useYouTubeChannels";
import { describeError } from "../lib/apiError";
import { notifyFieldSaved, notifyFieldSaveError } from "../lib/autoSave";

interface Props {
  group: Group;
}

/** Association tab: pick which YouTube channels are connected to this group. Auto-saves on change. */
export function GroupYouTubeChannelsForm({
  group,
}: Props) {
  const {
    t,
  } = useTranslation();
  const {
    data: channels = [],
  } = useYouTubeChannels();
  const update = useUpdateGroup();

  return (
    <EntityRelationForm
      items={channels}
      selectedIds={group.youtubeChannelIds}
      onChange={ids => update.mutate(
        {
          id: group.id,
          input: {
            youtubeChannelIds: ids,
          },
        },
        {
          onSuccess: () => notifyFieldSaved("YouTube channels"),
          onError: error => notifyFieldSaveError("YouTube channels", describeError(error)),
        },
      )}
      createEntity="youtube-channel"
      placeholder={t("No channels selected")}
      searchPlaceholder={t("Search channels…")}
      emptyText={t("No YouTube channels found.")}
    />
  );
}

/** Read-only view of connected YouTube channels. */
export function GroupYouTubeChannelsView({
  group,
}: Props) {
  const {
    t,
  } = useTranslation();
  const {
    data: channels = [],
  } = useYouTubeChannels();

  return (
    <EntityRelationView
      items={channels}
      selectedIds={group.youtubeChannelIds}
      emptyText={t("No YouTube channels connected.")}
    />
  );
}
