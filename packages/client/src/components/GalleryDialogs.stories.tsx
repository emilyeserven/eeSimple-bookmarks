import type { Meta, StoryObj } from "@storybook/react-vite";

import { GalleryDialogs } from "./GalleryDialogs";
import { sampleBookmark } from "../test-utils/story-mocks";

const meta = {
  title: "Components/GalleryDialogs",
  component: GalleryDialogs,
  args: {
    pendingLabel: null,
    onCancelDelete: () => {},
    onConfirmDelete: () => {},
    deletePending: false,
    attachOpen: false,
    bookmarks: [sampleBookmark],
    attachTarget: null,
    onCancelAttach: () => {},
    onSelectTarget: () => {},
    attachTargetHasImage: false,
    onConfirmAttach: () => {},
    attachPending: false,
  },
} satisfies Meta<typeof GalleryDialogs>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Both dialogs closed (the toolbar/grid is what's visible in this state). */
export const Closed: Story = {};

/** The delete-confirmation dialog open for a single orphan. */
export const DeleteConfirm: Story = {
  args: {
    pendingLabel: "bookmarks/orphan-42.webp",
  },
};

/** The attach dialog open with a bookmark picker. */
export const Attach: Story = {
  args: {
    attachOpen: true,
  },
};

/** The attach dialog with a target that already has an image (replace warning). */
export const AttachReplaceWarning: Story = {
  args: {
    attachOpen: true,
    attachTarget: sampleBookmark,
    attachTargetHasImage: true,
  },
};
