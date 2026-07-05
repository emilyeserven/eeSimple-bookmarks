import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { BookmarkEditTabWrapper } from "../components/BookmarkEditTabWrapper";
import { BookmarkVideoEditForm } from "../components/BookmarkVideoEditForm";

export const Route = createFileRoute("/bookmarks/$bookmarkId/edit/video")({
  component: VideoTab,
});

function VideoTab() {
  const {
    t,
  } = useTranslation();
  const {
    bookmarkId,
  } = Route.useParams();
  return (
    <BookmarkEditTabWrapper
      bookmarkId={bookmarkId}
      title={t("Video")}
      description={t("Capture and manage the bookmark's archived reel video.")}
    >
      {bookmark => <BookmarkVideoEditForm bookmark={bookmark} />}
    </BookmarkEditTabWrapper>
  );
}
