import type { useAuthorGeneralForm } from "./useAuthorGeneralForm";
import type { Author, Website, YouTubeChannel } from "@eesimple/types";

import { AtSign, Globe, MonitorPlay, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SOCIAL_MEDIA_PLATFORM_LABELS } from "@/lib/socialLinks";

type Controller = ReturnType<typeof useAuthorGeneralForm>;

interface AuthorAvatarActionsProps {
  author: Author;
  avatarBusy: boolean;
  autoAvatar: Controller["autoAvatar"];
  adoptChannel: Controller["adoptChannel"];
  adoptWebsite: Controller["adoptWebsite"];
  connectedChannelsWithImage: YouTubeChannel[];
  connectedWebsitesWithImage: Website[];
}

/** The "fetch an avatar from a connected source" buttons for the author General edit tab. */
export function AuthorAvatarActions({
  author,
  avatarBusy,
  autoAvatar,
  adoptChannel,
  adoptWebsite,
  connectedChannelsWithImage,
  connectedWebsitesWithImage,
}: AuthorAvatarActionsProps) {
  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={avatarBusy || !author.authorWebsiteUrl}
        onClick={() => autoAvatar.mutate({
          id: author.id,
          source: "website",
          sourceUrl: author.authorWebsiteUrl ?? undefined,
        })}
      >
        <Sparkles className="size-4" />
        Fetch from Author Website
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={avatarBusy || !author.biographyUrl}
        onClick={() => autoAvatar.mutate({
          id: author.id,
          source: "biography",
          sourceUrl: author.biographyUrl ?? undefined,
        })}
      >
        <Sparkles className="size-4" />
        Fetch from Biography
      </Button>
      {author.socialLinks
        .filter(link => link.platform === "instagram")
        .map(link => (
          <Button
            key={link.url}
            type="button"
            variant="outline"
            size="sm"
            disabled={avatarBusy}
            onClick={() => autoAvatar.mutate({
              id: author.id,
              source: "social",
              platform: link.platform,
              sourceUrl: link.url,
            })}
          >
            <AtSign className="size-4" />
            Fetch from
            {" "}
            {SOCIAL_MEDIA_PLATFORM_LABELS[link.platform]}
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
            id: author.id,
            channelId: ch.id,
          })}
        >
          <MonitorPlay className="size-4" />
          Use &ldquo;
          {ch.name}
          &rdquo; photo
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
            id: author.id,
            websiteId: site.id,
          })}
        >
          <Globe className="size-4" />
          Use &ldquo;
          {site.siteName}
          &rdquo; favicon
        </Button>
      ))}
    </div>
  );
}
