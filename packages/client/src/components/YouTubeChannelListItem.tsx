import type { YouTubeChannel } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Info, MonitorPlay, Pencil } from "lucide-react";

import { CategoryPill } from "./CategoryPill";
import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { HoverIconButton, StandardListingCard } from "./StandardListingCard";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";

import { useEntityImage } from "@/hooks/useEntityImage";
import { withYouTubeChannels } from "@/lib/bookmarkSearch";
import { SIDEBAR_MODIFIER_LABELS, entityLinkTitle } from "@/lib/sidebarModifier";

interface YouTubeChannelListItemProps {
  channel: YouTubeChannel;
  selectable?: boolean;
  selected?: boolean;
  onSelectToggle?: () => void;
}

/** A single row in the channel listing: an avatar, a body link to the filtered bookmarks, and hover Edit / Info. */
export function YouTubeChannelListItem({
  channel,
  selectable,
  selected,
  onSelectToggle,
}: YouTubeChannelListItemProps) {
  const editClick = useEditPanelClick();
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();
  const {
    showImage,
    onError,
  } = useEntityImage(channel.imageUrl);

  return (
    <StandardListingCard
      selectable={selectable}
      selected={selected}
      onSelectToggle={onSelectToggle}
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
          to="/bookmarks"
          search={withYouTubeChannels({}, [channel.id])}
          title={`Show bookmarks from ${channel.name}`}
          className={className}
        >
          {children}
        </Link>
      )}
      renderEdit={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/youtube-channels/$channelSlug/edit"
            params={{
              channelSlug: channel.slug,
            }}
            title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
            onClick={event => editClick(event, "youtube-channel", channel.id)}
          >
            <Pencil className="size-4" />
            <span className="sr-only">Edit {channel.name}</span>
          </Link>
        </HoverIconButton>
      )}
      renderInfo={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/youtube-channels/$channelSlug/general"
            params={{
              channelSlug: channel.slug,
            }}
            title={entityLinkTitle(modifier)}
            onClick={event => viewClick(event, "youtube-channel", channel.id, channel.slug)}
          >
            <Info className="size-4" />
            <span className="sr-only">View {channel.name}</span>
          </Link>
        </HoverIconButton>
      )}
      footer={channel.category
        ? <CategoryPill category={channel.category} />
        : undefined}
    />
  );
}
