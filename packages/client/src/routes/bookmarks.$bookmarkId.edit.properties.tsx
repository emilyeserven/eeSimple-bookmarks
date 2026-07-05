import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { BookmarkEditTabWrapper } from "../components/BookmarkEditTabWrapper";
import { BookmarkPropertiesForm } from "../components/BookmarkPropertiesForm";

export const Route = createFileRoute("/bookmarks/$bookmarkId/edit/properties")({
  component: PropertiesTab,
});

function PropertiesTab() {
  const {
    t,
  } = useTranslation();
  const {
    bookmarkId,
  } = Route.useParams();
  return (
    <BookmarkEditTabWrapper
      bookmarkId={bookmarkId}
      title={t("Properties")}
      description={t("Custom property values for this bookmark.")}
    >
      {bookmark => <BookmarkPropertiesForm bookmark={bookmark} />}
    </BookmarkEditTabWrapper>
  );
}
