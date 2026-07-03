import type { ReactNode } from "react";

import { useState } from "react";

import { OEMBED_PROVIDERS } from "@eesimple/types";

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
  if (enabled === undefined) return <Badge variant="outline">…</Badge>;
  return enabled ? <Badge>Active</Badge> : <Badge variant="outline">Inactive</Badge>;
}

/** A bullet list of the data a connector provides. */
function Provides({
  items,
}: { items: string[] }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">Provides</p>
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
  const total = counts["always-on"] + counts.active + counts.inactive;
  const options: { value: ConnectorFilter;
    label: string;
    count: number; }[] = [
    {
      value: "all",
      label: "All",
      count: total,
    },
    {
      value: "always-on",
      label: "Always on",
      count: counts["always-on"],
    },
    {
      value: "active",
      label: "Active",
      count: counts.active,
    },
    {
      value: "inactive",
      label: "Inactive",
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
          aria-label={`Show ${option.label.toLowerCase()} connectors`}
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
    data,
  } = useConnectors();
  const [filter, setFilter] = useState<ConnectorFilter>("all");

  const cards: { id: string;
    status: ConnectorStatus;
    node: ReactNode; }[] = [
    {
      id: "oembed",
      status: "always-on",
      node: (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>oEmbed providers</CardTitle>
              <AlwaysOnBadge />
            </div>
            <CardDescription>
              Keyless oEmbed lookups return clean, structured metadata for many media URLs — no scraping,
              no API key. Sites not listed here are still covered when they advertise an oEmbed endpoint
              (autodiscovery via the page&apos;s
              {" "}
              <code>&lt;link rel=&quot;oembed&quot;&gt;</code>
              {" "}
              tag).
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
            <Provides items={["Title", "Person", "Thumbnail image", "Publish date"]} />
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
              <CardTitle>Book metadata (Open Library → Google Books)</CardTitle>
              <AlwaysOnBadge />
            </div>
            <CardDescription>
              ISBN lookups try Open Library first, then fall back to the keyless Google Books API for
              broader coverage.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Provides items={["Title", "People", "Publisher", "Publication year", "Cover image"]} />
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
              <CardTitle>DuckDuckGo Icons</CardTitle>
              <AlwaysOnBadge />
            </div>
            <CardDescription>
              An instant site favicon from the DuckDuckGo icon service — shown immediately and used as a
              fallback when a site declares no icon of its own.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Provides items={["Site favicon"]} />
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
              <CardTitle>Geocoding (Nominatim)</CardTitle>
              <AlwaysOnBadge />
            </div>
            <CardDescription>
              Keyless place lookup for the Locations taxonomy, powered by OpenStreetMap Nominatim.
              Looking up a place resolves its coordinates, country, and a map link.
              {data?.geocoding.endpoint
                ? (
                  <>
                    {" "}
                    Endpoint:
                    {" "}
                    <code>{data.geocoding.endpoint}</code>
                  </>
                )
                : null}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Provides items={["Coordinates", "Country", "Place type", "Area outline", "Map URL"]} />
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
              <CardTitle>Wikidata (region fallback)</CardTitle>
              <AlwaysOnBadge />
            </div>
            <CardDescription>
              Keyless fallback for the Locations geocoder. When Nominatim has no entry for a place —
              typically a traditional or natural region with no administrative boundary, e.g. 中国地方
              (Chūgoku region) — Wikidata supplies its coordinates, country, and ancestor chain, and
              fills the area outline (its linked OpenStreetMap relation, or composed from the region&apos;s
              constituent units).
              {data?.wikidata.endpoint
                ? (
                  <>
                    {" "}
                    Endpoint:
                    {" "}
                    <code>{data.wikidata.endpoint}</code>
                  </>
                )
                : null}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Provides items={["Coordinates", "Country", "Ancestors", "Area outline", "Map URL"]} />
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
              Title, thumbnail, and channel always come from YouTube&apos;s keyless oEmbed endpoint. When
              an API key is configured (below, or the
              {" "}
              <code>YOUTUBE_API_KEY</code>
              {" "}
              env var), duration, publish date, description, and channel avatars come from the YouTube
              Data API v3 instead of scraping YouTube&apos;s pages; otherwise the scrape is used.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <YoutubeForm />
            <Provides items={["Title", "Channel", "Thumbnail image", "Duration", "Publish date", "Description", "Channel avatar"]} />
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
              Post and carousel images, and an person&apos;s avatar from a connected Instagram account,
              come from Instagram&apos;s keyless public embed. When an
              {" "}
              <code>INSTAGRAM_API_KEY</code>
              {" "}
              (with
              {" "}
              <code>INSTAGRAM_API_ENDPOINT</code>
              ) is configured, profile data comes from that API instead, with the keyless scrape as a
              fallback.
              {data?.instagram.apiKey
                ? " Profile API: configured."
                : " Profile API: not configured (keyless scrape in use)."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Provides items={["Post images", "Person avatar"]} />
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
              <CardTitle>Instagram reel archive</CardTitle>
              <StatusBadge enabled={data?.instagramReelArchive.enabled} />
            </div>
            <CardDescription>
              Optional. When object storage is configured, a saved Instagram reel can be archived on
              demand — the reel&apos;s video is captured into your own object storage so it survives the
              reel being deleted from Instagram. Self-contained; the video is fetched and stored on the
              box, not linked out. The video URL is found keylessly via Instagram&apos;s public embed
              page; a configured Browserless endpoint is used as a fallback for reels it doesn&apos;t
              expose.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Provides items={["Reel video capture", "In-app playback", "Download"]} />
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
                Hosted metadata provider
                {data?.hostedMetadata.provider ? ` (${data.hostedMetadata.provider})` : ""}
              </CardTitle>
              <StatusBadge enabled={data?.hostedMetadata.enabled} />
            </div>
            <CardDescription>
              Optional. When configured with a Browserless endpoint, JS-rendered and bot-protected pages
              are resolved by the hosted browser. Off by default — URLs are only sent to Browserless when
              an endpoint is configured, and the app falls back to the direct scrape otherwise.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <HostedMetadataForm />
            <Provides items={["Title", "Description", "Image", "Person", "Publisher", "Publish date"]} />
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
              <CardTitle>Image URL blacklist</CardTitle>
              <AlwaysOnBadge />
            </div>
            <CardDescription>
              Patterns that exclude matching candidate images from a URL scan, so ad and tracking
              images aren&apos;t offered in the Add Bookmark picker. Applied to every candidate
              (Instagram, oEmbed, and article images).
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
              Optional. When a base URL is configured, bookmarks link out to your self-hosted ArchiveBox
              web archive — viewing the archived snapshot of a page and archiving it on demand. Off by
              default; link-out only, so no token is sent and nothing leaves the box automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ArchiveBoxForm />
            <Provides items={["View archived snapshot", "Archive now (add URL)"]} />
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
              Optional. When a base URL and API key are configured, bookmarks can be linked to a
              series on your self-hosted Kavita ebook/manga server — with a &quot;View on Kavita&quot;
              link-out and series cover import. Off by default; series searches and cover fetches are
              proxied by the server, so the API key never reaches the browser.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <KavitaForm />
            <Provides items={["Link bookmarks to a Kavita series", "View on Kavita link-out", "Series cover import", "Table of contents import"]} />
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
              Optional. When a base URL and token are configured, bookmarks can be linked to an item
              on your self-hosted Plex media server (movie, TV show, music, …) — with a &quot;View on
              Plex&quot; link-out and poster import. Off by default; item searches and poster fetches
              are proxied by the server, so the token never reaches the browser.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <PlexForm />
            <Provides items={["Link bookmarks to a Plex item", "View on Plex link-out", "Poster import"]} />
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
          <p className="text-sm text-muted-foreground">No connectors match this filter.</p>
        )
        : visible.map(card => <div key={card.id}>{card.node}</div>)}
    </div>
  );
}
