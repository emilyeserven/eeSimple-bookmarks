import type { CheckUrlResult } from "@eesimple/types";
import type { ReactNode } from "react";

import { useEffect, useState } from "react";

import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Plus, X, XCircle } from "lucide-react";

import { useConnectorsSettings, useUpdateConnectorsSettings } from "../hooks/useAppSettings";
import { metadataApi } from "../lib/api/metadata";
import { notifyFieldSaved, notifyFieldSaveError } from "../lib/autoSave";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Inline status for a connection check attempt. */
function CheckConnectionResult({
  result,
}: { result: CheckUrlResult | null }) {
  if (!result) return null;
  if (result.ok) {
    return (
      <span
        className="
          flex items-center gap-1 text-sm text-green-600
          dark:text-green-400
        "
      >
        <CheckCircle2 className="size-4" />
        Reachable
        {result.status ? ` (HTTP ${result.status})` : ""}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-sm text-destructive">
      <XCircle className="size-4" />
      {result.reason === "timeout"
        ? "Timed out"
        : result.reason === "network_error"
          ? "Connection refused"
          : `HTTP ${result.status ?? "error"}`}
    </span>
  );
}

/** Description text beneath the API key field, varying by stored state and encryption config. */
function ApiKeyHint({
  apiKeySet, encryptionEnabled, unsetHint,
}: { apiKeySet: boolean;
  encryptionEnabled: boolean;
  /** Copy shown while no key is stored, telling the user where the key comes from. */
  unsetHint?: ReactNode; }) {
  return (
    <p className="text-xs text-muted-foreground">
      {apiKeySet
        ? "A token is stored — the value is never shown. Type a new token to replace it. To clear the stored token, type a single space and save."
        : unsetHint ?? "Optional. Set the TOKEN env var on your Browserless container and enter the same value here. Sent as an Authorization: Bearer header."}
      {!encryptionEnabled && (
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
  );
}

/**
 * Editable form for the hosted metadata connector: endpoint URL, provider label, and API key.
 * Each field saves on blur with a named toast. The raw API key is never returned by the API —
 * only `hostedMetadataApiKeySet: boolean`.
 */
export function HostedMetadataForm() {
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
      url: `${endpoint.replace(/\/$/, "")}/active`,
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
        // The connectors PUT body requires every field; preserve the other connectors' values.
        archiveBoxEndpoint: data.archiveBoxEndpoint,
        kavitaEndpoint: data.kavitaEndpoint,
        kavitaApiKey: null,
        youtubeApiKey: null,
        imageUrlBlacklist: data.imageUrlBlacklist,
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
          <CheckConnectionResult result={checkResult} />
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
        <ApiKeyHint
          apiKeySet={data?.hostedMetadataApiKeySet ?? false}
          encryptionEnabled={data?.encryptionEnabled ?? true}
        />
      </div>
    </div>
  );
}

/**
 * Editable form for the ArchiveBox connector: a single base-URL field that saves on blur with a
 * named toast. Link-out only — no token is stored or sent. The connectors PUT body requires every
 * field, so the hosted-metadata fields are echoed from the loaded settings (API key left unchanged).
 */
export function ArchiveBoxForm() {
  const {
    data,
  } = useConnectorsSettings();
  const update = useUpdateConnectorsSettings();

  const [endpoint, setEndpoint] = useState(data?.archiveBoxEndpoint ?? "");
  const [checkResult, setCheckResult] = useState<CheckUrlResult | null>(null);

  const checkConnection = useMutation({
    mutationFn: () => metadataApi.checkUrl({
      url: endpoint.replace(/\/$/, ""),
    }),
    onSuccess: result => setCheckResult(result),
    onError: (err: Error) => notifyFieldSaveError("Connection check", err.message),
  });

  useEffect(() => {
    if (data) {
      setEndpoint(data.archiveBoxEndpoint);
      setCheckResult(null);
    }
  }, [data]);

  function saveEndpoint(): void {
    if (!data) return;
    update.mutate(
      {
        // Echo the other connectors' fields unchanged (null preserves the stored API keys).
        hostedMetadataEndpoint: data.hostedMetadataEndpoint,
        hostedMetadataProvider: data.hostedMetadataProvider,
        hostedMetadataApiKey: null,
        archiveBoxEndpoint: endpoint,
        kavitaEndpoint: data.kavitaEndpoint,
        kavitaApiKey: null,
        youtubeApiKey: null,
        imageUrlBlacklist: data.imageUrlBlacklist,
      },
      {
        onSuccess: () => notifyFieldSaved("ArchiveBox URL"),
        onError: (err: Error) => notifyFieldSaveError("ArchiveBox URL", err.message),
      },
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Point this at your self-hosted
        {" "}
        <a
          href="https://archivebox.io/"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          ArchiveBox
        </a>
        {" "}
        instance. When set, bookmarks gain links to view the archived snapshot of their page and to
        archive it on demand. Link-out only — no token is sent, and the links open against your own
        ArchiveBox in a new tab. Saves on blur.
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="ab-endpoint">Base URL</Label>
        <Input
          id="ab-endpoint"
          type="url"
          placeholder="http://localhost:8000"
          value={endpoint}
          onChange={(e) => {
            setEndpoint(e.target.value);
            setCheckResult(null);
          }}
          onBlur={saveEndpoint}
        />
        <p className="text-xs text-muted-foreground">
          Base URL of your ArchiveBox instance (e.g.
          {" "}
          <code>http://localhost:8000</code>
          ). The app appends
          {" "}
          <code>/?q=&lt;url&gt;</code>
          {" "}
          to view a snapshot and
          {" "}
          <code>/add?url=&lt;url&gt;</code>
          {" "}
          to archive a page.
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
          <CheckConnectionResult result={checkResult} />
        </div>
      </div>
    </div>
  );
}

/**
 * Editable form for the Kavita connector: base URL and API key, each saving on blur with a named
 * toast. The raw API key is never returned by the API — only `kavitaApiKeySet: boolean`. The
 * connectors PUT body requires every field, so the other connectors' values are echoed from the
 * loaded settings (hosted-metadata API key left unchanged).
 */
export function KavitaForm() {
  const {
    data,
  } = useConnectorsSettings();
  const update = useUpdateConnectorsSettings();

  const [endpoint, setEndpoint] = useState(data?.kavitaEndpoint ?? "");
  // apiKey field is always blank on load; user must type to set/replace/clear the stored key.
  const [apiKey, setApiKey] = useState("");
  const [apiKeyDirty, setApiKeyDirty] = useState(false);
  const [checkResult, setCheckResult] = useState<CheckUrlResult | null>(null);

  const checkConnection = useMutation({
    // Kavita's /api/Health endpoint is anonymous, so this probes reachability only — the API key
    // is validated by the first series search.
    mutationFn: () => metadataApi.checkUrl({
      url: `${endpoint.replace(/\/$/, "")}/api/Health`,
    }),
    onSuccess: result => setCheckResult(result),
    onError: (err: Error) => notifyFieldSaveError("Connection check", err.message),
  });

  useEffect(() => {
    if (data) {
      setEndpoint(data.kavitaEndpoint);
      setCheckResult(null);
    }
  }, [data]);

  function saveField(field: "endpoint" | "apiKey"): void {
    if (!data) return;
    // API key field: skip when the user hasn't typed anything (would silently no-op server-side).
    if (field === "apiKey" && !apiKeyDirty) return;
    const label = field === "endpoint" ? "Kavita URL" : "Kavita API key";
    update.mutate(
      {
        // Echo the other connectors' fields unchanged (null preserves the stored API keys).
        hostedMetadataEndpoint: data.hostedMetadataEndpoint,
        hostedMetadataProvider: data.hostedMetadataProvider,
        hostedMetadataApiKey: null,
        archiveBoxEndpoint: data.archiveBoxEndpoint,
        kavitaEndpoint: endpoint,
        kavitaApiKey: field === "apiKey" ? apiKey : null,
        youtubeApiKey: null,
        imageUrlBlacklist: data.imageUrlBlacklist,
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
        Point this at your self-hosted
        {" "}
        <a
          href="https://www.kavitareader.com/"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          Kavita
        </a>
        {" "}
        server. When set, bookmarks can be linked to a Kavita series, gain a &quot;View on
        Kavita&quot; link-out, and can import the series cover as their image. The API key stays on the server —
        searches and cover fetches are proxied so it never reaches the browser. Each field saves on
        blur.
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="kv-endpoint">Base URL</Label>
        <Input
          id="kv-endpoint"
          type="url"
          placeholder="http://localhost:5000"
          value={endpoint}
          onChange={(e) => {
            setEndpoint(e.target.value);
            setCheckResult(null);
          }}
          onBlur={() => saveField("endpoint")}
        />
        <p className="text-xs text-muted-foreground">
          Base URL of your Kavita instance (e.g.
          {" "}
          <code>http://localhost:5000</code>
          ). Series links open
          {" "}
          <code>/library/&lt;libraryId&gt;/series/&lt;seriesId&gt;</code>
          {" "}
          on this host in a new tab.
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
          <CheckConnectionResult result={checkResult} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="kv-apikey">API key</Label>
        <Input
          id="kv-apikey"
          type="password"
          placeholder={data?.kavitaApiKeySet ? "••••••••" : "No key stored"}
          value={apiKey}
          onChange={(e) => {
            setApiKey(e.target.value);
            setApiKeyDirty(true);
          }}
          onBlur={() => saveField("apiKey")}
        />
        <ApiKeyHint
          apiKeySet={data?.kavitaApiKeySet ?? false}
          encryptionEnabled={data?.encryptionEnabled ?? true}
          unsetHint="Copy your API key from Kavita under User Settings → API Key (older versions: 3rd Party Clients). The server exchanges it for a session token; it is never sent to the browser."
        />
      </div>
    </div>
  );
}

/**
 * Editable form for the YouTube Data API v3 connector: a single API key field, saving on blur with
 * a named toast. The raw key is never returned by the API — only `youtubeApiKeySet: boolean`. The
 * connectors PUT body requires every field, so the other connectors' values are echoed from the
 * loaded settings (their API keys left unchanged).
 */
export function YoutubeForm() {
  const {
    data,
  } = useConnectorsSettings();
  const update = useUpdateConnectorsSettings();

  // apiKey field is always blank on load; user must type to set/replace/clear the stored key.
  const [apiKey, setApiKey] = useState("");
  const [apiKeyDirty, setApiKeyDirty] = useState(false);

  function saveApiKey(): void {
    if (!data || !apiKeyDirty) return;
    update.mutate(
      {
        // Echo the other connectors' fields unchanged (null preserves the stored API keys).
        hostedMetadataEndpoint: data.hostedMetadataEndpoint,
        hostedMetadataProvider: data.hostedMetadataProvider,
        hostedMetadataApiKey: null,
        archiveBoxEndpoint: data.archiveBoxEndpoint,
        kavitaEndpoint: data.kavitaEndpoint,
        kavitaApiKey: null,
        youtubeApiKey: apiKey,
        imageUrlBlacklist: data.imageUrlBlacklist,
      },
      {
        onSuccess: () => {
          notifyFieldSaved("YouTube API key");
          setApiKeyDirty(false);
          setApiKey("");
        },
        onError: (err: Error) => notifyFieldSaveError("YouTube API key", err.message),
      },
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Title, thumbnail, and channel always come from YouTube&apos;s keyless oEmbed endpoint. Adding
        a YouTube Data API v3 key makes duration, publish date, description, and channel avatars come
        from the stable API instead of scraping YouTube&apos;s pages, which is more reliable — YouTube
        increasingly blocks non-browser requests to its pages. Saves on blur.
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="yt-apikey">YouTube API key</Label>
        <Input
          id="yt-apikey"
          type="password"
          placeholder={data?.youtubeApiKeySet ? "••••••••" : "No key stored"}
          value={apiKey}
          onChange={(e) => {
            setApiKey(e.target.value);
            setApiKeyDirty(true);
          }}
          onBlur={saveApiKey}
        />
        <ApiKeyHint
          apiKeySet={data?.youtubeApiKeySet ?? false}
          encryptionEnabled={data?.encryptionEnabled ?? true}
          unsetHint={(
            <>
              Get a free key from the
              {" "}
              <a
                href="https://console.cloud.google.com/apis/library/youtube.googleapis.com"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                Google Cloud Console
              </a>
              : create (or select) a project, enable the &quot;YouTube Data API v3&quot;, then create
              an API key under Credentials. See the
              {" "}
              <a
                href="https://developers.google.com/youtube/v3/getting-started"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                getting-started guide
              </a>
              {" "}
              for details.
            </>
          )}
        />
      </div>
    </div>
  );
}

/**
 * Editor for the image-URL blacklist: patterns that exclude matching candidate images from a URL
 * scan (e.g. ad/CDN hosts). Each add/remove persists the whole list via the connectors settings with
 * a named toast. The connectors PUT body requires every field, so the other connector values are
 * echoed from the loaded settings (API key left unchanged).
 */
export function ImageBlacklistForm() {
  const {
    data,
  } = useConnectorsSettings();
  const update = useUpdateConnectorsSettings();

  const [draft, setDraft] = useState("");

  function persist(patterns: string[]): void {
    if (!data) return;
    update.mutate(
      {
        hostedMetadataEndpoint: data.hostedMetadataEndpoint,
        hostedMetadataProvider: data.hostedMetadataProvider,
        hostedMetadataApiKey: null,
        archiveBoxEndpoint: data.archiveBoxEndpoint,
        kavitaEndpoint: data.kavitaEndpoint,
        kavitaApiKey: null,
        youtubeApiKey: null,
        imageUrlBlacklist: patterns,
      },
      {
        onSuccess: () => notifyFieldSaved("Image blacklist"),
        onError: (err: Error) => notifyFieldSaveError("Image blacklist", err.message),
      },
    );
  }

  function addPattern(): void {
    const value = draft.trim();
    if (!value || !data) return;
    if (data.imageUrlBlacklist.includes(value)) {
      setDraft("");
      return;
    }
    persist([...data.imageUrlBlacklist, value]);
    setDraft("");
  }

  function removePattern(pattern: string): void {
    if (!data) return;
    persist(data.imageUrlBlacklist.filter(p => p !== pattern));
  }

  const patterns = data?.imageUrlBlacklist ?? [];

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        When scanning a URL for images, any candidate whose URL matches one of these patterns is
        dropped before it reaches the Add Bookmark picker. A pattern is a case-insensitive substring
        (e.g.
        {" "}
        <code>doubleclick.net</code>
        ) or a
        {" "}
        <code>*</code>
        {" "}
        glob (e.g.
        {" "}
        <code>*/ads/*</code>
        ).
      </p>
      <div className="flex flex-wrap gap-1.5">
        {patterns.length === 0
          ? <p className="text-xs text-muted-foreground">No patterns yet.</p>
          : patterns.map(pattern => (
            <Badge
              key={pattern}
              variant="secondary"
              className="gap-1"
            >
              <code>{pattern}</code>
              <button
                type="button"
                aria-label={`Remove ${pattern}`}
                className="
                  rounded-sm
                  hover:text-destructive
                "
                onClick={() => removePattern(pattern)}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
      </div>
      <div className="flex items-center gap-2">
        <Input
          aria-label="Image URL blacklist pattern"
          placeholder="e.g. doubleclick.net or */ads/*"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addPattern();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!draft.trim()}
          onClick={addPattern}
        >
          <Plus className="size-4" />
          Add
        </Button>
      </div>
    </div>
  );
}
