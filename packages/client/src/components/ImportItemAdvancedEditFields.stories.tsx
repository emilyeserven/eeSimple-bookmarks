import type { InboxItem } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { ImportItemAdvancedEditFields } from "./ImportItemAdvancedEditFields";
import { useImportItemAdvancedEdit } from "./useImportItemAdvancedEdit";
import { apiHandlers } from "../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

const item: InboxItem = {
  id: "inbox-1",
  importId: "import-1",
  url: "https://example.com/great-read",
  rawUrl: "https://example.com/great-read",
  title: "A Great Read",
  description: "Worth saving for later.",
  imageUrl: null,
  newsletterContext: null,
  anchorText: "A Great Read",
  categoryId: null,
  status: "pending",
  markedForDeletion: false,
  duplicateBookmarkId: null,
  createdBookmarkId: null,
  errorReason: null,
  createdAt: NOW,
  importSource: "url",
  sourceLabel: "Morning Brew #482",
};

/** Builds the real hook state so the field rows render with their wired comboboxes. */
function Host() {
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [mediaTypeId, setMediaTypeId] = useState<string | undefined>(undefined);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [locationIds, setLocationIds] = useState<string[]>([]);
  const [personIds, setPersonIds] = useState<string[]>([]);
  const [groupId, setGroupId] = useState<string | undefined>(undefined);

  const state = useImportItemAdvancedEdit({
    item,
    tagIds,
    locationIds,
    onTagsChange: setTagIds,
    onLocationsChange: setLocationIds,
    onCategoryChange: setCategoryId,
    onMediaTypeChange: setMediaTypeId,
    onGroupChange: setGroupId,
  });

  return (
    <div className="max-w-md space-y-3">
      <ImportItemAdvancedEditFields
        state={state}
        categoryId={categoryId}
        mediaTypeId={mediaTypeId}
        tagIds={tagIds}
        locationIds={locationIds}
        personIds={personIds}
        groupId={groupId}
        onCategoryChange={setCategoryId}
        onMediaTypeChange={setMediaTypeId}
        onPeopleChange={setPersonIds}
        onGroupChange={setGroupId}
      />
    </div>
  );
}

const meta = {
  title: "Components/ImportItemAdvancedEditFields",
  component: ImportItemAdvancedEditFields,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof ImportItemAdvancedEditFields>;

export default meta;

/** The taxonomy field rows: category, media type, tags, locations, people, group. */
export const Default: StoryObj = {
  render: () => <Host />,
};
