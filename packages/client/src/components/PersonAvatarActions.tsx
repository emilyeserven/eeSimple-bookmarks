import type { usePersonAvatarField } from "./usePersonAvatarField";
import type { Person, Website, YouTubeChannel } from "@eesimple/types";

import { AtSign, Globe, MonitorPlay, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { usePersonSourceLabelSettings } from "@/hooks/useAppSettings";
import { SOCIAL_MEDIA_PLATFORM_LABELS } from "@/lib/socialLinks";

type Controller = ReturnType<typeof usePersonAvatarField>;

interface PersonAvatarActionsProps {
  person: Person;
  avatarBusy: boolean;
  autoAvatar: Controller["autoAvatar"];
  adoptChannel: Controller["adoptChannel"];
  adoptWebsite: Controller["adoptWebsite"];
  connectedChannelsWithImage: YouTubeChannel[];
  connectedWebsitesWithImage: Website[];
}

/** The "fetch an avatar from a connected source" buttons for the person General edit tab. */
export function PersonAvatarActions({
  person,
  avatarBusy,
  autoAvatar,
  adoptChannel,
  adoptWebsite,
  connectedChannelsWithImage,
  connectedWebsitesWithImage,
}: PersonAvatarActionsProps) {
  const {
    t,
  } = useTranslation();
  const {
    websiteLabel, biographyLabel,
  } = usePersonSourceLabelSettings();
  // Mirror the middleware's `sourceUrlFromLabeled`: "website" prefers the row matching the
  // configured `websiteLabel` (else the first URL); "biography" matches only `biographyLabel`.
  // Configurable via Settings → Automations → Global. `sourceUrl` is used just for the client error
  // toast — the server re-derives the actual URL from the person's list.
  const wantedWebsiteLabel = websiteLabel.trim().toLowerCase();
  const wantedBiographyLabel = biographyLabel.trim().toLowerCase();
  const websiteSourceUrl = person.labeledWebsites.find(
    w => w.label.trim().toLowerCase() === wantedWebsiteLabel,
  )?.url ?? person.labeledWebsites[0]?.url;
  const biographySourceUrl = person.labeledWebsites.find(
    w => w.label.trim().toLowerCase() === wantedBiographyLabel,
  )?.url;
  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={avatarBusy || !websiteSourceUrl}
        onClick={() => autoAvatar.mutate({
          id: person.id,
          source: "website",
          sourceUrl: websiteSourceUrl,
        })}
      >
        <Sparkles className="size-4" />
        {t("Fetch from Person Website")}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={avatarBusy || !biographySourceUrl}
        onClick={() => autoAvatar.mutate({
          id: person.id,
          source: "biography",
          sourceUrl: biographySourceUrl,
        })}
      >
        <Sparkles className="size-4" />
        {t("Fetch from Biography")}
      </Button>
      {person.socialLinks
        .filter(link => link.platform === "instagram")
        .map(link => (
          <Button
            key={link.url}
            type="button"
            variant="outline"
            size="sm"
            disabled={avatarBusy}
            onClick={() => autoAvatar.mutate({
              id: person.id,
              source: "social",
              platform: link.platform,
              sourceUrl: link.url,
            })}
          >
            <AtSign className="size-4" />
            {t("Fetch from {{platform}}", {
              platform: SOCIAL_MEDIA_PLATFORM_LABELS[link.platform],
            })}
          </Button>
        ))}
      {connectedChannelsWithImage.map(ch => (
        <Button
          key={ch.id}
          type="button"
          variant="outline"
          size="sm"
          disabled={avatarBusy}
          onClick={() => adoptChannel.mutate({
            id: person.id,
            channelId: ch.id,
          })}
        >
          <MonitorPlay className="size-4" />
          {t("Use “{{name}}” photo", {
            name: ch.name,
          })}
        </Button>
      ))}
      {connectedWebsitesWithImage.map(site => (
        <Button
          key={site.id}
          type="button"
          variant="outline"
          size="sm"
          disabled={avatarBusy}
          onClick={() => adoptWebsite.mutate({
            id: person.id,
            websiteId: site.id,
          })}
        >
          <Globe className="size-4" />
          {t("Use “{{name}}” favicon", {
            name: site.siteName,
          })}
        </Button>
      ))}
    </div>
  );
}
