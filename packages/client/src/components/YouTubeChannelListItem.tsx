import type { YouTubeChannel } from "@eesimple/types";

import { channelUrlFromKey } from "@eesimple/types";
import { Link } from "@tanstack/react-router";
import { Info, MonitorPlay, Pencil, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

import { CategoryPill } from "./CategoryPill";
import { HoverIconButton, StandardListingCard } from "./StandardListingCard";
import { useAutoYouTubeChannelImage } from "../hooks/useYouTubeChannels";

import { useEntityImage } from "@/hooks/useEntityImage";

interface YouTubeChannelListItemProps {
  channel: YouTubeChannel;
  selectable?: boolean;
  selected?: boolean;
  onSelectToggle?: () => void;
  inSelectionMode?: boolean;
}

/** A single row in the channel listing: an avatar, a body link to the channel's own bookmarks page, and hover Edit / Info. */
export function YouTubeChannelListItem({
  channel,
  selectable,
  selected,
  onSelectToggle,
  inSelectionMode,
}: YouTubeChannelListItemProps) {
  const {
    t,
  } = useTranslation();
  const autoAvatar = useAutoYouTubeChannelImage();
  const {
    showImage,
    onError,
  } = useEntityImage(channel.imageUrl);

  return (
    <StandardListingCard
      selectable={selectable}
      selected={selected}
      onSelectToggle={onSelectToggle}
      inSelectionMode={inSelectionMode}
      icon={(
        <span
          className="
            flex size-8 shrink-0 items-center justify-center overflow-hidden
            rounded-full bg-muted text-muted-foreground
          "
        >
          {showImage
            ? (
              <img
                src={channel.imageUrl ?? undefined}
                alt=""
                className="size-full object-cover"
                onError={onError}
              />
            )
            : <MonitorPlay className="size-4" />}
        </span>
      )}
      title={channel.name}
      subtitle={channel.channelKey}
      count={channel.bookmarkCount}
      renderPrimaryLink={(className, children) => (
        <Link
          to="/taxonomies/youtube-channels/$channelSlug"
          params={{
            channelSlug: channel.slug,
          }}
          title={t("Show bookmarks from {{name}}", {
            name: channel.name,
          })}
          className={className}
        >
          {children}
        </Link>
      )}
      renderExtra={() => (
        <HoverIconButton>
          <button
            type="button"
            title={t("Fetch avatar")}
            disabled={autoAvatar.isPending || autoAvatar.cooldown.isOnCooldown}
            onClick={() => autoAvatar.mutate({
              id: channel.id,
              sourceUrl: channelUrlFromKey(channel.channelKey),
            })}
          >
            <Sparkles className="size-4" />
            <span className="sr-only">
              {t("Fetch avatar for {{name}}", {
                name: channel.name,
              })}
            </span>
          </button>
        </HoverIconButton>
      )}
      renderEdit={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/youtube-channels/$channelSlug/edit"
            params={{
              channelSlug: channel.slug,
            }}
            title={t("Edit {{name}}", {
              name: channel.name,
            })}
          >
            <Pencil className="size-4" />
            <span className="sr-only">
              {t("Edit {{name}}", {
                name: channel.name,
              })}
            </span>
          </Link>
        </HoverIconButton>
      )}
      renderInfo={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/youtube-channels/$channelSlug/info"
            params={{
              channelSlug: channel.slug,
            }}
            title={t("View {{name}}", {
              name: channel.name,
            })}
          >
            <Info className="size-4" />
            <span className="sr-only">
              {t("View {{name}}", {
                name: channel.name,
              })}
            </span>
          </Link>
        </HoverIconButton>
      )}
      footer={channel.category
        ? <CategoryPill category={channel.category} />
        : undefined}
    />
  );
}
