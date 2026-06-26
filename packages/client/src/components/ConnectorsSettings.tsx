import { OEMBED_PROVIDERS } from "@eesimple/types";

import { useConnectors } from "../hooks/useConnectors";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
 * Read-only Connectors overview: every external data source the metadata-prefill pipeline uses and
 * what each provides, with live Active/Inactive status for the optional, env-gated providers. The
 * keyless providers are always on; the oEmbed list is derived from the shared `OEMBED_PROVIDERS`
 * registry so it stays in sync with what the server actually supports.
 */
export function ConnectorsSettings() {
  const {
    data,
  } = useConnectors();

  return (
    <div className="space-y-6">
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
          <Provides items={["Title", "Author", "Thumbnail image", "Publish date"]} />
        </CardContent>
      </Card>

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
          <Provides items={["Title", "Authors", "Publisher", "Publication year", "Cover image"]} />
        </CardContent>
      </Card>

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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>YouTube</CardTitle>
            <StatusBadge enabled={data?.youtubeDataApi.enabled} />
          </div>
          <CardDescription>
            Title, thumbnail, and channel always come from YouTube&apos;s keyless oEmbed endpoint. When
            a
            {" "}
            <code>YOUTUBE_API_KEY</code>
            {" "}
            is configured, duration, publish date, and description come from the YouTube Data API v3
            instead of the watch-page scrape; otherwise the scrape is used.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Provides items={["Title", "Channel", "Thumbnail image", "Duration", "Publish date", "Description"]} />
        </CardContent>
      </Card>

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
            Optional. When an operator configures a Microlink-compatible endpoint, hard pages
            (JS-rendered, bot-protected) are resolved by the hosted service. Off by default — the app
            sends URLs off-box only when this is configured, and falls back to the direct scrape
            otherwise.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Provides items={["Title", "Description", "Image", "Author", "Publisher", "Publish date"]} />
        </CardContent>
      </Card>
    </div>
  );
}
