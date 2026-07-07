import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useBookmark } from "../hooks/useBookmarks";
import i18n from "../i18n";

export const Route = createFileRoute("/bookmarks/$bookmarkId/edit")({
  component: BookmarkEditLayout,
});

const editNav = [
  {
    to: "/bookmarks/$bookmarkId/edit/general",
    label: i18n.t("General"),
  },
  {
    to: "/bookmarks/$bookmarkId/edit/related",
    label: i18n.t("Related"),
  },
  {
    to: "/bookmarks/$bookmarkId/edit/properties",
    label: i18n.t("Properties"),
  },
  {
    to: "/bookmarks/$bookmarkId/edit/languages",
    label: i18n.t("Languages"),
  },
  {
    to: "/bookmarks/$bookmarkId/edit/image",
    label: i18n.t("Image"),
  },
  {
    to: "/bookmarks/$bookmarkId/edit/video",
    label: i18n.t("Video"),
  },
] as const;

function BookmarkEditLayout() {
  const {
    t,
  } = useTranslation();
  const {
    bookmarkId,
  } = Route.useParams();
  const {
    data: bookmark, isLoading,
  } = useBookmark(bookmarkId);

  return (
    <TabbedEntityLayout
      header={(
        <h1 className="text-2xl font-bold">
          {isLoading ? t("Edit bookmark") : (bookmark?.title ?? t("Bookmark not found"))}
        </h1>
      )}
      nav={editNav}
      params={{
        bookmarkId,
      }}
      navAriaLabel={t("Bookmark edit sections")}
    />
  );
}
