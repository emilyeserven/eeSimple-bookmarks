import { createFileRoute } from "@tanstack/react-router";

import { BookmarkEditTabWrapper } from "../components/BookmarkEditTabWrapper";
import { LanguageUsagesTabEditor } from "../components/languageUsages/LanguageUsagesTab";

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
        <LanguageUsagesTabEditor
          ownerType="bookmark"
          ownerId={bookmark.id}
          kind="availability"
        />
      )}
    </BookmarkEditTabWrapper>
  );
}
