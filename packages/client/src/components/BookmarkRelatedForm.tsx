import type { Bookmark } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { BookmarkMediaIdentitySection } from "./BookmarkMediaIdentitySection";
import { BookmarkRelationshipsEditor } from "./BookmarkRelationshipsEditor";
import { CollapsibleFormSection } from "./CollapsibleFormSection";

import { Separator } from "@/components/ui/separator";

interface BookmarkRelatedFormProps {
  bookmark: Bookmark;
}

/**
 * The bookmark "Related" edit field: the Media identity section and the bookmark-relationships editor.
 * The related-entity taxonomy fields (YouTube channel, locations, people, groups) and Genres & Moods
 * are now individually-placeable layout fields on the General tab (#1163 field extraction), no longer
 * bundled here. Both sections auto-save (the relationships editor debounce-persists the whole set).
 */
export function BookmarkRelatedForm({
  bookmark,
}: BookmarkRelatedFormProps) {
  const {
    t,
  } = useTranslation();

  return (
    <div className="space-y-6">
      <CollapsibleFormSection
        title={t("Media identity")}
        description={t("Link this bookmark to a Kavita series or Plex item, and record media identity like ISBN, year, Wikidata/Wikipedia, and podcast feed details.")}
        defaultOpen={
          bookmark.plexRatingKey !== null
          || bookmark.kavitaSeriesId !== null
          || bookmark.isbn !== null
        }
        preview={t("ISBN, year, Kavita / Plex link, podcast feed…")}
      >
        <BookmarkMediaIdentitySection bookmark={bookmark} />
      </CollapsibleFormSection>

      <Separator />

      <BookmarkRelationshipsEditor
        bookmarkId={bookmark.id}
        initialRelationships={bookmark.relationships}
      />
    </div>
  );
}
