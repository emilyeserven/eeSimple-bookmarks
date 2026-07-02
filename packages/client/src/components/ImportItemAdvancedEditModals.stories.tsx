import type { InboxItem } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { useEffect, useState } from "react";

import { ImportItemAdvancedEditModals } from "./ImportItemAdvancedEditModals";
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

/** Builds the real hook state so the still-manual Tag/Author modals render controllably. */
function Host({
  authorOpen = false,
}: {
  authorOpen?: boolean;
}) {
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [locationIds, setLocationIds] = useState<string[]>([]);
  const [authorIds, setAuthorIds] = useState<string[]>([]);

  const state = useImportItemAdvancedEdit({
    item,
    tagIds,
    locationIds,
    onTagsChange: setTagIds,
    onLocationsChange: setLocationIds,
    onCategoryChange: () => {},
    onMediaTypeChange: () => {},
    onPublisherChange: () => {},
  });

  const {
    setAddAuthorOpen,
  } = state.addModalState;
  useEffect(() => {
    if (authorOpen) setAddAuthorOpen(true);
  }, [authorOpen, setAddAuthorOpen]);

  return (
    <ImportItemAdvancedEditModals
      state={state}
      tagIds={tagIds}
      authorIds={authorIds}
      onTagsChange={setTagIds}
      onAuthorsChange={setAuthorIds}
    />
  );
}

const meta = {
  title: "Components/ImportItemAdvancedEditModals",
  component: ImportItemAdvancedEditModals,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof ImportItemAdvancedEditModals>;

export default meta;

type Story = StoryObj;

/** All inline-create modals closed (nothing visible). */
export const AllClosed: Story = {
  render: () => <Host />,
};

/** The still-manual "Create author" modal opened. */
export const AddAuthorOpen: Story = {
  render: () => <Host authorOpen />,
};
