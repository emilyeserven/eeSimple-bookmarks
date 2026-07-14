import { useState } from "react";

import { Plus, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useConnectorsSettings, useUpdateConnectorsSettings } from "../../hooks/useAppSettings";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Editor for the image-URL blacklist: patterns that exclude matching candidate images from a URL
 * scan (e.g. ad/CDN hosts). Each add/remove persists the whole list via the connectors settings with
 * a named toast. The connectors PUT body requires every field, so the other connector values are
 * echoed from the loaded settings (API key left unchanged).
 */
export function ImageBlacklistForm() {
  const {
    t,
  } = useTranslation();
  const {
    data,
  } = useConnectorsSettings();
  const update = useUpdateConnectorsSettings();

  const [draft, setDraft] = useState("");

  function persist(patterns: string[]): void {
    if (!data) return;
    update.mutate({
      input: {
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
        imageUrlBlacklist: patterns,
        useNoCookieYoutubeEmbeds: data.useNoCookieYoutubeEmbeds,
      },
      successMessage: "Image blacklist",
    });
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
        {t("When scanning a URL for images, any candidate whose URL matches one of these patterns is dropped before it reaches the Add Bookmark picker. A pattern is a case-insensitive substring (e.g.")}
        {" "}
        <code>doubleclick.net</code>
        {t(") or a")}
        {" "}
        <code>*</code>
        {" "}
        {t("glob (e.g.")}
        {" "}
        <code>*/ads/*</code>
        ).
      </p>
      <div className="flex flex-wrap gap-1.5">
        {patterns.length === 0
          ? <p className="text-xs text-muted-foreground">{t("No patterns yet.")}</p>
          : patterns.map(pattern => (
            <Badge
              key={pattern}
              variant="secondary"
              className="gap-1"
            >
              <code>{pattern}</code>
              <button
                type="button"
                aria-label={t("Remove {{pattern}}", {
                  pattern,
                })}
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
          aria-label={t("Image URL blacklist pattern")}
          placeholder={t("e.g. doubleclick.net or */ads/*")}
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
          {t("Add")}
        </Button>
      </div>
    </div>
  );
}
