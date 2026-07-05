import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { BookmarkEditTabWrapper } from "../components/BookmarkEditTabWrapper";
import { LanguageUsagesTabEditor } from "../components/languageUsages/LanguageUsagesTab";

export const Route = createFileRoute("/bookmarks/$bookmarkId/edit/languages")({
  component: LanguagesTab,
});

function LanguagesTab() {
  const {
    t,
  } = useTranslation();
  const {
    bookmarkId,
  } = Route.useParams();
  return (
    <BookmarkEditTabWrapper
      bookmarkId={bookmarkId}
      title={t("Languages")}
      description={t("Languages this bookmark's content is available in, each with a usage level (dub, subtitles, primary language, …).")}
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
