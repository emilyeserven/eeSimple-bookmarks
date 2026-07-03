import type { Person } from "@eesimple/types";

import { useUpdatePerson } from "../hooks/usePeople";
import { useYouTubeChannels } from "../hooks/useYouTubeChannels";
import { describeError } from "../lib/apiError";
import { notifyFieldSaved, notifyFieldSaveError } from "../lib/autoSave";
import { toggleId } from "../lib/tag-utils";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Props {
  person: Person;
}

/** Association tab: pick which YouTube channels are connected to this person. Auto-saves on toggle. */
export function PersonYouTubeChannelsForm({
  person,
}: Props) {
  const {
    data: channels,
  } = useYouTubeChannels();
  const update = useUpdatePerson();
  const enabledIds = person.youtubeChannelIds;

  return (
    <div className="space-y-3">
      {(channels ?? []).length === 0
        ? <p className="text-sm text-muted-foreground">No YouTube channels exist yet.</p>
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
                        id: person.id,
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
export function PersonYouTubeChannelsView({
  person,
}: Props) {
  const {
    data: channels,
  } = useYouTubeChannels();
  const connected = (channels ?? []).filter(ch => person.youtubeChannelIds.includes(ch.id));

  if (connected.length === 0) {
    return <p className="text-sm text-muted-foreground">No YouTube channels connected.</p>;
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
