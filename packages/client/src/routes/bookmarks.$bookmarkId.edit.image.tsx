import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { BookmarkEditTabWrapper } from "../components/BookmarkEditTabWrapper";
import { BookmarkImageEditForm } from "../components/BookmarkImageEditForm";

export const Route = createFileRoute("/bookmarks/$bookmarkId/edit/image")({
  component: ImageTab,
});

function ImageTab() {
  const {
    t,
  } = useTranslation();
  const {
    bookmarkId,
  } = Route.useParams();
  return (
    <BookmarkEditTabWrapper
      bookmarkId={bookmarkId}
      title={t("Image")}
      description={t("Manage the bookmark's thumbnail image.")}
    >
      {bookmark => <BookmarkImageEditForm bookmark={bookmark} />}
    </BookmarkEditTabWrapper>
  );
}
