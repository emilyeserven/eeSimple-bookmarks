import { useState } from "react";

import { useTranslation } from "react-i18next";

import { ApiKeyHint } from "./connectorFormParts";
import { useConnectorsSettings, useUpdateConnectorsSettings } from "../../hooks/useAppSettings";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Editable form for the YouTube Data API v3 connector: a single API key field, saving on blur with
 * a named toast. The raw key is never returned by the API — only `youtubeApiKeySet: boolean`. The
 * connectors PUT body requires every field, so the other connectors' values are echoed from the
 * loaded settings (their API keys left unchanged).
 */
export function YoutubeForm() {
  const {
    t,
  } = useTranslation();
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
        input: {
          // Echo the other connectors' fields unchanged (null preserves the stored API keys).
          hostedMetadataEndpoint: data.hostedMetadataEndpoint,
          hostedMetadataProvider: data.hostedMetadataProvider,
          hostedMetadataApiKey: null,
          archiveBoxEndpoint: data.archiveBoxEndpoint,
          kavitaEndpoint: data.kavitaEndpoint,
          kavitaSidebarUrl: data.kavitaSidebarUrl,
          kavitaApiKey: null,
          plexEndpoint: data.plexEndpoint,
          plexToken: null,
          youtubeApiKey: apiKey,
          imageUrlBlacklist: data.imageUrlBlacklist,
          useNoCookieYoutubeEmbeds: data.useNoCookieYoutubeEmbeds,
        },
        successMessage: "YouTube API key",
      },
      {
        onSuccess: () => {
          setApiKeyDirty(false);
          setApiKey("");
        },
      },
    );
  }

  function saveNoCookieEmbeds(enabled: boolean): void {
    if (!data) return;
    update.mutate({
      input: {
        // Echo the other connectors' fields unchanged (null preserves the stored API keys).
        hostedMetadataEndpoint: data.hostedMetadataEndpoint,
        hostedMetadataProvider: data.hostedMetadataProvider,
        hostedMetadataApiKey: null,
        archiveBoxEndpoint: data.archiveBoxEndpoint,
        kavitaEndpoint: data.kavitaEndpoint,
        kavitaSidebarUrl: data.kavitaSidebarUrl,
        kavitaApiKey: null,
        plexEndpoint: data.plexEndpoint,
        plexToken: null,
        youtubeApiKey: null,
        imageUrlBlacklist: data.imageUrlBlacklist,
        useNoCookieYoutubeEmbeds: enabled,
      },
      successMessage: "YouTube privacy embeds",
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t("Title, thumbnail, and channel always come from YouTube's keyless oEmbed endpoint. Adding a YouTube Data API v3 key makes duration, publish date, description, and channel avatars come from the stable API instead of scraping YouTube's pages, which is more reliable — YouTube increasingly blocks non-browser requests to its pages. Saves on blur.")}
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="yt-apikey">{t("YouTube API key")}</Label>
        <Input
          id="yt-apikey"
          type="password"
          placeholder={data?.youtubeApiKeySet ? "••••••••" : t("No key stored")}
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
              {t("Get a free key from the")}
              {" "}
              <a
                href="https://console.cloud.google.com/apis/library/youtube.googleapis.com"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                Google Cloud Console
              </a>
              {t(": create (or select) a project, enable the \"YouTube Data API v3\", then create an API key under Credentials. See the")}
              {" "}
              <a
                href="https://developers.google.com/youtube/v3/getting-started"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                {t("getting-started guide")}
              </a>
              {" "}
              {t("for details.")}
            </>
          )}
        />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="yt-nocookie-embeds"
          checked={data?.useNoCookieYoutubeEmbeds ?? true}
          onCheckedChange={(checked) => {
            saveNoCookieEmbeds(checked === true);
          }}
        />
        <Label htmlFor="yt-nocookie-embeds">
          {t("Use privacy-enhanced YouTube embeds (youtube-nocookie.com)")}
        </Label>
      </div>
    </div>
  );
}
