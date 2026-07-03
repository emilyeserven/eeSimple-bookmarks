import type { Group } from "@eesimple/types";

import { MonitorPlay, Sparkles } from "lucide-react";

import { useConnectors } from "../hooks/useConnectors";
import { useAutoGroupImage } from "../hooks/useGroups";

import { Button } from "@/components/ui/button";

/** The "fetch a group image from a connected source" buttons for the group General edit tab. */
export function GroupImageActions({
  group,
}: {
  group: Group;
}) {
  const autoImage = useAutoGroupImage();
  const {
    data: connectors,
  } = useConnectors();
  const busy = autoImage.isPending;

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy || !group.websiteId}
        onClick={() => autoImage.mutate({
          id: group.id,
          source: "website",
        })}
      >
        <Sparkles className="size-4" />
        Fetch from linked website
      </Button>
      {connectors?.plex.enabled && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy || !group.plexRatingKey}
          onClick={() => autoImage.mutate({
            id: group.id,
            source: "plex",
          })}
        >
          <MonitorPlay className="size-4" />
          Use Plex poster
        </Button>
      )}
    </div>
  );
}
