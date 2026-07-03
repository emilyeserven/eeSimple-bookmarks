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

/** Builds the real hook state so the still-manual Tag/Person modals render controllably. */
function Host({
  personOpen = false,
}: {
  personOpen?: boolean;
}) {
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [locationIds, setLocationIds] = useState<string[]>([]);
  const [personIds, setPersonIds] = useState<string[]>([]);

  const state = useImportItemAdvancedEdit({
    item,
    tagIds,
    locationIds,
    onTagsChange: setTagIds,
    onLocationsChange: setLocationIds,
    onCategoryChange: () => {},
    onMediaTypeChange: () => {},
    onGroupChange: () => {},
  });

  const {
    setAddPersonOpen,
  } = state.addModalState;
  useEffect(() => {
    if (personOpen) setAddPersonOpen(true);
  }, [personOpen, setAddPersonOpen]);

  return (
    <ImportItemAdvancedEditModals
      state={state}
      tagIds={tagIds}
      personIds={personIds}
      onTagsChange={setTagIds}
      onPeopleChange={setPersonIds}
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

/** The still-manual "Create person" modal opened. */
export const AddPersonOpen: Story = {
  render: () => <Host personOpen />,
};
