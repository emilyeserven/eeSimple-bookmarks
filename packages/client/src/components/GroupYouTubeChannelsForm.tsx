import type { Group } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { useUpdateGroup } from "../hooks/useGroups";
import { useYouTubeChannels } from "../hooks/useYouTubeChannels";
import { describeError } from "../lib/apiError";
import { notifyFieldSaved, notifyFieldSaveError } from "../lib/autoSave";
import { toggleId } from "../lib/tag-utils";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Props {
  group: Group;
}

/** Association tab: pick which YouTube channels are connected to this group. Auto-saves on toggle. */
export function GroupYouTubeChannelsForm({
  group,
}: Props) {
  const {
    t,
  } = useTranslation();
  const {
    data: channels,
  } = useYouTubeChannels();
  const update = useUpdateGroup();
  const enabledIds = group.youtubeChannelIds;

  return (
    <div className="space-y-3">
      {(channels ?? []).length === 0
        ? <p className="text-sm text-muted-foreground">{t("No YouTube channels exist yet.")}</p>
        : (
          <ul className="space-y-2">
            {(channels ?? []).map(ch => (
              <li
                key={ch.id}
                className="flex items-center gap-2"
              >
                <Checkbox
                  id={`ch-${ch.id}`}
                  checked={enabledIds.includes(ch.id)}
                  onCheckedChange={() =>
                    update.mutate(
                      {
                        id: group.id,
                        input: {
                          youtubeChannelIds: toggleId(enabledIds, ch.id),
                        },
                      },
                      {
                        onSuccess: () => notifyFieldSaved("YouTube channels"),
                        onError: error => notifyFieldSaveError("YouTube channels", describeError(error)),
                      },
                    )}
                />
                {ch.imageUrl
                  ? (
                    <img
                      src={ch.imageUrl}
                      alt=""
                      className="size-5 rounded-full object-cover"
                    />
                  )
                  : null}
                <Label
                  htmlFor={`ch-${ch.id}`}
                  className="cursor-pointer font-normal"
                >
                  {ch.name}
                </Label>
              </li>
            ))}
          </ul>
        )}
    </div>
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
    data: channels,
  } = useYouTubeChannels();
  const connected = (channels ?? []).filter(ch => group.youtubeChannelIds.includes(ch.id));

  if (connected.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("No YouTube channels connected.")}</p>;
  }

  return (
    <ul className="space-y-2">
      {connected.map(ch => (
        <li
          key={ch.id}
          className="flex items-center gap-2 text-sm"
        >
          {ch.imageUrl
            ? (
              <img
                src={ch.imageUrl}
                alt=""
                className="size-5 rounded-full object-cover"
              />
            )
            : null}
          {ch.name}
        </li>
      ))}
    </ul>
  );
}
