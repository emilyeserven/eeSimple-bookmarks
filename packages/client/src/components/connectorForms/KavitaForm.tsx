import type { CheckUrlResult } from "@eesimple/types";

import { useEffect, useState } from "react";

import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ApiKeyHint, CheckConnectionResult } from "./connectorFormParts";
import { useConnectorsSettings, useUpdateConnectorsSettings } from "../../hooks/useAppSettings";
import { metadataApi } from "../../lib/api/metadata";
import { notifyFieldSaveError } from "../../lib/autoSave";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Editable form for the Kavita connector: base URL and API key, each saving on blur with a named
 * toast. The raw API key is never returned by the API — only `kavitaApiKeySet: boolean`. The
 * connectors PUT body requires every field, so the other connectors' values are echoed from the
 * loaded settings (hosted-metadata API key left unchanged).
 */
export function KavitaForm() {
  const {
    t,
  } = useTranslation();
  const {
    data,
  } = useConnectorsSettings();
  const update = useUpdateConnectorsSettings();

  const [endpoint, setEndpoint] = useState(data?.kavitaEndpoint ?? "");
  // Optional browser-facing override for the sidebar link-out; blank = fall back to the base URL.
  const [sidebarUrl, setSidebarUrl] = useState(data?.kavitaSidebarUrl ?? "");
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
      setSidebarUrl(data.kavitaSidebarUrl);
      setCheckResult(null);
    }
  }, [data]);

  function saveField(field: "endpoint" | "sidebarUrl" | "apiKey"): void {
    if (!data) return;
    // API key field: skip when the user hasn't typed anything (would silently no-op server-side).
    if (field === "apiKey" && !apiKeyDirty) return;
    const label = field === "endpoint"
      ? "Kavita URL"
      : field === "sidebarUrl"
        ? "Kavita sidebar link"
        : "Kavita API key";
    update.mutate(
      {
        input: {
          // Echo the other connectors' fields unchanged (null preserves the stored API keys).
          hostedMetadataEndpoint: data.hostedMetadataEndpoint,
          hostedMetadataProvider: data.hostedMetadataProvider,
          hostedMetadataApiKey: null,
          archiveBoxEndpoint: data.archiveBoxEndpoint,
          // Both URL fields are plain (non-secret) text — always send their live values.
          kavitaEndpoint: endpoint,
          kavitaSidebarUrl: sidebarUrl,
          kavitaApiKey: field === "apiKey" ? apiKey : null,
          plexEndpoint: data.plexEndpoint,
          plexToken: null,
          youtubeApiKey: null,
          imageUrlBlacklist: data.imageUrlBlacklist,
          useNoCookieYoutubeEmbeds: data.useNoCookieYoutubeEmbeds,
        },
        successMessage: label,
      },
      {
        onSuccess: () => {
          if (field === "apiKey") {
            setApiKeyDirty(false);
            setApiKey("");
          }
        },
      },
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t("Point this at your self-hosted")}
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
        {t("server. When set, bookmarks can be linked to a Kavita series, gain a \"View on Kavita\" link-out, and can import the series cover as their image. The API key stays on the server — searches and cover fetches are proxied so it never reaches the browser. Each field saves on blur.")}
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="kv-endpoint">{t("Base URL")}</Label>
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
          {t("Base URL of your Kavita instance (e.g.")}
          {" "}
          <code>http://localhost:5000</code>
          {t("). Series links open")}
          {" "}
          <code>/library/&lt;libraryId&gt;/series/&lt;seriesId&gt;</code>
          {" "}
          {t("on this host in a new tab.")}
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
                  {t("Checking…")}
                </>
              )
              : t("Check connection")}
          </Button>
          <CheckConnectionResult result={checkResult} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="kv-sidebar-url">{t("Sidebar link URL")}</Label>
        <Input
          id="kv-sidebar-url"
          type="url"
          placeholder={endpoint || "http://localhost:5000"}
          value={sidebarUrl}
          onChange={e => setSidebarUrl(e.target.value)}
          onBlur={() => saveField("sidebarUrl")}
        />
        <p className="text-xs text-muted-foreground">
          {t("Optional. The address the sidebar's \"Kavita\" link opens in your browser. Leave blank to use the Base URL. Set this when your browser reaches Kavita at a different address than this server does — e.g. the Base URL is a LAN/tailnet IP the server can reach, but you browse to a hostname like")}
          {" "}
          <code>http://kavita.local:5000</code>
          {t(". This only changes the link-out; the server still uses the Base URL above.")}
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="kv-apikey">{t("API key")}</Label>
        <Input
          id="kv-apikey"
          type="password"
          placeholder={data?.kavitaApiKeySet ? "••••••••" : t("No key stored")}
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
          unsetHint={t("Copy your API key from Kavita under User Settings → API Key (older versions: 3rd Party Clients). The server exchanges it for a session token; it is never sent to the browser.")}
        />
      </div>
    </div>
  );
}
