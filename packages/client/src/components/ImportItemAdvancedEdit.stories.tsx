import type { InboxItem } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { ImportItemAdvancedEdit } from "./ImportItemAdvancedEdit";
import { apiHandlers } from "../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

const item: InboxItem = {
  id: "inbox-1",
  importId: "import-1",
  url: "https://example.com/great-read",
  rawUrl: "https://example.com/great-read?utm_source=newsletter",
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

/** Drives the controlled open/value state so the collapsible can be opened in the story. */
function Host({
  defaultOpen = false,
}: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [mediaTypeId, setMediaTypeId] = useState<string | undefined>(undefined);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [locationIds, setLocationIds] = useState<string[]>([]);
  const [personIds, setPersonIds] = useState<string[]>([]);
  const [publisherId, setPublisherId] = useState<string | undefined>(undefined);

  return (
    <ImportItemAdvancedEdit
      item={item}
      open={open}
      onOpenChange={setOpen}
      categoryId={categoryId}
      mediaTypeId={mediaTypeId}
      tagIds={tagIds}
      locationIds={locationIds}
      personIds={personIds}
      publisherId={publisherId}
      onCategoryChange={setCategoryId}
      onMediaTypeChange={setMediaTypeId}
      onTagsChange={setTagIds}
      onLocationsChange={setLocationIds}
      onPeopleChange={setPersonIds}
      onPublisherChange={setPublisherId}
    />
  );
}

const meta = {
  title: "Components/ImportItemAdvancedEdit",
  component: ImportItemAdvancedEdit,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof ImportItemAdvancedEdit>;

export default meta;

/** The collapsed "Advanced" trigger. */
export const Collapsed: StoryObj = {
  render: () => <Host />,
};

/** The expanded taxonomy fields for a pending inbox item. */
export const Expanded: StoryObj = {
  render: () => <Host defaultOpen />,
};
