import { createFileRoute } from "@tanstack/react-router";

import { BookmarkEditTabWrapper } from "../components/BookmarkEditTabWrapper";
import { BookmarkVideoEditForm } from "../components/BookmarkVideoEditForm";

export const Route = createFileRoute("/bookmarks/$bookmarkId/edit/video")({
  component: VideoTab,
});

function VideoTab() {
  const {
    bookmarkId,
  } = Route.useParams();
  return (
    <BookmarkEditTabWrapper
      bookmarkId={bookmarkId}
      title="Video"
      description="Capture and manage the bookmark's archived reel video."
    >
      {bookmark => <BookmarkVideoEditForm bookmark={bookmark} />}
    </BookmarkEditTabWrapper>
  );
}
