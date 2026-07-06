import type { BookmarkIdentityScalarKey } from "./useBookmarkMediaIdentitySection";
import type { Bookmark } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { BookmarkKavitaField } from "./BookmarkKavitaField";
import { BookmarkPlexField } from "./BookmarkPlexField";
import {
  BOOKMARK_IDENTITY_SCALAR_KEYS,
  useBookmarkMediaIdentitySection,
} from "./useBookmarkMediaIdentitySection";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BookmarkMediaIdentitySectionProps {
  bookmark: Bookmark;
}

/**
 * Editable media-source identity for a bookmark (see #1070): the Kavita-series and Plex-item search
 * pickers plus the scalar identity/metadata columns (`isbn`, `year`, the Wikidata/Wikipedia links,
 * and the podcast feed/iTunes/Spotify/PocketCasts set). Lets a Book/Movie/Podcast-style bookmark
 * carry its own identity without a backing media-taxonomy row. Each field auto-saves on blur/change
 * (edit-tab auto-save standard). The Kavita/Plex pickers self-gate on their connector being
 * configured, so this section may render only the scalar inputs when neither is set up.
 */
export function BookmarkMediaIdentitySection({
  bookmark,
}: BookmarkMediaIdentitySectionProps) {
  const {
    t,
  } = useTranslation();
  const {
    draft, setField, saveScalar, saveKavita, savePlex,
  } = useBookmarkMediaIdentitySection(bookmark);

  // Literal `t()` calls (not `t(variable)`) so the phrases are extracted for the locale catalog.
  const labels: Record<BookmarkIdentityScalarKey, string> = {
    isbn: t("ISBN / ASIN"),
    year: t("Year"),
    wikidataId: t("Wikidata ID"),
    wikipediaLinkEn: t("Wikipedia (English)"),
    wikipediaLinkLocal: t("Wikipedia (local language)"),
    feedUrl: t("Podcast feed URL"),
    itunesId: t("Apple Podcasts ID"),
    itunesUrl: t("Apple Podcasts URL"),
    spotifyUrl: t("Spotify URL"),
    pocketCastsUuid: t("Pocket Casts UUID"),
    pocketCastsUrl: t("Pocket Casts URL"),
    defaultLinkProvider: t("Default link provider"),
  };
  const numberKeys = new Set<BookmarkIdentityScalarKey>(["year", "itunesId"]);

  return (
    <div className="space-y-4">
      <BookmarkKavitaField
        bookmark={bookmark}
        onSelect={saveKavita}
      />
      <BookmarkPlexField
        bookmark={bookmark}
        onSelect={savePlex}
      />
      <div
        className="
          grid gap-4
          md:grid-cols-2
        "
      >
        {BOOKMARK_IDENTITY_SCALAR_KEYS.map(key => (
          <div
            key={key}
            className="space-y-1.5"
          >
            <Label htmlFor={`bookmark-identity-${key}`}>{labels[key]}</Label>
            <Input
              id={`bookmark-identity-${key}`}
              type={numberKeys.has(key) ? "number" : "text"}
              value={draft[key]}
              onChange={event => setField(key, event.target.value)}
              onBlur={() => saveScalar(key, labels[key])}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
