import { createFileRoute } from "@tanstack/react-router";

import { BookmarkDetailsPropertiesForm } from "../components/BookmarkDetailsPropertiesForm";
import { BookmarkEditTabWrapper } from "../components/BookmarkEditTabWrapper";
import { BookmarkGeneralForm } from "../components/BookmarkGeneralForm";

export const Route = createFileRoute("/bookmarks/$bookmarkId/edit/general")({
  component: GeneralTab,
});

function GeneralTab() {
  const {
    bookmarkId,
  } = Route.useParams();
  return (
    <BookmarkEditTabWrapper
      bookmarkId={bookmarkId}
      title="General"
      description="URL, name, description, category, and tags."
    >
      {bookmark => (
        <>
          <BookmarkGeneralForm bookmark={bookmark} />
          <BookmarkDetailsPropertiesForm bookmark={bookmark} />
        </>
      )}
    </BookmarkEditTabWrapper>
  );
}
