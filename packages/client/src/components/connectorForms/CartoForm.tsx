import { useState } from "react";

import { useTranslation } from "react-i18next";

import { ApiKeyHint } from "./connectorFormParts";
import { useConnectorsSettings, useUpdateConnectorsSettings } from "../../hooks/useAppSettings";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Editable form for the CARTO basemap connector: a single API key field, saving on blur with a
 * named toast. This settings payload never returns the raw key (only `cartoApiKeySet`), though —
 * unlike every other connector key — the key itself is served to the browser on
 * `GET /api/connectors`, since Leaflet fetches CARTO's tiles directly. The connectors PUT body
 * requires every field, so the other connectors' values are echoed from the loaded settings (their
 * API keys left unchanged).
 */
export function CartoForm() {
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
          youtubeApiKey: null,
          cartoApiKey: apiKey,
          imageUrlBlacklist: data.imageUrlBlacklist,
          useNoCookieYoutubeEmbeds: data.useNoCookieYoutubeEmbeds,
        },
        successMessage: "CARTO API key",
      },
      {
        onSuccess: () => {
          setApiKeyDirty(false);
          setApiKey("");
        },
      },
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t("The Locations map uses CARTO's basemap tiles for its \"hide administrative borders\" style, and CARTO now requires an API key — without one the map renders with an \"API KEY REQUIRED\" watermark. The bordered default (OpenStreetMap) needs no key. Saves on blur.")}
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="carto-apikey">{t("CARTO API key")}</Label>
        <Input
          id="carto-apikey"
          type="password"
          placeholder={data?.cartoApiKeySet ? "••••••••" : t("No key stored")}
          value={apiKey}
          onChange={(e) => {
            setApiKey(e.target.value);
            setApiKeyDirty(true);
          }}
          onBlur={saveApiKey}
        />
        <ApiKeyHint
          apiKeySet={data?.cartoApiKeySet ?? false}
          encryptionEnabled={data?.encryptionEnabled ?? true}
          unsetHint={(
            <>
              {t("Request a free key (within CARTO's fair-use limit) at")}
              {" "}
              <a
                href="https://carto.com/basemaps/apikey/"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                carto.com/basemaps/apikey
              </a>
              {t(". Unlike the other keys here, this one is sent to the browser — the map tiles are fetched by your browser, so the key has to be in the tile URL.")}
            </>
          )}
        />
      </div>
    </div>
  );
}
