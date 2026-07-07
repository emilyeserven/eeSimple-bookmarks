import type { BookmarkWebsite, BookmarkYouTubeChannel } from "@eesimple/types";

import { useState } from "react";

import { Link } from "@tanstack/react-router";
import { Globe, MonitorPlay } from "lucide-react";

import { Badge } from "@/components/ui/badge";

type Props
  = {
    type: "website";
    data: BookmarkWebsite;
  }
  | {
    type: "youtube-channel";
    data: BookmarkYouTubeChannel;
  };

/** A clickable pill showing a website's favicon or a YouTube channel's avatar alongside the entity name. */
export function SourcePill({
  type,
  data,
}: Props) {
  const [imgError, setImgError] = useState(false);

  const imageUrl = data.imageUrl;
  const showImage = !!imageUrl && !imgError;

  const icon = showImage
    ? (
      <img
        src={imageUrl}
        alt=""
        className={
          type === "youtube-channel"
            ? "size-3 shrink-0 rounded-full object-contain"
            : "size-3 shrink-0 object-contain"
        }
        onError={() => setImgError(true)}
      />
    )
    : type === "website"
      ? <Globe className="size-3 shrink-0" />
      : <MonitorPlay className="size-3 shrink-0" />;

  const badge = (
    <Badge
      variant="secondary"
      className="inline-flex items-center gap-1"
    >
      {icon}
      {type === "website" ? data.siteName : data.name}
    </Badge>
  );

  if (type === "website") {
    return (
      <Link
        to="/taxonomies/websites/$websiteSlug"
        params={{
          websiteSlug: data.slug,
        }}
        title={data.siteName}
      >
        {badge}
      </Link>
    );
  }

  return (
    <Link
      to="/taxonomies/youtube-channels/$channelSlug"
      params={{
        channelSlug: data.slug,
      }}
      title={data.name}
    >
      {badge}
    </Link>
  );
}
