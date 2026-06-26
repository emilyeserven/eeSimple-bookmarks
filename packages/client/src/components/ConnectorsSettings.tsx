import { useEffect, useState } from "react";

import { OEMBED_PROVIDERS } from "@eesimple/types";

import { useConnectorsSettings, useUpdateConnectorsSettings } from "../hooks/useAppSettings";
import { useConnectors } from "../hooks/useConnectors";
import { notifyFieldSaved, notifyFieldSaveError } from "../lib/autoSave";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
 * Editable form for the hosted metadata connector: endpoint URL, provider label, and API key.
 * Each field saves on blur with a named toast. The raw API key is never returned by the API —
 * only `hostedMetadataApiKeySet: boolean`.
 */
function HostedMetadataForm() {
  const {
    data,
  } = useConnectorsSettings();
  const update = useUpdateConnectorsSettings();

  const [endpoint, setEndpoint] = useState(data?.hostedMetadataEndpoint ?? "");
  const [provider, setProvider] = useState(data?.hostedMetadataProvider ?? "");
  // apiKey field is always blank on load; user must type to set/replace/clear the stored key.
  const [apiKey, setApiKey] = useState("");
  const [apiKeyDirty, setApiKeyDirty] = useState(false);

  useEffect(() => {
    if (data) {
      setEndpoint(data.hostedMetadataEndpoint);
      setProvider(data.hostedMetadataProvider);
    }
  }, [data]);

  function saveField(field: "endpoint" | "provider" | "apiKey"): void {
    if (!data) return;
    // API key field: skip when the user hasn't typed anything (would silently no-op server-side).
    if (field === "apiKey" && !apiKeyDirty) return;
    const label = field === "endpoint" ? "Endpoint" : field === "provider" ? "Provider" : "API key";
    update.mutate(
      {
        hostedMetadataEndpoint: endpoint,
        hostedMetadataProvider: provider,
        // null = server preserves the existing key; only send the value when the user typed.
        hostedMetadataApiKey: field === "apiKey" ? apiKey : null,
      },
      {
        onSuccess: () => {
          notifyFieldSaved(label);
          if (field === "apiKey") {
            setApiKeyDirty(false);
            setApiKey("");
          }
        },
        onError: (err: Error) => notifyFieldSaveError(label, err.message),
      },
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Use the hosted
        {" "}
        <a
          href="https://microlink.io"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          Microlink
        </a>
        {" "}
        service or any compatible self-hosted endpoint. Sign up at
        {" "}
        <a
          href="https://microlink.io/pricing"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          microlink.io/pricing
        </a>
        {" "}
        to get an API key (a free tier is available with rate limits). Each field saves on blur.
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="hm-endpoint">Endpoint URL</Label>
        <Input
          id="hm-endpoint"
          type="url"
          placeholder="https://api.microlink.io/"
          value={endpoint}
          onChange={e => setEndpoint(e.target.value)}
          onBlur={() => saveField("endpoint")}
        />
        <p className="text-xs text-muted-foreground">
          The base URL of the Microlink-compatible API. Use
          {" "}
          <code>https://api.microlink.io/</code>
          {" "}
          for the hosted service, or your self-hosted endpoint.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="hm-provider">Provider label</Label>
        <Input
          id="hm-provider"
          type="text"
          placeholder="microlink"
          value={provider}
          onChange={e => setProvider(e.target.value)}
          onBlur={() => saveField("provider")}
        />
        <p className="text-xs text-muted-foreground">
          Display name shown next to the Active badge above (e.g.
          {" "}
          <code>microlink</code>
          ). Does not affect behavior.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="hm-apikey">API key</Label>
        <Input
          id="hm-apikey"
          type="password"
          placeholder={data?.hostedMetadataApiKeySet ? "••••••••" : "No key stored"}
          value={apiKey}
          onChange={(e) => {
            setApiKey(e.target.value);
            setApiKeyDirty(true);
          }}
          onBlur={() => saveField("apiKey")}
        />
        <p className="text-xs text-muted-foreground">
          {data?.hostedMetadataApiKeySet
            ? "A key is stored — the value is never shown. Type a new key to replace it. To clear the stored key, type a single space and save."
            : "Optional for the free tier. Find your key in the Microlink dashboard after signing up."}
          {data && !data.encryptionEnabled && (
            <>
              {" "}
              Set the
              {" "}
              <code>APP_SECRET</code>
              {" "}
              env var to encrypt this key at rest.
            </>
          )}
        </p>
      </div>
    </div>
  );
}

/**
 * Connectors overview: every external data source the metadata-prefill pipeline uses and
 * what each provides, with live Active/Inactive status for the optional, env-gated providers.
 * The hosted metadata provider card includes editable fields for endpoint, provider, and API key.
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
            Optional. When configured with a Microlink-compatible endpoint, hard pages (JS-rendered,
            bot-protected) are resolved by the hosted service. Off by default — the app sends URLs
            off-box only when an endpoint is set, and falls back to the direct scrape otherwise.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <HostedMetadataForm />
          <Provides items={["Title", "Description", "Image", "Author", "Publisher", "Publish date"]} />
        </CardContent>
      </Card>
    </div>
  );
}
