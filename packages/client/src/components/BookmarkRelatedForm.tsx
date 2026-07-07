import type { Bookmark } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { BookmarkMediaIdentitySection } from "./BookmarkMediaIdentitySection";
import { BookmarkRelatedEntitiesSection } from "./BookmarkRelatedEntitiesSection";
import { BookmarkRelationshipsEditor } from "./BookmarkRelationshipsEditor";
import { CollapsibleFormSection } from "./CollapsibleFormSection";
import { GenreMoodAssignmentSection } from "./GenreMoodAssignmentSection";
import { useBookmarkGeneralForm } from "./useBookmarkGeneralForm";

import { Separator } from "@/components/ui/separator";

interface BookmarkRelatedFormProps {
  bookmark: Bookmark;
}

/**
 * The bookmark "Related" edit tab: the related-entity fields moved off General (YouTube channel,
 * locations, people, groups + genres & moods), the Media identity section, and the resurfaced
 * bookmark-relationships editor. The entity fields auto-save per field (reusing the shared
 * {@link useBookmarkGeneralForm} controller); the relationships editor is submit-based (Save/Cancel).
 */
export function BookmarkRelatedForm({
  bookmark,
}: BookmarkRelatedFormProps) {
  const {
    t,
  } = useTranslation();
  const navigate = useNavigate();
  const ctrl = useBookmarkGeneralForm(bookmark);

  const goToView = () => void navigate({
    to: "/bookmarks/$bookmarkId",
    params: {
      bookmarkId: bookmark.id,
    },
  });

  return (
    <div className="space-y-6">
      <div
        className="
          grid gap-4
          md:grid-cols-2
        "
      >
        <BookmarkRelatedEntitiesSection ctrl={ctrl} />

        <GenreMoodAssignmentSection
          ownerType="bookmark"
          ownerId={bookmark.id}
          stacked
        />
      </div>

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
        onDone={goToView}
      />
    </div>
  );
}
