import type { Meta, StoryObj } from "@storybook/react-vite";

import { AddBookmarkCollapsible } from "./AddBookmarkCollapsible";
import { useUiStore } from "../stores/uiStore";
import { apiHandlers } from "../test-utils/story-mocks";

// The collapsible's open state is read from the UI store; force it open for the stories.
useUiStore.setState({
  addBookmarkFormOpen: true,
});

const meta = {
  title: "Components/AddBookmarkCollapsible",
  component: AddBookmarkCollapsible,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof AddBookmarkCollapsible>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The expanded "Add Bookmark" card with the full form inside. */
export const Default: Story = {};

/** Locked to a single category — the form hides its Category picker. */
export const LockedCategory: Story = {
  args: {
    lockedCategoryId: "cat-workflow",
  },
};
