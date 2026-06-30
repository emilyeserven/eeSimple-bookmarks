import type { Meta, StoryObj } from "@storybook/react-vite";

import { AddImportModal } from "./AddImportModal";
import { useUiStore } from "../stores/uiStore";
import { apiHandlers } from "../test-utils/story-mocks";

// The modal's open state is read from the UI store; force it open for the story.
useUiStore.setState({
  addImportModalOpen: true,
});

const meta = {
  title: "Components/AddImportModal",
  component: AddImportModal,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof AddImportModal>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The global "Add import" dialog wrapping the import form, opened. */
export const Default: Story = {};
