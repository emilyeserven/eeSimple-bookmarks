import type { Person } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { EntityRelationForm, EntityRelationView } from "./EntityRelationSection";
import { useUpdatePerson } from "../hooks/usePeople";
import { useYouTubeChannels } from "../hooks/useYouTubeChannels";
import { describeError } from "../lib/apiError";
import { notifyFieldSaved, notifyFieldSaveError } from "../lib/autoSave";

interface Props {
  person: Person;
}

/** Association tab: pick which YouTube channels are connected to this person. Auto-saves on change. */
export function PersonYouTubeChannelsForm({
  person,
}: Props) {
  const {
    t,
  } = useTranslation();
  const {
    data: channels = [],
  } = useYouTubeChannels();
  const update = useUpdatePerson();

  return (
    <EntityRelationForm
      items={channels}
      selectedIds={person.youtubeChannelIds}
      onChange={ids => update.mutate(
        {
          id: person.id,
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
export function PersonYouTubeChannelsView({
  person,
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
      selectedIds={person.youtubeChannelIds}
      emptyText={t("No YouTube channels connected.")}
    />
  );
}
