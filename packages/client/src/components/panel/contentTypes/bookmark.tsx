/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";

import { useMemo } from "react";

import { Bookmark } from "lucide-react";

import { usePanelControls, usePanelDismissAfterDelete } from "./panelHelpers";
import { WithPanelItem } from "./status";
import { useBookmarks, useDeleteBookmark, useUpdateBookmark } from "../../../hooks/useBookmarks";
import { useCategories } from "../../../hooks/useCategories";
import { useCustomProperties } from "../../../hooks/useCustomProperties";
import { usePropertyGroups } from "../../../hooks/usePropertyGroups";
import { mergeBooleanValue } from "../../../lib/bookmarkFormat";
import { BookmarkDetail } from "../../BookmarkDetail";
import { BookmarkGeneralForm } from "../../BookmarkGeneralForm";
import { BookmarkImageEditForm } from "../../BookmarkImageEditForm";
import { BookmarkPropertiesForm } from "../../BookmarkPropertiesForm";
import { BookmarkRelationshipsEditor } from "../../BookmarkRelationshipsEditor";
import { LabeledSection } from "../../LabeledSection";
import { PanelEntityEditor } from "../PanelEntityEditor";

import { Separator } from "@/components/ui/separator";

function useBookmarkList() {
  const {
    data, isLoading, error,
  } = useBookmarks();
  const items = useMemo<PanelListItem[]>(
    () => (data ?? []).map(bookmark => ({
      id: bookmark.id,
      label: bookmark.title,
      sublabel: bookmark.url,
    })),
    [data],
  );
  return {
    items,
    isLoading,
    error,
  };
}

/** Read-only bookmark, reusing the same `BookmarkDetail` the full detail page renders. */
function BookmarkView({
  id,
}: {
  id: string;
}) {
  const bookmarksQuery = useBookmarks();
  const {
    data: properties,
  } = useCustomProperties();
  const {
    data: propertyGroups,
  } = usePropertyGroups();
  const {
    data: categories,
  } = useCategories();
  const {
    openItem,
  } = usePanelControls();
  const dismiss = usePanelDismissAfterDelete();
  const deleteBookmark = useDeleteBookmark();
  const updateBookmark = useUpdateBookmark();

  return (
    <WithPanelItem
      queryResult={bookmarksQuery}
      id={id}
      notFoundMessage="Bookmark not found."
    >
      {bookmark => (
        <BookmarkDetail
          bookmark={bookmark}
          categories={categories ?? []}
          properties={properties ?? []}
          propertyGroups={propertyGroups ?? []}
          onEdit={() => openItem("bookmark", id, "edit")}
          onDelete={() => deleteBookmark.mutate(id, {
            onSuccess: dismiss,
          })}
          onSaveBoolean={(propertyId, value) => updateBookmark.mutate({
            id: bookmark.id,
            input: {
              booleanValues: mergeBooleanValue(bookmark.booleanValues, propertyId, value),
            },
          })}
        />
      )}
    </WithPanelItem>
  );
}

/**
 * Edit a bookmark by reusing the **same** per-tab edit forms the main-app edit tabs render
 * (`BookmarkGeneralForm` / `BookmarkPropertiesForm` / `BookmarkImageEditForm` /
 * `BookmarkRelationshipsEditor`), stacked since the panel is a single column — not the `BookmarkForm`
 * create form (that stays for create flows). Each section saves independently, like its tab.
 */
function BookmarkEdit({
  id,
}: {
  id: string;
}) {
  const bookmarksQuery = useBookmarks();
  const {
    openItem,
  } = usePanelControls();
  const deleteBookmark = useDeleteBookmark();
  const dismiss = usePanelDismissAfterDelete();

  return (
    <WithPanelItem
      queryResult={bookmarksQuery}
      id={id}
      notFoundMessage="Bookmark not found."
    >
      {bookmark => (
        <PanelEntityEditor
          name={bookmark.title}
          onDelete={() => deleteBookmark.mutate(id, {
            onSuccess: dismiss,
          })}
          deleteIsPending={deleteBookmark.isPending}
          deleteError={deleteBookmark.isError ? deleteBookmark.error.message : null}
        >
          <div className="space-y-6">
            <LabeledSection
              title="General"
              description="URL, name, description, category, and tags."
            >
              <BookmarkGeneralForm bookmark={bookmark} />
            </LabeledSection>
            <Separator />
            <LabeledSection
              title="Properties"
              description="Custom property values for this bookmark."
            >
              <BookmarkPropertiesForm bookmark={bookmark} />
            </LabeledSection>
            <Separator />
            <LabeledSection
              title="Image"
              description="Manage the bookmark's thumbnail image."
            >
              <BookmarkImageEditForm bookmark={bookmark} />
            </LabeledSection>
            <Separator />
            <LabeledSection
              title="Relationships"
              description="Link this bookmark to related bookmarks."
            >
              <BookmarkRelationshipsEditor
                bookmarkId={bookmark.id}
                initialRelationships={bookmark.relationships}
                onDone={() => openItem("bookmark", id, "view")}
              />
            </LabeledSection>
          </div>
        </PanelEntityEditor>
      )}
    </WithPanelItem>
  );
}

export const bookmarkContentType: PanelContentTypeDef = {
  type: "bookmark",
  label: "Bookmarks",
  singular: "Bookmark",
  icon: Bookmark,
  useList: useBookmarkList,
  View: BookmarkView,
  Edit: BookmarkEdit,
};
