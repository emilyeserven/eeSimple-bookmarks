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
 * Editable form for the hosted metadata connector: endpoint URL, provider label, and API key.
 * Each field saves on blur with a named toast. The raw API key is never returned by the API —
 * only `hostedMetadataApiKeySet: boolean`.
 */
export function HostedMetadataForm() {
  const {
    t,
  } = useTranslation();
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
        input: {
          hostedMetadataEndpoint: endpoint,
          hostedMetadataProvider: provider,
          // null = server preserves the existing key; only send the value when the user typed.
          hostedMetadataApiKey: field === "apiKey" ? apiKey : null,
          // The connectors PUT body requires every field; preserve the other connectors' values.
          archiveBoxEndpoint: data.archiveBoxEndpoint,
          kavitaEndpoint: data.kavitaEndpoint,
          kavitaSidebarUrl: data.kavitaSidebarUrl,
          kavitaApiKey: null,
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
        {t("Point this at a self-hosted")}
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
        {t("instance (")}
        <code>ghcr.io/browserless/chromium</code>
        {t("). Browserless renders pages with a real browser so JS-heavy or bot-protected pages return full metadata. Each field saves on blur.")}
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="hm-endpoint">{t("Endpoint URL")}</Label>
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
          {t("Base URL of your Browserless instance (e.g.")}
          {" "}
          <code>http://localhost:3000</code>
          {t("). The app appends")}
          {" "}
          <code>/chromium/content</code>
          {" "}
          {t("for metadata and")}
          {" "}
          <code>/chromium/screenshot</code>
          {" "}
          {t("for page screenshots.")}
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
        <Label htmlFor="hm-provider">{t("Provider label")}</Label>
        <Input
          id="hm-provider"
          type="text"
          placeholder="browserless"
          value={provider}
          onChange={e => setProvider(e.target.value)}
          onBlur={() => saveField("provider")}
        />
        <p className="text-xs text-muted-foreground">
          {t("Display name shown next to the Active badge above (e.g.")}
          {" "}
          <code>browserless</code>
          {t("). Does not affect behavior.")}
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="hm-apikey">{t("API token")}</Label>
        <Input
          id="hm-apikey"
          type="password"
          placeholder={data?.hostedMetadataApiKeySet ? "••••••••" : t("No token stored")}
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
