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
 * Editable form for the Plex connector: base URL and `X-Plex-Token`, each saving on blur with a
 * named toast. The raw token is never returned by the API — only `plexTokenSet: boolean`. The
 * connectors PUT body requires every field, so the other connectors' values are echoed from the
 * loaded settings (their keys left unchanged).
 */
export function PlexForm() {
  const {
    t,
  } = useTranslation();
  const {
    data,
  } = useConnectorsSettings();
  const update = useUpdateConnectorsSettings();

  const [endpoint, setEndpoint] = useState(data?.plexEndpoint ?? "");
  // token field is always blank on load; user must type to set/replace/clear the stored token.
  const [token, setToken] = useState("");
  const [tokenDirty, setTokenDirty] = useState(false);
  const [checkResult, setCheckResult] = useState<CheckUrlResult | null>(null);

  const checkConnection = useMutation({
    // Plex's /identity endpoint responds without a token, so this probes reachability only — the
    // token is validated by the first item search.
    mutationFn: () => metadataApi.checkUrl({
      url: `${endpoint.replace(/\/$/, "")}/identity`,
    }),
    onSuccess: result => setCheckResult(result),
    onError: (err: Error) => notifyFieldSaveError("Connection check", err.message),
  });

  useEffect(() => {
    if (data) {
      setEndpoint(data.plexEndpoint);
      setCheckResult(null);
    }
  }, [data]);

  function saveField(field: "endpoint" | "token"): void {
    if (!data) return;
    // token field: skip when the user hasn't typed anything (would silently no-op server-side).
    if (field === "token" && !tokenDirty) return;
    const label = field === "endpoint" ? "Plex URL" : "Plex token";
    update.mutate(
      {
        input: {
          // Echo the other connectors' fields unchanged (null preserves the stored keys).
          hostedMetadataEndpoint: data.hostedMetadataEndpoint,
          hostedMetadataProvider: data.hostedMetadataProvider,
          hostedMetadataApiKey: null,
          archiveBoxEndpoint: data.archiveBoxEndpoint,
          kavitaEndpoint: data.kavitaEndpoint,
          kavitaSidebarUrl: data.kavitaSidebarUrl,
          kavitaApiKey: null,
          plexEndpoint: endpoint,
          plexToken: field === "token" ? token : null,
          youtubeApiKey: null,
          imageUrlBlacklist: data.imageUrlBlacklist,
          useNoCookieYoutubeEmbeds: data.useNoCookieYoutubeEmbeds,
        },
        successMessage: label,
      },
      {
        onSuccess: () => {
          if (field === "token") {
            setTokenDirty(false);
            setToken("");
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
          href="https://www.plex.tv/"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          Plex
        </a>
        {" "}
        {t("media server. When set, bookmarks can be linked to a movie, show, or track, gain a \"View on Plex\" link-out, and can import the item's poster as their image. The token stays on the server — searches and poster fetches are proxied so it never reaches the browser. Each field saves on blur.")}
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="plex-endpoint">{t("Base URL")}</Label>
        <Input
          id="plex-endpoint"
          type="url"
          placeholder="http://localhost:32400"
          value={endpoint}
          onChange={(e) => {
            setEndpoint(e.target.value);
            setCheckResult(null);
          }}
          onBlur={() => saveField("endpoint")}
        />
        <p className="text-xs text-muted-foreground">
          {t("Base URL of your Plex server (e.g.")}
          {" "}
          <code>http://localhost:32400</code>
          {t("). Item links open the matching page in Plex's web UI on this host in a new tab.")}
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
        <Label htmlFor="plex-token">{t("Plex token")}</Label>
        <Input
          id="plex-token"
          type="password"
          placeholder={data?.plexTokenSet ? "••••••••" : t("No token stored")}
          value={token}
          onChange={(e) => {
            setToken(e.target.value);
            setTokenDirty(true);
          }}
          onBlur={() => saveField("token")}
        />
        <ApiKeyHint
          apiKeySet={data?.plexTokenSet ?? false}
          encryptionEnabled={data?.encryptionEnabled ?? true}
          unsetHint={(
            <>
              {t("Your")}
              {" "}
              <code>X-Plex-Token</code>
              {t(". See")}
              {" "}
              <a
                href="https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                {t("Finding an authentication token")}
              </a>
              {t(". Sent as the")}
              {" "}
              <code>X-Plex-Token</code>
              {" "}
              {t("header on server-side requests; it is never sent to the browser.")}
            </>
          )}
        />
      </div>
    </div>
  );
}
