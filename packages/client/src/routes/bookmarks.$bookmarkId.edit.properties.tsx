import { createFileRoute } from "@tanstack/react-router";

import { BookmarkEditTabWrapper } from "../components/BookmarkEditTabWrapper";
import { BookmarkPropertiesForm } from "../components/BookmarkPropertiesForm";

export const Route = createFileRoute("/bookmarks/$bookmarkId/edit/properties")({
  component: PropertiesTab,
});

function PropertiesTab() {
  const {
    bookmarkId,
  } = Route.useParams();
  return (
    <BookmarkEditTabWrapper
      bookmarkId={bookmarkId}
      title="Properties"
      description="Custom property values for this bookmark."
    >
      {bookmark => <BookmarkPropertiesForm bookmark={bookmark} />}
    </BookmarkEditTabWrapper>
  );
}
