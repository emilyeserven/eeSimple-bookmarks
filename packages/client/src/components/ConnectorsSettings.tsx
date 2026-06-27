import type { CheckUrlResult } from "@eesimple/types";

import { useEffect, useState } from "react";

import { OEMBED_PROVIDERS } from "@eesimple/types";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import { useConnectorsSettings, useUpdateConnectorsSettings } from "../hooks/useAppSettings";
import { useConnectors } from "../hooks/useConnectors";
import { metadataApi } from "../lib/api/metadata";
import { notifyFieldSaved, notifyFieldSaveError } from "../lib/autoSave";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const [checkResult, setCheckResult] = useState<CheckUrlResult | null>(null);

  const checkConnection = useMutation({
    mutationFn: () => metadataApi.checkUrl({
      url: endpoint,
    }),
    onSuccess: result => setCheckResult(result),
    onError: (err: Error) => notifyFieldSaveError("Connection check", err.message),
  });

  useEffect(() => {
    if (data) {
      setEndpoint(data.hostedMetadataEndpoint);
      setProvider(data.hostedMetadataProvider);
      setCheckResult(null);
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
        Point this at a self-hosted
        {" "}
        <a
          href="https://github.com/browserless/browserless"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          Browserless
        </a>
        {" "}
        instance (
        <code>ghcr.io/browserless/chromium</code>
        ). Browserless renders pages with a real browser so JS-heavy or bot-protected pages return
        full metadata. Each field saves on blur.
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="hm-endpoint">Endpoint URL</Label>
        <Input
          id="hm-endpoint"
          type="url"
          placeholder="http://localhost:3000"
          value={endpoint}
          onChange={(e) => {
            setEndpoint(e.target.value);
            setCheckResult(null);
          }}
          onBlur={() => saveField("endpoint")}
        />
        <p className="text-xs text-muted-foreground">
          Base URL of your Browserless instance (e.g.
          {" "}
          <code>http://localhost:3000</code>
          ). The app appends
          {" "}
          <code>/chromium/content</code>
          {" "}
          for metadata and
          {" "}
          <code>/chromium/screenshot</code>
          {" "}
          for page screenshots.
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!endpoint || checkConnection.isPending}
            onClick={() => {
              setCheckResult(null);
              checkConnection.mutate();
            }}
          >
            {checkConnection.isPending
              ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Checking…
                </>
              )
              : "Check connection"}
          </Button>
          {checkResult && (
            checkResult.ok
              ? (
                <span
                  className="
                    flex items-center gap-1 text-sm text-green-600
                    dark:text-green-400
                  "
                >
                  <CheckCircle2 className="size-4" />
                  Reachable
                  {checkResult.status ? ` (HTTP ${checkResult.status})` : ""}
                </span>
              )
              : (
                <span
                  className="flex items-center gap-1 text-sm text-destructive"
                >
                  <XCircle className="size-4" />
                  {checkResult.reason === "timeout"
                    ? "Timed out"
                    : checkResult.reason === "network_error"
                      ? "Connection refused"
                      : `HTTP ${checkResult.status ?? "error"}`}
                </span>
              )
          )}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="hm-provider">Provider label</Label>
        <Input
          id="hm-provider"
          type="text"
          placeholder="browserless"
          value={provider}
          onChange={e => setProvider(e.target.value)}
          onBlur={() => saveField("provider")}
        />
        <p className="text-xs text-muted-foreground">
          Display name shown next to the Active badge above (e.g.
          {" "}
          <code>browserless</code>
          ). Does not affect behavior.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="hm-apikey">API token</Label>
        <Input
          id="hm-apikey"
          type="password"
          placeholder={data?.hostedMetadataApiKeySet ? "••••••••" : "No token stored"}
          value={apiKey}
          onChange={(e) => {
            setApiKey(e.target.value);
            setApiKeyDirty(true);
          }}
          onBlur={() => saveField("apiKey")}
        />
        <p className="text-xs text-muted-foreground">
          {data?.hostedMetadataApiKeySet
            ? "A token is stored — the value is never shown. Type a new token to replace it. To clear the stored token, type a single space and save."
            : "Optional. Set the TOKEN env var on your Browserless container and enter the same value here. Sent as an Authorization: Bearer header."}
          {data && !data.encryptionEnabled && (
            <>
              {" "}
              Set the
              {" "}
              <code>APP_SECRET</code>
              {" "}
              env var to encrypt this token at rest.
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
            Optional. When configured with a Browserless endpoint, JS-rendered and bot-protected pages
            are resolved by the hosted browser. Off by default — URLs are only sent to Browserless when
            an endpoint is configured, and the app falls back to the direct scrape otherwise.
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
