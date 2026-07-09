import type { ReactNode } from "react";

import { useState } from "react";

import { OEMBED_PROVIDERS } from "@eesimple/types";
import { useTranslation } from "react-i18next";

import { ArchiveBoxForm, HostedMetadataForm, ImageBlacklistForm, KavitaForm, PlexForm, YoutubeForm } from "./ConnectorMetadataForms";
import { useConnectors } from "../hooks/useConnectors";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

/** "Always on" pill for the keyless connectors that need no configuration. */
function AlwaysOnBadge() {
  return <Badge variant="secondary">Always on</Badge>;
}

/** Live Active/Inactive pill for an env-gated connector (`…` while the status loads). */
function StatusBadge({
  enabled,
}: { enabled: boolean | undefined }) {
  const {
    t,
  } = useTranslation();
  if (enabled === undefined) return <Badge variant="outline">…</Badge>;
  return enabled ? <Badge>{t("Active")}</Badge> : <Badge variant="outline">{t("Inactive")}</Badge>;
}

/** A bullet list of the data a connector provides. */
function Provides({
  items,
}: { items: string[] }) {
  const {
    t,
  } = useTranslation();
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{t("Provides")}</p>
      <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">
        {items.map(item => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}

/**
 * How a connector card is classified for the filter bar:
 * - `always-on` — keyless, needs no configuration (the "Always on" badge cards);
 * - `active` / `inactive` — env-gated providers, by their live enabled status.
 */
type ConnectorStatus = "always-on" | "active" | "inactive";

/** The filter selections; `all` shows every card. */
type ConnectorFilter = "all" | ConnectorStatus;

/** Map an env-gated connector's `enabled` flag (undefined while loading) to a status. */
function envStatus(enabled: boolean | undefined): ConnectorStatus {
  return enabled ? "active" : "inactive";
}

/**
 * Filter buttons shown above the connector cards. A single-select toggle group with a count
 * beside each option; re-clicking the active option is a no-op (the group always keeps a value).
 */
function ConnectorFilterBar({
  value, onChange, counts,
}: {
  value: ConnectorFilter;
  onChange: (next: ConnectorFilter) => void;
  counts: Record<ConnectorStatus, number>;
}) {
  const {
    t,
  } = useTranslation();
  const total = counts["always-on"] + counts.active + counts.inactive;
  const options: { value: ConnectorFilter;
    label: string;
    count: number; }[] = [
    {
      value: "all",
      label: t("All"),
      count: total,
    },
    {
      value: "always-on",
      label: t("Always on"),
      count: counts["always-on"],
    },
    {
      value: "active",
      label: t("Active"),
      count: counts.active,
    },
    {
      value: "inactive",
      label: t("Inactive"),
      count: counts.inactive,
    },
  ];
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      value={value}
      onValueChange={(next) => {
        // Radix clears the value when the active item is re-clicked; ignore that so a filter is
        // always selected.
        if (next) onChange(next as ConnectorFilter);
      }}
      className="flex-wrap justify-start"
    >
      {options.map(option => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          aria-label={t("Show {{label}} connectors", {
            label: option.label.toLowerCase(),
          })}
        >
          {option.label}
          <Badge
            variant="secondary"
            className="ml-1.5"
          >{option.count}
          </Badge>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

/**
 * Connectors overview: every external data source the metadata-prefill pipeline uses and
 * what each provides, with live Active/Inactive status for the optional, env-gated providers.
 * The hosted metadata provider card includes editable fields for endpoint, provider, and API key.
 * A filter bar at the top narrows the cards to Always on / Active / Inactive.
 */
export function ConnectorsSettings() {
  const {
    t,
  } = useTranslation();
  const {
    data,
  } = useConnectors();
  const [filter, setFilter] = useState<ConnectorFilter>("all");

  const cards: { id: string;
    status: ConnectorStatus;
    node: ReactNode; }[] = [
    {
      id: "page-metadata",
      status: "always-on",
      node: (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>{t("Page metadata (Open Graph, Twitter Cards, HTML)")}</CardTitle>
              <AlwaysOnBadge />
            </div>
            <CardDescription>
              {t("Every scanned page is read for standard metadata to prefill a new bookmark.")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Provides items={[t("Title"), t("Description"), t("Image"), t("Authors"), t("Language")]} />
          </CardContent>
        </Card>
      ),
    },
    {
      id: "oembed",
      status: "always-on",
      node: (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>{t("oEmbed providers")}</CardTitle>
              <AlwaysOnBadge />
            </div>
            <CardDescription>
              {t("Keyless oEmbed lookups return clean, structured metadata for many media URLs — no scraping, no API key. Sites not listed here are still covered when they advertise an oEmbed endpoint (autodiscovery via the page's")}
              {" "}
              <code>&lt;link rel=&quot;oembed&quot;&gt;</code>
              {" "}
              {t("tag).")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-1.5">
              {OEMBED_PROVIDERS.map(provider => (
                <Badge
                  key={provider.name}
                  variant="outline"
                >{provider.name}
                </Badge>
              ))}
            </div>
            <Provides items={[t("Title"), t("Person"), t("Thumbnail image"), t("Publish date")]} />
          </CardContent>
        </Card>
      ),
    },
    {
      id: "book-metadata",
      status: "always-on",
      node: (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>{t("Book metadata (Open Library → Google Books)")}</CardTitle>
              <AlwaysOnBadge />
            </div>
            <CardDescription>
              {t("ISBN lookups try Open Library first, then fall back to the keyless Google Books API for broader coverage.")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Provides items={[t("Title"), t("People"), t("Publisher"), t("Publication year"), t("Cover image")]} />
          </CardContent>
        </Card>
      ),
    },
    {
      id: "podcasts",
      status: "always-on",
      node: (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>{t("Podcasts (Apple Podcasts, Pocket Casts + RSS)")}</CardTitle>
              <AlwaysOnBadge />
            </div>
            <CardDescription>
              {t("Keyless podcast metadata: search Apple Podcasts (the iTunes Search API) or Pocket Casts, or paste an RSS/XML feed URL, to autofill a podcast's title, author, artwork, and description — and re-pull them any time with \"Sync from source\". Its page link on each service is found by matching the feed across directories; Spotify has no keyless search, so paste its link. No API key, nothing leaves the box beyond the feed/directory lookups.")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Provides items={[t("Title"), t("Author"), t("Artwork image"), t("Description"), t("Service links")]} />
          </CardContent>
        </Card>
      ),
    },
    {
      id: "duckduckgo-icons",
      status: "always-on",
      node: (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>{t("DuckDuckGo Icons")}</CardTitle>
              <AlwaysOnBadge />
            </div>
            <CardDescription>
              {t("An instant site favicon from the DuckDuckGo icon service — shown immediately and used as a fallback when a site declares no icon of its own.")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Provides items={[t("Site favicon")]} />
          </CardContent>
        </Card>
      ),
    },
    {
      id: "geocoding",
      status: "always-on",
      node: (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>{t("Geocoding (Nominatim)")}</CardTitle>
              <AlwaysOnBadge />
            </div>
            <CardDescription>
              {t("Keyless place lookup for the Locations taxonomy, powered by OpenStreetMap Nominatim. Looking up a place resolves its coordinates, country, and a map link.")}
              {data?.geocoding.endpoint
                ? (
                  <>
                    {" "}
                    {t("Endpoint:")}
                    {" "}
                    <code>{data.geocoding.endpoint}</code>
                  </>
                )
                : null}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Provides items={[t("Coordinates"), t("Country"), t("Place type"), t("Area outline"), t("Map URL")]} />
          </CardContent>
        </Card>
      ),
    },
    {
      id: "wikidata",
      status: "always-on",
      node: (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>{t("Wikidata (region fallback)")}</CardTitle>
              <AlwaysOnBadge />
            </div>
            <CardDescription>
              {t("Keyless fallback for the Locations geocoder. When Nominatim has no entry for a place — typically a traditional or natural region with no administrative boundary, e.g. 中国地方 (Chūgoku region) — Wikidata supplies its coordinates, country, and ancestor chain, and fills the area outline (its linked OpenStreetMap relation, or composed from the region's constituent units).")}
              {data?.wikidata.endpoint
                ? (
                  <>
                    {" "}
                    {t("Endpoint:")}
                    {" "}
                    <code>{data.wikidata.endpoint}</code>
                  </>
                )
                : null}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Provides items={[t("Coordinates"), t("Country"), t("Ancestors"), t("Area outline"), t("Map URL")]} />
          </CardContent>
        </Card>
      ),
    },
    {
      id: "youtube",
      status: envStatus(data?.youtubeDataApi.enabled),
      node: (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>YouTube</CardTitle>
              <StatusBadge enabled={data?.youtubeDataApi.enabled} />
            </div>
            <CardDescription>
              {t("Title, thumbnail, and channel always come from YouTube's keyless oEmbed endpoint. When an API key is configured (below, or the")}
              {" "}
              <code>YOUTUBE_API_KEY</code>
              {" "}
              {t("env var), duration, publish date, description, and channel avatars come from the YouTube Data API v3 instead of scraping YouTube's pages; otherwise the scrape is used.")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <YoutubeForm />
            <Provides items={[t("Title"), t("Channel"), t("Thumbnail image"), t("Duration"), t("Publish date"), t("Description"), t("Channel avatar")]} />
          </CardContent>
        </Card>
      ),
    },
    {
      id: "instagram",
      status: "always-on",
      node: (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>Instagram</CardTitle>
              <AlwaysOnBadge />
            </div>
            <CardDescription>
              {t("Post and carousel images, and an person's avatar from a connected Instagram account, come from Instagram's keyless public embed. When an")}
              {" "}
              <code>INSTAGRAM_API_KEY</code>
              {" "}
              {t("(with")}
              {" "}
              <code>INSTAGRAM_API_ENDPOINT</code>
              {t(") is configured, profile data comes from that API instead, with the keyless scrape as a fallback.")}
              {data?.instagram.apiKey
                ? ` ${t("Profile API: configured.")}`
                : ` ${t("Profile API: not configured (keyless scrape in use).")}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Provides items={[t("Post images"), t("Person avatar")]} />
          </CardContent>
        </Card>
      ),
    },
    {
      id: "instagram-reel-archive",
      status: envStatus(data?.instagramReelArchive.enabled),
      node: (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>{t("Instagram reel archive")}</CardTitle>
              <StatusBadge enabled={data?.instagramReelArchive.enabled} />
            </div>
            <CardDescription>
              {t("Optional. When object storage is configured, a saved Instagram reel can be archived on demand — the reel's video is captured into your own object storage so it survives the reel being deleted from Instagram. Self-contained; the video is fetched and stored on the box, not linked out. The video URL is found keylessly via Instagram's public embed page; a configured Browserless endpoint is used as a fallback for reels it doesn't expose.")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Provides items={[t("Reel video capture"), t("In-app playback"), t("Download")]} />
          </CardContent>
        </Card>
      ),
    },
    {
      id: "hosted-metadata",
      status: envStatus(data?.hostedMetadata.enabled),
      node: (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>
                {t("Hosted metadata provider")}
                {data?.hostedMetadata.provider ? ` (${data.hostedMetadata.provider})` : ""}
              </CardTitle>
              <StatusBadge enabled={data?.hostedMetadata.enabled} />
            </div>
            <CardDescription>
              {t("Optional. When configured with a Browserless endpoint, JS-rendered and bot-protected pages are resolved by the hosted browser. Off by default — URLs are only sent to Browserless when an endpoint is configured, and the app falls back to the direct scrape otherwise.")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <HostedMetadataForm />
            <Provides items={[t("Title"), t("Description"), t("Image"), t("Person"), t("Publisher"), t("Publish date")]} />
          </CardContent>
        </Card>
      ),
    },
    {
      id: "image-blacklist",
      status: "always-on",
      node: (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>{t("Image URL blacklist")}</CardTitle>
              <AlwaysOnBadge />
            </div>
            <CardDescription>
              {t("Patterns that exclude matching candidate images from a URL scan, so ad and tracking images aren't offered in the Add Bookmark picker. Applied to every candidate (Instagram, oEmbed, and article images).")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImageBlacklistForm />
          </CardContent>
        </Card>
      ),
    },
    {
      id: "archivebox",
      status: envStatus(data?.archiveBox.enabled),
      node: (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>ArchiveBox</CardTitle>
              <StatusBadge enabled={data?.archiveBox.enabled} />
            </div>
            <CardDescription>
              {t("Optional. When a base URL is configured, bookmarks link out to your self-hosted ArchiveBox web archive — viewing the archived snapshot of a page and archiving it on demand. Off by default; link-out only, so no token is sent and nothing leaves the box automatically.")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ArchiveBoxForm />
            <Provides items={[t("View archived snapshot"), t("Archive now (add URL)")]} />
          </CardContent>
        </Card>
      ),
    },
    {
      id: "kavita",
      status: envStatus(data?.kavita.enabled),
      node: (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>Kavita</CardTitle>
              <StatusBadge enabled={data?.kavita.enabled} />
            </div>
            <CardDescription>
              {t("Optional. When a base URL and API key are configured, bookmarks can be linked to a series on your self-hosted Kavita ebook/manga server — with a \"View on Kavita\" link-out and series cover import. Off by default; series searches and cover fetches are proxied by the server, so the API key never reaches the browser.")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <KavitaForm />
            <Provides items={[t("Link bookmarks to a Kavita series"), t("View on Kavita link-out"), t("Series cover import"), t("Table of contents import")]} />
          </CardContent>
        </Card>
      ),
    },
    {
      id: "plex",
      status: envStatus(data?.plex.enabled),
      node: (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>Plex</CardTitle>
              <StatusBadge enabled={data?.plex.enabled} />
            </div>
            <CardDescription>
              {t("Optional. When a base URL and token are configured, bookmarks can be linked to an item on your self-hosted Plex media server (movie, TV show, music, …) — with a \"View on Plex\" link-out and poster import. Off by default; item searches and poster fetches are proxied by the server, so the token never reaches the browser.")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <PlexForm />
            <Provides items={[t("Link bookmarks to a Plex item"), t("View on Plex link-out"), t("Poster import")]} />
          </CardContent>
        </Card>
      ),
    },
  ];

  const counts: Record<ConnectorStatus, number> = {
    "always-on": cards.filter(card => card.status === "always-on").length,
    "active": cards.filter(card => card.status === "active").length,
    "inactive": cards.filter(card => card.status === "inactive").length,
  };
  const visible = cards.filter(card => filter === "all" || card.status === filter);

  return (
    <div className="space-y-6">
      <ConnectorFilterBar
        value={filter}
        onChange={setFilter}
        counts={counts}
      />
      {visible.length === 0
        ? (
          <p className="text-sm text-muted-foreground">{t("No connectors match this filter.")}</p>
        )
        : visible.map(card => <div key={card.id}>{card.node}</div>)}
    </div>
  );
}
