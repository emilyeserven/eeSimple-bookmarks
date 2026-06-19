import { createFileRoute } from "@tanstack/react-router";

import { BookmarkEditTabWrapper } from "../components/BookmarkEditTabWrapper";
import { BookmarkImageEditForm } from "../components/BookmarkImageEditForm";

export const Route = createFileRoute("/bookmarks/$bookmarkId/edit/image")({
  component: ImageTab,
});

function ImageTab() {
  const {
    bookmarkId,
  } = Route.useParams();
  return (
    <BookmarkEditTabWrapper
      bookmarkId={bookmarkId}
      title="Image"
      description="Manage the bookmark's thumbnail image."
    >
      {bookmark => <BookmarkImageEditForm bookmark={bookmark} />}
    </BookmarkEditTabWrapper>
  );
}
