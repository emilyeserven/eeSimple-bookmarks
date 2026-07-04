import { useTranslation } from "react-i18next";

import { SourcePill } from "./SourcePill";
import { useWebsites } from "../hooks/useWebsites";
import { useYouTubeChannels } from "../hooks/useYouTubeChannels";

import { RowCard } from "@/components/ui/card";

interface EntityAutofillSourcesProps {
  /**
   * The entity being viewed: a category (matched by `category.id`), a media type (matched by the
   * source's default `mediaTypeId`), or a tag (matched by the source's default tag ids).
   */
  match:
    | { kind: "category";
      categoryId: string; }
      | { kind: "media-type";
        mediaTypeId: string; }
        | { kind: "tag";
          tagId: string; };
}

/** Whether a source's defaults (category / media type / tags) point at the matched entity. */
function sourceMatches(
  source: { category?: { id: string } | null;
    mediaTypeId?: string | null;
    tagIds?: string[]; },
  match: EntityAutofillSourcesProps["match"],
): boolean {
  switch (match.kind) {
    case "category":
      return source.category?.id === match.categoryId;
    case "media-type":
      return source.mediaTypeId === match.mediaTypeId;
    case "tag":
      return (source.tagIds ?? []).includes(match.tagId);
  }
}

/** Per-source-kind wording for what the matched entity is auto-applied as. */
function noteFor(
  t: (key: string, options?: Record<string, unknown>) => string,
  sourceLabel: string,
  matchKind: EntityAutofillSourcesProps["match"]["kind"],
): string {
  switch (matchKind) {
    case "category":
      return t("Bookmarks saved from these {{source}} are automatically added to this category.", {
        source: sourceLabel,
      });
    case "media-type":
      return t("Bookmarks saved from these {{source}} are automatically marked as this media type.", {
        source: sourceLabel,
      });
    case "tag":
      return t("Bookmarks saved from these {{source}} are automatically tagged with this tag.", {
        source: sourceLabel,
      });
  }
}

/**
 * Surfaces the websites and YouTube channels whose default category / media type / tags point at the
 * currently-viewed entity — i.e. the sources that will autofill it onto new bookmarks. Renders a
 * "Websites" card and/or a "YouTube Channels" card of clickable pills, or nothing when no source
 * feeds this entity.
 */
export function EntityAutofillSources({
  match,
}: EntityAutofillSourcesProps) {
  const {
    t,
  } = useTranslation();
  const {
    data: websites,
  } = useWebsites();
  const {
    data: channels,
  } = useYouTubeChannels();

  const matchedWebsites = (websites ?? []).filter(site => sourceMatches(site, match));
  const matchedChannels = (channels ?? []).filter(channel => sourceMatches(channel, match));

  if (matchedWebsites.length === 0 && matchedChannels.length === 0) return null;

  const websiteNote = noteFor(t, t("sites"), match.kind);
  const channelNote = noteFor(t, t("channels"), match.kind);

  return (
    <div className="space-y-3">
      {matchedWebsites.length > 0
        ? (
          <RowCard className="space-y-2 p-4">
            <h3 className="text-sm font-semibold">{t("Websites")}</h3>
            <p className="text-xs text-muted-foreground">{websiteNote}</p>
            <div className="flex flex-wrap gap-2">
              {matchedWebsites.map(site => (
                <SourcePill
                  key={site.id}
                  type="website"
                  data={site}
                />
              ))}
            </div>
          </RowCard>
        )
        : null}
      {matchedChannels.length > 0
        ? (
          <RowCard className="space-y-2 p-4">
            <h3 className="text-sm font-semibold">{t("YouTube Channels")}</h3>
            <p className="text-xs text-muted-foreground">{channelNote}</p>
            <div className="flex flex-wrap gap-2">
              {matchedChannels.map(channel => (
                <SourcePill
                  key={channel.id}
                  type="youtube-channel"
                  data={channel}
                />
              ))}
            </div>
          </RowCard>
        )
        : null}
    </div>
  );
}
