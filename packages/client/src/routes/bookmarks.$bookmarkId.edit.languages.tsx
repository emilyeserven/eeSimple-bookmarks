import { createFileRoute } from "@tanstack/react-router";

import { BookmarkEditTabWrapper } from "../components/BookmarkEditTabWrapper";
import { BookmarkPrimaryLanguageField } from "../components/BookmarkPrimaryLanguageField";
import { LanguageUsagesTabEditor } from "../components/languageUsages/LanguageUsagesTab";
import { Separator } from "../components/ui/separator";

export const Route = createFileRoute("/bookmarks/$bookmarkId/edit/languages")({
  component: LanguagesTab,
});

function LanguagesTab() {
  const {
    bookmarkId,
  } = Route.useParams();
  return (
    <BookmarkEditTabWrapper
      bookmarkId={bookmarkId}
      title="Languages"
      description="Languages this bookmark's content is available in, each with a usage level (dub, subtitles, …)."
    >
      {bookmark => (
        <div className="space-y-4">
          <BookmarkPrimaryLanguageField bookmark={bookmark} />
          <Separator />
          <LanguageUsagesTabEditor
            ownerType="bookmark"
            ownerId={bookmark.id}
            kind="availability"
          />
        </div>
      )}
    </BookmarkEditTabWrapper>
  );
}
