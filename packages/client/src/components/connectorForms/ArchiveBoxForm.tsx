import type { CheckUrlResult } from "@eesimple/types";

import { useEffect, useState } from "react";

import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { CheckConnectionResult } from "./connectorFormParts";
import { useConnectorsSettings, useUpdateConnectorsSettings } from "../../hooks/useAppSettings";
import { metadataApi } from "../../lib/api/metadata";
import { notifyFieldSaveError } from "../../lib/autoSave";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Editable form for the ArchiveBox connector: a single base-URL field that saves on blur with a
 * named toast. Link-out only — no token is stored or sent. The connectors PUT body requires every
 * field, so the hosted-metadata fields are echoed from the loaded settings (API key left unchanged).
 */
export function ArchiveBoxForm() {
  const {
    t,
  } = useTranslation();
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
    update.mutate({
      input: {
        // Echo the other connectors' fields unchanged (null preserves the stored API keys).
        hostedMetadataEndpoint: data.hostedMetadataEndpoint,
        hostedMetadataProvider: data.hostedMetadataProvider,
        hostedMetadataApiKey: null,
        archiveBoxEndpoint: endpoint,
        kavitaEndpoint: data.kavitaEndpoint,
        kavitaSidebarUrl: data.kavitaSidebarUrl,
        kavitaApiKey: null,
        plexEndpoint: data.plexEndpoint,
        plexToken: null,
        youtubeApiKey: null,
        imageUrlBlacklist: data.imageUrlBlacklist,
        useNoCookieYoutubeEmbeds: data.useNoCookieYoutubeEmbeds,
      },
      successMessage: "ArchiveBox URL",
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t("Point this at your self-hosted")}
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
        {t("instance. When set, bookmarks gain links to view the archived snapshot of their page and to archive it on demand. Link-out only — no token is sent, and the links open against your own ArchiveBox in a new tab. Saves on blur.")}
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="ab-endpoint">{t("Base URL")}</Label>
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
          {t("Base URL of your ArchiveBox instance (e.g.")}
          {" "}
          <code>http://localhost:8000</code>
          {t("). The app appends")}
          {" "}
          <code>/?q=&lt;url&gt;</code>
          {" "}
          {t("to view a snapshot and")}
          {" "}
          <code>/add?url=&lt;url&gt;</code>
          {" "}
          {t("to archive a page.")}
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
    </div>
  );
}
