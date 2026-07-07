import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { BookmarkEditTabWrapper } from "../components/BookmarkEditTabWrapper";
import { BookmarkRelatedForm } from "../components/BookmarkRelatedForm";

export const Route = createFileRoute("/bookmarks/$bookmarkId/edit/related")({
  component: RelatedTab,
});

function RelatedTab() {
  const {
    t,
  } = useTranslation();
  const {
    bookmarkId,
  } = Route.useParams();

  return (
    <BookmarkEditTabWrapper
      bookmarkId={bookmarkId}
      title={t("Related")}
      description={t("Relationships, creators, locations, genres, and media identity.")}
    >
      {bookmark => <BookmarkRelatedForm bookmark={bookmark} />}
    </BookmarkEditTabWrapper>
  );
}
