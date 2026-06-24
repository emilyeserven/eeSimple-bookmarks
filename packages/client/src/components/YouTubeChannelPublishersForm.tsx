import type { YouTubeChannel } from "@eesimple/types";

import { usePublishers } from "../hooks/usePublishers";
import { useUpdateYouTubeChannel } from "../hooks/useYouTubeChannels";
import { describeError } from "../lib/apiError";
import { notifyFieldSaved, notifyFieldSaveError } from "../lib/autoSave";
import { toggleId } from "../lib/tag-utils";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Props {
  channel: YouTubeChannel;
}

/** Association tab: pick which publishers are connected to this channel. Auto-saves on toggle. */
export function YouTubeChannelPublishersForm({
  channel,
}: Props) {
  const {
    data: publishers,
  } = usePublishers();
  const update = useUpdateYouTubeChannel();
  const enabledIds = channel.publisherIds;

  return (
    <div className="space-y-3">
      {(publishers ?? []).length === 0
        ? <p className="text-sm text-muted-foreground">No publishers exist yet.</p>
        : (
          <ul className="space-y-2">
            {(publishers ?? []).map(pub => (
              <li
                key={pub.id}
                className="flex items-center gap-2"
              >
                <Checkbox
                  id={`pub-${pub.id}`}
                  checked={enabledIds.includes(pub.id)}
                  onCheckedChange={() =>
                    update.mutate(
                      {
                        id: channel.id,
                        input: {
                          publisherIds: toggleId(enabledIds, pub.id),
                        },
                      },
                      {
                        onSuccess: () => notifyFieldSaved("Publishers"),
                        onError: error => notifyFieldSaveError("Publishers", describeError(error)),
                      },
                    )}
                />
                <Label
                  htmlFor={`pub-${pub.id}`}
                  className="cursor-pointer font-normal"
                >
                  {pub.name}
                  {pub.website
                    ? (
                      <span className="ml-1 text-xs text-muted-foreground">
                        {pub.website.domain}
                      </span>
                    )
                    : null}
                </Label>
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}

/** Read-only view of connected publishers. */
export function YouTubeChannelPublishersView({
  channel,
}: Props) {
  const {
    data: publishers,
  } = usePublishers();
  const connected = (publishers ?? []).filter(pub => channel.publisherIds.includes(pub.id));

  if (connected.length === 0) {
    return <p className="text-sm text-muted-foreground">No publishers connected.</p>;
  }

  return (
    <ul className="space-y-2">
      {connected.map(pub => (
        <li
          key={pub.id}
          className="text-sm"
        >
          {pub.name}
          {pub.website
            ? <span className="ml-1 text-xs text-muted-foreground">{pub.website.domain}</span>
            : null}
        </li>
      ))}
    </ul>
  );
}
